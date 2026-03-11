---
phase: 01-auth-and-database-foundation
plan: 01
subsystem: auth
tags: [jwt, sqlite, alembic, fastapi, pwdlib, pyjwt, argon2, pytest]

requires: []
provides:
  - Alembic-managed SQLite schema with render_as_batch=True for SQLite compatibility
  - User model with username, hashed_password, is_active, created_at
  - users table with sentinel legacy user (id=1) backfilled to all existing bakery/rating rows
  - JWT access token (30 min, in JSON) + refresh token (30 days, HttpOnly cookie) auth flow
  - POST /api/auth/register, POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/logout endpoints
  - get_current_user FastAPI dependency (Bearer token validation)
  - bakeries and ratings routers protected with Depends(get_current_user)
  - ratings.create_rating captures current_user.id on new Rating records
  - 9 passing pytest auth tests with in-memory SQLite fixture
affects:
  - 01-auth-and-database-foundation
  - All future phases (user identity established — every feature depends on this)

tech-stack:
  added:
    - alembic 1.18.x — Alembic with render_as_batch=True for SQLite
    - PyJWT==2.11.0 — JWT token encode/decode
    - pwdlib[argon2]==0.3.0 — password hashing with Argon2
    - python-dotenv — load SECRET_KEY and DATABASE_URL from .env
    - pytest + pytest-asyncio — test runner
  patterns:
    - Alembic batch mode migration for SQLite (render_as_batch=True in both online and offline contexts)
    - Sentinel user backfill — insert legacy user before adding FK columns, UPDATE SET user_id = 1 WHERE NULL
    - JWT access + refresh token split — access in JSON response, refresh as HttpOnly cookie
    - Router-level auth protection via dependencies=[Depends(get_current_user)] on include_router
    - StaticPool for in-memory SQLite test fixtures to prevent connection-per-call isolation issues

key-files:
  created:
    - backend/app/auth.py — hash_password, verify_password, create_access_token, create_refresh_token, decode_token
    - backend/app/dependencies.py — get_current_user dependency (OAuth2PasswordBearer)
    - backend/app/routers/auth.py — register, login, refresh, logout endpoints
    - backend/alembic/versions/001_add_user_auth.py — users table + user_id FK backfill migration
    - backend/alembic/env.py — configured with render_as_batch=True and app.models import
    - backend/alembic.ini — pointing at sqlite:///./croissant.db
    - backend/tests/conftest.py — in-memory SQLite fixture with StaticPool and TestClient
    - backend/tests/test_auth.py — 9 auth test cases
    - backend/pytest.ini — testpaths=tests, asyncio_mode=auto
  modified:
    - backend/app/database.py — load DATABASE_URL from .env via dotenv
    - backend/app/models/models.py — added User model; added user_id FK to Bakery and Rating
    - backend/app/schemas/schemas.py — added UserCreate, UserOut, Token schemas
    - backend/app/main.py — removed create_all from lifespan; CORS from env; registered auth router; protected bakeries/ratings routers
    - backend/app/routers/ratings.py — added current_user dependency; set user_id on new ratings
    - backend/requirements.txt — added alembic, PyJWT, pwdlib, python-dotenv, pytest, pytest-asyncio

key-decisions:
  - "StaticPool required for in-memory SQLite test fixtures — SQLAlchemy default pool creates a new connection per query, each with an empty in-memory DB; StaticPool forces all queries through a single connection"
  - "Migration written manually (not autogenerate) to control sentinel user insertion order — users row must exist before FK columns added to bakeries/ratings"
  - "Migration uses idempotent guards (_table_exists, _column_exists) because DB had users table pre-created by create_all() before Alembic was initialized"
  - "secure=False on refresh cookie when DEBUG=true — cookie only works over HTTPS with secure=True; flip to true in production"
  - "Auth applied at include_router level (not per-endpoint) for bakeries and ratings — protects all routes in those routers with one line"

patterns-established:
  - "Pattern: Use StaticPool from sqlalchemy.pool for in-memory SQLite test engines"
  - "Pattern: Manual Alembic migrations with idempotency guards for SQLite when tables may already exist"
  - "Pattern: Refresh token in HttpOnly cookie, access token in JSON response body"
  - "Pattern: Router-level auth via app.include_router(..., dependencies=[Depends(get_current_user)])"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

duration: 5min
completed: 2026-03-11
---

# Phase 1 Plan 01: Auth and Database Foundation Summary

**Alembic-managed SQLite schema with sentinel backfill, PyJWT + Argon2 auth endpoints (register/login/refresh/logout), router-level protection, and 9 passing pytest tests**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-11T23:32:11Z
- **Completed:** 2026-03-11T23:37:00Z
- **Tasks:** 2 (Task 1: Alembic + migration; Task 2: auth implementation with TDD)
- **Files modified:** 16

## Accomplishments

- Alembic initialized with render_as_batch=True, existing schema stamped as baseline, users table and user_id FK columns added via 001_add_user_auth migration with sentinel user (id=1, username="legacy") backfilled to all existing bakery and rating rows
- Full JWT auth flow: POST /api/auth/register (201), POST /api/auth/login (access_token JSON + refresh_token HttpOnly cookie), POST /api/auth/refresh (cookie → new access_token), POST /api/auth/logout (cookie cleared)
- All bakeries and ratings endpoints now require a valid Bearer token — 401 without it, 200 with it
- 9 pytest tests pass using in-memory SQLite with StaticPool fixture

