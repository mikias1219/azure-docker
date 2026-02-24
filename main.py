import sys
import time
import os

print("LOG: Python binary:", sys.executable, flush=True)
print("LOG: Python version:", sys.version, flush=True)
print("LOG: Current directory:", os.getcwd(), flush=True)
print("LOG: Directory contents:", os.listdir('.'), flush=True)

# Small delay to let ACI capture logs
time.sleep(5)

print("LOG: Starting imports...", flush=True)

try:
    print("LOG: Importing FastAPI...", flush=True)
    from fastapi import FastAPI, Depends, HTTPException, status
    print("LOG: FastAPI imported.", flush=True)
    
    print("LOG: Importing OAuth2...", flush=True)
    from fastapi.security import OAuth2PasswordRequestForm
    print("LOG: OAuth2 imported.", flush=True)
    
    print("LOG: Importing app.db...", flush=True)
    from app import db
    print("LOG: app.db imported.", flush=True)
    
    print("LOG: Importing app.crud...", flush=True)
    from app import crud
    print("LOG: app.crud imported.", flush=True)
    
    print("LOG: Importing app.schemas...", flush=True)
    from app import schemas
    print("LOG: app.schemas imported.", flush=True)
    
    print("LOG: Importing app.auth...", flush=True)
    from app import auth
    print("LOG: app.auth imported.", flush=True)
except Exception as e:
    print(f"ERROR: Import failure: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)

app = FastAPI()
print("LOG: Application object created.", flush=True)

@app.on_event("startup")
async def startup():
    print("LOG: Startup event...", flush=True)
    try:
        print("LOG: Running table creation...", flush=True)
        db.create_tables()
        print("LOG: Tables created.", flush=True)
    except Exception as e:
        print(f"ERROR: Table creation failure: {e}", flush=True)
    
    try:
        print("LOG: Connecting to database...", flush=True)
        await db.database.connect()
        print("LOG: Database connected.", flush=True)
    except Exception as e:
        print(f"ERROR: Database connection failure: {e}", flush=True)

@app.on_event("shutdown")
async def shutdown():
    await db.database.disconnect()

@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI on Azure ACI!"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/register", response_model=schemas.UserOut)
async def register(user: schemas.UserCreate):
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
    return {"id": current_user["id"], "username": current_user["username"], "email": current_user["email"]}

@app.post("/notes", response_model=schemas.NoteOut)
async def create_note(note: schemas.NoteCreate, current_user=Depends(auth.get_current_user)):
    created = await crud.create_note_for_user(current_user["id"], note.title, note.content)
    return created

@app.get("/notes", response_model=list[schemas.NoteOut])
async def list_notes(current_user=Depends(auth.get_current_user)):
    return await crud.get_notes_for_user(current_user["id"])
