# Croissant Club

## What This Is

A croissant rating app for friends and family to explore bakeries and cafes in the Boston area and rate how good their croissants are. Users can discover new bakeries on a beautiful, clean map, log visits with category-based ratings (flakiness, butteriness, etc.), and share their findings with their group. The app is warm and playful in personality.

## Core Value

Friends and family can discover, visit, and rate Boston bakeries' croissants together — with a beautiful map as the centerpiece of exploration.

## Requirements

### Validated

<!-- Inferred from existing codebase -->

- ✓ Backend API with FastAPI serving REST endpoints — existing
- ✓ React + Vite + Tailwind frontend consuming API — existing
- ✓ Bakery CRUD (create, list, view, delete) — existing
- ✓ Simple star rating (1-5) per bakery visit — existing
- ✓ Map view showing bakery locations via Leaflet — existing
- ✓ Address geocoding via OpenStreetMap Nominatim — existing
- ✓ SQLite database for persistence — existing

### Active

- [ ] Category-based rating system (flakiness, butteriness, freshness, size, etc.)
- [ ] Beautiful, clean map as primary discovery interface
- [ ] User accounts with invite-link group membership
- [ ] Friends & family group — shared bakery list and ratings
- [ ] Pre-loaded Boston bakery list with ability for users to add new ones
- [ ] Optional photo upload with ratings
- [ ] Responsive design — works great on phone and desktop
- [ ] Warm, playful visual design with croissant personality
- [ ] Individual rating history per user
- [ ] Bakery detail page with all ratings from group members

### Out of Scope

- Public community / open registration — this is for friends & family only
- Leaderboard / ranked lists — map-first discovery, not competition
- Real-time features (chat, live updates) — overkill for small group
- Native mobile app — responsive web is sufficient
- Payment processing — free app
- Moderation tools — trusted small group doesn't need them

## Context

- Existing MVP has basic bakery CRUD, simple 1-5 star ratings, and a Leaflet map
- Current app has no authentication — all endpoints are public with no user tracking
- Backend uses SQLAlchemy with SQLite, frontend uses React 19 + Vite 7 + Tailwind 4
- Geocoding already works via Nominatim (OpenStreetMap)
- The rebuild keeps the same tech stack (FastAPI + React/Vite/Tailwind) but adds proper user accounts, category ratings, and polished design
- App is used by Samuel and his wife plus friends and family in the Boston area

## Constraints

- **Tech stack**: FastAPI backend + React/Vite/Tailwind frontend — already established
- **Database**: SQLite for simplicity (small user base doesn't need Postgres)
- **Map**: Leaflet with OpenStreetMap — free, no API key needed
- **Audience**: Small group (friends & family) — design for ~10-20 users max
- **Geography**: Boston area focus

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep FastAPI + React stack | Already built, team familiar with it | — Pending |
| Category-based ratings over simple stars | More interesting data, captures what makes a croissant great | — Pending |
| Invite-link groups over public registration | Privacy for friends & family, simpler auth | — Pending |
| Map as primary UI over list/leaderboard | User specifically wants beautiful map exploration | — Pending |
| SQLite over Postgres | Small user base, simplicity over scale | — Pending |

---
*Last updated: 2026-03-11 after initialization*
