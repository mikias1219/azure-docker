from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app import models
from app.services_loader import (
    document_intelligence,
    text_analytics,
    question_answering,
    clock_service,
    ai_vision,
    search_service,
    rag_service,
    speech_service,
)

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("/status", response_model=dict)
async def services_status(
    current_user: models.User = Depends(get_current_user),
):
    def _doc():
        return getattr(document_intelligence, "client", None) is not None

    def _openai():
        return getattr(document_intelligence, "openai_client", None) is not None

    def _ta():
        return (
            text_analytics.is_configured()
            if text_analytics and hasattr(text_analytics, "is_configured")
            else False
        )

    def _qna():
        return (
            question_answering.is_configured()
            if question_answering and hasattr(question_answering, "is_configured")
            else False
        )

    def _clock():
        return getattr(clock_service, "client", None) is not None

    def _vision():
        return (
            ai_vision.is_configured()
            if ai_vision and hasattr(ai_vision, "is_configured")
            else False
        )

    def _search():
        return (
            search_service.is_configured()
            if search_service and hasattr(search_service, "is_configured")
            else False
        )

    def _rag():
        return bool(
            search_service
            and getattr(search_service, "is_configured", lambda: False)()
            and rag_service
            and rag_service.get_embedding_deployment()
        )

    def _speech():
        return (
            speech_service is not None
            and getattr(speech_service, "speech_config", None) is not None
        )

    return {
        "document_intelligence": _doc(),
        "openai": _openai(),
        "text_analytics": _ta(),
        "qna": _qna(),
        "clock": _clock(),
        "vision": _vision(),
        "search": _search(),
        "rag": _rag(),
        "speech": _speech(),
    }
