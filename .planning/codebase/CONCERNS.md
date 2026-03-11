# Codebase Concerns

**Analysis Date:** 2026-03-11

## Tech Debt

**Silent Error Handling in Geocoding:**
- Issue: `geocode_address()` in `backend/app/routers/bakeries.py` catches all exceptions and returns `(None, None)` without logging. Bakeries created without coordinates fail silently.
- Files: `backend/app/routers/bakeries.py` (lines 15-29)
- Impact: Users can create bakeries that won't display on maps due to missing lat/lon. No feedback or retry mechanism.
- Fix approach: Log exceptions, return explicit error to user, or retry with fallback geocoding service.

**Hardcoded CORS Origins:**
- Issue: CORS middleware allows only specific localhost ports hardcoded in `backend/app/main.py`.
- Files: `backend/app/main.py` (lines 18-24)
- Impact: Moving dev servers to different ports breaks connectivity. Production deployment requires code change, not env config.
- Fix approach: Move origins to environment variable (e.g., `CORS_ORIGINS` with comma-separated list).

**N+1 Query Problem in Bakery Listing:**
- Issue: `list_bakeries()` queries the database once per bakery to calculate average rating.
- Files: `backend/app/routers/bakeries.py` (lines 32-47)
- Impact: Scales poorly. 100 bakeries = 101 SQL queries. Performance degrades with data growth.
- Fix approach: Use SQLAlchemy `func.avg()` with `outerjoin` and `group_by` in single query, or use eager loading.

**Bare Exception Catching:**
- Issue: Multiple catch-all `except Exception:` blocks without specific error handling.
- Files: `backend/app/routers/bakeries.py` (line 27), `frontend/src/components/PlaceSearch.jsx` (line 52)
- Impact: Makes debugging harder. Silent failures hide real problems (network errors, timeouts, API failures) from developer visibility.
- Fix approach: Catch specific exceptions, add logging, propagate meaningful error messages to UI.

## Known Bugs

**Date Calculation Inconsistency:**
- Symptoms: `visited_at` field defaults to `date.today()` server-side in `backend/app/routers/ratings.py` but defaults to `new Date().toISOString()` in frontend forms
- Files: `backend/app/routers/ratings.py` (line 22), `frontend/src/components/AddBakeryForm.jsx` (line 11)
- Trigger: Create a rating without selecting a date in AddBakeryForm
- Workaround: Frontend always sets a default date before submission, so backend default rarely triggers

**Missing StarRating Export in RateCroissantForm:**
- Symptoms: `RateCroissantForm.jsx` imports and uses `StarRating` component but it's not visible in the file
- Files: `frontend/src/components/RateCroissantForm.jsx` (line 74)
- Impact: Component may fail to render if StarRating is missing from project
- Note: Not critical if StarRating is properly defined elsewhere

## Security Considerations

**Nominatim API Rate Limiting:**
- Risk: Frontend queries Nominatim directly without rate limiting on client side. Malicious users could hammer the service.
- Files: `frontend/src/components/PlaceSearch.jsx` (lines 3, 46), `backend/app/routers/bakeries.py` (line 12)
- Current mitigation: Debouncing (350ms) on frontend input; backend uses async client with 5s timeout
- Recommendations:
  - Implement backend geocoding proxy to add rate limiting per user/IP
  - Add API key authentication if using commercial geocoding
  - Consider caching geocoding results

**No Input Validation on Rating Score:**
- Risk: Frontend validates `score` (1-5) with Pydantic, but no rate limiting on rating spam
- Files: `backend/app/schemas/schemas.py` (line 11), `backend/app/routers/ratings.py`
- Current mitigation: Pydantic schema enforces field constraints
- Recommendations: Add rate limiting per bakery/user, implement spam detection, log suspicious rating patterns

**No Authentication/Authorization:**
- Risk: All endpoints are publicly accessible. Any user can create, read, or delete any bakery or rating.
- Files: All `backend/app/routers/` files
- Current mitigation: None
- Recommendations: Implement user authentication (JWT tokens), associate bakeries with owners, add delete/edit permissions

**Unsafe Direct Nominatim User-Agent:**
- Risk: App identifies itself as "FloreCroissant/1.0" to Nominatim, which could be used to rate-limit or block the app specifically
- Files: `backend/app/routers/bakeries.py` (line 21)
- Recommendations: Use generic user agent or consider API proxy

## Performance Bottlenecks

