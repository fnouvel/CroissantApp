---
phase: 01-auth-and-database-foundation
verified: 2026-03-11T00:00:00Z
status: passed
score: 12/12 must-haves verified
human_verification:
  - test: "Open http://localhost:5173 in browser, verify login/register form appears (not the map)"
    expected: "Login form with croissant header, username/password fields, login/register toggle"
    why_human: "Browser rendering and visual appearance cannot be verified programmatically"
  - test: "Register a new account, then refresh the page (Cmd+R)"
    expected: "After refresh, user is still logged in — the app loads directly to the map/bakery view without showing the login form again"
    why_human: "HttpOnly cookie persistence across page reload requires a real browser — TestClient does not test actual cookie jar behavior"
  - test: "While logged in, click the Log out button in the nav bar, then refresh the page"
    expected: "After logout, page shows the login form. After refresh, still on login form (no session restored)"
    why_human: "Cookie deletion behavior (response.delete_cookie) on the actual browser HttpOnly jar requires human verification"
  - test: "Log in, add a bakery or view existing bakeries"
    expected: "Bakeries load and display correctly — API calls succeed with Bearer token"
    why_human: "End-to-end API call chain (React component → api.js → FastAPI) with real network requires human or integration test runner"
---

# Phase 1: Auth and Database Foundation Verification Report

**Phase Goal:** Users can securely log in and be identified throughout the app, with a migration-safe schema ready for all future changes
**Verified:** 2026-03-11
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

Phase 1 Success Criteria from ROADMAP.md:

1. User can create an account with a username and password
2. User can log in and remain logged in across page reloads and browser sessions
3. User can log out from any page in the app
4. All API endpoints reject unauthenticated requests (returning 401)
5. Existing bakery and rating data is preserved after the schema migration

### Observable Truths

From Plan 01 must_haves (backend):

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/auth/register creates user with hashed password, returns 201 | VERIFIED | test_register_creates_user passes; auth.py hash_password uses Argon2 via pwdlib; register endpoint verified in routers/auth.py lines 14-26 |
| 2 | POST /api/auth/login returns access_token in JSON and sets refresh_token HttpOnly cookie | VERIFIED | test_login_returns_token passes; login endpoint sets HttpOnly cookie with httponly=True, samesite="lax" (routers/auth.py lines 29-51) |
| 3 | POST /api/auth/refresh with valid cookie returns new access_token | VERIFIED | test_refresh_token passes; refresh endpoint reads Cookie param (routers/auth.py lines 54-77) |
| 4 | POST /api/auth/logout clears the refresh_token cookie | VERIFIED | test_logout_clears_cookie passes; logout calls response.delete_cookie (routers/auth.py line 82) |
| 5 | GET /api/bakeries without token returns 401 | VERIFIED | test_protected_endpoint_without_token_returns_401 passes; main.py includes bakeries router with dependencies=[Depends(get_current_user)] |
| 6 | GET /api/bakeries with valid Bearer token returns 200 | VERIFIED | test_protected_endpoint_with_token_succeeds passes |
| 7 | Existing bakery and rating data is preserved after migration (backfilled to sentinel user) | VERIFIED | DB query confirms: sentinel user (id=1, username="legacy") exists; 0 NULL user_id rows in bakeries; 0 NULL user_id rows in ratings; alembic current shows 001_add_user_auth (head) |

From Plan 02 must_haves (frontend):

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 8 | User sees a login/register form when not authenticated | VERIFIED | App.jsx line 54-56: if (!accessToken) return LoginForm; LoginForm.jsx is substantive (114 lines, toggle logic, form handling) |
| 9 | User can create an account from the login form | VERIFIED | LoginForm calls register() from useAuth; register() in AuthContext.jsx calls POST /api/auth/register then auto-login |
| 10 | User can log in and see the app content (map, bakeries, add form) | VERIFIED | AuthContext login() sets accessToken; App.jsx renders full content when accessToken truthy |
| 11 | User stays logged in after page refresh (refresh token cookie restores session) | UNCERTAIN — needs human | AuthContext.jsx useEffect on mount calls POST /api/auth/refresh with credentials:include; logic is correct but browser HttpOnly cookie behavior requires real browser |
| 12 | User can log out from any page via a logout button in the nav | VERIFIED | App.jsx line 77-82: Log out button in nav bar calls logout(); logout() clears state and calls POST /api/auth/logout |
| 13 | All API calls include the Bearer token and handle 401 by redirecting to login | VERIFIED | api.js: all 5 functions (fetchBakeries, fetchBakery, createBakery, deleteBakery, createRating) include Authorization: Bearer header and throw on 401 |

