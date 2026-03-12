import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app import models
from app.services_loader import question_answering

router = APIRouter(prefix="/qna", tags=["qna"])
logger = logging.getLogger(__name__)


@router.get("/info", response_model=dict)
async def get_qna_info():
    if not question_answering:
        raise HTTPException(status_code=503, detail="Question Answering not configured")
    try:
        info = await question_answering.get_knowledge_base_info()
        return info
    except Exception as e:
        logger.error("QnA info error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to get QnA info")


@router.post("/ask", response_model=dict)
async def ask_question(body: dict):
    if not question_answering:
        raise HTTPException(status_code=503, detail="Question Answering not configured")
    question = body.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    try:
        result = await question_answering.get_answer(question)
        return result
    except Exception as e:
        logger.error("Question answering error: %s", e)
        raise HTTPException(status_code=500, detail="Question answering failed")


@router.post("/ask-top", response_model=dict)
async def ask_question_top(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    if not question_answering:
        raise HTTPException(status_code=503, detail="Question Answering not configured")
    question = body.get("question", "")
    top = body.get("top", 3)
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    try:
        result = await question_answering.get_answers_with_context(question, top)
        return result
    except Exception as e:
        logger.error("Question answering error: %s", e)
        raise HTTPException(status_code=500, detail="Question answering failed")
