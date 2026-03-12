# CroissantApp — Croissant Club

A croissant rating journal for friends and family to discover, rate, and track Boston bakeries' croissants together.

## Tech Stack
- **Backend**: Python with FastAPI, SQLAlchemy, Alembic (SQLite)
- **Frontend**: React 19 + Vite + Tailwind CSS 4 + MapLibre GL
- **Auth**: JWT access tokens + HttpOnly refresh cookies
- **Architecture**: API-first — the React frontend consumes FastAPI REST endpoints

## Project Structure
```
CroissantApp/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── dependencies.py      # get_current_user
│   │   ├── routers/
│   │   │   ├── auth.py          # login, register, refresh, logout
│   │   │   ├── bakeries.py      # CRUD + geocoding + aggregates
│   │   │   └── ratings.py       # category ratings + my-ratings
│   │   ├── models/models.py     # User, Bakery, Rating (4 categories)
│   │   └── schemas/schemas.py
│   ├── alembic/                 # migrations
│   ├── tests/
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Tab-based SPA (Home/Explore/Rate/Journal)
│   │   ├── api.js               # API layer
│   │   ├── index.css            # Full design system (warm bakery tokens)
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state + token management
│   │   └── components/
│   │       ├── LoginForm.jsx
│   │       ├── MapView.jsx      # MapLibre GL via react-map-gl
│   │       ├── FillBar.jsx      # Animated score bars
│   │       └── PlaceSearch.jsx  # Nominatim place autocomplete
│   ├── package.json
│   └── .env
├── .planning/                   # GSD workflow state
├── CLAUDE.md
└── pre-coding-journal.md
```

## Common Commands

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload   # dev server on :8000
pytest                          # run tests
ruff check .                    # lint
alembic upgrade head            # run migrations
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # dev server on :5173
npm run build        # production build
npm run lint         # lint
```

## Design System
- **Fonts**: Fraunces (serif headings) + Inter (body)
- **Colors**: #F4F1EA (oat bg), #FFFCF9 (cream surface), #D27D56 (terracotta accent), #8A9A86 (sage muted), #2D2824 (warm charcoal dark)
- **Layout**: Desktop sidebar + mobile bottom tab bar, 4 views
- **Rating**: 🥐 emoji buttons for flakiness, butteriness, freshness, size/value (1-5 each)

## Current Status
- **Phase 1** (Auth): Complete — JWT auth, Alembic migrations, login/register
- **Phase 2** (Ratings & UI): Complete — category ratings, tab-based SPA redesign
- **Phase 3** (Photos): Not started
- **Phase 4** (Map Polish): Not started
- See `.planning/STATE.md` for detailed GSD progress

## Notes
- Map uses OpenFreeMap vector tiles (no API key needed)
- Geocoding via Nominatim (rate-limited, User-Agent required)
- Work iteratively: small changes, test often, commit frequently
