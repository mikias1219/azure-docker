import os
from databases import Database
from sqlalchemy import MetaData, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")

database = Database(DATABASE_URL)
metadata = MetaData()
engine = create_engine(DATABASE_URL)


def create_tables():
    from . import models
    metadata.create_all(engine)
