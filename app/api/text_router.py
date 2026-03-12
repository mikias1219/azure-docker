import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app import models
from app.services_loader import document_intelligence, text_analytics

router = APIRouter(tags=["text"])
logger = logging.getLogger(__name__)


@router.post("/analyze-text", response_model=dict)
async def analyze_text(
    body: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    if not document_intelligence:
        raise HTTPException(status_code=503, detail="Document Intelligence not configured")
    try:
        analysis = await document_intelligence.elaborate_with_ai(text)
        return {"analysis": analysis}
    except Exception as e:
        logger.error("Text analysis error: %s", e)
        raise HTTPException(status_code=500, detail="Analysis failed")


@router.post("/text-analytics/analyze", response_model=dict)
async def analyze_text_comprehensive(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    if not text_analytics:
        raise HTTPException(status_code=503, detail="Text Analytics not configured")
    try:
        results = await text_analytics.analyze_text(text)
        return results
    except Exception as e:
        logger.error("Comprehensive text analysis error: %s", e)
        raise HTTPException(status_code=500, detail="Text analysis failed")


@router.post("/text-analytics/language", response_model=dict)
async def detect_language(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    if not text_analytics:
        raise HTTPException(status_code=503, detail="Text Analytics not configured")
    try:
        result = await text_analytics.detect_language(text)
        return result
    except Exception as e:
        logger.error("Language detection error: %s", e)
        raise HTTPException(status_code=500, detail="Language detection failed")


@router.post("/text-analytics/sentiment", response_model=dict)
async def analyze_sentiment(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    if not text_analytics:
        raise HTTPException(status_code=503, detail="Text Analytics not configured")
    try:
        result = await text_analytics.analyze_sentiment(text)
        return result
    except Exception as e:
        logger.error("Sentiment analysis error: %s", e)
        raise HTTPException(status_code=500, detail="Sentiment analysis failed")


@router.post("/text-analytics/key-phrases", response_model=dict)
async def extract_key_phrases(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    if not text_analytics:
        raise HTTPException(status_code=503, detail="Text Analytics not configured")
    try:
        result = await text_analytics.extract_key_phrases(text)
        return result
    except Exception as e:
        logger.error("Key phrase extraction error: %s", e)
        raise HTTPException(status_code=500, detail="Key phrase extraction failed")


@router.post("/text-analytics/entities", response_model=dict)
async def recognize_entities(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    if not text_analytics:
        raise HTTPException(status_code=503, detail="Text Analytics not configured")
    try:
        result = await text_analytics.recognize_entities(text)
        return result
    except Exception as e:
        logger.error("Entity recognition error: %s", e)
        raise HTTPException(status_code=500, detail="Entity recognition failed")
