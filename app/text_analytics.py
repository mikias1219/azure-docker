import os
import logging
from typing import List, Dict, Any, Optional
from azure.core.credentials import AzureKeyCredential
from azure.ai.textanalytics import TextAnalyticsClient

logger = logging.getLogger(__name__)

class TextAnalyticsService:
    def __init__(self):
        self.endpoint = os.getenv("AZURE_LANGUAGE_ENDPOINT", "")
        self.key = os.getenv("AZURE_LANGUAGE_KEY", "")
        self.client = None
        
        if self.endpoint and self.key:
            try:
                credential = AzureKeyCredential(self.key)
                self.client = TextAnalyticsClient(endpoint=self.endpoint, credential=credential)
                logger.info("Azure AI Language Text Analytics client configured")
            except Exception as e:
                logger.error(f"Failed to initialize Text Analytics client: {e}")
        else:
            logger.warning("Azure AI Language credentials not configured")
    
    def is_configured(self) -> bool:
        """Check if the service is properly configured"""
        return self.client is not None
    
    async def detect_language(self, text: str) -> Dict[str, Any]:
        """Detect the language of the given text"""
        if not self.client:
            return {"language": "unknown", "confidence": 0.0, "error": "Service not configured"}
        
        try:
            response = self.client.detect_language(documents=[text])
            result = response[0]
            
            if not result.is_error:
                return {
                    "language": result.primary_language.name,
                    "iso_code": result.primary_language.iso6391_name,
                    "confidence": result.primary_language.confidence_score
                }
            else:
                return {"error": result.error.message}
        except Exception as e:
            logger.error(f"Language detection error: {e}")
            return {"error": str(e)}
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of the given text"""
        if not self.client:
            return {"sentiment": "unknown", "error": "Service not configured"}
        
        try:
            response = self.client.analyze_sentiment(documents=[text])
            result = response[0]
            
            if not result.is_error:
                return {
                    "sentiment": result.sentiment,
                    "confidence": {
                        "positive": result.confidence_scores.positive,
                        "neutral": result.confidence_scores.neutral,
                        "negative": result.confidence_scores.negative
                    }
                }
            else:
                return {"error": result.error.message}
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return {"error": str(e)}
    
    async def extract_key_phrases(self, text: str) -> Dict[str, Any]:
        """Extract key phrases from the given text"""
        if not self.client:
            return {"key_phrases": [], "error": "Service not configured"}
        
        try:
            response = self.client.extract_key_phrases(documents=[text])
            result = response[0]
            
            if not result.is_error:
                return {
                    "key_phrases": result.key_phrases if result.key_phrases else []
                }
            else:
                return {"error": result.error.message}
        except Exception as e:
            logger.error(f"Key phrase extraction error: {e}")
            return {"error": str(e)}
    
    async def recognize_entities(self, text: str) -> Dict[str, Any]:
        """Recognize named entities in the given text"""
        if not self.client:
            return {"entities": [], "error": "Service not configured"}
        
        try:
            response = self.client.recognize_entities(documents=[text])
            result = response[0]
            
            if not result.is_error:
                entities = []
                for entity in result.entities:
                    entities.append({
                        "text": entity.text,
                        "category": entity.category,
                        "subcategory": entity.subcategory,
                        "confidence": entity.confidence_score
                    })
                return {"entities": entities}
            else:
                return {"error": result.error.message}
        except Exception as e:
            logger.error(f"Entity recognition error: {e}")
            return {"error": str(e)}
    
    async def recognize_linked_entities(self, text: str) -> Dict[str, Any]:
        """Recognize linked entities (with Wikipedia links) in the given text"""
        if not self.client:
            return {"linked_entities": [], "error": "Service not configured"}
        
        try:
            response = self.client.recognize_linked_entities(documents=[text])
            result = response[0]
            
            if not result.is_error:
                entities = []
                for entity in result.entities:
                    entities.append({
                        "name": entity.name,
                        "url": entity.url,
                        "data_source": entity.data_source,
                        "matches": [{
                            "text": match.text,
                            "confidence": match.confidence_score
                        } for match in entity.matches]
                    })
                return {"linked_entities": entities}
            else:
                return {"error": result.error.message}
        except Exception as e:
            logger.error(f"Linked entity recognition error: {e}")
            return {"error": str(e)}
    
    async def analyze_text(self, text: str) -> Dict[str, Any]:
        """Perform complete text analysis"""
        if not self.client:
            return {
                "error": "Azure AI Language not configured. Set AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY."
            }
        
        try:
            results = {
                "language": await self.detect_language(text),
                "sentiment": await self.analyze_sentiment(text),
                "key_phrases": await self.extract_key_phrases(text),
                "entities": await self.recognize_entities(text),
                "linked_entities": await self.recognize_linked_entities(text)
            }
            return results
        except Exception as e:
            logger.error(f"Complete text analysis error: {e}")
            return {"error": str(e)}

# Create a singleton instance
text_analytics = TextAnalyticsService()
