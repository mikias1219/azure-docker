"""Lazy-load Azure service clients so the app starts even if one SDK fails."""
import logging

logger = logging.getLogger(__name__)

document_intelligence = None
text_analytics = None
question_answering = None
clock_service = None
ai_vision = None
search_service = None
rag_service = None
info_extraction_service = None
speech_service = None

try:
    from app.azure_services import document_intelligence  # noqa: F401
except Exception as e:
    logger.warning("Azure document_intelligence import failed: %s", e)
try:
    from app.text_analytics import text_analytics  # noqa: F401
except Exception as e:
    logger.warning("text_analytics import failed: %s", e)
try:
    from app.question_answering import question_answering  # noqa: F401
except Exception as e:
    logger.warning("question_answering import failed: %s", e)
try:
    from app.clock_service import clock_service  # noqa: F401
except Exception as e:
    logger.warning("clock_service import failed: %s", e)
try:
    from app.ai_vision_service import ai_vision  # noqa: F401
except Exception as e:
    logger.warning("ai_vision import failed: %s", e)
try:
    from app import search_service  # noqa: F401
except Exception as e:
    logger.warning("search_service import failed: %s", e)
try:
    from app import rag_service  # noqa: F401
except Exception as e:
    logger.warning("rag_service import failed: %s", e)
try:
    from app import info_extraction_service  # noqa: F401
except Exception as e:
    logger.warning("info_extraction_service import failed: %s", e)
try:
    from app.speech_service import speech_service  # noqa: F401
except Exception as e:
    logger.warning("speech_service import failed: %s", e)
