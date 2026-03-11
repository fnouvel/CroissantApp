# Phase 1: Auth and Database Foundation - Research

**Researched:** 2026-03-11
**Domain:** FastAPI JWT authentication + Alembic schema migrations for SQLite
**Confidence:** HIGH

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create account with username and password | User model + pwdlib[argon2] password hashing + POST /auth/register endpoint |
| AUTH-02 | User can log in and stay logged in across sessions | PyJWT token issuance + AuthContext in React memory + HttpOnly refresh cookie for page-reload persistence |
| AUTH-03 | User can log out from any page | Frontend clears access token from AuthContext + calls DELETE /auth/logout to clear the HttpOnly cookie |

</phase_requirements>

---

## Summary

Phase 1 is the dependency anchor for the entire app. No per-user feature — ratings, group views, rating history, map pin states — can be built until user identity exists. This phase has two interlocking concerns: standing up JWT authentication, and replacing the current schema management approach (raw `create_all()`) with Alembic so that all future phases can safely migrate the database.

The existing codebase is a working MVP: FastAPI backend with two routers (`/api/bakeries`, `/api/bakeries/{id}/ratings`), SQLAlchemy ORM against a SQLite file (`croissant.db`), and a React 19 + Vite + Tailwind frontend. No auth library, no Alembic, and no test infrastructure exist yet. Every endpoint is currently public. The `Rating` and `Bakery` tables have no `user_id` column — existing rows belong to no user. This must be resolved within this phase by creating a sentinel "legacy" user and backfilling existing rows.

The recommended approach is: install Alembic first and stamp the current schema as the baseline, then add the `User` model and run a migration that adds `user_id` nullable to `Rating` and `Bakery`, backfills existing rows to the sentinel user, and tightens the constraint. The JWT pattern is access token in React Context (in-memory) plus refresh token in an HttpOnly cookie — this survives page reloads without touching localStorage and avoids XSS token exposure.

