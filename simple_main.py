from fastapi import FastAPI
from fastapi.responses import JSONResponse
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Document Intelligence App", version="1.0.0")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Document Intelligence App is running!",
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2025-02-27T10:23:00Z",
        "version": "1.0.0"
    }

@app.get("/test")
async def test_endpoint():
    """Test endpoint to verify deployment"""
    return {
        "message": "Test successful!",
        "container": "Azure Container Instance",
        "resource_group": "AI-102",
        "deployment": "automated"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=80)
