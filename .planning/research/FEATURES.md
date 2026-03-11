# Feature Research

**Domain:** Niche food rating app — small-group croissant reviews with map-based discovery
**Researched:** 2026-03-11
**Confidence:** MEDIUM (grounded in food rating app ecosystem research; small-group specifics inferred from patterns)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the audience assumes exist. Missing these makes the app feel broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User identity (login + name) | "Who rated this?" is unanswerable without it; essential for group context | MEDIUM | Invite-link flow avoids public registration complexity; username + password is sufficient for a small trusted group |
| Per-user rating history | Users expect to see their own past ratings; core to journaling behavior | LOW | Simple filter on rating table by user_id |
| Bakery detail page | Clicking a map pin or list item must go somewhere informative | LOW | Already partially exists; needs ratings from all group members shown together |
| Group-visible ratings | Sharing a bakery list with friends is the social contract of the app | LOW | With auth added, ratings need a user_id FK; no separate sharing mechanism needed for a single-group app |
| Map with bakery pins | Explicitly the primary UI; missing it makes the app feel like a plain list | MEDIUM | Leaflet already in place; needs polish — popups, pin states (rated vs. unrated), click-to-detail |
| Add a new bakery | Users expect to contribute locations, not just consume a fixed list | LOW | Already exists; needs geocoding confirmation UX |
| Category-based ratings | App's identity is built on this; simple stars feel like a downgrade | MEDIUM | 4-5 dimensions (flakiness, butteriness, freshness, size/value); each rated 1-5 stars; auto-compute composite score |
| Composite / overall score | A single derived score per bakery lets users compare at a glance | LOW | Computed from category averages; no separate input needed |
| Responsive mobile layout | Users will rate on-site at the bakery on their phone | MEDIUM | Tailwind makes this tractable; map and rating form need careful mobile-first treatment |

### Differentiators (Competitive Advantage)

Features that make this app feel special for this specific audience and use case.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Croissant-specific rating categories | "Flakiness," "butteriness," "freshness" makes scoring feel playful and expert at the same time — this IS the personality of the app | LOW | Pure data model decision; labels and icons carry the charm |
| Pre-loaded Boston bakery list | Lowers the "cold start" problem; users can start exploring immediately | LOW | Seed script with 15-20 well-known Boston bakeries; users add more over time |
| Map pin states (rated vs. unrated) | Visual progress map — green pins for visited, grey for want-to-try — turns discovery into a game | LOW-MEDIUM | Two pin colors in Leaflet; derive state from whether current user has a rating |
| Group aggregate score + individual breakdown | "The group gives Pain D'Avignon 4.2 stars, but Sam gives it 4.8 for butteriness" creates conversation | MEDIUM | Aggregate view on bakery detail; per-member breakdown as expandable rows |
| Photo per rating (optional) | A photo of a specific croissant makes the rating tangible and shareable; strong emotional hook | MEDIUM | Stored as files on server (local for MVP, S3-compatible path easy to swap later); one photo per rating visit; thumbnail on bakery detail |
| Warm / playful visual design | The personality — croissant color palette, subtle bakery-world iconography — creates attachment | MEDIUM | Tailwind + custom design tokens; not a library choice but a design execution task |
| "To Try" list / wishlist pins | Users plan outings around the app; a saved list on the map turns it into a planning tool | LOW | Boolean flag on bakery-user junction table; renders as distinct pin state |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Public registration / open signup | "More people should join!" | Kills the intimate trusted-group feel; requires moderation; scope explosion | Invite-link only — admin generates a link, recipients click and register; group stays small |
| Leaderboard / who-rated-most | Gamification feels fun | Turns a collaborative exploration into competition; discourages honest low ratings; changes social dynamics | Show each person's rating count on their profile — informational, not ranked |
| Real-time sync / live notifications | "Tell me when someone rates a new place" | WebSocket complexity for 10-20 users is pure overhead; SQLite doesn't support concurrent writes well | On-demand refresh; group sees new ratings next time they open the app |
| Text review / freeform notes field (mandatory) | "Explain your score" | Friction kills mobile logging at the bakery; most users won't fill it out | Optional short note field (1-2 sentences max); never required |
| AI-powered photo recognition / auto-tagging | Cool demo, sounds useful | No meaningful value for a single-subject app (all photos are croissants); adds external API dependency and cost | Manual category ratings provide richer structured signal than auto-tags |
| Multiple croissant types per bakery visit | "I tried the almond and the plain" | Data model complexity jumps; composite scores become ambiguous | One rating per bakery visit; users can return and add a second rating (each visit is its own record) |
| Social sharing to Instagram / external | "Share this rating" | Out-of-scope social graph; requires OAuth integrations; not the app's purpose | The app IS the shared space for this group; internal sharing is the product |
| Offline mode | Mobile-first concern | Service worker + sync complexity for a small web app is significant engineering; users are at a bakery with cell service | Keep it a simple web app; fast load + responsive design is sufficient |

---

## Feature Dependencies

```
User Accounts (auth)
    └──requires──> All per-user features
                       ├──requires──> Rating History (per user)
                       ├──requires──> Group Aggregate View (needs user_id on ratings)
                       └──requires──> "To Try" Wishlist (needs user_id on saved list)

Category Ratings
    └──requires──> Composite Score (derived from category averages)
    └──replaces──> Simple 1-5 star rating (existing)

Photo Upload
    └──requires──> User Accounts (photo must be attributed to a user+visit)
    └──enhances──> Bakery Detail Page (photos shown in rating history)

Map Pin States (rated/unrated/wishlist)
    └──requires──> User Accounts (state is per-user)
    └──requires──> Bakery geocoordinates (already exists via Nominatim)

Pre-loaded Boston Bakery List
    └──enhances──> Map (pins appear immediately on first load)
    └──has no auth dependency (seed data is global)

Bakery Detail Page
    └──requires──> Bakery CRUD (already exists)
    └──enhanced by──> Category Ratings, Group Aggregate View, Photos
```

