#!/usr/bin/env bash
# Ensure an Azure Storage Account + File Share exist for ACI persistence (DB + uploads),
# and export required env vars to GitHub Actions via GITHUB_ENV.
#
# Run after: az login (already done in workflow)
#
# Exports:
# - STORAGE_ACCOUNT_NAME
# - STORAGE_ACCOUNT_KEY
# - FILE_SHARE_NAME
# - DATABASE_URL (sqlite path on mounted share)
# - UPLOADS_DIR (uploads dir on mounted share)
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-AI-102}"
LOCATION="${LOCATION:-eastus}"
STORAGE_PREFIX="${STORAGE_PREFIX:-docintstorage}"
FILE_SHARE_NAME="${FILE_SHARE_NAME:-app-uploads}"
MOUNT_PATH="${MOUNT_PATH:-/mnt/data}"

echo "[INFO] Ensuring Azure File Share for persistence in ${RESOURCE_GROUP}..."

# Find an existing storage account (first match by prefix) or create a new one
SA_NAME="$(az storage account list --resource-group "$RESOURCE_GROUP" --query "[?starts_with(name, '${STORAGE_PREFIX}')].name | [0]" -o tsv 2>/dev/null || true)"
if [ -z "${SA_NAME}" ]; then
  SA_NAME="${STORAGE_PREFIX}$(date +%s)"
  echo "[INFO] Creating storage account: ${SA_NAME}"
  az storage account create \
    --name "$SA_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --output none
else
  echo "[INFO] Using storage account: ${SA_NAME}"
fi

SA_KEY="$(az storage account keys list --resource-group "$RESOURCE_GROUP" --account-name "$SA_NAME" --query "[0].value" -o tsv)"

# Ensure file share exists (idempotent)
az storage share create \
  --name "$FILE_SHARE_NAME" \
  --account-name "$SA_NAME" \
  --account-key "$SA_KEY" \
  --quota 50 \
  --output none >/dev/null || true

DATABASE_URL="sqlite:////${MOUNT_PATH#/}/app.db"
UPLOADS_DIR="${MOUNT_PATH%/}/uploads"

if [ -n "${GITHUB_ENV:-}" ]; then
  echo "::add-mask::$SA_KEY"
  {
    echo "STORAGE_ACCOUNT_NAME=$SA_NAME"
    echo "STORAGE_ACCOUNT_KEY=$SA_KEY"
    echo "FILE_SHARE_NAME=$FILE_SHARE_NAME"
    echo "DATABASE_URL=$DATABASE_URL"
    echo "UPLOADS_DIR=$UPLOADS_DIR"
  } >> "$GITHUB_ENV"
else
  echo "export STORAGE_ACCOUNT_NAME='$SA_NAME'"
  echo "export STORAGE_ACCOUNT_KEY='$SA_KEY'"
  echo "export FILE_SHARE_NAME='$FILE_SHARE_NAME'"
  echo "export DATABASE_URL='$DATABASE_URL'"
  echo "export UPLOADS_DIR='$UPLOADS_DIR'"
fi

echo "[OK] Persistence configured (file share: ${FILE_SHARE_NAME}, mount: ${MOUNT_PATH})."

