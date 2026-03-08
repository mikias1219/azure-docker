#!/usr/bin/env python3
"""
Check which Azure/backend services are configured and optionally reachable.
Run from repo root with the same env as the app (e.g. .env or deployment env).
Usage: python scripts/check_services.py
"""
import os
import sys

# Load app env (optional .env)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def main():
    # Import app services (requires PYTHONPATH or run from repo root)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    from app.azure_services import document_intelligence
    from app.text_analytics import text_analytics
    from app.question_answering import question_answering
    from app.clock_service import clock_service
    from app.ai_vision_service import ai_vision

    status = {
        "document_intelligence": document_intelligence.client is not None,
        "openai": getattr(document_intelligence, "openai_client", None) is not None,
        "text_analytics": text_analytics.is_configured(),
        "qna": question_answering.is_configured(),
        "clock": clock_service.client is not None,
        "vision": ai_vision.is_configured(),
    }

    print("Service configuration status (credentials present and client initialized):")
    print("-" * 50)
    for name, ok in status.items():
        label = "OK" if ok else "NOT CONFIGURED"
        print(f"  {name}: {label}")
    print("-" * 50)
    configured = sum(1 for v in status.values() if v)
    print(f"Configured: {configured}/{len(status)}")
    return 0 if configured > 0 else 1

if __name__ == "__main__":
    sys.exit(main())
