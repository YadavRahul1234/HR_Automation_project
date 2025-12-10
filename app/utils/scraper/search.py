"""
LinkedIn Candidate Search
Searches LinkedIn for candidates and scrapes their profiles
"""
from playwright.sync_api import sync_playwright
import time
import urllib.parse
from app.utils.scraper.login import get_browser_context, login_if_needed, scrape_profile_content
from app.utils.reader.process_html import linkedin_clean
from app.utils.reader.extract_profile import extract_profile

def search_candidates(role, skills, location, experience, max_profiles=3):
    """
    Search for candidates on LinkedIn and scrape their profiles.
    """
    profiles_data = []
    
    with sync_playwright() as p:
        browser, context = get_browser_context(p)
        page = context.new_page()

        # 1. Login
        try:
            login_if_needed(page, context)
        except Exception as e:
            print(f"Login failed: {e}")
            browser.close()
            return {"error": f"Login failed: {str(e)}"}

        # 2. Construct Search URL
        # Format: https://www.linkedin.com/search/results/people/?keywords=role%20skills&geoUrn=...
        # We'll use a simple keyword search for now combined with location text if possible, 
        # or just append location to keywords as it's often more robust than guessing geoUrn without an API.
        
        search_query = f"{role} {skills}".strip()
        if location:
            search_query += f" {location}"
        
        encoded_query = urllib.parse.quote_plus(search_query)
        search_url = f"https://www.linkedin.com/search/results/people/?keywords={encoded_query}&origin=GLOBAL_SEARCH_HEADER"
        
        print(f"Searching URL: {search_url}")
        page.goto(search_url)
        time.sleep(5)
        
        # 3. Extract Profile URLs
        # Only get the top N profiles
        profile_links = []
        try:

            # Wait for results to load - Increased timeout to 30 seconds
            # Also check for potential "No results found" or "Sign in" redirects
            try:
                # Wait longer and try to scroll to trigger lazy loading
                time.sleep(3)
                page.evaluate("window.scrollTo(0, 500)")
                time.sleep(2)
                
                # Try to wait for any search results container
                page.wait_for_selector("div.search-results-container, main.scaffold-layout__main, div.search-results__list", timeout=30000)
                print("Search results container found!")
                
            except Exception as e:
                print(f"Timeout waiting for results. Current URL: {page.url}")
                print(f"Page Title: {page.title()}")
                # Dump a snippet of HTML to debug
                print(f"Page Content Snippet: {page.content()[:500]}...")
                # If we are on login page, we failed
                if "login" in page.url or "authwall" in page.url:
                    print("Redirected to login/authwall.")
                    raise Exception("LinkedIn requires login. Please check credentials.")
                
                # Try to continue anyway - maybe results are there
                print("Continuing despite timeout...")

            # Scroll to load more results
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(2)

            # Try multiple selector strategies for links
            # Strategy 1: Look for profile links in search results
            links = page.locator("a[href*='/in/'][href*='linkedin.com']")
            
            if links.count() == 0:
                 print("Primary link selector failed, trying fallback...")
                 # Strategy 2: Any link containing /in/
                 links = page.locator("a[href*='/in/']")

            count = links.count()
            
            print(f"Found {count} potential profile links on search page.")
            
            if count == 0:
                print("No profile links found. Saving page HTML for debugging...")
                with open("debug_search_page.html", "w", encoding="utf-8") as f:
                    f.write(page.content())
                print("Saved to debug_search_page.html")
            
            seen_urls = set()
            for i in range(count):
                if len(profile_links) >= max_profiles:
                    break
                    
                try:
                    href = links.nth(i).get_attribute("href")
                    # Filter out garbage links, ensure it's a profile
                    # Profile links usually contain /in/ and do not contain 'miniProfile' or similar logic if redundant
                    if href and "/in/" in href:
                        # Make sure it's a full LinkedIn profile URL
                        if not href.startswith("http"):
                            href = "https://www.linkedin.com" + href
                        # Clean URL (remove query params)
                        clean_url = href.split("?")[0]
                        if clean_url not in seen_urls and "linkedin.com/in/" in clean_url:
                            seen_urls.add(clean_url)
                            profile_links.append(clean_url)
                            print(f"Added profile: {clean_url}")
                except Exception as e:
                    print(f"Error processing link {i}: {e}")
                    continue
                        
            print(f"Extracted {len(profile_links)} unique profile URLs")
            
        except Exception as e:
            print(f"Error extracting search results: {e}")
            
        # 4. Scrape Each Profile
        for url in profile_links:
            print(f"Processing candidate: {url}")
            try:
                # Scrape raw HTML
                raw_html = scrape_profile_content(page, url)
                
                # Clean HTML
                clean_text = linkedin_clean(raw_html)
                
                # Extract Data using LLM
                # We pass text directly now
                data = extract_profile(text_content=clean_text)
                
                if data:
                    data["linkedin_url"] = url 
                    profiles_data.append(data)
                    
            except Exception as e:
                print(f"Failed to process {url}: {e}")
                
        browser.close()

    return profiles_data

if __name__ == "__main__":
    # Test
    res = search_candidates("Software Engineer", "Python", "San Francisco", "")
    import json
    print(json.dumps(res, indent=2))
