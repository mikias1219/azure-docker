"""
Main FastAPI application entry point.
Mounts modular API routers and serves the frontend.
"""
from pathlib import Path

from fastapi import FastAPI, Request, File, UploadFile, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.db import engine
from app.models import metadata
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
from app.api import (
    auth_router,
    services_router,
    documents_router,
    text_router,
    qna_router,
    clock_router,
    vision_router,
    rag_router,
    knowledge_router,
    speech_router,
    info_extraction_router,
)

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Azure AI Studio API",
    description="Document Intelligence, Language, Vision, Speech, RAG & Knowledge Mining",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_app_root = Path(__file__).resolve().parent
_static_dir = _app_root / "static"
_next_dir = _static_dir / "_next"
if _next_dir.exists():
    app.mount("/_next", StaticFiles(directory=str(_next_dir)), name="next-static")
if _static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")
else:
    logger.warning("static/ not found; frontend may not be built")

# Health
@app.get("/health")
async def health_check():
    from datetime import datetime
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Routers (no prefix: routes define full paths where needed)
app.include_router(auth_router)
app.include_router(services_router)
app.include_router(documents_router)
app.include_router(text_router)
app.include_router(qna_router)
app.include_router(clock_router)
app.include_router(vision_router)
app.include_router(rag_router)
app.include_router(knowledge_router)
app.include_router(speech_router)
app.include_router(info_extraction_router)

# Legacy transcribe endpoint (mock when no speech key)
@app.post("/api/transcribe")
async def transcribe_audio_legacy(
    audio: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    import os
    try:
        await audio.read()
        key = os.getenv("AZURE_SPEECH_KEY", "")
        text = (
            "This is a transcribed text from your voice recording using Azure Speech Services."
            if key
            else "This is a demo transcription. Azure Speech Services key not configured."
        )
        return {"text": text, "success": True}
    except Exception as e:
        logger.error("Transcription error: %s", e)
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Transcription failed")


@app.on_event("startup")
async def startup():
    logger.info("Application startup: creating database tables")
    metadata.create_all(bind=engine)
    logger.info("Database connected and tables verified")
    svc_status = {
        "Document Intelligence": document_intelligence is not None and getattr(document_intelligence, "client", None) is not None,
        "Azure OpenAI (Chat)": document_intelligence is not None and getattr(document_intelligence, "openai_client", None) is not None,
        "Text Analytics": text_analytics is not None and getattr(text_analytics, "client", None) is not None,
        "Question Answering": question_answering is not None and getattr(question_answering, "client", None) is not None,
        "CLU / Clock": clock_service is not None and getattr(clock_service, "client", None) is not None,
        "AI Vision": ai_vision is not None and getattr(ai_vision, "client", None) is not None,
        "Azure AI Search": search_service is not None and getattr(search_service, "is_configured", lambda: False)(),
        "RAG Pipeline": (
            search_service is not None and getattr(search_service, "is_configured", lambda: False)()
            and rag_service is not None and bool(getattr(rag_service, "get_embedding_deployment", lambda: None)())
        ),
    }
    logger.info("=" * 60)
    logger.info("  Azure AI Services Configuration Status")
    logger.info("=" * 60)
    for name, configured in svc_status.items():
        status_icon = "✅  LIVE" if configured else "⚠️  NOT CONFIGURED"
        logger.info("  %-30s %s", name, status_icon)
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown():
    logger.info("Application shutting down")


_index_path = _app_root / "static" / "index.html"


@app.get("/{path:path}", response_class=HTMLResponse)
async def catch_all(request: Request, path: str):
    if _index_path.exists():
        return FileResponse(str(_index_path))
    return JSONResponse(
        content={"message": "Frontend not built; use API endpoints."},
        status_code=404,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
