#!/usr/bin/env bash
# Assess Azure resources required for this project.
# Run after: az login
# Usage: ./scripts/assess_azure_resources.sh

set -e

RESOURCE_GROUP="${RESOURCE_GROUP:-AI-102}"
LOCATION="${LOCATION:-eastus}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[MISS]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }

echo ""
info "Assessing Azure resources for resource group: $RESOURCE_GROUP"
info "Make sure you have run: az login"
echo ""

# Check logged in
if ! az account show &>/dev/null; then
  fail "Not logged in. Run: az login"
  exit 1
fi
SUB=$(az account show --query name -o tsv)
info "Subscription: $SUB"
echo ""

# Resource group
if az group show --name "$RESOURCE_GROUP" &>/dev/null; then
  ok "Resource group: $RESOURCE_GROUP"
else
  fail "Resource group: $RESOURCE_GROUP (create with: az group create -n $RESOURCE_GROUP -l $LOCATION)"
fi

# ACR
if az acr show --name selamnew --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  ok "Container Registry: selamnew"
else
  fail "ACR selamnew (create with: az acr create -n selamnew -g $RESOURCE_GROUP -l $LOCATION --sku Basic)"
fi

# Document Intelligence (Form Recognizer)
if az cognitiveservices account show --name document-intelligence-ai102 --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  ok "Document Intelligence: document-intelligence-ai102"
else
  fail "Document Intelligence (create with: az cognitiveservices account create -n document-intelligence-ai102 -g $RESOURCE_GROUP -l $LOCATION --kind FormRecognizer --sku S)"
fi

# OpenAI
if az cognitiveservices account show --name openai-ai102 --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  ok "OpenAI: openai-ai102"
else
  fail "OpenAI (create with: az cognitiveservices account create -n openai-ai102 -g $RESOURCE_GROUP -l $LOCATION --kind OpenAI --sku S0)"
fi

# Azure AI Language (Text Analytics, QnA, CLU)
if az cognitiveservices account show --name language-ai102 --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  ok "Azure AI Language: language-ai102"
elif az cognitiveservices account show --name ai-language-ai102 --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  ok "Azure AI Language: ai-language-ai102"
elif az cognitiveservices account show --name azure-language-ai102 --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  ok "Azure AI Language: azure-language-ai102"
else
  fail "Azure AI Language (create TextAnalytics: az cognitiveservices account create -n language-ai102 -g $RESOURCE_GROUP -l $LOCATION --kind TextAnalytics --sku S)"
fi

# Azure AI Vision (Computer Vision / Image Analysis)
if az cognitiveservices account show --name ai-vision-ai102 --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  ok "Azure AI Vision: ai-vision-ai102"
else
  fail "Azure AI Vision (create with: az cognitiveservices account create -n ai-vision-ai102 -g $RESOURCE_GROUP -l $LOCATION --kind ComputerVision --sku S1)"
fi

# Azure AI Search (Knowledge Mining / RAG)
SEARCH_NAME="${SEARCH_NAME:-ai102search}"
EXISTING_SEARCH=$(az search service list --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || true)
if [ -n "$EXISTING_SEARCH" ]; then
  ok "Azure AI Search: $EXISTING_SEARCH"
  SEARCH_NAME="$EXISTING_SEARCH"
elif az search service show --name "$SEARCH_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  ok "Azure AI Search: $SEARCH_NAME"
else
  fail "Azure AI Search (run: ./scripts/create_azure_search.sh or az search service create -n $SEARCH_NAME -g $RESOURCE_GROUP -l $LOCATION --sku basic)"
fi

# Azure AI Speech (transcription & synthesis)
SPEECH_FOUND=""
for SN in ai-speech-ai102 docint-speech-service; do
  if az cognitiveservices account show --name "$SN" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    ok "Azure AI Speech: $SN"
    SPEECH_FOUND="true"
    break
  fi
done
if [ -z "$SPEECH_FOUND" ]; then
  fail "Azure AI Speech (create with: az cognitiveservices account create -n ai-speech-ai102 -g $RESOURCE_GROUP -l $LOCATION --kind SpeechServices --sku S0 --yes)"
fi

echo ""
info "Endpoint and key commands (use the Language resource name you have):"
echo "  Document Intelligence: az cognitiveservices account show -n document-intelligence-ai102 -g $RESOURCE_GROUP --query properties.endpoint -o tsv"
echo "  OpenAI:                az cognitiveservices account show -n openai-ai102 -g $RESOURCE_GROUP --query properties.endpoint -o tsv"
echo "  Language:              az cognitiveservices account show -n ai-language-ai102 -g $RESOURCE_GROUP --query properties.endpoint -o tsv"
echo "  AI Vision:             az cognitiveservices account show -n ai-vision-ai102 -g $RESOURCE_GROUP --query properties.endpoint -o tsv"
echo "  Azure Search:          az search service show -n $SEARCH_NAME -g $RESOURCE_GROUP --query endpoint -o tsv"
echo "  Speech:                az cognitiveservices account show -n docint-speech-service -g $RESOURCE_GROUP --query properties.endpoint -o tsv (or ai-speech-ai102)"
echo ""
info "Then run ./setup-secrets.sh to push credentials to GitHub secrets for CI/CD."
info "RAG uses index name: rag-content-index (created by app at runtime if missing)."
echo ""
