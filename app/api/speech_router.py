import os
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.core.security import get_current_user
from app import models
from app.services_loader import speech_service

router = APIRouter(prefix="/api/speech", tags=["speech"])
logger = logging.getLogger(__name__)


@router.post("/transcribe", response_model=dict)
async def speech_transcribe(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """Transcribe an uploaded audio file using Azure AI Speech."""
    if not speech_service:
        return {"error": "Speech service not initialized", "text": ""}
    temp_dir = Path("temp_audio")
    temp_dir.mkdir(exist_ok=True)
    temp_path = temp_dir / (file.filename or "audio")
    with open(temp_path, "wb") as buffer:
        import shutil
        shutil.copyfileobj(file.file, buffer)
    try:
        result = await speech_service.transcribe_audio(str(temp_path))
        return result
    finally:
        if temp_path.exists():
            os.remove(temp_path)


@router.post("/synthesize", response_model=dict)
async def speech_synthesize(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    if not speech_service:
        return {"error": "Speech service not initialized"}
    text = body.get("text", "").strip()
    if not text:
        return {"error": "No text provided for synthesis"}
    result = await speech_service.synthesize_speech(text)
    return result
