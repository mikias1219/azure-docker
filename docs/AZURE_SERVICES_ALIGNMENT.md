# Azure Services Alignment

This document lists the Azure resources expected by the app, how they are created/assessed, and the environment variables used so everything stays aligned.

## Prerequisites

- **Azure CLI**: `az login` (you must be logged in).
- **Resource group**: Default `AI-102` (override with `RESOURCE_GROUP`).
- **Region**: Default `eastus` (override with `LOCATION`).

## Check alignment

Run the assessment script (uses same defaults as create/CI):

```bash
./scripts/assess_azure_resources.sh
```

Or with a custom resource group:

```bash
RESOURCE_GROUP=my-rg ./scripts/assess_azure_resources.sh
```

If anything shows `[MISS]`, create it with:

```bash
./scripts/create_all_azure_services.sh
```

---

## Services and names

| Service | Azure resource name(s) | Used in app for |
|--------|-------------------------|------------------|
| **Resource group** | `AI-102` (default) | All resources |
| **Container Registry** | `selamnew` | Docker push; CI uses `selamnew.azurecr.io` |
| **Document Intelligence** | `document-intelligence-ai102` | Form Recognizer: extract text, invoices, info extraction |
| **Azure OpenAI** | `openai-ai102` | Chat + embeddings (deployments created separately) |
| **Azure AI Language** | `language-ai102` or `ai-language-ai102` or `azure-language-ai102` | Text Analytics, QnA, CLU (Clock) |
| **Azure AI Vision** | `ai-vision-ai102` | Image analysis, OCR |
| **Azure AI Search** | First search service in RG (e.g. `selamnew` or `ai102search`) | Knowledge search + RAG index |
| **Azure AI Speech** | `ai-speech-ai102` or `docint-speech-service` | Transcription, TTS |

---

## Environment variables (aligned with scripts)

These are set by `./setup-secrets.sh` (local) or by CI from `get_credentials_for_ci.sh`.

| Variable | Source (script/resource) |
|----------|--------------------------|
| `AZURE_FORM_RECOGNIZER_ENDPOINT` | document-intelligence-ai102 |
| `AZURE_FORM_RECOGNIZER_KEY` | document-intelligence-ai102 |
| `OPENAI_API_KEY` | openai-ai102 |
| `OPENAI_API_BASE` | openai-ai102 |
| `OPENAI_DEPLOYMENT_NAME` | You set (e.g. `gpt-35-turbo`); create in Azure OpenAI Studio |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME` | You set (e.g. `text-embedding-ada-002`); create in Azure OpenAI Studio |
| `OPENAI_API_VERSION` | e.g. `2024-02-15-preview` |
| `AZURE_LANGUAGE_ENDPOINT` | language-ai102 or ai-language-ai102 |
| `AZURE_LANGUAGE_KEY` | same Language resource |
| `AZURE_QNA_PROJECT_NAME` | Your QnA project (e.g. `LearnFAQ`) |
| `AZURE_QNA_DEPLOYMENT_NAME` | e.g. `production` |
| `AZURE_AI_VISION_ENDPOINT` | ai-vision-ai102 |
| `AZURE_AI_VISION_KEY` | ai-vision-ai102 |
| `AZURE_SEARCH_ENDPOINT` | First search service in RG |
| `AZURE_SEARCH_KEY` | same Search service |
| `AZURE_SEARCH_INDEX_NAME` | Default `rag-content-index` (RAG creates this index at runtime) |
| `AZURE_SPEECH_KEY` | ai-speech-ai102 or docint-speech-service |
| `AZURE_SPEECH_REGION` | same Speech resource (location) |
| `SECRET_KEY` | Generated or set by you (JWT signing) |

---

## App usage summary

- **Backend** (`app/core/config.py`, `app/services_loader.py`, and service modules): Read the variables above from the environment.
- **RAG**: Uses index name `rag-content-index` (hardcoded in `app/rag_service.py`). The app creates this index if it does not exist.
- **Keyword search** (Knowledge Mining): Uses `AZURE_SEARCH_INDEX_NAME` (default `rag-content-index`).
- **CI/CD**: Workflow uses `RESOURCE_GROUP=AI-102` and runs `get_credentials_for_ci.sh` to populate credentials; `create_all_azure_services.sh` and `ensure_openai_deployments.sh` run in CI as needed.

---

## Quick verification after login

```bash
az login
./scripts/assess_azure_resources.sh
```

If all lines show `[OK]`, Azure resources are created and names are aligned. Then run `./setup-secrets.sh` to push secrets to GitHub (or set them manually), and ensure OpenAI chat/embedding deployments exist in Azure OpenAI Studio for your region.
