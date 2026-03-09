# 🚀 Deployment Checklist

## Pre-Deployment Setup

### ✅ Azure Resources Verification
- [ ] Resource Group `AI-102` exists
- [ ] Azure Container Registry (ACR) exists: `selamnew.azurecr.io`
- [ ] Document Intelligence service `document-intelligence-ai102` is created
- [ ] OpenAI service `openai-ai102` is created
- [ ] Azure AI Language service `language-ai102` is created (Text Analytics, QnA, CLU)
- [ ] Azure AI Vision service `ai-vision-ai102` is created (Computer Vision / image analysis)
- [ ] Storage account for file uploads will be created automatically by the workflow

**One-command create (all services):**
```bash
az login
./scripts/create_all_azure_services.sh   # Creates RG, ACR, Doc Intel, OpenAI, Language, Vision, Azure AI Search
```
Then in **Azure OpenAI Studio** create deployments: **chat** (e.g. gpt-35-turbo) and **embedding** (e.g. text-embedding-ada-002).

Run `./scripts/assess_azure_resources.sh` after `az login` to verify and get create commands for any missing resources.

### ✅ Local Development Setup
- [ ] Docker and Docker Compose installed
- [ ] Azure CLI installed and configured
- [ ] GitHub CLI installed and configured
- [ ] Environment variables configured in `.env` file
- [ ] Application runs locally: `docker-compose up --build`

### ✅ Repository Configuration
- [ ] Code pushed to GitHub repository
- [ ] Main branch exists and is protected
- [ ] GitHub Actions workflow file is present
- [ ] All required files are committed

## 🔐 GitHub Secrets Setup

### Automated Setup (Recommended)
```bash
# Run the automated setup script
./setup-secrets.sh
```

### Manual Setup
Create these GitHub secrets in your repository:

1. **Azure Credentials**
   - `AZURE_CREDENTIALS`: Service principal JSON with client_id, client_secret, subscription_id, tenant_id

2. **Container Registry**
   - `ACR_USERNAME`: Azure Container Registry username
   - `ACR_PASSWORD`: Azure Container Registry password

3. **Azure Services**
   - `AZURE_FORM_RECOGNIZER_ENDPOINT` / `AZURE_FORM_RECOGNIZER_KEY`: Document Intelligence
   - `OPENAI_API_KEY` / `OPENAI_API_BASE` / `OPENAI_DEPLOYMENT_NAME` / `OPENAI_API_VERSION`: Azure OpenAI
   - `AZURE_LANGUAGE_ENDPOINT` / `AZURE_LANGUAGE_KEY`: Azure AI Language (Text, QnA, CLU)
   - `AZURE_QNA_PROJECT_NAME` / `AZURE_QNA_DEPLOYMENT_NAME`: QnA knowledge base
   - `AZURE_AI_VISION_ENDPOINT` / `AZURE_AI_VISION_KEY`: Azure AI Vision (image analysis & OCR)
  - `AZURE_SEARCH_ENDPOINT` / `AZURE_SEARCH_KEY`: Azure AI Search (Knowledge Mining + RAG)
  - `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME`: Embedding deployment for RAG (e.g. text-embedding-ada-002)

4. **App (optional but recommended)**
   - `SECRET_KEY`: JWT signing secret for production (if unset, app uses a default)

## 🚀 Deployment Process

### Automated Deployment (GitHub Actions)
- **Production deploy**: Only **deploy-azure.yml** deploys to ACI (on push to `main`). It builds **Dockerfile.full** (frontend + backend, port 8000) and uses image tag **:full**.
- The **deploy.yml** workflow only runs on PRs / manual trigger and does **not** deploy (so it won’t overwrite the running container).
1. **Trigger**: Push to `main` branch runs **deploy-azure.yml**
2. **Build**: Docker image from Dockerfile.full, pushed to ACR as `document-intelligence-app:full` (and :main, :latest)
3. **Deploy**: Azure Container Instance created from ACI template (port 8000, liveness probe on /health)
4. **Configure**: Environment variables and storage set up
5. **Verify**: Health check (from inside container and optionally from runner) and deployment summary. **Use the URL with port 8000**: `http://<ip-or-fqdn>:8000`

