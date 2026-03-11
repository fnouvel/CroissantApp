# External Integrations

**Analysis Date:** 2026-03-11

## APIs & External Services

**Geolocation & Mapping:**
- OpenStreetMap Nominatim API - Geocoding service to convert addresses to latitude/longitude coordinates
  - SDK/Client: httpx (async HTTP client)
  - Endpoint: `https://nominatim.openstreetmap.org/search`
  - Usage: At `backend/app/routers/bakeries.py` in `geocode_address()` function
  - Called when creating a new bakery at line 52: `lat, lon = await geocode_address(data.address)`
  - Custom User-Agent: "FloreCroissant/1.0"
  - Request timeout: 5.0 seconds
  - Response format: JSON with lat/lon fields
  - Fallback: Returns (None, None) if geocoding fails (graceful degradation)

**Frontend Mapping Display:**
- Leaflet Maps Library - Client-side map rendering
  - Package: leaflet 1.9.4 (dev dependency)
  - React binding: react-leaflet 5.0.0 (dev dependency)
  - Usage: `frontend/src/components/MapView.jsx` for displaying bakery locations with latitude/longitude

## Data Storage

**Databases:**
- SQLite - Local file-based relational database
  - File location: `backend/croissant.db`
  - Client: SQLAlchemy ORM at `backend/app/database.py`
  - Connection string: `sqlite:///./croissant.db`
  - Database configuration: Non-threaded mode (`connect_args={"check_same_thread": False}`)
  - Session manager: SQLAlchemy SessionLocal with autocommit/autoflush disabled

**Tables/Models:**
- `bakeries` table - Stores bakery information (id, name, address, latitude, longitude, created_at)
  - Defined at `backend/app/models/models.py` in Bakery class
- `ratings` table - Stores user ratings for bakeries (id, bakery_id, score, notes, visited_at, created_at)
  - Defined at `backend/app/models/models.py` in Rating class
  - Foreign key relationship to bakeries table

**File Storage:**
- Local filesystem only - No external file storage service used

**Caching:**
- None detected - No caching layer implemented

## Authentication & Identity

**Auth Provider:**
- None - Application has no authentication system
- All endpoints are public with no user authentication required
- CORS configured for local development: `http://localhost:5173` and `http://localhost:5174`

## Monitoring & Observability

**Error Tracking:**
- None detected - No external error tracking service (Sentry, etc.)

**Logging:**
- console (Python print/FastAPI default logging)
- Level of logging: Not explicitly configured
- Error handling: Try/except at `backend/app/routers/bakeries.py` lines 26-28 silently catches geocoding exceptions

**Health Check:**
- Basic health endpoint at `backend/app/main.py` line 30-32
  - GET `/api/health` returns `{"status": "ok"}`

## CI/CD & Deployment

**Hosting:**
- Not specified - Project is in development with local SQLite database

**CI Pipeline:**
- None detected - No GitHub Actions, Travis CI, or similar service configured

**Deployment:**
- Development only - Uses local Uvicorn server for backend and Vite dev server for frontend
- Production deployment path: Would require separate deployment strategy

## Environment Configuration

**Backend Required Environment:**
- No explicit required environment variables
- Database auto-creates tables on application startup via `Base.metadata.create_all(bind=engine)` in lifespan handler

**Frontend Required Environment:**
- VITE_API_URL - Base URL for backend API calls
  - Usage: Defined in `frontend/.env` and accessed in `frontend/src/api.js` at line 1
  - Default (implied): http://localhost:8000 (based on lifespan setup)

**Secrets Location:**
- `.env` file in backend directory (tracked in repo - contains no sensitive secrets currently)
- `.env` file in frontend directory (tracked in repo - contains VITE_API_URL)

## Webhooks & Callbacks

**Incoming:**
- None - Application has no webhook endpoints for external services

**Outgoing:**
- None - Application does not call external webhooks or callbacks

## API Contract & Communication

**Backend Endpoints:**
All exposed through FastAPI REST at prefix `/api/`:

- GET `/api/health` - Health check
- GET `/api/bakeries` - List all bakeries with average ratings
- POST `/api/bakeries` - Create new bakery (triggers geocoding)
- GET `/api/bakeries/{bakery_id}` - Get bakery details with all ratings
- DELETE `/api/bakeries/{bakery_id}` - Delete a bakery
- POST `/api/bakeries/{bakery_id}/ratings` - Add rating for a bakery

**Frontend API Client:**
- Wrapper functions at `frontend/src/api.js`
- Functions: fetchBakeries(), fetchBakery(id), createBakery(data), deleteBakery(id), createRating(bakeryId, data)
- All use fetch API with JSON serialization
- Base URL from environment: `VITE_API_URL`

**CORS Configuration:**
- Configured at `backend/app/main.py` lines 18-24
- Allowed origins: `http://localhost:5173`, `http://localhost:5174`
- Allowed credentials: true
- Allowed methods: All ("*")
- Allowed headers: All ("*")

---

*Integration audit: 2026-03-11*
