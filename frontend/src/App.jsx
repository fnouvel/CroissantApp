import { useState, useEffect, useCallback, useRef } from "react";
import { fetchBakeries, fetchBakery, fetchMyRatings, createRating, createBakery, deleteBakery, deleteRating } from "./api";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginForm from "./components/LoginForm";
import MapView from "./components/MapView";
import BakeryList from "./components/BakeryList";
import PlaceSearch from "./components/PlaceSearch";
import FillBar from "./components/FillBar";

/* ── Icons (inline SVGs) ─────────────────────────── */
const icons = {
  home: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  rate: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  journal: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h10M4 18h14" />
    </svg>
  ),
};

const TABS = [
  { id: "home", label: "Home", icon: icons.home },
  { id: "map", label: "Explore", icon: icons.map },
  { id: "rate", label: "Rate", icon: icons.rate },
  { id: "journal", label: "Journal", icon: icons.journal },
];

/* ── Toast helper ────────────────────────────────── */
function Toast({ message }) {
  if (!message) return null;
  return <div className={`toast ${message ? "show" : ""}`}>{message}</div>;
}

/* ── Croissant Rating (emoji buttons) ────────────── */
function CroissantRating({ value, onChange, label }) {
  return (
    <div>
      {label && <label className="block text-sm font-semibold text-[var(--stone)] mb-1.5">{label}</label>}
      <div className="croissant-rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={n <= value ? "active" : ""}
            aria-label={`${n} croissant${n > 1 ? "s" : ""}`}
          >
            🥐
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HOME VIEW
   ═══════════════════════════════════════════════════ */
function HomeView({ bakeries, ratings, onNavigate, onBakerySelect }) {
  const ratedCount = new Set(ratings.map((r) => r.bakery_id)).size;
  const bakeryCount = bakeries.length;
  const scoredBakeries = bakeries.filter((b) => b.avg_score != null && b.avg_score > 0);
  const avgScore = scoredBakeries.length > 0
    ? (scoredBakeries.reduce((sum, b) => sum + b.avg_score, 0) / scoredBakeries.length).toFixed(1)
    : "—";

  // Top rated = bakeries with scores, sorted by avg_score desc
  const topRated = [...bakeries].filter((b) => b.avg_score != null && b.avg_score > 0).sort((a, b) => b.avg_score - a.avg_score).slice(0, 3);

  // Recent = last 5 ratings
  const recent = [...ratings].slice(0, 5);

  return (
    <section className={`view active`}>
      <div className="view-scroll">
        {/* Hero */}
        <div className="home-hero">
          <div className="home-hero-inner">
            <div className="home-hero-text">
              <span className="badge">Your Croissant Journal</span>
              <h1>Croissant<br />Club</h1>
              <p>Discover, rate, and track the finest croissants across your favorite bakeries.</p>
              <button className="btn btn-white" onClick={() => onNavigate("rate")}>
                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" /></svg>
                Rate a Croissant
              </button>
            </div>
            <div className="home-hero-art" aria-hidden="true">
              <span>🥐</span>
            </div>
          </div>
        </div>

        <div className="container">
          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-value">{ratedCount}</span>
              <span className="stat-label">Rated</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{bakeryCount}</span>
              <span className="stat-label">Bakeries</span>
            </div>
            <div className="stat-card featured">
              <span className="stat-value">{avgScore}</span>
              <span className="stat-label">Avg Score</span>
            </div>
          </div>

          {/* Top Rated */}
          <section className="home-section">
            <div className="section-header">
              <h2>Top Rated</h2>
              <button className="link-btn" onClick={() => onNavigate("journal")}>See all →</button>
            </div>
            {topRated.length > 0 ? (
              <div className="scroll-row">
                {topRated.map((b, i) => (
                  <button key={b.id} className="top-card" onClick={() => onBakerySelect(b)}>
                    <div className="top-card-placeholder">
                      <span className="top-card-rank">{["1st", "2nd", "3rd"][i]}</span>
                      🥐
                    </div>
                    <div className="top-card-body">
                      <h4>{b.name}</h4>
                      <div className="top-card-meta">{b.address}</div>
                      <div className="top-card-score">{b.avg_score.toFixed(1)} / 5</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted-hint">Rate a croissant to see your favorites here.</p>
            )}
          </section>

          {/* Bakeries to Explore */}
          <section className="home-section">
            <div className="section-header">
              <h2>Bakeries to Explore</h2>
              <button className="link-btn" onClick={() => onNavigate("map")}>View map →</button>
            </div>
            {bakeries.length > 0 ? (
              <div className="scroll-row">
                {[...bakeries].sort((a, b) => a.name.localeCompare(b.name)).map((b) => (
                  <button key={b.id} className="bakery-card" onClick={() => onBakerySelect(b)}>
                    <span className="bakery-card-icon">🏪</span>
                    <h4>{b.name}</h4>
                    <p>{b.address}</p>
                    <span className="bakery-card-badge">
                      {b.avg_score ? `${b.avg_score.toFixed(1)} avg` : "Not yet rated"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted-hint">Add your first bakery to get started.</p>
            )}
          </section>

          {/* Recent Activity */}
          <section className="home-section">
            <div className="section-header">
              <h2>Recent Activity</h2>
            </div>
            {recent.length > 0 ? (
              <div className="recent-list">
                {recent.map((r) => (
                  <div key={r.id} className="recent-item">
                    <div className="recent-thumb">🥐</div>
                    <div className="recent-info">
                      <h4>{r.bakery_name || `Bakery #${r.bakery_id}`}</h4>
                      <p>{r.visited_at || r.created_at?.slice(0, 10)}</p>
                    </div>
                    <span className="recent-score">{r.overall_score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-hint">Your recent ratings will show up here.</p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   MAP VIEW (Explore)
   ═══════════════════════════════════════════════════ */
function MapTab({ bakeries, token, onBakeryDeleted, focusBakeryId, onFocusHandled }) {
  const [selectedBakery, setSelectedBakery] = useState(null);
  const [bakeryDetail, setBakeryDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hoveredBakeryId, setHoveredBakeryId] = useState(null);
  const mapViewRef = useRef(null);
  const listRef = useRef(null);

  const handleBakeryClick = useCallback(async (bakery) => {
    if (!bakery) {
      setSelectedBakery(null);
      setBakeryDetail(null);
      return;
    }
    setSelectedBakery(bakery);
    setBakeryDetail(null);
    setDetailLoading(true);
    listRef.current?.scrollToBakery(bakery);
    try {
      setBakeryDetail(await fetchBakery(token, bakery.id));
    } catch (err) {
      console.error("Failed to fetch bakery detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, [token]);

  const handleDelete = useCallback(async (bakery) => {
    try {
      await deleteBakery(token, bakery.id);
      setSelectedBakery(null);
      setBakeryDetail(null);
      onBakeryDeleted();
    } catch (err) {
      console.error("Failed to delete bakery:", err);
    }
  }, [token, onBakeryDeleted]);

  const handleListClick = useCallback((bakery) => {
    handleBakeryClick(bakery);
    mapViewRef.current?.flyToBakery(bakery);
  }, [handleBakeryClick]);

  const handleHover = useCallback((b) => setHoveredBakeryId(b.id), []);
  const handleLeave = useCallback(() => setHoveredBakeryId(null), []);

  useEffect(() => {
    if (!focusBakeryId || bakeries.length === 0) return;
    const bakery = bakeries.find((b) => b.id === focusBakeryId);
    if (!bakery) return;
    const timer = setTimeout(() => {
      handleListClick(bakery);
      onFocusHandled();
    }, 100);
    return () => clearTimeout(timer);
  }, [focusBakeryId, bakeries, handleListClick, onFocusHandled]);

  return (
    <section className="view active">
      <div className="explore-layout">
        <div className="explore-map-hero">
          <MapView
            ref={mapViewRef}
            bakeries={bakeries}
            onBakeryClick={handleBakeryClick}
            onDeleteBakery={handleDelete}
            selectedBakery={selectedBakery}
            bakeryDetail={bakeryDetail}
            detailLoading={detailLoading}
            highlightedBakeryId={hoveredBakeryId}
          />
        </div>
        <BakeryList
          ref={listRef}
          bakeries={bakeries}
          selectedBakery={selectedBakery}
          bakeryDetail={bakeryDetail}
          detailLoading={detailLoading}
          highlightedBakeryId={hoveredBakeryId}
          onHover={handleHover}
          onLeave={handleLeave}
          onClick={handleListClick}
        />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   RATE VIEW
   ═══════════════════════════════════════════════════ */
function RateView({ bakeries, token, onRated, onAddBakery, onNavigate }) {
  const [bakeryId, setBakeryId] = useState("");
  const [scores, setScores] = useState({ flakiness: 0, butteriness: 0, freshness: 0, size_value: 0 });
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().slice(0, 10));
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showAddBakery, setShowAddBakery] = useState(false);
  const fileInputRef = useRef(null);

  const allRated = Object.values(scores).every((v) => v > 0);
  const avg = allRated ? (Object.values(scores).reduce((a, b) => a + b, 0) / 4).toFixed(1) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!bakeryId || !allRated) return;
    setSubmitting(true);
    setError(null);
    try {
      await createRating(token, bakeryId, { ...scores, notes: notes || null, price: price || null, visited_at: visitedAt, photo });
      // Reset
      setBakeryId("");
      setScores({ flakiness: 0, butteriness: 0, freshness: 0, size_value: 0 });
      setNotes("");
      setPrice("");
      setVisitedAt(new Date().toISOString().slice(0, 10));
      setPhoto(null);
      setPhotoPreview(null);
      onRated();
      setTimeout(() => onNavigate("journal"), 600);
    } catch (err) {
      console.error(err);
      setError(err.message === "Unauthorized" ? "Session expired — please log in again." : "Failed to save rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="view active">
      <div className="view-topbar glass">
        <h2>Rate a Croissant</h2>
        {avg && <span className="count-badge" style={{ color: "var(--terracotta)", fontWeight: 700, fontSize: 15 }}>{avg}</span>}
      </div>
      <div className="view-scroll">
        <div className="container container-sm">
          <form className="form-stack" onSubmit={handleSubmit}>
            {/* Bakery Selection */}
            <fieldset className="card">
              <legend className="card-legend">Bakery</legend>
              <div className="field">
                <label>Where did you go?</label>
                <div className="select-wrap">
                  <select value={bakeryId} onChange={(e) => setBakeryId(e.target.value)} required>
                    <option value="">Pick a bakery...</option>
                    {[...bakeries].sort((a, b) => a.name.localeCompare(b.name)).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                className="link-btn"
                style={{ alignSelf: "flex-start" }}
                onClick={() => setShowAddBakery(true)}
              >
                + Add a new bakery
              </button>
            </fieldset>

            {/* Rating */}
            <fieldset className="card">
              <legend className="card-legend">Rating</legend>
              <CroissantRating label="🥐 Flakiness" value={scores.flakiness} onChange={(v) => setScores((p) => ({ ...p, flakiness: v }))} />
              <CroissantRating label="🧈 Butteriness" value={scores.butteriness} onChange={(v) => setScores((p) => ({ ...p, butteriness: v }))} />
              <CroissantRating label="🌿 Freshness" value={scores.freshness} onChange={(v) => setScores((p) => ({ ...p, freshness: v }))} />
              <CroissantRating label="📏 Size & Value" value={scores.size_value} onChange={(v) => setScores((p) => ({ ...p, size_value: v }))} />
            </fieldset>

            {/* Notes, Photo & Date */}
            <fieldset className="card">
              <legend className="card-legend">Details</legend>
              <div className="field">
                <label>Tasting Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Flaky layers, rich butter aroma, perfectly golden..."
                  rows={3}
                />
              </div>
              <div className="field">
                <label>Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 4.50"
                />
              </div>
              <div className="field">
                <label>Photo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhoto(file);
                    setPhotoPreview(URL.createObjectURL(file));
                  }}
                />
                {photoPreview ? (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Croissant preview" />
                    <button
                      type="button"
                      className="photo-preview-remove"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="photo-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Add a photo
                  </button>
                )}
              </div>
              <div className="field">
                <label>Date Visited</label>
                <input type="date" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} />
              </div>
            </fieldset>

            {error && (
              <div style={{ background: "var(--error-bg)", color: "var(--error-text)", fontSize: 13, padding: "10px 14px", borderRadius: 10, border: "1px solid #F0D8C8" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting || !allRated || !bakeryId}>
              {submitting ? "Saving..." : "Save Rating"}
              {!submitting && (
                <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
              )}
            </button>

            {!allRated && bakeryId && (
              <p className="muted-hint">Rate all four categories to submit</p>
            )}
          </form>
        </div>
      </div>

      {/* Add Bakery Modal */}
      {showAddBakery && (
        <AddBakeryModal
          token={token}
          onAdded={(b) => { onAddBakery(); setShowAddBakery(false); setBakeryId(String(b.id)); }}
          onClose={() => setShowAddBakery(false)}
        />
      )}
    </section>
  );
}

/* ── Add Bakery Modal ────────────────────────────── */
function AddBakeryModal({ token, onAdded, onClose }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handlePlaceSelect(place) {
    setName(place.name);
    setAddress(place.address);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const bakery = await createBakery(token, { name, address });
      onAdded(bakery);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.4)", backdropFilter: "blur(2px)", padding: 16 }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 440, width: "100%", padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700 }}>Add a Bakery</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-muted)" }}>×</button>
        </div>

        {error && <div style={{ background: "#FCEAE4", color: "#C2785A", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 12, border: "1px solid #F0D8C8" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <PlaceSearch
            onSelect={handlePlaceSelect}
            inputClass="w-full rounded-[10px] border border-[#DDE3E8] bg-white px-4 py-3 text-sm text-[#1E2D3D] placeholder:text-[#A8B5BF] focus:outline-none focus:ring-2 focus:ring-[#C2785A]/15 focus:border-[#C2785A] transition-all"
          />
          <div className="field">
            <label>Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Bakery name" />
          </div>
          <div className="field">
            <label>Address</label>
            <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Saving..." : "Add Bakery"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   JOURNAL VIEW (My Ratings)
   ═══════════════════════════════════════════════════ */
function JournalView({ ratings, token, onDelete }) {
  const [deleting, setDeleting] = useState(null);

  async function handleDelete(rating) {
    if (!confirm(`Delete your rating for ${rating.bakery_name || "this bakery"}?`)) return;
    setDeleting(rating.id);
    try {
      await deleteRating(token, rating.id);
      onDelete();
    } catch (err) {
      console.error("Failed to delete rating:", err);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="view active">
      <div className="view-topbar glass">
        <h2>My Ratings</h2>
        {ratings.length > 0 && <span className="count-badge">{ratings.length}</span>}
      </div>
      <div className="view-scroll">
        <div className="container">
          {ratings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🥐</div>
              <h3>No ratings yet</h3>
              <p>Rate your first croissant to start building your tasting journal.</p>
            </div>
          ) : (
            <div className="history-grid">
              {ratings.map((r, i) => (
                <div key={r.id} className="rating-card" style={{ animationDelay: `${i * 0.05}s` }}>
                  {r.photo_url && (
                    <img
                      className="rating-card-photo"
                      src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${r.photo_url}`}
                      alt={`${r.bakery_name || "Bakery"} croissant`}
                    />
                  )}
                  <div className="rating-card-body">
                    <div className="rating-card-top">
                      <h3>{r.bakery_name || `Bakery #${r.bakery_id}`}</h3>
                      <span className="score-pill">{r.overall_score.toFixed(1)}</span>
                    </div>
                    <div className="rating-card-bars">
                      <FillBar label="Flakiness" value={r.flakiness} size="sm" />
                      <FillBar label="Butteriness" value={r.butteriness} size="sm" />
                      <FillBar label="Freshness" value={r.freshness} size="sm" />
                      <FillBar label="Size & Value" value={r.size_value} size="sm" />
                    </div>
                    {r.notes && <div className="rating-card-notes">"{r.notes}"</div>}
                    {r.price != null && <div className="rating-card-price">${Number(r.price).toFixed(2)}</div>}
                    <div className="rating-card-footer">
                      <span className="rating-card-date">{r.visited_at || r.created_at?.slice(0, 10)}</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.username}</span>
                    </div>
                    <button
                      className="link-btn"
                      disabled={deleting === r.id}
                      onClick={() => handleDelete(r)}
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        transition: "color 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#C2785A"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                    >
                      {deleting === r.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN APP (Tab Shell)
   ═══════════════════════════════════════════════════ */
function MainApp() {
  const { accessToken, currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [bakeries, setBakeries] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [toast, setToast] = useState("");
  const [focusBakeryId, setFocusBakeryId] = useState(null);

  const loadBakeries = useCallback(async () => {
    if (!accessToken) return;
    try {
      setBakeries(await fetchBakeries(accessToken));
    } catch (err) {
      console.error(err);
    }
  }, [accessToken]);

  const loadRatings = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await fetchMyRatings(accessToken);
      data.sort((a, b) => {
        const dateA = a.visited_at || a.created_at;
        const dateB = b.visited_at || b.created_at;
        return dateB.localeCompare(dateA);
      });
      setRatings(data);
    } catch (err) {
      console.error(err);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    (async () => {
      try {
        const [bakeryData, ratingData] = await Promise.all([
          fetchBakeries(accessToken),
          fetchMyRatings(accessToken),
        ]);
        if (cancelled) return;
        setBakeries(bakeryData);
        ratingData.sort((a, b) => {
          const dateA = a.visited_at || a.created_at;
          const dateB = b.visited_at || b.created_at;
          return dateB.localeCompare(dateA);
        });
        setRatings(ratingData);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => { cancelled = true; };
  }, [accessToken]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function handleRated() {
    showToast("Rating saved! 🥐");
    loadBakeries();
    loadRatings();
  }

  function handleBakeryAdded() {
    showToast("Bakery added!");
    loadBakeries();
  }

  function handleBakeryDeleted() {
    showToast("Bakery removed");
    loadBakeries();
    loadRatings();
  }

  return (
    <div className="app-shell">
      {/* Sidebar (desktop) */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo">🥐</span>
          <div>
            <div className="sidebar-title">Croissant Club</div>
            <div className="sidebar-subtitle">Tasting Journal</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`sidebar-link ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="sidebar-username">{currentUser?.username}</span>
          <button className="sidebar-logout" onClick={logout}>Log out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {activeTab === "home" && (
          <HomeView
            bakeries={bakeries}
            ratings={ratings}
            onNavigate={setActiveTab}
            onBakerySelect={(b) => { setFocusBakeryId(b.id); setActiveTab("map"); }}
          />
        )}
        {activeTab === "map" && (
          <MapTab
            bakeries={bakeries}
            token={accessToken}
            onBakeryDeleted={handleBakeryDeleted}
            focusBakeryId={focusBakeryId}
            onFocusHandled={() => setFocusBakeryId(null)}
          />
        )}
        {activeTab === "rate" && (
          <RateView bakeries={bakeries} token={accessToken} onRated={handleRated} onAddBakery={handleBakeryAdded} onNavigate={setActiveTab} />
        )}
        {activeTab === "journal" && <JournalView ratings={ratings} token={accessToken} onDelete={() => { loadRatings(); loadBakeries(); }} />}

        {/* Bottom Tab Bar (mobile) */}
        <nav className="tab-bar">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </main>

      <Toast message={toast} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   APP ENTRY
   ═══════════════════════════════════════════════════ */
function AppContent() {
  const { accessToken, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-page">
        <div style={{ textAlign: "center" }}>
          <span className="login-emoji">🥐</span>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return accessToken ? <MainApp /> : <LoginForm />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
