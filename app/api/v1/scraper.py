"""
LinkedIn Scraper API Routes
Handles LinkedIn profile scraping and candidate management
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Dict, Any
import httpx
import asyncio
import io
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from app.config import settings
from app.utils.scraper.login import scrape_linkedin
from app.utils.scraper.search import search_candidates
from app.utils.reader.process_html import linkedin_clean
from app.utils.reader.extract_profile import extract_profile

router = APIRouter(prefix="/scraper", tags=["scraper"])


@router.post("/scrape")
async def scrape_profile(body: Dict[str, Any]):
    """Scrape single LinkedIn profile and save to Airtable"""
    try:
        url = body.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")

        # STEP 1: SCRAPE LINKEDIN (run in thread to avoid async conflict)
        html = await asyncio.to_thread(scrape_linkedin, url)

        # STEP 2: CLEAN HTML (run in thread)
        clean_text = await asyncio.to_thread(linkedin_clean, html)

        # Save cleaned text
        import os
        os.makedirs("reader", exist_ok=True)
        with open("reader/clean_profile.md", "w", encoding="utf-8") as f:
            f.write(clean_text)

        # STEP 3: AI EXTRACTION (run in thread)
        profile_data = await asyncio.to_thread(extract_profile)

        # STEP 4: Save to Airtable
        if profile_data:
            try:
                # Convert skills to string
                skills_str = ""
                if "Skills" in profile_data:
                    skills = profile_data["Skills"]
                    if isinstance(skills, list):
                        skills_str = ", ".join(str(s) for s in skills)
                    else:
                        skills_str = str(skills)
                
                # Use exact Airtable field names (lowercase with underscores)
                airtable_fields = {
                    "full_name": str(profile_data.get("Full Name", ""))[:100],
                    "email": str(profile_data.get("Email", ""))[:100],
                    "phone": str(profile_data.get("Phone", ""))[:50],
                    "linkedin_url": url[:500],
                    "skills": skills_str[:1000] if skills_str else "",
                }
                
                # Only add optional fields if they have data
                if profile_data.get("Education"):
                    airtable_fields["education"] = json.dumps(profile_data["Education"])[:1000]
                if profile_data.get("Experience"):
                    airtable_fields["experience"] = json.dumps(profile_data["Experience"])[:2000]
                if profile_data.get("Projects"):
                    airtable_fields["projects"] = str(profile_data["Projects"])[:1000]
                if profile_data.get("URLs"):
                    airtable_fields["urls"] = str(profile_data["URLs"])[:500]

                print(f"Saving to Airtable with fields: {list(airtable_fields.keys())}")
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_SCRAPER}/{settings.AIRTABLE_TABLE_ID_SCRAPER}",
                        json={"fields": airtable_fields},
                        headers={
                            "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_SCRAPER}",
                            "Content-Type": "application/json",
                        },
                        timeout=30.0,
                    )
                    
                    if response.status_code != 200:
                        error_detail = response.text
                        print(f"Airtable error response: {error_detail}")
                        print(f"Attempted to save fields: {airtable_fields}")
                    
                    response.raise_for_status()
                    print("Successfully saved to Airtable!")
                    
            except Exception as e:
                print(f"Error saving to Airtable: {e}")
                # Don't fail the whole request if Airtable save fails

        return profile_data

    except Exception as e:
        print(f"Error scraping profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_candidates_route(body: Dict[str, Any]):
    """Search for candidates on LinkedIn and save to Airtable"""
    try:
        role = body.get("role")
        skills = body.get("skills")
        location = body.get("location")
        experience = body.get("experience")

        if not role and not skills:
            raise HTTPException(status_code=400, detail="Role or Skills are required")

        # Run search in thread to avoid async conflict
        profiles = await asyncio.to_thread(search_candidates, role, skills, location, experience)

        # Save all profiles to Airtable
        if profiles:
            async with httpx.AsyncClient() as client:
                for profile in profiles:
                    try:
                        # Convert skills to string
                        skills_str = ""
                        if "Skills" in profile:
                            skills = profile["Skills"]
                            if isinstance(skills, list):
                                skills_str = ", ".join(str(s) for s in skills)
                            else:
                                skills_str = str(skills)
                        
                        # Use exact Airtable field names (lowercase with underscores)
                        airtable_fields = {
                            "full_name": str(profile.get("Full Name", ""))[:100],
                            "email": str(profile.get("Email", ""))[:100],
                            "phone": str(profile.get("Phone", ""))[:50],
                            "linkedin_url": str(profile.get("linkedin_url", ""))[:500],
                            "skills": skills_str[:1000] if skills_str else "",
                        }
                        
                        # Only add optional fields if they have data
                        if profile.get("Education"):
                            airtable_fields["education"] = json.dumps(profile["Education"])[:1000]
                        if profile.get("Experience"):
                            airtable_fields["experience"] = json.dumps(profile["Experience"])[:2000]
                        if profile.get("Projects"):
                            airtable_fields["projects"] = str(profile["Projects"])[:1000]
                        if profile.get("URLs"):
                            airtable_fields["urls"] = str(profile["URLs"])[:500]
                        
                        response = await client.post(
                            f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_SCRAPER}/{settings.AIRTABLE_TABLE_ID_SCRAPER}",
                            json={"fields": airtable_fields},
                            headers={
                                "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_SCRAPER}",
                                "Content-Type": "application/json",
                            },
                            timeout=30.0,
                        )
                        
                        if response.status_code != 200:
                            error_detail = response.text
                            print(f"Airtable error for profile: {error_detail}")
                        
                        response.raise_for_status()
                        print(f"Saved profile: {profile.get('Full Name', 'Unknown')}")
                        
                    except Exception as e:
                        print(f"Error saving profile to Airtable: {e}")
                        # Continue with next profile even if one fails
                        continue

        return profiles

    except Exception as e:
        print(f"Error searching candidates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/candidates")
async def get_scraped_candidates():
    """Get all scraped candidates from Airtable"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_SCRAPER}/{settings.AIRTABLE_TABLE_ID_SCRAPER}",
                headers={
                    "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_SCRAPER}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()
            
            # Transform Airtable records to match frontend expectations
            candidates = []
            for record in data.get("records", []):
                fields = record.get("fields", {})
                candidate = {
                    "id": record.get("id"),
                    "Full Name": fields.get("full_name", ""),
                    "Email": fields.get("email", ""),
                    "Phone": fields.get("phone", ""),
                    "linkedin_url": fields.get("linkedin_url", ""),
                    "Skills": fields.get("skills", "").split(", ") if fields.get("skills") else [],
                    "Education": json.loads(fields.get("education", "[]")) if fields.get("education") else [],
                    "Experience": json.loads(fields.get("experience", "[]")) if fields.get("experience") else [],
                    "Projects": fields.get("projects", ""),
                }
                candidates.append(candidate)
            
            return candidates
    except Exception as e:
        print(f"Error fetching scraped candidates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/candidates/{candidate_id}")
async def delete_scraped_candidate(candidate_id: str):
    """Delete scraped candidate from Airtable"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"https://api.airtable.com/v0/{settings.AIRTABLE_BASE_ID_SCRAPER}/{settings.AIRTABLE_TABLE_ID_SCRAPER}/{candidate_id}",
                headers={
                    "Authorization": f"Bearer {settings.AIRTABLE_API_KEY_SCRAPER}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return {"message": "Candidate deleted successfully"}
    except Exception as e:
        print(f"Error deleting candidate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-pdf")
async def generate_pdf(body: Dict[str, Any]):
    """Generate PDF resume from candidate data"""
    try:
        # Extract candidate data - define all variables at the start
        name = body.get("Full Name", body.get("Name", "Candidate"))
        email = body.get("Email", "")
        phone = body.get("Phone", "")
        linkedin_url = body.get("linkedin_url", "")
        skills = body.get("Skills", [])
        education = body.get("Education", "")
        experience = body.get("Experience", "")
        projects = body.get("Projects", "")
        
        if not body or not isinstance(body, dict):
            raise HTTPException(status_code=400, detail="Invalid profile data")

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph(f"<b>{name}</b>", styles["Title"]))
        story.append(Spacer(1, 12))

        # Contact Info
        if email or phone:
            contact_text = f"<b>Contact:</b> {email}"
            if phone:
                contact_text += f" | {phone}"
            story.append(Paragraph(contact_text, styles["Normal"]))
            story.append(Spacer(1, 12))

        # LinkedIn
        if linkedin_url:
            story.append(Paragraph(f"<b>LinkedIn:</b> {linkedin_url}", styles["Normal"]))
            story.append(Spacer(1, 12))

        # Skills
        if skills:
            skills_text = ", ".join(skills) if isinstance(skills, list) else str(skills)
            story.append(Paragraph("<b>Skills:</b>", styles["Heading2"]))
            story.append(Paragraph(skills_text, styles["Normal"]))
            story.append(Spacer(1, 12))

        # Education
        if education:
            story.append(Paragraph("<b>Education:</b>", styles["Heading2"]))
            if isinstance(education, list):
                for edu in education:
                    if isinstance(edu, dict):
                        edu_text = f"{edu.get('Institution', '')} - {edu.get('Degree', '')} ({edu.get('Start Date', '')} - {edu.get('End Date', '')})"
                    else:
                        edu_text = str(edu)
                    story.append(Paragraph(edu_text, styles["Normal"]))
                    story.append(Spacer(1, 6))
            else:
                edu_text = str(education).replace("\n", "<br/>")
                story.append(Paragraph(edu_text, styles["Normal"]))
            story.append(Spacer(1, 12))

        # Experience
        if experience:
            story.append(Paragraph("<b>Experience:</b>", styles["Heading2"]))
            if isinstance(experience, list):
                for exp in experience:
                    if isinstance(exp, dict):
                        exp_text = f"{exp.get('Job Title', '')} at {exp.get('Company', '')} ({exp.get('Start Date', '')} - {exp.get('End Date', '')})"
                    else:
                        exp_text = str(exp)
                    story.append(Paragraph(exp_text, styles["Normal"]))
                    story.append(Spacer(1, 6))
            else:
                exp_text = str(experience).replace("\n", "<br/>")
                story.append(Paragraph(exp_text, styles["Normal"]))
            story.append(Spacer(1, 12))

        # Projects
        if projects:
            story.append(Paragraph("<b>Projects:</b>", styles["Heading2"]))
            proj_text = str(projects).replace("\n", "<br/>")
            story.append(Paragraph(proj_text, styles["Normal"]))

        # Build PDF
        doc.build(story)
        buffer.seek(0)

        # Create safe filename from candidate name
        safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_name = safe_name.replace(' ', '_')
        filename = f"{safe_name}_Resume.pdf"

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))
