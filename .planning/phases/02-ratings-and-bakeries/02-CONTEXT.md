# Phase 2: Ratings and Bakeries - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the existing simple 1-5 star rating system with a 4-category scoring system (flakiness, butteriness, freshness, size/value). Add bakery detail pages showing group aggregate ratings. Users rate from the bakery's detail page, view their history in their profile, and can add new bakeries. The map remains the app's centerpiece with a bottom tab bar for navigation.

</domain>

<decisions>
## Implementation Decisions

### Rating Categories
- Four categories confirmed: flakiness, butteriness, freshness, size/value
- Each scored 1-5
- Composite overall score auto-calculated as average of the four

### Rating Input
- Tap stars (5 stars per category) — familiar mobile pattern
- Rating form accessed from the bakery detail page (not standalone)
- Include date visited and optional notes (existing fields carry forward)

### Bakery Detail Page
- Opens as a side panel / drawer over the map — map stays visible
- Group aggregate scores displayed prominently using horizontal fill bars
- Individual member ratings are secondary (not hidden, but aggregate is the focus)
- Per-category breakdown shown with fill bars for each category

### Score Visualization
- Horizontal fill bars for displaying category scores (on detail page, history, etc.)
- Bars fill proportionally for 1-5 — easy to scan and compare categories at a glance

### Rating History
- Accessible from the user's profile/account area (not a separate top-level view)
- Layout at Claude's discretion — should feel consistent with the warm, playful design

### Add Bakery
- Form style at Claude's discretion — should feel lightweight and contextual
- Name + address input with auto-geocoding (existing Nominatim integration)

### Navigation
- Bottom tab bar: Map | My Ratings (or similar) | Profile
- Map is always the home/default tab
- Bakery detail opens as side panel from map pins

### Design System — "The Modern Boulangerie"
- **Background (Oat Flour):** #F4F1EA — warm beige, clean minimalist canvas
- **Primary Accent (Baked Terracotta):** #D27D56 — buttons, active states, warm clay
- **Secondary Accent (Muted Sage):** #8A9A86 — tags, secondary icons, "fresh" indicators
- **Text (Charcoal):** #333333 — crisp, legible typography
- Font choice at Claude's discretion — should match the earthy, inviting boulangerie feel
- Icon + wordmark branding: small croissant icon/illustration alongside "Croissant Club"

### Full Redesign
- Complete UX rewrite — existing prototype code is not reused
- Backend models and API reworked as needed for category scoring
- All frontend components written fresh to match the Modern Boulangerie design

### Claude's Discretion
- Typography / font selection (should complement the palette)
- Rating history layout (cards, list, or timeline)
- Add bakery form style (inline, modal, or dedicated)
- Loading states, empty states, error handling patterns
- Exact spacing, border radius, shadow treatments
- Animation and transition details
- Mobile responsive breakpoints

</decisions>

<specifics>
## Specific Ideas

- Color palette is called "The Modern Boulangerie" — earthy, inviting, warm ovens and natural ingredients
- Parisian bakery elegance crossed with modern minimalism
- Oat Flour background creates a clean canvas; Baked Terracotta adds warmth without brightness
- Muted Sage complements terracotta for organic, fresh accents
- The app should feel like you're browsing a beautiful, curated bakery guide — not a generic review app

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — full redesign per user direction. Existing components are prototype-only.

### Established Patterns
- FastAPI + SQLAlchemy backend pattern remains (routers, models, schemas)
- React + Vite + Tailwind frontend pattern remains
- Nominatim geocoding integration can be kept (functional, not a UI concern)

### Integration Points
- Phase 1 auth (JWT, user identity) must be in place before Phase 2 executes
- Rating model needs `user_id` FK from Phase 1 migration
- Map component will need to trigger bakery detail panel opening

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-ratings-and-bakeries*
*Context gathered: 2026-03-11*
