# Requirements: Croissant Club

**Defined:** 2026-03-11
**Core Value:** Friends and family can discover, visit, and rate Boston bakeries' croissants together — with a beautiful map as the centerpiece of exploration.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can create account with username and password
- [ ] **AUTH-02**: User can log in and stay logged in across sessions
- [ ] **AUTH-03**: User can log out from any page

### Ratings

- [ ] **RATE-01**: User can rate a croissant on 4 categories: flakiness, butteriness, freshness, size/value (1-5 each)
- [ ] **RATE-02**: Composite overall score auto-calculated from category averages
- [ ] **RATE-03**: User can view their own past rating history
- [ ] **RATE-04**: User can optionally upload a photo with their rating

### Map & Discovery

- [ ] **MAP-01**: Beautiful, clean map with bakery pins as the primary app interface
- [ ] **MAP-02**: Map pin states show rated (green) vs unrated (grey) bakeries per user
- [ ] **MAP-03**: Clicking a map pin opens bakery detail

### Bakeries

- [ ] **BAKE-01**: User can add a new bakery with name and address (auto-geocoded)
- [ ] **BAKE-02**: Bakery detail page shows all ratings from all users with per-member breakdown
- [ ] **BAKE-03**: Bakery detail shows group aggregate score
- [ ] **BAKE-04**: App pre-loaded with 15-20 Boston bakeries as seed data

### Design

- [ ] **DSGN-01**: Responsive layout that works great on phone and desktop
- [ ] **DSGN-02**: Warm, playful visual design with croissant color palette and personality

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Groups

- **GRP-01**: Invite-link registration (admin generates link, friends click to join)
- **GRP-02**: Multiple groups support

### Discovery

- **DISC-01**: "To Try" wishlist pins on map
- **DISC-02**: Optional short note field on ratings

### Admin

- **ADMN-01**: Admin panel for managing users and invite links
- **ADMN-02**: Data export (CSV of all ratings)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Public registration / open signup | Friends & family only — keep it intimate |
| Leaderboard / ranked lists | Map-first discovery, not competition |
| Real-time sync / live notifications | Overkill for 10-20 users on SQLite |
| AI photo recognition | All photos are croissants — no value |
| Multiple croissant types per visit | Data model complexity; one rating per visit |
| Social sharing to Instagram | The app IS the shared space |
| Offline mode | Users are at bakeries with cell service |
| Native mobile app | Responsive web is sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| RATE-01 | Phase 2 | Pending |
| RATE-02 | Phase 2 | Pending |
| RATE-03 | Phase 2 | Pending |
| RATE-04 | Phase 3 | Pending |
| MAP-01 | Phase 4 | Pending |
| MAP-02 | Phase 4 | Pending |
| MAP-03 | Phase 4 | Pending |
| BAKE-01 | Phase 2 | Pending |
| BAKE-02 | Phase 2 | Pending |
| BAKE-03 | Phase 2 | Pending |
| BAKE-04 | Phase 4 | Pending |
| DSGN-01 | Phase 4 | Pending |
| DSGN-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after roadmap creation*
