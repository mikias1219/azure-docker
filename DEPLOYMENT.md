# Document Intelligence App - Azure Deployment

A modern FastAPI application with Azure Document Intelligence and OpenAI integration, deployed automatically to Azure Container Instances with fixed IP addressing.

## 🚀 Features

- **Document Upload & Analysis**: Upload PDF, Word, text, and image files
- **Azure Document Intelligence**: Extract text from various document formats
- **AI-Powered Analysis**: Get insights using Azure OpenAI
- **User Authentication**: Secure JWT-based authentication system
- **Modern UI**: Responsive, user-friendly interface
- **Automated Deployment**: GitHub Actions CI/CD pipeline
- **Fixed IP Address**: Static IP reservation for consistent access
- **Persistent Storage**: Azure File Storage for uploaded documents

## 📋 Prerequisites

### Azure Resources Required
- Azure Container Registry (ACR)
- Azure Container Instances (ACI)
- Azure Storage Account
- Azure Document Intelligence service
- Azure OpenAI resource

### Local Development
- Docker and Docker Compose
- Python 3.8+
- Azure CLI

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd azure-practice-app
```

### 2. Configure Environment Variables
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

### 3. Local Development
```bash
# Using Docker Compose (recommended)
docker-compose up --build

# Or using Python directly
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 🚀 Automated Deployment (GitHub Actions)

### 1. Set up GitHub Secrets
Go to your repository Settings > Secrets and variables > Actions and add:

- `AZURE_CREDENTIALS`: Azure service principal credentials
- `ACR_USERNAME`: Azure Container Registry username
- `ACR_PASSWORD`: Azure Container Registry password
- `AZURE_FORM_RECOGNIZER_ENDPOINT`: Document Intelligence endpoint
- `AZURE_FORM_RECOGNIZER_KEY`: Document Intelligence key
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_API_BASE`: OpenAI API base URL
- `OPENAI_DEPLOYMENT_NAME`: OpenAI deployment name

### 2. Create Azure Service Principal
```bash
az ad sp create-for-rbac \
  --name "document-intelligence-app" \
  --role contributor \
  --scopes /subscriptions/<your-subscription-id>/resourceGroups/AI-102
```

### 3. Push to Main Branch
```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

The GitHub Actions workflow will automatically:
1. Build and push Docker image to ACR
2. Create Azure Storage for file uploads
3. Deploy to Azure Container Instances
4. Reserve a static IP address
5. Configure all environment variables

## 📦 Manual Deployment

Use the provided deployment script:
```bash
./deploy.sh
```

This script will:
- Login to Azure and ACR
- Build and push Docker image
- Create storage account for uploads
- Deploy to Azure Container Instances
- Reserve static IP address

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions │───▶│ Azure Container │
│                 │    │                 │    │    Registry     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Users        │───▶│  Azure Container │───▶│  Azure Storage  │
│                 │    │    Instances    │    │     Account     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Azure Document  │    │   Azure OpenAI  │    │   SQLite DB     │
│  Intelligence  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 Security Features

- **JWT Authentication**: Secure user authentication
- **Environment Variables**: All secrets stored securely
- **HTTPS Support**: SSL/TLS encryption
- **Container Security**: Minimal attack surface
- **Access Control**: User-specific document access

## 📊 Monitoring & Logging

- **Application Logs**: Structured logging with levels
- **Health Checks**: `/health` endpoint for monitoring
- **Error Tracking**: Comprehensive error handling
- **Performance Metrics**: Request/response tracking

## 🔄 CI/CD Pipeline

The GitHub Actions workflow includes:

1. **Build Stage**: Docker image building with caching
2. **Security Scan**: Image vulnerability scanning
3. **Test Stage**: Automated testing (if added)
4. **Deploy Stage**: Azure deployment with rollback capability
5. **Validation**: Post-deployment health checks

## 🌐 Accessing Your Application

After deployment, your app will be available at:
- **Primary URL**: `http://<container-fqdn>`
- **Static IP**: `http://<static-ip>` (for future use)

The deployment summary will display the exact URLs.

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `AZURE_FORM_RECOGNIZER_ENDPOINT` | Document Intelligence endpoint | Yes |
| `AZURE_FORM_RECOGNIZER_KEY` | Document Intelligence API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `OPENAI_API_BASE` | OpenAI API base URL | Yes |
| `OPENAI_DEPLOYMENT_NAME` | OpenAI deployment name | Yes |

## 🛠️ Troubleshooting

### Common Issues

1. **Container won't start**
   - Check environment variables
   - Verify Docker image build
   - Review ACI logs

2. **Authentication issues**
   - Verify Azure credentials
   - Check service principal permissions
   - Validate ACR access

3. **Storage issues**
   - Check storage account permissions
   - Verify file share configuration
   - Review mount paths

### Debug Commands
```bash
# Check container logs
az container logs --resource-group AI-102 --name document-intelligence-container

# Check container status
az container show --resource-group AI-102 --name document-intelligence-container

# Check storage account
az storage account show --resource-group AI-102 --name <storage-account-name>
```

## 📈 Scaling

To scale your application:

1. **Vertical Scaling**: Update container resources in `container-group.json`
2. **Horizontal Scaling**: Create multiple container instances
3. **Load Balancing**: Add Azure Load Balancer
4. **Database Scaling**: Migrate to Azure SQL or PostgreSQL

## 💰 Cost Optimization

- **Container Instances**: Pay-per-second billing
- **Storage**: Tier-based pricing
- **AI Services**: Pay-per-use pricing
- **Static IP**: Minimal monthly cost

## 🔄 Updates & Maintenance

### Updating the Application
1. Make changes to code
2. Push to main branch
3. GitHub Actions handles deployment
4. Zero-downtime updates

### Maintenance Tasks
- Regular security updates
- Log monitoring
- Performance optimization
- Backup management

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review GitHub Actions logs
3. Consult Azure documentation
4. Create an issue in the repository

---

**Note**: This setup uses Azure Container Instances for simplicity. For production workloads, consider Azure Kubernetes Service (AKS) or Azure App Service for better scalability and management features.
