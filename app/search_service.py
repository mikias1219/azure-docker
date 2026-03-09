"""
Azure AI Search integration for knowledge mining and RAG.
Uses AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_KEY, and optional index names.
"""

import os
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_search_client = None
_index_client = None


def _get_index_client():
    global _index_client
    if _index_client is not None:
        return _index_client
    endpoint = (os.getenv("AZURE_SEARCH_ENDPOINT") or "").rstrip("/")
    key = os.getenv("AZURE_SEARCH_KEY") or ""
    if not endpoint or not key:
        return None
    try:
        from azure.core.credentials import AzureKeyCredential
        from azure.search.documents.indexes import SearchIndexClient
        _index_client = SearchIndexClient(
            endpoint=endpoint,
            credential=AzureKeyCredential(key),
        )
    except Exception as e:
        logger.warning("Azure Search index client init failed: %s", e)
        _index_client = None
    return _index_client


def get_search_client(index_name: str):
    """Return a SearchClient for the given index, or None if not configured."""
    endpoint = (os.getenv("AZURE_SEARCH_ENDPOINT") or "").rstrip("/")
    key = os.getenv("AZURE_SEARCH_KEY") or ""
    if not endpoint or not key or not index_name:
        return None
    try:
        from azure.core.credentials import AzureKeyCredential
        from azure.search.documents import SearchClient
        return SearchClient(
            endpoint=endpoint,
            index_name=index_name,
            credential=AzureKeyCredential(key),
        )
    except Exception as e:
        logger.warning("Azure Search client init failed: %s", e)
        return None


def is_configured() -> bool:
    return bool(
        (os.getenv("AZURE_SEARCH_ENDPOINT") or "").strip()
        and (os.getenv("AZURE_SEARCH_KEY") or "").strip()
    )


def keyword_search(
    index_name: str,
    search_text: str,
    select: Optional[List[str]] = None,
    top: int = 10,
) -> Dict[str, Any]:
    """Run a keyword search. Returns {"results": [...], "count": n, "error": optional}."""
    client = get_search_client(index_name)
    if not client:
        return {"results": [], "count": 0, "error": "Azure AI Search not configured"}
    select = select or ["metadata_storage_name", "content", "file_name"]
    try:
        results = list(
            client.search(
                search_text=search_text,
                select=select,
                top=top,
            )
        )
        return {"results": results, "count": len(results)}
    except Exception as e:
        # If index is missing, try to create the RAG index automatically (idempotent)
        msg = str(e)
        try:
            from azure.core.exceptions import ResourceNotFoundError  # type: ignore
        except Exception:
            ResourceNotFoundError = ()  # type: ignore

        is_missing = ("was not found" in msg.lower() and "index" in msg.lower()) or isinstance(e, ResourceNotFoundError)
        if is_missing:
            try:
                from app import rag_service
                if rag_service and hasattr(rag_service, "ensure_rag_index") and index_name == getattr(rag_service, "RAG_INDEX_NAME", "rag-content-index"):
                    if rag_service.ensure_rag_index():
                        # Index creation can be eventually consistent; retry a few times with short backoff
                        import time
                        last_err: Optional[Exception] = None
                        for delay in (0.5, 1.0, 2.0):
                            time.sleep(delay)
                            try:
                                results = list(
                                    client.search(
                                        search_text=search_text,
                                        select=select,
                                        top=top,
                                    )
                                )
                                return {"results": results, "count": len(results)}
                            except Exception as e2:
                                last_err = e2
                                continue
            except Exception:
                pass

        logger.exception("Search failed: %s", e)
        return {"results": [], "count": 0, "error": msg}


def get_rag_index_name() -> str:
    return os.getenv("AZURE_SEARCH_RAG_INDEX_NAME", "rag-content-index")
