# Roadmap: Croissant Club

## Overview

The existing MVP has basic bakery CRUD, a Leaflet map, and simple star ratings with no user identity. This roadmap layers four coherent capabilities on top of that foundation: auth first (because every social feature depends on user identity), then the category ratings and bakery detail pages that are the app's core differentiator, then optional photo uploads that add emotional tangibility to ratings, and finally map polish and responsive design that make the app feel alive and delightful on a phone at the bakery.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Auth and Database Foundation** - Users can log in; all routes protected; Alembic manages schema migrations
- [ ] **Phase 2: Ratings and Bakeries** - Category ratings replace simple stars; bakery detail shows full group breakdown
- [ ] **Phase 3: Photo Uploads** - Optional photo per rating visit with server-side validation
- [ ] **Phase 4: Map Polish and Design** - Beautiful map with pin states; warm design; responsive on phone; Boston seed data loaded

## Phase Details

### Phase 1: Auth and Database Foundation
**Goal**: Users can securely log in and be identified throughout the app, with a migration-safe schema ready for all future changes
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. User can create an account with a username and password
  2. User can log in and remain logged in across page reloads and browser sessions
  3. User can log out from any page in the app
  4. All API endpoints reject unauthenticated requests (returning 401)
  5. Existing bakery and rating data is preserved after the schema migration
**Plans**: TBD

### Phase 2: Ratings and Bakeries
**Goal**: Users can rate croissants across four quality categories and see how the whole group rates each bakery
**Depends on**: Phase 1
**Requirements**: RATE-01, RATE-02, RATE-03, BAKE-01, BAKE-02, BAKE-03
**Success Criteria** (what must be TRUE):
  1. User can submit a rating with individual 1-5 scores for flakiness, butteriness, freshness, and size/value
  2. A composite overall score is automatically shown alongside the four category scores
  3. User can view a list of all their past ratings with bakery name, date, and scores
  4. User can add a new bakery by entering a name and address (address auto-geocoded to coordinates)
  5. Bakery detail page shows every group member's rating with per-category breakdown and a group aggregate score
**Plans**: TBD

### Phase 3: Photo Uploads
**Goal**: Users can attach an optional photo to any rating, making visits feel tangible and memorable
**Depends on**: Phase 2
**Requirements**: RATE-04
**Success Criteria** (what must be TRUE):
  1. User can optionally attach a photo when submitting or editing a rating
  2. Uploaded photos are visible on the bakery detail page alongside the rating they belong to
  3. Non-image files are rejected with a clear error message
**Plans**: TBD

### Phase 4: Map Polish and Design
**Goal**: The map is a beautiful, responsive primary interface that shows rated vs. unrated bakeries at a glance, with warm playful design that works great on a phone
**Depends on**: Phase 3
**Requirements**: MAP-01, MAP-02, MAP-03, BAKE-04, DSGN-01, DSGN-02
**Success Criteria** (what must be TRUE):
  1. Map loads pre-populated with 15-20 Boston bakeries visible as pins without any user action
  2. Bakery pins clearly distinguish between bakeries the current user has rated (green) and those they haven't (grey)
  3. Tapping or clicking a map pin opens the bakery detail view
  4. The app is fully usable on a phone screen — forms, maps, and detail pages all fit and function without horizontal scrolling
  5. The visual design uses a warm, croissant-inspired color palette that feels playful and personal rather than generic
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth and Database Foundation | 0/? | Not started | - |
| 2. Ratings and Bakeries | 0/? | Not started | - |
| 3. Photo Uploads | 0/? | Not started | - |
| 4. Map Polish and Design | 0/? | Not started | - |
