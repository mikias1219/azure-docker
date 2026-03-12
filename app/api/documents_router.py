import os
from datetime import datetime
from pathlib import Path
from typing import List

import asyncio
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app import crud, models, schemas
from app.tasks import process_document
from app.services_loader import document_intelligence

router = APIRouter(tags=["documents"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uploads_dir = Path(os.getenv("UPLOADS_DIR", "uploads"))
    uploads_dir.mkdir(exist_ok=True)
    file_content = await file.read()
    safe_name = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = uploads_dir / safe_name
    with open(file_path, "wb") as f:
        f.write(file_content)
    document = await crud.create_document(
        db=db,
        document=schemas.DocumentCreate(
            filename=file_path.name,
            original_filename=file.filename,
            file_type=file.content_type or "application/octet-stream",
            file_size=len(file_content),
        ),
        user_id=current_user.id,
    )
    asyncio.create_task(process_document(document.id, file_path))
    return {"message": "Document uploaded successfully", "document_id": document.id}


@router.get("/documents", response_model=List[schemas.Document])
async def get_documents(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await crud.get_user_documents(db, current_user.id)


@router.get("/documents/{document_id}", response_model=schemas.Document)
async def get_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = await crud.get_document(db, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = await crud.get_document(db, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    await crud.delete_document(db, document_id)
    return {"message": "Document deleted successfully"}


@router.post("/documents/search", response_model=List[schemas.Document])
async def search_documents(
    body: schemas.SearchQuery,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await crud.search_documents(db, current_user.id, body.query or "")


@router.post("/documents/{document_id}/ask", response_model=schemas.AskResponse)
async def ask_document(
    document_id: int,
    body: schemas.AskRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = await crud.get_document(db, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    text = (document.extracted_text or "").strip()
    if not text:
        return schemas.AskResponse(
            answer="No extracted text for this document yet. Wait for processing to finish and refresh, or re-upload the document."
        )
    if not document_intelligence or not getattr(document_intelligence, "answer_question", None):
        return schemas.AskResponse(
            answer="Document Q&A is not available (Azure OpenAI not configured). You can read the extracted text above."
        )
    answer_data = await document_intelligence.answer_question(text, body.question or "")
    if isinstance(answer_data, str):
        return schemas.AskResponse(answer=answer_data)
    return schemas.AskResponse(**answer_data)
