"""
Thin wrapper: use the same FastAPI app as main_new so uvicorn main:app and main_new:app behave identically.
All routes, DB, and Azure integrations live in main_new.
"""
from main_new import app

__all__ = ["app"]
