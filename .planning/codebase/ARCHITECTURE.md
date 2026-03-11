# Architecture

**Analysis Date:** 2026-03-11

## Pattern Overview

**Overall:** API-first layered architecture with clear separation between backend and frontend.

**Key Characteristics:**
- Decoupled backend (FastAPI REST API) and frontend (React SPA)
- Domain-driven: all routes and models center on two core entities (Bakery, Rating)
- Synchronous request-response pattern with automatic geocoding on bakery creation
- Single SQLite database accessed only through backend ORM

## Layers

**API Layer (Backend):**
- Purpose: Handle HTTP requests, validate input, orchestrate database operations
- Location: `backend/app/routers/`
- Contains: Router definitions for bakeries (`bakeries.py`) and ratings (`ratings.py`)
- Depends on: Database layer (models, session management), external geocoding service
- Used by: Frontend via REST API calls

**Domain Model Layer (Backend):**
- Purpose: Define data structure and persistence rules
- Location: `backend/app/models/models.py`
- Contains: SQLAlchemy ORM models (Bakery, Rating) with relationships and constraints
- Depends on: Database layer (SQLAlchemy Base, engine)
- Used by: API routers for CRUD operations

**Schema Layer (Backend):**
- Purpose: Define request/response contracts and validation
- Location: `backend/app/schemas/schemas.py`
- Contains: Pydantic models for input (BakeryCreate, RatingCreate) and output (BakeryOut, BakeryDetail, RatingOut)
- Depends on: Pydantic validation library
- Used by: API routers for request validation and response serialization

**Data Access Layer (Backend):**
- Purpose: Manage database connection, session lifecycle, and persistence
- Location: `backend/app/database.py`
- Contains: SQLAlchemy engine configuration (SQLite), session factory, dependency injection function `get_db()`
- Depends on: SQLAlchemy ORM library
- Used by: All routers for database session injection

**API Client Layer (Frontend):**
- Purpose: Encapsulate all backend communication
- Location: `frontend/src/api.js`
- Contains: Fetch wrappers for all endpoints (fetchBakeries, createBakery, deleteBakery, createRating, fetchBakery)
- Depends on: Fetch API, environment variable VITE_API_URL
- Used by: React components (App, AddBakeryForm)

**UI Component Layer (Frontend):**
- Purpose: Render user interface and manage local state
- Location: `frontend/src/components/`
- Contains: Reusable components (BakeryCard, BakeryList, MapView, AddBakeryForm, StarRating, PlaceSearch, RateCroissantForm)
- Depends on: React, React Leaflet (maps), API client layer
- Used by: App.jsx as main composition root

**Application Container (Frontend):**
- Purpose: Bootstrap application, manage shared state, coordinate data flow
- Location: `frontend/src/App.jsx`
- Contains: Main app shell, navigation, section layout, state management (bakeries array, loading flag)
- Depends on: Component layer, API client layer
- Used by: main.jsx for React rendering

## Data Flow

**Fetching Bakeries:**

1. User loads page or navigates to App
2. `App.jsx` calls `useEffect` → `loadBakeries()`
3. `loadBakeries()` calls `fetchBakeries()` from `api.js`
4. `api.js` makes GET request to `/api/bakeries`
5. Backend router `bakeries.py:list_bakeries()` queries all Bakery records from database
6. For each bakery, calculates average rating score using SQL aggregate
7. Returns list of BakeryOut objects (with calculated avg_score)
8. Frontend receives JSON, setState(bakeries), components re-render with new data

**Creating a Bakery and Rating:**

1. User fills AddBakeryForm, submits
2. `AddBakeryForm.jsx:handleSubmit()` calls `createBakery({ name, address })`
3. `api.js` makes POST request to `/api/bakeries` with BakeryCreate payload
4. Backend router `bakeries.py:create_bakery()` receives request
5. Router calls `geocode_address(address)` (async) → queries Nominatim OSM API for lat/lon
6. Creates Bakery model instance, persists to SQLite via session
7. Returns BakeryOut with newly assigned ID
8. If user provided rating (score > 0), frontend calls `createRating(bakery.id, { score, notes, visited_at })`
9. Backend router `ratings.py:create_rating()` creates Rating record, links to bakery via foreign key
10. Frontend receives success, resets form, calls `loadBakeries()` to refresh list
11. User sees new bakery appear in list and map

**Deleting a Bakery:**

1. User clicks delete button on BakeryCard
2. Browser confirms via dialog
3. `App.jsx:handleDelete(id)` calls `deleteBakery(id)`
4. `api.js` makes DELETE request to `/api/bakeries/{id}`
5. Backend router `bakeries.py:delete_bakery()` finds Bakery record
6. SQLAlchemy cascade constraint automatically deletes all related Rating records
7. Frontend receives 204 No Content response, calls `loadBakeries()` to refresh

