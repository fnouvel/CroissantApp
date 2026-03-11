# Pitfalls Research

**Domain:** Niche food rating web app — multi-user, invite-based, category ratings, photo uploads, map discovery
**Researched:** 2026-03-11
**Confidence:** HIGH (pitfalls drawn from existing codebase analysis + verified sources)

---

## Critical Pitfalls

### Pitfall 1: Retrofitting User Ownership Onto Existing Data Without a Migration Plan

**What goes wrong:**
The current `Rating` and `Bakery` models have no `user_id` column. When auth is added, all existing rows become orphaned — they belong to no user. If `user_id` is added as `NOT NULL`, the migration crashes. If it's added as nullable, the app has an inconsistent data state it must handle forever. If old data is silently deleted, the app "resets" on the user unexpectedly.

**Why it happens:**
Developers add auth to an existing schema by just bolting on a `user_id` FK column without thinking through what happens to pre-existing rows. SQLite makes this worse: it cannot add a non-nullable FK column to a populated table without the full table-recreate dance (12-step SQLite procedure), and `CASCADE DELETE` on the `Bakery → Rating` relationship means any table recreate that touches bakeries can silently wipe all ratings.

**How to avoid:**
Before adding any user-related columns: run Alembic with `render_as_batch=True` (required for SQLite). Plan the null strategy — nullable `user_id` with a "legacy/anonymous" sentinel user is the safest path for preserving existing data. Never add `NOT NULL` FK columns to existing populated tables in a single step. Test migration on a copy of the real database file.

**Warning signs:**
- `user_id` column added directly in `models.py` without a migration file
- `create_all()` used as migration strategy (will silently do nothing if table exists)
- `alembic upgrade head` error about non-constant defaults
- Missing `alembic.ini` in the backend directory

**Phase to address:** Auth foundation phase (the very first new phase — must be solved before any other feature)

---

### Pitfall 2: Auth Tacked On After Routes Are Wired — Unprotected Endpoints Persist

**What goes wrong:**
When auth is added to a working app, developers protect the "obvious" write endpoints but leave read endpoints public "for now." The `/api/bakeries` list endpoint — which will soon contain user ratings, photos, and visit history — stays public indefinitely. In an invite-only friends & family app, this means anyone who discovers the URL can read all group data.

**Why it happens:**
FastAPI's `Depends()` pattern is per-route. Adding auth to new routes while old routes remain unprotected is the path of least resistance. There's no compile-time enforcement; unprotected routes just work.

**How to avoid:**
Add a global auth dependency at the router or app level first, then selectively whitelist public endpoints (health check, invite acceptance). A single `app.include_router(router, dependencies=[Depends(get_current_user)])` pattern covers all routes in that router. Write the auth middleware before implementing any other feature.

**Warning signs:**
- Some routes have `current_user: User = Depends(get_current_user)` and others don't
- `/api/bakeries` returns data without requiring a token
- Auth added "phase by phase" — ratings protected, bakeries not yet

**Phase to address:** Auth foundation phase — protect all routes before exposing any new data

---

### Pitfall 3: SQLite's Hidden ALTER TABLE Limitation Breaks Schema Changes Mid-Build

**What goes wrong:**
SQLite does not support `ALTER TABLE ... ADD COLUMN` for columns with foreign keys, and cannot drop or rename columns at all without recreating the table. If Alembic is not configured for batch mode, `alembic upgrade head` fails with `OperationalError: Cannot add a NOT NULL column with default value NULL`. Mid-build schema changes (adding `user_id`, `photo_url`, category score columns) all hit this wall.

**Why it happens:**
The existing project has no Alembic setup. SQLAlchemy's `Base.metadata.create_all()` was used to create the initial schema — this approach cannot migrate existing tables, only create missing ones. Developers assume `create_all()` will pick up model changes; it will not.

**How to avoid:**
Install Alembic before touching the schema. Configure `sqlalchemy.url` for SQLite and set `render_as_batch = True` in `env.py`. The first migration should stamp the current schema as the baseline (`alembic stamp head`), then all subsequent changes go through proper migration files. Never rely on `create_all()` for schema evolution.

**Warning signs:**
- No `alembic/` directory in `backend/`
- `Base.metadata.create_all(bind=engine)` is the only schema management
- `OperationalError: table "bakeries" already exists` in logs
- New model columns not appearing in the database after app restart

**Phase to address:** Auth foundation phase — Alembic must be set up as the very first engineering task

