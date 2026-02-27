from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


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


class DocumentCreate(BaseModel):
    filename: str
    original_filename: str
    file_type: str
    file_size: int


class DocumentOut(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    extracted_text: Optional[str]
    ai_analysis: Optional[str]
    analysis_confidence: Optional[float]
    owner_id: int
    created_at: datetime
    updated_at: datetime


class DocumentAnalysis(BaseModel):
    extracted_text: Optional[str]
    ai_analysis: Optional[str]
    analysis_confidence: Optional[float]
