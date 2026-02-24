from .models import users, notes
from .db import database
from passlib.context import CryptContext
from sqlalchemy import select

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
