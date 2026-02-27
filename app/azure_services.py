import os
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from azure.identity import DefaultAzureCredential
import openai
import logging
from typing import Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

class AzureDocumentIntelligence:
    def __init__(self):
        # Try to use environment variables first, then default to Azure credential
        self.endpoint = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT")
        self.key = os.getenv("AZURE_FORM_RECOGNIZER_KEY")
        
        if not self.endpoint:
            logger.error("AZURE_FORM_RECOGNIZER_ENDPOINT not configured")
            self.client = None
            return
        
        if self.key:
            self.credential = AzureKeyCredential(self.key)
            logger.info("Using Azure Form Recognizer with key authentication")
        else:
            # Use DefaultAzureCredential for production
            self.credential = DefaultAzureCredential()
            logger.info("Using Azure Form Recognizer with DefaultAzureCredential")
        
        self.client = DocumentAnalysisClient(endpoint=self.endpoint, credential=self.credential)
        
        # OpenAI configuration
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.openai_api_base = os.getenv("OPENAI_API_BASE")
        self.openai_deployment = os.getenv("OPENAI_DEPLOYMENT_NAME")
        
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
            if self.openai_api_base:
                openai.api_base = self.openai_api_base
            logger.info("OpenAI configured")
        else:
            logger.warning("OpenAI API key not configured")
    
    async def analyze_document(self, file_path: str, file_type: str) -> Tuple[Optional[str], Optional[float]]:
        """Extract text from document using Azure Form Recognizer"""
        if not self.client:
            logger.error("Document Intelligence client not initialized")
            return None, None
        
        try:
            # Determine the appropriate model based on file type
            if file_type == "application/pdf":
                model_id = "prebuilt-document"
            elif file_type in ["image/jpeg", "image/png"]:
                model_id = "prebuilt-read"
            elif "wordprocessingml" in file_type:
                model_id = "prebuilt-document"
            else:
                model_id = "prebuilt-document"
            
            with open(file_path, "rb") as f:
                poller = self.client.begin_analyze_document(
                    model_id=model_id,
                    document=f
                )
            
            result = poller.result()
            
            # Extract all text content
            extracted_text = ""
            confidence_scores = []
            
            if result.pages:
                for page in result.pages:
                    if page.lines:
                        for line in page.lines:
                            extracted_text += line.content + "\n"
                            # Note: Form Recognizer v4 doesn't provide line-level confidence
                            # We'll use a default confidence for now
                            confidence_scores.append(0.95)
            
            # Calculate average confidence
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.8
            
            logger.info(f"Successfully extracted {len(extracted_text)} characters from document")
            return extracted_text, avg_confidence
            
        except Exception as e:
            logger.error(f"Error analyzing document: {str(e)}")
            return None, None
    
    async def elaborate_with_ai(self, extracted_text: str) -> Optional[str]:
        """Use OpenAI to elaborate on the extracted text"""
        if not self.openai_api_key:
            return "OpenAI not configured. Unable to provide AI analysis."
        
        try:
            # Prepare the prompt
            prompt = f"""
            Please analyze the following document text and provide a comprehensive analysis including:
            
            1. A brief summary of the document content
            2. Key insights and important information
            3. Main topics or themes identified
            4. Any recommendations or next steps based on the content
            
            Document text:
            {extracted_text[:4000]}  # Limit to first 4000 characters for token limits
            
            Please provide the analysis in a clear, structured format with headings.
            """
            
            # Since we only have embedding model deployed, use a simpler approach
            # In production, you'd want to deploy a chat completion model
            # For now, we'll provide a basic analysis without actual OpenAI calls
            
            # Simple text-based analysis as fallback
            analysis = self.generate_basic_analysis(extracted_text)
            logger.info("Generated basic analysis (embedding model only)")
            return analysis
            
        except Exception as e:
            logger.error(f"Error generating AI analysis: {str(e)}")
            return f"AI analysis failed: {str(e)}"
    
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
