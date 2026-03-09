#!/usr/bin/env python3
"""
Generate aci/container-group-updated.json from the simple template and env vars.
Used by GitHub Actions deploy; run from repo root with env set (ACR_USER, ACR_PASS, DNS_LABEL, ACI_IMAGE, etc.).
"""
import json
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_PATH = REPO_ROOT / "aci" / "container-group-simple-template.json"
OUTPUT_PATH = REPO_ROOT / "aci" / "container-group-updated.json"


def main():
    with open(TEMPLATE_PATH, "r") as f:
        data = json.load(f)

    data["properties"]["imageRegistryCredentials"][0]["username"] = os.environ.get("ACR_USER", "")
    data["properties"]["imageRegistryCredentials"][0]["password"] = os.environ.get("ACR_PASS", "")
    data["properties"]["containers"][0]["properties"]["image"] = os.environ.get(
        "ACI_IMAGE", "selamnew.azurecr.io/document-intelligence-app:full"
    )
    data["properties"]["ipAddress"]["dnsNameLabel"] = os.environ.get("DNS_LABEL", "docint")

    def _env(name: str, value: str, secure: bool = False) -> dict:
        if secure:
            return {"name": name, "secureValue": value}
        return {"name": name, "value": value}

    env_vars = [
        _env("SECRET_KEY", os.environ.get("SECRET_KEY", "change-me-in-production"), secure=True),
        _env("DATABASE_URL", os.environ.get("DATABASE_URL", "sqlite:///./app.db")),
        _env("UPLOADS_DIR", os.environ.get("UPLOADS_DIR", "uploads")),
        _env("AZURE_FORM_RECOGNIZER_ENDPOINT", os.environ.get("AZURE_FORM_RECOGNIZER_ENDPOINT", "")),
        _env("AZURE_FORM_RECOGNIZER_KEY", os.environ.get("AZURE_FORM_RECOGNIZER_KEY", ""), secure=True),
        _env("AZURE_LANGUAGE_ENDPOINT", os.environ.get("AZURE_LANGUAGE_ENDPOINT", "")),
        _env("AZURE_LANGUAGE_KEY", os.environ.get("AZURE_LANGUAGE_KEY", ""), secure=True),
        _env("AZURE_QNA_PROJECT_NAME", os.environ.get("AZURE_QNA_PROJECT_NAME", "LearnFAQ")),
        _env("AZURE_QNA_DEPLOYMENT_NAME", os.environ.get("AZURE_QNA_DEPLOYMENT_NAME", "production")),
        _env("OPENAI_API_KEY", os.environ.get("OPENAI_API_KEY", ""), secure=True),
        _env("OPENAI_API_BASE", os.environ.get("OPENAI_API_BASE", "")),
        _env("OPENAI_DEPLOYMENT_NAME", os.environ.get("OPENAI_DEPLOYMENT_NAME", "")),
        _env("OPENAI_API_VERSION", os.environ.get("OPENAI_API_VERSION", "2024-02-15-preview")),
        _env("AZURE_AI_VISION_ENDPOINT", os.environ.get("AZURE_AI_VISION_ENDPOINT", "")),
        _env("AZURE_AI_VISION_KEY", os.environ.get("AZURE_AI_VISION_KEY", ""), secure=True),
        _env("AZURE_SEARCH_ENDPOINT", os.environ.get("AZURE_SEARCH_ENDPOINT", "")),
        _env("AZURE_SEARCH_KEY", os.environ.get("AZURE_SEARCH_KEY", ""), secure=True),
        _env("AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME", os.environ.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME", "")),
    ]
    container_props = data["properties"]["containers"][0]["properties"]
    container_props["environmentVariables"] = env_vars

    # Optional persistence (Azure File Share) for sqlite DB and uploads
    storage_account = os.environ.get("STORAGE_ACCOUNT_NAME", "").strip()
    storage_key = os.environ.get("STORAGE_ACCOUNT_KEY", "").strip()
    file_share = os.environ.get("FILE_SHARE_NAME", "").strip()
    mount_path = os.environ.get("MOUNT_PATH", "/mnt/data").strip() or "/mnt/data"
    if storage_account and storage_key and file_share:
        data["properties"]["volumes"] = [
            {
                "name": "persist",
                "azureFile": {
                    "shareName": file_share,
                    "storageAccountName": storage_account,
                    "storageAccountKey": storage_key,
                },
            }
        ]
        container_props["volumeMounts"] = [
            {"name": "persist", "mountPath": mount_path, "readOnly": False}
        ]

    with open(OUTPUT_PATH, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