---

### Pitfall 4: Category Ratings Modeled as Columns Instead of Rows — Inflexible Schema

**What goes wrong:**
The intuitive approach is to add `flakiness`, `butteriness`, `freshness`, `size` as columns on the `Rating` table. This works initially, but when the group decides they want to add "crunchiness" or remove a category, it requires a database migration. Querying "average flakiness across all bakeries" becomes manageable but querying "top 3 bakeries by their weakest category" is awkward. Most importantly, it bakes in the exact category list at schema creation time.

**Why it happens:**
Relational thinking leads naturally to columns. It's also simpler to implement and serialize to JSON. Developers don't anticipate needing to change the category list.

**How to avoid:**
Model categories as a separate `RatingCategory` table with rows: `(rating_id, category_name, score)`. The category list is then data, not schema. Changing categories is a data operation, not a migration. For this specific app with a small fixed category list (~5 categories), a hybrid is acceptable: store a JSON blob `category_scores: {"flakiness": 4, "butteriness": 5}` in a `Text` column. This avoids the migration problem entirely for a small trusted group. Choose one approach and commit before implementation.

**Warning signs:**
- Individual columns like `score_flakiness INTEGER`, `score_butteriness INTEGER` in the Rating model
- Any PR that adds a new category by adding a column
- Frontend hardcoding category names that match column names

**Phase to address:** Ratings redesign phase — data model decision must be made before writing any rating endpoint

---

### Pitfall 5: Image Storage in the File System Alongside the App — Lost on Redeploy

**What goes wrong:**
Photos uploaded by users get saved to `backend/uploads/` on the server's local disk. When the app is redeployed, that directory is wiped. SQLite itself is also file-based; if the database is stored inside the project directory and the deploy process does a `git pull` + restart, both the database and all photos can be lost simultaneously.

**Why it happens:**
Local file storage is the obvious first step. FastAPI's `UploadFile` example in the official docs writes to disk. The problem only manifests at the moment of first real deployment or VPS wipe.

**How to avoid:**
For a simple friends & family app, the pragmatic fix is: store the SQLite database at an absolute path outside the project directory (e.g., `/var/data/croissant.db` on a VPS, or a mounted volume), and do the same for uploads (`/var/data/uploads/`). Document these paths in `.env`. A more robust approach is to use an S3-compatible bucket (Cloudflare R2 has a free tier) to store images — the API saves the object key, not the file path. Plan the storage strategy before writing any upload code.

**Warning signs:**
- `UPLOAD_DIR = "uploads/"` — a relative path
- Database URL is `sqlite:///./app.db` — relative to project root
- No `.env` entry for `DATABASE_URL` or `UPLOAD_DIR`
- No backup/restore documentation

