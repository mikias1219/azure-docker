#!/usr/bin/env python3
"""
Service startup script for Streamlit Document Intelligence App
Starts both FastAPI backend and Streamlit frontend in a single container
"""

import subprocess
import time
import signal
import sys
import os
from threading import Thread

class ServiceManager:
    def __init__(self):
        self.processes = {}
        self.running = True
    
    def start_backend(self):
        """Start FastAPI backend"""
        try:
            print("🚀 Starting FastAPI backend on port 8000...")
            backend_process = subprocess.Popen([
                "uvicorn", "main_new:app",
                "--host", "0.0.0.0",
                "--port", "8000"
            ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            
            self.processes['backend'] = backend_process
            print("✅ FastAPI backend started")
            
            # Monitor backend process
            while self.running:
                output = backend_process.stdout.readline().decode()
                if output:
                    print(f"Backend: {output.strip()}")
                if backend_process.poll() is not None:
                    print("❌ Backend process died")
                    break
                time.sleep(0.1)
                
        except Exception as e:
            print(f"❌ Failed to start backend: {e}")
    
    def start_frontend(self):
        """Start Streamlit frontend"""
        try:
            # Wait a bit for backend to start
            time.sleep(5)
            
            print("🎨 Starting Streamlit frontend on port 8501...")
            frontend_process = subprocess.Popen([
                "streamlit", "run", "streamlit_app.py",
                "--server.port", "8501",
                "--server.address", "0.0.0.0",
                "--server.enableCORS=false",
                "--server.enableXsrfProtection=false",
                "--server.headless=true"
            ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            
            self.processes['frontend'] = frontend_process
            print("✅ Streamlit frontend started")
            
            # Monitor frontend process
            while self.running:
                output = frontend_process.stdout.readline().decode()
                if output:
                    print(f"Frontend: {output.strip()}")
                if frontend_process.poll() is not None:
                    print("❌ Frontend process died")
                    break
                time.sleep(0.1)
                
        except Exception as e:
            print(f"❌ Failed to start frontend: {e}")
    
    def stop_services(self):
        """Stop all services"""
        print("\n🛑 Stopping services...")
        self.running = False
        
        for name, process in self.processes.items():
            try:
                print(f"Stopping {name}...")
                process.terminate()
                process.wait(timeout=5)
                print(f"✅ {name} stopped")
            except subprocess.TimeoutExpired:
                print(f"Force killing {name}...")
                process.kill()
                process.wait()
            except Exception as e:
                print(f"❌ Error stopping {name}: {e}")
    
    def wait_for_backend(self):
        """Wait for backend to be ready"""
        import requests
        
        for i in range(30):  # Wait up to 30 seconds
            try:
                response = requests.get("http://localhost:8000/health", timeout=5)
                if response.status_code == 200:
                    print("✅ Backend is ready")
                    return True
            except:
                pass
            
            print(f"⏳ Waiting for backend... ({i+1}/30)")
            time.sleep(1)
        
        print("❌ Backend failed to start within timeout")
        return False
    
    def run(self):
        """Run both services"""
        print("🚀 Starting Document Intelligence App Services")
        print("=" * 50)
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Start backend in a thread
        backend_thread = Thread(target=self.start_backend, daemon=True)
        backend_thread.start()
        
        # Wait for backend to be ready
        if not self.wait_for_backend():
            print("❌ Backend failed to start, exiting")
            self.stop_services()
            sys.exit(1)
        
        # Start frontend in a thread
        frontend_thread = Thread(target=self.start_frontend, daemon=True)
        frontend_thread.start()
        
        print("\n🎉 Both services started!")
        print("📄 FastAPI Backend: http://localhost:8000")
        print("🎨 Streamlit Frontend: http://localhost:8501")
        print("📋 Health Check: http://localhost:8000/health")
        print("\n💡 Press Ctrl+C to stop all services")
        
        # Keep main thread alive
        try:
            while self.running:
                time.sleep(1)
                
                # Check if any process died
                for name, process in self.processes.items():
                    if process.poll() is not None:
                        print(f"❌ {name} process died unexpectedly")
                        self.running = False
                        break
                        
        except KeyboardInterrupt:
            pass
        finally:
            self.stop_services()
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print(f"\n📡 Received signal {signum}")
        self.running = False

if __name__ == "__main__":
    # Check environment variables
    required_env_vars = [
        "AZURE_FORM_RECOGNIZER_KEY",
        "AZURE_FORM_RECOGNIZER_ENDPOINT", 
        "OPENAI_API_KEY"
    ]
    
    missing_vars = []
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n💡 Please set these environment variables before starting")
        sys.exit(1)
    
    # Start services
    manager = ServiceManager()
    manager.run()
