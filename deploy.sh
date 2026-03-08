#!/bin/bash

# Document Intelligence App Deployment Script
# This script handles manual deployment to Azure Container Instances

set -e

# Configuration
REGISTRY="selamnew.azurecr.io"
IMAGE_NAME="document-intelligence-app"
RESOURCE_GROUP="AI-102"
CONTAINER_NAME="document-intelligence-container"
LOCATION="eastus"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Azure CLI is installed
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    log_success "Azure CLI is installed"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        exit 1
    fi
    log_success "Docker is installed"
}

# Login to Azure
login_to_azure() {
    log_info "Logging into Azure..."
    az login
    log_success "Logged into Azure"
}

# Login to ACR
login_to_acr() {
    log_info "Logging into Azure Container Registry..."
    az acr login --name selamnew
    log_success "Logged into ACR"
}

# Build and push Docker image
build_and_push() {
    log_info "Building Docker image..."
    docker build -t $REGISTRY/$IMAGE_NAME:latest .
    
    log_info "Pushing Docker image to ACR..."
    docker push $REGISTRY/$IMAGE_NAME:latest
    log_success "Docker image built and pushed successfully"
}

# Create storage account for file uploads
create_storage() {
    log_info "Creating storage account for file uploads..."
    
    STORAGE_ACCOUNT="docintstorage$(date +%s)"
    
    # Check if storage account already exists
    if az storage account show --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP &> /dev/null; then
        log_warning "Storage account $STORAGE_ACCOUNT already exists"
    else
        az storage account create \
            --name $STORAGE_ACCOUNT \
            --resource-group $RESOURCE_GROUP \
            --location $LOCATION \
            --sku Standard_LRS \
            --allow-blob-public-access false
        
        log_success "Storage account created: $STORAGE_ACCOUNT"
    fi
    
    # Get storage account key
    STORAGE_KEY=$(az storage account keys list \
        --resource-group $RESOURCE_GROUP \
        --account-name $STORAGE_ACCOUNT \
        --query "[0].value" -o tsv)
    
    # Create file share
    az storage share create \
        --name app-uploads \
        --account-name $STORAGE_ACCOUNT \
        --quota 10 \
        --output none || log_warning "File share might already exist"
    
    echo "STORAGE_ACCOUNT=$STORAGE_ACCOUNT"
    echo "STORAGE_KEY=$STORAGE_KEY"
}

# Deploy to Azure Container Instances
deploy_to_aci() {
    log_info "Deploying to Azure Container Instances..."
    
    # Generate unique DNS label
    DNS_LABEL="docint-$(date +%s)"
    
    # Get ACR credentials
    ACR_USER=$(az acr credential show --name selamnew --query "username" -o tsv)
    ACR_PASS=$(az acr credential show --name selamnew --query "passwords[0].value" -o tsv)
    
    # Create storage
    STORAGE_INFO=$(create_storage)
    eval $STORAGE_INFO
    
    # Update container group configuration
    python3 << EOF
import json
import os

with open('aci/container-group.json', 'r') as f:
    data = json.load(f)

# Replace placeholders
data['properties']['imageRegistryCredentials'][0]['username'] = '$ACR_USER'
data['properties']['imageRegistryCredentials'][0]['password'] = '$ACR_PASS'
data['properties']['containers'][0]['properties']['image'] = '$REGISTRY/$IMAGE_NAME:latest'
data['properties']['ipAddress']['dnsNameLabel'] = '$DNS_LABEL'

# Update environment variables from .env file
env_vars = data['properties']['containers'][0]['properties']['environmentVariables']
with open('.env', 'r') as env_file:
    for line in env_file:
        if '=' in line and not line.startswith('#'):
            key, value = line.strip().split('=', 1)
            for var in env_vars:
                if var['name'] == key:
                    var['value'] = value
                    break

# Update storage account info
data['properties']['volumes'][0]['azureFile']['storageAccountName'] = '$STORAGE_ACCOUNT'
data['properties']['volumes'][0]['azureFile']['storageAccountKey'] = '$STORAGE_KEY'

# Write updated config
with open('aci/container-group-updated.json', 'w') as f:
    json.dump(data, f, indent=2)
EOF
    
    # Delete existing container (if exists)
    log_info "Removing existing container (if any)..."
    az container delete \
        --resource-group $RESOURCE_GROUP \
        --name $CONTAINER_NAME \
        --yes \
        --output none || log_warning "Container doesn't exist yet"
    
    # Wait for deletion
    az container wait \
        --deleted \
        --name $CONTAINER_NAME \
        --resource-group $RESOURCE_GROUP \
        --timeout 300 \
        --output none || log_warning "Container was already deleted"
    
    # Create new container (--os-type required by Azure CLI when using --file)
    log_info "Creating new container instance..."
    az container create \
        --resource-group $RESOURCE_GROUP \
        --file aci/container-group-updated.json \
        --name $CONTAINER_NAME \
        --location $LOCATION \
        --os-type Linux
    
    # Get container details
    CONTAINER_IP=$(az container show \
        --resource-group $RESOURCE_GROUP \
        --name $CONTAINER_NAME \
        --query "ipAddress.ip" -o tsv)
    
    CONTAINER_FQDN=$(az container show \
        --resource-group $RESOURCE_GROUP \
        --name $CONTAINER_NAME \
        --query "ipAddress.fqdn" -o tsv)
    
    log_success "Container deployed successfully!"
    echo ""
    echo "🎉 Deployment Details:"
    echo "  • Container Name: $CONTAINER_NAME"
    echo "  • Resource Group: $RESOURCE_GROUP"
    echo "  • IP Address: $CONTAINER_IP"
    echo "  • FQDN: $CONTAINER_FQDN"
    echo "  • DNS Label: $DNS_LABEL"
    echo ""
    echo "🔗 Access your app at: http://$CONTAINER_FQDN"
    echo ""
    echo "📝 Notes:"
    echo "  • The app will be available within 1-2 minutes"
    echo "  • All environment variables are configured"
    echo "  • File uploads are stored in Azure Storage"
}

# Create static IP reservation
create_static_ip() {
    log_info "Creating static IP reservation..."
    
    IP_NAME="docint-static-ip"
    
    az network public-ip create \
        --name $IP_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --allocation-method Static \
        --sku Standard \
        --output none || log_warning "Public IP might already exist"
    
    STATIC_IP=$(az network public-ip show \
        --name $IP_NAME \
        --resource-group $RESOURCE_GROUP \
        --query "ipAddress" -o tsv)
    
    log_success "Static IP reserved: $STATIC_IP"
    echo "💡 You can use this static IP ($STATIC_IP) for future deployments"
}

# Main execution
main() {
    log_info "Starting Document Intelligence App deployment..."
    
    check_azure_cli
    check_docker
    login_to_azure
    login_to_acr
    build_and_push
    deploy_to_aci
    create_static_ip
    
    log_success "🎉 Deployment completed successfully!"
}

# Run main function
main "$@"
