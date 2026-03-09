from fastapi import FastAPI, Request, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
import os
import logging
import asyncio
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Database
from app.db import engine, Base, get_db
from app.models import metadata
from app import crud, models, schemas

# Azure services: import with fallback so app starts even if one SDK fails (e.g. in container)
try:
    from app.azure_services import document_intelligence
except Exception as e:
    logger.warning("Azure document_intelligence import failed: %s", e)
    document_intelligence = None  # type: ignore
try:
    from app.text_analytics import text_analytics
except Exception as e:
    logger.warning("text_analytics import failed: %s", e)
    text_analytics = None  # type: ignore
try:
    from app.question_answering import question_answering
except Exception as e:
    logger.warning("question_answering import failed: %s", e)
    question_answering = None  # type: ignore
try:
    from app.clock_service import clock_service
except Exception as e:
    logger.warning("clock_service import failed: %s", e)
    clock_service = None  # type: ignore
try:
    from app.ai_vision_service import ai_vision
except Exception as e:
    logger.warning("ai_vision import failed: %s", e)
    ai_vision = None  # type: ignore
try:
    from app import search_service
except Exception as e:
    logger.warning("search_service import failed: %s", e)
    search_service = None  # type: ignore
try:
    from app import rag_service
except Exception as e:
    logger.warning("rag_service import failed: %s", e)
    rag_service = None  # type: ignore
try:
    from app import info_extraction_service
except Exception as e:
    logger.warning("info_extraction_service import failed: %s", e)
    info_extraction_service = None  # type: ignore

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Create FastAPI app
app = FastAPI(title="Document Intelligence API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (mount only if dirs exist so container does not crash if frontend build is incomplete)
# In Docker __file__ is /app/main_new.py, so parent is /app (repo root)
_app_root = Path(__file__).resolve().parent
_static_dir = _app_root / "static"
_next_dir = _static_dir / "_next"
if _next_dir.exists():
    app.mount("/_next", StaticFiles(directory=str(_next_dir)), name="next-static")
if _static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")
else:
    logger.warning("static/ not found; frontend may not be built")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# Authentication helpers (must be defined before routes that use get_current_user)
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password[:72])  # Truncate to 72 bytes for bcrypt

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta is not None:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = (token or "").strip()
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise credentials_exception
    user = await crud.get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    return user


# Services status (which Azure services are configured; for frontend to show Live vs Demo)
@app.get("/api/services/status", response_model=dict)
async def services_status(current_user: models.User = Depends(get_current_user)):
    """Return which backend services are configured so the frontend can show real vs demo state."""
    def _doc(): return getattr(document_intelligence, "client", None) is not None
    def _openai(): return getattr(document_intelligence, "openai_client", None) is not None
    def _ta(): return text_analytics.is_configured() if text_analytics and hasattr(text_analytics, "is_configured") else False
    def _qna(): return question_answering.is_configured() if question_answering and hasattr(question_answering, "is_configured") else False
    def _clock(): return getattr(clock_service, "client", None) is not None
    def _vision(): return ai_vision.is_configured() if ai_vision and hasattr(ai_vision, "is_configured") else False
    def _search(): return search_service.is_configured() if search_service and hasattr(search_service, "is_configured") else False
    def _rag(): return bool(
        search_service and getattr(search_service, "is_configured", lambda: False)()
        and rag_service and rag_service.get_embedding_deployment()
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
    }

