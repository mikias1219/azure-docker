"""
Information extraction (e.g. business card) using Document Intelligence and optional OpenAI.
Extracts structured fields from images/documents.
"""

import logging
import os
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def extract_from_text_with_openai(text: str, openai_client, deployment: str) -> Optional[Dict[str, Any]]:
    """Use OpenAI to extract Name, Company, Title, Email, Phone from raw OCR text."""
    if not text or not openai_client or not deployment:
        return None
    prompt = (
        "Extract the following fields from the text below. Return ONLY a JSON object with these keys: "
        "Company, Name, Title, Email, Phone. Use empty string for missing. No markdown.\n\nText:\n"
        f"{text[:4000]}"
    )
    try:
        resp = openai_client.chat.completions.create(
            model=deployment,
            messages=[
                {"role": "system", "content": "You output only valid JSON with keys Company, Name, Title, Email, Phone."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=300,
        )
        if not resp.choices or not resp.choices[0].message:
            return None
        content = resp.choices[0].message.content.strip()
        # Strip markdown code block if present
        if content.startswith("```"):
            content = re.sub(r"^```\w*\n?", "", content).rstrip("`")
        import json
        return json.loads(content)
    except Exception as e:
        logger.warning("OpenAI extraction failed: %s", e)
        return None


def extract_contact_simple(text: str) -> Dict[str, str]:
    """Fallback: simple regex extraction for email and phone."""
    out = {"Company": "", "Name": "", "Title": "", "Email": "", "Phone": ""}
    if not text:
        return out
    email = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    if email:
        out["Email"] = email.group(0)
    phone = re.search(r"(\+?[\d\s\-()]{10,})", text)
    if phone:
        out["Phone"] = phone.group(1).strip()
    # First line often name/title
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if lines:
        out["Name"] = lines[0][:80]
    return out
