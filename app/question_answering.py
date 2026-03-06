import os
import logging
from typing import Dict, Any, Optional, List
from azure.core.credentials import AzureKeyCredential
from azure.ai.language.questionanswering import QuestionAnsweringClient
from azure.ai.language.questionanswering.models import AnswersOptions

logger = logging.getLogger(__name__)

class QuestionAnsweringService:
    def __init__(self):
        self.endpoint = os.getenv("AZURE_LANGUAGE_ENDPOINT", "")
        self.key = os.getenv("AZURE_LANGUAGE_KEY", "")
        self.project_name = os.getenv("AZURE_QNA_PROJECT_NAME", "LearnFAQ")
        self.deployment_name = os.getenv("AZURE_QNA_DEPLOYMENT_NAME", "production")
        self.client = None
        
        if self.endpoint and self.key:
            try:
                credential = AzureKeyCredential(self.key)
                self.client = QuestionAnsweringClient(endpoint=self.endpoint, credential=credential)
                logger.info("Azure AI Language Question Answering client configured")
            except Exception as e:
                logger.error(f"Failed to initialize Question Answering client: {e}")
        else:
            logger.warning("Azure AI Language Question Answering credentials not configured")
    
    def is_configured(self) -> bool:
        """Check if the service is properly configured"""
        return self.client is not None
    
    async def get_answer(self, question: str) -> Dict[str, Any]:
        """Get answer for a question from the knowledge base"""
        if not self.client:
            logger.warning("Question Answering client not configured, returning demo response")
            return self._get_demo_answer(question)
        
        try:
            response = self.client.get_answers(
                question=question,
                project_name=self.project_name,
                deployment_name=self.deployment_name
            )
            
            answers = []
            for candidate in response.answers:
                answers.append({
                    "answer": candidate.answer,
                    "confidence": candidate.confidence,
                    "source": candidate.source,
                    "questions": candidate.questions if hasattr(candidate, 'questions') else [],
                    "metadata": dict(candidate.metadata) if hasattr(candidate, 'metadata') and candidate.metadata else {}
                })
            
            return {
                "answers": answers,
                "question": question,
                "project_name": self.project_name,
                "deployment_name": self.deployment_name
            }
        except Exception as e:
            logger.error(f"Question answering error: {e}")
            return {"error": str(e), "answers": []}
    
    async def get_answers_with_context(self, question: str, top: int = 3) -> Dict[str, Any]:
        """Get top answers with confidence scores"""
        if not self.client:
            return self._get_demo_answer(question)
        
        try:
            response = self.client.get_answers(
                question=question,
                project_name=self.project_name,
                deployment_name=self.deployment_name,
                top=top
            )
            
            answers = []
            for candidate in response.answers:
                answers.append({
                    "answer": candidate.answer,
                    "confidence": round(candidate.confidence, 2),
                    "source": candidate.source,
                    "questions": candidate.questions if hasattr(candidate, 'questions') else []
                })
            
            return {
                "answers": answers,
                "question": question,
                "project_name": self.project_name,
                "deployment_name": self.deployment_name
            }
        except Exception as e:
            logger.error(f"Question answering error: {e}")
            return {"error": str(e), "answers": []}
    
    def _get_demo_answer(self, question: str) -> Dict[str, Any]:
        """Return demo answers when service is not configured"""
        demo_answers = {
            "what is microsoft learn": {
                "answers": [{
                    "answer": "Microsoft Learn is a free, online training platform that provides interactive learning for Microsoft products and services. It offers modules, learning paths, and hands-on labs to help you build skills.",
                    "confidence": 0.95,
                    "source": "Demo Knowledge Base",
                    "questions": ["What is Microsoft Learn?", "Tell me about Microsoft Learn"]
                }],
                "note": "Demo mode - Azure AI Language Question Answering not configured"
            },
            "hello": {
                "answers": [{
                    "answer": "Hello! I'm here to help answer your questions about Microsoft Learn and other topics. What would you like to know?",
                    "confidence": 0.90,
                    "source": "Demo Chit Chat",
                    "questions": ["Hi", "Hello", "Hey there"]
                }],
                "note": "Demo mode - Azure AI Language Question Answering not configured"
            },
            "default": {
                "answers": [{
                    "answer": f"I received your question: \"{question}\". In production mode with Azure AI Language Question Answering configured, I would search the knowledge base for the best answer. To set up the full service, configure AZURE_LANGUAGE_ENDPOINT, AZURE_LANGUAGE_KEY, AZURE_QNA_PROJECT_NAME, and AZURE_QNA_DEPLOYMENT_NAME environment variables.",
                    "confidence": 0.50,
                    "source": "Demo Fallback",
                    "questions": []
                }],
                "note": "Demo mode - Azure AI Language Question Answering not configured"
            }
        }
        
        question_lower = question.lower().strip()
        
        for key in demo_answers:
            if key in question_lower:
                result = demo_answers[key].copy()
                result["question"] = question
                result["project_name"] = self.project_name
                result["deployment_name"] = self.deployment_name
                return result
        
        result = demo_answers["default"].copy()
        result["question"] = question
        result["project_name"] = self.project_name
        result["deployment_name"] = self.deployment_name
        return result
    
    async def get_knowledge_base_info(self) -> Dict[str, Any]:
        """Get information about the configured knowledge base"""
        return {
            "project_name": self.project_name,
            "deployment_name": self.deployment_name,
            "endpoint": self.endpoint,
            "configured": self.is_configured(),
            "endpoint_configured": bool(self.endpoint),
            "key_configured": bool(self.key)
        }

# Create a singleton instance
question_answering = QuestionAnsweringService()
