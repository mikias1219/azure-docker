import os
import logging
from typing import Dict, Any, List, Optional
from azure.core.credentials import AzureKeyCredential
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
import base64
import io

logger = logging.getLogger(__name__)

class AIVisionService:
    def __init__(self):
        endpoint = os.getenv("AZURE_AI_VISION_ENDPOINT", "")
        self.endpoint = endpoint.rstrip("/") if endpoint else ""
        self.key = os.getenv("AZURE_AI_VISION_KEY", "")
        self.client = None

        if self.endpoint and self.key:
            try:
                credential = AzureKeyCredential(self.key)
                self.client = ImageAnalysisClient(endpoint=self.endpoint, credential=credential)
                logger.info("Azure AI Vision client configured")
            except Exception as e:
                logger.error(f"Failed to initialize AI Vision client: {e}")
        else:
            logger.warning("Azure AI Vision credentials not configured")
    
    def is_configured(self) -> bool:
        """Check if the service is properly configured"""
        return self.client is not None
    
    async def analyze_image(self, image_data: bytes, features: List[str] = None) -> Dict[str, Any]:
        """Analyze an image using Azure AI Vision"""
        if not self.client:
            return {
                "error": "Azure AI Vision not configured. Please set AZURE_AI_VISION_ENDPOINT and AZURE_AI_VISION_KEY.",
                "configured": False
            }
        
        if features is None:
            features = ["caption", "tags", "objects", "people"]
        
        try:
            logger.info(f"Analyzing image with features: {features}")
            
            # Map feature names to VisualFeatures
            visual_features = []
            for feature in features:
                if feature == "caption":
                    visual_features.append(VisualFeatures.CAPTION)
                elif feature == "tags":
                    visual_features.append(VisualFeatures.TAGS)
                elif feature == "objects":
                    visual_features.append(VisualFeatures.OBJECTS)
                elif feature == "people":
                    visual_features.append(VisualFeatures.PEOPLE)
                elif feature == "read":
                    visual_features.append(VisualFeatures.READ)
                elif feature == "smartCrops":
                    visual_features.append(VisualFeatures.SMART_CROPS)
            
            # Analyze image
            result = self.client.analyze(
                image_data=image_data,
                visual_features=visual_features
            )
            
            # Build response
            response = {
                "configured": True,
                "features_analyzed": features
            }
            
            # Caption
            if result.caption:
                response["caption"] = {
                    "text": result.caption.text,
                    "confidence": result.caption.confidence
                }
            
            # Tags
            if result.tags:
                response["tags"] = [
                    {"name": tag.name, "confidence": tag.confidence}
                    for tag in result.tags.list
                ]
            
            # Objects
            if result.objects:
                response["objects"] = [
                    {
                        "name": obj.tags[0].name if obj.tags else "unknown",
                        "confidence": obj.tags[0].confidence if obj.tags else 0,
                        "bounding_box": {
                            "x": obj.bounding_box.x,
                            "y": obj.bounding_box.y,
                            "width": obj.bounding_box.width,
                            "height": obj.bounding_box.height
                        }
                    }
                    for obj in result.objects.list
                ]
            
            # People
            if result.people:
                response["people"] = [
                    {
                        "confidence": person.confidence,
                        "bounding_box": {
                            "x": person.bounding_box.x,
                            "y": person.bounding_box.y,
                            "width": person.bounding_box.width,
                            "height": person.bounding_box.height
                        }
                    }
                    for person in result.people.list
                ]
            
            # OCR / Read
            if result.read:
                response["read"] = {
                    "blocks": [
                        {
                            "lines": [
                                {
                                    "text": line.text,
                                    "bounding_polygon": [
                                        {"x": p.x, "y": p.y} for p in line.bounding_polygon
                                    ],
                                    "words": [
                                        {
                                            "text": word.text,
                                            "confidence": word.confidence,
                                            "bounding_polygon": [
                                                {"x": p.x, "y": p.y} for p in word.bounding_polygon
                                            ]
                                        }
                                        for word in line.words
                                    ]
                                }
                                for line in block.lines
                            ]
                        }
                        for block in result.read.blocks
                    ],
                    "full_text": "\n".join([
                        line.text
                        for block in result.read.blocks
                        for line in block.lines
                    ])
                }
            
            return response
            
        except Exception as e:
            logger.error(f"Image analysis error: {e}")
            return {
                "error": str(e),
                "configured": self.is_configured()
            }
    
    async def read_text(self, image_data: bytes) -> Dict[str, Any]:
        """Extract text from an image using OCR"""
        if not self.client:
            return {
                "error": "Azure AI Vision not configured",
                "configured": False
            }
        
        try:
            logger.info("Reading text from image")
            
            result = self.client.analyze(
                image_data=image_data,
                visual_features=[VisualFeatures.READ]
            )
            
            if result.read:
                blocks = []
                full_text_lines = []
                
                for block in result.read.blocks:
                    block_data = {"lines": []}
                    for line in block.lines:
                        line_data = {
                            "text": line.text,
                            "bounding_polygon": [
                                {"x": p.x, "y": p.y} for p in line.bounding_polygon
                            ],
                            "words": [
                                {
                                    "text": word.text,
                                    "confidence": word.confidence,
                                    "bounding_polygon": [
                                        {"x": p.x, "y": p.y} for p in word.bounding_polygon
                                    ]
                                }
                                for word in line.words
                            ]
                        }
                        block_data["lines"].append(line_data)
                        full_text_lines.append(line.text)
                    blocks.append(block_data)
                
                return {
                    "configured": True,
                    "blocks": blocks,
                    "full_text": "\n".join(full_text_lines),
                    "language": result.read.language if hasattr(result.read, 'language') else None
                }
            else:
                return {
                    "configured": True,
                    "blocks": [],
                    "full_text": "",
                    "language": None
                }
                
        except Exception as e:
            logger.error(f"OCR error: {e}")
            return {
                "error": str(e),
                "configured": self.is_configured()
            }
    
    async def get_service_info(self) -> Dict[str, Any]:
        """Get information about the AI Vision service"""
        return {
            "endpoint": self.endpoint,
            "configured": self.is_configured(),
            "features_supported": [
                "caption",
                "tags",
                "objects",
                "people",
                "read",
                "smartCrops"
            ]
        }

# Create singleton instance
ai_vision = AIVisionService()