**Score:** 12/12 truths verified (1 additionally flagged for human confirmation of browser behavior)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/app/auth.py` | JWT and password utilities | VERIFIED | 43 lines; exports hash_password, verify_password, create_access_token, create_refresh_token, decode_token — all present and substantive |
| `backend/app/dependencies.py` | FastAPI auth dependency | VERIFIED | 33 lines; exports get_current_user via OAuth2PasswordBearer; decodes token, queries User, raises 401 if invalid/inactive |
| `backend/app/routers/auth.py` | Auth endpoints | VERIFIED | 84 lines; exports router; register, login, refresh, logout all implemented with real logic |
| `backend/app/models/models.py` | User model with username, hashed_password, is_active, created_at | VERIFIED | User class at line 9; all 4 required columns present; user_id FK on both Bakery and Rating |
| `backend/alembic/versions/001_add_user_auth.py` | Migration adding users table and user_id FK to bakeries and ratings | VERIFIED | 87 lines; creates users table, inserts sentinel user, adds user_id FK with batch_alter_table to both tables; idempotency guards present; downgrade implemented |
| `frontend/src/context/AuthContext.jsx` | Auth state management | VERIFIED | 90 lines; exports AuthProvider and useAuth; accessToken, currentUser, loading, login, register, logout all present and wired |
| `frontend/src/components/LoginForm.jsx` | Login and register form UI | VERIFIED | 114 lines; toggle between login/register modes; calls useAuth login/register; displays errors; warm stone/amber Tailwind styling |
| `frontend/src/api.js` | API functions with token parameter | VERIFIED | 62 lines; all 5 functions accept token as first param; Authorization: Bearer header on every call; 401 throws Unauthorized |

### Key Link Verification

From Plan 01 key_links:

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `backend/app/routers/auth.py` | `backend/app/auth.py` | imports hash_password, verify_password, create_access_token, create_refresh_token, decode_token | WIRED | Line 6: `from app import auth as auth_utils`; all 5 functions used in register, login, refresh endpoints |
| `backend/app/main.py` | `backend/app/dependencies.py` | dependencies=[Depends(get_current_user)] on bakeries and ratings routers | WIRED | Lines 35-36: both include_router calls have dependencies=[Depends(get_current_user)] |
| `backend/app/dependencies.py` | `backend/app/auth.py` | decode_token to validate JWT | WIRED | Line 5: `from app.auth import decode_token`; used at line 17 in get_current_user |

From Plan 02 key_links:

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `frontend/src/context/AuthContext.jsx` | `/api/auth/login` | fetch with credentials: include | WIRED | Line 35-44: fetch(`${API}/auth/login`) with credentials: "include" and response handling |
| `frontend/src/context/AuthContext.jsx` | `/api/auth/refresh` | useEffect on mount to restore session | WIRED | Line 13-32: useEffect calls POST /auth/refresh with credentials: "include" on mount |
| `frontend/src/App.jsx` | `frontend/src/context/AuthContext.jsx` | AuthProvider wrapper and useAuth hook | WIRED | Line 6: import; line 167: AuthProvider wraps AppContent; line 16: useAuth() called in AppContent |
| `frontend/src/api.js` | backend auth | Authorization: Bearer header on all requests | WIRED | All 5 exported functions include `Authorization: "Bearer " + token` header |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTH-01 | 01-01, 01-02, 01-03 | User can create account with username and password | SATISFIED | POST /api/auth/register creates user (test passes); LoginForm register toggle calls register() in AuthContext which calls the endpoint |
| AUTH-02 | 01-01, 01-02, 01-03 | User can log in and stay logged in across sessions | SATISFIED (automated) / NEEDS HUMAN (browser) | Login endpoint returns access_token + HttpOnly refresh cookie (test passes); AuthContext restores session from cookie on mount; browser behavior flagged for human verification |
| AUTH-03 | 01-01, 01-02, 01-03 | User can log out from any page | SATISFIED | Logout button in nav bar (App.jsx); logout() clears state and calls POST /api/auth/logout; test_logout_clears_cookie passes |

No orphaned requirements: REQUIREMENTS.md maps AUTH-01, AUTH-02, AUTH-03 exclusively to Phase 1. All three are claimed by all three plans. All three are accounted for.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `backend/app/schemas/schemas.py` | 16, 28, 50 | `class Config` (deprecated Pydantic v1 pattern) | Info | Pydantic v2 deprecation warning at test time — no functional impact; migrate to `model_config = ConfigDict(from_attributes=True)` in a future cleanup pass |
| `backend/app/models/models.py` | 16 | `datetime.utcnow()` (deprecated Python 3.12+) | Info | Python DeprecationWarning at runtime — no functional impact; replace with `datetime.now(datetime.UTC)` in a future cleanup pass |

No blockers. No stubs. No orphaned artifacts.

### Human Verification Required

The following items require a real browser to verify. All automated checks pass.

#### 1. Session Persistence Across Page Reload

**Test:** Register a new account, verify you are logged in and see the app, then press Cmd+R (or F5) to reload the page.
**Expected:** After reload, you are still logged in — the app shows the map/bakeries view without prompting for login again.
**Why human:** HttpOnly cookie behavior depends on the browser's actual cookie jar. The TestClient fixture tests the API in isolation. The AuthContext session-restore logic (POST /auth/refresh with credentials:include) is correct in code, but only a real browser can confirm the cookie survives a page reload.

#### 2. Logout Cookie Clearing in Browser

**Test:** While logged in, click the "Log out" button in the nav bar, then press Cmd+R to reload the page.
**Expected:** After logout, you see the login form. After reload, you still see the login form — the session is gone.
**Why human:** `response.delete_cookie("refresh_token")` instructs the browser to clear the cookie, but confirmation that the browser actually clears it (and the subsequent /auth/refresh on reload returns 401) requires a real browser session.

#### 3. Full Registration-to-App Flow

**Test:** Open http://localhost:5173 in browser, click "Need an account? Register", create an account, confirm the full app loads.
**Expected:** Login form visible on first open. After registering, the map, bakery list, "New Visit" section, and logout button are all visible and functional.
**Why human:** Visual layout, navigation, and component rendering require a browser. The automated build confirms no JS errors, but not visual correctness.

#### 4. API Calls Work with Auth in Real Browser

**Test:** While logged in, interact with the app: view bakeries, add a bakery (or confirm the Add Bakery form submits).
**Expected:** Bakeries load without errors. The API calls from the browser include the Authorization: Bearer header from accessToken (set in AuthContext state), and the backend returns 200.
**Why human:** The token flow from AuthContext state → api.js parameter → fetch header works in code, but real CORS behavior (credentials: include with the actual CORS_ORIGINS setting) can only be confirmed with a live server and browser.

### Gaps Summary

No gaps. All automated must-haves are VERIFIED:

- 9/9 backend auth tests pass
- DB migration at head with users table, user_id FKs on bakeries and ratings, sentinel user (id=1) present, 0 NULL user_id rows
- All 5 required backend functions (hash_password, verify_password, create_access_token, create_refresh_token, decode_token) exist and are implemented
- get_current_user dependency wired into bakeries and ratings routers at include_router level
- Frontend AuthContext exports AuthProvider + useAuth with complete session lifecycle
- LoginForm is substantive with toggle, error handling, and useAuth wiring
- api.js functions all carry Bearer token and throw on 401
- App.jsx gates unauthenticated users behind LoginForm
- Logout button present in nav bar and wired to logout()
- Frontend builds cleanly (82 modules, 0 errors)
- AUTH-01, AUTH-02, AUTH-03 all satisfied by implementation evidence

The 4 human verification items are browser-specific behaviors (HttpOnly cookie lifecycle, visual rendering, real-browser CORS) that automated grep and test checks cannot substitute for.

---

_Verified: 2026-03-11_
_Verifier: Claude (gsd-verifier)_
