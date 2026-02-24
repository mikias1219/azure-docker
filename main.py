from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI on Azure ACR!   and Neural stack is awesome!"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
    
