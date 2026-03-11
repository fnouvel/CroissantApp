# Codebase Structure

**Analysis Date:** 2026-03-11

## Directory Layout

```
CroissantApp/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app initialization, middleware, router registration
│   │   ├── database.py      # SQLAlchemy engine, session factory, dependency injection
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── models.py    # ORM models: Bakery, Rating
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── bakeries.py  # GET/POST/DELETE /api/bakeries endpoints
│   │   │   └── ratings.py   # POST /api/bakeries/{id}/ratings endpoint
│   │   └── schemas/
│   │       ├── __init__.py
│   │       └── schemas.py   # Pydantic input/output schemas
│   ├── requirements.txt      # Python dependencies
│   ├── venv/                # Virtual environment (generated)
│   └── croissant.db         # SQLite database file (generated)
├── frontend/                # React + Vite application
│   ├── src/
│   │   ├── main.jsx         # React root entry point
│   │   ├── App.jsx          # Main app component with state & layout
│   │   ├── api.js           # Fetch wrappers for backend API
│   │   ├── index.css        # Global Tailwind CSS styles
│   │   └── components/
│   │       ├── AddBakeryForm.jsx      # Form to add bakery & optional rating
│   │       ├── BakeryCard.jsx         # Individual bakery display card
│   │       ├── BakeryList.jsx         # Grid of all bakery cards
│   │       ├── MapView.jsx            # Leaflet map with bakery markers
│   │       ├── PlaceSearch.jsx        # Autocomplete place search (UI component)
│   │       ├── RateCroissantForm.jsx  # Rating form sub-component
│   │       └── StarRating.jsx         # Star rating display/editor
│   ├── public/               # Static assets
│   ├── dist/                # Built output (generated)
│   ├── package.json         # npm dependencies
│   ├── vite.config.js       # Vite build config
│   ├── eslint.config.js     # ESLint configuration
│   ├── index.html           # HTML entry point
│   └── node_modules/        # npm packages (generated)
├── .planning/
│   └── codebase/            # Documentation directory
├── CLAUDE.md                # Project setup instructions
├── pre-coding-journal.md    # Development notes and progress tracking
└── .gitignore               # Git ignore patterns
```

## Directory Purposes

**backend/app/:**
- Purpose: Main FastAPI application code
- Contains: Entry point, configuration, database setup, routers, models, schemas
- Key files: `main.py`, `database.py`

**backend/app/models/:**
- Purpose: SQLAlchemy ORM models
- Contains: Bakery and Rating table definitions with relationships
- Key files: `models.py`

**backend/app/routers/:**
- Purpose: API endpoint handlers
- Contains: Two router modules organizing endpoints by resource (bakeries, ratings)
- Key files: `bakeries.py` (list, create, get detail, delete), `ratings.py` (create rating)

**backend/app/schemas/:**
- Purpose: Pydantic request/response validation schemas
- Contains: Input schemas (BakeryCreate, RatingCreate) and output schemas (BakeryOut, BakeryDetail, RatingOut)
- Key files: `schemas.py`

**frontend/src/:**
- Purpose: React application source code
- Contains: Entry point, main app component, API client, all UI components
- Key files: `main.jsx`, `App.jsx`, `api.js`

**frontend/src/components/:**
- Purpose: Reusable React components
- Contains: Feature components (AddBakeryForm, BakeryList, MapView) and UI primitives (StarRating, PlaceSearch)
- Key files: All .jsx files in directory

**frontend/public/:**
- Purpose: Static assets served by Vite dev server and production build
- Contains: Favicon, robots.txt, or other static files
- Key files: None currently critical

## Key File Locations

**Entry Points:**

- `backend/app/main.py`: FastAPI application entry point; run with `uvicorn app.main:app --reload`
- `frontend/src/main.jsx`: React entry point; renders App into DOM element with id="root"
- `frontend/index.html`: HTML bootstrap file; loads Vite runtime and references React root div

**Configuration:**

- `backend/requirements.txt`: Python dependencies (fastapi, uvicorn, sqlalchemy, httpx, pydantic)
- `frontend/package.json`: npm dependencies and build scripts
- `frontend/vite.config.js`: Vite build configuration with React plugin
- `frontend/.env`: Environment variables (VITE_API_URL)

**Core Logic:**

