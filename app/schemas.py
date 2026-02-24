from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""


class NoteOut(BaseModel):
    id: int
    title: str
    content: Optional[str]
    owner_id: int
