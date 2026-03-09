#!/usr/bin/env bash
# Ensure Azure OpenAI deployments exist (chat + embeddings).
# This removes the need to create deployments manually in Azure OpenAI Studio.
#
# Requires:
# - az login already done
# - Azure OpenAI account exists (default: openai-ai102 in AI-102)
#
# Config via env:
# - RESOURCE_GROUP (default AI-102)
# - OPENAI_ACCOUNT_NAME (default openai-ai102)
# - OPENAI_DEPLOYMENT_NAME (chat deployment name, default gpt-35-turbo)
# - OPENAI_CHAT_MODEL_NAME (default gpt-35-turbo)
# - OPENAI_CHAT_MODEL_VERSIONS (space-separated, default: 0613 1106 0125 0301)
# - AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME (default text-embedding-ada-002)
# - OPENAI_EMBED_MODEL_NAME (default text-embedding-ada-002)
# - OPENAI_EMBED_MODEL_VERSIONS (default: 2 1)
#
# Notes:
# - Model/version availability depends on your Azure OpenAI region/quota.
# - If all attempts fail, we log a warning but do NOT fail the workflow; manual setup may still be required.

set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-AI-102}"
OPENAI_ACCOUNT_NAME="${OPENAI_ACCOUNT_NAME:-openai-ai102}"

CHAT_DEPLOYMENT="${OPENAI_DEPLOYMENT_NAME:-gpt-35-turbo}"
CHAT_MODEL="${OPENAI_CHAT_MODEL_NAME:-gpt-35-turbo}"
CHAT_VERSIONS="${OPENAI_CHAT_MODEL_VERSIONS:-0613 1106 0125 0301}"

EMBED_DEPLOYMENT="${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME:-text-embedding-ada-002}"
EMBED_MODEL="${OPENAI_EMBED_MODEL_NAME:-text-embedding-ada-002}"
EMBED_VERSIONS="${OPENAI_EMBED_MODEL_VERSIONS:-2 1}"

echo "[INFO] Ensuring Azure OpenAI deployments in ${RESOURCE_GROUP}/${OPENAI_ACCOUNT_NAME}..."

retry_az() {
  # Retry az command on transient 5xx
  local tries=5
  local delay=2
  local i=1
  while true; do
    if az "$@"; then
      return 0
    fi
    if [ "$i" -ge "$tries" ]; then
      return 1
    fi
    echo "[WARN] az $* failed; retrying in ${delay}s (attempt $i/${tries})..."
    sleep "$delay"
    delay=$((delay * 2))
    i=$((i + 1))
  done
}

deployment_exists() {
  local dep="$1"
  az cognitiveservices account deployment show \
    -g "$RESOURCE_GROUP" -n "$OPENAI_ACCOUNT_NAME" \
    --deployment-name "$dep" \
    -o none 2>/dev/null
}

create_deployment_try_versions() {
  local dep="$1"
  local model="$2"
  local versions="$3"
  for v in $versions; do
    echo "[INFO] Creating deployment '${dep}' with model '${model}' version '${v}'..."
    if retry_az cognitiveservices account deployment create \
      -g "$RESOURCE_GROUP" -n "$OPENAI_ACCOUNT_NAME" \
      --deployment-name "$dep" \
      --model-format OpenAI \
      --model-name "$model" \
      --model-version "$v" \
      --sku-name Standard \
      --sku-capacity 1 \
      -o none 2>/dev/null; then
      echo "[OK] Deployment created: ${dep} (${model} ${v})"
      return 0
    fi
  done
  echo "[FAIL] Could not create deployment '${dep}'. Tried versions: ${versions}"
  return 1
}

# Chat deployment
if deployment_exists "$CHAT_DEPLOYMENT"; then
  echo "[OK] Chat deployment exists: ${CHAT_DEPLOYMENT}"
else
  if ! create_deployment_try_versions "$CHAT_DEPLOYMENT" "$CHAT_MODEL" "$CHAT_VERSIONS"; then
    echo "[WARN] Chat deployment '${CHAT_DEPLOYMENT}' could not be auto-created. You may need to create it manually in Azure OpenAI Studio or adjust OPENAI_DEPLOYMENT_NAME / model settings."
  fi
fi

# Embeddings deployment (often already exists)
if deployment_exists "$EMBED_DEPLOYMENT"; then
  echo "[OK] Embedding deployment exists: ${EMBED_DEPLOYMENT}"
else
  if ! create_deployment_try_versions "$EMBED_DEPLOYMENT" "$EMBED_MODEL" "$EMBED_VERSIONS"; then
    echo "[WARN] Embedding deployment '${EMBED_DEPLOYMENT}' could not be auto-created. You may need to create it manually or adjust AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME / model settings."
  fi
fi

echo "[OK] Azure OpenAI deployment check finished (best-effort)."

