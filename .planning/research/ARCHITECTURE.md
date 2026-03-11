# Architecture Research

**Domain:** Niche social food rating web app (croissant ratings for friends & family)
**Researched:** 2026-03-11
**Confidence:** HIGH — patterns are well-established for FastAPI + SQLAlchemy + React; invite-link group pattern is MEDIUM (standard implementation, little direct prior art to cite)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        React SPA (Frontend)                       │
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  AuthCtx  │  │ MapView  │  │ Bakery   │  │ RatingForm       │  │
│  │ (token,   │  │ (Leaflet)│  │ Detail   │  │ (cat. sliders +  │  │
│  │  user)    │  │          │  │ Page     │  │  photo upload)   │  │
│  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│        │             │             │                   │            │
│  ┌─────▼─────────────▼─────────────▼───────────────────▼────────┐ │
│  │                     api.js (axios/fetch client)               │ │
│  │            Authorization: Bearer <access_token>               │ │
│  └───────────────────────────────┬───────────────────────────────┘ │
└──────────────────────────────────┼───────────────────────────────┘
                                   │ HTTP/REST
┌──────────────────────────────────┼───────────────────────────────┐
│                        FastAPI Backend                             │
│                                                                    │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────┐   │
│  │  /auth    │  │ /bakeries │  │ /ratings │  │  /uploads     │   │
│  │  router   │  │  router   │  │  router  │  │  router       │   │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └───────┬───────┘   │
│        │              │              │                 │            │
│  ┌─────▼──────────────▼──────────────▼─────────────────▼────────┐ │
│  │              get_current_user() dependency (JWT verify)       │ │
│  └───────────────────────────────┬───────────────────────────────┘ │
│                                  │                                  │
│  ┌───────────────────────────────▼───────────────────────────────┐ │
│  │              SQLAlchemy ORM + SQLite (models.py)               │ │
│  │   User · Group · GroupMembership · Bakery · Rating ·           │ │
│  │   CategoryScore · Photo                                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │               /uploads/ static directory                   │    │
│  │               (served by FastAPI StaticFiles)              │    │
│  └────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| AuthContext (FE) | Hold access token in memory, expose current user, drive login/logout state | api.js (injects token), all pages that need user identity |
| MapView (FE) | Leaflet map rendering, bakery pin markers, popup previews | App state / bakery data, Bakery Detail page |
| BakeryDetail (FE) | Display all group ratings for one bakery, show photos, trigger RatingForm | api.js (fetch ratings + photos) |
| RatingForm (FE) | Category sliders, notes, optional photo file picker, submit | api.js (POST rating + multipart upload) |
| api.js (FE) | Single module for all HTTP calls; attaches Bearer token from AuthContext | FastAPI backend routers |
| /auth router (BE) | Register, login (issue JWT), refresh, invite-link group join | User model, Group model |
| /bakeries router (BE) | CRUD for bakeries; scoped to group | Bakery model, get_current_user dep |
| /ratings router (BE) | Create/list ratings with category scores; scoped to group | Rating, CategoryScore models, get_current_user dep |
| /uploads router (BE) | Accept multipart photo upload, save to disk, record Photo row | Photo model, filesystem |
| get_current_user() dep (BE) | Decode JWT, load User from DB, enforce auth on all protected routes | User model, JWT secret |
| SQLAlchemy models (BE) | Data persistence — all entities and relationships | SQLite via database.py |

## Recommended Project Structure

### Backend additions

```
backend/app/
├── main.py                    # add StaticFiles mount for /uploads
├── database.py                # unchanged
├── auth.py                    # NEW: JWT encode/decode, password hashing utils
├── dependencies.py            # NEW: get_current_user() dependency
├── models/
│   └── models.py              # ADD: User, Group, GroupMembership, CategoryScore, Photo
├── schemas/
│   └── schemas.py             # ADD: UserOut, Token, GroupOut, CategoryScoreCreate, PhotoOut
├── routers/
│   ├── auth.py                # NEW: /auth/register, /auth/login, /auth/join/{token}
│   ├── bakeries.py            # UPDATE: add current_user dep to all write endpoints
│   ├── ratings.py             # UPDATE: add user_id to Rating, add CategoryScore creation
│   └── uploads.py             # NEW: /uploads/ POST endpoint
└── uploads/                   # NEW: directory on disk for photo files
```

