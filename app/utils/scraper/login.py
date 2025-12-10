"""
LinkedIn Login and Profile Scraping
Handles LinkedIn authentication and profile content extraction
"""
from playwright.sync_api import sync_playwright, Page, BrowserContext
import json
import time
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

EMAIL = os.getenv("LINKEDIN_EMAIL")
PASSWORD = os.getenv("LINKEDIN_PASSWORD")
SESSION_FILE = "session.json"

def safe_click(page, selector, timeout=3000):
    try:
        page.locator(selector).click(timeout=timeout)
        time.sleep(1)
    except:
        pass

def scroll_full_page(page):
    height = page.evaluate("document.body.scrollHeight")
    for i in range(0, height, 800):
        page.evaluate(f"window.scrollTo(0, {i});")
        time.sleep(0.5)

def get_browser_context(p, headless=True):
    browser = p.chromium.launch(headless=headless)
    context = None
    if os.path.exists(SESSION_FILE):
        try:
            with open(SESSION_FILE, "r") as f:
                cookies = json.load(f)
            context = browser.new_context()
            context.add_cookies(cookies)
            print("Loaded session cookies.")
        except Exception as e:
            print(f"Failed to load session: {e}")
    
    if not context:
        context = browser.new_context()
    
    return browser, context

def login_if_needed(page, context):
    page.goto("https://www.linkedin.com/login")
    time.sleep(2)

    if "login" in page.url:
        print("Logging in...")
        if not EMAIL or not PASSWORD:
            raise ValueError("LinkedIn credentials not found in environment variables.")
            
        page.fill("#username", EMAIL)
        page.fill("#password", PASSWORD)
        page.click("button[type=submit]")
        time.sleep(4)
        
        # Save cookies after login
        cookies = context.cookies()
        with open(SESSION_FILE, "w") as f:
            json.dump(cookies, f)
        print("Saved session cookies.")

def scrape_profile_content(page, url):
    print(f"Navigating to {url}...")
    page.goto(url)
    time.sleep(5)

    scroll_full_page(page)

    # Contact Info
    contact_html = ""
    try:
        print("Clicking 'Contact info'...")
        contact_btn = None
        if page.locator("a[id='top-card-text-details-contact-info']").count() > 0:
            contact_btn = page.locator("a[id='top-card-text-details-contact-info']")
        elif page.locator("a[href*='overlay/contact-info']").count() > 0:
            contact_btn = page.locator("a[href*='overlay/contact-info']")
        elif page.locator("a:has-text('Contact info')").count() > 0:
            contact_btn = page.locator("a:has-text('Contact info')").first
        
        if contact_btn:
            contact_btn.click(timeout=3000)
            time.sleep(2)
            
            try:
                contact_modal = page.locator("div[role='dialog']").first
                if contact_modal.count() > 0:
                    contact_html = contact_modal.inner_html()
                    print("Captured contact info HTML.")
                else:
                    contact_div = page.locator("div:has-text('Contact info')").last
                    if contact_div.count() > 0:
                        contact_html = contact_div.inner_html()
            except:
                pass

            page.locator("button[aria-label='Dismiss']").first.click(timeout=3000)
        else:
            print("Contact info button not found.")
            
    except Exception as e:
        print(f"Contact info error: {e}")
        pass


    scroll_full_page(page)

    # EXPAND ALL SECTIONS
    for label in [
        "Show more", 
        "See more",
        "Show all experiences",
        "Show all education",
        "Show all activities",
        "Show all about",
        "Show all projects",
        "Show all recommendations",
        "Show all skills"
    ]:
        buttons = page.locator(f"button:has-text('{label}')")
        count = buttons.count()
        for i in range(count):
            try:
                page.locator(f"button:has-text('{label}')").nth(i).click(timeout=2000)
                time.sleep(0.5)
            except:
                pass
    
    # Capture Main Profile HTML
    main_html = page.content()
    skills_html = ""
    experience_html = ""
    
    # Ensure proper execution
    base_url = url.split("?")[0].rstrip("/")

    # SKILLS
    try:
        skills_url = f"{base_url}/details/skills/"
        print(f"Navigating directly to skills page: {skills_url}")
        page.goto(skills_url)
        time.sleep(3)
        scroll_full_page(page)
        skills_html = page.content()
        print("Captured skills page HTML.")
    except Exception as e:
        print(f"Error navigating to skills page: {e}")
        pass

    # EXPERIENCE
    try:
        experience_url = f"{base_url}/details/experience/"
        print(f"Navigating directly to experience page: {experience_url}")
        page.goto(experience_url)
        time.sleep(3)
        scroll_full_page(page)
        experience_html = page.content()
        print("Captured experience page HTML.")
    except Exception as e:
        print(f"Error navigating to experience page: {e}")
        pass
    
    # Combine all parts
    full_html = main_html
    if contact_html:
        full_html += "\n\n<!-- CONTACT INFO START -->\n\n" + contact_html
    
    if skills_html:
        full_html += "\n\n<!-- SKILLS PAGE START -->\n\n" + skills_html

    if experience_html:
        full_html += "\n\n<!-- EXPERIENCE PAGE START -->\n\n" + experience_html
        
    return full_html

def scrape_linkedin(url):
    with sync_playwright() as p:
        browser, context = get_browser_context(p)
        page = context.new_page()

        login_if_needed(page, context)
        full_html = scrape_profile_content(page, url)

        browser.close()
        return full_html

