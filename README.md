# Azure AI Solution — Exam AI-102

A full-stack **Azure AI** application aligned with **Exam AI-102: Designing and Implementing a Microsoft Azure AI Solution**. One-time setup (single GitHub secret), then push to `main` — all Azure services are created and configured automatically; no repetitive manual steps.

## What’s automated

- **Azure resources**: Missing services (Document Intelligence, OpenAI, Language, Vision, Search, Speech, ACR, storage) are created by the GitHub Actions workflow.
- **Credentials**: Endpoints and keys are fetched from Azure and passed to the running container; you do not copy-paste them.
- **Deploy**: Build, push to ACR, and deploy to Azure Container Instances on every push to `main`.

**You do once**: Set **`AZURE_CREDENTIALS`** in repo Secrets (e.g. via `./setup-secrets.sh`). Optional: set **`SECRET_KEY`** for stable login. See [docs/AUTOMATION.md](docs/AUTOMATION.md).

## ✨ Features (aligned with AI-102 skills)

- 📄 **Document Intelligence**: Upload documents; extract text and structured data (invoices, business cards) with Azure Document Intelligence
- 👁️ **Computer Vision**: Image analysis (caption, tags, objects, people) and OCR via Azure AI Vision
- 🌐 **Natural Language**: Text Analytics (sentiment, entities, key phrases, language), Question Answering, and CLU (e.g. Clock)
- 🎤 **Speech**: Speech-to-text and text-to-speech with Azure AI Speech
- 🔍 **Knowledge Mining**: Keyword search over indexed content with Azure AI Search
- 🧠 **Generative AI (RAG)**: Ingest documents, then ask questions with retrieval-augmented generation (Azure OpenAI)
- 🔐 **Auth**: Register and sign in; use each service with clear steps and visible responses
- 🚀 **CI/CD**: One secret (`AZURE_CREDENTIALS`); workflow creates missing Azure resources, fetches keys, and deploys. See [docs/AUTOMATION.md](docs/AUTOMATION.md).
- 💾 **Persistence**: Azure File Share for database and uploads

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)
```bash
# 1. Clone the repository
git clone https://github.com/mikias1219/azure-docker.git
cd azure-docker

# 2. Set up GitHub secrets (one-time)
./setup-secrets.sh

# 3. Deploy to Azure
git add .
git commit -m "Deploy to Azure"
git push origin main
```

### Option 2: Manual Deployment
```bash
# Run the deployment script
./deploy.sh
```

**If you prefer to create Azure resources and GitHub secrets locally (optional):**

```bash
az login
./scripts/create_all_azure_services.sh   # Creates any missing services
./setup-secrets.sh                        # Sets AZURE_CREDENTIALS (and optionally SECRET_KEY) in GitHub
```

The deploy workflow does the same automatically: it creates missing resources and fetches credentials from Azure, so you only need `AZURE_CREDENTIALS` in GitHub. See [docs/AUTOMATION.md](docs/AUTOMATION.md) and [docs/CI-CD-AND-SECRETS.md](docs/CI-CD-AND-SECRETS.md).

## 📋 Prerequisites

- **Azure CLI**: Install and configure
- **GitHub CLI**: Install and authenticate
- **Docker**: For local development
- **Azure Resources**: Document Intelligence, OpenAI, and (for RAG/Knowledge) Azure AI Search and an OpenAI embedding deployment

## 🔧 Local Development

```bash
# Using Docker Compose (recommended)
docker-compose up --build

# Or using Python directly
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Access your app at `http://localhost:8000`

## 🏗️ Architecture

```
GitHub Repo → GitHub Actions → Azure Container Registry → Azure Container Instances
                                     ↓
                              Azure Storage ← Document Intelligence + OpenAI
```

## 📚 Documentation

