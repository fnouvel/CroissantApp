# Technology Stack

**Analysis Date:** 2026-03-11

## Languages

**Primary:**
- Python 3.x - Backend API with FastAPI
- JavaScript (ES2020+) - Frontend with React and Vite

**Secondary:**
- CSS/Tailwind - Styling via Tailwind CSS

## Runtime

**Backend Environment:**
- Python 3.x
- Virtual environment at `backend/venv/`

**Frontend Environment:**
- Node.js (Node Package Manager lockfile present at `frontend/package-lock.json`)

**Package Managers:**
- pip - Python package management
- npm - JavaScript package management

## Frameworks

**Backend:**
- FastAPI 0.x - REST API framework for handling HTTP requests and routing
- Uvicorn with standard extras (`uvicorn[standard]`) - ASGI server for running FastAPI application

**Frontend:**
- React 19.2.0 - UI library for building interactive components
- Vite 7.3.1 - Build tool and development server
- Tailwind CSS 4.2.1 - Utility-first CSS framework for styling
- Leaflet 1.9.4 - Map rendering library (dev dependency)
- React Leaflet 5.0.0 - React bindings for Leaflet maps (dev dependency)

**Testing:**
- pytest (referenced in CLAUDE.md commands, may be in venv)

**Development & Linting:**
- ESLint 9.39.1 - JavaScript linting
- @eslint/js 9.39.1 - ESLint JavaScript rules
- eslint-plugin-react-hooks 7.0.1 - React hooks linting rules
- eslint-plugin-react-refresh 0.4.24 - Vite React refresh linting
- @tailwindcss/vite 4.2.1 - Tailwind CSS Vite plugin

## Key Dependencies

**Backend - Critical:**
- SQLAlchemy - ORM for database operations at `backend/app/database.py`
- Pydantic - Data validation and serialization for API schemas at `backend/app/schemas/schemas.py`
- httpx - Async HTTP client for external API calls (geocoding at `backend/app/routers/bakeries.py`)

**Backend - Infrastructure:**
- FastAPI - Web framework core

**Frontend - Critical:**
- react - Core UI framework
- react-dom - React DOM rendering
- leaflet - Map functionality at `frontend/src/components/MapView.jsx`
- react-leaflet - React map component bindings

**Frontend - Build & Dev:**
- @vitejs/plugin-react - Vite React plugin for JSX transformation and HMR
- @types/react - TypeScript types for React (type safety in JSX files)
- @types/react-dom - TypeScript types for React DOM
- globals - Global variable definitions for ESLint

## Configuration

**Backend Environment:**
- Database: SQLite file at `backend/croissant.db` (configured in `backend/app/database.py`)
- Database URL: `sqlite:///./croissant.db`
- No environment variables file required (croissant.db is tracked in repo)

**Frontend Environment:**
- Config file: `.env` present at `frontend/.env` (contains VITE_API_URL)
- API endpoint configured via VITE_API_URL environment variable at `frontend/src/api.js`

**Build Configuration:**
- Backend: No explicit build config (Uvicorn server-based)
- Frontend: Vite config at `frontend/vite.config.js`
  - React plugin enabled
  - Tailwind CSS plugin enabled

## ESLint & Code Quality Configuration

**Frontend Linting:**
- Config file: `frontend/eslint.config.js`
- Extends: ESLint recommended, React Hooks recommended, React Refresh (Vite)
- ECMAVersion: 2020, with support for latest features
- Target: Browser environment
- Rule overrides: Variables matching `^[A-Z_]` pattern allowed as unused (constants pattern)

## Platform Requirements

**Development:**
- Python 3.x with pip
- Node.js with npm
- Virtual environment support for Python (venv at `backend/venv/`)
- Supports macOS/Linux/Windows development

**Production:**
- Python runtime with FastAPI/Uvicorn
- Node.js runtime for frontend static hosting (or pre-built dist folder)
- SQLite database file at `/backend/croissant.db`

## Development Server Commands

**Backend (from CLAUDE.md):**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload   # dev server on :8000
```

**Frontend (from CLAUDE.md):**
```bash
cd frontend
npm install
npm run dev          # dev server on :5173
npm run build        # production build
```

---

*Stack analysis: 2026-03-11*
