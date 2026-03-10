from pydantic import BaseModel, EmailStr, field_serializer
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class DocumentBase(BaseModel):
    filename: str
    original_filename: str
    file_type: str
    file_size: int

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    owner_id: int
    extracted_text: Optional[str] = None
    ai_analysis: Optional[str] = None
    analysis_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, dt: datetime) -> str:
        return dt.isoformat()

    class Config:
        from_attributes = True

class DocumentUpdate(BaseModel):
    extracted_text: Optional[str] = None
    ai_analysis: Optional[str] = None
    analysis_confidence: Optional[float] = None


class SearchQuery(BaseModel):
    query: str = ""


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    reasoning: Optional[str] = None
    evidence: Optional[str] = None
    sources: Optional[list] = None
    debug: Optional[dict] = None
