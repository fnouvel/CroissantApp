# Project Research Summary

**Project:** Croissant Club
**Domain:** Niche social food rating web app — invite-only group, map-first, category ratings
**Researched:** 2026-03-11
**Confidence:** HIGH (stack), MEDIUM (features), HIGH (architecture), HIGH (pitfalls)

## Executive Summary

Croissant Club is a small-group food rating app where a trusted circle of friends and family rates croissants at Boston bakeries across multiple quality dimensions, discovers new spots on a map, and shares their collective verdict. No comparable app exists that combines closed-group access, map-first discovery, and croissant-specific category ratings — the niche constraint is the product's identity, not a limitation. Experts build this type of app with a thin FastAPI backend exposing REST endpoints consumed by a React SPA, JWT-based auth gated behind invite-only registration, and local SQLite + filesystem storage that is entirely appropriate at this user count (target: 10-20 people).

The recommended approach is additive: the existing FastAPI + React + Vite + Tailwind + SQLite + Leaflet stack is kept intact, and new capabilities are layered on in strict dependency order. User authentication is the single highest-priority prerequisite — it blocks every social feature (per-user ratings, group aggregates, wishlist pins, photo attribution). Category ratings (flakiness, butteriness, freshness, size/value) replace the existing simple star field and define the app's personality. Photo uploads, wishlist pins, and map polish follow once the auth and ratings foundation is stable.

The most serious risk is database migration. The existing schema has no Alembic setup, and SQLite's ALTER TABLE restrictions will break schema changes without batch-mode migration support. This must be solved before any other new feature is touched. A second key risk is partial auth rollout leaving endpoints unprotected — all routes must be guarded by a `get_current_user()` FastAPI dependency before any user data is exposed.

## Key Findings

### Recommended Stack

The existing stack requires no replacement. Six libraries are added to cover new features: PyJWT 2.11.0 and pwdlib[argon2] 0.3.0 for authentication (FastAPI officially deprecated python-jose and passlib in 2024), python-multipart 0.0.22 for file upload parsing, Pillow 12.1.1 for server-side image validation and resize, react-dropzone 15.0.0 for frontend photo picking, and react-leaflet-cluster 4.0.0 for map marker clustering. All versions are verified against current PyPI and npm registries. Invite-link group membership requires no library — `secrets.token_urlsafe(32)` from the Python stdlib plus a tokens table is the complete implementation.

**Core technologies added:**
- PyJWT 2.11.0: JWT token creation/verification — FastAPI's current official recommendation, replaces deprecated python-jose
- pwdlib[argon2] 0.3.0: password hashing — OWASP-recommended Argon2 algorithm, replaces unmaintained passlib
- python-multipart 0.0.22: multipart form parsing — required for FastAPI UploadFile to function
- Pillow 12.1.1: image validation and resize — rejects non-image uploads, strips EXIF, generates thumbnails
- react-dropzone 15.0.0: drag-and-drop photo picker — hooks-based, React 19 confirmed compatible
- react-leaflet-cluster 4.0.0: marker clustering — explicitly supports existing react-leaflet 5 + leaflet 1.9 dep chain (note: use akursat package, not the abandoned yuzhva package)

### Expected Features

Auth is the dependency anchor for the entire feature set. No per-user feature can be built until user identity exists. The category rating system (replacing simple stars) is the app's core differentiator and must land in the same phase as auth since ratings need a user FK.

**Must have (table stakes for v1):**
- User accounts with invite-link registration — every other feature requires user identity
- Category-based ratings: flakiness, butteriness, freshness, size/value (1-5 each, composite auto-computed)
- Bakery detail page showing all group ratings with per-member breakdown
- Per-user rating history
- Map pin states: rated vs. unrated, click-to-detail popups
- Pre-loaded Boston bakery seed data (15-20 bakeries)
- Responsive mobile layout — users rate on-site at the bakery

**Should have (v1.x after core is stable):**
- Optional photo upload per rating — meaningful UX payoff, adds tangibility
- "To Try" wishlist pins on map — low complexity, high delight
- Optional short note field on ratings — trivial once rating form is finalized

