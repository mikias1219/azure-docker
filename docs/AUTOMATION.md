# Automation Guide — No Repetitive Tasks

This project is designed so that **one manual step** (setting `AZURE_CREDENTIALS`) is enough. Everything else is automated in GitHub Actions and scripts.

---

## One-time setup (you do this once)

1. **Create a service principal** with Contributor access to your Azure subscription or resource group (e.g. `AI-102`).
2. **Add one secret** in GitHub: **Settings → Secrets and variables → Actions**:
   - **`AZURE_CREDENTIALS`**: JSON `{"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}`

Optional (recommended for stable login across redeploys):

- **`SECRET_KEY`**: A random string for JWT signing (e.g. `openssl rand -hex 32`). If unset, the app uses a default.

You can run **`./setup-secrets.sh`** locally (after `az login` and `gh auth login`) to create the service principal and set both secrets automatically.

---

## What runs on every push to `main`

The **Deploy Document Intelligence App to Azure** workflow runs in this order. You do not run these by hand.

| Step | What it does | Repetitive? |
|------|----------------|-------------|
| Validate Azure credentials | Checks `AZURE_CREDENTIALS` is valid JSON | No — single check |
| Azure Login | Logs in with the service principal | No — automatic |
| **Ensure Azure resources** | Runs `create_all_azure_services.sh`: creates **only missing** resources (resource group, ACR, Document Intelligence, OpenAI, Language, Vision, Search, Speech). If a service already exists, it is skipped. | No — idempotent |
| Assess Azure resources | Runs `assess_azure_resources.sh` (verification only; does not fail the job) | No — info only |
| **Get deployment credentials** | Runs `get_credentials_for_ci.sh`: fetches **endpoint and key for every Azure service** that exists and writes them to `GITHUB_ENV`. No manual copy-paste. | No — automatic |
| Ensure OpenAI deployments | Runs `ensure_openai_deployments.sh`: creates chat and embedding deployments if missing (best-effort; continues on error) | No — idempotent |
| Ensure persistence | Runs `ensure_aci_fileshare.sh`: creates storage account and file share if missing, sets `DATABASE_URL`, `UPLOADS_DIR`, etc. in `GITHUB_ENV` | No — idempotent |
| Build and push image | Builds Docker image, pushes to ACR | No — standard CI |
| **Deploy to ACI** | Runs `generate_aci_config.py` with **all env vars from `GITHUB_ENV`** (endpoints, keys, etc.) and deploys the container. The running app receives every credential automatically. | No — single deploy |

Result: **If an AI service does not exist, the workflow creates it; then it fetches its endpoint and key and passes them to the container. No extra steps for you.**

---

## If an AI service does not exist

- **Create**: `create_all_azure_services.sh` creates only what is missing (by name/resource group). No duplicate resources.
- **Distribute**: `get_credentials_for_ci.sh` reads from Azure (endpoint + key) and writes to `GITHUB_ENV`. The same run’s deploy step passes these into the container via `generate_aci_config.py`.
- **Store in GitHub Secrets (optional)**: If you want to **persist** these values in repo secrets (e.g. for other workflows or to avoid re-fetching), run **`./setup-secrets.sh`** locally once after resources exist. It uses `az` and `gh` to set secrets. The deploy workflow does **not** require this; it uses `GITHUB_ENV` for the current run.

**Rule**: For the app to get an endpoint/key, the resource must exist in Azure. The workflow creates missing resources, then fetches and passes credentials. If a secret already exists in GitHub (e.g. from `setup-secrets.sh`), the workflow still overwrites the **job** env with values from Azure when it runs `get_credentials_for_ci.sh`, so the deployed app always uses the latest endpoints/keys from Azure.

---

## No time wasted on repetitive tasks

- You do **not** manually create each Azure service.
- You do **not** manually copy endpoints and keys into the repo or the container.
- You do **not** re-run multiple scripts by hand for each deploy.

You **only**:

1. Set `AZURE_CREDENTIALS` (and optionally `SECRET_KEY`) once.
2. Push to `main` (or trigger the workflow manually).

The workflow creates missing services, fetches all credentials, and deploys. Each service communicates with the app because the container receives the correct env vars every time.

---

## Summary

| Question | Answer |
|----------|--------|
| Do I create Azure services by hand? | No. `create_all_azure_services.sh` in CI creates any that are missing. |
| Do I copy endpoint/key into the app? | No. `get_credentials_for_ci.sh` fetches them and passes via `GITHUB_ENV` → container env. |
| Do I need to store every key in GitHub Secrets? | No. One secret (`AZURE_CREDENTIALS`) is required. Optionally run `./setup-secrets.sh` to store others. |
| If a service is missing, what happens? | The workflow creates it, then fetches its endpoint/key and passes them to the container in the same run. |
