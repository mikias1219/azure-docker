#!/usr/bin/env python3
"""
Script to programmatically configure Azure AI Language Question Answering knowledge base.
Adds URL sources, chitchat, and custom Q&A pairs to the LearnFAQ project.
"""

import os
import json
import requests
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Azure AI Language configuration
ENDPOINT = os.getenv("AZURE_LANGUAGE_ENDPOINT", "https://eastus.api.cognitive.microsoft.com/")
KEY = os.getenv("AZURE_LANGUAGE_KEY", "")
PROJECT_NAME = "LearnFAQ"
API_VERSION = "2023-04-01"

def get_auth_headers():
    """Get headers with authentication"""
    return {
        "Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "application/json"
    }

def get_project_url():
    """Get base URL for project operations"""
    return f"{ENDPOINT}/language/query-knowledgebases/projects/{PROJECT_NAME}"

def add_url_source():
    """Add Microsoft Learn FAQ URL as a source"""
    url = f"{get_project_url()}/sources?api-version={API_VERSION}"
    
    payload = {
        "sources": [
            {
                "op": "add",
                "value": {
                    "displayName": "Learn FAQ Page",
                    "sourceUri": "https://learn.microsoft.com/en-us/training/support/faq?pivots=general",
                    "sourceKind": "url"
                }
            }
        ]
    }
    
    try:
        response = requests.patch(url, headers=get_auth_headers(), json=payload)
        if response.status_code in [200, 201, 202]:
            logger.info("✅ URL source added successfully")
            return True
        else:
            logger.error(f"Failed to add URL source: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error adding URL source: {e}")
        return False

def add_chitchat_source():
    """Add chitchat source with Friendly personality"""
    url = f"{get_project_url()}/sources?api-version={API_VERSION}"
    
    payload = {
        "sources": [
            {
                "op": "add",
                "value": {
                    "displayName": "ChitChat",
                    "sourceKind": "chitchat",
                    "language": "en",
                    "chitchatDataset": "friendly"
                }
            }
        ]
    }
    
    try:
        response = requests.patch(url, headers=get_auth_headers(), json=payload)
        if response.status_code in [200, 201, 202]:
            logger.info("✅ Chitchat source added successfully")
            return True
        else:
            logger.error(f"Failed to add chitchat source: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error adding chitchat source: {e}")
        return False

def add_custom_qna_pairs():
    """Add custom Q&A pairs to the knowledge base"""
    url = f"{get_project_url()}/qnas?api-version={API_VERSION}"
    
    # Add the custom Q&A about modules - use simpler format
    payload = {
        "value": [
            {
                "id": 0,
                "answer": "Microsoft Learn offers various types of training modules, including role-based learning paths, product-specific modules, and hands-on labs. Each module contains units with lessons and knowledge checks to help you learn at your own pace.",
                "source": "Learn FAQ Page",
                "questions": [
                    "What are the different types of modules on Microsoft Learn?",
                    "How are training modules organized?",
                    "What types of learning content does Microsoft Learn offer?"
                ],
                "metadata": {
                    "category": "learning",
                    "topic": "modules"
                }
            }
        ]
    }
    
    try:
        response = requests.put(url, headers=get_auth_headers(), json=payload)
        if response.status_code in [200, 201, 202]:
            logger.info("✅ Custom Q&A pairs added successfully")
            return True
        else:
            logger.error(f"Failed to add Q&A pairs: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error adding Q&A pairs: {e}")
        return False

def deploy_knowledge_base():
    """Deploy the knowledge base to production"""
    url = f"{get_project_url()}/deployments/production?api-version={API_VERSION}"
    
    payload = {
        "deploymentName": "production"
    }
    
    try:
        response = requests.put(url, headers=get_auth_headers(), json=payload)
        if response.status_code in [200, 201, 202]:
            logger.info("✅ Knowledge base deployed successfully")
            return True
        else:
            logger.error(f"Failed to deploy knowledge base: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error deploying knowledge base: {e}")
        return False

def main():
    """Main function to configure the knowledge base"""
    logger.info("🚀 Starting Azure AI Language Question Answering configuration...")
    logger.info(f"Project: {PROJECT_NAME}")
    logger.info(f"Endpoint: {ENDPOINT}")
    
    if not KEY:
        logger.error("❌ AZURE_LANGUAGE_KEY not set!")
        return 1
    
    # Add sources
    results = []
    
    logger.info("\n📚 Step 1: Adding URL source (Microsoft Learn FAQ)...")
    results.append(add_url_source())
    
    logger.info("\n💬 Step 2: Adding chitchat source...")
    results.append(add_chitchat_source())
    
    logger.info("\n❓ Step 3: Adding custom Q&A pairs...")
    results.append(add_custom_qna_pairs())
    
    logger.info("\n🚀 Step 4: Deploying knowledge base...")
    results.append(deploy_knowledge_base())
    
    # Summary
    logger.info("\n" + "="*50)
    if all(results):
        logger.info("✅ Knowledge base configuration completed successfully!")
        logger.info("\nYou can now test the Q&A feature in your app.")
        return 0
    else:
        logger.warning("⚠️ Some configuration steps failed. Check logs above.")
        return 1

if __name__ == "__main__":
    exit(main())