**Primary recommendation:** Set up Alembic with batch mode as the very first task in this phase, before touching any model file. Stamp the existing schema, then layer auth on top through proper migration files.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| alembic | 1.14.x | Database schema migrations | Only migration tool for SQLAlchemy. Required for SQLite because `create_all()` cannot alter existing tables. Must be configured with `render_as_batch=True` for SQLite. |
| PyJWT | 2.11.0 | JWT token creation and verification | FastAPI officially migrated from python-jose to PyJWT in 2024 (PR #11589). python-jose has known CVEs and no releases since 2021. PyJWT is the current documented recommendation. |
| pwdlib[argon2] | 0.3.0 | Password hashing and verification | FastAPI docs replaced passlib with pwdlib after passlib broke on Python 3.13+. Argon2 is the current OWASP-recommended algorithm. Install with `pip install "pwdlib[argon2]"`. |
| python-dotenv | latest | Load `.env` secrets | Needed to keep `SECRET_KEY` and `DATABASE_URL` out of source code from day one of auth. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pytest | latest | Backend test runner | Wave 0 of this phase — install before writing any auth code so tests can be written alongside implementation. |
| pytest-asyncio | latest | Async endpoint testing | FastAPI routes that call async functions (geocoding) require async test support. |
| httpx | already installed | FastAPI TestClient support | Already in requirements.txt; used by FastAPI's `TestClient`. No additional install. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PyJWT | python-jose | Never — python-jose unmaintained, FastAPI officially deprecated it |
| pwdlib[argon2] | passlib[bcrypt] | Never on Python 3.13+ — passlib breaks. passlib also unmaintained. |
| Alembic | Manual SQL migration scripts | Custom scripts cannot understand SQLAlchemy models; Alembic autogenerates diffs |
| HttpOnly cookie refresh token | localStorage for JWT | localStorage is readable by any JS on the page; XSS steals the token. In-memory + cookie is the correct pattern. |

**Installation:**

```bash
# Backend additions for Phase 1
pip install alembic
pip install PyJWT==2.11.0
pip install "pwdlib[argon2]==0.3.0"
pip install python-dotenv
pip install pytest pytest-asyncio
```

---

## Architecture Patterns

### File Structure After Phase 1

```
backend/
├── alembic/                       # NEW: migration environment
│   ├── env.py                     # configured with render_as_batch=True
│   ├── script.py.mako
│   └── versions/
│       └── 001_add_user_auth.py   # first migration: User table + user_id backfill
├── alembic.ini                    # NEW: Alembic config pointing at croissant.db
├── app/
│   ├── main.py                    # UPDATE: move DATABASE_URL to .env, CORS origins to .env
│   ├── database.py                # UPDATE: read DATABASE_URL from env
│   ├── auth.py                    # NEW: JWT encode/decode, password hash/verify utilities
│   ├── dependencies.py            # NEW: get_current_user() FastAPI dependency
│   ├── models/
│   │   └── models.py              # UPDATE: add User model; add user_id FK to Bakery and Rating
│   ├── schemas/
│   │   └── schemas.py             # UPDATE: add UserCreate, UserOut, Token, TokenRefresh schemas
│   └── routers/
│       ├── auth.py                # NEW: POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout
│       ├── bakeries.py            # UPDATE: add current_user dep to all write endpoints; protect GET endpoints
│       └── ratings.py             # UPDATE: add current_user dep; set user_id from token
├── tests/
│   ├── conftest.py                # NEW: in-memory SQLite test DB, TestClient fixture
│   └── test_auth.py               # NEW: register, login, token refresh, protected endpoint 401 tests
├── .env                           # NEW: SECRET_KEY, DATABASE_URL, CORS_ORIGINS
└── requirements.txt               # UPDATE: new dependencies
frontend/
├── src/
│   ├── api.js                     # UPDATE: attach Authorization: Bearer header, handle 401 responses
│   ├── App.jsx                    # UPDATE: wrap with AuthProvider; render LoginForm if no token
│   └── context/
│       └── AuthContext.jsx        # NEW: access token in state, currentUser, login(), logout()
│   └── components/
│       └── LoginForm.jsx          # NEW: username/password form, calls POST /auth/login
```

### Pattern 1: Alembic Setup for SQLite with Existing Data

**What:** Initialize Alembic, configure it for SQLite batch mode, stamp the existing schema as the baseline, then create migrations for all schema changes going forward.

**When to use:** Any time you need to change an existing table in SQLite. `create_all()` only creates missing tables — it cannot add columns, rename columns, or add foreign keys to populated tables.

**Why this matters for this project:** The `bakeries` and `ratings` tables already have data (the existing MVP bakeries and ratings). Adding `user_id` FK columns to these tables requires the SQLite batch-mode table-recreate dance. Without Alembic, this is either a data-destroying operation or a manual SQL script that isn't reproducible.

**Example — alembic/env.py configuration:**
```python
# Source: https://alembic.sqlalchemy.org/en/latest/batch.html
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Import your models so autogenerate sees them
from app.database import Base
import app.models.models  # noqa: F401

config = context.config
fileConfig(config.config_file_name)
target_metadata = Base.metadata

def run_migrations_offline():
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        render_as_batch=True,   # CRITICAL for SQLite
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(config.get_section(config.config_ini_section))
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,   # CRITICAL for SQLite
        )
        with context.begin_transaction():
            context.run_migrations()
```

**Setup sequence:**
```bash
cd backend
alembic init alembic
# Edit alembic.ini: set sqlalchemy.url = sqlite:///./croissant.db
# Edit alembic/env.py: add render_as_batch=True (see above)
alembic stamp head   # marks existing schema as current baseline — no migration run
alembic revision --autogenerate -m "add_user_auth"  # generates first real migration
alembic upgrade head  # applies the migration
```

### Pattern 2: User Model + Sentinel Backfill Migration

**What:** Add a `User` model, add nullable `user_id` FK to existing tables, create a sentinel "legacy" user in the migration, backfill all existing rows to that user.

**When to use:** Any time you add user ownership to a table that already has data.

**Why sentinel over nullable:** Nullable `user_id` means every future query must handle `None` — the auth checks need `user.id`, the group scoping needs `user.id`, and every error message needs to account for missing owners. A sentinel user (id=1, username="legacy") gives all existing rows a valid owner that can be recognized and filtered in the UI if needed.

**Example — migration file:**
```python
# alembic/versions/001_add_user_auth.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    # 1. Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("username", sa.String, nullable=False, unique=True),
        sa.Column("hashed_password", sa.String, nullable=False),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime),
    )

    # 2. Insert sentinel user BEFORE adding FK columns
    op.execute("INSERT INTO users (id, username, hashed_password, is_active, created_at) "
               "VALUES (1, 'legacy', 'NOT_A_REAL_HASH', 1, datetime('now'))")

    # 3. Add user_id to bakeries (nullable first, backfill, then enforce)
    with op.batch_alter_table("bakeries") as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer,
                                       sa.ForeignKey("users.id"), nullable=True))
    op.execute("UPDATE bakeries SET user_id = 1 WHERE user_id IS NULL")

    # 4. Add user_id to ratings (same pattern)
    with op.batch_alter_table("ratings") as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer,
                                       sa.ForeignKey("users.id"), nullable=True))
    op.execute("UPDATE ratings SET user_id = 1 WHERE user_id IS NULL")

def downgrade():
    with op.batch_alter_table("ratings") as batch_op:
        batch_op.drop_column("user_id")
    with op.batch_alter_table("bakeries") as batch_op:
        batch_op.drop_column("user_id")
    op.drop_table("users")
```

### Pattern 3: FastAPI JWT Auth — Access Token + Refresh Cookie

**What:** On login, issue a short-lived JWT access token (returned in JSON) and a long-lived refresh token (set as an HttpOnly cookie). Frontend stores access token in React Context. On page reload, frontend calls `/auth/refresh` — the browser sends the cookie automatically and receives a new access token.

**When to use:** Any app where you want persistent sessions without storing tokens in localStorage.

**Backend auth.py utilities:**
```python
# Source: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
import jwt
from datetime import datetime, timedelta, timezone
from pwdlib import PasswordHash

SECRET_KEY = os.getenv("SECRET_KEY")  # min 32 chars random string
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 30

pwd_hash = PasswordHash.recommended()  # uses Argon2 by default with pwdlib[argon2]

def hash_password(password: str) -> str:
    return pwd_hash.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_hash.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
```

**Backend dependencies.py:**
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.auth import decode_token
from app.database import get_db
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = decode_token(token)
        user_id: int = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
```

**Applying auth to all existing routers:**
```python
# main.py — protect ALL routes in a router with one line
app.include_router(bakeries.router, dependencies=[Depends(get_current_user)])
app.include_router(ratings.router, dependencies=[Depends(get_current_user)])
# auth router is NOT in the protected list — login/register/refresh are public
app.include_router(auth_router)
```

### Pattern 4: AuthContext on the Frontend

**What:** React Context holds the access token in memory and exposes `login()`, `logout()`, and `currentUser`. On app mount, calls `/auth/refresh` silently to restore a session from the existing HttpOnly cookie.

```javascript
// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page load via HttpOnly refresh cookie
  useEffect(() => {
    fetch(`${API}/auth/refresh`, { method: "POST", credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setAccessToken(data.access_token);
          setCurrentUser(data.user);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",  // receive HttpOnly cookie
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const data = await res.json();
    setAccessToken(data.access_token);
    setCurrentUser(data.user);
  }

  async function logout() {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    setAccessToken(null);
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ accessToken, currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**api.js update — inject token from context:**
```javascript
// The api.js functions need to accept the token and pass it as Bearer
// Pattern: callers get token from useAuth() and pass it in

export async function fetchBakeries(token) {
  const res = await fetch(`${API}/bakeries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch bakeries");
  return res.json();
}
// Apply same pattern to all api.js functions
```

### Anti-Patterns to Avoid

- **Storing JWT in localStorage:** Any XSS vulnerability can steal it. Use React state (AuthContext) for the access token.
- **Adding `user_id NOT NULL` in one step to a populated table:** SQLite cannot add a non-null column without a default. Always: add nullable, backfill, then optionally tighten.
- **Using `Base.metadata.create_all()` as migration:** It silently does nothing for existing tables. Once Alembic is set up, `create_all()` in `lifespan` should be removed or moved to test setup only.
- **Protecting routes individually instead of at router-include level:** Forgetting one endpoint leaves it public. Apply `dependencies=[Depends(get_current_user)]` at the `app.include_router()` call.
- **Omitting `credentials: "include"` on frontend fetch calls:** Without this, the browser will not send the HttpOnly refresh cookie. Required for the refresh pattern to work.
- **Hardcoding CORS origins:** The existing `main.py` hardcodes `localhost:5173`. Move this to `.env` as `CORS_ORIGINS` — production deployments require a different origin.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt/SHA256 wrapper | pwdlib[argon2] | Argon2 requires careful tuning; hand-rolled hashing misses memory hardness parameters and timing-safe comparisons |
| JWT encode/decode | Manual HMAC + base64 | PyJWT | JWT has subtle spec requirements (exp claim timezone handling, algorithm confusion attacks); PyJWT handles these correctly |
| Schema migrations | Manual `ALTER TABLE` SQL scripts | Alembic | SQLite's `ALTER TABLE` is severely limited; Alembic's batch mode handles the table-recreate dance automatically |
| Token expiry checking | Manual datetime comparison | PyJWT's `decode()` | PyJWT raises `ExpiredSignatureError` automatically; manual checking is error-prone |

**Key insight:** Auth crypto and database migrations both have edge cases that kill apps in production. Using battle-tested libraries for both is non-negotiable even at a 10-user scale.

---

## Common Pitfalls

### Pitfall 1: Alembic Stamp Order Wrong

**What goes wrong:** Running `alembic revision --autogenerate` before `alembic stamp head` generates a migration that tries to create tables that already exist. The migration fails with `table "bakeries" already exists`.

**Why it happens:** Alembic doesn't know the current state of the DB unless you tell it. `stamp head` marks the existing schema as the baseline without running any SQL.

**How to avoid:** The exact setup sequence is:
1. `alembic init alembic` — creates the alembic directory
2. Edit `alembic.ini` and `env.py` (add `render_as_batch=True`)
3. `alembic stamp head` — tell Alembic the existing schema is current
4. Add `User` model to `models.py`
5. `alembic revision --autogenerate -m "add_user_auth"` — generates diff
6. Review the generated migration file before running it
7. `alembic upgrade head` — applies the migration

**Warning signs:** `OperationalError: table "bakeries" already exists` means stamp was missed.

### Pitfall 2: `render_as_batch=True` Missing from env.py

**What goes wrong:** Alembic generates a migration with `ALTER TABLE ADD COLUMN` for the `user_id` column. SQLite doesn't support adding FK columns this way. `alembic upgrade head` fails with `OperationalError`.

**Why it happens:** Alembic's default `env.py` doesn't include `render_as_batch` — it must be added manually to both the `run_migrations_offline` and `run_migrations_online` functions.

**How to avoid:** After `alembic init`, immediately open `alembic/env.py` and add `render_as_batch=True` to both context.configure calls. This must happen before generating any migration that touches existing tables.

**Warning signs:** `OperationalError: Cannot add a NOT NULL column with default value NULL` or any SQLite `ALTER TABLE` error in migration output.

### Pitfall 3: Refresh Token Cookie Not Sent Cross-Origin

**What goes wrong:** The frontend calls `/auth/refresh` on mount, but the browser never sends the HttpOnly cookie. Session restoration silently fails. Users must log in on every page reload.

**Why it happens:** Two separate issues must both be correct:
- Backend: `allow_credentials=True` in `CORSMiddleware`
- Frontend: `credentials: "include"` in every `fetch()` call that expects cookies

**How to avoid:** The current `main.py` already has `allow_credentials=True` in CORS config. The frontend must add `credentials: "include"` to the refresh call and the login call (to receive the cookie). This is easy to miss since `fetch` defaults to not sending credentials.

**Warning signs:** Refresh endpoint returns 200 but no cookie visible in browser DevTools → Network → Set-Cookie header. Or 401 on `/auth/refresh` because cookie was not sent.

### Pitfall 4: Existing `create_all()` in lifespan Conflicts with Alembic

**What goes wrong:** The current `lifespan` function in `main.py` calls `Base.metadata.create_all(bind=engine)`. Once Alembic is managing migrations, this call is redundant in production and confusing in development. More dangerously, in tests with in-memory SQLite, if `create_all()` and Alembic migrations both run, table definitions can diverge.

**How to avoid:** After Alembic is set up, remove `create_all()` from `lifespan`. In test fixtures, use `Base.metadata.create_all(bind=test_engine)` explicitly (in-memory DB for each test run — Alembic history not relevant for tests).

### Pitfall 5: CORS Origins Not Updated for Production

**What goes wrong:** The existing `main.py` hardcodes `allow_origins=["http://localhost:5173", "http://localhost:5174"]`. When the app is deployed to a real domain, CORS blocks all requests. This is a deploy-day surprise.

**How to avoid:** Move to `.env` in this phase: `CORS_ORIGINS=http://localhost:5173,http://localhost:5174`. Read in `main.py` with `os.getenv("CORS_ORIGINS", "").split(",")`. This is a small change that prevents a big headache later.

---

## Code Examples

### Backend: auth router endpoints

```python
# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserOut, Token
from app import auth

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=data.username,
        hashed_password=auth.hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(data: UserCreate, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not auth.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = auth.create_access_token({"sub": str(user.id)})
    refresh_token = auth.create_refresh_token({"sub": str(user.id)})
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, samesite="lax", secure=False,  # set secure=True in production
        max_age=60 * 60 * 24 * 30,  # 30 days
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user.id, "username": user.username}}

@router.post("/refresh", response_model=Token)
def refresh(response: Response, refresh_token: str = Cookie(default=None), db: Session = Depends(get_db)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = auth.decode_token(refresh_token)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    new_access_token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": new_access_token, "token_type": "bearer", "user": {"id": user.id, "username": user.username}}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}
```

### Backend: conftest.py for tests (Wave 0 setup)

```python
# backend/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(bind=engine)
    session = TestSession()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        yield db
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

### Test: auth endpoint coverage

```python
# backend/tests/test_auth.py
def test_register_creates_user(client):
    res = client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    assert res.status_code == 201
    assert res.json()["username"] == "sam"

def test_login_returns_token(client):
    client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    res = client.post("/api/auth/login", json={"username": "sam", "password": "secret"})
    assert res.status_code == 200
    assert "access_token" in res.json()

def test_login_wrong_password_returns_401(client):
    client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    res = client.post("/api/auth/login", json={"username": "sam", "password": "wrong"})
    assert res.status_code == 401

def test_protected_endpoint_without_token_returns_401(client):
    res = client.get("/api/bakeries")
    assert res.status_code == 401

def test_protected_endpoint_with_token_succeeds(client):
    client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    login_res = client.post("/api/auth/login", json={"username": "sam", "password": "secret"})
    token = login_res.json()["access_token"]
    res = client.get("/api/bakeries", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| python-jose for JWT | PyJWT 2.x | 2024 (FastAPI PR #11589) | python-jose has CVEs and is unmaintained; all new FastAPI projects use PyJWT |
| passlib[bcrypt] for passwords | pwdlib[argon2] | 2024 (FastAPI docs update) | passlib breaks on Python 3.13+ due to bcrypt 5.0.0 incompatibility |
| `create_all()` for schema management | Alembic with batch mode | Any time real data exists | `create_all()` cannot alter existing tables; Alembic is the only safe migration path |
| JWT in localStorage | Access token in React Context + HttpOnly refresh cookie | Ongoing best practice | XSS can steal localStorage tokens; in-memory is safer |

**Deprecated/outdated:**
- `python-jose`: Do not install. FastAPI docs no longer reference it.
- `passlib`: Do not install. Broken on Python 3.13+, unmaintained.
- `Base.metadata.create_all()` as migration strategy: Remove from lifespan after Alembic is set up.

---

## Open Questions

1. **Single group vs. future multi-group**
   - What we know: STATE.md notes "single group assumed — if multi-group support wanted, data model changes significantly before Phase 1"
   - What's unclear: Whether the initial `User` model needs a `group_id` FK, or whether group membership is deferred to a separate join table
   - Recommendation: For Phase 1, add a `Group` model and a `GroupMembership` join table as stubs (no invite-link flow yet). This avoids a data model migration in a later phase when groups become active. The auth layer itself doesn't require groups to function.

2. **`secure=True` on refresh cookie**
   - What we know: `secure=True` on a cookie means it only sends over HTTPS. In local dev, this breaks the cookie.
   - What's unclear: Whether the dev environment uses HTTPS
   - Recommendation: Use `secure=False` in development (controlled by `DEBUG` env var). Add a note in `.env.example` to flip this for production.

3. **Test database isolation with Alembic**
   - What we know: Alembic migrations should not run against the in-memory test DB — `create_all()` is the right approach for tests since the schema is always rebuilt fresh.
   - What's unclear: Whether any future migration uses raw SQL that `create_all()` wouldn't replicate (e.g., the sentinel user insert)
   - Recommendation: Test fixtures use `Base.metadata.create_all()` for schema + explicit data setup in `conftest.py`. The sentinel user is production data, not test data.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest (latest) + pytest-asyncio (latest) |
| Config file | `backend/pytest.ini` — does not exist yet, Wave 0 creates it |
| Quick run command | `cd backend && source venv/bin/activate && pytest tests/test_auth.py -x -q` |
| Full suite command | `cd backend && source venv/bin/activate && pytest -q` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | POST /auth/register creates user with hashed password | unit | `pytest tests/test_auth.py::test_register_creates_user -x` | Wave 0 |
| AUTH-01 | Duplicate username returns 400 | unit | `pytest tests/test_auth.py::test_register_duplicate_username -x` | Wave 0 |
| AUTH-02 | POST /auth/login returns access token + sets cookie | unit | `pytest tests/test_auth.py::test_login_returns_token -x` | Wave 0 |
| AUTH-02 | POST /auth/refresh with valid cookie returns new token | unit | `pytest tests/test_auth.py::test_refresh_token -x` | Wave 0 |
| AUTH-02 | Protected endpoint without token returns 401 | unit | `pytest tests/test_auth.py::test_protected_endpoint_without_token_returns_401 -x` | Wave 0 |
| AUTH-03 | POST /auth/logout clears cookie | unit | `pytest tests/test_auth.py::test_logout_clears_cookie -x` | Wave 0 |
| AUTH-03 | After logout, refresh returns 401 | unit | `pytest tests/test_auth.py::test_after_logout_refresh_returns_401 -x` | Wave 0 |
| (all) | Existing bakeries/ratings accessible with valid token | integration | `pytest tests/test_auth.py::test_protected_endpoint_with_token_succeeds -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `cd backend && source venv/bin/activate && pytest tests/test_auth.py -x -q`
- **Per wave merge:** `cd backend && source venv/bin/activate && pytest -q`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `backend/tests/conftest.py` — in-memory SQLite test DB and TestClient fixture
- [ ] `backend/tests/test_auth.py` — all AUTH-01/02/03 test cases
- [ ] `backend/pytest.ini` — minimal config (`testpaths = tests`, `asyncio_mode = auto`)
- [ ] Framework install: `pip install pytest pytest-asyncio` and update `requirements.txt`

---

## Existing Codebase — What Stays, What Changes

This is an additive phase on a working app. Document exactly what changes to avoid breaking existing functionality.

### Leave Untouched

| File | Why |
|------|-----|
| `backend/app/models/models.py` — `Bakery`, `Rating` classes structure | Only adding `user_id` column via migration — don't change relationships |
| `backend/app/routers/bakeries.py` — geocoding logic | Works correctly; N+1 query fix is deferred to a later phase |
| `backend/app/schemas/schemas.py` — `BakeryCreate`, `RatingCreate`, `BakeryOut`, `RatingOut` | These schemas are correct; only adding new auth schemas |
| Frontend component files (except `App.jsx`, `api.js`) | Components work; only login gate and token injection change |
| `croissant.db` | The file is left on disk; Alembic migrates it in-place |

### Changed in This Phase

| File | What Changes |
|------|-------------|
| `backend/app/main.py` | Remove `create_all()` from lifespan after Alembic setup; move CORS origins to `.env`; register auth router |
| `backend/app/database.py` | Read `DATABASE_URL` from `.env` instead of hardcoding |
| `backend/app/routers/bakeries.py` | Auth is applied at router-include level in `main.py` — this file itself gets no change for auth |
| `backend/app/routers/ratings.py` | Capture `current_user.id` and set `user_id` on new ratings |
| `frontend/src/api.js` | All functions accept a `token` param and send `Authorization: Bearer` header |
| `frontend/src/App.jsx` | Wrap with `<AuthProvider>`, show `<LoginForm>` when no token |

---

## Sources

### Primary (HIGH confidence)

- https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/ — Official FastAPI JWT auth docs (confirmed March 2026, uses PyJWT)
- https://github.com/fastapi/fastapi/pull/11589 — FastAPI PR switching docs from python-jose to PyJWT
- https://alembic.sqlalchemy.org/en/latest/batch.html — Alembic batch migrations for SQLite (`render_as_batch=True`)
- https://pypi.org/project/PyJWT/ — PyJWT 2.11.0 (released January 30, 2026)
- https://pypi.org/project/pwdlib/ — pwdlib 0.3.0 with Argon2 support (released October 25, 2025)
- Direct codebase inspection — models.py, routers, schemas, main.py, package.json (confirmed March 2026)

### Secondary (MEDIUM confidence)

- https://github.com/fastapi/fastapi/discussions/11773 — FastAPI community confirmation of passlib deprecation, pwdlib recommendation
- https://alembic.sqlalchemy.org/en/latest/tutorial.html — Alembic setup tutorial (stamp head pattern)
- https://kyrylo.org/software/2025/09/27/a-mere-add-foreign-key-can-wipe-out-your-whole-rails-sqlite-production-table.html — SQLite FK cascade delete post-mortem (2025) confirming batch-mode necessity

### Tertiary (LOW confidence)

- Sentinel user backfill pattern — common practice, verified via multiple Stack Overflow answers, no single canonical source

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — PyJWT and pwdlib versions verified against PyPI; Alembic batch mode verified against official docs; all libraries confirmed current as of March 2026
- Architecture: HIGH — FastAPI dependency injection pattern is official docs; JWT + HttpOnly cookie pattern is well-established; sentinel user backfill is a known pattern
- Pitfalls: HIGH — drawn directly from codebase inspection (no Alembic, no auth, hardcoded CORS) plus verified SQLite migration docs

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (stable stack — PyJWT and Alembic are not rapidly changing)
