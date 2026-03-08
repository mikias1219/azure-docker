#!/bin/bash

# GitHub Secrets Setup Script
# This script helps set up all required GitHub secrets for the deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="selamnew.azurecr.io"
ACR_NAME="selamnew"
ACR_RESOURCE_GROUP="AI-102"
RESOURCE_GROUP="AI-102"
LOCATION="eastus"
SERVICE_PRINCIPAL_NAME="document-intelligence-app"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if GitHub CLI is installed
check_github_cli() {
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI is not installed. Please install it first."
        echo "Install from: https://cli.github.com/"
        exit 1
    fi
    log_success "GitHub CLI is installed"
}

# Check if Azure CLI is installed
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    log_success "Azure CLI is installed"
}

# Login to Azure
login_to_azure() {
    log_info "Logging into Azure..."
    az login
    log_success "Logged into Azure"
}

# Login to GitHub
login_to_github() {
    log_info "Logging into GitHub..."
    gh auth login
    log_success "Logged into GitHub"
}

# Create or update service principal. Outputs ONLY the JSON to stdout (for capture); logs to stderr.
create_service_principal() {
    log_info "Creating service principal..." >&2

    # Get subscription ID
    SUBSCRIPTION_ID=$(az account show --query "id" -o tsv)

    # Create service principal
    SP_INFO=$(az ad sp create-for-rbac \
        --name "$SERVICE_PRINCIPAL_NAME" \
        --role contributor \
        --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP")

    # Extract credentials
    CLIENT_ID=$(echo $SP_INFO | jq -r '.appId')
    CLIENT_SECRET=$(echo $SP_INFO | jq -r '.password')
    TENANT_ID=$(echo $SP_INFO | jq -r '.tenant')

    log_success "Service principal created" >&2
    echo "Client ID: $CLIENT_ID" >&2
    echo "Tenant ID: $TENANT_ID" >&2

    # Output ONLY the JSON to stdout so AZURE_CREDENTIALS=$(create_service_principal) gets valid JSON
    cat <<EOF
{
  "clientId": "$CLIENT_ID",
  "clientSecret": "$CLIENT_SECRET",
  "subscriptionId": "$SUBSCRIPTION_ID",
  "tenantId": "$TENANT_ID"
}
EOF
}

# Get ACR credentials
get_acr_credentials() {
    log_info "Getting ACR credentials..."
    
    ACR_USER=$(az acr credential show --name $ACR_NAME --resource-group $ACR_RESOURCE_GROUP --query "username" -o tsv)
    ACR_PASS=$(az acr credential show --name $ACR_NAME --resource-group $ACR_RESOURCE_GROUP --query "passwords[0].value" -o tsv)
    
    log_success "ACR credentials retrieved"
    echo "ACR Username: $ACR_USER"
}

# Get Azure service credentials
get_azure_service_credentials() {
    log_info "Getting Azure service credentials..."
    
    # Document Intelligence
    FORM_RECOGNIZER_ENDPOINT=$(az cognitiveservices account show \
        --name document-intelligence-ai102 \
        --resource-group $RESOURCE_GROUP \
        --query "properties.endpoint" -o tsv)
    
    FORM_RECOGNIZER_KEY=$(az cognitiveservices account keys list \
        --name document-intelligence-ai102 \
        --resource-group $RESOURCE_GROUP \
        --query "key1" -o tsv)
    
    # OpenAI
    OPENAI_API_KEY=$(az cognitiveservices account keys list \
        --name openai-ai102 \
        --resource-group $RESOURCE_GROUP \
        --query "key1" -o tsv)
    
    OPENAI_API_BASE=$(az cognitiveservices account show \
        --name openai-ai102 \
        --resource-group $RESOURCE_GROUP \
        --query "properties.endpoint" -o tsv)
    
    OPENAI_DEPLOYMENT_NAME="text-embedding-ada-002"

    # Azure AI Language (Text Analytics, QnA, CLU) - try language-ai102, then ai-language-ai102, then azure-language-ai102
    set +e
    for LANG_NAME in language-ai102 ai-language-ai102 azure-language-ai102; do
        LANGUAGE_ENDPOINT=$(az cognitiveservices account show \
            --name "$LANG_NAME" \
            --resource-group $RESOURCE_GROUP \
            --query "properties.endpoint" -o tsv 2>/dev/null)
        LANGUAGE_KEY=$(az cognitiveservices account keys list \
            --name "$LANG_NAME" \
            --resource-group $RESOURCE_GROUP \
            --query "key1" -o tsv 2>/dev/null)
        [ -n "$LANGUAGE_ENDPOINT" ] && [ -n "$LANGUAGE_KEY" ] && break
    done
    set -e
    if [ -z "$LANGUAGE_ENDPOINT" ] || [ -z "$LANGUAGE_KEY" ]; then
        log_warning "No Azure AI Language resource found (tried language-ai102, ai-language-ai102, azure-language-ai102). Create with: az cognitiveservices account create -n language-ai102 -g AI-102 -l eastus --kind TextAnalytics --sku S --yes"
        LANGUAGE_ENDPOINT=""
        LANGUAGE_KEY=""
    fi

    AZURE_QNA_PROJECT_NAME="LearnFAQ"
    AZURE_QNA_DEPLOYMENT_NAME="production"

    # Azure AI Vision (Computer Vision / Image Analysis) - optional if not created yet
    set +e
    AI_VISION_ENDPOINT=$(az cognitiveservices account show \
        --name ai-vision-ai102 \
        --resource-group $RESOURCE_GROUP \
        --query "properties.endpoint" -o tsv 2>/dev/null)
    AI_VISION_KEY=$(az cognitiveservices account keys list \
        --name ai-vision-ai102 \
        --resource-group $RESOURCE_GROUP \
        --query "key1" -o tsv 2>/dev/null)
    set -e
    if [ -z "$AI_VISION_ENDPOINT" ] || [ -z "$AI_VISION_KEY" ]; then
        log_warning "Azure AI Vision resource 'ai-vision-ai102' not found. Create with: az cognitiveservices account create -n ai-vision-ai102 -g AI-102 -l eastus --kind ComputerVision --sku S1 --yes"
        AI_VISION_ENDPOINT=""
        AI_VISION_KEY=""
    fi

    log_success "Azure service credentials retrieved"
}

# Set GitHub secrets
set_github_secrets() {
    log_info "Setting GitHub secrets..."
    
    # Get repository name
    REPO_NAME=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
    
    # Set Azure credentials
    log_info "Setting AZURE_CREDENTIALS..."
    echo "$AZURE_CREDENTIALS" | gh secret set AZURE_CREDENTIALS --repo "$REPO_NAME"
    
    # Set ACR credentials
    log_info "Setting ACR credentials..."
    gh secret set ACR_USERNAME --body "$ACR_USER" --repo "$REPO_NAME"
    gh secret set ACR_PASSWORD --body "$ACR_PASS" --repo "$REPO_NAME"
    
    # Set Azure service credentials
    log_info "Setting Azure service credentials..."
    gh secret set AZURE_FORM_RECOGNIZER_ENDPOINT --body "$FORM_RECOGNIZER_ENDPOINT" --repo "$REPO_NAME"
    gh secret set AZURE_FORM_RECOGNIZER_KEY --body "$FORM_RECOGNIZER_KEY" --repo "$REPO_NAME"
    gh secret set OPENAI_API_KEY --body "$OPENAI_API_KEY" --repo "$REPO_NAME"
    gh secret set OPENAI_API_BASE --body "$OPENAI_API_BASE" --repo "$REPO_NAME"
    gh secret set OPENAI_DEPLOYMENT_NAME --body "$OPENAI_DEPLOYMENT_NAME" --repo "$REPO_NAME"
    [ -n "$LANGUAGE_ENDPOINT" ] && gh secret set AZURE_LANGUAGE_ENDPOINT --body "$LANGUAGE_ENDPOINT" --repo "$REPO_NAME"
    [ -n "$LANGUAGE_KEY" ] && gh secret set AZURE_LANGUAGE_KEY --body "$LANGUAGE_KEY" --repo "$REPO_NAME"
    gh secret set AZURE_QNA_PROJECT_NAME --body "$AZURE_QNA_PROJECT_NAME" --repo "$REPO_NAME"
    gh secret set AZURE_QNA_DEPLOYMENT_NAME --body "$AZURE_QNA_DEPLOYMENT_NAME" --repo "$REPO_NAME"
    [ -n "$AI_VISION_ENDPOINT" ] && gh secret set AZURE_AI_VISION_ENDPOINT --body "$AI_VISION_ENDPOINT" --repo "$REPO_NAME"
    [ -n "$AI_VISION_KEY" ] && gh secret set AZURE_AI_VISION_KEY --body "$AI_VISION_KEY" --repo "$REPO_NAME"

    log_success "All GitHub secrets set successfully"
}

# Verify secrets
verify_secrets() {
    log_info "Verifying GitHub secrets..."
    
    REPO_NAME=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
    
    # List all secrets
    echo "🔐 GitHub Secrets for $REPO_NAME:"
    gh secret list --repo "$REPO_NAME"
    
    log_success "Secret verification completed"
}

# Main execution
main() {
    log_info "🚀 Setting up GitHub secrets for Document Intelligence App deployment..."
    
    check_github_cli
    check_azure_cli
    login_to_azure
    login_to_github
    
    # Create service principal and get credentials
    AZURE_CREDENTIALS=$(create_service_principal)
    
    # Get other credentials
    get_acr_credentials
    get_azure_service_credentials
    
    # Set all secrets
    set_github_secrets
    
    # Verify setup
    verify_secrets
    
    log_success "🎉 GitHub secrets setup completed successfully!"
    echo ""
    echo "📋 Summary:"
    echo "  • Service Principal: $SERVICE_PRINCIPAL_NAME"
    echo "  • Resource Group: $RESOURCE_GROUP"
    echo "  • Repository: $(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
    echo ""
    echo "🔐 Secrets Created:"
    echo "  • AZURE_CREDENTIALS"
    echo "  • ACR_USERNAME"
    echo "  • ACR_PASSWORD"
    echo "  • AZURE_FORM_RECOGNIZER_ENDPOINT"
    echo "  • AZURE_FORM_RECOGNIZER_KEY"
    echo "  • OPENAI_API_KEY"
    echo "  • OPENAI_API_BASE"
    echo "  • OPENAI_DEPLOYMENT_NAME"
    echo "  • AZURE_LANGUAGE_ENDPOINT"
    echo "  • AZURE_LANGUAGE_KEY"
    echo "  • AZURE_QNA_PROJECT_NAME"
    echo "  • AZURE_QNA_DEPLOYMENT_NAME"
    echo "  • AZURE_AI_VISION_ENDPOINT"
    echo "  • AZURE_AI_VISION_KEY"
    echo ""
    echo "🚀 You can now push to main branch to trigger deployment!"
}

# Run main function
main "$@"
