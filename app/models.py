from sqlalchemy import Table, Column, Integer, String, Text, ForeignKey
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
