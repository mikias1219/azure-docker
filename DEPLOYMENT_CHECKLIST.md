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
> **Automation note:** GitHub Actions now runs `scripts/ensure_openai_deployments.sh` to create these deployments automatically if they’re missing (best-effort; depends on region/quota/model availability).

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

The deployment workflow runs all setup scripts in GitHub Actions. You only need to set **one required secret** (and one optional):

1. **Required**
   - `AZURE_CREDENTIALS`: Service principal JSON `{"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}` with **Contributor** on the subscription or resource group. Create once (e.g. run `./setup-secrets.sh` locally to create the SP and set this secret, or create in Azure Portal and paste the JSON into repo Settings > Secrets).

2. **Optional (recommended for stable login)**
   - `SECRET_KEY`: JWT signing secret. If unset, the app uses a default; set this once so tokens stay valid across redeploys.

**No other secrets are required.** The workflow automatically:
- Runs `scripts/create_all_azure_services.sh` to create/ensure Azure resources (RG, ACR, Document Intelligence, OpenAI, Language, Vision, Search, Speech).
- Runs `scripts/assess_azure_resources.sh` to verify resources (including Azure AI Speech).
- Runs `scripts/get_credentials_for_ci.sh` and writes all endpoint/key env vars to `GITHUB_ENV` (ACR, Document Intelligence, OpenAI, Language, Vision, Search, Speech, etc.).
- Runs `scripts/ensure_openai_deployments.sh` to ensure Azure OpenAI **chat** + **embedding** deployments exist.
- Runs `scripts/ensure_aci_fileshare.sh` to create storage + file share and set `DATABASE_URL`, `UPLOADS_DIR`, `STORAGE_*`, `FILE_SHARE_NAME` in `GITHUB_ENV`.

The **Deploy to Azure Container Instances** step receives all these env vars and passes them into `scripts/generate_aci_config.py`, which writes them into the container group JSON (including `AZURE_SEARCH_INDEX_NAME`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`). The running container therefore gets all credentials from Azure; no manual secret setup besides `AZURE_CREDENTIALS` (and optional `SECRET_KEY`) is needed.

### One-time: get AZURE_CREDENTIALS
```bash
# Optional: run locally once to create service principal and set AZURE_CREDENTIALS (and SECRET_KEY if missing)
./setup-secrets.sh
```

## 🚀 Deployment Process

### Automated Deployment (GitHub Actions)
- **Production deploy**: Only **deploy-azure.yml** deploys to ACI (on push to `main`). It builds **Dockerfile.full** (frontend + backend, port 8000) and uses image tag **:full**.
- The **deploy.yml** workflow only runs on PRs / manual trigger and does **not** deploy (so it won’t overwrite the running container).
1. **Trigger**: Push to `main` branch runs **deploy-azure.yml**
2. **Build**: Docker image from Dockerfile.full, pushed to ACR as `document-intelligence-app:full` (and :main, :latest)
3. **Deploy**: Azure Container Instance created from ACI template (port 8000)
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

2. **"Could not validate credentials" or 401 on API calls (e.g. Info Extract, Text Analytics)**
   - **Cause:** JWT was signed with a different `SECRET_KEY` than the running app (e.g. after redeploy or first deploy without the secret).
   - **Fix:** Ensure `SECRET_KEY` is set in GitHub repo secrets and the workflow passes it to the container. Run `SKIP_LOGIN=1 ./setup-secrets.sh` to set SECRET_KEY if missing (it only sets it when not already present). Redeploy, then **log in again** in the app so a new token is issued with the current key.

3. **Azure / ACR authentication issues**
   ```bash
   # Verify Azure credentials
   az account show
   
   # Test ACR access
   az acr login --name selamnew
   ```

4. **Environment variables not working**
   - Check GitHub secrets configuration
   - Verify container group JSON template
   - Review deployment logs

5. **Storage issues**
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