**State Management:**

- Frontend state: `bakeries` array and `loading` boolean live in `App.jsx`
- Backend state: Persistent in SQLite database via SQLAlchemy ORM
- No client-side caching layer; each navigation/operation re-fetches from backend
- No global state management library (Context/Redux) — parent component (App) props data to children

## Key Abstractions

**Bakery Entity:**
- Purpose: Represents a physical bakery location
- Examples: `backend/app/models/models.py:Bakery`, `backend/app/schemas/schemas.py:BakeryOut`
- Pattern: SQLAlchemy declarative model with ORM relationship to Rating, Pydantic output schema with computed avg_score field

**Rating Entity:**
- Purpose: Captures a single visit experience with a score and notes
- Examples: `backend/app/models/models.py:Rating`, `backend/app/schemas/schemas.py:RatingCreate`, `RatingOut`
- Pattern: SQLAlchemy model with foreign key to Bakery, Pydantic schemas for input validation and output serialization

**API Dependency Injection:**
- Purpose: Provide database session to routers without coupling
- Examples: `backend/app/database.py:get_db()`, used in all router endpoints via `Depends(get_db)`
- Pattern: FastAPI dependency injection container automatically calls `get_db()`, yields a session, ensures cleanup

**Geocoding Service:**
- Purpose: Convert address string to geographic coordinates
- Examples: `backend/app/routers/bakeries.py:geocode_address()`
- Pattern: Async wrapper around Nominatim (OpenStreetMap) HTTP API; gracefully returns (None, None) on failure

**BakeryOut with Computed Field:**
- Purpose: Return bakery data with average rating score calculated server-side
- Examples: `backend/app/schemas/schemas.py:BakeryOut.avg_score` (computed in list_bakeries and get_bakery routers)
- Pattern: Router manually constructs BakeryOut objects with computed avg_score rather than storing in model; keeps database normalized

## Entry Points

**Backend Entry:**
- Location: `backend/app/main.py`
- Triggers: `uvicorn app.main:app --reload` command or production server startup
- Responsibilities: Create FastAPI app instance, configure CORS middleware, register routers, define lifespan hook to create database tables on startup, expose health check endpoint

**Frontend Entry:**
- Location: `frontend/src/main.jsx`
- Triggers: Vite build system renders index.html, which references `<div id="root"></div>` and loads main.jsx
- Responsibilities: Create React root, render App component into DOM, enable StrictMode for dev warnings

**Primary UI Entry:**
- Location: `frontend/src/App.jsx`
- Triggers: Rendered from main.jsx on page load
- Responsibilities: Layout page sections (nav, hero, map, bakery list, add form, footer), fetch bakeries on mount, manage bakeries state, coordinate navigation and data refresh

## Error Handling

**Strategy:** Client logs errors to console; server returns HTTP error codes with simple detail messages.

**Patterns:**

**API Layer (Router):**
- Missing resource: Return HTTPException(status_code=404, detail="...") from routers (`bakeries.py:get_bakery()`, `bakeries.py:delete_bakery()`)
- Validation failure: FastAPI automatically returns 422 Unprocessable Entity for invalid Pydantic schema (e.g., score outside 1-5 range in RatingCreate)
- External service failure: `geocode_address()` catches all exceptions, returns (None, None) silently — bakery still created with null coordinates

**Frontend Layer (Components):**
- Network error: `api.js` functions throw Error with message; components catch in try-catch and set error state (AddBakeryForm)
- Async operation failure: AddBakeryForm displays error message in red box; user can retry
- No error recovery: Errors are logged and displayed but not automatically retried

**Database Layer:**
- Transaction failure: SQLAlchemy session rollback handled implicitly if exception occurs; session cleanup guaranteed by dependency injection finally block in `database.py:get_db()`

## Cross-Cutting Concerns

**Logging:**
- Backend: No explicit logging configured; errors bubble to console/server logs
- Frontend: console.error() calls in try-catch blocks (App.jsx, AddBakeryForm.jsx)

**Validation:**
- Backend: Pydantic models in `schemas.py` enforce type and range constraints (e.g., score 1-5); database constraints enforce NOT NULL on critical fields
- Frontend: HTML5 input type="date", type="number" provide basic validation; form requires fields via required attribute; custom StarRating component enforces 1-5 range

**Authentication:**
- Not implemented. All endpoints are public; no user tracking or multi-user isolation.

**CORS:**
- Backend: Configured in `main.py` to allow requests from localhost:5173 and localhost:5174 (Vite dev and alternate port)

---

*Architecture analysis: 2026-03-11*