### Manual Deployment
```bash
# Use the deployment script
./deploy.sh
```

## 📋 Post-Deployment Verification

### ✅ Application Health Check
- [ ] Application responds at `http://<container-ip-or-fqdn>:8000` (port 8000 is required)
- [ ] Health endpoint works: `http://<container-ip-or-fqdn>:8000/health`
- [ ] User registration and login work
- [ ] Document upload functionality works
- [ ] Azure services integration works

### ✅ Azure Resources Verification
```bash
# Check container status
az container show --resource-group AI-102 --name document-intelligence-container

# Check container logs
az container logs --resource-group AI-102 --name document-intelligence-container

# Check storage account
az storage account list --resource-group AI-102 --output table
```

### ✅ Fixed IP Address
- [ ] Static IP reserved: `docint-static-ip`
- [ ] IP address noted for future use
- [ ] DNS configuration (if needed)

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **Container won't start**
   ```bash
   # Check logs
   az container logs --resource-group AI-102 --name document-intelligence-container
   
   # Check configuration
   az container show --resource-group AI-102 --name document-intelligence-container
   ```

2. **Authentication issues**
   ```bash
   # Verify Azure credentials
   az account show
   
   # Test ACR access
   az acr login --name selamnew
   ```

3. **Environment variables not working**
   - Check GitHub secrets configuration
   - Verify container group JSON template
   - Review deployment logs

4. **Storage issues**
   ```bash
   # Check storage account
   az storage account show --resource-group AI-102 --name <storage-account-name>
   
   # Check file share
   az storage share list --account-name <storage-account-name>
   ```

## 📊 Monitoring and Maintenance

### Regular Tasks
- [ ] Monitor container logs weekly
- [ ] Check Azure service usage and costs
- [ ] Update dependencies regularly
- [ ] Backup important data
- [ ] Review security settings

### Scaling Considerations
- [ ] Monitor resource utilization
- [ ] Plan for horizontal scaling if needed
- [ ] Consider Azure Kubernetes Service for production
- [ ] Implement monitoring and alerting

## 🔄 Update Process

### Updating the Application
1. Make code changes
2. Test locally: `docker-compose up --build`
3. Commit changes: `git add . && git commit -m "Update description"`
4. Push to main: `git push origin main`
5. Monitor GitHub Actions deployment
6. Verify deployment works

### Rolling Back
1. Identify the problematic commit
2. Revert the commit: `git revert <commit-hash>`
3. Push the revert: `git push origin main`
4. Monitor automatic redeployment

## 📞 Support Resources

### Documentation
- [Deployment Guide](DEPLOYMENT.md)
- [Azure Container Instances Documentation](https://docs.microsoft.com/en-us/azure/container-instances/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Help Commands
```bash
# Get container IP and FQDN
az container show \
  --resource-group AI-102 \
  --name document-intelligence-container \
  --query "{ip: ipAddress.ip, fqdn: ipAddress.fqdn}" \
  --output tsv

# Get deployment logs
az container logs \
  --resource-group AI-102 \
  --name document-intelligence-container \
  --follow

# Restart container
az container restart \
  --resource-group AI-102 \
  --name document-intelligence-container
```

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Application is accessible via the provided URL
- ✅ All features work (registration, upload, analysis)
- ✅ Azure services are properly integrated
- ✅ Static IP is reserved for future use
- ✅ Environment variables are securely configured
- ✅ GitHub Actions workflow runs successfully
- ✅ Container logs show no critical errors

## 📈 Next Steps

1. **Monitor Performance**: Set up monitoring and alerting
2. **Security Review**: Conduct security assessment
3. **Backup Strategy**: Implement backup procedures
4. **Documentation**: Update team documentation
5. **User Training**: Train users on the new system

---

**Last Updated**: $(date)
**Version**: 1.0
**Maintainer**: Document Intelligence Team
