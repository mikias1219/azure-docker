#!/usr/bin/env bash
# Output deployment credentials from Azure to GITHUB_ENV (for use in GitHub Actions).
# Run after: az login. Requires: RESOURCE_GROUP (default AI-102).
# Usage: source this or run with . scripts/get_credentials_for_ci.sh
# Then all *_EXPORT vars are written to GITHUB_ENV if set; otherwise echo for eval.

set -e
RESOURCE_GROUP="${RESOURCE_GROUP:-AI-102}"
GITHUB_ENV="${GITHUB_ENV:-}"

mask_and_export() {
  local name="$1"
  local value="$2"
  [ -z "$value" ] && return
  if [ -n "$GITHUB_ENV" ]; then
    echo "::add-mask::$value"
    echo "${name}=${value}" >> "$GITHUB_ENV"
  else
    echo "export ${name}='${value}'"
  fi
}

# ACR
ACR_USER=$(az acr credential show --name selamnew --resource-group "$RESOURCE_GROUP" --query "username" -o tsv 2>/dev/null || true)
ACR_PASS=$(az acr credential show --name selamnew --resource-group "$RESOURCE_GROUP" --query "passwords[0].value" -o tsv 2>/dev/null || true)
mask_and_export "ACR_USERNAME" "$ACR_USER"
mask_and_export "ACR_PASSWORD" "$ACR_PASS"

# Document Intelligence
FR_ENDPOINT=$(az cognitiveservices account show --name document-intelligence-ai102 --resource-group "$RESOURCE_GROUP" --query "properties.endpoint" -o tsv 2>/dev/null || true)
FR_KEY=$(az cognitiveservices account keys list --name document-intelligence-ai102 --resource-group "$RESOURCE_GROUP" --query "key1" -o tsv 2>/dev/null || true)
mask_and_export "AZURE_FORM_RECOGNIZER_ENDPOINT" "$FR_ENDPOINT"
mask_and_export "AZURE_FORM_RECOGNIZER_KEY" "$FR_KEY"

# OpenAI
OPENAI_KEY=$(az cognitiveservices account keys list --name openai-ai102 --resource-group "$RESOURCE_GROUP" --query "key1" -o tsv 2>/dev/null || true)
OPENAI_BASE=$(az cognitiveservices account show --name openai-ai102 --resource-group "$RESOURCE_GROUP" --query "properties.endpoint" -o tsv 2>/dev/null || true)
mask_and_export "OPENAI_API_KEY" "$OPENAI_KEY"
mask_and_export "OPENAI_API_BASE" "$OPENAI_BASE"
mask_and_export "OPENAI_DEPLOYMENT_NAME" "${OPENAI_DEPLOYMENT_NAME:-gpt-35-turbo}"
mask_and_export "OPENAI_API_VERSION" "${OPENAI_API_VERSION:-2024-02-15-preview}"

# Azure AI Language (try multiple names)
for LANG_NAME in language-ai102 ai-language-ai102; do
  LANG_EP=$(az cognitiveservices account show --name "$LANG_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.endpoint" -o tsv 2>/dev/null || true)
  LANG_KEY=$(az cognitiveservices account keys list --name "$LANG_NAME" --resource-group "$RESOURCE_GROUP" --query "key1" -o tsv 2>/dev/null || true)
  if [ -n "$LANG_EP" ] && [ -n "$LANG_KEY" ]; then
    mask_and_export "AZURE_LANGUAGE_ENDPOINT" "$LANG_EP"
    mask_and_export "AZURE_LANGUAGE_KEY" "$LANG_KEY"
    break
  fi
done
mask_and_export "AZURE_QNA_PROJECT_NAME" "${AZURE_QNA_PROJECT_NAME:-LearnFAQ}"
mask_and_export "AZURE_QNA_DEPLOYMENT_NAME" "${AZURE_QNA_DEPLOYMENT_NAME:-production}"

# Azure AI Vision
AI_VISION_EP=$(az cognitiveservices account show --name ai-vision-ai102 --resource-group "$RESOURCE_GROUP" --query "properties.endpoint" -o tsv 2>/dev/null || true)
AI_VISION_KEY=$(az cognitiveservices account keys list --name ai-vision-ai102 --resource-group "$RESOURCE_GROUP" --query "key1" -o tsv 2>/dev/null || true)
mask_and_export "AZURE_AI_VISION_ENDPOINT" "$AI_VISION_EP"
mask_and_export "AZURE_AI_VISION_KEY" "$AI_VISION_KEY"

# Azure AI Search (first in RG)
SEARCH_NAME=$(az search service list --resource-group "$RESOURCE_GROUP" --query "[0].name" -o tsv 2>/dev/null || true)
if [ -n "$SEARCH_NAME" ]; then
  SEARCH_EP=$(az search service show --name "$SEARCH_NAME" --resource-group "$RESOURCE_GROUP" --query "endpoint" -o tsv 2>/dev/null || true)
  SEARCH_KEY=$(az search admin-key show --resource-group "$RESOURCE_GROUP" --service-name "$SEARCH_NAME" --query "primaryKey" -o tsv 2>/dev/null || true)
  mask_and_export "AZURE_SEARCH_ENDPOINT" "$SEARCH_EP"
  mask_and_export "AZURE_SEARCH_KEY" "$SEARCH_KEY"
fi
mask_and_export "AZURE_SEARCH_INDEX_NAME" "${AZURE_SEARCH_INDEX_NAME:-ai102-index}"
mask_and_export "AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME" "${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME:-text-embedding-ada-002}"

# Azure AI Speech
for SPEECH_NAME in ai-speech-ai102 docint-speech-service; do
  AI_SPEECH_EP=$(az cognitiveservices account show --name "$SPEECH_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.endpoint" -o tsv 2>/dev/null || true)
  AI_SPEECH_KEY=$(az cognitiveservices account keys list --name "$SPEECH_NAME" --resource-group "$RESOURCE_GROUP" --query "key1" -o tsv 2>/dev/null || true)
  AI_SPEECH_REGION=$(az cognitiveservices account show --name "$SPEECH_NAME" --resource-group "$RESOURCE_GROUP" --query "location" -o tsv 2>/dev/null || true)
  if [ -n "$AI_SPEECH_KEY" ]; then
    mask_and_export "AZURE_SPEECH_KEY" "$AI_SPEECH_KEY"
    mask_and_export "AZURE_SPEECH_REGION" "$AI_SPEECH_REGION"
    break
  fi
done

echo "Credentials exported to GITHUB_ENV (or echoed if not in GHA)."
