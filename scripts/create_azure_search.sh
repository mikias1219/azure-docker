#!/usr/bin/env bash
# Create Azure AI Search service for Knowledge Mining and RAG.
# Run after: az login
# Usage: ./scripts/create_azure_search.sh

set -e

RESOURCE_GROUP="${RESOURCE_GROUP:-AI-102}"
LOCATION="${LOCATION:-eastus}"
# Name must be lowercase, 2-60 chars, no leading/trailing dashes
SEARCH_NAME="${SEARCH_NAME:-ai102search}"

echo "Creating Azure AI Search service: $SEARCH_NAME in $RESOURCE_GROUP ($LOCATION)"
az search service create \
  --name "$SEARCH_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku basic \
  --output table

echo ""
echo "Done. Get endpoint and keys:"
echo "  Endpoint: az search service show -n $SEARCH_NAME -g $RESOURCE_GROUP --query 'hostName' -o tsv"
echo "  Admin key: az search admin-key show -n $SEARCH_NAME -g $RESOURCE_GROUP --query 'primaryKey' -o tsv"
echo ""
echo "Set env or GitHub secrets: AZURE_SEARCH_ENDPOINT (https://<hostName>), AZURE_SEARCH_KEY (admin key)."
echo "For RAG you also need: AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME (e.g. text-embedding-ada-002)."