**Defer (v2+):**
- Admin panel for invite link management
- Data export (CSV)
- Multiple visits per bakery with timeline view

**Anti-features to avoid:**
- Public registration — kills the intimate group feel
- Leaderboard — changes social dynamics, discourages honest low ratings
- Real-time sync — WebSocket overhead for 10-20 users is unjustified; SQLite does not support concurrent writes well
- Mandatory text review — friction kills mobile logging

### Architecture Approach

The system is a React SPA communicating with a FastAPI backend over REST. A single `api.js` module on the frontend injects the `Authorization: Bearer` header for all authenticated requests. The backend enforces auth via a `get_current_user()` FastAPI dependency applied at the router level (not per-route). SQLAlchemy ORM manages all persistence to SQLite. Uploaded photos are saved to `backend/uploads/` and served via FastAPI `StaticFiles` — no CDN required at this scale. Access tokens live in React Context (in-memory), with a refresh token in an HttpOnly cookie to survive page reloads.

**Major components:**
1. AuthContext (FE) — holds access token in memory, exposes current user, drives login gate for entire app
2. api.js (FE) — single HTTP client module; attaches Bearer token; single place to update if auth scheme changes
3. get_current_user() dependency (BE) — decodes JWT, loads User from DB; applied at router level to enforce auth on all routes
4. CategoryScore table (BE) — separate rows `(rating_id, category_name, score)`, not JSON blob or columns; enables SQL aggregation per category
5. /uploads/ static directory (BE) — local filesystem served by FastAPI StaticFiles; pragmatic at this scale

### Critical Pitfalls

1. **No Alembic setup + SQLite ALTER TABLE limitations** — `Base.metadata.create_all()` cannot migrate existing tables. Adding `user_id` FK without Alembic batch-mode migrations will crash or silently fail. Set up Alembic with `render_as_batch=True` as the very first engineering task before touching any model.

2. **Retrofitting user ownership onto existing data** — existing Rating and Bakery rows have no `user_id`. Adding it as `NOT NULL` crashes; adding nullable creates permanent inconsistency. Plan: add `user_id` nullable, create a "legacy/anonymous" sentinel user, backfill existing rows within the same migration.

3. **Partial auth rollout leaves endpoints unprotected** — adding auth route-by-route is the path of least resistance but leaves old routes publicly readable. Apply `dependencies=[Depends(get_current_user)]` at the router include level; selectively whitelist only the invite acceptance and health endpoints.

4. **Image storage path lost on redeploy** — relative paths like `uploads/` and `sqlite:///./app.db` are wiped on VPS redeploy. Store both the database and uploads at absolute paths outside the project directory, defined via `.env`.

5. **Category ratings modeled as columns** — adding `flakiness INTEGER` etc. to the Rating table bakes the category list into the schema. Adding a new category later requires a migration. Use a separate `CategoryScore` table with `(rating_id, category_name, score)` rows from the start.

## Implications for Roadmap

Based on research, the build order is strictly dictated by feature dependencies. Auth must land first, in full, before anything else. Ratings redesign follows immediately because ratings need a user FK. Photos are an enhancement that attach to existing ratings. Map polish is last because it depends on all data being stable.

### Phase 1: Auth and Database Foundation

**Rationale:** Auth blocks every social feature. SQLite migration infrastructure blocks every schema change. Both must be solved first, together, before any other code is written. This is the highest-risk phase and deserves the most care.

**Delivers:** Working login/registration behind invite links; all existing routes protected; Alembic managing schema; existing data preserved with sentinel user backfill.

**Addresses features:** User accounts, invite-link registration, group membership, login gate for SPA.

**Avoids pitfalls:** Alembic batch-mode migration setup (Pitfall 3); retrofitting user_id onto existing data (Pitfall 1); unprotected endpoints after partial auth rollout (Pitfall 2); JWT in localStorage anti-pattern.

**Stack additions:** PyJWT 2.11.0, pwdlib[argon2] 0.3.0, python-dotenv; AuthContext + api.js updates on frontend.

