"""Background tasks (e.g. document processing)."""
import asyncio
import logging
from pathlib import Path

from app.db import SessionLocal
from app import crud
from app.services_loader import document_intelligence

logger = logging.getLogger(__name__)


async def process_document(document_id: int, file_path: Path):
    """
    Background processing: extract text with Document Intelligence, run OpenAI analysis, persist.
    Uses its own DB session so the request session is not used after the request ends.
    """
    if not document_intelligence or not getattr(document_intelligence, "client", None):
        logger.warning("Document Intelligence not configured; skipping processing")
        return
    db = SessionLocal()
    try:
        document = await crud.get_document(db, document_id)
        if not document:
            logger.error("Document %s no longer exists; skipping processing", document_id)
            return
        file_type = (
            getattr(document, "file_type", "application/octet-stream")
            or "application/octet-stream"
        )
        extracted_text, confidence = await document_intelligence.analyze_document(
            str(file_path), file_type
        )
        ai_analysis = None
        if extracted_text:
            ai_res = await document_intelligence.elaborate_with_ai(extracted_text)
            import json
            ai_analysis = json.dumps(ai_res)
        await crud.update_document_analysis(
            db,
            document_id,
            extracted_text or "Text extraction failed",
            ai_analysis or "AI analysis failed",
            confidence or 0.0,
        )
        logger.info("Document %s processed successfully", document_id)
    except Exception as e:
        logger.error("Error processing document %s: %s", document_id, e)
    finally:
        db.close()
