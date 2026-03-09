# Azure Resources for This Project

This app uses multiple Azure AI services (including features from [mslearn-ai-information-extraction](https://github.com/microsoftlearning/mslearn-ai-information-extraction)). Create them in a single resource group (e.g. `AI-102`) and wire endpoints/keys into the app via environment variables or GitHub secrets for CI/CD.

## One-command: Create all services

From the repo root, after `az login`:

```bash
chmod +x scripts/create_all_azure_services.sh
./scripts/create_all_azure_services.sh
```

This creates (if missing): resource group, ACR, Document Intelligence, OpenAI, Azure AI Language, Azure AI Vision, **Azure AI Search**. Then run `./setup-secrets.sh` to push all endpoint/key secrets to GitHub.

**After creating OpenAI**, in [Azure OpenAI Studio](https://oai.azure.com) create two deployments in your openai-ai102 resource:
- **Chat**: e.g. `gpt-35-turbo` or `gpt-4` → set as `OPENAI_DEPLOYMENT_NAME` (or leave default in setup-secrets).
- **Embeddings**: e.g. `text-embedding-ada-002` → set as `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME` (required for RAG).

---

## Required Resources (create in order, or use script above)

Run after: `az login` and optionally `az account set -s <subscription>`.

### 1. Resource group

```bash
az group create --name AI-102 --location eastus
```

### 2. Container Registry (for Docker images and CI/CD)

```bash
az acr create --name selamnew --resource-group AI-102 --location eastus --sku Basic
```

### 3. Document Intelligence (Form Recognizer)

```bash
az cognitiveservices account create \
  --name document-intelligence-ai102 \
  --resource-group AI-102 \
  --location eastus \
  --kind FormRecognizer \
  --sku S0
```

### 4. Azure OpenAI

```bash
az cognitiveservices account create \
  --name openai-ai102 \
  --resource-group AI-102 \
  --location eastus \
  --kind OpenAI \
  --sku S0
```

Then in **Azure OpenAI Studio**: deploy a **chat** model (e.g. gpt-35-turbo, gpt-4) and an **embedding** model (e.g. text-embedding-ada-002). Set `OPENAI_DEPLOYMENT_NAME` (chat) and `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME` (embedding) in GitHub secrets.

### 5. Azure AI Language (Text Analytics, QnA, CLU)

```bash
az cognitiveservices account create \
  --name language-ai102 \
  --resource-group AI-102 \
  --location eastus \
  --kind TextAnalytics \
  --sku S
```

For CLU “Clock” and QnA, run the setup scripts after this resource exists (see README / DEPLOYMENT_CHECKLIST).

### 6. Azure AI Vision (Computer Vision / Image Analysis)

```bash
az cognitiveservices account create \
  --name ai-vision-ai102 \
  --resource-group AI-102 \
  --location eastus \
  --kind ComputerVision \
  --sku S1
```

### 7. Azure AI Search (Knowledge Mining + RAG)

```bash
./scripts/create_azure_search.sh
# or:
az search service create --name ai102search --resource-group AI-102 --location eastus --sku basic
```

Used by **Knowledge Mining** (keyword search) and **RAG Q&A** (vector + keyword search). The app creates the RAG index on first use (POST /api/rag/ensure-index) or when ingesting documents.

---

## Assess All Resources

From the repo root:

```bash
chmod +x scripts/assess_azure_resources.sh
./scripts/assess_azure_resources.sh
```

This script checks that each resource exists and prints create commands for any that are missing. It does **not** create resources; run the commands it suggests.

---

## GitHub Secrets (for CI/CD)

After resources exist, run:

```bash
./setup-secrets.sh
```

This logs you into Azure and GitHub, then sets these repository secrets:

| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | Service principal JSON for GitHub Actions |
| `ACR_USERNAME` / `ACR_PASSWORD` | ACR login for pushing images |
| `AZURE_FORM_RECOGNIZER_ENDPOINT` / `AZURE_FORM_RECOGNIZER_KEY` | Document Intelligence |
| `OPENAI_API_KEY` / `OPENAI_API_BASE` / `OPENAI_DEPLOYMENT_NAME` / `OPENAI_API_VERSION` | Azure OpenAI |
| `AZURE_LANGUAGE_ENDPOINT` / `AZURE_LANGUAGE_KEY` | Azure AI Language (Text, QnA, CLU) |
| `AZURE_QNA_PROJECT_NAME` / `AZURE_QNA_DEPLOYMENT_NAME` | QnA knowledge base |
| `AZURE_AI_VISION_ENDPOINT` / `AZURE_AI_VISION_KEY` | Azure AI Vision (Computer Vision) |

If a resource (e.g. Language or AI Vision) does not exist yet, the script skips that resource and still sets the others.

---

## Microsoft Learn – AI Vision

The lab content and exercises for **Azure AI Vision** (analyze images, OCR, etc.) are in the Microsoft Learn repo:

- **Repo:** [MicrosoftLearning/mslearn-ai-vision](https://github.com/MicrosoftLearning/mslearn-ai-vision)
- **Learn path:** [Create computer vision solutions with Azure AI Vision](https://learn.microsoft.com/training/paths/create-computer-vision-solutions-azure-ai/)

This project’s **AI Vision** tab uses the same Azure AI Vision (Image Analysis) API as in that path. You can clone the Learn repo locally for reference:

```bash
git clone https://github.com/MicrosoftLearning/mslearn-ai-vision.git _mslearn-ai-vision
```

The folder `_mslearn-ai-vision` is in `.gitignore` so it is not committed to this repo.