### Frontend additions

```
frontend/src/
├── main.jsx                   # unchanged
├── App.jsx                    # UPDATE: wrap with AuthProvider, add login gate
├── api.js                     # UPDATE: inject Authorization header from context
├── context/
│   └── AuthContext.jsx        # NEW: access token in memory, user info, login/logout
├── components/
│   ├── MapView.jsx            # UPDATE: richer pin popups, avg category scores
│   ├── BakeryCard.jsx         # UPDATE: show per-user rating vs group avg
│   ├── BakeryDetail.jsx       # NEW or UPDATE: full rating history with photos
│   ├── RatingForm.jsx         # UPDATE: category sliders, photo upload field
│   ├── LoginForm.jsx          # NEW
│   ├── JoinGroupPage.jsx      # NEW: consume invite link token
│   └── CategoryScores.jsx     # NEW: reusable category display component
└── pages/                     # (optional) page-level components if routing added
```

### Structure Rationale

- **auth.py (BE):** Keeps JWT mechanics isolated — password hashing and token creation have no business being in a router file.
- **dependencies.py (BE):** `get_current_user()` is used across every protected router; a dedicated file avoids circular imports.
- **context/AuthContext.jsx (FE):** Token lives in React state (in-memory), not localStorage. This is the current security best practice: in-memory prevents XSS token theft, refresh-token-in-httpOnly-cookie handles page reloads.
- **uploads/ directory (BE):** Static files on disk served by FastAPI `StaticFiles`. Correct for a small private app — no S3 complexity needed for 10-20 users.

## Architectural Patterns

### Pattern 1: JWT in React Memory + HttpOnly Refresh Cookie

**What:** Access token stored in React Context (JavaScript memory), short TTL (15 min). Refresh token stored in HttpOnly cookie, longer TTL (7 days). On page load, frontend calls `/auth/refresh` — browser sends cookie automatically, server issues new access token.

**When to use:** Any app where you want to avoid XSS token theft without adding full session infrastructure. Correct for this app.

**Trade-offs:** Slightly more backend code (refresh endpoint). On page refresh, there's a brief moment before the token is re-issued — show a loading spinner. Worth it for a private family app where trust is high but you still want real auth.

**Example:**
```javascript
// AuthContext.jsx
const [accessToken, setAccessToken] = useState(null);

async function refreshToken() {
  const res = await fetch('/api/auth/refresh', { credentials: 'include' });
  if (res.ok) {
    const { access_token } = await res.json();
    setAccessToken(access_token);
  }
}

// On app mount, try to restore session silently
useEffect(() => { refreshToken(); }, []);
```

### Pattern 2: Category Scores as a Separate Table (Not JSON Column)

**What:** `CategoryScore` is its own table with `(rating_id, category_name, score)` rows rather than a JSON blob on `Rating`.

**When to use:** When you want to query or average individual categories — e.g., "show avg flakiness for this bakery across all visits." JSON blobs make that query hard.

**Trade-offs:** Slightly more inserts per rating (one row per category). Trivially fine for 10-20 users.

**Example:**
```python
class CategoryScore(Base):
    __tablename__ = "category_scores"
    id = Column(Integer, primary_key=True)
    rating_id = Column(Integer, ForeignKey("ratings.id"), nullable=False)
    category = Column(String, nullable=False)   # "flakiness", "butteriness", etc.
    score = Column(Integer, nullable=False)     # 1-5
    rating = relationship("Rating", back_populates="category_scores")
```

### Pattern 3: Invite-Link Group Join

**What:** A `Group` has an `invite_token` (random UUID, stored in DB). Owner shares the URL `https://app/join/{invite_token}`. Anyone who visits that URL and has an account gets added to the group via a `GroupMembership` row.

