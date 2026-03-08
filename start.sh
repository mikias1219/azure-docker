#!/usr/bin/env bash
# Start app; on import failure run minimal /health server so container stays up and URL works
set -e
echo "BOOT" 1>&2
cd /app
exec python -u -c "
import sys
import traceback
from datetime import datetime

try:
    from main_new import app
    sys.stderr.write('APP_LOADED\n')
    sys.stderr.flush()
except Exception as e:
    sys.stderr.write('FALLBACK: ' + type(e).__name__ + ': ' + str(e) + '\n')
    traceback.print_exc(file=sys.stderr)
    sys.stderr.flush()
    from fastapi import FastAPI
    app = FastAPI()
    @app.get('/health')
    def health():
        return {'status': 'degraded', 'message': 'Full app failed to load', 'timestamp': datetime.utcnow().isoformat()}
    @app.get('/')
    def root():
        return {'message': 'App in fallback mode. Check /health. Full app failed to load at startup.'}

import uvicorn
uvicorn.run(app, host='0.0.0.0', port=8000)
"
