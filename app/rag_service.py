"""
RAG pipeline: extract text (Document Intelligence), chunk, embed (OpenAI), index (Azure AI Search).
Query: embed question, vector + keyword search, then answer with OpenAI chat.
"""

import hashlib
import logging
import os
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

RAG_INDEX_NAME = "rag-content-index"
CHUNK_MAX_CHARS = 2000


def _chunk_text(text: str, max_chars: int = CHUNK_MAX_CHARS) -> List[str]:
    """Split text into chunks at paragraph boundaries."""
    if not (text or "").strip():
        return []
    paragraphs = re.split(r"\n\s*\n", text.strip())
    chunks, current = [], ""
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(current) + len(para) + 2 > max_chars and current:
            chunks.append(current.strip())
            current = para
        else:
            current = (current + "\n\n" + para) if current else para
    if current.strip():
        chunks.append(current.strip())
    return chunks if chunks else [text[:max_chars]]


def _make_doc_id(file_name: str, chunk_index: int) -> str:
    raw = f"{file_name}::{chunk_index}"
    return hashlib.md5(raw.encode()).hexdigest()


def ensure_rag_index():
    """Create RAG index with vector field if it does not exist."""
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents.indexes import SearchIndexClient
    from azure.search.documents.indexes.models import (
        HnswAlgorithmConfiguration,
        SearchField,
        SearchFieldDataType,
        SearchableField,
        SearchIndex,
        SimpleField,
        VectorSearch,
        VectorSearchProfile,
    )
    endpoint = (os.getenv("AZURE_SEARCH_ENDPOINT") or "").rstrip("/")
    key = os.getenv("AZURE_SEARCH_KEY") or ""
    if not endpoint or not key:
        return False
    try:
        index_client = SearchIndexClient(
            endpoint=endpoint,
            credential=AzureKeyCredential(key),
        )
        fields = [
            SimpleField(name="id", type=SearchFieldDataType.String, key=True, filterable=True),
            SearchableField(name="content", type=SearchFieldDataType.String),
            SimpleField(name="file_name", type=SearchFieldDataType.String, filterable=True),
            SearchableField(name="summary", type=SearchFieldDataType.String),
            SearchableField(name="key_topics", type=SearchFieldDataType.String),
            SearchField(
                name="content_vector",
                type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                searchable=True,
                vector_search_dimensions=1536,
                vector_search_profile_name="vector-profile",
            ),
        ]
        vector_search = VectorSearch(
            algorithms=[HnswAlgorithmConfiguration(name="hnsw-algorithm")],
            profiles=[
                VectorSearchProfile(
                    name="vector-profile",
                    algorithm_configuration_name="hnsw-algorithm",
                )
            ],
        )
        index = SearchIndex(name=RAG_INDEX_NAME, fields=fields, vector_search=vector_search)
        index_client.create_or_update_index(index)
        logger.info("RAG index %s ready", RAG_INDEX_NAME)
        return True
    except Exception as e:
        logger.warning("Could not ensure RAG index: %s", e)
        return False


