# CI/CD and GitHub Secrets

## Required setup

1. **Azure login**  
   The workflow uses **Azure CLI** in GitHub Actions. You must provide:

   - **`AZURE_CREDENTIALS`** (required): Service principal JSON with **Contributor** on the resource group (or subscription):
     ```json
     {"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}
     ```
     Set in: **Repo → Settings → Secrets and variables → Actions**.

   - **`SECRET_KEY`** (optional): JWT signing secret for the app. If unset, the app uses a default; set once for stable logins across redeploys.

2. **No other secrets needed**  
   All other credentials are obtained at runtime by the workflow from Azure (see below).

## How the workflow gets credentials

1. **Azure Login**  
   Uses `AZURE_CREDENTIALS` to run `az login` in the job.

2. **Ensure Azure resources**  
   Runs `scripts/create_all_azure_services.sh` (resource group, ACR, Document Intelligence, OpenAI, Language, Vision, Search, Speech).

3. **Assess resources**  
   Runs `scripts/assess_azure_resources.sh` (verification only; continues on failure).

4. **Get deployment credentials**  
   Runs `scripts/get_credentials_for_ci.sh`, which:
   - Calls Azure CLI to fetch endpoints and keys for each service.
   - Writes them to **`GITHUB_ENV`** (e.g. `ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_FORM_RECOGNIZER_ENDPOINT`, `OPENAI_API_KEY`, `AZURE_SEARCH_ENDPOINT`, `AZURE_SPEECH_KEY`, etc.).
   - Subsequent steps in the same job see these as environment variables.

5. **Ensure OpenAI deployments**  
   Runs `scripts/ensure_openai_deployments.sh` (creates chat and embedding deployments if missing; continues on error).

6. **Ensure persistence**  
   Runs `scripts/ensure_aci_fileshare.sh`, which creates storage account and file share and writes to `GITHUB_ENV`:
   - `STORAGE_ACCOUNT_NAME`, `STORAGE_ACCOUNT_KEY`, `FILE_SHARE_NAME`
   - `DATABASE_URL`, `UPLOADS_DIR`

7. **Deploy step**  
   The “Deploy to Azure Container Instances” step receives all of the above via the job environment. It passes them into **`scripts/generate_aci_config.py`**, which:
   - Reads env vars (from `GITHUB_ENV` and the step’s `env` block).
   - Writes **`aci/container-group-updated.json`** with the container image, registry credentials, and **all** app env vars (including `AZURE_SEARCH_INDEX_NAME`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`).
   - The workflow then runs `az container create` with this file so the running container gets every credential from Azure.

## Verification

- After a run, open the **Deploy to Azure Container Instances** step log and confirm no errors.
- The **Deployment Summary** step prints the app URL (e.g. `http://<IP>:8000`). Open `/health` to confirm the app is up.
- In the app, log in and use each service (Documents, Vision, Language, Speech, Search, RAG); the dashboard shows “Service live” or “Service not configured” per pillar.

## One-time local setup (optional)

To create the service principal and set `AZURE_CREDENTIALS` (and optionally `SECRET_KEY`) in GitHub:

```bash
az login
gh auth login   # needs repo + workflow scope if you push workflow changes
./setup-secrets.sh
```

This script creates the SP, prints the JSON, and uses `gh secret set` to store `AZURE_CREDENTIALS` and optionally `SECRET_KEY`. All other credentials are still fetched in CI by `get_credentials_for_ci.sh` and `ensure_aci_fileshare.sh`.
