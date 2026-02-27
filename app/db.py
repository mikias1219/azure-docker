import os
from databases import Database
from sqlalchemy import MetaData, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

database = Database(DATABASE_URL)
metadata = MetaData()

# For SQLite, we need to check_same_thread=False
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)


def create_tables():
    from . import models
    metadata.create_all(engine)
