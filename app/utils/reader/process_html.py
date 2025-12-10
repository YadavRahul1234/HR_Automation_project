"""
HTML Processing for LinkedIn Profiles
Cleans and extracts text from raw HTML
"""
from bs4 import BeautifulSoup
import re

def linkedin_clean(html):
    soup = BeautifulSoup(html, "html.parser")
    
    # Remove script and style elements
    for tag in soup(["script", "style", "svg", "img", "video", "audio", "iframe", "noscript", "input", "form", "footer", "header", "nav", "button", "code"]):
        tag.decompose()
        
    # Remove all attributes to save space? No, sometimes id/class is useful but text extraction ignores it.
    
    lines = []
    for text in soup.stripped_strings:
        if len(text) > 2:
            lines.append(text)

    clean = "\n".join(lines)
    return clean


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python process_html.py <html_file>")
        sys.exit(1)
    
    # Read HTML from file
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        html = f.read()
    
    # Clean the HTML
    clean = linkedin_clean(html)
    
    # Write to clean_profile.md
    with open("clean_profile.md", "w", encoding="utf-8") as f:
        f.write(clean)
    
    print("Cleaned profile saved to clean_profile.md")

