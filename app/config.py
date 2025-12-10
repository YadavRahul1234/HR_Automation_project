"""
Application Configuration
Loads environment variables and provides configuration settings
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings loaded from environment variables"""
    
    # Server
    PORT: int = int(os.getenv("PORT", 3000))
    
    # Airtable - User
    AIRTABLE_API_KEY_USER: str = os.getenv("AIRTABLE_API_KEY_USER", "")
    AIRTABLE_BASE_ID_USER: str = os.getenv("AIRTABLE_BASE_ID_USER", "")
    AIRTABLE_TABLE_ID_USER: str = os.getenv("AIRTABLE_TABLE_ID_USER", "")
    
    # Airtable - Admin
    AIRTABLE_API_KEY_ADMIN: str = os.getenv("AIRTABLE_API_KEY_ADMIN", "")
    AIRTABLE_BASE_ID_ADMIN: str = os.getenv("AIRTABLE_BASE_ID_ADMIN", "")
    AIRTABLE_TABLE_ID_ADMIN: str = os.getenv("AIRTABLE_TABLE_ID_ADMIN", "")
    AIRTABLE_VIEW_ID_ADMIN: str = os.getenv("AIRTABLE_VIEW_ID_ADMIN", "")
    
    # Airtable - Scraper
    AIRTABLE_API_KEY_SCRAPER: str = os.getenv("AIRTABLE_API_KEY_SCRAPER", "")
    AIRTABLE_BASE_ID_SCRAPER: str = os.getenv("AIRTABLE_BASE_ID_SCRAPER", "")
    AIRTABLE_TABLE_ID_SCRAPER: str = os.getenv("AIRTABLE_TABLE_ID_SCRAPER", "")
    
    # External Services
    RETELL_AGENT_ID: str = os.getenv("RETELL_AGENT_ID", "")
    N8N_RESUME_WEBHOOK_URL: str = os.getenv("N8N_RESUME_WEBHOOK_URL", "")
    N8N_REGENERATE_WEBHOOK_URL: str = os.getenv("N8N_REGENERATE_WEBHOOK_URL", "")
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # LinkedIn
    LINKEDIN_EMAIL: str = os.getenv("LINKEDIN_EMAIL", "")
    LINKEDIN_PASSWORD: str = os.getenv("LINKEDIN_PASSWORD", "")


# Create settings instance
settings = Settings()
