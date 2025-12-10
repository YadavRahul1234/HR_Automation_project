"""
Candidate API Routes
Handles user-facing candidate operations
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import httpx

from app.config import settings

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("")
async def get_candidates():
    """Get all candidates (User)"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_USER}/{settings.AIRTABLE_TABLE_ID_USER}",
                headers={
                    "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_USER}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as error:
        print(f"Error fetching candidates: {error}")
        raise HTTPException(status_code=500, detail="Failed to fetch candidates")


@router.get("/{id}")
async def get_candidate(id: str):
    """Get a specific candidate (User)"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_USER}/{settings.AIRTABLE_TABLE_ID_USER}/{id}",
                headers={
                    "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_USER}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as error:
        print(f"Error fetching candidate {id}: {error}")
        raise HTTPException(status_code=500, detail="Failed to fetch candidate")


@router.patch("/{id}")
async def update_candidate(id: str, body: Dict[str, Any]):
    """Update candidate (User)"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_USER}/{settings.AIRTABLE_TABLE_ID_USER}/{id}",
                json=body,
                headers={
                    "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_USER}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as error:
        print(f"Error updating candidate: {error}")
        raise HTTPException(status_code=500, detail="Failed to update candidate")


@router.delete("/{id}")
async def delete_candidate(id: str):
    """Delete candidate (User)"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_USER}/{settings.AIRTABLE_TABLE_ID_USER}/{id}",
                headers={
                    "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_USER}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return {"message": "Candidate deleted successfully"}
    except httpx.HTTPError as error:
        print(f"Error deleting candidate: {error}")
        raise HTTPException(status_code=500, detail="Failed to delete candidate")
