import os
import logging
from datetime import datetime
from typing import Optional, Tuple

from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from azure.identity import DefaultAzureCredential
from openai import AzureOpenAI

logger = logging.getLogger(__name__)


class AzureDocumentIntelligence:
    def __init__(self):
        # Document Intelligence configuration (use Standard SKU resource in Azure for best quality)
        self.endpoint = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT")
        self.key = os.getenv("AZURE_FORM_RECOGNIZER_KEY")

        if not self.endpoint:
            logger.error("AZURE_FORM_RECOGNIZER_ENDPOINT not configured")
            self.client = None
        else:
            if self.key:
                credential = AzureKeyCredential(self.key)
                logger.info("Using Azure Form Recognizer with key authentication")
            else:
                credential = DefaultAzureCredential()
                logger.info("Using Azure Form Recognizer with DefaultAzureCredential")

            self.client = DocumentAnalysisClient(endpoint=self.endpoint, credential=credential)

        # Azure OpenAI configuration for LLM analysis
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.openai_api_base = os.getenv("OPENAI_API_BASE")
        self.openai_deployment = os.getenv("OPENAI_DEPLOYMENT_NAME")
        self.openai_api_version = os.getenv("OPENAI_API_VERSION", "2024-02-15-preview")

        self.openai_client: Optional[AzureOpenAI] = None
        if self.openai_api_key and self.openai_api_base and self.openai_deployment:
            try:
                self.openai_client = AzureOpenAI(
                    api_key=self.openai_api_key,
                    api_version=self.openai_api_version,
                    azure_endpoint=self.openai_api_base,
                )
                logger.info("Azure OpenAI client configured")
            except Exception as e:
                logger.error(f"Failed to initialize Azure OpenAI client: {e}")
        else:
            logger.warning(
                "Azure OpenAI not fully configured (need OPENAI_API_KEY, OPENAI_API_BASE, OPENAI_DEPLOYMENT_NAME)"
            )
    
    async def analyze_document(self, file_path: str, file_type: str) -> Tuple[Optional[str], Optional[float]]:
        """Extract text from document using Azure Document Intelligence."""
        if not self.client:
            logger.error("Document Intelligence client not initialized")
            return None, None

        try:
            # Use prebuilt models; quality depends on resource SKU (set to Standard in Azure)
            if file_type == "application/pdf":
                model_id = "prebuilt-document"
            elif file_type in ["image/jpeg", "image/png"]:
                model_id = "prebuilt-read"
            elif "wordprocessingml" in file_type:
                model_id = "prebuilt-document"
            else:
                model_id = "prebuilt-document"

            with open(file_path, "rb") as f:
                poller = self.client.begin_analyze_document(model_id=model_id, document=f)

            result = poller.result()

            extracted_text = ""
            confidence_scores: list[float] = []

            if getattr(result, "pages", None):
                for page in result.pages:
                    if getattr(page, "lines", None):
                        for line in page.lines:
                            extracted_text += line.content + "\n"
                            # Form Recognizer v4 often omits per-line confidence; assume high by default.
                            confidence_scores.append(0.95)

            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.8

            logger.info("Extracted %d characters from document (avg confidence %.2f)", len(extracted_text), avg_confidence)
            return extracted_text.strip(), avg_confidence

        except Exception as e:
            logger.error("Error analyzing document: %s", e)
            return None, None

    async def elaborate_with_ai(self, extracted_text: str) -> Optional[str]:
        """Use Azure OpenAI to generate a rich analysis for the document text."""
        # Fallback if Azure OpenAI is not fully configured
        if not self.openai_client or not self.openai_deployment:
            logger.warning("Azure OpenAI client not available; using basic analysis fallback")
            return self.generate_basic_analysis(extracted_text)

        try:
            prompt = (
                "You are an AI assistant that analyzes business documents.\n\n"
                "Analyze the following document text and provide:\n"
                "1. A concise summary (3–5 sentences)\n"
                "2. Key insights / important points as bullet lists\n"
                "3. Main topics or themes\n"
                "4. Any clear recommendations or next steps.\n\n"
                "Document text:\n"
                f"{extracted_text[:6000]}\n"
            )

            response = self.openai_client.chat.completions.create(
                model=self.openai_deployment,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI that analyzes documents and produces clear, structured reports.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=900,
            )

            content = response.choices[0].message.content if response.choices else None
            if not content:
                logger.warning("Azure OpenAI returned no content; falling back to basic analysis")
                return self.generate_basic_analysis(extracted_text)

            logger.info("Generated Azure OpenAI analysis for document")
            return content

        except Exception as e:
            logger.error("Error generating AI analysis with Azure OpenAI: %s", e)
            return self.generate_basic_analysis(extracted_text)
    
    def generate_basic_analysis(self, text: str) -> str:
        """Generate a basic analysis without AI model calls"""
        # Simple keyword-based analysis
        word_count = len(text.split())
        char_count = len(text)
        
        # Basic sentiment and content analysis
        analysis = f"""# Document Analysis

## Summary
This document contains approximately {word_count} words and {char_count} characters. The content has been processed using Azure Document Intelligence for text extraction.

## Key Information
- **Total Words**: {word_count}
- **Character Count**: {char_count}
- **Processing Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Content Overview
The document appears to contain structured text content. For more detailed AI-powered analysis including sentiment analysis, entity extraction, and comprehensive insights, an OpenAI chat completion model deployment is required.

## Recommendations
1. Deploy an OpenAI chat completion model (such as gpt-35-turbo) for advanced analysis
2. Configure the deployment name in the environment variables
3. The system will then provide detailed insights, summaries, and recommendations

## Current Status
- ✅ Text extraction completed using Azure Document Intelligence
- ⚠️ Advanced AI analysis requires chat completion model deployment
- 📊 Basic document statistics available above

*Note: This is a basic analysis. To enable full AI-powered analysis, please deploy a chat completion model in your Azure OpenAI resource.*
"""
        return analysis

# Global instance
document_intelligence = AzureDocumentIntelligence()
