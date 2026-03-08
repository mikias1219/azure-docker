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

    env_vars = [
        {"name": "AZURE_FORM_RECOGNIZER_ENDPOINT", "value": os.environ.get("AZURE_FORM_RECOGNIZER_ENDPOINT", "")},
        {"name": "AZURE_FORM_RECOGNIZER_KEY", "value": os.environ.get("AZURE_FORM_RECOGNIZER_KEY", "")},
        {"name": "AZURE_LANGUAGE_ENDPOINT", "value": os.environ.get("AZURE_LANGUAGE_ENDPOINT", "")},
        {"name": "AZURE_LANGUAGE_KEY", "value": os.environ.get("AZURE_LANGUAGE_KEY", "")},
        {"name": "AZURE_QNA_PROJECT_NAME", "value": os.environ.get("AZURE_QNA_PROJECT_NAME", "LearnFAQ")},
        {"name": "AZURE_QNA_DEPLOYMENT_NAME", "value": os.environ.get("AZURE_QNA_DEPLOYMENT_NAME", "production")},
        {"name": "OPENAI_API_KEY", "value": os.environ.get("OPENAI_API_KEY", "")},
        {"name": "OPENAI_API_BASE", "value": os.environ.get("OPENAI_API_BASE", "")},
        {"name": "OPENAI_DEPLOYMENT_NAME", "value": os.environ.get("OPENAI_DEPLOYMENT_NAME", "")},
        {"name": "OPENAI_API_VERSION", "value": os.environ.get("OPENAI_API_VERSION", "2024-02-15-preview")},
        {"name": "AZURE_AI_VISION_ENDPOINT", "value": os.environ.get("AZURE_AI_VISION_ENDPOINT", "")},
        {"name": "AZURE_AI_VISION_KEY", "value": os.environ.get("AZURE_AI_VISION_KEY", "")},
    ]
    data["properties"]["containers"][0]["properties"]["environmentVariables"] = env_vars

    with open(OUTPUT_PATH, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