- `backend/app/models/models.py`: Bakery and Rating ORM models with relationships
- `backend/app/database.py`: SQLite engine setup, session management, dependency injection
- `backend/app/routers/bakeries.py`: Bakery CRUD endpoints, geocoding integration
- `backend/app/routers/ratings.py`: Rating creation endpoint
- `frontend/src/api.js`: All fetch wrappers for backend communication

**UI Components:**

- `frontend/src/App.jsx`: Main app layout, state management, data fetching
- `frontend/src/components/AddBakeryForm.jsx`: Form to add bakery and rating
- `frontend/src/components/BakeryList.jsx`: Grid display of all bakeries
- `frontend/src/components/MapView.jsx`: Leaflet map visualization
- `frontend/src/components/BakeryCard.jsx`: Individual bakery card with rating display
- `frontend/src/components/StarRating.jsx`: Star rating display and input component

## Naming Conventions

**Files:**

- Python: `snake_case.py` (e.g., `models.py`, `bakeries.py`, `schemas.py`)
- React JSX: `PascalCase.jsx` (e.g., `App.jsx`, `BakeryCard.jsx`, `AddBakeryForm.jsx`)
- JavaScript utilities: `camelCase.js` (e.g., `api.js`)
- CSS/config: `kebab-case.js` or `kebab-case.config.js` (e.g., `vite.config.js`, `eslint.config.js`)

**Directories:**

- Lowercase with plural when containing multiple items: `models/`, `routers/`, `schemas/`, `components/`

**React Components:**

- Export default function with PascalCase name matching filename
- Props passed as destructured object in function signature
- State variables using camelCase: `bakeries`, `loading`, `submitting`, `error`, `success`

**Python Functions/Variables:**

- Async functions: `async def geocode_address()`, `async def handleSubmit()`
- Router endpoints: Descriptive verbs like `list_bakeries()`, `create_bakery()`, `delete_bakery()`, `get_bakery()`
- Database models: PascalCase class names (Bakery, Rating) with __tablename__ in snake_case

**API Routes:**

- Hierarchical REST conventions:
  - `GET /api/bakeries` — list all
  - `POST /api/bakeries` — create
  - `GET /api/bakeries/{id}` — get one
  - `DELETE /api/bakeries/{id}` — delete
  - `POST /api/bakeries/{id}/ratings` — create rating for bakery

## Where to Add New Code

**New Feature (e.g., search, filtering):**
- Backend endpoint: Add to existing router in `backend/app/routers/` or create new router file `backend/app/routers/search.py`, then register in `main.py`
- Frontend component: Add to `frontend/src/components/`, import in `App.jsx`
- Schema/model: Update `backend/app/schemas/schemas.py` and `backend/app/models/models.py` as needed
- API client: Add function to `frontend/src/api.js`

**New Component/Module:**
- React component: Create file in `frontend/src/components/PascalCase.jsx` with default export
- Python module: Create file in appropriate subdirectory (models, routers, schemas) with snake_case name
- Import pattern: Always import at component/function level, avoid circular dependencies

**Utilities:**
- Backend helpers: Add to existing modules (e.g., geocoding helper in `routers/bakeries.py`) or create `backend/app/utils.py`
- Frontend helpers: Add to `frontend/src/api.js` if API-related; otherwise create `frontend/src/utils.js`
- Shared styles: Use Tailwind utility classes directly in JSX; no additional CSS files unless needed for global animations

**Tests:**
- Backend: Create `backend/tests/` directory with `test_routers.py`, `test_models.py`; run with `pytest`
- Frontend: Create `.test.jsx` or `.spec.jsx` files co-located with components; run with test runner (not yet configured)

## Special Directories

**backend/venv/:**
- Purpose: Python virtual environment
- Generated: Yes
- Committed: No (in .gitignore)

**frontend/node_modules/:**
- Purpose: npm packages
- Generated: Yes
- Committed: No (in .gitignore)

**frontend/dist/:**
- Purpose: Production build output
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**backend/croissant.db:**
- Purpose: SQLite database file
- Generated: Yes (created automatically on first run by lifespan hook in main.py)
- Committed: No (in .gitignore)

**.planning/codebase/:**
- Purpose: Architecture and coding standards documentation
- Generated: No (manually created)
- Committed: Yes (helps future development)

---

*Structure analysis: 2026-03-11*
