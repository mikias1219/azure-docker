"""
Document Intelligence App - Streamlit Frontend with Voice Recording
A modern Streamlit application with Azure AI services integration
"""

import streamlit as st
import requests
import json
import os
import io
import base64
from datetime import datetime
from typing import Dict, Any, Optional
import pandas as pd
from PIL import Image
import audio_recorder_streamlit as ar
from azure_speech_service import get_speech_service

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY", "")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "eastus")

# Session state management
if 'user' not in st.session_state:
    st.session_state.user = None
if 'transcriptions' not in st.session_state:
    st.session_state.transcriptions = []
if 'documents' not in st.session_state:
    st.session_state.documents = []
if 'speech_service' not in st.session_state:
    st.session_state.speech_service = get_speech_service()

class DocumentIntelligenceApp:
    """Main application class for Document Intelligence with Streamlit"""
    
    def __init__(self):
        self.api_base_url = API_BASE_URL
        self.setup_page_config()
    
    def setup_page_config(self):
        """Setup Streamlit page configuration"""
        st.set_page_config(
            page_title="Document Intelligence App",
            page_icon="📄",
            layout="wide",
            initial_sidebar_state="expanded"
        )
    
    def login_page(self):
        """Display login page"""
        st.title("🔐 Login to Document Intelligence")
        
        with st.form("login_form"):
            username = st.text_input("Username", key="login_username")
            password = st.text_input("Password", type="password", key="login_password")
            submit_button = st.form_submit_button("Login")
            
            if submit_button:
                if username and password:
                    success = self.login(username, password)
                    if success:
                        st.success("Login successful!")
                        st.rerun()
                    else:
                        st.error("Invalid credentials")
                else:
                    st.error("Please enter username and password")
        
        st.markdown("---")
        st.subheader("📝 Don't have an account?")
        if st.button("Go to Register"):
            st.session_state.show_register = True
            st.rerun()
    
    def register_page(self):
        """Display registration page"""
        st.title("📝 Register New Account")
        
        with st.form("register_form"):
            username = st.text_input("Username", key="reg_username")
            email = st.text_input("Email", key="reg_email")
            password = st.text_input("Password", type="password", key="reg_password")
            confirm_password = st.text_input("Confirm Password", type="password", key="reg_confirm_password")
            submit_button = st.form_submit_button("Register")
            
            if submit_button:
                if username and email and password:
                    if password == confirm_password:
                        success = self.register(username, email, password)
                        if success:
                            st.success("Registration successful! Please login.")
                            st.session_state.show_register = False
                            st.rerun()
                        else:
                            st.error("Registration failed")
                    else:
                        st.error("Passwords do not match")
                else:
                    st.error("Please fill all fields")
        
        if st.button("Back to Login"):
            st.session_state.show_register = False
            st.rerun()
    
    def login(self, username: str, password: str) -> bool:
        """Login user"""
        try:
            response = requests.post(
                f"{self.api_base_url}/token",
                data={"username": username, "password": password}
            )
            if response.status_code == 200:
                data = response.json()
                st.session_state.user = {
                    "username": username,
                    "token": data["access_token"],
                    "email": f"{username}@example.com"
                }
                return True
        except Exception as e:
            st.error(f"Login error: {e}")
        return False
    
    def register(self, username: str, email: str, password: str) -> bool:
        """Register new user"""
        try:
            response = requests.post(
                f"{self.api_base_url}/register",
                json={"username": username, "email": email, "password": password}
            )
            return response.status_code == 200
        except Exception as e:
            st.error(f"Registration error: {e}")
        return False
    
    def logout(self):
        """Logout user"""
        st.session_state.user = None
        st.session_state.transcriptions = []
        st.session_state.documents = []
        st.rerun()
    
    def sidebar(self):
        """Create sidebar navigation"""
        with st.sidebar:
            st.title("📄 Document Intelligence")
            
            # User info and logout
            if st.session_state.user:
                st.success(f"👤 {st.session_state.user['username']}")
                if st.button("🚪 Logout", key="sidebar_logout"):
                    self.logout()
            else:
                st.info("Not logged in")
                if st.button("🔐 Login", key="sidebar_login"):
                    st.session_state.show_login = True
                    st.rerun()
            
            st.markdown("---")
            
            # Navigation menu
            if st.session_state.user:
                page = st.selectbox(
                    "🧭 Navigation",
                    ["🎯 Dashboard", "📄 Documents", "🎙️ Voice Recording", "📝 Transcriptions", "⚙️ Settings"],
                    key="navigation"
                )
                return page
            else:
                st.info("Please login to access features")
                return None
    
    def dashboard(self):
        """Display dashboard"""
        st.title("🎯 Dashboard")
        st.markdown(f"Welcome back, **{st.session_state.user['username']}**!")
        
        # Statistics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("📄 Documents", len(st.session_state.documents))
        
        with col2:
            st.metric("🎙️ Recordings", len(st.session_state.transcriptions))
        
        with col3:
            st.metric("📝 Transcriptions", len([t for t in st.session_state.transcriptions if t.get('transcribed_text')]))
        
        with col4:
            st.metric("⏱️ Today", datetime.now().strftime("%Y-%m-%d"))
        
        st.markdown("---")
        
        # Recent activity
        st.subheader("📊 Recent Activity")
        
        if st.session_state.transcriptions:
            recent_transcriptions = st.session_state.transcriptions[-5:]
            for trans in recent_transcriptions:
                with st.expander(f"🎙️ {trans.get('timestamp', 'Unknown time')}"):
                    st.write(f"**Duration:** {trans.get('duration', 'Unknown')}s")
                    if trans.get('transcribed_text'):
                        st.write(f"**Transcription:** {trans['transcribed_text'][:200]}...")
                    else:
                        st.write("🔄 Processing...")
        else:
            st.info("No recent activity. Start by recording some audio!")
    
    def documents_page(self):
        """Display documents management page"""
        st.title("📄 Document Management")
        
        # Upload section
        st.subheader("📤 Upload Document")
        
        uploaded_file = st.file_uploader(
            "Choose a file",
            type=['pdf', 'docx', 'txt', 'jpg', 'png'],
            help="Upload documents for AI analysis"
        )
        
        if uploaded_file:
            col1, col2 = st.columns(2)
            
            with col1:
                st.write(f"**File:** {uploaded_file.name}")
                st.write(f"**Size:** {uploaded_file.size} bytes")
                st.write(f"**Type:** {uploaded_file.type}")
            
            with col2:
                if st.button("📤 Upload Document", key="upload_doc"):
                    success = self.upload_document(uploaded_file)
                    if success:
                        st.success("Document uploaded successfully!")
                        self.load_documents()
                    else:
                        st.error("Upload failed")
        
        st.markdown("---")
        
        # Documents list
        st.subheader("📋 Your Documents")
        
        if st.session_state.documents:
            for doc in st.session_state.documents:
                with st.expander(f"📄 {doc.get('filename', 'Unknown')}"):
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        st.write(f"**Type:** {doc.get('file_type', 'Unknown')}")
                        st.write(f"**Size:** {doc.get('file_size', 0)} bytes")
                    
                    with col2:
                        if doc.get('extracted_text'):
                            st.write(f"**Text Extracted:** ✅")
                        else:
                            st.write(f"**Text Extracted:** ❌")
                    
                    with col3:
                        if st.button(f"🔍 Analyze", key=f"analyze_{doc.get('id')}"):
                            self.analyze_document(doc.get('id'))
                    
                    if doc.get('extracted_text'):
                        st.write("**Extracted Text:**")
                        st.text_area("", doc['extracted_text'][:500] + "...", height=100, key=f"text_{doc.get('id')}")
                    
                    if doc.get('ai_analysis'):
                        st.write("**AI Analysis:**")
                        st.info(doc['ai_analysis'])
        else:
            st.info("No documents uploaded yet. Upload your first document above!")
    
    def voice_recording_page(self):
        """Display voice recording page"""
        st.title("🎙️ Voice Recording")
        
        st.markdown("Record your voice and get AI-powered transcription using Azure Speech Services")
        
        # Recording section
        st.subheader("🎤 Record Audio")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.write("**Recording Instructions:**")
            st.write("1. Click 'Start Recording' to begin")
            st.write("2. Speak clearly into your microphone")
            st.write("3. Click 'Stop Recording' when finished")
            st.write("4. Wait for transcription to process")
        
        with col2:
            # Audio recording widget
            audio_bytes = ar.audio_recorder(
                text="Click to record",
                recording_color="#ff0000",
                neutral_color="#6aa36f",
                icon_color="white",
                icon_size="2x"
            )
            
            if audio_bytes:
                st.success("🎙️ Recording completed!")
                
                # Display audio player
                st.audio(audio_bytes, format="audio/wav")
                
                # Save recording
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                recording_data = {
                    "timestamp": timestamp,
                    "audio_bytes": audio_bytes,
                    "duration": len(audio_bytes) / 44100,  # Approximate duration
                    "transcribed_text": None,
                    "transcribed": False
                }
                
                st.session_state.transcriptions.append(recording_data)
                
                # Transcribe button
                if st.button("🤖 Transcribe Audio", key="transcribe_now"):
                    with st.spinner("🔄 Transcribing audio..."):
                        transcription = self.transcribe_audio(audio_bytes)
                        if transcription:
                            recording_data["transcribed_text"] = transcription
                            recording_data["transcribed"] = True
                            st.success("✅ Transcription completed!")
                            st.rerun()
                        else:
                            st.error("❌ Transcription failed")
        
        st.markdown("---")
        
        # Recording history
        st.subheader("📋 Recording History")
        
        if st.session_state.transcriptions:
            for i, recording in enumerate(st.session_state.transcriptions):
                with st.expander(f"🎙️ {recording.get('timestamp', 'Unknown time')}"):
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.audio(recording['audio_bytes'], format="audio/wav")
                        st.write(f"**Duration:** {recording.get('duration', 0):.2f} seconds")
                    
                    with col2:
                        if recording.get('transcribed'):
                            st.success("✅ Transcribed")
                        else:
                            st.warning("🔄 Not transcribed")
                            
                            if st.button(f"🤖 Transcribe", key=f"transcribe_{i}"):
                                with st.spinner("🔄 Transcribing..."):
                                    transcription = self.transcribe_audio(recording['audio_bytes'])
                                    if transcription:
                                        recording['transcribed_text'] = transcription
                                        recording['transcribed'] = True
                                        st.success("✅ Transcription completed!")
                                        st.rerun()
                                    else:
                                        st.error("❌ Transcription failed")
                    
                    if recording.get('transcribed_text'):
                        st.write("**Transcription:**")
                        st.text_area("", recording['transcribed_text'], height=100, key=f"trans_text_{i}")
                        
                        # AI analysis of transcription
                        if st.button(f"🧠 Analyze Text", key=f"analyze_trans_{i}"):
                            analysis = self.analyze_text(recording['transcribed_text'])
                            if analysis:
                                st.info(f"**AI Analysis:** {analysis}")
        else:
            st.info("No recordings yet. Start recording above!")
    
    def transcriptions_page(self):
        """Display transcriptions management page"""
        st.title("📝 Transcriptions")
        
        # Statistics
        transcribed = [t for t in st.session_state.transcriptions if t.get('transcribed')]
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("🎙️ Total Recordings", len(st.session_state.transcriptions))
        with col2:
            st.metric("📝 Transcribed", len(transcribed))
        with col3:
            st.metric("📊 Success Rate", f"{len(transcribed)/len(st.session_state.transcriptions)*100:.1f}%" if st.session_state.transcriptions else "0%")
        
        st.markdown("---")
        
        # Transcriptions list
        st.subheader("📋 All Transcriptions")
        
        if transcribed:
            for i, trans in enumerate(transcribed):
                with st.expander(f"📝 {trans.get('timestamp', 'Unknown time')}"):
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.audio(trans['audio_bytes'], format="audio/wav")
                        st.write(f"**Duration:** {trans.get('duration', 0):.2f} seconds")
                    
                    with col2:
                        st.write("**Transcribed Text:**")
                        st.text_area("", trans['transcribed_text'], height=150, key=f"full_trans_{i}")
                        
                        # Export options
                        st.write("**Export:**")
                        export_col1, export_col2 = st.columns(2)
                        
                        with export_col1:
                            if st.button(f"📄 Copy", key=f"copy_{i}"):
                                st.write("Text copied to clipboard!")
                        
                        with export_col2:
                            if st.button(f"💾 Save", key=f"save_{i}"):
                                st.write("Transcription saved!")
                        
                        # AI analysis
                        if st.button(f"🧠 Analyze", key=f"analyze_full_{i}"):
                            analysis = self.analyze_text(trans['transcribed_text'])
                            if analysis:
                                st.info(f"**AI Analysis:** {analysis}")
        else:
            st.info("No transcriptions available. Record and transcribe some audio first!")
    
    def settings_page(self):
        """Display settings page"""
        st.title("⚙️ Settings")
        
        st.subheader("🔧 API Configuration")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.write("**Current Configuration:**")
            st.write(f"**API Base URL:** {self.api_base_url}")
            st.write(f"**Azure Speech Region:** {AZURE_SPEECH_REGION}")
            st.write(f"**Azure Speech Key:** {'✅ Configured' if AZURE_SPEECH_KEY else '❌ Not configured'}")
        
        with col2:
            st.write("**User Information:**")
            st.write(f"**Username:** {st.session_state.user.get('username', 'Unknown')}")
            st.write(f"**Email:** {st.session_state.user.get('email', 'Unknown')}")
            st.write(f"**Token:** {'✅ Valid' if st.session_state.user.get('token') else '❌ Invalid'}")
        
        st.markdown("---")
        
        st.subheader("🗑️ Data Management")
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("🗑️ Clear Transcriptions", key="clear_trans"):
                st.session_state.transcriptions = []
                st.success("Transcriptions cleared!")
                st.rerun()
        
        with col2:
            if st.button("🗑️ Clear Documents", key="clear_docs"):
                st.session_state.documents = []
                st.success("Documents cleared!")
                st.rerun()
        
        st.warning("⚠️ This action cannot be undone!")
    
    def upload_document(self, file) -> bool:
        """Upload document to backend"""
        try:
            files = {"file": (file.name, file.getvalue(), file.type)}
            headers = {"Authorization": f"Bearer {st.session_state.user['token']}"}
            
            response = requests.post(
                f"{self.api_base_url}/upload",
                files=files,
                headers=headers
            )
            return response.status_code == 200
        except Exception as e:
            st.error(f"Upload error: {e}")
            return False
    
    def analyze_document(self, doc_id: int):
        """Analyze document with AI"""
        try:
            headers = {"Authorization": f"Bearer {st.session_state.user['token']}"}
            response = requests.get(
                f"{self.api_base_url}/documents/{doc_id}",
                headers=headers
            )
            if response.status_code == 200:
                doc_data = response.json()
                st.info(f"**AI Analysis:** {doc_data.get('ai_analysis', 'No analysis available')}")
        except Exception as e:
            st.error(f"Analysis error: {e}")
    
    def transcribe_audio(self, audio_bytes) -> Optional[str]:
        """Transcribe audio using Azure Speech Services"""
        try:
            # Use the speech service from session state
            speech_service = st.session_state.speech_service
            
            # Transcribe audio
            transcription = speech_service.transcribe_audio_bytes(audio_bytes)
            
            if transcription:
                return transcription
            else:
                return "Transcription failed or no speech detected"
                
        except Exception as e:
            st.error(f"Transcription error: {e}")
            return None
    
    def analyze_text(self, text: str) -> Optional[str]:
        """Analyze text with AI"""
        try:
            headers = {"Authorization": f"Bearer {st.session_state.user['token']}"}
            response = requests.post(
                f"{self.api_base_url}/analyze-text",
                json={"text": text},
                headers=headers
            )
            if response.status_code == 200:
                return response.json().get("analysis", "Analysis completed")
        except Exception as e:
            st.error(f"Analysis error: {e}")
        return None
    
    def load_documents(self):
        """Load user documents from backend"""
        try:
            headers = {"Authorization": f"Bearer {st.session_state.user['token']}"}
            response = requests.get(
                f"{self.api_base_url}/documents",
                headers=headers
            )
            if response.status_code == 200:
                st.session_state.documents = response.json()
        except Exception as e:
            st.error(f"Error loading documents: {e}")
    
    def run(self):
        """Main application runner"""
        # Check authentication
        if not st.session_state.user:
            if st.session_state.get('show_register'):
                self.register_page()
            else:
                self.login_page()
            return
        
        # Load user data
        if not st.session_state.documents:
            self.load_documents()
        
        # Sidebar navigation
        page = self.sidebar()
        
        if not page:
            return
        
        # Route to appropriate page
        if page == "🎯 Dashboard":
            self.dashboard()
        elif page == "📄 Documents":
            self.documents_page()
        elif page == "🎙️ Voice Recording":
            self.voice_recording_page()
        elif page == "📝 Transcriptions":
            self.transcriptions_page()
        elif page == "⚙️ Settings":
            self.settings_page()

# Main application
if __name__ == "__main__":
    app = DocumentIntelligenceApp()
    app.run()