# Authentication endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = await crud.get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = await crud.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user = await crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    return await crud.create_user(db, user, hashed_password)

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/me", response_model=schemas.User)
async def read_me(current_user: models.User = Depends(get_current_user)):
    """Current user (same as /users/me) for frontend compatibility."""
    return current_user

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a document for the current user, persist it, and kick off AI processing.
    """
    try:
        uploads_dir = Path("uploads")
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

        # Kick off background processing with Azure Document Intelligence + Azure OpenAI
        # Use a new task without passing db: process_document creates its own session so the
        # request session is not used after the request ends (avoid closed-session errors).
        asyncio.create_task(process_document(document.id, file_path))

        return {"message": "Document uploaded successfully", "document_id": document.id}

    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Upload failed")

@app.get("/documents", response_model=List[schemas.Document])
async def get_documents(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return await crud.get_user_documents(db, current_user.id)

@app.get("/documents/{document_id}", response_model=schemas.Document)
async def get_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = await crud.get_document(db, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = await crud.get_document(db, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await crud.delete_document(db, document_id)
    return {"message": "Document deleted successfully"}


@app.post("/documents/search", response_model=List[schemas.Document])
async def search_documents(
    body: schemas.SearchQuery,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search current user's documents by keyword (filename, extracted text, AI analysis)."""
    return await crud.search_documents(db, current_user.id, body.query or "")


@app.post("/api/transcribe", response_model=dict)
async def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """Transcribe audio using Azure Speech Services"""
    try:
        # Read audio data
        audio_bytes = await audio.read()
        
        # Use Azure Speech Services or mock for demo
        import os
        azure_speech_key = os.getenv("AZURE_SPEECH_KEY", "")
        
        if azure_speech_key and azure_speech_key != "":
            # Real Azure transcription would go here
            # For now, return mock transcription
            text = "This is a transcribed text from your voice recording using Azure Speech Services."
        else:
            # Mock transcription for demo
            text = "This is a demo transcription. Azure Speech Services key not configured."
        
        return {"text": text, "success": True}
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail="Transcription failed")


