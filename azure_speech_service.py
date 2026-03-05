"""
Azure Speech Services Integration
Handles voice transcription using Azure Cognitive Services
"""

import os
import azure.cognitiveservices.speech as speechsdk
from typing import Optional, Dict, Any
import io
import wave
import struct
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AzureSpeechService:
    """Azure Speech Services client for voice transcription"""
    
    def __init__(self, speech_key: str, speech_region: str):
        """
        Initialize Azure Speech Service
        
        Args:
            speech_key: Azure Speech Services key
            speech_region: Azure Speech Services region
        """
        self.speech_key = speech_key
        self.speech_region = speech_region
        self.speech_config = None
        self.setup_speech_config()
    
    def setup_speech_config(self):
        """Setup speech configuration"""
        try:
            self.speech_config = speechsdk.SpeechConfig(
                subscription=self.speech_key,
                region=self.speech_region
            )
            self.speech_config.speech_recognition_language = "en-US"
            self.speech_config.output_format = speechsdk.OutputFormat.Simple
            
            logger.info("Azure Speech Services configured successfully")
        except Exception as e:
            logger.error(f"Failed to setup Azure Speech Services: {e}")
            raise
    
    def transcribe_audio_bytes(self, audio_bytes: bytes) -> Optional[str]:
        """
        Transcribe audio bytes to text using Azure Speech Services
        
        Args:
            audio_bytes: Raw audio data in bytes
            
        Returns:
            Transcribed text or None if failed
        """
        try:
            # Convert audio bytes to WAV format
            wav_data = self.convert_to_wav(audio_bytes)
            
            # Create audio stream from WAV data
            audio_stream = speechsdk.audio.PushAudioInputStream()
            audio_stream.write(wav_data)
            audio_stream.close()
            
            # Create audio config
            audio_config = speechsdk.audio.AudioConfig(stream=audio_stream)
            
            # Create speech recognizer
            recognizer = speechsdk.SpeechRecognizer(
                speech_config=self.speech_config,
                audio_config=audio_config
            )
            
            # Perform recognition
            result = recognizer.recognize_once()
            
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                return result.text
            elif result.reason == speechsdk.ResultReason.NoMatch:
                logger.warning("No speech could be recognized")
                return "No speech detected"
            else:
                logger.error(f"Speech recognition failed: {result.reason}")
                return None
                
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return None
    
    def transcribe_audio_file(self, file_path: str) -> Optional[str]:
        """
        Transcribe audio file to text
        
        Args:
            file_path: Path to audio file
            
        Returns:
            Transcribed text or None if failed
        """
        try:
            # Create audio config from file
            audio_config = speechsdk.audio.AudioConfig(filename=file_path)
            
            # Create speech recognizer
            recognizer = speechsdk.SpeechRecognizer(
                speech_config=self.speech_config,
                audio_config=audio_config
            )
            
            # Perform recognition
            result = recognizer.recognize_once()
            
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                return result.text
            elif result.reason == speechsdk.ResultReason.NoMatch:
                logger.warning("No speech could be recognized")
                return "No speech detected"
            else:
                logger.error(f"Speech recognition failed: {result.reason}")
                return None
                
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return None
    
    def convert_to_wav(self, audio_bytes: bytes, sample_rate: int = 16000, channels: int = 1) -> bytes:
        """
        Convert raw audio bytes to WAV format
        
        Args:
            audio_bytes: Raw audio data
            sample_rate: Sample rate (default 16000)
            channels: Number of channels (default 1 for mono)
            
        Returns:
            WAV format audio bytes
        """
        try:
            # Create WAV file in memory
            wav_buffer = io.BytesIO()
            
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(channels)
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(sample_rate)
                
                # Convert bytes to 16-bit samples
                # Assuming input is 16-bit PCM
                samples = []
                for i in range(0, len(audio_bytes), 2):
                    if i + 1 < len(audio_bytes):
                        sample = struct.unpack('<h', audio_bytes[i:i+2])[0]
                        samples.append(sample)
                
                wav_file.writeframes(struct.pack('<' + 'h' * len(samples), *samples))
            
            wav_buffer.seek(0)
            return wav_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"WAV conversion error: {e}")
            # Return original bytes if conversion fails
            return audio_bytes
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages for speech recognition"""
        # Common languages supported by Azure Speech Services
        return [
            "en-US", "en-GB", "en-AU", "en-CA", "en-IN",
            "es-ES", "es-MX", "es-AR",
            "fr-FR", "fr-CA",
            "de-DE", "de-AT",
            "it-IT",
            "pt-BR", "pt-PT",
            "zh-CN", "zh-TW",
            "ja-JP",
            "ko-KR",
            "ru-RU",
            "ar-SA",
            "hi-IN"
        ]
    
    def set_language(self, language: str):
        """
        Set speech recognition language
        
        Args:
            language: Language code (e.g., "en-US")
        """
        if self.speech_config:
            self.speech_config.speech_recognition_language = language
            logger.info(f"Speech recognition language set to: {language}")
        else:
            logger.error("Speech config not initialized")

class MockSpeechService:
    """Mock speech service for testing without Azure credentials"""
    
    def __init__(self, speech_key: str = "", speech_region: str = ""):
        logger.info("Using Mock Speech Service for testing")
    
    def transcribe_audio_bytes(self, audio_bytes: bytes) -> Optional[str]:
        """Mock transcription - returns sample text"""
        sample_transcriptions = [
            "This is a sample transcription of the recorded audio. In production, this would be replaced with actual Azure Speech Services transcription.",
            "Hello, this is a test of the voice recording feature. The audio has been successfully captured and is being processed.",
            "The voice recording system is working properly. This mock transcription simulates the Azure Speech Services output.",
            "This demonstrates how the voice transcription would work with Azure Cognitive Services in the production environment.",
            "Audio recording and transcription feature is functioning as expected. The system is ready for Azure integration."
        ]
        
        import random
        return random.choice(sample_transcriptions)
    
    def transcribe_audio_file(self, file_path: str) -> Optional[str]:
        """Mock transcription for file"""
        return self.transcribe_audio_bytes(b"mock audio data")
    
    def get_supported_languages(self) -> list:
        """Return supported languages"""
        return ["en-US", "es-ES", "fr-FR", "de-DE", "it-IT", "pt-BR", "zh-CN", "ja-JP"]
    
    def set_language(self, language: str):
        """Mock language setting"""
        logger.info(f"Mock language set to: {language}")

def get_speech_service() -> AzureSpeechService:
    """
    Get speech service instance (Azure or Mock based on configuration)
    
    Returns:
        Speech service instance
    """
    speech_key = os.getenv("AZURE_SPEECH_KEY", "")
    speech_region = os.getenv("AZURE_SPEECH_REGION", "eastus")
    
    if speech_key and speech_key != "":
        logger.info("Using Azure Speech Services")
        return AzureSpeechService(speech_key, speech_region)
    else:
        logger.info("Azure Speech Services key not found, using Mock Service")
        return MockSpeechService(speech_key, speech_region)

# Test function
def test_speech_service():
    """Test the speech service"""
    try:
        service = get_speech_service()
        
        # Test with mock audio data
        mock_audio = b"mock audio data for testing"
        result = service.transcribe_audio_bytes(mock_audio)
        
        if result:
            logger.info(f"Test transcription successful: {result[:50]}...")
            return True
        else:
            logger.error("Test transcription failed")
            return False
            
    except Exception as e:
        logger.error(f"Speech service test failed: {e}")
        return False

if __name__ == "__main__":
    # Run test
    test_speech_service()