**When to use:** Small private groups where you don't want open registration or email invite flows.

**Trade-offs:** Invite tokens don't expire unless you add expiry logic. For a family app this is a feature, not a bug — the link stays valid. If the token gets leaked, regenerate it.

**Example:**
```python
class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    invite_token = Column(String, unique=True, default=lambda: str(uuid.uuid4()))
    created_by = Column(Integer, ForeignKey("users.id"))

class GroupMembership(Base):
    __tablename__ = "group_memberships"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
```

### Pattern 4: Photo Upload via Multipart + StaticFiles

**What:** Frontend sends `multipart/form-data` POST with the photo file. Backend saves it to `backend/app/uploads/{uuid}_{filename}`, stores the relative path in a `Photo` table row linked to the rating. The `uploads/` directory is mounted as a static file server in `main.py`.

**When to use:** Small private apps with modest storage needs. No S3 needed.

**Trade-offs:** Photos live on the server filesystem — fine for a home server or cheap VPS, breaks on stateless cloud containers. Not a concern for a family croissant app.

**Example:**
```python
# main.py
app.mount("/uploads", StaticFiles(directory="app/uploads"), name="uploads")

# uploads router
@router.post("/ratings/{rating_id}/photo")
async def upload_photo(rating_id: int, file: UploadFile, ...):
    filename = f"{uuid.uuid4()}_{file.filename}"
    path = UPLOAD_DIR / filename
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    # save Photo row with url = f"/uploads/{filename}"
```

## Data Flow

### Authentication Flow

```
[Login form submit]
    ↓
api.js POST /auth/login {username, password}
    ↓
auth router: verify password hash → issue JWT access token (15m) + set HttpOnly refresh cookie (7d)
    ↓
api.js receives {access_token} → AuthContext.setAccessToken(token)
    ↓
All subsequent requests: Authorization: Bearer <access_token>
```

### Rating with Category Scores Flow

```
[User submits RatingForm]
    ↓
api.js POST /ratings {bakery_id, notes, visited_at, categories: {flakiness: 4, butteriness: 5, ...}}
    ↓
ratings router:
  1. Create Rating row (user_id from current_user, bakery_id)
  2. For each category key → insert CategoryScore row
  3. If photo attached: upload to /uploads/, insert Photo row
    ↓
api.js receives RatingOut with category_scores embedded
    ↓
BakeryDetail re-fetches bakery → map pin color/icon updates
```

### Group-Scoped Bakery Fetch

```
[App mounts / user navigates to map]
    ↓
api.js GET /bakeries (with Bearer token)
    ↓
bakeries router: get_current_user() → loads user's GroupMembership → filter bakeries to group
    ↓
Returns list of BakeryOut with avg_score per category
    ↓
MapView renders pins; BakeryList renders cards
```

### State Management

```
AuthContext (React Context)
    ↓ provides: { accessToken, currentUser, login(), logout() }
    ↓
App.jsx reads AuthContext
  ↓ if no token: render <LoginForm />
  ↓ if token: render full app

Per-page local state (useState) for bakeries, ratings, loading flags
No Redux/Zustand needed for a 10-20 user app — React Context covers auth;
everything else is server state fetched on demand.
```

## Build Order (Phase Dependencies)

These features have hard dependencies. Build in this sequence:

