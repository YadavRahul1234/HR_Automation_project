"""
Proxy API Routes
Handles proxying requests to external services (Retell)
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
import httpx

from app.config import settings

router = APIRouter(prefix="/proxy", tags=["proxy"])


@router.post("/retell/register-call")
async def register_call(request: Request):
    """Proxy request to Retell API to register a call"""
    try:
        body = await request.json()
        
        # Add agent_id to the request body
        body["agent_id"] = settings.RETELL_AGENT_ID
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.retellai.com/v2/create-web-call",
                json=body,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            return response.json()
    except Exception as error:
        print(f"Error proxying to Retell: {error}")
        raise HTTPException(status_code=500, detail="Failed to register call with Retell")
