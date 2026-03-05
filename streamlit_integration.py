"""
Streamlit Integration Module
Provides Streamlit functionality embedded in FastAPI
"""

import os
import json
from typing import Optional

def get_streamlit_html() -> str:
    """
    Returns HTML that embeds the Streamlit interface
    This is a simplified version that provides voice recording and transcription UI
    """
    
    html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Intelligence - Voice & AI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .recording { animation: pulse 1.5s infinite; }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .audio-wave {
            display: flex;
            align-items: center;
            gap: 3px;
            height: 30px;
        }
        .audio-wave .bar {
            width: 4px;
            background: #3b82f6;
            border-radius: 2px;
            animation: wave 1s ease-in-out infinite;
        }
        .audio-wave .bar:nth-child(1) { animation-delay: 0s; height: 20%; }
        .audio-wave .bar:nth-child(2) { animation-delay: 0.1s; height: 40%; }
        .audio-wave .bar:nth-child(3) { animation-delay: 0.2s; height: 60%; }
        .audio-wave .bar:nth-child(4) { animation-delay: 0.3s; height: 40%; }
        .audio-wave .bar:nth-child(5) { animation-delay: 0.4s; height: 20%; }
        @keyframes wave {
            0%, 100% { transform: scaleY(0.5); }
            50% { transform: scaleY(1); }
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Header -->
        <nav class="bg-blue-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <h1 class="text-xl font-bold">🎙️ Document Intelligence</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-white hover:text-gray-200">🏠 Home</a>
                        <a href="/docs" class="text-white hover:text-gray-200">📚 API Docs</a>
                        <span id="user-status" class="text-sm">Not logged in</span>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- Left Sidebar - Navigation -->
                <div class="lg:col-span-1">
                    <div class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-lg font-semibold mb-4">🧭 Navigation</h2>
                        <nav class="space-y-2">
                            <button onclick="showSection('dashboard')" class="w-full text-left px-4 py-2 rounded hover:bg-gray-100">
                                📊 Dashboard
                            </button>
                            <button onclick="showSection('voice')" class="w-full text-left px-4 py-2 rounded bg-blue-100 text-blue-700">
                                🎙️ Voice Recording
                            </button>
                            <button onclick="showSection('documents')" class="w-full text-left px-4 py-2 rounded hover:bg-gray-100">
                                📄 Documents
                            </button>
                            <button onclick="showSection('transcriptions')" class="w-full text-left px-4 py-2 rounded hover:bg-gray-100">
                                📝 Transcriptions
                            </button>
                        </nav>

                        <div class="mt-6 pt-6 border-t">
                            <button onclick="toggleLogin()" id="login-btn" class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                🔐 Login
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="lg:col-span-2">
                    
                    <!-- Dashboard Section -->
                    <div id="dashboard-section" class="hidden">
                        <div class="bg-white shadow rounded-lg p-6">
                            <h2 class="text-2xl font-bold mb-4">📊 Dashboard</h2>
                            <div class="grid grid-cols-2 gap-4 mb-6">
                                <div class="bg-blue-50 p-4 rounded-lg">
                                    <div class="text-2xl font-bold text-blue-600" id="doc-count">0</div>
                                    <div class="text-gray-600">Documents</div>
                                </div>
                                <div class="bg-green-50 p-4 rounded-lg">
                                    <div class="text-2xl font-bold text-green-600" id="recording-count">0</div>
                                    <div class="text-gray-600">Recordings</div>
                                </div>
                            </div>
                            <p class="text-gray-600">Welcome to Document Intelligence! Use the sidebar to navigate.</p>
                        </div>
                    </div>

                    <!-- Voice Recording Section -->
                    <div id="voice-section" class="bg-white shadow rounded-lg p-6">
                        <h2 class="text-2xl font-bold mb-4">🎙️ Voice Recording</h2>
                        <p class="text-gray-600 mb-6">Record your voice and get AI-powered transcription using Azure Speech Services.</p>
                        
                        <!-- Recording Controls -->
                        <div class="text-center mb-6">
                            <button id="record-btn" onclick="toggleRecording()" 
                                    class="bg-red-500 hover:bg-red-600 text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto transition-all">
                                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"></path>
                                </svg>
                            </button>
                            <p id="recording-status" class="mt-2 text-gray-600">Click to start recording</p>
                            
                            <!-- Audio Wave Animation -->
                            <div id="audio-wave" class="audio-wave justify-center mt-4 hidden">
                                <div class="bar"></div>
                                <div class="bar"></div>
                                <div class="bar"></div>
                                <div class="bar"></div>
                                <div class="bar"></div>
                            </div>
                        </div>

                        <!-- Recording Timer -->
                        <div class="text-center mb-6">
                            <div id="recording-timer" class="text-3xl font-mono font-bold text-gray-400">00:00</div>
                        </div>

                        <!-- Audio Preview -->
                        <div id="audio-preview" class="hidden mb-6">
                            <h3 class="font-semibold mb-2">🎵 Recording Preview</h3>
                            <audio id="audio-player" controls class="w-full"></audio>
                        </div>

                        <!-- Transcription Section -->
                        <div id="transcription-section" class="hidden">
                            <div class="border-t pt-4">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="font-semibold">📝 Transcription</h3>
                                    <button onclick="transcribeAudio()" id="transcribe-btn" 
                                            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                        🤖 Transcribe with Azure AI
                                    </button>
                                </div>
                                <div id="transcription-loading" class="hidden">
                                    <div class="flex items-center space-x-2">
                                        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                        <span>Transcribing with Azure Speech Services...</span>
                                    </div>
                                </div>
                                <textarea id="transcription-text" rows="4" 
                                          class="w-full border rounded p-2 font-mono text-sm"
                                          placeholder="Transcription will appear here..."></textarea>
                                
                                <!-- AI Analysis -->
                                <div id="ai-analysis-section" class="mt-4 hidden">
                                    <button onclick="analyzeText()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                        🧠 Analyze with AI
                                    </button>
                                    <div id="ai-analysis-result" class="mt-2 p-3 bg-gray-50 rounded"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Previous Recordings -->
                        <div class="border-t pt-4 mt-6">
                            <h3 class="font-semibold mb-3">📋 Previous Recordings</h3>
                            <div id="recordings-list" class="space-y-2">
                                <p class="text-gray-500 italic">No recordings yet. Start recording above!</p>
                            </div>
                        </div>
                    </div>

                    <!-- Documents Section -->
                    <div id="documents-section" class="hidden">
                        <div class="bg-white shadow rounded-lg p-6">
                            <h2 class="text-2xl font-bold mb-4">📄 Documents</h2>
                            
                            <!-- Upload -->
                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
                                <input type="file" id="document-upload" class="hidden" accept=".pdf,.docx,.txt,.jpg,.png" onchange="uploadDocument(event)">
                                <button onclick="document.getElementById('document-upload').click()" 
                                        class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
                                    📤 Upload Document
                                </button>
                                <p class="text-gray-500 mt-2">PDF, Word, Text, Images</p>
                            </div>

                            <!-- Documents List -->
                            <div id="documents-list">
                                <p class="text-gray-500">Loading documents...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Transcriptions Section -->
                    <div id="transcriptions-section" class="hidden">
                        <div class="bg-white shadow rounded-lg p-6">
                            <h2 class="text-2xl font-bold mb-4">📝 All Transcriptions</h2>
                            <div id="all-transcriptions">
                                <p class="text-gray-500">No transcriptions available yet.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Login Modal -->
    <div id="login-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-96">
            <h3 class="text-xl font-bold mb-4">🔐 Login</h3>
            <input type="text" id="login-username" placeholder="Username" class="w-full border rounded p-2 mb-3">
            <input type="password" id="login-password" placeholder="Password" class="w-full border rounded p-2 mb-4">
            <div class="flex justify-between">
                <button onclick="closeLogin()" class="text-gray-600 px-4 py-2">Cancel</button>
                <button onclick="performLogin()" class="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
            </div>
        </div>
    </div>

    <script>
        // Global variables
        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;
        let recordingStartTime;
        let recordingTimer;
        let authToken = localStorage.getItem('auth_token') || '';
        let recordings = JSON.parse(localStorage.getItem('recordings') || '[]');

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            updateAuthStatus();
            loadDashboard();
            loadDocuments();
            loadRecordings();
            showSection('voice');
        });

        // Navigation
        function showSection(section) {
            // Hide all sections
            document.getElementById('dashboard-section').classList.add('hidden');
            document.getElementById('voice-section').classList.add('hidden');
            document.getElementById('documents-section').classList.add('hidden');
            document.getElementById('transcriptions-section').classList.add('hidden');
            
            // Show selected section
            document.getElementById(section + '-section').classList.remove('hidden');
        }

        // Recording functions
        async function toggleRecording() {
            if (!isRecording) {
                await startRecording();
            } else {
                stopRecording();
            }
        }

        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    // Show preview
                    document.getElementById('audio-preview').classList.remove('hidden');
                    document.getElementById('audio-player').src = audioUrl;
                    document.getElementById('transcription-section').classList.remove('hidden');
                    
                    // Save recording
                    saveRecording(audioBlob, audioUrl);
                };

                mediaRecorder.start();
                isRecording = true;
                recordingStartTime = Date.now();
                
                // Update UI
                const btn = document.getElementById('record-btn');
                btn.classList.add('recording', 'bg-red-600');
                btn.classList.remove('bg-red-500');
                document.getElementById('recording-status').textContent = '🔴 Recording...';
                document.getElementById('audio-wave').classList.remove('hidden');
                
                // Start timer
                recordingTimer = setInterval(updateTimer, 1000);
                
            } catch (err) {
                alert('Error accessing microphone: ' + err.message);
            }
        }

        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
            
            isRecording = false;
            clearInterval(recordingTimer);
            
            // Update UI
            const btn = document.getElementById('record-btn');
            btn.classList.remove('recording', 'bg-red-600');
            btn.classList.add('bg-red-500');
            document.getElementById('recording-status').textContent = 'Click to start recording';
            document.getElementById('audio-wave').classList.add('hidden');
            document.getElementById('recording-timer').textContent = '00:00';
        }

        function updateTimer() {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('recording-timer').textContent = `${minutes}:${seconds}`;
        }

        function saveRecording(blob, url) {
            const recording = {
                id: Date.now(),
                timestamp: new Date().toLocaleString(),
                duration: document.getElementById('recording-timer').textContent,
                url: url,
                blob: blob,
                transcription: ''
            };
            
            recordings.unshift(recording);
            localStorage.setItem('recordings', JSON.stringify(recordings));
            loadRecordings();
            
            // Update count
            document.getElementById('recording-count').textContent = recordings.length;
        }

        function loadRecordings() {
            const list = document.getElementById('recordings-list');
            if (recordings.length === 0) {
                list.innerHTML = '<p class="text-gray-500 italic">No recordings yet. Start recording above!</p>';
                return;
            }
            
            list.innerHTML = recordings.map(r => `
                <div class="border rounded p-3 flex justify-between items-center">
                    <div>
                        <div class="font-medium">${r.timestamp}</div>
                        <div class="text-sm text-gray-500">Duration: ${r.duration}</div>
                        ${r.transcription ? '<div class="text-sm text-green-600">✓ Transcribed</div>' : ''}
                    </div>
                    <audio src="${r.url}" controls class="h-8"></audio>
                </div>
            `).join('');
        }

        // Transcription
        async function transcribeAudio() {
            document.getElementById('transcription-loading').classList.remove('hidden');
            
            // Simulate Azure Speech Services transcription
            setTimeout(() => {
                const mockTranscriptions = [
                    "This is a sample transcription using Azure Speech Services. The voice recording has been successfully processed.",
                    "Azure Cognitive Services provides powerful speech-to-text capabilities for real-time transcription.",
                    "The integration of voice recording with AI analysis enables powerful document intelligence features."
                ];
                
                const transcription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
                document.getElementById('transcription-text').value = transcription;
                document.getElementById('transcription-loading').classList.add('hidden');
                document.getElementById('ai-analysis-section').classList.remove('hidden');
                
                // Save to latest recording
                if (recordings.length > 0) {
                    recordings[0].transcription = transcription;
                    localStorage.setItem('recordings', JSON.stringify(recordings));
                    loadRecordings();
                }
            }, 2000);
        }

        // AI Analysis
        async function analyzeText() {
            const text = document.getElementById('transcription-text').value;
            const resultDiv = document.getElementById('ai-analysis-result');
            
            resultDiv.innerHTML = '<div class="flex items-center space-x-2"><div class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div><span>Analyzing...</span></div>';
            
            // Simulate AI analysis
            setTimeout(() => {
                resultDiv.innerHTML = `
                    <div class="text-green-700 font-medium">✓ AI Analysis Complete</div>
                    <div class="text-sm text-gray-600 mt-1">
                        <strong>Key Topics:</strong> Speech Recognition, Azure AI, Voice Processing<br>
                        <strong>Sentiment:</strong> Positive<br>
                        <strong>Word Count:</strong> ${text.split(' ').length} words<br>
                        <strong>Language:</strong> English (en-US)
                    </div>
                `;
            }, 1500);
        }

        // Authentication
        function toggleLogin() {
            if (authToken) {
                // Logout
                authToken = '';
                localStorage.removeItem('auth_token');
                updateAuthStatus();
                alert('Logged out successfully');
            } else {
                // Show login modal
                document.getElementById('login-modal').classList.remove('hidden');
            }
        }

        function closeLogin() {
            document.getElementById('login-modal').classList.add('hidden');
        }

        async function performLogin() {
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            // Simulate login
            authToken = 'mock-token-' + Date.now();
            localStorage.setItem('auth_token', authToken);
            
            closeLogin();
            updateAuthStatus();
            alert('Login successful!');
        }

        function updateAuthStatus() {
            const status = document.getElementById('user-status');
            const btn = document.getElementById('login-btn');
            
            if (authToken) {
                status.textContent = '👤 Logged in';
                btn.textContent = 'Logout';
            } else {
                status.textContent = 'Not logged in';
                btn.textContent = '🔐 Login';
            }
        }

        // Dashboard
        async function loadDashboard() {
            document.getElementById('recording-count').textContent = recordings.length;
            
            // Simulate loading document count
            try {
                const response = await fetch('/documents', {
                    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
                });
                if (response.ok) {
                    const docs = await response.json();
                    document.getElementById('doc-count').textContent = docs.length || 0;
                }
            } catch (e) {
                console.log('Could not load documents count');
            }
        }

        // Documents
        async function loadDocuments() {
            // Simulated for demo
            document.getElementById('documents-list').innerHTML = '<p class="text-gray-500">Connect to API to load real documents</p>';
        }

        async function uploadDocument(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            alert(`Uploading ${file.name}... (Connect to API for real upload)`);
        }
    </script>
</body>
</html>
"""
    
    return html_content
