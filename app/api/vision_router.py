import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from app.services_loader import ai_vision

router = APIRouter(prefix="/vision", tags=["vision"])
logger = logging.getLogger(__name__)


@router.get("/info", response_model=dict)
async def get_vision_info():
    if not ai_vision:
        raise HTTPException(status_code=503, detail="AI Vision not configured")
    try:
        info = await ai_vision.get_service_info()
        return info
    except Exception as e:
        logger.error("Vision info error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get vision info")


@router.post("/analyze", response_model=dict)
async def analyze_image(
    file: UploadFile = File(...),
    features: str = Form("caption,tags,objects,people"),
):
    if not ai_vision:
        raise HTTPException(status_code=503, detail="AI Vision not configured")
    try:
        image_data = await file.read()
        feature_list = [f.strip() for f in features.split(",")]
        result = await ai_vision.analyze_image(image_data, feature_list)
        return result
    except Exception as e:
        logger.error("Vision analysis error: %s", e)
        raise HTTPException(status_code=500, detail="Image analysis failed")


@router.post("/read-text", response_model=dict)
async def read_text_from_image(file: UploadFile = File(...)):
    if not ai_vision:
        raise HTTPException(status_code=503, detail="AI Vision not configured")
    try:
        image_data = await file.read()
        result = await ai_vision.read_text(image_data)
        return result
    except Exception as e:
        logger.error("OCR error: %s", e)
        raise HTTPException(status_code=500, detail="OCR failed")