def get_embedding_deployment() -> Optional[str]:
    return (os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME") or os.getenv("OPENAI_EMBEDDING_DEPLOYMENT_NAME") or "").strip() or None


def get_openai_embedding_client():
    """OpenAI client for embeddings (same endpoint as chat)."""
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = (os.getenv("OPENAI_API_BASE") or "").rstrip("/")
    if not api_key or not api_base:
        return None
    try:
        from openai import AzureOpenAI
        return AzureOpenAI(
            api_key=api_key,
            azure_endpoint=api_base,
            api_version=os.getenv("OPENAI_API_VERSION", "2024-02-15-preview"),
        )
    except Exception as e:
        logger.warning("OpenAI embedding client init failed: %s", e)
        return None


def embed_text(client, deployment: str, text: str) -> Optional[List[float]]:
    """Return embedding vector for text. Uses text-embedding-ada-002 dimensions (1536)."""
    if not client or not deployment or not text:
        return None
    try:
        resp = client.embeddings.create(input=text[:8000], model=deployment)
        if resp.data and len(resp.data) > 0:
            return resp.data[0].embedding
    except Exception as e:
        logger.warning("Embedding failed: %s", e)
    return None


def ingest_document(
    file_name: str,
    extracted_text: str,
    document_intelligence=None,
    openai_client=None,
) -> Dict[str, Any]:
    """
    Chunk text, generate embeddings, upload to Azure AI Search.
    extracted_text comes from Document Intelligence (caller provides it).
    Returns {"indexed": n, "error": optional}.
    """
    from app.search_service import get_search_client
    deployment = get_embedding_deployment()
    search_client = get_search_client(RAG_INDEX_NAME)
    if not search_client:
        return {"indexed": 0, "error": "Azure AI Search not configured"}
    if not deployment or not openai_client:
        return {"indexed": 0, "error": "OpenAI embedding deployment not configured (AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME)"}
    chunks = _chunk_text(extracted_text)
    if not chunks:
        return {"indexed": 0, "error": "No text to chunk"}
    docs = []
    for j, chunk in enumerate(chunks):
        vec = embed_text(openai_client, deployment, chunk)
        if vec is None:
            continue
        docs.append({
            "id": _make_doc_id(file_name, j),
            "content": chunk,
            "file_name": file_name,
            "summary": "",
            "key_topics": "",
            "content_vector": vec,
        })
    if not docs:
        return {"indexed": 0, "error": "Embedding failed for all chunks"}
    try:
        result = search_client.upload_documents(documents=docs)
        succeeded = sum(1 for r in result if r.succeeded)
        return {"indexed": succeeded, "chunks": len(docs)}
    except Exception as e:
        # Auto-create index if missing, then retry once
        msg = str(e)
        missing = "index" in msg.lower() and "was not found" in msg.lower()
        try:
            from azure.core.exceptions import ResourceNotFoundError  # type: ignore
            missing = missing or isinstance(e, ResourceNotFoundError)
        except Exception:
            pass
        if missing and ensure_rag_index():
            # Index creation can be eventually consistent; retry a few times with short backoff
            import time
            last_err: Optional[Exception] = None
            for delay in (0.5, 1.0, 2.0):
                time.sleep(delay)
                try:
                    result = search_client.upload_documents(documents=docs)
                    succeeded = sum(1 for r in result if r.succeeded)
                    return {"indexed": succeeded, "chunks": len(docs)}
                except Exception as e2:
                    last_err = e2
                    continue
            logger.exception("RAG ingest retry failed: %s", last_err)
            return {"indexed": 0, "error": str(last_err) if last_err else "Upload failed after ensuring index"}
        logger.exception("RAG ingest upload failed: %s", e)
        return {"indexed": 0, "error": msg}


def rag_retrieve(
    question: str,
    top_k: int = 3,
) -> Dict[str, Any]:
    """Vector + keyword search. Returns {"context": str, "sources": [...], "debug": {...}}."""
    from app.search_service import get_search_client
    deployment = get_embedding_deployment()
    search_client = get_search_client(RAG_INDEX_NAME)
    openai_client = get_openai_embedding_client()
    if not search_client:
        return {"context": "", "sources": [], "error": "Azure AI Search not configured"}
    if not deployment or not openai_client:
        return {"context": "", "sources": [], "error": "Embedding deployment not configured"}
    
    start_time = datetime.now()
    vec = embed_text(openai_client, deployment, question)
    if not vec:
        return {"context": "", "sources": [], "error": "Failed to embed question"}
    
    def _search_once():
        from azure.search.documents.models import VectorizedQuery
        vector_query = VectorizedQuery(vector=vec, k_nearest_neighbors=top_k, fields="content_vector")
        return list(
            search_client.search(
                search_text=question,
                vector_queries=[vector_query],
                select=["content", "file_name", "summary"],
                top=top_k,
                include_total_count=True
            )
        )

    try:
        results = _search_once()
        end_time = datetime.now()
        
        context_parts = []
        sources = []
        for r in results:
            fn = r.get("file_name", "Unknown")
            content = r.get("content", "")
            score = r.get("@search.score", 0)
            if content:
                context_parts.append(f"[Source: {fn}]\n{content}")
                sources.append({
                    "file_name": fn, 
                    "content_preview": content[:200] + "..." if len(content) > 200 else content,
                    "score": score
                })
        
        return {
            "context": "\n\n---\n\n".join(context_parts), 
            "sources": sources,
            "debug": {
                "engine": "Azure AI Search (Hybrid)",
                "latency_sec": (end_time - start_time).total_seconds(),
                "top_k": top_k,
                "embedding_model": deployment
            },
            "reasoning": f"Performed Hybrid search (Vector + Keyword) on index '{RAG_INDEX_NAME}'. Retrieved {len(sources)} relevant chunks based on semantic similarity."
        }
    except Exception as e:
        # If index missing, create it and retry once (avoids manual ensure-index)
        msg = str(e)
        missing = "index" in msg.lower() and "was not found" in msg.lower()
        try:
            from azure.core.exceptions import ResourceNotFoundError  # type: ignore
            missing = missing or isinstance(e, ResourceNotFoundError)
        except Exception:
            pass
        if missing and ensure_rag_index():
            # Index creation can be eventually consistent; retry a few times with short backoff
            import time
            last_err: Optional[Exception] = None
            for delay in (0.5, 1.0, 2.0):
                time.sleep(delay)
                try:
                    results = _search_once()
                    end_time = datetime.now() # Added missing end_time for retry block
                    context_parts = []
                    sources = []
                    for r in results:
                        fn = r.get("file_name", "Unknown")
                        content = r.get("content", "")
                        score = r.get("@search.score", 0) # Added missing score for retry block
                        if content:
                            context_parts.append(f"[Source: {fn}]\n{content}")
                            sources.append({
                                "file_name": fn, 
                                "content_preview": content[:200] + "..." if len(content) > 200 else content,
                                "score": score # Added missing score for retry block
                            })
                    return {
                        "context": "\n\n---\n\n".join(context_parts), 
                        "sources": sources,
                        "debug": { # Added missing debug for retry block
                            "engine": "Azure AI Search (Hybrid)",
                            "latency_sec": (end_time - start_time).total_seconds(),
                            "top_k": top_k,
                            "embedding_model": deployment
                        },
                        "reasoning": f"Performed Hybrid search (Vector + Keyword) on index '{RAG_INDEX_NAME}'. Retrieved {len(sources)} relevant chunks based on semantic similarity." # Added missing reasoning for retry block
                    }
                except Exception as e2:
                    last_err = e2
                    continue
            logger.exception("RAG retrieve retry failed: %s", last_err)
            return {"context": "", "sources": [], "error": str(last_err) if last_err else "Search failed after ensuring index"}
        logger.exception("RAG retrieve failed: %s", e)
        return {"context": "", "sources": [], "error": str(e)}


def rag_answer(question: str, context: str, openai_chat_client, chat_deployment: str) -> Dict[str, Any]:
    """Generate answer using chat model with retrieved context. Returns {"answer": str, "reasoning": str, "debug": {...}}."""
    if not openai_chat_client or not chat_deployment:
        return {"answer": "OpenAI not configured", "error": True}
    
    if not context:
        system = "You are a helpful assistant. No relevant documents were found. Say so politely."
    else:
        system = (
            "You are a helpful assistant. Answer only from the context below. "
            "Cite source file names when possible. If the context doesn't contain enough information, say so.\n\n"
            "Analyze the document context and provide a JSON response with:\n"
            "1. 'answer': The clear answer to the user.\n"
            "2. 'reasoning': A technical explanation of how the answer was synthesized from the context (e.g. 'Found specific reference to X in file Y').\n\n"
            f"Context:\n{context}"
        )
    
    try:
        start_time = datetime.now()
        import json
        resp = openai_chat_client.chat.completions.create(
            model=chat_deployment,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": question},
            ],
            temperature=0.3,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        end_time = datetime.now()
        
        data = json.loads(resp.choices[0].message.content)
        return {
            "answer": data.get("answer"),
            "reasoning": data.get("reasoning"),
            "debug": {
                "model": chat_deployment,
                "latency_ms": int((end_time - start_time).total_seconds() * 1000),
                "tokens": resp.usage.total_tokens if hasattr(resp, 'usage') else 0
            }
        }
    except Exception as e:
        logger.warning("RAG answer failed: %s", e)
        return {"answer": f"Error synthesizing answer: {str(e)}", "error": True}
