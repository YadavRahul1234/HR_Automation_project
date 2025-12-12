# Interview Management System

AI-powered interview management system with LinkedIn scraping capabilities.

## Features

- 🎯 **Candidate Management**: Full CRUD operations for candidates
- 🔍 **LinkedIn Scraper**: Automated profile scraping and data extraction
- 📄 **PDF Generation**: Generate professional resumes from scraped data
- 🎤 **Retell Integration**: AI-powered interview calls
- 🔄 **N8N Webhooks**: Automated workflows for resume processing

## Tech Stack

- **Backend**: FastAPI (Python 3.10+)
- **Database**: Airtable
- **Scraping**: Playwright
- **AI**: OpenAI GPT
- **PDF**: ReportLab

## Project Structure

```
Interview/
├── app/
│   ├── api/v1/          # API routes (modular)
│   ├── models/          # Pydantic models
│   ├── services/        # Business logic
│   ├── utils/           # Utilities (scraper, reader)
│   ├── config.py        # Configuration
│   └── main.py          # FastAPI app
├── public/              # Frontend files
├── .env                 # Environment variables
├── requirements.txt     # Python dependencies
└── run.py              # Application entry point
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
playwright install chromium
```

### 2. Configure Environment

Create `.env` file with:

```env
# Airtable
AIRTABLE_API_KEY_USER=your_key
AIRTABLE_BASE_ID_USER=your_base
AIRTABLE_TABLE_ID_USER=your_table

# LinkedIn
LINKEDIN_EMAIL=your_email
LINKEDIN_PASSWORD=your_password

# OpenAI
OPENAI_API_KEY=your_key
AIRTABLE_API_KEY_ADMIN=your_kye
AIRTABLE_BASE_ID_ADMIN=your base
AIRTABLE_TABLE_ID_ADMIN=your table
AIRTABLE_VIEW_ID_ADMIN=your view

RETELL_AGENT_ID=your agent id
N8N_RESUME_WEBHOOK_URL=your webhook url
N8N_REGENERATE_WEBHOOK_URL=your webhook url

```

### 3. Run Application

```bash
python3 run.py
```

Access at: `http://localhost:3000`

## API Documentation

Interactive API docs available at: `http://localhost:3000/docs`

## License

MIT
# HR_Automation
# HR_Automation_project
# HR_Automation_project
# HR_Automation_project
