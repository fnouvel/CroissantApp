# Stack Research

**Domain:** Niche food rating web app (croissant ratings, friends & family, Boston)
**Researched:** 2026-03-11
**Confidence:** HIGH — all version numbers verified against PyPI and npm registries

---

## Context

This is an additive research document. The existing stack (FastAPI + React 19 + Vite 7 + Tailwind 4 + SQLite + Leaflet 1.9 + React-Leaflet 5) is fixed. Research covers only the new libraries needed for: user authentication, password hashing, invite-link groups, image uploads, image processing, category ratings, and polished map UI.

---

## Recommended Stack

### Auth: Backend

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PyJWT | 2.11.0 | JWT token creation and verification | FastAPI officially switched from python-jose to PyJWT in 2024 (PR #11589). python-jose's last release was 2021 and it has known security issues. PyJWT is actively maintained, simpler API, same HS256 workflow. |
| pwdlib[argon2] | 0.3.0 | Password hashing and verification | FastAPI docs now recommend pwdlib with Argon2 over passlib, which is unmaintained and breaks on Python 3.13+. Argon2 is the current OWASP-recommended algorithm. Install: `pip install "pwdlib[argon2]"` |
| python-multipart | 0.0.22 | Parsing multipart form data for file uploads | Required by FastAPI to receive `UploadFile` and form fields. Streaming parser — does not load entire file into memory. Actively maintained. |

### Auth: Frontend

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Built-in fetch + localStorage | — | Storing JWT and attaching to requests | No library needed. Store JWT in localStorage, attach as `Authorization: Bearer <token>` header via a shared `api.js` wrapper. Sufficient for a small trusted-user app. |

### Image Uploads

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Pillow | 12.1.1 | Server-side image validation, resize, format normalization | The standard Python image library. Validates that uploads are actual images (not malicious files masquerading as images), strips EXIF metadata, and generates display-ready thumbnails. FastAPI's `UploadFile` + Pillow is the canonical pattern. |
| react-dropzone | 15.0.0 | Frontend drag-and-drop image picker with preview | 4,400+ dependent packages, actively maintained, hooks-based API, works with React 19. Handles file-type filtering, size validation, and `URL.createObjectURL` previews. Lighter than full-featured upload libraries (no vendor lock-in). |

### Map UI

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-leaflet-cluster | 4.0.0 | Marker clustering for map | Officially supports React 19 + react-leaflet 5.x + leaflet 1.9.x peer dep chain already in the app. Prevents overlapping bakery markers from obscuring each other. CSS must be imported manually in this version. |

### Group & Invite Links

No additional library needed. Invite links are a data-modeling pattern, not a library concern:

- Generate a cryptographically random token using Python's built-in `secrets.token_urlsafe(32)`
- Store the token in a `groups` table with an expiry column
- A `POST /invites/{token}/accept` endpoint validates the token and adds the authenticated user to the group
- No third-party library required; JWT + `secrets` covers the full pattern

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| python-dotenv | latest | Load `.env` secrets (SECRET_KEY, etc.) | Needed immediately once auth is added — never hardcode JWT secrets |
| aiofiles | latest | Async file I/O for saving uploads to disk | Use when saving `UploadFile` content asynchronously in FastAPI async routes; prevents blocking the event loop |

---

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| SQLite (existing) | Persist users, groups, ratings, invites | No migration needed. Add new tables via SQLAlchemy models. For ~20 users, SQLite is fine indefinitely. |
| Static file serving via FastAPI `StaticFiles` | Serve uploaded images from `/uploads/` | Mount with `app.mount("/uploads", StaticFiles(directory="uploads"))`. No CDN needed at this scale. |

---

## Installation

```bash
# Backend additions
pip install PyJWT==2.11.0
pip install "pwdlib[argon2]==0.3.0"
pip install python-multipart==0.0.22
pip install Pillow==12.1.1
pip install aiofiles
pip install python-dotenv

# Frontend additions
npm install react-dropzone@15.0.0
npm install react-leaflet-cluster@4.0.0
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| PyJWT | python-jose | Never — python-jose is unmaintained, last release 2021, FastAPI has officially deprecated it in docs |
| pwdlib[argon2] | passlib[bcrypt] | Never on Python 3.13+ — passlib breaks. On older Python it technically works but is heading toward EOL |
| Local disk storage for images | Cloudinary / S3 | Only if the app goes public or user count exceeds ~100. For 10-20 trusted users, local storage in `/uploads/` is simpler, free, and entirely sufficient |
| react-dropzone | Native `<input type="file">` | If you want zero dependencies. react-dropzone adds drag-and-drop + preview for ~7KB; worth it for a polished photo-upload UX |
| react-leaflet-cluster | react-leaflet-markercluster | react-leaflet-markercluster (yuzhva) has not been updated for react-leaflet v4/v5 compatibility. Use react-leaflet-cluster (akursat) which explicitly supports the existing dep chain |
| secrets.token_urlsafe (stdlib) | django-invitations, etc. | Third-party invite libraries assume Django ORM and full user models. For FastAPI + SQLAlchemy, hand-rolling a tokens table with the stdlib is 20 lines and has zero extra deps |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| python-jose | Last PyPI release was 2021. Known security vulnerabilities. FastAPI officially deprecated it from documentation in PR #11589. Will not be patched. | PyJWT 2.11.0 |
| passlib | Last release 2020. Does not work on Python 3.13+ due to bcrypt 5.0.0 incompatibility. FastAPI docs replaced it with pwdlib. | pwdlib[argon2] |
| Flask-Login / Django auth | Not compatible with FastAPI's dependency injection model | PyJWT + FastAPI `Depends()` pattern |
| Cloudinary / AWS S3 for images | Unnecessary complexity and cost for 10-20 users. Adds external API keys, rate limits, and billing risk. | FastAPI StaticFiles mounting `/uploads/` local directory |
| JWT storage in cookies (HttpOnly) | Adds CSRF complexity on a same-origin app with no cross-domain needs | localStorage + Authorization header is simpler and sufficient for a trusted internal app |
| react-leaflet-markercluster (yuzhva package) | Abandoned — has not been updated for react-leaflet v4 or v5. Will throw peer dep errors with the existing stack. | react-leaflet-cluster (akursat) |

---

## Stack Patterns by Variant

**For auth flow (no external OAuth, invite-only):**
- Use email + password with PyJWT HS256 access tokens
- No refresh tokens needed at this scale — set expiry to 30 days
- Invite link = `secrets.token_urlsafe(32)` stored in DB, one-time-use, expires in 7 days

**For image uploads (local storage):**
- Accept only `image/jpeg`, `image/png`, `image/webp` MIME types
- Validate with Pillow (open + verify) to reject non-image content
- Resize to max 1200px wide before saving
- Save to `/backend/uploads/{uuid}.jpg` — serve via FastAPI `StaticFiles`

**For category ratings:**
- No new library needed. Model as a JSON column in SQLite (SQLAlchemy `JSON` type) or as separate `rating_categories` rows
- JSON column is simpler for this scale: `{"flakiness": 4, "butteriness": 5, "freshness": 3, "size": 4}`

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| react-leaflet-cluster@4.0.0 | react@19.x, react-leaflet@5.0.x, leaflet@1.9.x | Must manually import CSS: `import 'leaflet/dist/leaflet.css'` and `import 'leaflet.markercluster/dist/MarkerCluster.css'` |
| react-dropzone@15.0.0 | react@16.8+ (React 19 confirmed) | Uses hooks; compatible with React 19 |
| PyJWT@2.11.0 | Python >=3.9 | No [cryptography] extra needed for HS256 (HMAC); only needed for RSA/ECDSA |
| pwdlib@0.3.0 | Python >=3.10 | Install with `[argon2]` extra for Argon2 support |
| Pillow@12.1.1 | Python 3.9+ | Replace any legacy `PIL` imports with `from PIL import Image` |
| python-multipart@0.0.22 | FastAPI any version | Required for `UploadFile`; FastAPI will raise an error if missing and file upload endpoint is hit |

---

## Sources

- https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/ — Official FastAPI JWT docs (now uses PyJWT, confirmed March 2026)
- https://github.com/fastapi/fastapi/pull/11589 — FastAPI PR switching docs from python-jose to PyJWT (HIGH confidence)
- https://github.com/fastapi/fastapi/discussions/11773 — FastAPI community discussion confirming passlib deprecation, pwdlib recommendation (HIGH confidence)
- https://pypi.org/project/PyJWT/ — PyJWT 2.11.0, released January 30, 2026 (HIGH confidence)
- https://pypi.org/project/pwdlib/ — pwdlib 0.3.0, released October 25, 2025 (HIGH confidence)
- https://pypi.org/project/python-multipart/ — python-multipart 0.0.22, released January 25, 2026 (HIGH confidence)
- https://pypi.org/project/Pillow/ — Pillow 12.1.1, released February 11, 2026 (HIGH confidence)
- https://www.npmjs.com/package/react-dropzone — react-dropzone 15.0.0 (HIGH confidence)
- https://github.com/akursat/react-leaflet-cluster — react-leaflet-cluster v4.0.0, React 19 + react-leaflet 5 compatible (MEDIUM confidence — verified via GitHub issue #42)
- https://fastapi.tiangolo.com/tutorial/request-files/ — Official FastAPI file upload docs, UploadFile pattern (HIGH confidence)

---

*Stack research for: Croissant Club — niche food rating app (FastAPI + React)*
*Researched: 2026-03-11*
