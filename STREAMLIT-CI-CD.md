# Streamlit Document Intelligence App - CI/CD Setup

## 🚀 Overview
This document explains the CI/CD setup for the Streamlit version of the Document Intelligence App, which works with the existing Azure infrastructure.

## 📁 New Files Created

### 🐳 Docker & Deployment
- **Dockerfile.streamlit-single** - Multi-service container (FastAPI + Streamlit)
- **start_services.py** - Service orchestration script
- **aci/container-group-streamlit-template.json** - ACI deployment template
- **.github/workflows/deploy-streamlit.yml** - GitHub Actions CI/CD workflow

### 🤖 Application Files
- **streamlit_app.py** - Main Streamlit application
- **azure_speech_service.py** - Azure Speech Services integration
- **requirements.txt** - Updated with Streamlit dependencies
- **main_new.py** - Updated FastAPI backend with CORS fixes

## 🔄 CI/CD Workflow

### GitHub Actions Workflow
The workflow `.github/workflows/deploy-streamlit.yml`:

1. **Triggers**: Push to `streamlit` branch
2. **Builds**: Docker image using `Dockerfile.streamlit-single`
3. **Pushes**: To Azure Container Registry (`selamnew.azurecr.io`)
4. **Deploys**: To Azure Container Instances with new template

### Deployment Process

#### 1. Build Phase
```bash
docker build -f Dockerfile.streamlit-single -t document-intelligence-streamlit:latest .
```

#### 2. Push to ACR
```bash
docker tag document-intelligence-streamlit:latest selamnew.azurecr.io/document-intelligence-streamlit:latest
docker push selamnew.azurecr.io/document-intelligence-streamlit:latest
```

#### 3. Deploy to ACI
```bash
az container create \
  --resource-group AI-102 \
  --file aci/container-group-streamlit-updated.json \
  --name document-intelligence-streamlit
```

## 🎯 Architecture

### Single-Container Approach
Both services run in one container:
- **FastAPI Backend**: Port 8000 (internal)
- **Streamlit Frontend**: Port 8501 (external)

### Container Structure
```
┌─────────────────────────────────────┐
│  Azure Container Instance           │
│  ┌─────────────────────────────────┐│
│  │  FastAPI Backend (Port 8000)   ││
│  │  - Document processing         ││
│  │  - Authentication              ││
│  │  - Azure AI integration        ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │  Streamlit Frontend (8501)     ││
│  │  - Voice recording             ││
│  │  - Transcription display       ││
│  │  - Document management         ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## 🚀 How to Deploy

### Option 1: Push to Streamlit Branch (Recommended)
```bash
# 1. Commit your changes
git add .
git commit -m "Add Streamlit voice recording feature"

# 2. Push to streamlit branch
git push origin streamlit

# 3. GitHub Actions automatically deploys
# Monitor at: https://github.com/your-repo/actions
```

### Option 2: Manual Trigger
```bash
# Go to GitHub Actions tab
# Select "Deploy Streamlit Document Intelligence App"
# Click "Run workflow"
```

### Option 3: Local Testing (No CI/CD)
```bash
# Build locally
docker build -f Dockerfile.streamlit-single -t streamlit-test .

# Run locally
docker run -p 8501:8501 -p 8000:8000 \
  -e AZURE_FORM_RECOGNIZER_KEY=your-key \
  -e AZURE_SPEECH_KEY=your-key \
  streamlit-test
```

## 🔧 Required Secrets

Add these to GitHub Secrets (Settings > Secrets and variables > Actions):

### Azure Credentials
- `AZURE_CREDENTIALS` - Azure service principal credentials
- `ACR_USERNAME` - Azure Container Registry username
- `ACR_PASSWORD` - Azure Container Registry password

### Azure AI Services
- `AZURE_FORM_RECOGNIZER_ENDPOINT` - Form Recognizer endpoint
- `AZURE_FORM_RECOGNIZER_KEY` - Form Recognizer API key
- `AZURE_SPEECH_KEY` - Speech Services API key
- `AZURE_SPEECH_REGION` - Speech Services region (default: eastus)

### OpenAI
- `OPENAI_API_KEY` - Azure OpenAI API key
- `OPENAI_API_BASE` - Azure OpenAI endpoint
- `OPENAI_DEPLOYMENT_NAME` - OpenAI deployment name
- `OPENAI_API_VERSION` - API version (default: 2024-02-15-preview)

### Security
- `SECRET_KEY` - JWT secret key for authentication

## 📋 Deployment Checklist

### Before First Deployment
- [ ] Create `streamlit` branch in GitHub
- [ ] Add all required secrets to GitHub
- [ ] Verify Azure Container Registry access
- [ ] Test Dockerfile builds locally
- [ ] Verify ACI template is valid

### After Deployment
- [ ] Check GitHub Actions logs for errors
- [ ] Verify container is running in Azure Portal
- [ ] Test Streamlit app at deployed URL
- [ ] Test voice recording functionality
- [ ] Verify Azure AI services integration

## 🌐 Access Points

After successful deployment:
- **Streamlit App**: `http://<fqdn>:8501`
- **Backend API**: `http://<fqdn>:8000`
- **Health Check**: `http://<fqdn>:8000/health`

## 🎨 New Features Available

### Voice Recording
- Browser-based audio recording
- Real-time transcription with Azure Speech
- Audio playback and management
- Multiple language support

### Document Management
- Upload documents (PDF, Word, images)
- Azure Form Recognizer integration
- AI-powered text extraction
- Document search and filtering

### Transcription Management
- View all recordings
- Edit transcribed text
- AI analysis of transcriptions
- Export and download options

## 🧹 Cleanup

To remove the Streamlit deployment:
```bash
az container delete \
  --resource-group AI-102 \
  --name document-intelligence-streamlit \
  --yes
```

## 🔄 Switching Between Versions

### Original Next.js App
```bash
# Uses main branch and Dockerfile.full
# Deployed to: document-intelligence-container
```

### New Streamlit App
```bash
# Uses streamlit branch and Dockerfile.streamlit-single
# Deployed to: document-intelligence-streamlit
```

Both apps can run simultaneously on different containers!

## 📞 Troubleshooting

### CI/CD Issues
- Check GitHub Actions logs for build errors
- Verify all secrets are correctly set
- Ensure Azure credentials have proper permissions

### Deployment Issues
- Check ACI logs: `az container logs --name document-intelligence-streamlit`
- Verify container is running: `az container show --name document-intelligence-streamlit`
- Check resource group limits

### Application Issues
- Voice recording requires HTTPS in production
- Ensure Azure Speech Services key is valid
- Check CORS settings if frontend can't connect to backend

## 🎉 Summary

Your Streamlit Document Intelligence App is now fully integrated with:
- ✅ **GitHub Actions CI/CD** - Automatic deployment on push
- ✅ **Azure Container Registry** - Image storage
- ✅ **Azure Container Instances** - Production hosting
- ✅ **Voice Recording** - Browser-based with Azure Speech
- ✅ **Document Intelligence** - Azure Form Recognizer
- ✅ **Modern UI** - Streamlit with sidebar navigation

**🚀 Push to the `streamlit` branch to deploy!**
