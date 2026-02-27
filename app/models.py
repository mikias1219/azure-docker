from sqlalchemy import Table, Column, Integer, String, Text, ForeignKey, DateTime, Float
from .db import metadata

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(50), unique=True, nullable=False),
    Column("email", String(120), unique=True, nullable=False),
    Column("hashed_password", String(128), nullable=False),
)

notes = Table(
    "notes",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String(200)),
    Column("content", Text),
    Column("owner_id", Integer, ForeignKey("users.id")),
)

documents = Table(
    "documents",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("filename", String(255), nullable=False),
    Column("original_filename", String(255), nullable=False),
    Column("file_type", String(50), nullable=False),
    Column("file_size", Integer, nullable=False),
    Column("extracted_text", Text),
    Column("ai_analysis", Text),
    Column("analysis_confidence", Float),
    Column("owner_id", Integer, ForeignKey("users.id"), nullable=False),
    Column("created_at", DateTime, nullable=False),
    Column("updated_at", DateTime, nullable=False),
)
