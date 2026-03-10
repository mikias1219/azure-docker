import os
import logging
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

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

            # Prefer the service-provided full content, which is usually in natural reading order
            extracted_text = (getattr(result, "content", None) or "").strip()

            # Fallback: build text from page lines if content is missing for some reason
            if not extracted_text and getattr(result, "pages", None):
                lines: list[str] = []
                for page in result.pages:
                    if getattr(page, "lines", None):
                        for line in page.lines:
                            lines.append(line.content)
                extracted_text = "\n".join(lines).strip()

            # Document Intelligence v4 often omits fine-grained confidence; assume high quality if we have text
            avg_confidence = 0.9 if extracted_text else 0.0

            logger.info("Extracted %d characters from document (avg confidence %.2f)", len(extracted_text), avg_confidence)
            return extracted_text, avg_confidence

        except Exception as e:
            logger.error("Error analyzing document: %s", e)
            return None, None

    def _field_value(self, field: Any) -> Any:
        """Extract display value from Document Intelligence field."""
        if field is None:
            return None
        if getattr(field, "content", None) not in (None, ""):
            return field.content
        for attr in ("value_string", "value_number", "value_date", "value_time", "value_phone_number"):
            v = getattr(field, attr, None)
            if v is not None:
                return v
        if getattr(field, "value_currency", None) is not None:
            cur = field.value_currency
            if hasattr(cur, "amount") and hasattr(cur, "currency_symbol"):
                return f"{cur.currency_symbol or ''}{cur.amount}"
            return str(cur)
        if getattr(field, "value_address", None) is not None:
            return str(field.value_address)
        return None

    def analyze_invoice(self, file_path: str) -> Dict[str, Any]:
        """Analyze an invoice using prebuilt-invoice model. Returns dict with VendorName, CustomerName, InvoiceTotal, etc."""
        if not self.client:
            return {"error": "Document Intelligence not configured", "fields": {}}
        try:
            start_time = datetime.now()
            with open(file_path, "rb") as f:
                poller = self.client.begin_analyze_document("prebuilt-invoice", document=f)
            result = poller.result()
            end_time = datetime.now()
            
            fields: Dict[str, Any] = {}
            if result.documents:
                doc = result.documents[0]
                for name, field in (getattr(doc, "fields", None) or {}).items():
                    val = self._field_value(field)
                    if val is not None:
                        fields[name] = val
            
            return {
                "fields": fields, 
                "content": (getattr(result, "content", None) or "")[:5000],
                "debug": {
                    "model": "prebuilt-invoice",
                    "latency_ms": int((end_time - start_time).total_seconds() * 1000),
                    "fields_extracted": len(fields),
                    "endpoint": self.endpoint
                }
            }
        except Exception as e:
            logger.exception("Invoice analysis failed: %s", e)
            return {"error": str(e), "fields": {}}

    async def elaborate_with_ai(self, extracted_text: str) -> Dict[str, Any]:
        """Use Azure OpenAI to generate a rich analysis for the document text."""
        # Fallback if Azure OpenAI is not fully configured
        if not self.openai_client or not self.openai_deployment:
            logger.warning("Azure OpenAI client not available; using basic analysis fallback")
            return {"report": self.generate_basic_analysis(extracted_text), "reasoning": "Standard static audit applied (No LLM)."}

        try:
            prompt = (
                "You are an AI assistant that analyzes business documents.\n\n"
                "Analyze the following document text and provide a structured JSON response with two keys:\n"
                "1. 'report': A detailed markdown report including a summary, key insights, and recommendations.\n"
                "2. 'reasoning': A brief paragraph explaining how you arrived at these findings (e.g., 'Noted high frequency of keyword X', 'Identified invoice patterns').\n\n"
                "Document text:\n"
                f"{extracted_text[:6000]}\n"
            )

            start_time = datetime.now()
            response = self.openai_client.chat.completions.create(
                model=self.openai_deployment,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI that analyzes documents and produces structured JSON. Format: {\"report\": \"md text\", \"reasoning\": \"explanation\"}",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            end_time = datetime.now()

            import json
            raw_content = response.choices[0].message.content if response.choices else None
            if not raw_content:
                return {"report": self.generate_basic_analysis(extracted_text), "error": "AI returned no content"}

            data = json.loads(raw_content)
            return {
                "report": data.get("report"),
                "reasoning": data.get("reasoning"),
                "debug": {
                    "model": self.openai_deployment,
                    "latency_ms": int((end_time - start_time).total_seconds() * 1000),
                    "tokens": response.usage.total_tokens if hasattr(response, 'usage') else 0
                }
            }

        except Exception as e:
            logger.error("Error generating AI analysis with Azure OpenAI: %s", e)
            return {"report": self.generate_basic_analysis(extracted_text), "error": str(e)}

    async def answer_question(self, extracted_text: str, question: str) -> Dict[str, Any]:
        """Answer a question about the document using Azure OpenAI (Q&A over document)."""
        if not extracted_text or not question or not question.strip():
            return {"answer": "No document text or question provided."}
        if not self.openai_client or not self.openai_deployment:
            return {"answer": "Q&A is not available (Azure OpenAI not configured)."}
        try:
            context = extracted_text[:8000]
            prompt = (
                "Answer the following question using ONLY the document text below.\n"
                "Return a JSON object with: 'answer' (the answer) and 'evidence' (the snippet from text used).\n\n"
                f"Document text:\n{context}\n\n"
                f"Question: {question.strip()}\n\n"
            )
            
            start_time = datetime.now()
            response = self.openai_client.chat.completions.create(
                model=self.openai_deployment,
                messages=[
                    {"role": "system", "content": "You answer document questions in JSON: {\"answer\": \"text\", \"evidence\": \"snippet\"}"},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            end_time = datetime.now()
            
            import json
            data = json.loads(response.choices[0].message.content)
            return {
                "answer": data.get("answer"),
                "evidence": data.get("evidence"),
                "debug": {
                    "model": self.openai_deployment,
                    "latency_ms": int((end_time - start_time).total_seconds() * 1000)
                }
            }
        except Exception as e:
            logger.error("Error in document Q&A: %s", e)
            return {"answer": f"Error generating answer: {str(e)}"}
    
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
