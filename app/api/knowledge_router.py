import os
import logging

from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app import models
from app.services_loader import search_service

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])
logger = logging.getLogger(__name__)


@router.get("/search", response_model=dict)
async def knowledge_search_get(
    q: str = "",
    index: str = "",
    current_user: models.User = Depends(get_current_user),
):
    if not search_service or not getattr(search_service, "is_configured", lambda: False)():
        return {"results": [], "count": 0, "error": "Azure AI Search not configured"}
    index_name = index or os.getenv("AZURE_SEARCH_INDEX_NAME", "rag-content-index")
    if not q or not q.strip():
        return {"results": [], "count": 0}
    return search_service.keyword_search(
        index_name, q.strip(), select=["file_name", "content", "summary"], top=15
    )


@router.post("/search", response_model=dict)
async def knowledge_search_post(
    body: dict = None,
    current_user: models.User = Depends(get_current_user),
):
    if not search_service or not getattr(search_service, "is_configured", lambda: False)():
        return {"results": [], "count": 0, "error": "Azure AI Search not configured"}
    body = body or {}
    query = (body.get("query") or body.get("q") or "").strip()
    index_name = (
        body.get("index") or os.getenv("AZURE_SEARCH_INDEX_NAME", "rag-content-index")
    ).strip()
    if not query:
        return {"results": [], "count": 0}
    return search_service.keyword_search(
        index_name, query, select=["file_name", "content", "summary"], top=15
    )