- 📖 [Deployment Guide](DEPLOYMENT.md) - Comprehensive deployment documentation
- ✅ [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Step-by-step verification
- ⚡ [Quick Start](QUICK_START.md) - 5-minute deployment guide
- 🔧 [Azure Resources](docs/AZURE_RESOURCES.md) - All required Azure services and create commands

### Assess Azure resources (after `az login`)

```bash
./scripts/assess_azure_resources.sh
```

This checks that every required resource exists and prints create commands for any that are missing. Then run `./setup-secrets.sh` to push credentials to GitHub for CI/CD.

## 🔐 Environment Variables

Create a `.env` file with your Azure credentials:

```bash
# Azure Document Intelligence
AZURE_FORM_RECOGNIZER_ENDPOINT=https://eastus.api.cognitive.microsoft.com/
AZURE_FORM_RECOGNIZER_KEY=your-form-recognizer-key

# Azure OpenAI
OPENAI_API_KEY=your-openai-key
OPENAI_API_BASE=https://eastus.api.cognitive.microsoft.com/
OPENAI_DEPLOYMENT_NAME=text-embedding-ada-002

# Database
DATABASE_URL=sqlite:///./app.db
```

## 🔄 CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **Build & Test**: Creates optimized Docker image
2. **Security Scan**: Checks for vulnerabilities
3. **Deploy to ACR**: Pushes to Azure Container Registry
4. **Deploy to ACI**: Creates Azure Container Instance
5. **Configure**: Sets up environment variables and storage
6. **Verify**: Runs health checks and provides deployment summary

## 🌐 Accessing Your Application

After deployment:
- **Primary URL**: `http://<container-fqdn>`
- **Static IP**: Reserved for future use
- **Health Check**: `http://<container-fqdn>/health`

## 🛠️ Troubleshooting

### Common Issues
```bash
# Check container logs
az container logs --resource-group AI-102 --name document-intelligence-container

# Check container status
az container show --resource-group AI-102 --name document-intelligence-container

# Restart container
az container restart --resource-group AI-102 --name document-intelligence-container
```

## 📊 Features Overview

### User Features
- ✅ User registration and authentication
- ✅ Document upload with drag-and-drop
- ✅ Multiple file format support (PDF, Word, text, images)
- ✅ Real-time upload progress tracking
- ✅ Document history and management
- ✅ AI-powered document analysis

### Technical Features
- ✅ FastAPI with async support
- ✅ SQLite database (easily switchable to PostgreSQL)
- ✅ JWT-based authentication
- ✅ Azure Document Intelligence integration
- ✅ OpenAI integration for analysis
- ✅ Responsive modern UI
- ✅ Secure environment variable management

### DevOps Features
- ✅ Automated GitHub Actions deployment
- ✅ Docker multi-stage builds
- ✅ Static IP reservation
- ✅ Azure File Storage integration
- ✅ Health checks and monitoring
- ✅ Zero-downtime deployments

## 📁 Project Structure

```
azure-practice-app/
├── app/                    # Application code
│   ├── auth.py            # Authentication logic
│   ├── azure_services.py  # Azure integrations
│   ├── crud.py            # Database operations
│   ├── db.py              # Database configuration
│   ├── models.py          # Database models
│   └── schemas.py         # Pydantic schemas
├── static/                 # Frontend assets
│   ├── index.html         # Main application UI
│   └── style.css          # Styling
├── aci/                    # Azure Container Instance configs
├── .github/workflows/      # GitHub Actions workflows
├── deploy.sh              # Manual deployment script
├── setup-secrets.sh       # GitHub secrets setup script
├── docker-compose.yml     # Local development
├── Dockerfile             # Production container
└── requirements.txt       # Python dependencies
```

## 💰 Cost Optimization

- **Container Instances**: Pay-per-second billing (~$0.00002/second)
- **Storage**: Azure File Storage (~$0.06/GB/month)
- **AI Services**: Pay-per-use pricing
- **Static IP**: Minimal monthly cost (~$3-5/month)

Estimated monthly cost for moderate usage: **$20-50**

## 🔮 Future Enhancements

- [ ] Azure Kubernetes Service (AKS) deployment
- [ ] PostgreSQL database integration
- [ ] Advanced AI analysis features
- [ ] User role management
- [ ] Document versioning
- [ ] API rate limiting
- [ ] Monitoring and alerting
- [ ] Custom domain support

## 📞 Support

For issues and questions:
1. Check the [troubleshooting section](DEPLOYMENT_CHECKLIST.md#-troubleshooting)
2. Review GitHub Actions logs
3. Consult Azure documentation
4. Create an issue in the repository

---

**Built with ❤️ using FastAPI, Azure services, and modern DevOps practices**

---

### Legacy Information (Original FastAPI Sample)

This repository was originally a minimal FastAPI app. It has been enhanced with:
- Document Intelligence capabilities
- Modern UI with authentication
- Automated deployment pipeline
- Fixed IP addressing
- Comprehensive documentation

For the original simple setup:
```bash
# Login to Azure
az login
# Login to ACR
az acr login --name selamnew
# Build and push
docker build -t selamnew.azurecr.io/fastapi-sample:latest .
docker push selamnew.azurecr.io/fastapi-sample:latest
```