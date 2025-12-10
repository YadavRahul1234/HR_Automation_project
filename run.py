#!/usr/bin/env python3
"""
Run the Interview Management Application
"""
import uvicorn
from app.main import app
from app.config import settings

if __name__ == "__main__":
    print(f"🚀 Starting Interview Management System on port {settings.PORT}...")
    print(f"📍 Access at: http://0.0.0.0:{settings.PORT}")
    print(f"📚 API Docs at: http://0.0.0.0:{settings.PORT}/docs")
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
