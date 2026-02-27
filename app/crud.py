from .models import users, notes, documents
from .db import database
from passlib.context import CryptContext
from sqlalchemy import select
from datetime import datetime
import uuid
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def get_user_by_username(username: str):
    query = users.select().where(users.c.username == username)
    return await database.fetch_one(query)


async def get_user_by_email(email: str):
    query = users.select().where(users.c.email == email)
    return await database.fetch_one(query)


async def create_user(username: str, email: str, password: str):
    hashed = pwd_context.hash(password)
    query = users.insert().values(username=username, email=email, hashed_password=hashed)
    user_id = await database.execute(query)
    return {"id": user_id, "username": username, "email": email}


async def authenticate_user(username: str, password: str):
    user = await get_user_by_username(username)
    if not user:
        return None
    if not pwd_context.verify(password, user["hashed_password"]):
        return None
    return user


async def create_note_for_user(owner_id: int, title: str, content: str):
    query = notes.insert().values(title=title, content=content, owner_id=owner_id)
    note_id = await database.execute(query)
    return {"id": note_id, "title": title, "content": content, "owner_id": owner_id}


async def get_notes_for_user(owner_id: int):
    query = notes.select().where(notes.c.owner_id == owner_id)
    return await database.fetch_all(query)


async def get_note(note_id: int):
    query = notes.select().where(notes.c.id == note_id)
    return await database.fetch_one(query)


async def update_note(note_id: int, title: str, content: str):
    query = notes.update().where(notes.c.id == note_id).values(title=title, content=content)
    await database.execute(query)
    return await get_note(note_id)


async def delete_note(note_id: int):
    query = notes.delete().where(notes.c.id == note_id)
    await database.execute(query)
    return True


async def create_document_for_user(owner_id: int, original_filename: str, file_type: str, file_size: int):
    # Generate unique filename
    file_extension = os.path.splitext(original_filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    now = datetime.utcnow()
    query = documents.insert().values(
        filename=unique_filename,
        original_filename=original_filename,
        file_type=file_type,
        file_size=file_size,
        owner_id=owner_id,
        created_at=now,
        updated_at=now
    )
    doc_id = await database.execute(query)
    
    return {
        "id": doc_id,
        "filename": unique_filename,
        "original_filename": original_filename,
        "file_type": file_type,
        "file_size": file_size,
        "owner_id": owner_id,
        "created_at": now,
        "updated_at": now
    }


async def get_documents_for_user(owner_id: int):
    query = documents.select().where(documents.c.owner_id == owner_id).order_by(documents.c.created_at.desc())
    return await database.fetch_all(query)


async def get_document(document_id: int):
    query = documents.select().where(documents.c.id == document_id)
    return await database.fetch_one(query)


async def update_document_analysis(document_id: int, extracted_text: str, ai_analysis: str, confidence: float):
    now = datetime.utcnow()
    query = documents.update().where(documents.c.id == document_id).values(
        extracted_text=extracted_text,
        ai_analysis=ai_analysis,
        analysis_confidence=confidence,
        updated_at=now
    )
    await database.execute(query)
    return await get_document(document_id)


async def delete_document(document_id: int):
    query = documents.delete().where(documents.c.id == document_id)
    await database.execute(query)
    return True
