"""
Admin API Routes
Handles admin dashboard operations
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Dict, Any, Optional
import httpx

from app.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/candidates")
async def get_admin_candidates():
    """Get all candidates for admin dashboard"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_ADMIN}/{settings.AIRTABLE_TABLE_ID_ADMIN}",
                params={"view": settings.AIRTABLE_VIEW_ID_ADMIN},
                headers={
                    "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_ADMIN}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as error:
        print(f"Error fetching admin candidates: {error}")
        raise HTTPException(status_code=500, detail="Failed to fetch data from Airtable")


@router.get("/candidates/{id}")
async def get_admin_candidate(id: str):
    """Get a specific candidate for admin dashboard"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_ADMIN}/{settings.AIRTABLE_TABLE_ID_ADMIN}/{id}",
                headers={
                    "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_ADMIN}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as error:
        print(f"Error fetching admin candidate {id}: {error}")
        raise HTTPException(status_code=500, detail="Failed to fetch candidate from Airtable")


@router.patch("/candidates/{id}")
async def update_admin_candidate(id: str, body: Dict[str, Any]):
    """Update candidate in admin dashboard"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_ADMIN}/{settings.AIRTABLE_TABLE_ID_ADMIN}/{id}",
                json=body,
                headers={
                    "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_ADMIN}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as error:
        print(f"Error updating admin candidate: {error}")
        raise HTTPException(status_code=500, detail="Failed to update candidate")


@router.delete("/candidates/{id}")
async def delete_admin_candidate(id: str):
    """Delete candidate from admin dashboard"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_ADMIN}/{settings.AIRTABLE_TABLE_ID_ADMIN}/{id}",
                headers={
                    "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_ADMIN}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return {"message": "Candidate deleted successfully"}
    except httpx.HTTPError as error:
        print(f"Error deleting admin candidate: {error}")
        raise HTTPException(status_code=500, detail="Failed to delete candidate")


@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    recordId: str = Form(...),
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
):
    """Upload resume to N8N webhook"""
    try:
        files = {"file": (file.filename, await file.read(), file.content_type)}
        data = {"recordId": recordId}
        if name:
            data["name"] = name
        if email:
            data["email"] = email

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                settings.N8N_RESUME_WEBHOOK_URL,
                files=files,
                data=data,
            )
            response.raise_for_status()
            return response.json()
    except Exception as error:
        print(f"Error uploading resume: {error}")
        raise HTTPException(status_code=500, detail="Failed to upload resume")


@router.post("/regenerate-questions")
async def regenerate_questions(body: Dict[str, Any]):
    """Regenerate interview questions via N8N webhook"""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                settings.N8N_REGENERATE_WEBHOOK_URL,
                json=body,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            return response.json()
    except Exception as error:
        print(f"Error regenerating questions: {error}")
        raise HTTPException(status_code=500, detail="Failed to regenerate questions")
