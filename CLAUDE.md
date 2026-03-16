# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CroissantApp — Croissant Club

A croissant rating journal for friends and family to discover, rate, and track Boston bakeries' croissants together.

## Tech Stack
- **Backend**: Python + FastAPI, SQLAlchemy ORM, Alembic migrations, SQLite
- **Frontend**: React 19 + Vite + Tailwind CSS 4 + MapLibre GL (via react-map-gl)
- **Auth**: Short-lived JWT access tokens stored in memory + HttpOnly refresh cookie (30 days)
- **Map tiles**: OpenFreeMap vector tiles (no API key needed)
- **Geocoding**: Nominatim/OSM (rate-limited; requires `User-Agent` header)

## Common Commands

The `Makefile` at the repo root is the primary interface:

```bash
make start          # run both backend (:8000) and frontend (:5173) concurrently
make start-backend  # backend only
make start-frontend # frontend only
make seed           # populate DB with Boston bakeries + dev user (backend must be running)
make migrate        # alembic upgrade head
make test           # pytest (backend)
make lint           # ruff + eslint
```

Direct equivalents (when inside the right directory):

```bash
# Backend
cd backend && source venv/bin/activate
uvicorn app.main:app --reload
pytest -k test_name   # run a single test by name
alembic upgrade head

# Frontend
cd frontend
npm run dev
npm run lint
```

## Architecture

**API-first**: React SPA → FastAPI REST → SQLite via SQLAlchemy. The frontend never touches the database directly.

```
backend/app/
  main.py            # FastAPI app, CORS, lifespan (creates tables on startup)
  database.py        # SQLAlchemy engine + get_db() dependency
  dependencies.py    # get_current_user() — decodes Bearer token, returns User
  auth.py            # hash_password, verify_password, create/decode JWT tokens
  routers/
    auth.py          # POST /api/auth/{register,login,refresh,logout}
    bakeries.py      # CRUD + Nominatim geocoding on create, avg_score aggregation
    ratings.py       # POST /api/bakeries/{id}/ratings, GET /api/ratings/me
  models/models.py   # User, Bakery, Rating (SQLAlchemy)
  schemas/schemas.py # Pydantic request/response models

frontend/src/
  main.jsx           # React root
  App.jsx            # Tab-based SPA shell: Home / Explore / Rate / Journal
  api.js             # All fetch() calls — every function takes token as first arg
  index.css          # Design system CSS variables + Tailwind config
  context/AuthContext.jsx  # Auth state; exposes useAuth() hook; handles token refresh
  components/
    LoginForm.jsx
    MapView.jsx      # MapLibre GL map centered on Boston
    FillBar.jsx      # Animated score fill bars
    PlaceSearch.jsx  # Nominatim autocomplete
```

### Key Patterns

**Auth flow**: `AuthContext` stores the access token in memory. On mount it calls `POST /api/auth/refresh` (sends HttpOnly cookie automatically) to restore session. All `api.js` functions receive `token` as their first argument — `App.jsx` passes it down from context. When `DEBUG=true` in backend `.env`, the refresh cookie is set with `secure=False` to allow HTTP in dev.

**Rating model**: `Rating` has four integer columns (`flakiness`, `butteriness`, `freshness`, `size_value`, each 1–5) plus a computed `score` float (their average, calculated in the router before insert, not stored in DB). Ratings also have an optional `photo_url` (local file path served via `/uploads/`).

**Photo uploads**: The `POST /api/bakeries/{id}/ratings` endpoint accepts `multipart/form-data` (not JSON) with an optional `photo` file field (JPEG/PNG/WebP/HEIC, max 5 MB). HEIC/HEIF images (iPhone default) are converted to JPEG server-side via `Pillow` + `pillow-heif`. Files are saved to `backend/uploads/` and served via FastAPI `StaticFiles` at `/uploads/`. The `api.js` `createRating` function uses `FormData`.

**avg_score on Bakery**: Routers compute `avg_score` via SQL aggregate at query time and inject it into `BakeryOut` — it is not a stored column.

**Geocoding**: `geocode_address()` in `bakeries.py` is a silent-fail async wrapper — if Nominatim fails, bakery is still created with `latitude=None, longitude=None`.

**CORS**: Configured in `main.py` for `localhost:5173` and `localhost:5174` (Vite dev port variants).

## Environment Variables

```bash
# backend/.env
SECRET_KEY=...
DEBUG=true          # set secure=False on refresh cookie; flip to false in production

# frontend/.env
VITE_API_URL=http://localhost:8000/api
```

## Design System

- **Fonts**: Fraunces (serif headings) + DM Sans (body) — loaded via CSS `@import`
- **Colors**: Terracotta Morning Garden — `#F9F5EE` linen bg, `#C2785A` terracotta primary, `#A8624A` terra-deep hover, `#E2C68A` butter accent, `#1E2D3D` iron text
- **Layout**: Desktop sidebar + mobile bottom tab bar; 4 tab views
- Defined entirely in `frontend/src/index.css` as CSS custom properties

## Current Status
- **Phase 1** (Auth): Complete — JWT auth, Alembic migrations, login/register
- **Phase 2** (Ratings & UI): Complete — category ratings, MapLibre map, tab-based SPA
- **Phase 3** (Photos): Complete — multipart photo upload, local file storage, display in Journal and bakery detail
- **Phase 4** (Map Polish): Not started
- See `.planning/STATE.md` for detailed GSD progress and decision log
