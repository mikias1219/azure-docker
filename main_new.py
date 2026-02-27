from fastapi import FastAPI, Request, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
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
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database
from app.db import database, engine
from app.models import metadata
from app import crud, models, schemas

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

# Templates
templates = Jinja2Templates(directory="templates")

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve frontend
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return FileResponse("frontend/out/index.html")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
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
    
    user = await crud.get_user_by_username(username)
    if user is None:
        raise credentials_exception
    return user

# Authentication endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await crud.get_user_by_username(form_data.username)
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
async def register_user(user: schemas.UserCreate):
    db_user = await crud.get_user_by_username(user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user = await crud.get_user_by_email(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    return await crud.create_user(user, hashed_password)

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# Document endpoints
@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Create uploads directory if it doesn't exist
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)
        
        # Save file
        file_content = await file.read()
        file_path = uploads_dir / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Create document record
        document = await crud.create_document(
            db=database,
            document=schemas.DocumentCreate(
                filename=file_path.name,
                original_filename=file.filename,
                file_type=file.content_type or "application/octet-stream",
                file_size=len(file_content)
            ),
            user_id=current_user.id
        )
        
        # Trigger async processing (in a real app, you'd use a background task)
        asyncio.create_task(process_document(document.id, file_path))
        
        return {"message": "Document uploaded successfully", "document_id": document.id}
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Upload failed")

@app.get("/documents", response_model=List[schemas.Document])
async def get_documents(current_user: models.User = Depends(get_current_user)):
    return await crud.get_user_documents(database, current_user.id)

@app.get("/documents/{document_id}", response_model=schemas.Document)
async def get_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user)
):
    document = await crud.get_document(database, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    current_user: models.User = Depends(get_current_user)
):
    document = await crud.get_document(database, document_id)
    if not document or document.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await crud.delete_document(database, document_id)
    return {"message": "Document deleted successfully"}

# Background processing function
async def process_document(document_id: int, file_path: Path):
    try:
        # In a real implementation, you would:
        # 1. Use Azure Form Recognizer to extract text
        # 2. Use OpenAI to analyze the extracted text
        # 3. Update the document record with results
        
        # For now, we'll simulate processing
        await asyncio.sleep(5)
        
        # Mock extracted text
        extracted_text = "This is sample extracted text from the document."
        
        # Mock AI analysis
        ai_analysis = "This document contains important information that has been analyzed using AI."
        
        # Update document
        await crud.update_document_analysis(
            database, 
            document_id, 
            extracted_text, 
            ai_analysis, 
            0.95
        )
        
        logger.info(f"Document {document_id} processed successfully")
        
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")

# Startup and shutdown events
@app.on_event("startup")
async def startup():
    await database.connect()
    await metadata.create_all(engine)
    logger.info("Database connected and tables verified")

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
    logger.info("Database disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=80)
