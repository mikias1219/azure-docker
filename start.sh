#!/usr/bin/env bash
# Log startup and capture crash tracebacks so ACI logs show the real error
set -e
echo "BOOT start.sh" 1>&2
echo "[start.sh] Starting on 0.0.0.0:8000" 1>&2
cd /app
exec python -u -c "
import sys
import traceback
# First thing: confirm process started (unbuffered)
sys.stdout.write('PYTHON_START\n')
sys.stdout.flush()
sys.stderr.write('PYTHON_START\n')
sys.stderr.flush()
try:
    from main_new import app
    sys.stderr.write('APP_LOADED\n')
    sys.stderr.flush()
except Exception as e:
    sys.stderr.write('CRASH: ' + type(e).__name__ + ': ' + str(e) + '\n')
    traceback.print_exc(file=sys.stderr)
    sys.stderr.flush()
    sys.exit(1)
import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8000)
"
