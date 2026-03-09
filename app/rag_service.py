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
        logger.exception("RAG ingest upload failed: %s", e)
        return {"indexed": 0, "error": str(e)}


def rag_retrieve(
    question: str,
    top_k: int = 3,
) -> Dict[str, Any]:
    """Vector + keyword search. Returns {"context": str, "sources": [...], "error": optional}."""
    from app.search_service import get_search_client
    deployment = get_embedding_deployment()
    search_client = get_search_client(RAG_INDEX_NAME)
    openai_client = get_openai_embedding_client()
    if not search_client:
        return {"context": "", "sources": [], "error": "Azure AI Search not configured"}
    if not deployment or not openai_client:
        return {"context": "", "sources": [], "error": "Embedding deployment not configured"}
    vec = embed_text(openai_client, deployment, question)
    if not vec:
        return {"context": "", "sources": [], "error": "Failed to embed question"}
    try:
        from azure.search.documents.models import VectorizedQuery
        vector_query = VectorizedQuery(vector=vec, k_nearest_neighbors=top_k, fields="content_vector")
        results = list(
            search_client.search(
                search_text=question,
                vector_queries=[vector_query],
                select=["content", "file_name", "summary"],
                top=top_k,
            )
        )
        context_parts = []
        sources = []
        for r in results:
            fn = r.get("file_name", "Unknown")
            content = r.get("content", "")
            if content:
                context_parts.append(f"[Source: {fn}]\n{content}")
                sources.append({"file_name": fn, "content_preview": content[:200] + "..." if len(content) > 200 else content})
        return {"context": "\n\n---\n\n".join(context_parts), "sources": sources}
    except Exception as e:
        logger.exception("RAG retrieve failed: %s", e)
        return {"context": "", "sources": [], "error": str(e)}


def rag_answer(question: str, context: str, openai_chat_client, chat_deployment: str) -> Optional[str]:
    """Generate answer using chat model with retrieved context."""
    if not openai_chat_client or not chat_deployment:
        return None
    if not context:
        system = "You are a helpful assistant. No relevant documents were found. Say so politely."
    else:
        system = (
            "You are a helpful assistant. Answer only from the context below. "
            "Cite source file names when possible. If the context doesn't contain enough information, say so.\n\n"
            f"Context:\n{context}"
        )
    try:
        resp = openai_chat_client.chat.completions.create(
            model=chat_deployment,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": question},
            ],
            temperature=0.3,
            max_tokens=800,
        )
        if resp.choices and resp.choices[0].message:
            return resp.choices[0].message.content
    except Exception as e:
        logger.warning("RAG answer failed: %s", e)
    return None
