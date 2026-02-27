from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import os
import logging
import sys
import time
from dotenv import load_dotenv
from app import db, crud, schemas, auth, azure_services

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, stream=sys.stderr, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="FastAPI Azure Sample")

# Ensure static directory exists
os.makedirs("static", exist_ok=True)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
async def startup():
    logger.info("Application starting up...")
    
    # Robust startup: retry connection if DB is still initializing
    max_retries = 5
    for i in range(max_retries):
        try:
            db.create_tables()
            await db.database.connect()
            logger.info("Database connected and tables verified.")
            return
        except Exception as e:
            logger.warning(f"Database not ready (attempt {i+1}/{max_retries}): {e}")
            if i < max_retries - 1:
                time.sleep(5)
            else:
                logger.critical("Could not connect to database after several attempts.")

@app.on_event("shutdown")
async def shutdown():
    await db.database.disconnect()
    logger.info("Database connection closed.")

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/register", response_model=schemas.UserOut)
async def register(user: schemas.UserCreate):
    existing = await crud.get_user_by_username(user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    existing_email = await crud.get_user_by_email(user.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await crud.create_user(user.username, user.email, user.password)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await crud.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=schemas.UserOut)
async def read_me(current_user=Depends(auth.get_current_user)):
    return current_user

@app.post("/notes", response_model=schemas.NoteOut)
async def create_note(note: schemas.NoteCreate, current_user=Depends(auth.get_current_user)):
    return await crud.create_note_for_user(current_user["id"], note.title, note.content)

@app.get("/notes", response_model=list[schemas.NoteOut])
async def list_notes(current_user=Depends(auth.get_current_user)):
    return await crud.get_notes_for_user(current_user["id"])

@app.get("/notes/{note_id}", response_model=schemas.NoteOut)
async def get_note(note_id: int, current_user=Depends(auth.get_current_user)):
    note = await crud.get_note(note_id)
    if not note or note["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note

@app.put("/notes/{note_id}", response_model=schemas.NoteOut)
async def update_note_endpoint(note_id: int, note_in: schemas.NoteCreate, current_user=Depends(auth.get_current_user)):
    note = await crud.get_note(note_id)
    if not note or note["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return await crud.update_note(note_id, note_in.title, note_in.content)

@app.delete("/notes/{note_id}")
async def delete_note_endpoint(note_id: int, current_user=Depends(auth.get_current_user)):
    note = await crud.get_note(note_id)
    if not note or note["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    await crud.delete_note(note_id)
    return {"ok": True}

@app.post("/upload", response_model=schemas.DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user=Depends(auth.get_current_user)
):
    # Validate file type
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                     "text/plain", "image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not supported")
    
    # Save file
    document = await crud.create_document_for_user(
        current_user["id"], 
        file.filename, 
        file.content_type, 
        file.size
    )
    
    file_path = os.path.join("uploads", document["filename"])
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"File saved: {file_path}")
        
        # Process document in background
        background_tasks.add_task(process_document, document["id"], file_path, file.content_type)
        
        return document
        
    except Exception as e:
        # Clean up database record if file save fails
        await crud.delete_document(document["id"])
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file")

async def process_document(document_id: int, file_path: str, file_type: str):
    """Background task to process document with Azure services"""
    try:
        logger.info(f"Starting document processing for ID: {document_id}")
        
        # Extract text using Azure Document Intelligence
        extracted_text, confidence = await azure_services.document_intelligence.analyze_document(
            file_path, file_type
        )
        
        # Generate AI analysis
        ai_analysis = None
        if extracted_text:
            ai_analysis = await azure_services.document_intelligence.elaborate_with_ai(extracted_text)
        
        # Update document with analysis results
        await crud.update_document_analysis(
            document_id, 
            extracted_text or "Text extraction failed", 
            ai_analysis or "AI analysis failed", 
            confidence or 0.0
        )
        
        logger.info(f"Document processing completed for ID: {document_id}")
        
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")
        # Update document with error information
        await crud.update_document_analysis(
            document_id, 
            "Processing failed", 
            f"Analysis failed: {str(e)}", 
            0.0
        )

@app.get("/documents", response_model=list[schemas.DocumentOut])
async def list_documents(current_user=Depends(auth.get_current_user)):
    return await crud.get_documents_for_user(current_user["id"])

@app.get("/documents/{document_id}", response_model=schemas.DocumentOut)
async def get_document(document_id: int, current_user=Depends(auth.get_current_user)):
    document = await crud.get_document(document_id)
    if not document or document["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document

@app.delete("/documents/{document_id}")
async def delete_document(document_id: int, current_user=Depends(auth.get_current_user)):
    document = await crud.get_document(document_id)
    if not document or document["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    # Delete file from filesystem
    file_path = os.path.join("uploads", document["filename"])
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete from database
    await crud.delete_document(document_id)
    return {"ok": True}
