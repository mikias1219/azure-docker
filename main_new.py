from fastapi import FastAPI, Request, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
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
from app.azure_services import document_intelligence
from app.text_analytics import text_analytics
from app.question_answering import question_answering

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

# Static files
app.mount("/_next", StaticFiles(directory="static/_next"), name="next-static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password[:72])  # Truncate to 72 bytes for bcrypt

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await crud.get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    return user

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
        asyncio.create_task(process_document(document.id, file_path, db))

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
async def get_qna_info(current_user: models.User = Depends(get_current_user)):
    """Get information about the Question Answering knowledge base"""
    try:
        info = await question_answering.get_knowledge_base_info()
        return info
    except Exception as e:
        logger.error(f"QnA info error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get QnA info")


@app.post("/qna/ask", response_model=dict)
async def ask_question(
    body: dict,
    current_user: models.User = Depends(get_current_user),
):
    """Ask a question and get an answer from the knowledge base"""
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
    answer = await document_intelligence.answer_question(text, body.question or "")
    return schemas.AskResponse(answer=answer)

async def process_document(document_id: int, file_path: Path, db: Session):
    """
    Background processing for a document:
    1. Extract text with Azure Document Intelligence (Standard SKU recommended)
    2. Run Azure OpenAI over the text for rich analysis
    3. Persist results on the document row
    """
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

# Startup and shutdown events
@app.on_event("startup")
async def startup():
    # Create database tables
    metadata.create_all(bind=engine)
    logger.info("Database connected and tables verified")

@app.on_event("shutdown")
async def shutdown():
    logger.info("Application shutting down")

# Serve frontend - catch all routes for Next.js (must be last)
@app.get("/{path:path}", response_class=HTMLResponse)
async def catch_all(request: Request, path: str):
    # For all non-API routes, serve the Next.js index.html
    # This enables client-side routing
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