```
1. User & Auth layer
   ├── User model + password hashing (auth.py)
   ├── JWT issue/verify (auth.py)
   ├── /auth/register + /auth/login endpoints
   ├── get_current_user() dependency
   └── LoginForm + AuthContext on frontend
        ↓ (auth required for all below)

2. Group & Invite system
   ├── Group + GroupMembership models
   ├── /auth/join/{token} endpoint
   ├── JoinGroupPage on frontend
   └── Bakery/Rating endpoints scoped to group membership
        ↓ (group context required for ratings to be social)

3. Category ratings
   ├── CategoryScore model + migration
   ├── Rating model updated (add user_id FK)
   ├── Updated RatingCreate schema with categories dict
   ├── RatingForm updated with category sliders
   └── CategoryScores display component
        ↓ (ratings must work before photos attach to them)

4. Photo uploads
   ├── Photo model + uploads/ directory
   ├── /uploads router + StaticFiles mount
   └── Photo picker in RatingForm, display in BakeryDetail

5. Map polish
   └── Depends on all above (pins need user data, category scores, photos)
       Build last when data model is stable
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Nominatim (OSM) | Already working — async HTTP in bakeries router | No changes needed |
| Leaflet / React Leaflet | Already working — update pin popup to show category averages | No changes needed to map library |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| AuthContext (FE) ↔ api.js (FE) | Direct import — api.js reads token from context or caller passes it | Use a hook `useApi()` or just pass token in api.js config on login |
| ratings router (BE) ↔ uploads router (BE) | Independent — photo upload is a separate POST to `/ratings/{id}/photo` after rating is created | Keeps multipart upload isolated from JSON rating creation |
| Group scope enforcement | `get_current_user()` returns user with group_id; routers filter all queries by `bakery.group_id == user.group_id` | Single group per user is the simplest model for this app |

## Anti-Patterns

### Anti-Pattern 1: Storing JWT in localStorage

**What people do:** `localStorage.setItem('token', jwt)` in the login handler.

**Why it's wrong:** Any JavaScript on the page can read localStorage — XSS attacks steal the token trivially. For a family app this is low-risk in practice, but it's not the right habit.

**Do this instead:** Store access token in React state (AuthContext), refresh token in HttpOnly cookie. Add a `/auth/refresh` endpoint.

### Anti-Pattern 2: Storing Category Scores as a JSON String on Rating

**What people do:** Add `categories = Column(Text)` to Rating and JSON-encode the dict.

**Why it's wrong:** You can't query "average flakiness across all ratings for this bakery" in SQL without parsing JSON. The map pin color and bakery detail page both need those per-category averages.

**Do this instead:** Separate `CategoryScore` table. Simple JOIN to aggregate.

### Anti-Pattern 3: Protecting Routes Individually Rather Than via Dependency

**What people do:** Each router function manually decodes the JWT and checks the user.

**Why it's wrong:** Forget one endpoint and it's publicly writable. Error-prone at scale.

**Do this instead:** `get_current_user() = Depends(get_current_user)` in the router function signature. FastAPI enforces it automatically.

### Anti-Pattern 4: Migrating the Existing `Rating.score` Column Prematurely

**What people do:** Delete the existing `score` column immediately when adding category scores.

**Why it's wrong:** The existing DB has data in `score`. Dropping it without migration loses that history. Also, a composite average can still serve as the "overall" score for the map pin.

**Do this instead:** Keep `score` but make it computed server-side as the average of the category scores when a new rating is created. Migrate old ratings with `score` preserved as-is. Old data stays, new data gets category detail.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 10-20 users (target) | Current plan is correct — SQLite, local filesystem uploads, single process |
| 100+ users | Switch SQLite to Postgres, add connection pooling |
| 1000+ users | Move photos to S3, add CDN, consider async SQLAlchemy |

This app will never exceed ~20 users. SQLite is not a compromise — it is the right tool.

## Sources

- FastAPI official docs on SQL databases: https://fastapi.tiangolo.com/tutorial/sql-databases/
- FastAPI official docs on file uploads: https://fastapi.tiangolo.com/tutorial/request-files/
- JWT storage best practices (React): https://cybersierra.co/blog/react-jwt-storage-guide/
- FastAPI JWT auth with SQLAlchemy 2.0: https://www.buanacoding.com/2025/08/fastapi-jwt-auth-oauth2-password-flow-pydantic-v2-sqlalchemy-2.html
- FastAPI Users library (considered, not recommended — too heavy for small private app): https://fastapi-users.github.io/fastapi-users/10.1/configuration/full-example/

---
*Architecture research for: Croissant Club — FastAPI + React niche food rating app*
*Researched: 2026-03-11*
