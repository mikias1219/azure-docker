import logging

from fastapi import APIRouter, HTTPException
from app.services_loader import clock_service

router = APIRouter(prefix="/clock", tags=["clock"])
logger = logging.getLogger(__name__)


@router.get("/info", response_model=dict)
async def get_clock_info():
    if not clock_service:
        raise HTTPException(status_code=503, detail="Clock service not configured")
    try:
        result = await clock_service.get_info()
        return result
    except Exception as e:
        logger.error("Clock info error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get clock info")


@router.post("/analyze", response_model=dict)
async def analyze_clock_query(body: dict):
    if not clock_service:
        raise HTTPException(status_code=503, detail="Clock service not configured")
    query = body.get("query", "")
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
    try:
        result = await clock_service.analyze_conversation(query)
        return result
    except Exception as e:
        logger.error("Clock analysis error: %s", e)
        raise HTTPException(status_code=500, detail="Clock analysis failed")
