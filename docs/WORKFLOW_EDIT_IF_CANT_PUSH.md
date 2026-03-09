# If you can't push (workflow scope error)

Git may reject pushes that change `.github/workflows/` when your token doesn't have the **workflow** scope.

## Option 1: Grant workflow scope (then push)

In a terminal:

```bash
gh auth refresh -h github.com -s workflow
```

Complete the browser flow, then:

```bash
git add .github/workflows/deploy-azure.yml
git commit -m "Add Search and embedding env vars to deploy workflow"
git push origin main
```

## Option 2: Edit the workflow on GitHub

1. Open: **https://github.com/mikias1219/azure-docker/edit/main/.github/workflows/deploy-azure.yml**
2. Find the **Deploy to Azure Container Instances** step and its `env:` block.
3. After the line `AZURE_AI_VISION_KEY: ${{ secrets.AZURE_AI_VISION_KEY }}` add these three lines:

```yaml
          AZURE_SEARCH_ENDPOINT: ${{ secrets.AZURE_SEARCH_ENDPOINT }}
          AZURE_SEARCH_KEY: ${{ secrets.AZURE_SEARCH_KEY }}
          AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME: ${{ secrets.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME }}
```

4. Commit the change (e.g. "Add Search and embedding env to workflow").

Your repo secrets already include these; the workflow just needs to pass them into the deploy step.
