import sys
import os
import time

print("LOG: Starting app initialization...", flush=True)
time.sleep(2) # Give ACI logging time

try:
    print("LOG: Importing dependencies...", flush=True)
    from fastapi import FastAPI, Depends, HTTPException, status
    from fastapi.security import OAuth2PasswordRequestForm
    print("LOG: FastAPI/OAuth2 imported.", flush=True)
    
    from app import db, crud, schemas, auth
    print("LOG: App modules imported.", flush=True)
except Exception as e:
    print(f"ERROR: Import failure: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)

app = FastAPI()
print("LOG: FastAPI object created.", flush=True)

@app.on_event("startup")
async def startup():
    print("LOG: Startup event triggered.", flush=True)
    try:
        print("LOG: Initializing tables...", flush=True)
        db.create_tables()
        print("LOG: Tables initialized successfully.", flush=True)
    except Exception as e:
        print(f"ERROR: Table initialization failure: {e}", flush=True)
        # traceback.print_exc()
    
    try:
        print("LOG: Connecting to database...", flush=True)
        await db.database.connect()
        print("LOG: Database connected successfully.", flush=True)
    except Exception as e:
        print(f"ERROR: Database connection failure: {e}", flush=True)
        # traceback.print_exc()

@app.on_event("shutdown")
async def shutdown():
    await db.database.disconnect()

@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI on Azure ACI! The Neural stack is finally stable!"}

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
    created = await crud.create_user(user.username, user.email, user.password)
    return {"id": created["id"], "username": created["username"], "email": created["email"]}

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

@app.get("/notes/{note_id}", response_model=schemas.NoteOut)
async def get_note(note_id: int, current_user=Depends(auth.get_current_user)):
    note = await crud.get_note(note_id)
    if not note or note["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return note

@app.put("/notes/{note_id}", response_model=schemas.NoteOut)
async def update_note_endpoint(note_id: int, note_in: schemas.NoteCreate, current_user=Depends(auth.get_current_user)):
    note = await crud.get_note(note_id)
    if not note or note["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return await crud.update_note(note_id, note_in.title, note_in.content)

@app.delete("/notes/{note_id}")
async def delete_note_endpoint(note_id: int, current_user=Depends(auth.get_current_user)):
    note = await crud.get_note(note_id)
    if not note or note["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    await crud.delete_note(note_id)
    return {"ok": True}
