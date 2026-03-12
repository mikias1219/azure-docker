"""API routers for the FastAPI application."""
from app.api.auth_router import router as auth_router
from app.api.services_router import router as services_router
from app.api.documents_router import router as documents_router
from app.api.text_router import router as text_router
from app.api.qna_router import router as qna_router
from app.api.clock_router import router as clock_router
from app.api.vision_router import router as vision_router
from app.api.rag_router import router as rag_router
from app.api.knowledge_router import router as knowledge_router
from app.api.speech_router import router as speech_router
from app.api.info_extraction_router import router as info_extraction_router

__all__ = [
    "auth_router",
    "services_router",
    "documents_router",
    "text_router",
    "qna_router",
    "clock_router",
    "vision_router",
    "rag_router",
    "knowledge_router",
    "speech_router",
    "info_extraction_router",
]
