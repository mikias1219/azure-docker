#!/usr/bin/env python3
"""
Unified Application Startup Script
Runs both FastAPI backend and Streamlit frontend in one container
Part of the Document Intelligence App with voice recording capabilities
"""

import subprocess
import time
import signal
import sys
import os
import threading
from pathlib import Path

# Ensure uploads directory exists
Path("uploads").mkdir(exist_ok=True)

class UnifiedAppManager:
    """Manages both FastAPI and Streamlit services"""
    
    def __init__(self):
        self.processes = {}
        self.running = True
        self.lock = threading.Lock()
    
    def log(self, message, service=""):
        """Log message with timestamp"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        prefix = f"[{timestamp}]"
        if service:
            prefix += f" [{service}]"
        print(f"{prefix} {message}")
    
    def start_fastapi(self):
        """Start FastAPI backend service"""
        try:
            self.log("🚀 Starting FastAPI backend on port 8000...", "FASTAPI")
            
            process = subprocess.Popen(
                ["uvicorn", "main_new:app", "--host", "0.0.0.0", "--port", "8000"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            with self.lock:
                self.processes['fastapi'] = process
            
            self.log("✅ FastAPI backend started", "FASTAPI")
            
            # Monitor output
            while self.running and process.poll() is None:
                line = process.stdout.readline()
                if line:
                    self.log(line.strip(), "FASTAPI")
                time.sleep(0.1)
            
            if process.poll() is not None:
                self.log(f"❌ FastAPI exited with code {process.poll()}", "FASTAPI")
                
        except Exception as e:
            self.log(f"❌ FastAPI error: {e}", "FASTAPI")
    
    def start_streamlit(self):
        """Start Streamlit frontend service"""
        try:
            # Wait for FastAPI to be ready
            self.log("⏳ Waiting for FastAPI to be ready...", "STREAMLIT")
            if not self.wait_for_fastapi():
                self.log("❌ FastAPI not ready, cannot start Streamlit", "STREAMLIT")
                return
            
            self.log("🎨 Starting Streamlit frontend on port 8501...", "STREAMLIT")
            
            process = subprocess.Popen(
                [
                    "streamlit", "run", "streamlit_app.py",
                    "--server.port", "8501",
                    "--server.address", "0.0.0.0",
                    "--server.enableCORS", "false",
                    "--server.enableXsrfProtection", "false",
                    "--server.headless", "true",
                    "--browser.serverAddress", "0.0.0.0"
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            with self.lock:
                self.processes['streamlit'] = process
            
            self.log("✅ Streamlit frontend started", "STREAMLIT")
            
            # Monitor output
            while self.running and process.poll() is None:
                line = process.stdout.readline()
                if line:
                    self.log(line.strip(), "STREAMLIT")
                time.sleep(0.1)
            
            if process.poll() is not None:
                self.log(f"❌ Streamlit exited with code {process.poll()}", "STREAMLIT")
                
        except Exception as e:
            self.log(f"❌ Streamlit error: {e}", "STREAMLIT")
    
    def wait_for_fastapi(self, timeout=60):
        """Wait for FastAPI to be ready"""
        import requests
        
        for i in range(timeout):
            try:
                response = requests.get("http://localhost:8000/health", timeout=2)
                if response.status_code == 200:
                    self.log("✅ FastAPI is ready!", "SYSTEM")
                    return True
            except:
                pass
            
            if i % 10 == 0:
                self.log(f"⏳ Waiting for FastAPI... ({i}/{timeout})", "SYSTEM")
            time.sleep(1)
        
        return False
    
    def stop_services(self):
        """Stop all services gracefully"""
        self.log("\n🛑 Stopping all services...", "SYSTEM")
        self.running = False
        
        with self.lock:
            for name, process in self.processes.items():
                try:
                    self.log(f"Stopping {name}...", "SYSTEM")
                    process.terminate()
                    
                    # Wait up to 5 seconds for graceful shutdown
                    for _ in range(5):
                        if process.poll() is not None:
                            break
                        time.sleep(1)
                    
                    # Force kill if still running
                    if process.poll() is None:
                        self.log(f"Force killing {name}...", "SYSTEM")
                        process.kill()
                        process.wait()
                    
                    self.log(f"✅ {name} stopped", "SYSTEM")
                    
                except Exception as e:
                    self.log(f"❌ Error stopping {name}: {e}", "SYSTEM")
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        signal_name = signal.Signals(signum).name
        self.log(f"\n📡 Received signal {signal_name}", "SYSTEM")
        self.stop_services()
        sys.exit(0)
    
    def run(self):
        """Run the unified application"""
        self.log("=" * 60, "SYSTEM")
        self.log("🚀 Starting UNIFIED Document Intelligence App", "SYSTEM")
        self.log("=" * 60, "SYSTEM")
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Check environment variables
        required_vars = [
            "AZURE_FORM_RECOGNIZER_KEY",
            "AZURE_FORM_RECOGNIZER_ENDPOINT",
            "OPENAI_API_KEY"
        ]
        
        missing = [var for var in required_vars if not os.getenv(var)]
        if missing:
            self.log(f"⚠️  Missing environment variables: {missing}", "SYSTEM")
            self.log("💡 App will use mock services for missing credentials", "SYSTEM")
        
        # Start FastAPI in a thread
        fastapi_thread = threading.Thread(target=self.start_fastapi, daemon=True)
        fastapi_thread.start()
        
        # Give FastAPI a moment to start
        time.sleep(2)
        
        # Start Streamlit in a thread
        streamlit_thread = threading.Thread(target=self.start_streamlit, daemon=True)
        streamlit_thread.start()
        
        # Display access information
        time.sleep(5)
        self.log("", "SYSTEM")
        self.log("🎉 UNIFIED APPLICATION IS RUNNING!", "SYSTEM")
        self.log("", "SYSTEM")
        self.log("📱 ACCESS POINTS:", "SYSTEM")
        self.log("  🎨 Streamlit Frontend: http://localhost:8501", "SYSTEM")
        self.log("  🔧 FastAPI Backend:    http://localhost:8000", "SYSTEM")
        self.log("  🔧 API Documentation:  http://localhost:8000/docs", "SYSTEM")
        self.log("  ✅ Health Check:       http://localhost:8000/health", "SYSTEM")
        self.log("", "SYSTEM")
        self.log("💡 FEATURES AVAILABLE:", "SYSTEM")
        self.log("  ✓ Document Upload & AI Analysis", "SYSTEM")
        self.log("  ✓ Voice Recording & Transcription (Azure Speech)", "SYSTEM")
        self.log("  ✓ User Authentication (JWT)", "SYSTEM")
        self.log("  ✓ Document Management", "SYSTEM")
        self.log("  ✓ Sidebar Navigation", "SYSTEM")
        self.log("", "SYSTEM")
        self.log("🛑 Press Ctrl+C to stop all services", "SYSTEM")
        self.log("=" * 60, "SYSTEM")
        
        # Keep main thread alive
        try:
            while self.running:
                time.sleep(1)
                
                # Check if any process died
                with self.lock:
                    for name, process in list(self.processes.items()):
                        if process.poll() is not None:
                            self.log(f"❌ {name} process died unexpectedly (code: {process.poll()})", "SYSTEM")
                            # Don't exit, let other services continue
                            del self.processes[name]
                            
        except KeyboardInterrupt:
            pass
        finally:
            self.stop_services()

if __name__ == "__main__":
    manager = UnifiedAppManager()
    manager.run()