## Task Commits

Each task was committed atomically:

1. **Task 1: Alembic setup, User model, migration with sentinel backfill** - `1d16c3e` (feat)
2. **Task 2 RED: Failing auth tests** - `1cbb7b2` (test)
3. **Task 2 GREEN: Auth utilities, router, route protection** - `815e84e` (feat)

_Note: Task 2 used TDD — test commit (RED) followed by implementation commit (GREEN)_

## Files Created/Modified

- `backend/app/auth.py` — JWT encode/decode and password hash/verify utilities using PyJWT + pwdlib[argon2]
- `backend/app/dependencies.py` — get_current_user FastAPI dependency via OAuth2PasswordBearer
- `backend/app/routers/auth.py` — register, login, refresh, logout endpoints
- `backend/alembic/versions/001_add_user_auth.py` — migration: users table, sentinel user, user_id FK on bakeries and ratings
- `backend/alembic/env.py` — Alembic env with render_as_batch=True and model imports
- `backend/alembic.ini` — Alembic config pointing at croissant.db
- `backend/tests/conftest.py` — StaticPool in-memory SQLite + TestClient fixture
- `backend/tests/test_auth.py` — 9 auth test cases
- `backend/pytest.ini` — test configuration
- `backend/app/database.py` — DATABASE_URL from .env
- `backend/app/models/models.py` — User model; user_id FK on Bakery and Rating
- `backend/app/schemas/schemas.py` — UserCreate, UserOut, Token schemas
- `backend/app/main.py` — auth router (public) + bakeries/ratings protected with get_current_user
- `backend/app/routers/ratings.py` — capture current_user.id on new ratings
- `backend/requirements.txt` — updated with all new dependencies

## Decisions Made

- **StaticPool for test fixtures:** SQLAlchemy's default pool creates a new in-memory SQLite connection per query, each yielding an empty DB. StaticPool forces all queries through one connection, solving "no such table" errors after commit().
- **Manual migration over autogenerate:** Writing the migration by hand ensured the sentinel user INSERT happens before FK column additions, which is order-dependent and would be unpredictable with autogenerate.
- **Idempotency guards in migration:** The DB already had a users table created by the old `create_all()` call before Alembic was set up. Guards using `inspect()` make the migration safe to run regardless of prior state.
- **secure=False on refresh cookie (DEBUG mode):** Cookie requires HTTPS for secure=True. Local dev uses HTTP. The DEBUG env var controls this; flip to secure=True in production.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added StaticPool to test engine for in-memory SQLite**
- **Found during:** Task 2 (conftest.py and test run)
- **Issue:** SQLAlchemy default pool opens a new connection per query for sqlite:///:memory:, each yielding a fresh empty database. After commit(), db.refresh() opened a new connection with no tables, causing "no such table: users".
- **Fix:** Added `poolclass=StaticPool` to the test engine in conftest.py — forces single connection reuse across all queries in the same session
- **Files modified:** backend/tests/conftest.py
- **Verification:** All 9 tests pass
- **Committed in:** 815e84e (Task 2 GREEN commit)

**2. [Rule 1 - Bug] Added idempotency guards to Alembic migration**
- **Found during:** Task 1 (running `alembic upgrade head`)
- **Issue:** The users table was already present in croissant.db (created by `create_all()` before Alembic was initialized). Migration failed with "table users already exists".
- **Fix:** Added `_table_exists()` and `_column_exists()` helper functions using SQLAlchemy `inspect()` to skip DDL operations that are already in place. Used `INSERT OR IGNORE` for the sentinel user.
- **Files modified:** backend/alembic/versions/001_add_user_auth.py
- **Verification:** Migration ran successfully; all columns present, sentinel user exists
- **Committed in:** 1d16c3e (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs discovered during execution)
**Impact on plan:** Both fixes were required for correctness. No scope creep.

## Issues Encountered

- Alembic `stamp head` with no recorded version did not prevent the migration from trying to create already-existing tables. The stamp created the `alembic_version` table but wrote an empty row (no version_num), so `upgrade head` ran the migration from scratch and hit the existing users table. Fixed by adding idempotency guards.

## User Setup Required

The `.env` file was created locally but is gitignored (correct). Any fresh checkout needs:

```bash
cd backend
cp .env.example .env  # (no .env.example yet — create manually)
# Set: SECRET_KEY, DATABASE_URL, CORS_ORIGINS, DEBUG
python -c "import secrets; print(secrets.token_urlsafe(32))"  # generate SECRET_KEY
alembic upgrade head
```

## Next Phase Readiness

- Auth foundation complete — user identity established for all future features
- Database managed by Alembic — future schema changes go through migration files
- Bakeries and ratings endpoints are protected; frontend will need to pass Bearer tokens
- Pydantic `class Config` deprecation warnings present in schemas (pre-existing pattern) — can be migrated to `model_config = ConfigDict(from_attributes=True)` in a future cleanup pass

---
*Phase: 01-auth-and-database-foundation*
*Completed: 2026-03-11*
