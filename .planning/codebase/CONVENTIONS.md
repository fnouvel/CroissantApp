# Coding Conventions

**Analysis Date:** 2026-03-11

## Naming Patterns

**Files:**
- Backend Python: `snake_case.py` (e.g., `models.py`, `schemas.py`, `database.py`)
- Frontend JavaScript: `camelCase.jsx` (e.g., `AddBakeryForm.jsx`, `StarRating.jsx`)
- Router/endpoint modules: descriptive plural nouns (e.g., `bakeries.py`, `ratings.py`)

**Functions:**
- Backend: `snake_case` (e.g., `list_bakeries()`, `geocode_address()`, `get_db()`)
- Frontend: `camelCase` for regular functions; `PascalCase` for components (e.g., `handleSubmit()`, `BakeryCard()`, `AddBakeryForm()`)

**Variables:**
- Backend: `snake_case` for all variables (e.g., `session_local`, `sqlalchemy_database_url`, `avg_score`)
- Frontend: `camelCase` for state and regular variables (e.g., `setLoading()`, `onDelete()`, `bakeries`)
- Frontend: State setters follow React pattern: `set[Variable]` (e.g., `setName()`, `setError()`, `setSuccess()`)

**Types/Classes:**
- Backend ORM models: `PascalCase` (e.g., `Bakery`, `Rating`)
- Frontend component names: `PascalCase` (e.g., `BakeryCard`, `StarRating`, `MapView`)
- Pydantic schemas: `PascalCase` (e.g., `BakeryCreate`, `BakeryOut`, `BakeryDetail`)

## Code Style

**Formatting:**
- No automatic formatter detected (no Prettier, Black, or Ruff configuration)
- Consistent 2-space indentation in frontend JSX
- Consistent 4-space indentation in backend Python

**Linting:**
- Frontend: ESLint with flat config at `frontend/eslint.config.js`
- Rule: `no-unused-vars` with pattern `^[A-Z_]` to ignore uppercase constants
- Enables React Hooks and React Refresh plugins
- No backend linting configured (not detected)

## Import Organization

**Backend (Python):**
1. Standard library imports (e.g., `datetime`, `contextlib`)
2. Third-party library imports (e.g., `fastapi`, `sqlalchemy`, `httpx`, `pydantic`)
3. Local app imports (relative: `from app.database import ...`)

**Frontend (JavaScript):**
1. Third-party React imports (e.g., `import React, { useState } from "react"`)
2. Third-party library imports (e.g., `react-leaflet`, component libraries)
3. Local imports from same module or utilities (e.g., `from "./api"`, `from "./components/..."`)

**Path Aliases:**
- Frontend: `import.meta.env.VITE_API_URL` used for API endpoint configuration
- No other path aliases observed

## Error Handling

**Backend:**
- HTTP exceptions: `raise HTTPException(status_code=404, detail="Bakery not found")`
- Silent failures in external API calls: `except Exception: pass` with fallback return values (e.g., `(None, None)`)
- Database errors: Not explicitly handled; implicit transaction rollback via session management

**Frontend:**
- Try-catch blocks in async operations (e.g., in `handleSubmit()`)
- Error state management with `error` state variable
- Display errors to user via alert/modal: `setError(err.message)`
- Generic fallback error messages: "Failed to fetch bakeries", "Failed to create bakery"

## Logging

**Framework:** `console` only

**Patterns:**
- Backend: No logging detected; no logger imports in routers
- Frontend: `console.error(err)` for error logging (e.g., `console.error(err)` in error handlers)
- No structured logging, no log levels

## Comments

**When to Comment:**
- Minimal comments in codebase
- Constants use trailing comments (e.g., `BOSTON_CENTER = [42.36, -71.06]; # Boston center`)
- No JSDoc/TSDoc patterns observed

**JSDoc/TSDoc:**
- Not used; function parameters are self-documenting in most cases
- Backend: Pydantic models include type hints but no docstrings

## Function Design

**Size:** Functions are relatively focused and concise
- Backend router handlers: 10-25 lines
- Frontend components: 20-140 lines (larger components with multiple concerns)
- Helper functions: 5-15 lines

**Parameters:**
- Backend: Explicit parameters with type hints (e.g., `address: str`, `bakery_id: int`)
- Frontend: Props passed as objects; destructuring used (e.g., `{ bakery, onDelete }`)
- Backend dependency injection via FastAPI `Depends()` (e.g., `db: Session = Depends(get_db)`)

**Return Values:**
- Backend: Pydantic response models (e.g., `response_model=BakeryOut`)
- Frontend: JSX elements or component instances
- Backend async functions: use `async def` with `await` for external API calls

## Module Design

**Exports:**
- Backend: Each router file exports a single `router` object configured with `APIRouter()`
- Frontend: Each component file exports a single default component via `export default function ComponentName()`
- Backend schemas and models: Exported directly from their modules

**Barrel Files:**
- Backend: `__init__.py` files exist but appear empty (no barrel pattern imports detected)
- Frontend: No barrel files; direct imports from component files

## Specific Frontend Patterns

**State Management:**
- React hooks: `useState()` for local state, `useCallback()` for memoized functions, `useRef()` for refs
- Lifting state: Parent components manage state (e.g., `bakeries` state in `App.jsx`)
- State patterns: `loading`, `error`, `success`, `submitting` flags for async operations

**Event Handling:**
- Inline handlers: `onClick={() => functionCall()}` for simple actions
- Form submission: `onSubmit={(e) => { e.preventDefault(); ... }}`
- Conditional handlers: Handlers wrapped in conditions (e.g., `interactive && onRate?.(star)`)

**Component Props:**
- Callback props follow naming convention: `onEvent` (e.g., `onDelete()`, `onAdded()`, `onRate()`, `onSelect()`)
- Data props are descriptive nouns (e.g., `bakeries`, `rating`, `loading`)

## Specific Backend Patterns

**Database:**
- SQLAlchemy ORM with session management via `Depends(get_db)`
- Relationships defined with `relationship()` (e.g., `ratings = relationship("Rating", ...)`)
- Cascading deletes: `cascade="all, delete-orphan"`

**Schemas:**
- Pydantic `BaseModel` for request/response validation
- Config class: `from_attributes = True` for ORM model to schema conversion
- Union types: `float | None` (Python 3.10+ syntax)

**Route Organization:**
- Prefix-based routing: `APIRouter(prefix="/api/bakeries", tags=["bakeries"])`
- Status codes explicit: `status_code=201` for POST, `status_code=204` for DELETE
- Response models specified: `response_model=BakeryOut`

---

*Convention analysis: 2026-03-11*