### Dependency Notes

- **Auth blocks almost everything:** User accounts is the single highest-priority prerequisite. Category ratings, photos, group views, and wishlist all need user identity.
- **Category ratings replace simple stars:** The existing 1-5 star field should be migrated or deprecated when category ratings land. Don't run both in parallel.
- **Photo upload can be phased in after auth + ratings:** It enhances the experience but doesn't block core group functionality.
- **Map pin states require auth:** Until users exist, all pins look the same. Pin state logic is cheap to add once auth is in place.

---

## MVP Definition

For this milestone (adding features to existing basic app), the MVP is the minimum that makes the app genuinely useful for the group — not just a demo.

### Launch With (v1 of this milestone)

- [ ] User accounts with invite-link registration — without this, nothing else is attributable
- [ ] Category-based ratings (flakiness, butteriness, freshness, size/value) replacing simple stars
- [ ] Composite score derived from category averages
- [ ] Bakery detail page showing all group ratings with per-member breakdown
- [ ] Per-user rating history view
- [ ] Map polish: rated vs. unrated pin states, click-to-detail popups
- [ ] Pre-loaded Boston bakery seed data
- [ ] Responsive mobile layout (rating form usable on phone at a bakery)

### Add After Core Is Working (v1.x)

- [ ] Optional photo upload per rating — add once auth + ratings are stable; significant UX payoff
- [ ] "To Try" wishlist pins on map — low complexity, high delight; add after map polish lands
- [ ] Optional short note field on ratings — trivial to add once rating form is finalized

### Future Consideration (v2+)

- [ ] Admin panel for managing invite links — current group is small enough to manage manually
- [ ] Export / data download (CSV of all ratings) — nice for data nerds but not urgent
- [ ] Multiple visits per bakery with timeline view — useful once the group has rated 50+ times

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| User accounts + invite-link auth | HIGH | MEDIUM | P1 |
| Category-based ratings | HIGH | MEDIUM | P1 |
| Composite score | HIGH | LOW | P1 |
| Bakery detail with group ratings | HIGH | LOW | P1 |
| Responsive mobile layout | HIGH | MEDIUM | P1 |
| Map pin states (rated/unrated) | HIGH | LOW | P1 |
| Pre-loaded Boston bakery data | MEDIUM | LOW | P1 |
| Per-user rating history | MEDIUM | LOW | P1 |
| Optional photo upload | HIGH | MEDIUM | P2 |
| "To Try" wishlist + map pin | MEDIUM | LOW | P2 |
| Optional short note on ratings | MEDIUM | LOW | P2 |
| Admin invite management UI | LOW | MEDIUM | P3 |
| Data export | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when P1 features are stable
- P3: Nice to have, future milestone

---

## Competitor Feature Analysis

These apps were the closest analogues found; none are exactly a "small-group niche food rating" app, which is part of the opportunity.

| Feature | Savor (personal food journal) | Beli (social restaurant rankings) | Eaten (food rating log) | Our Approach |
|---------|-------------------------------|-----------------------------------|-------------------------|--------------|
| Rating type | Multi-dimension per dish | Single overall score | Simple star rating | Category-based (croissant-specific dimensions) |
| Social model | Follow/followers (public) | Friends + public | Personal log only | Closed invite-only group |
| Map | Yes, with history clustering | No | No | Yes, map-first as primary UI |
| Photo | Yes, prominent | Yes | Yes | Yes, optional per rating |
| Group aggregate | No | Semi (friend rankings) | No | Yes, per-bakery group view |
| Auth model | Account required | Account required | Account required | Invite-link, no public signup |
| Focus | All food | Restaurants overall | All food | Croissants only (delightful constraint) |

The "closed group + map-first + croissant-specific categories" combination is not offered by any existing app. The niche constraint is a feature, not a limitation.

---

## Sources

- [The 12 Best Food Rating App Choices for 2025 | Savor](https://www.savortheapp.com/blog/food-memories-journaling/best-food-rating-app/)
- [The 12 Best Food Review App Options for 2025 | Savor](https://www.savortheapp.com/blog/food-tracking-apps/food-review-app/)
- [Finding the Best Food Review App: A 2025 Showdown | Savor](https://www.savortheapp.com/blog/food-tracking-apps/best-food-review-app/)
- [The UX of rating systems | UX Collective](https://uxdesign.cc/the-ux-of-rating-systems-bc4f9d424b90)
- [Reviews and Ratings UX — Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/reviews-and-ratings-ux/)
- [Eatmap: mobile app development for food discovery app | NERDZ LAB](https://nerdzlab.com/case-studies/eatmap/)
- [Usability of Map Pin Clustering | Hack for LA GitHub](https://github.com/hackforla/food-oasis/issues/907)
- [Invite-only auth flow | SuperTokens](https://supertokens.com/blog/how-to-create-an-invite-only-auth-flow)
- [Eaten - The Food Rating App | App Store](https://apps.apple.com/us/app/eaten-the-food-rating-app/id1171712306)

---
*Feature research for: Croissant Club — small-group niche food rating app*
*Researched: 2026-03-11*
