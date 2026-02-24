import sys
import time

print("STDOUT: Application starting...", flush=True)
print("STDERR: Application starting...", file=sys.stderr, flush=True)

try:
    from fastapi import FastAPI
    print("STDOUT: FastAPI imported.", flush=True)
    app = FastAPI()
    print("STDOUT: app object created.", flush=True)
except Exception as e:
    print(f"STDOUT: Error: {e}", flush=True)
    sys.exit(1)

@app.get("/")
async def root():
    return {"message": "hello"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=80)
else:
    print("STDOUT: Running via uvicorn module shortcut", flush=True)

# Stay alive for a bit to ensure logs are caught
time.sleep(30)
print("STDOUT: Finished 30s sleep", flush=True)
