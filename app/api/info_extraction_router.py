import tempfile
import asyncio
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.core.security import get_current_user
from app import models
from app.services_loader import document_intelligence

router = APIRouter(tags=["info-extraction"])
logger = logging.getLogger(__name__)


@router.post("/api/document-intelligence/analyze-invoice", response_model=dict)
async def analyze_invoice(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    if not document_intelligence or not getattr(document_intelligence, "client", None):
        raise HTTPException(
            status_code=503, detail="Document Intelligence not configured"
        )
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        try:
            result = await asyncio.to_thread(
                document_intelligence.analyze_invoice,
                tmp_path,
            )
            return result
        finally:
            import os
            os.unlink(tmp_path)
    except Exception as e:
        logger.exception("Invoice analysis failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/info-extraction/analyze", response_model=dict)
async def info_extraction_analyze(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    if not document_intelligence or not getattr(document_intelligence, "client", None):
        raise HTTPException(
            status_code=503, detail="Document Intelligence not configured"
        )
    try:
        suffix = Path(file.filename or "bin").suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        try:
            file_type = file.content_type or "application/octet-stream"
            extracted_text, _ = await document_intelligence.analyze_document(
                tmp_path, file_type
            )
        finally:
            import os
            os.unlink(tmp_path)
        if not extracted_text or not extracted_text.strip():
            return {
                "fields": {},
                "raw_text": "",
                "error": "No text could be extracted from the document.",
            }
        fields = None
        if (
            getattr(document_intelligence, "openai_client", None)
            and getattr(document_intelligence, "openai_deployment", None)
        ):
            from app.info_extraction_service import extract_from_text_with_openai
            fields = extract_from_text_with_openai(
                extracted_text,
                document_intelligence.openai_client,
                document_intelligence.openai_deployment,
            )
        if not fields:
            from app.info_extraction_service import extract_contact_simple
            fields = extract_contact_simple(extracted_text)
        return {"fields": fields, "raw_text": extracted_text[:2000]}
    except Exception as e:
        logger.exception("Info extraction failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
