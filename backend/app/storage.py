"""Photo storage abstraction — local filesystem or Supabase Storage."""

import os
import uuid
from pathlib import Path

STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local").lower()

# Local storage config
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"

# Supabase config (only used when STORAGE_BACKEND == "supabase")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "photos")

_supabase_client = None


def _get_supabase():
    global _supabase_client
    if _supabase_client is None:
        from supabase import create_client

        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client


def upload_photo(contents: bytes, ext: str) -> str:
    """Upload photo bytes and return the URL (relative for local, absolute for Supabase)."""
    filename = f"{uuid.uuid4().hex}.{ext}"

    if STORAGE_BACKEND == "supabase":
        client = _get_supabase()
        content_type = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
        client.storage.from_(SUPABASE_BUCKET).upload(
            filename, contents, {"content-type": content_type}
        )
        return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{filename}"
    else:
        UPLOAD_DIR.mkdir(exist_ok=True)
        filepath = UPLOAD_DIR / filename
        filepath.write_bytes(contents)
        return f"/uploads/{filename}"


def delete_photo(photo_url: str) -> None:
    """Delete a photo by its URL."""
    if not photo_url:
        return

    if STORAGE_BACKEND == "supabase":
        # Extract filename from the absolute URL
        filename = photo_url.rsplit("/", 1)[-1]
        client = _get_supabase()
        client.storage.from_(SUPABASE_BUCKET).remove([filename])
    else:
        filename = os.path.basename(photo_url)
        filepath = UPLOAD_DIR / filename
        if filepath.exists():
            filepath.unlink()
