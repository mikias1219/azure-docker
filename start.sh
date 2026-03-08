#!/usr/bin/env bash
# Log startup and capture crash tracebacks so ACI logs show the real error
set -e
echo "[start.sh] Starting application on 0.0.0.0:8000..."
cd /app
exec python -c "
import sys
import traceback
print('[start.sh] Loading app module...', flush=True)
try:
    from main_new import app
    print('[start.sh] App loaded, starting uvicorn...', flush=True)
except Exception:
    print('[start.sh] CRASH on import:', flush=True)
    traceback.print_exc()
    sys.exit(1)
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8000)
"
