# 📄 Document Intelligence App - Streamlit Version

A modern **Streamlit-based** Document Intelligence application with **voice recording** and **Azure AI services** integration.

## ✨ New Features

### 🎙️ Voice Recording & Transcription
- **Browser-based voice recording** using audio-recorder-streamlit
- **Azure Speech Services** integration for real-time transcription
- **Multiple language support** with automatic detection
- **Audio playback** and management

### 🎨 Modern Streamlit UI
- **Sidebar navigation** with login/logout
- **Responsive design** with mobile support
- **Real-time updates** and interactive elements
- **Professional dashboard** with statistics

### 🤖 Enhanced AI Integration
- **Voice-to-text** using Azure Cognitive Services
- **Text analysis** with Azure OpenAI
- **Document intelligence** with Azure Form Recognizer
- **Multi-modal AI** processing

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Streamlit     │    │   FastAPI       │    │   Azure AI      │
│   Frontend      │◄──►│   Backend       │◄──►│   Services      │
│   (Port 8501)   │    │   (Port 8000)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📁 Project Structure
```
azure-practice-app/
├── streamlit_app.py              # Main Streamlit application
├── azure_speech_service.py       # Azure Speech Services integration
├── Dockerfile.streamlit          # Streamlit Docker configuration
├── docker-compose.streamlit.yml  # Multi-container setup
├── deploy-streamlit.sh           # Deployment script
├── .env.streamlit               # Environment variables template
├── main_new.py                  # FastAPI backend (updated)
└── requirements.txt             # Updated dependencies
```

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)
```bash
# 1. Set up environment variables
cp .env.streamlit .env
# Edit .env with your Azure credentials

# 2. Run with Docker Compose
docker-compose -f docker-compose.streamlit.yml up -d

# 3. Access the application
# Streamlit: http://localhost:8501
# Backend API: http://localhost:8000
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set environment variables
export AZURE_SPEECH_KEY="your-key"
export AZURE_SPEECH_REGION="eastus"
export API_BASE_URL="http://localhost:8000"

# 3. Start backend
uvicorn main_new:app --host 0.0.0.0 --port 8000

# 4. Start Streamlit (in another terminal)
streamlit run streamlit_app.py --server.port 8501
```

## 🔧 Configuration

### Azure Services Required

1. **Azure Speech Services**
   - Create Speech resource in Azure Portal
   - Get API key and region
   - Set `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`

2. **Azure Form Recognizer**
   - Create Form Recognizer resource
   - Set `AZURE_FORM_RECOGNIZER_KEY` and `AZURE_FORM_RECOGNIZER_ENDPOINT`

3. **Azure OpenAI**
   - Create OpenAI resource
   - Set `OPENAI_API_KEY`

### Environment Variables
```bash
# Azure Services
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=eastus
AZURE_FORM_RECOGNIZER_KEY=your-form-recognizer-key
AZURE_FORM_RECOGNIZER_ENDPOINT=your-form-recognizer-endpoint
OPENAI_API_KEY=your-openai-key

# Application
API_BASE_URL=http://localhost:8000
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///./app.db
```

## 🎯 Features Overview

### 🔐 Authentication System
- **Login/Logout** with JWT tokens
- **User registration** and management
- **Session persistence** in Streamlit
- **Secure API** communication

### 📄 Document Management
- **File upload** (PDF, Word, text, images)
- **Azure AI analysis** of documents
- **Text extraction** and processing
- **Document search** and filtering

### 🎙️ Voice Recording
- **Browser-based recording** with audio-recorder-streamlit
- **Real-time transcription** using Azure Speech
- **Audio playback** and download
- **Recording history** and management

### 📝 Transcription Management
- **Automatic transcription** of recordings
- **Text editing** and correction
- **AI analysis** of transcribed text
- **Export options** (copy, save, download)

### 📊 Dashboard
- **Usage statistics** and metrics
- **Recent activity** tracking
- **Document and recording counts**
- **Performance monitoring**

## 🌐 Deployment

### Azure Container Instances
```bash
# 1. Build and push images
./deploy-streamlit.sh

# 2. Update ACI configuration
# Modify container group to include both services

# 3. Deploy to Azure
az container create \
  --resource-group AI-102 \
  --file aci/streamlit-template.json
```

### Docker Deployment
```bash
# Build Streamlit image
docker build -f Dockerfile.streamlit -t streamlit-app .

# Run with backend
docker run -d -p 8501:8501 --name streamlit streamlit-app
```

## 🧪 Testing

### Voice Recording Test
```python
# Test Azure Speech Services
python azure_speech_service.py
```

### Integration Test
```bash
# Test full application
docker-compose -f docker-compose.streamlit.yml up
```

## 📱 Mobile Support

The Streamlit app is **mobile-responsive** and supports:
- **Touch-friendly** voice recording
- **Mobile browser** compatibility
- **Responsive design** for all screen sizes
- **Progressive Web App** features

## 🔍 Troubleshooting

### Common Issues

1. **Audio Recording Not Working**
   - Check browser permissions for microphone
   - Ensure HTTPS in production
   - Verify audio-recorder-streamlit installation

2. **Azure Speech Services Errors**
   - Verify API key and region
   - Check Azure subscription limits
   - Ensure proper endpoint configuration

3. **CORS Issues**
   - Verify backend CORS settings
   - Check API_BASE_URL configuration
   - Ensure proper port mapping

### Debug Mode
```bash
# Enable Streamlit debugging
streamlit run streamlit_app.py --server.port 8501 --logger.level debug

# Check backend logs
docker logs document-intelligence-backend
```

## 📚 API Documentation

### Backend Endpoints
- `POST /token` - User authentication
- `POST /register` - User registration
- `GET /documents` - List documents
- `POST /upload` - Upload document
- `POST /analyze-text` - Analyze text with AI

### Streamlit Components
- **Audio Recorder**: `audio_recorder_streamlit`
- **File Uploader**: `st.file_uploader`
- **Text Analysis**: Azure OpenAI integration
- **Voice Transcription**: Azure Speech Services

## 🎨 Customization

### UI Themes
```python
# Customize Streamlit theme
[theme]
primaryColor="#F63366"
backgroundColor="#FFFFFF"
secondaryBackgroundColor="#F0F2F6"
textColor="#262730"
```

### Voice Languages
```python
# Supported languages for transcription
languages = ["en-US", "es-ES", "fr-FR", "de-DE", "it-IT"]
```

## 🚀 Performance

### Optimization Tips
- **Audio compression** for faster uploads
- **Caching** for transcriptions
- **Batch processing** for documents
- **Lazy loading** for large datasets

### Monitoring
- **Health checks** for both services
- **Performance metrics** tracking
- **Error logging** and alerting
- **Resource usage** monitoring

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**🎉 Your Streamlit Document Intelligence App is ready!**

Access it at: **http://localhost:8501**