@app.post("/analyze-text", response_model=dict)
async def analyze_text(
    body: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze text using AI (for transcriptions and other text)"""
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    try:
        # Use Azure OpenAI to analyze the text
        analysis = await document_intelligence.elaborate_with_ai(text)
        return {"analysis": analysis}
    except Exception as e:
        logger.error(f"Text analysis error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")


@app.post("/text-analytics/analyze", response_model=dict)
async def analyze_text_comprehensive(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    """Comprehensive text analysis using Azure AI Language (language, sentiment, key phrases, entities)"""
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    try:
        results = await text_analytics.analyze_text(text)
        return results
    except Exception as e:
        logger.error(f"Comprehensive text analysis error: {e}")
        raise HTTPException(status_code=500, detail="Text analysis failed")


@app.post("/text-analytics/language", response_model=dict)
async def detect_language(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    """Detect language of text using Azure AI Language"""
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    try:
        result = await text_analytics.detect_language(text)
        return result
    except Exception as e:
        logger.error(f"Language detection error: {e}")
        raise HTTPException(status_code=500, detail="Language detection failed")


@app.post("/text-analytics/sentiment", response_model=dict)
async def analyze_sentiment(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    """Analyze sentiment of text using Azure AI Language"""
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    try:
        result = await text_analytics.analyze_sentiment(text)
        return result
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        raise HTTPException(status_code=500, detail="Sentiment analysis failed")


@app.post("/text-analytics/key-phrases", response_model=dict)
async def extract_key_phrases(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    """Extract key phrases from text using Azure AI Language"""
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    try:
        result = await text_analytics.extract_key_phrases(text)
        return result
    except Exception as e:
        logger.error(f"Key phrase extraction error: {e}")
        raise HTTPException(status_code=500, detail="Key phrase extraction failed")


@app.post("/text-analytics/entities", response_model=dict)
async def recognize_entities(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    """Recognize named entities in text using Azure AI Language"""
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    try:
        result = await text_analytics.recognize_entities(text)
        return result
    except Exception as e:
        logger.error(f"Entity recognition error: {e}")
        raise HTTPException(status_code=500, detail="Entity recognition failed")


# Question Answering endpoints
@app.get("/qna/info", response_model=dict)
async def get_qna_info():
    """Get information about the Question Answering knowledge base (public endpoint)"""
    try:
        info = await question_answering.get_knowledge_base_info()
        return info
    except Exception as e:
        logger.error(f"QnA info error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get QnA info")


@app.post("/qna/ask", response_model=dict)
async def ask_question(body: dict):
    """Ask a question and get an answer from the knowledge base (public endpoint)"""
    question = body.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    
    try:
        result = await question_answering.get_answer(question)
        return result
    except Exception as e:
        logger.error(f"Question answering error: {e}")
        raise HTTPException(status_code=500, detail="Question answering failed")


@app.post("/qna/ask-top", response_model=dict)
async def ask_question_top(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    """Ask a question and get top answers from the knowledge base"""
    question = body.get("question", "")
    top = body.get("top", 3)
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    
    try:
        result = await question_answering.get_answers_with_context(question, top)
        return result
    except Exception as e:
        logger.error(f"Question answering error: {e}")
        raise HTTPException(status_code=500, detail="Question answering failed")


# ==================== Conversational Language Understanding (CLU) - Clock ====================

@app.get("/clock/info", response_model=dict)
async def get_clock_info():
    """Get information about the CLU Clock service (public endpoint)"""
    try:
        result = await clock_service.get_info()
        return result
    except Exception as e:
        logger.error(f"Clock info error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get clock info")


@app.post("/clock/analyze", response_model=dict)
async def analyze_clock_query(body: dict):
    """Analyze a natural language query for time/date/day intents (public endpoint)"""
    query = body.get("query", "")
    if not query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    try:
        result = await clock_service.analyze_conversation(query)
        return result
    except Exception as e:
        logger.error(f"Clock analysis error: {e}")
        raise HTTPException(status_code=500, detail="Clock analysis failed")

# AI Vision endpoints (public)
@app.get("/vision/info", response_model=dict)
async def get_vision_info():
    """Get information about the AI Vision service (public endpoint)"""
    try:
        info = await ai_vision.get_service_info()
        return info
    except Exception as e:
        logger.error(f"Vision info error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get vision info")

@app.post("/vision/analyze", response_model=dict)
async def analyze_image(
    file: UploadFile = File(...),
    features: str = Form("caption,tags,objects,people")
):
    """Analyze an image using Azure AI Vision (public endpoint)"""
    try:
        # Read image data
        image_data = await file.read()
        
        # Parse features
        feature_list = [f.strip() for f in features.split(",")]
        
        # Analyze image
        result = await ai_vision.analyze_image(image_data, feature_list)
        return result
    except Exception as e:
        logger.error(f"Vision analysis error: {e}")
        raise HTTPException(status_code=500, detail="Image analysis failed")

@app.post("/vision/read-text", response_model=dict)
async def read_text_from_image(file: UploadFile = File(...)):
    """Extract text from an image using OCR (public endpoint)"""
    try:
        # Read image data
        image_data = await file.read()
        
        # Read text
        result = await ai_vision.read_text(image_data)
        return result
    except Exception as e:
        logger.error(f"OCR error: {e}")
        raise HTTPException(status_code=500, detail="OCR failed")


@app.post("/documents/{document_id}/ask", response_model=schemas.AskResponse)
async def ask_document(
    document_id: int,
    body: schemas.AskRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Answer a question about the document using AI (Q&A over document content)."""
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
    answer = await document_intelligence.answer_question(text, body.question or "")
    return schemas.AskResponse(answer=answer or "No answer could be generated.")


# ---------- Prebuilt Invoice (mslearn-ai-info: prebuilt document intelligence) ----------
@app.post("/api/document-intelligence/analyze-invoice", response_model=dict)
async def analyze_invoice(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """Extract invoice fields (VendorName, CustomerName, InvoiceTotal, etc.) using Document Intelligence prebuilt-invoice."""
    if not document_intelligence or not document_intelligence.client:
        raise HTTPException(status_code=503, detail="Document Intelligence not configured")
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        try:
            result = await asyncio.to_thread(
                document_intelligence.analyze_invoice,
                tmp_path,
            )
            return result
        finally:
            os.unlink(tmp_path)
    except Exception as e:
        logger.exception("Invoice analysis failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Information Extraction (mslearn-ai-info: business card / structured fields) ----------
@app.post("/api/info-extraction/analyze", response_model=dict)
async def info_extraction_analyze(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """Extract structured fields (e.g. Name, Company, Email, Phone) from image/document using Document Intelligence + OpenAI."""
    if not document_intelligence or not document_intelligence.client:
        raise HTTPException(status_code=503, detail="Document Intelligence not configured")
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename or "bin").suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        try:
            file_type = file.content_type or "application/octet-stream"
            extracted_text, _ = await document_intelligence.analyze_document(tmp_path, file_type)
        finally:
            os.unlink(tmp_path)
        if not extracted_text or not extracted_text.strip():
            return {"fields": {}, "raw_text": "", "error": "No text could be extracted from the document."}
        fields = None
        if document_intelligence.openai_client and document_intelligence.openai_deployment:
            from app.info_extraction_service import extract_from_text_with_openai
            fields = extract_from_text_with_openai(
                extracted_text,
                document_intelligence.openai_client,
                document_intelligence.openai_deployment,
            )
        if not fields:
            from app.info_extraction_service import extract_contact_simple
            fields = extract_contact_simple(extracted_text)
        return {"fields": fields, "raw_text": extracted_text[:2000]}
    except Exception as e:
        logger.exception("Info extraction failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Knowledge Mining (Azure AI Search keyword search) ----------
@app.get("/api/knowledge/search", response_model=dict)
async def knowledge_search_get(
    q: str = "",
    index: str = "",
    current_user: models.User = Depends(get_current_user),
):
    """Keyword search over Azure AI Search index."""
    if not search_service or not getattr(search_service, "is_configured", lambda: False)():
        return {"results": [], "count": 0, "error": "Azure AI Search not configured"}
    index_name = index or os.getenv("AZURE_SEARCH_INDEX_NAME", "rag-content-index")
    if not q or not q.strip():
        return {"results": [], "count": 0}
    return search_service.keyword_search(index_name, q.strip(), select=["file_name", "content", "summary"], top=15)


@app.post("/api/knowledge/search", response_model=dict)
async def knowledge_search_post(
    body: dict = None,
    current_user: models.User = Depends(get_current_user),
):
    """Keyword search (POST body: query, index)."""
    if not search_service or not getattr(search_service, "is_configured", lambda: False)():
        return {"results": [], "count": 0, "error": "Azure AI Search not configured"}
    body = body or {}
    query = (body.get("query") or body.get("q") or "").strip()
    index_name = (body.get("index") or os.getenv("AZURE_SEARCH_INDEX_NAME", "rag-content-index")).strip()
    if not query:
        return {"results": [], "count": 0}
    return search_service.keyword_search(index_name, query, select=["file_name", "content", "summary"], top=15)


# ---------- RAG pipeline ----------
@app.post("/api/rag/ensure-index", response_model=dict)
async def rag_ensure_index(current_user: models.User = Depends(get_current_user)):
    """Create or update the RAG vector index (admin)."""
    if not rag_service or not hasattr(rag_service, "ensure_rag_index"):
        return {"ok": False, "error": "RAG service not available"}
    ok = rag_service.ensure_rag_index()
    return {"ok": ok, "index": rag_service.RAG_INDEX_NAME}


@app.post("/api/rag/ingest", response_model=dict)
async def rag_ingest(
    document_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ingest a document into the RAG index (by document_id). Extracts text via Document Intelligence, chunks, embeds, indexes."""
    if not rag_service:
        return {"indexed": 0, "error": "RAG service not available"}
    if document_id is not None:
        document = await crud.get_document(db, document_id)
        if not document or document.owner_id != current_user.id:
            raise HTTPException(status_code=404, detail="Document not found")
        text = (document.extracted_text or "").strip()
        if not text:
            return {"indexed": 0, "error": "Document has no extracted text yet. Wait for processing or re-upload."}
        openai_client = document_intelligence.openai_client if document_intelligence else None
        deployment = rag_service.get_embedding_deployment()
        if not deployment or not openai_client:
            return {"indexed": 0, "error": "OpenAI embedding deployment not configured (AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME)"}
        from app.search_service import get_search_client
        if not get_search_client(rag_service.RAG_INDEX_NAME):
            return {"indexed": 0, "error": "Azure AI Search not configured or RAG index missing. Call POST /api/rag/ensure-index first."}
        result = rag_service.ingest_document(
            document.original_filename or f"doc-{document_id}",
            text,
            document_intelligence=document_intelligence,
            openai_client=openai_client,
        )
        return result
    return {"indexed": 0, "error": "Provide document_id to ingest."}


@app.post("/api/rag/ask", response_model=dict)
async def rag_ask(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    """RAG Q&A: retrieve relevant chunks from index, then answer with OpenAI chat."""
    if not rag_service:
        return {"answer": "", "sources": [], "error": "RAG service not available"}
    question = (body.get("question") or body.get("query") or "").strip()
    if not question:
        return {"answer": "", "sources": [], "error": "question is required"}
    retrieved = rag_service.rag_retrieve(question, top_k=5)
    if retrieved.get("error"):
        return {"answer": "", "sources": [], "error": retrieved["error"]}
    context = retrieved.get("context", "")
    sources = retrieved.get("sources", [])
    openai_client = document_intelligence.openai_client if document_intelligence else None
    chat_deployment = getattr(document_intelligence, "openai_deployment", None) if document_intelligence else os.getenv("OPENAI_DEPLOYMENT_NAME")
    if not openai_client or not chat_deployment:
        return {"answer": "", "sources": sources, "error": "OpenAI chat not configured"}
    answer = rag_service.rag_answer(question, context, openai_client, chat_deployment)
    return {"answer": answer or "Could not generate an answer.", "sources": sources}


async def process_document(document_id: int, file_path: Path):
    """
    Background processing for a document:
    1. Extract text with Azure Document Intelligence (Standard SKU recommended)
    2. Run Azure OpenAI over the text for rich analysis
    3. Persist results on the document row
    Uses its own DB session so the request session is not used after the request ends.
    """
    from app.db import SessionLocal
    db = SessionLocal()
    try:
        # Reload document for metadata (e.g. file_type, owner validation)
        document = await crud.get_document(db, document_id)
        if not document:
            logger.error("Document %s no longer exists; skipping processing", document_id)
            return

        file_type = getattr(document, "file_type", "application/octet-stream") or "application/octet-stream"

        extracted_text, confidence = await document_intelligence.analyze_document(
            str(file_path), file_type
        )

        ai_analysis = None
        if extracted_text:
            ai_analysis = await document_intelligence.elaborate_with_ai(extracted_text)

        await crud.update_document_analysis(
            db,
            document_id,
            extracted_text or "Text extraction failed",
            ai_analysis or "AI analysis failed",
            confidence or 0.0,
        )

        logger.info("Document %s processed successfully", document_id)

    except Exception as e:
        logger.error("Error processing document %s: %s", document_id, e)
    finally:
        db.close()

# Startup and shutdown events
@app.on_event("startup")
async def startup():
    logger.info("Application startup: creating database tables")
    metadata.create_all(bind=engine)
    logger.info("Database connected and tables verified")

@app.on_event("shutdown")
async def shutdown():
    logger.info("Application shutting down")

# Serve frontend - catch all routes for Next.js (must be last)
_index_path = _app_root / "static" / "index.html"

@app.get("/{path:path}", response_class=HTMLResponse)
async def catch_all(request: Request, path: str):
    # For all non-API routes, serve the Next.js index.html
    if _index_path.exists():
        return FileResponse(str(_index_path))
    return JSONResponse(content={"message": "Frontend not built; use API endpoints."}, status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
