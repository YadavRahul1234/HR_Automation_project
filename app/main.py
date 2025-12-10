"""
FastAPI Interview Application
Main application entry point with modular router structure
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.router import api_router

# Initialize FastAPI app
app = FastAPI(
    title="Interview Management System",
    description="AI-powered interview management with LinkedIn scraping capabilities",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)

# Mount static files (must be last)
app.mount("/", StaticFiles(directory="public", html=True), name="static")


# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
