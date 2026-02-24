import sys
import os
import time

# ABSOLUTELY FIRST THING: print to both stdout and stderr
print("LOG: [stdout] Container entrypoint starting...", flush=True)
print("LOG: [stderr] Container entrypoint starting...", file=sys.stderr, flush=True)

# Give Azure Log Analytics a moment to breathe
time.sleep(2)

print(f"LOG: ENV: DATABASE_URL={os.getenv('DATABASE_URL')}", file=sys.stderr, flush=True)
print(f"LOG: PWD: {os.getcwd()}", file=sys.stderr, flush=True)
print(f"LOG: LISTING: {os.listdir('.')}", file=sys.stderr, flush=True)

try:
    print("LOG: Importing basic dependencies...", file=sys.stderr, flush=True)
    from fastapi import FastAPI, Depends, HTTPException, status
    from fastapi.security import OAuth2PasswordRequestForm
    import logging
    print("LOG: Basic dependencies imported.", file=sys.stderr, flush=True)
    
    print("LOG: Importing app modules...", file=sys.stderr, flush=True)
    from app import db, crud, schemas, auth
    print("LOG: App modules imported.", file=sys.stderr, flush=True)
except Exception as e:
    print(f"CRITICAL ERROR during import: {e}", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO, stream=sys.stderr, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="FastAPI Azure Sample")

@app.on_event("startup")
async def startup():
    logger.info("Application startup event triggered.")
    
    # Retry logic for table creation
    for i in range(5):
        try:
            logger.info(f"Attempting to create tables (attempt {i+1})...")
            db.create_tables()
            logger.info("Database tables verified/created.")
            break
        except Exception as e:
            logger.error(f"Failed to create tables: {e}")
            if i == 4:
                logger.critical("Final table creation attempt failed.")
                # sys.exit(1) # Consider exiting if tables can't be created
            else:
                time.sleep(5)
    
    # Retry logic for database connection
    for i in range(5):
        try:
            logger.info(f"Attempting to connect to database (attempt {i+1})...")
            await db.database.connect()
            logger.info("Connected to database successfully.")
            return
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            if i == 4:
                logger.critical("Final database connection attempt failed.")
                # sys.exit(1)
            else:
                time.sleep(5)

@app.on_event("shutdown")
async def shutdown():
    await db.database.disconnect()
    logger.info("Database connection closed.")

@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI on Azure ACI! The environment is stable."}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/register", response_model=schemas.UserOut)
async def register(user: schemas.UserCreate):
    existing = await crud.get_user_by_username(user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    existing_email = await crud.get_user_by_email(user.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await crud.create_user(user.username, user.email, user.password)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await crud.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=schemas.UserOut)
async def read_me(current_user=Depends(auth.get_current_user)):
    return current_user

@app.post("/notes", response_model=schemas.NoteOut)
async def create_note(note: schemas.NoteCreate, current_user=Depends(auth.get_current_user)):
    return await crud.create_note_for_user(current_user["id"], note.title, note.content)

@app.get("/notes", response_model=list[schemas.NoteOut])
async def list_notes(current_user=Depends(auth.get_current_user)):
    return await crud.get_notes_for_user(current_user["id"])

@app.get("/notes/{note_id}", response_model=schemas.NoteOut)
async def get_note(note_id: int, current_user=Depends(auth.get_current_user)):
    note = await crud.get_note(note_id)
    if not note or note["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note

@app.put("/notes/{note_id}", response_model=schemas.NoteOut)
async def update_note_endpoint(note_id: int, note_in: schemas.NoteCreate, current_user=Depends(auth.get_current_user)):
    note = await crud.get_note(note_id)
    if not note or note["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return await crud.update_note(note_id, note_in.title, note_in.content)

@app.delete("/notes/{note_id}")
async def delete_note_endpoint(note_id: int, current_user=Depends(auth.get_current_user)):
    note = await crud.get_note(note_id)
    if not note or note["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    await crud.delete_note(note_id)
    return {"ok": True}
