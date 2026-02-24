from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Hello from simplified FastAPI! If you see this, the core app runs."}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# from app import db, crud, schemas, auth
# ... rest commented out ...
