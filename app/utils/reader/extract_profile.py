"""
Profile Data Extraction using OpenAI
Extracts structured data from cleaned LinkedIn profile text
"""
import openai
import json
import os
from dotenv import load_dotenv

load_dotenv()
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) # Lazy load instead

def get_client():
    from openai import OpenAI
    import httpx
    # Manually create httpx client to bypass version incompatibility 
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"), http_client=httpx.Client())

def safe_json(text: str):
    """Try multiple ways to convert text to JSON safely."""
    text = text.strip()

    # 1. Direct attempt
    try:
        return json.loads(text)
    except:
        pass

    # 2. Extract JSON inside text (best method)
    import re
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except:
            pass

    # 3. Use LLM to convert to JSON
    client = get_client()
    fixed = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"Convert the following into valid JSON only:\n{text}"
        }]
    )

    cleaned = fixed.choices[0].message.content.strip()

    # final attempt
    return json.loads(cleaned)


def extract_profile(path="reader/clean_profile.md", text_content=None):    
    if not text_content:
        try:
            with open(path, "r", encoding="utf-8") as f:
                text_content = f.read()
        except Exception:
            # If both missing, return None
            return None

    if not text_content:
        return None

    # Truncate text content to avoid token limits (approx 100k characters -> ~25k tokens)
    # This is conservative to stay well within TPM limits
    if len(text_content) > 100000:
        print(f"Warning: Text content too long ({len(text_content)} chars). Truncating to 100,000 chars.")
        text_content = text_content[:100000]

    system_prompt = """
    You are an AI assistant that extracts LinkedIn profile data from raw text.
    Extract the following fields into a pure JSON object:
    - Full Name
    - Email
    - Phone
    - Skills
    - Education
    - Experience
    - Projects
    - URLs
    """

    prompt = f"""
Extract the following fields from the LinkedIn text and return JSON only:
- Full Name
- Email
- Phone
- Skills
- Education
- Experience
- Projects
- URLs

TEXT:
{text_content}
"""

    client = get_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    raw = response.choices[0].message.content
    print("\nRAW MODEL OUTPUT --->\n", raw)

    return safe_json(raw)


if __name__ == "__main__":
    result = extract_profile()
    print("\nFINAL JSON --->")
    print(json.dumps(result, indent=4))
