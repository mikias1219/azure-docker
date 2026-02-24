# FastAPI sample (Docker + ACR)

[![ACR Build](https://github.com/mikias1219/azure-docker/actions/workflows/acr-build.yml/badge.svg)](https://github.com/mikias1219/azure-docker/actions/workflows/acr-build.yml)

This repository contains a minimal FastAPI app and instructions to build and push a container image to Azure Container Registry `selamnew.azurecr.io`.

Local build & push (assumes you have `az` and `docker` installed):

```bash
# Login to Azure
az login
# Login to ACR (use registry name without .azurecr.io)
az acr login --name selamnew

# Build image and tag for ACR
docker build -t selamnew.azurecr.io/fastapi-sample:latest .

# Push
docker push selamnew.azurecr.io/fastapi-sample:latest
```

Quick run locally (without pushing):

```bash
docker build -t fastapi-sample:local .
docker run -p 8000:80 fastapi-sample:local
# app available at http://localhost:8000/
```

GitHub Actions

There is a workflow included to build and push on `push` to the `main` branch: see `.github/workflows/acr-build.yml`.

This workflow uses a service principal to authenticate and run `az acr build` in Azure. Set the following repository secrets in GitHub (Repository -> Settings -> Secrets):

- `AZURE_CLIENT_ID` — service principal client id
- `AZURE_CLIENT_SECRET` — service principal client secret
- `AZURE_TENANT_ID` — Azure tenant id
- `AZURE_SUBSCRIPTION_ID` — Azure subscription id

If you prefer the workflow to authenticate with ACR admin username/password instead, update the workflow to use `docker/login-action` and set `ACR_USERNAME` and `ACR_PASSWORD` secrets instead.

Files created:
- [main.py](main.py)
- [Dockerfile](Dockerfile)
- [requirements.txt](requirements.txt)
- [.dockerignore](.dockerignore)
- [.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml)


<!-- 
az acr build \
--registry selamnew \
--resource-group AI-102 \
--image fastapi-sample:latest \
. -->