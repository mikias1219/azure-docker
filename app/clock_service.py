"""
Azure AI Language - Conversational Language Understanding (CLU) Clock Service
Handles natural language understanding for a clock application with intents like GetTime, GetDay, GetDate.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from azure.core.credentials import AzureKeyCredential
from azure.ai.language.conversations import ConversationAnalysisClient

logger = logging.getLogger(__name__)

# Supported cities with their UTC offsets (simplified for demo)
CITY_TIMEZONES = {
    "london": 0,
    "paris": 1,
    "berlin": 1,
    "rome": 1,
    "madrid": 1,
    "new york": -5,
    "newyork": -5,
    "los angeles": -8,
    "losangeles": -8,
    "chicago": -6,
    "tokyo": 9,
    "beijing": 8,
    "shanghai": 8,
    "sydney": 11,
    "dubai": 4,
    "moscow": 3,
    "mumbai": 5.5,
    "singapore": 8,
    "hong kong": 8,
    "hongkong": 8,
    "toronto": -5,
    "vancouver": -8,
    "sao paulo": -3,
    "saopaulo": -3,
    "cairo": 2,
    "johannesburg": 2,
    "istanbul": 3,
    "bangkok": 7,
    "seoul": 9,
    "jakarta": 7,
    "local": None  # Uses local system time
}

class ClockService:
    """Service for conversational language understanding in a clock application"""
    
    def __init__(self):
        self.endpoint = os.getenv("AZURE_LANGUAGE_ENDPOINT", "").rstrip('/')
        self.key = os.getenv("AZURE_LANGUAGE_KEY", "")
        self.project_name = "Clock"
        self.deployment_name = "production"
        self.client = None
        
        if self.endpoint and self.key:
            try:
                credential = AzureKeyCredential(self.key)
                # Ensure endpoint has proper format
                if not self.endpoint.startswith('http'):
                    self.endpoint = f"https://{self.endpoint}"
                self.client = ConversationAnalysisClient(
                    endpoint=self.endpoint,
                    credential=credential
                )
                logger.info(f"Azure AI Language CLU client configured with endpoint: {self.endpoint}")
            except Exception as e:
                logger.error(f"Failed to initialize CLU client: {e}")
                self.client = None
        else:
            logger.warning(f"Azure AI Language credentials not configured. Endpoint: {bool(self.endpoint)}, Key: {bool(self.key)}")
    
    async def analyze_conversation(self, query: str) -> Dict[str, Any]:
        """Analyze a conversation query to predict intent and extract entities"""
        if not self.client:
            logger.error("CLU client not initialized - returning error instead of demo")
            return {
                "query": query,
                "error": "Azure AI Language CLU not configured. Please set AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY.",
                "top_intent": "None",
                "confidence": 0.0,
                "entities": [],
                "response": "Service not configured. Please contact administrator."
            }
        
        try:
            logger.info(f"Analyzing query: {query}")
            result = self.client.analyze_conversation(
                task={
                    "kind": "Conversation",
                    "analysisInput": {
                        "conversationItem": {
                            "participantId": "1",
                            "id": "1",
                            "modality": "text",
                            "language": "en",
                            "text": query
                        },
                        "isLoggingEnabled": False
                    },
                    "parameters": {
                        "projectName": self.project_name,
                        "deploymentName": self.deployment_name,
                        "verbose": True
                    }
                }
            )
            
            # Extract intent and entities
            prediction = result.get("result", {}).get("prediction", {})
            top_intent = prediction.get("topIntent", "None")
            intents = prediction.get("intents", [])
            entities = prediction.get("entities", [])
            
            # Process the intent
            response = await self._process_intent(top_intent, entities, query)
            
            return {
                "query": query,
                "top_intent": top_intent,
                "confidence": intents[0].get("confidenceScore", 0.0) if intents else 0.0,
                "entities": [
                    {
                        "category": e.get("category"),
                        "text": e.get("text"),
                        "confidence": e.get("confidenceScore", 0.0),
                        "offset": e.get("offset"),
                        "length": e.get("length")
                    }
                    for e in entities
                ],
                "response": response,
                "raw_result": prediction
            }
        except Exception as e:
            err_msg = str(e).lower()
            # If CLU project/deployment not found, use demo so the Clock still works
            if "not found" in err_msg or "deployment" in err_msg or "cannot be found" in err_msg:
                logger.warning(f"CLU deployment not found ({e}); using demo mode for query: {query[:50]}")
                return await self._demo_analyze(query)
            logger.error(f"Error analyzing conversation: {e}")
            return {
                "query": query,
                "error": f"Azure CLU Error: {str(e)}",
                "top_intent": "None",
                "confidence": 0.0,
                "entities": [],
                "response": f"Error processing request: {str(e)}"
            }
    
    async def _process_intent(self, intent: str, entities: List[Dict], query: str) -> str:
        """Process the predicted intent and generate appropriate response"""
        if intent == "GetTime":
            location = self._extract_location(entities) or "local"
            return self._get_time(location)
        elif intent == "GetDay":
            date_str = self._extract_date(entities)
            return self._get_day(date_str)
        elif intent == "GetDate":
            weekday = self._extract_weekday(entities)
            return self._get_date(weekday)
        else:
            return "I'm not sure what you're asking. Try asking for the time, the day, or the date."
    
    def _extract_location(self, entities: List[Dict]) -> Optional[str]:
        """Extract location entity from entities list"""
        for entity in entities:
            if entity.get("category") == "Location":
                return entity.get("text", "").lower()
        return None
    
    def _extract_date(self, entities: List[Dict]) -> Optional[str]:
        """Extract date entity from entities list"""
        for entity in entities:
            if entity.get("category") == "Date":
                return entity.get("text")
        return None
    
    def _extract_weekday(self, entities: List[Dict]) -> Optional[str]:
        """Extract weekday entity from entities list"""
        for entity in entities:
            if entity.get("category") == "Weekday":
                return entity.get("text", "").lower()
        return None
    
    def _get_time(self, location: str) -> str:
        """Get current time for a location"""
        location_lower = location.lower().strip()
        
        if location_lower == "local" or location_lower not in CITY_TIMEZONES:
            now = datetime.now()
            return f"The current local time is {now.strftime('%I:%M %p')}."
        
        offset = CITY_TIMEZONES.get(location_lower)
        if offset is not None:
            utc_now = datetime.utcnow()
            target_time = utc_now + timedelta(hours=offset)
            return f"The current time in {location.title()} is {target_time.strftime('%I:%M %p')}."
        
        return f"Sorry, I don't know the time zone for {location}."
    
    def _get_day(self, date_str: Optional[str] = None) -> str:
        """Get the day of the week for a given date"""
        if date_str:
            # Try to parse the date
            try:
                # Handle various date formats
                for fmt in ["%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d", "%B %d %Y", "%b %d %Y", "%b %dth %Y", "%B %dth %Y"]:
                    try:
                        date_obj = datetime.strptime(date_str, fmt)
                        return f"{date_str} falls on a {date_obj.strftime('%A')}."
                    except ValueError:
                        continue
                
                # If no format worked, return today's day
                today = datetime.now()
                return f"Today is {today.strftime('%A')}. (I couldn't parse '{date_str}')"
            except:
                today = datetime.now()
                return f"Today is {today.strftime('%A')}."
        else:
            today = datetime.now()
            return f"Today is {today.strftime('%A')}."
    
    def _get_date(self, weekday: Optional[str] = None) -> str:
        """Get the date for a given weekday"""
        if weekday:
            # Map weekday names to numbers
            weekdays = {
                "sunday": 0, "sun": 0,
                "monday": 1, "mon": 1,
                "tuesday": 2, "tue": 2, "tues": 2,
                "wednesday": 3, "wed": 3, "weds": 3,
                "thursday": 4, "thur": 4, "thurs": 4,
                "friday": 5, "fri": 5,
                "saturday": 6, "sat": 6
            }
            
            target_day = weekdays.get(weekday.lower())
            if target_day is not None:
                today = datetime.now()
                days_ahead = target_day - today.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                target_date = today + timedelta(days=days_ahead)
                return f"{weekday.title()} will be {target_date.strftime('%B %d, %Y')}."
            else:
                today = datetime.now()
                return f"Today is {today.strftime('%B %d, %Y')}. (I don't recognize '{weekday}')"
        else:
            today = datetime.now()
            return f"Today is {today.strftime('%B %d, %Y')}."
    
    async def _demo_analyze(self, query: str) -> Dict[str, Any]:
        """Demo mode - simulate CLU analysis"""
        query_lower = query.lower()
        
        # Simple pattern matching for demo
        if "time" in query_lower:
            intent = "GetTime"
            confidence = 0.95
            entities = []
            
            # Check for location
            for city in CITY_TIMEZONES.keys():
                if city in query_lower and city != "local":
                    entities.append({
                        "category": "Location",
                        "text": city.title(),
                        "confidence": 0.9,
                        "offset": query_lower.find(city),
                        "length": len(city)
                    })
                    break
            
            response = self._get_time(entities[0]["text"] if entities else "local")
            
        elif "day" in query_lower or "week" in query_lower:
            intent = "GetDay"
            confidence = 0.9
            entities = []
            response = self._get_day()
            
        elif "date" in query_lower:
            intent = "GetDate"
            confidence = 0.9
            entities = []
            
            # Check for weekday
            weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
            short_days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat", "thurs", "tues", "weds"]
            all_days = weekdays + short_days
            
            for day in all_days:
                if day in query_lower:
                    entities.append({
                        "category": "Weekday",
                        "text": day.title(),
                        "confidence": 0.85,
                        "offset": query_lower.find(day),
                        "length": len(day)
                    })
                    break
            
            weekday = entities[0]["text"] if entities else None
            response = self._get_date(weekday)
            
        else:
            intent = "None"
            confidence = 0.0
            entities = []
            response = "I'm not sure what you're asking. Try asking for the time, the day, or the date."
        
        return {
            "query": query,
            "top_intent": intent,
            "confidence": confidence,
            "entities": entities,
            "response": response,
            "demo_mode": True
        }
    
    async def get_info(self) -> Dict[str, Any]:
        """Get information about the CLU service"""
        return {
            "project_name": self.project_name,
            "deployment_name": self.deployment_name,
            "configured": self.client is not None,
            "intents": ["GetTime", "GetDay", "GetDate"],
            "entities": ["Location", "Weekday", "Date"],
            "supported_cities": list(CITY_TIMEZONES.keys()),
            "examples": [
                "What's the time?",
                "What time is it in London?",
                "What day is it?",
                "What day was 01/01/2020?",
                "What's the date?",
                "What date is Friday?"
            ]
        }

# Singleton instance
clock_service = ClockService()
