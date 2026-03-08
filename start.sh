#!/usr/bin/env bash
# Log startup and capture crash tracebacks so ACI logs show the real error
set -e
echo "Starting application (port 8000)..."
exec python -c "
import sys
import traceback
print('Loading app module...', flush=True)
try:
    from main_new import app
    print('App loaded, starting uvicorn on 0.0.0.0:8000...', flush=True)
except Exception:
    traceback.print_exc()
    sys.exit(1)
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8000)
"