### Phase 2: Category Ratings Redesign

**Rationale:** Once users exist and can be attributed to ratings, the category rating system replaces the simple star field. This is the app's core differentiator and must be data-modeled correctly before any UI is built on top of it.

**Delivers:** Rating form with category sliders (flakiness, butteriness, freshness, size/value); composite score auto-computed; bakery detail page showing group ratings with per-member breakdown; per-user rating history.

**Addresses features:** Category-based ratings, composite score, group aggregate view, bakery detail page, per-user history.

**Avoids pitfalls:** Category ratings as columns (Pitfall 4) — use CategoryScore table from the start; premature migration of existing `score` column (keep it, compute from categories going forward).

**Architecture:** CategoryScore as separate table with `(rating_id, category_name, score)` rows; SQL AVG() aggregation per category for bakery detail and map pin data.

### Phase 3: Photo Uploads

**Rationale:** Photos attach to ratings (which now have a user + category model). This phase adds the tangibility and emotional hook that makes the rating history feel real. Storage strategy must be decided before any code is written.

**Delivers:** Optional photo per rating visit; photos shown on bakery detail page; drag-and-drop upload UI; server-side image validation and resize.

**Addresses features:** Optional photo upload (P2 feature, meaningful UX payoff).

**Avoids pitfalls:** Image storage path lost on redeploy (Pitfall 5) — define absolute UPLOAD_DIR in .env before writing upload code; validate with Pillow not client Content-Type header; async file I/O with aiofiles.

**Stack additions:** Pillow 12.1.1, python-multipart 0.0.22, react-dropzone 15.0.0, aiofiles.

### Phase 4: Map Polish and Discovery Features

**Rationale:** Map enhancements depend on all prior data being stable — pin states derive from user ratings, category averages, and photo counts. Building map polish last avoids rebuilding it as the data model evolves. Low-complexity wishlist feature fits here naturally.

**Delivers:** Rated vs. unrated pin states; "To Try" wishlist pins; richer map popups with category averages; marker clustering for dense areas; pre-loaded Boston bakery seed data; responsive mobile layout polish.

**Addresses features:** Map pin states, wishlist, marker clustering, Boston seed data, mobile responsiveness.

**Avoids pitfalls:** React Leaflet marker re-renders on state change — use `useMemo` for bakery list and `React.memo` for marker components; map viewport reset on navigation — persist center/zoom in URL params or sessionStorage.

**Stack additions:** react-leaflet-cluster 4.0.0.

### Phase Ordering Rationale

- Auth first because it is the dependency anchor for all social features — no user identity means no attributable ratings, no group views, no wishlist, no photos.
- Ratings second because the category model must be finalized before the bakery detail page, map pin data, and photo attribution are built on top of it. Running category ratings and simple stars in parallel creates inconsistent data.
- Photos third because they attach to ratings — the rating model must be stable before adding a photo FK.
- Map polish last because it is a display layer over all other data. Polishing the map while the data model is still changing wastes effort.
- Alembic setup (beginning of Phase 1) is a prerequisite for Phases 2-4, all of which require schema changes.

### Research Flags

Phases likely needing `/gsd:research-phase` during planning:
- **Phase 1 (Auth):** JWT refresh token + HttpOnly cookie pattern has environment-specific CORS gotchas (`allow_credentials=True`, `credentials: 'include'`). The Alembic batch migration for SQLite with existing FK relationships merits a focused research pass before implementation begins.
- **Phase 3 (Photos):** Storage path strategy (absolute local path vs. Cloudflare R2) should be confirmed before writing any upload code. The async UploadFile + Pillow + aiofiles pipeline has ordering subtleties.

