# 🚀 Quick Start Guide

## Get Your Document Intelligence App Running in 5 Minutes

### Prerequisites
- Azure CLI installed
- GitHub CLI installed
- Docker installed

### Step 1: Set Up GitHub Secrets (One-time setup)
```bash
# Clone and navigate to your repository
git clone <your-repo-url>
cd azure-practice-app

# Run the automated secrets setup
./setup-secrets.sh
```

### Step 2: Deploy to Azure
```bash
# Option 1: Automated (Recommended)
git add .
git commit -m "Deploy to Azure"
git push origin main

# Option 2: Manual deployment
./deploy.sh
```

### Step 3: Access Your App
Wait 2-3 minutes for deployment, then access your app at the URL shown in the deployment summary.

### Step 4: Test the Application
1. Register a new user account
2. Upload a test document (PDF, Word, or image)
3. View the analysis results

---

## 🎯 That's it! Your app is now running with:
- ✅ Fixed IP address reserved
- ✅ Automated CI/CD pipeline
- ✅ Azure Document Intelligence integration
- ✅ Secure environment variables
- ✅ Persistent file storage

## Need Help?
- Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for detailed troubleshooting
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive documentation

## 🔄 Future Updates
Simply push changes to the main branch:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

The deployment happens automatically!
