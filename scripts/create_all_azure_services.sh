#!/usr/bin/env bash
# Create all Azure services required for the app (mslearn-ai-info + Document Intelligence).
# Run once after: az login
# Usage: ./scripts/create_all_azure_services.sh

set -e

RESOURCE_GROUP="${RESOURCE_GROUP:-AI-102}"
LOCATION="${LOCATION:-eastus}"
ACR_NAME="${ACR_NAME:-selamnew}"
SEARCH_NAME="${SEARCH_NAME:-ai102search}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()      { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_fail()    { echo -e "${RED}[FAIL]${NC} $1"; }

echo ""
log_info "Creating Azure resources in group: $RESOURCE_GROUP ($LOCATION)"
echo ""

# 1. Resource group
if az group show --name "$RESOURCE_GROUP" &>/dev/null; then
  log_ok "Resource group already exists: $RESOURCE_GROUP"
else
  log_info "Creating resource group: $RESOURCE_GROUP"
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
  log_ok "Created resource group: $RESOURCE_GROUP"
fi

# 2. Container Registry (for deploy)
if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  log_ok "ACR already exists: $ACR_NAME"
else
  log_info "Creating ACR: $ACR_NAME"
  az acr create --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" --sku Basic --output none
  log_ok "Created ACR: $ACR_NAME"
fi

# 3. Document Intelligence (Form Recognizer)
if az cognitiveservices account show --name document-intelligence-ai102 --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  log_ok "Document Intelligence already exists: document-intelligence-ai102"
else
  log_info "Creating Document Intelligence: document-intelligence-ai102"
  az cognitiveservices account create \
    --name document-intelligence-ai102 \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --kind FormRecognizer \
    --sku S0 \
    --yes --output none
  log_ok "Created Document Intelligence"
fi

# 4. Azure OpenAI
if az cognitiveservices account show --name openai-ai102 --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  log_ok "OpenAI already exists: openai-ai102"
else
  log_info "Creating Azure OpenAI: openai-ai102"
  az cognitiveservices account create \
    --name openai-ai102 \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --kind OpenAI \
    --sku S0 \
    --yes --output none
  log_ok "Created Azure OpenAI (deploy chat + embedding models in Azure OpenAI Studio)"
fi

# 5. Azure AI Language (Text Analytics, QnA, CLU)
for LANG_NAME in language-ai102 ai-language-ai102; do
  if az cognitiveservices account show --name "$LANG_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    log_ok "Azure AI Language already exists: $LANG_NAME"
    break
  fi
done
if ! az cognitiveservices account show --name language-ai102 --resource-group "$RESOURCE_GROUP" &>/dev/null && \
   ! az cognitiveservices account show --name ai-language-ai102 --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  log_info "Creating Azure AI Language: language-ai102"
  az cognitiveservices account create \
    --name language-ai102 \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --kind TextAnalytics \
    --sku S \
    --yes --output none
  log_ok "Created Azure AI Language"
fi

# 6. Azure AI Vision (Computer Vision)
if az cognitiveservices account show --name ai-vision-ai102 --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  log_ok "Azure AI Vision already exists: ai-vision-ai102"
else
  log_info "Creating Azure AI Vision: ai-vision-ai102"
  az cognitiveservices account create \
    --name ai-vision-ai102 \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --kind ComputerVision \
    --sku S1 \
    --yes --output none
  log_ok "Created Azure AI Vision"
fi

# 7. Azure AI Search (Knowledge Mining + RAG)
EXISTING_SEARCH=$(az search service list --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || true)
if [ -n "$EXISTING_SEARCH" ]; then
  log_ok "Azure AI Search already exists: $EXISTING_SEARCH (use this name for AZURE_SEARCH_ENDPOINT/KEY)"
  SEARCH_NAME="$EXISTING_SEARCH"
elif az search service show --name "$SEARCH_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  log_ok "Azure AI Search already exists: $SEARCH_NAME"
else
  log_info "Creating Azure AI Search: $SEARCH_NAME"
  if ! az search service create \
    --name "$SEARCH_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku basic \
    --output none 2>/dev/null; then
    # Name may be globally taken; try alternate
    ALT_NAME="docint-search-$(echo "$RESOURCE_GROUP" | tr '[:upper:]' '[:lower:]' | tr -d '-')"
    log_info "Trying alternate name: $ALT_NAME"
    az search service create \
      --name "$ALT_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --location "$LOCATION" \
      --sku basic \
      --output none
    SEARCH_NAME="$ALT_NAME"
  fi
  log_ok "Created Azure AI Search: $SEARCH_NAME"
fi

echo ""
log_ok "All Azure services are ready."
echo ""
echo "Next steps:"
echo "  1. In Azure OpenAI Studio, create deployments:"
echo "     - Chat: e.g. gpt-35-turbo or gpt-4 (set OPENAI_DEPLOYMENT_NAME in secrets)"
echo "     - Embeddings: e.g. text-embedding-ada-002 (set AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME)"
echo "  2. Run: ./setup-secrets.sh   # pushes all endpoint/key secrets to GitHub"
echo "  3. Push to main to deploy."
echo ""