**Phase to address:** Photo upload phase — storage decision must precede implementation

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `Base.metadata.create_all()` as schema management | Zero setup | Cannot migrate existing data; schema drift is silent | Never once the database has real data |
| Storing photos in local `uploads/` dir | 10-minute implementation | Photos lost on redeploy; no CDN; no resize/optimize | Only for local dev — must be resolved before production |
| Hardcoded CORS origins in `main.py` | Works immediately | Every environment change requires a code change | Never — move to `.env` in the auth phase |
| `except Exception: pass` for geocoding errors | Bakery creation never fails | Silent bad data (no coordinates); impossible to debug | Never — log and surface errors |
| Nullable `user_id` on all rows with no sentinel user | Migration doesn't crash | App must handle `user_id = None` everywhere forever | Only as a transitional state, resolved within the same phase |
| One `score` integer per rating | Simple model | Cannot capture "great croissant, wrong size" — loses the category data that is the app's core value | Never for this app's purpose |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Nominatim geocoding | Calling Nominatim directly from the browser; no rate limiting | Proxy all geocoding through the FastAPI backend; cache results by address string |
| Nominatim geocoding | User-Agent `FloreCroissant/1.0` can be used to rate-limit the app specifically | Use a generic agent or add your email per Nominatim's usage policy |
| FastAPI `UploadFile` | Using `file.read()` synchronously in an async endpoint — blocks the event loop | Use `await file.read()` and `aiofiles` for all disk I/O |
| FastAPI `UploadFile` | Trusting the client's `Content-Type` header for file type validation | Read the first 8 bytes (magic numbers) to verify it's actually an image |
| JWT tokens | No expiry (`exp` claim omitted) — tokens are valid forever | Always set `exp`; use short-lived access tokens (15-60 min) |
| JWT tokens | Storing JWT in `localStorage` — vulnerable to XSS | Use `httpOnly` cookies, or at minimum `sessionStorage` with strict CSP |
| Invite links | Invite token never expires — anyone with an old link can join | Set expiry (e.g., 7 days); mark token as used after first acceptance; store in DB |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 query in `list_bakeries()` — one query per bakery for avg rating | Slow page loads; already identified in CONCERNS.md | Replace with single `func.avg()` + `group_by` SQLAlchemy query | Already marginal; visibly slow at 50+ bakeries |
| Serving uploaded photos directly from FastAPI (no CDN) | High memory/CPU on the API server during photo loads | Use a static file server (Nginx) or object storage (S3/R2) for serving photos | First time multiple users load a photo-heavy bakery page simultaneously |
| React Leaflet re-rendering all markers on every state change | Map flickers on any app-level state update | Memoize bakery list with `useMemo`; wrap marker components in `React.memo` | Immediately noticeable with 20+ markers |
| Loading all ratings for all bakeries on the list page | Slow initial load; large payload | Return only aggregate scores (average per category) on list; load full ratings only on bakery detail page | 10+ users each with 5+ ratings each |
| No database indexes on `bakery_id` in ratings table | Slow bakery detail page loading | Add indexes on `Rating.bakery_id` and `Rating.user_id` | Visible at ~500 ratings total |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| No rate limiting on invite link acceptance | Attacker brute-forces invite tokens to gain group access | One-time-use tokens stored in DB; mark as `used=True` after acceptance; short expiry |
| Invite link shared publicly (e.g., posted on social media by a member) | Strangers join the private group | Add a simple admin approval step or a max-uses counter per link |
| Any authenticated user can delete any bakery | Malicious or accidental group data loss; existing CONCERNS.md notes cascade-delete wipes all ratings | Require the creating `user_id` to match, or add an `is_admin` flag for deletions |
| Photo filenames stored/served as-uploaded | Path traversal attacks (`../../../etc/passwd`); filename collisions | Generate a UUID filename on upload; never use user-supplied filenames on disk |
| Password stored with weak hashing (bcrypt default rounds too low) | Crackable in GPU attack if DB is leaked | Use `passlib[bcrypt]` with `rounds=12` minimum; do not use MD5/SHA1 |
| Rating spam — user rates same bakery 10 times in a row | Distorted average scores; noisy history | Enforce one-rating-per-user-per-bakery at the database level (unique constraint on `user_id + bakery_id + visited_at`), or one per day |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Category rating form with 5 separate sliders or number inputs | Tedious on mobile; users skip ratings entirely | Use a compact star-row per category (5 stars × 5 categories = one screenful); make categories optional |
| Photo upload blocks form submission — user waits for upload before saving rating | Mobile connections are slow; users abandon the form | Upload photo async in background after form submits; show a spinner thumbnail that resolves to the real photo |
| Map resets viewport to Boston on every page load | Users navigating away and back lose their map position | Persist map center + zoom in URL query params or `sessionStorage` |
| No feedback when geocoding fails silently | Bakery added without map pin; user confused why it's not on the map | Surface geocoding errors explicitly; provide a manual "drop pin" fallback on the map |
| Rating history shows all visits in raw chronological order | Hard to compare across bakeries | Group by bakery on the profile page; show most recent rating per bakery prominently |
| Invite link presented as a plain URL with no copy button | Link is long and ugly; users share it incorrectly | Show a "Copy link" button; consider a short code alternative |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Auth implementation:** Login works locally — verify JWT cookies are sent with cross-origin requests (CORS `allow_credentials=True` + frontend `fetch` with `credentials: 'include'`)
- [ ] **Invite link flow:** Link accepted in browser — verify token is marked used in DB and cannot be reused
- [ ] **Photo upload:** Photo appears in the UI — verify the file is actually persisted to the correct storage path and survives a server restart
- [ ] **Category ratings:** Form submits successfully — verify all 5 category scores are stored and retrieved correctly, not just the first one
- [ ] **Group membership:** User added to group — verify they can only see bakeries and ratings from their group, not a hypothetical future group's data
- [ ] **Delete bakery:** Bakery removed from UI — verify the cascade delete warning in CONCERNS.md is surfaced to the user before the action
- [ ] **Map markers:** Markers appear on map — verify bakeries without coordinates (geocoding failures) are handled gracefully, not crashing the marker render
- [ ] **Mobile responsive:** Layout looks correct on desktop — test on a real 375px-wide mobile viewport, especially the rating form and map interaction

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Schema migration destroyed existing data | HIGH | Restore from SQLite file backup (must have backup strategy); re-stamp Alembic; replay migrations |
| Photos lost after redeploy | MEDIUM | No recovery for lost files; switch to external storage immediately; add backup cron job |
| Invite tokens never expire — stranger joined group | LOW | Add `is_active` flag to user model; admin can set `is_active=False`; rotate invite tokens |
| Unprotected endpoints discovered externally | MEDIUM | Add auth dependency to all routers immediately; rotate any tokens/secrets; audit access logs |
| Category scores modeled as columns — need to add a new category | MEDIUM | SQLite batch migration to add column; update all API endpoints and UI; backfill nulls |
| N+1 query causing timeouts under real usage | LOW | Drop-in fix: add `func.avg()` subquery; no data changes required |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Retrofitting user ownership onto existing data | Phase 1: Auth & DB foundation | Alembic migration runs cleanly on a copy of the real DB; existing bakeries have a valid `user_id` |
| Unprotected endpoints after partial auth rollout | Phase 1: Auth & DB foundation | All routes return 401 without a valid token; test with curl |
| SQLite ALTER TABLE limitation / no Alembic | Phase 1: Auth & DB foundation | `alembic upgrade head` runs on a blank DB and on the existing DB without error |
| Category ratings as columns | Phase 2: Ratings redesign | Schema uses a rows-or-JSON approach; adding a new category requires no migration |
| Image storage path lost on redeploy | Phase 3: Photo uploads | `.env` defines an absolute `UPLOAD_DIR`; restarting the server does not lose existing photos |
| React Leaflet marker re-renders | Phase 4: Map polish | Adding a new bakery does not flicker the entire map; existing markers hold position |
| Auth-related UX gaps (invite flow, copy link) | Phase 1: Auth & DB foundation | Invite link is one-time-use; test accepting the same link twice |
| Geocoding errors surface silently | Phase 1 or existing tech debt | Creating a bakery with a bad address shows an explicit error, not a silent success |