**Database Query on Every List Fetch:**
- Problem: `list_bakeries()` computes average rating in-app loop instead of in database
- Files: `backend/app/routers/bakeries.py` (lines 32-47)
- Cause: Iterating through bakeries and issuing separate queries for each
- Improvement path: Use SQLAlchemy aggregation in query, load ratings via ORM relationships efficiently

**No Database Indexing:**
- Problem: SQLite file-based database with no explicit indexes on foreign keys
- Files: `backend/app/models/models.py`
- Cause: Default SQLite behavior; queries rely on full table scans
- Improvement path: Add indexes on `Bakery.id`, `Rating.bakery_id`, `Rating.score`

**Frontend Loading State Visible Only on Data Fetch:**
- Problem: Map re-renders on every bakery fetch even if data hasn't changed
- Files: `frontend/src/App.jsx` (lines 17-30)
- Cause: No caching or comparison of previous data before state update
- Improvement path: Memoize bakery data, implement cache comparison, or use React Query for data management

## Fragile Areas

**Geocoding Integration:**
- Files: `backend/app/routers/bakeries.py` (lines 12-29), `frontend/src/components/PlaceSearch.jsx`
- Why fragile: Depends entirely on Nominatim external service (uncontrolled by app). If Nominatim goes down, bakery creation partially breaks.
- Safe modification: Wrap geocoding in try-catch with specific error messages, provide manual lat/lon input fallback
- Test coverage: No tests for geocoding behavior or fallbacks

**Form State Management:**
- Files: `frontend/src/components/AddBakeryForm.jsx`, `frontend/src/components/RateCroissantForm.jsx`
- Why fragile: Complex state with multiple fields and async operations (bakery creation then rating). Race conditions possible if user submits twice.
- Safe modification: Add loading/disabled flags, implement request deduplication, use controlled submit logic
- Test coverage: No tests for form submission race conditions or error states

**Relationship Between Bakeries and Ratings:**
- Files: `backend/app/models/models.py` (lines 9-32), `backend/app/routers/ratings.py`
- Why fragile: Cascade delete is enabled on bakeries. Deleting a bakery silently removes all ratings with no audit trail.
- Safe modification: Add soft deletes or audit logging, warn user before cascade delete
- Test coverage: No tests for cascade behavior

## Missing Critical Features

**No Data Persistence Strategy:**
- Problem: SQLite database is ephemeral. If backend process restarts, data location is unclear.
- Blocks: Deployment to production requires database backup/restore plan
- Recommendation: Clarify database location, add migration system, consider PostgreSQL for production

**No Edit/Update Functionality:**
- Problem: Users cannot edit existing bakeries or ratings, only create and delete
- Blocks: Users cannot correct typos, update visit history, or fix geocoding errors
- Recommendation: Add PATCH/PUT endpoints for bakery and rating updates

**No User Authentication:**
- Problem: All data is shared publicly with no concept of user ownership
- Blocks: Multi-user scenarios, private journeys, access control
- Recommendation: Implement user registration/login before deploying publicly

**No Rating History Validation:**
- Problem: Users can rate the same bakery multiple times on the same day with conflicting scores
- Blocks: Data integrity for "favorite" recommendations
- Recommendation: Add constraints or deduplication logic for rating duplicates

## Test Coverage Gaps

**No Backend Tests:**
- What's not tested: All API endpoints, geocoding behavior, database operations, error cases
- Files: `backend/app/routers/bakeries.py`, `backend/app/routers/ratings.py`, `backend/app/models/models.py`
- Risk: Regressions in core functionality go undetected. Changing database schema breaks silently.
- Priority: High

**No Frontend Component Tests:**
- What's not tested: Form submission, error handling, async data loading, Nominatim integration
- Files: `frontend/src/components/AddBakeryForm.jsx`, `frontend/src/components/RateCroissantForm.jsx`, `frontend/src/components/PlaceSearch.jsx`
- Risk: UI bugs in form submission or error display discovered in manual testing only
- Priority: High

**No E2E Tests:**
- What's not tested: Full user workflow (search place → add bakery → rate → view on map)
- Risk: Integration between frontend and backend breaks without detection
- Priority: Medium

**No Integration Tests:**
- What's not tested: Geocoding with real Nominatim API, database persistence, cascade delete behavior
- Risk: External API changes break silently
- Priority: Medium

---

*Concerns audit: 2026-03-11*
