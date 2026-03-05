from sqlalchemy.orm import Session
from sqlalchemy import or_
from app import models, schemas
from datetime import datetime

# User CRUD operations
async def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

async def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

async def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

async def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Document CRUD operations
async def create_document(db: Session, document: schemas.DocumentCreate, user_id: int):
    db_document = models.Document(
        **document.dict(),
        owner_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

async def get_document(db: Session, document_id: int):
    return db.query(models.Document).filter(models.Document.id == document_id).first()

async def get_user_documents(db: Session, user_id: int):
    return db.query(models.Document).filter(models.Document.owner_id == user_id).all()

async def update_document_analysis(db: Session, document_id: int, extracted_text: str, ai_analysis: str, confidence: float):
    db_document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if db_document:
        db_document.extracted_text = extracted_text
        db_document.ai_analysis = ai_analysis
        db_document.analysis_confidence = confidence
        db_document.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_document)
    return db_document

async def delete_document(db: Session, document_id: int):
    db_document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if db_document:
        db.delete(db_document)
        db.commit()
    return db_document


async def search_documents(db: Session, user_id: int, query: str):
    """Search current user's documents by keyword in filename, extracted text, or AI analysis."""
    if not query or not query.strip():
        return await get_user_documents(db, user_id)
    q = f"%{query.strip()}%"
    return (
        db.query(models.Document)
        .filter(models.Document.owner_id == user_id)
        .filter(
            or_(
                models.Document.original_filename.ilike(q),
                models.Document.extracted_text.ilike(q),
                models.Document.ai_analysis.ilike(q),
            )
        )
        .all()
    )