Phases with well-documented patterns (skip research-phase):
- **Phase 2 (Ratings):** CategoryScore table pattern is standard SQLAlchemy; star-row rating UI in Tailwind is straightforward. No novel integration.
- **Phase 4 (Map):** react-leaflet-cluster integration is documented; Leaflet pin state via icon swapping is a well-established pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All library versions verified against PyPI and npm. FastAPI's migration from python-jose to PyJWT confirmed via merged PR #11589. react-leaflet-cluster compatibility verified via GitHub issue thread. |
| Features | MEDIUM | Grounded in food rating app ecosystem research; small-group invite-only specifics inferred from comparable apps (Savor, Beli, Eaten). No direct prior art for this exact niche combination. |
| Architecture | HIGH | FastAPI + SQLAlchemy + React Context JWT patterns are well-established. CategoryScore table pattern is standard. Invite-link group join is straightforward but has less direct prior art (MEDIUM for that specific pattern). |
| Pitfalls | HIGH | Drawn from direct codebase analysis (CONCERNS.md) plus verified SQLite batch migration docs, SQLAlchemy FK cascade post-mortems, and react-leaflet performance issue threads. |

**Overall confidence:** HIGH

### Gaps to Address

- **JWT token storage final decision:** Architecture recommends access token in React Context + refresh token in HttpOnly cookie. STACK.md recommends localStorage for simplicity given trusted users. These conflict. Recommend the Context + HttpOnly cookie approach (more secure, not significantly harder), but this should be confirmed with the developer before Phase 1 begins.

- **Category list finalization:** The 4-5 categories (flakiness, butteriness, freshness, size/value) are inferred from domain knowledge. The actual group should confirm the list before the CategoryScore table is created — changing categories after data exists requires a migration even with the rows-based model.

- **Deployment target:** Pitfall 5 (file storage on redeploy) has different solutions depending on whether the app runs on a personal server, a VPS, or a cloud host. The storage strategy must be confirmed before Phase 3.

- **Single group vs. multi-group:** Architecture assumes one group per user (simpler). If the founders want to support multiple independent groups (e.g., "Boston group" and "NYC group"), the data model changes significantly. Confirm scope before Phase 1.

## Sources

### Primary (HIGH confidence)
- https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/ — FastAPI JWT auth (confirmed March 2026, uses PyJWT)
- https://github.com/fastapi/fastapi/pull/11589 — FastAPI PR switching docs from python-jose to PyJWT
- https://pypi.org/project/PyJWT/ — PyJWT 2.11.0, January 30 2026
- https://pypi.org/project/pwdlib/ — pwdlib 0.3.0, October 25 2025
- https://pypi.org/project/Pillow/ — Pillow 12.1.1, February 11 2026
- https://alembic.sqlalchemy.org/en/latest/batch.html — Alembic batch migrations for SQLite
- https://fastapi.tiangolo.com/tutorial/sql-databases/ — FastAPI SQLAlchemy patterns
- https://fastapi.tiangolo.com/tutorial/request-files/ — FastAPI UploadFile pattern
- Codebase CONCERNS.md — direct analysis of existing CroissantApp code

### Secondary (MEDIUM confidence)
- https://github.com/fastapi/fastapi/discussions/11773 — community confirmation of passlib deprecation
- https://github.com/akursat/react-leaflet-cluster — react-leaflet-cluster v4 React 19 compatibility (GitHub issue #42)
- https://www.npmjs.com/package/react-dropzone — react-dropzone 15.0.0
- https://kyrylo.org/software/2025/09/27/a-mere-add-foreign-key-can-wipe-out-your-whole-rails-sqlite-production-table.html — SQLite FK cascade delete post-mortem
- https://betterstack.com/community/guides/scaling-python/uploading-files-using-fastapi/ — FastAPI image upload patterns
- https://blog.greeden.me/en/2026/03/03/implementing-secure-file-uploads-in-fastapi-practical-patterns-for-uploadfile-size-limits-virus-scanning-s3-compatible-storage-and-presigned-urls/ — secure FastAPI file upload patterns

### Tertiary (LOW confidence)
- https://uxdesign.cc/the-ux-of-rating-systems-bc4f9d424b90 — rating UX patterns (informs category display decisions)
- https://supertokens.com/blog/how-to-create-an-invite-only-auth-flow — invite-only auth patterns (different stack, patterns inferred)

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
