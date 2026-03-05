#!/bin/bash

# Streamlit Document Intelligence App Deployment Script

echo "🚀 Deploying Streamlit Document Intelligence App"
echo "=============================================="

# Configuration
IMAGE_NAME="document-intelligence-streamlit"
TAG="latest"
REGISTRY="selamnew.azurecr.io"

# Build and push Streamlit frontend
echo ""
echo "📦 Building Streamlit frontend image..."
docker build -f Dockerfile.streamlit -t ${IMAGE_NAME}:${TAG} .

if [ $? -eq 0 ]; then
    echo "✅ Streamlit frontend build successful"
else
    echo "❌ Streamlit frontend build failed"
    exit 1
fi

# Tag for Azure Container Registry
echo ""
echo "🏷️  Tagging image for Azure Container Registry..."
docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY}/${IMAGE_NAME}:${TAG}

# Push to Azure Container Registry
echo ""
echo "📤 Pushing to Azure Container Registry..."
docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}

if [ $? -eq 0 ]; then
    echo "✅ Push successful"
else
    echo "❌ Push failed"
    exit 1
fi

echo ""
echo "🎉 Streamlit frontend deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update ACI deployment to include Streamlit frontend"
echo "2. Configure environment variables"
echo "3. Test the application"
echo ""
echo "🌐 Streamlit app will be available at: http://<your-ip>:8501"