---

## Sources

- Codebase analysis: `/Users/samuelclark/Desktop/florecroissant/CroissantApp/.planning/codebase/CONCERNS.md` (HIGH confidence — direct codebase inspection)
- SQLite ALTER TABLE limitations: [Alembic batch migrations](https://alembic.sqlalchemy.org/en/latest/batch.html) (HIGH confidence — official docs)
- SQLite FK + cascade delete during table recreation: [Kyrylo Silin post-mortem](https://kyrylo.org/software/2025/09/27/a-mere-add-foreign-key-can-wipe-out-your-whole-rails-sqlite-production-table.html) (HIGH confidence — recent 2025 post-mortem)
- FastAPI image upload pitfalls: [Better Stack guide](https://betterstack.com/community/guides/scaling-python/uploading-files-using-fastapi/) and [greeden.me secure uploads](https://blog.greeden.me/en/2026/03/03/implementing-secure-file-uploads-in-fastapi-practical-patterns-for-uploadfile-size-limits-virus-scanning-s3-compatible-storage-and-presigned-urls/) (MEDIUM confidence — verified patterns)
- FastAPI JWT pitfalls: [greeden.me FastAPI security guide](https://blog.greeden.me/en/2025/10/14/a-beginners-guide-to-serious-security-design-with-fastapi-authentication-authorization-jwt-oauth2-cookie-sessions-rbac-scopes-csrf-protection-and-real-world-pitfalls/) (MEDIUM confidence)
- React Leaflet marker re-render: [react-leaflet GitHub issue #77](https://github.com/PaulLeCam/react-leaflet/issues/77), [Andrej Gajdos performance guide](https://andrejgajdos.com/leaflet-developer-guide-to-high-performance-map-visualizations-in-react/) (HIGH confidence — confirmed open-source issue thread)
- Invite link token expiry: [GitLab issue #222349](https://gitlab.com/gitlab-org/gitlab/-/issues/222349) (MEDIUM confidence)
- Optimistic UI / photo upload race conditions: [jacobparis.com remix image uploads](https://www.jacobparis.com/content/remix-image-uploads) (MEDIUM confidence)

---
*Pitfalls research for: Croissant Club — FastAPI + React food rating app with auth, groups, category ratings, photo uploads*
*Researched: 2026-03-11*
