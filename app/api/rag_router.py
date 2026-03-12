import os
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app import crud, models
from app.services_loader import document_intelligence, rag_service

router = APIRouter(prefix="/api/rag", tags=["rag"])
logger = logging.getLogger(__name__)


@router.post("/ensure-index", response_model=dict)
async def rag_ensure_index(
    current_user: models.User = Depends(get_current_user),
):
    if not rag_service or not hasattr(rag_service, "ensure_rag_index"):
        return {"ok": False, "error": "RAG service not available"}
    ok = rag_service.ensure_rag_index()
    return {"ok": ok, "index": rag_service.RAG_INDEX_NAME}


@router.post("/ingest", response_model=dict)
async def rag_ingest(
    document_id: Optional[int] = Query(None, alias="document_id"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not rag_service:
        return {"indexed": 0, "error": "RAG service not available"}
    if document_id is not None:
        document = await crud.get_document(db, document_id)
        if not document or document.owner_id != current_user.id:
            raise HTTPException(status_code=404, detail="Document not found")
        text = (document.extracted_text or "").strip()
        if not text:
            return {
                "indexed": 0,
                "error": "Document has no extracted text yet. Wait for processing or re-upload.",
            }
        openai_client = (
            document_intelligence.openai_client if document_intelligence else None
        )
        deployment = rag_service.get_embedding_deployment()
        if not deployment or not openai_client:
            return {
                "indexed": 0,
                "error": "OpenAI embedding deployment not configured (AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME)",
            }
        result = rag_service.ingest_document(
            document.original_filename or f"doc-{document_id}",
            text,
            document_intelligence=document_intelligence,
            openai_client=openai_client,
        )
        return result
    return {"indexed": 0, "error": "Provide document_id to ingest."}


@router.post("/ask", response_model=dict)
async def rag_ask(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    if not rag_service:
        return {"answer": "", "sources": [], "error": "RAG service not available"}
    question = (body.get("question") or body.get("query") or "").strip()
    if not question:
        return {"answer": "", "sources": [], "error": "question is required"}
    retrieved = rag_service.rag_retrieve(question, top_k=5)
    if retrieved.get("error"):
        return {"answer": "", "sources": [], "error": retrieved["error"]}
    openai_client = (
        document_intelligence.openai_client if document_intelligence else None
    )
    deployment = (
        getattr(document_intelligence, "openai_deployment", None)
        if document_intelligence
        else os.getenv("OPENAI_DEPLOYMENT_NAME")
    )
    if not openai_client or not deployment:
        return {
            "answer": "",
            "sources": [],
            "error": "OpenAI chat not configured",
        }
    result = rag_service.rag_answer(
        question, retrieved["context"], openai_client, deployment
    )
    return {
        "answer": result.get("answer", ""),
        "sources": retrieved.get("sources", []),
        "reasoning": result.get("reasoning"),
        "debug": result.get("debug"),
    }
