import { useRef, useState, useImperativeHandle, useMemo } from "react";
import FillBar from "./FillBar";

function sortBakeries(bakeries) {
  const rated = bakeries
    .filter((b) => b.avg_score != null)
    .sort((a, b) => b.avg_score - a.avg_score);
  const unrated = bakeries
    .filter((b) => b.avg_score == null)
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...rated, ...unrated];
}

const API_BASE = import.meta.env.VITE_API_URL.replace("/api", "");

function RatingCard({ rating }) {
  return (
    <div className="bakery-rating-card">
      {rating.photo_url && (
        <img
          className="bakery-rating-card-photo"
          src={rating.photo_url.startsWith("http") ? rating.photo_url : `${API_BASE}${rating.photo_url}`}
          alt="Croissant"
        />
      )}
      <div className="bakery-rating-card-header">
        <span className="bakery-rating-card-score">
          {rating.overall_score.toFixed(1)}
        </span>
        <div className="bakery-rating-card-meta">
          {rating.username && (
            <span className="bakery-rating-card-user">{rating.username}</span>
          )}
          <span className="bakery-rating-card-date">
            {rating.visited_at || rating.created_at?.slice(0, 10)}
          </span>
        </div>
      </div>
      <div className="bakery-rating-card-bars">
        <FillBar label="Flakiness" value={rating.flakiness} size="sm" />
        <FillBar label="Butteriness" value={rating.butteriness} size="sm" />
        <FillBar label="Freshness" value={rating.freshness} size="sm" />
        <FillBar label="Size & Value" value={rating.size_value} size="sm" />
      </div>
      {rating.notes && (
        <p className="bakery-rating-card-notes">"{rating.notes}"</p>
      )}
      {rating.price != null && (
        <p className="bakery-rating-card-price">${Number(rating.price).toFixed(2)}</p>
      )}
    </div>
  );
}

const ChevronIcon = ({ expanded }) => (
  <svg
    viewBox="0 0 20 20"
    width="16"
    height="16"
    fill="currentColor"
    style={{
      transition: "transform 0.2s ease",
      transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
      flexShrink: 0,
      color: "var(--text-muted)",
    }}
  >
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

export default function BakeryList({ ref, bakeries, selectedBakery, bakeryDetail, detailLoading, highlightedBakeryId, onHover, onLeave, onClick }) {
  const rowRefs = useRef({});
  const [expandedId, setExpandedId] = useState(null);
  const sorted = useMemo(() => sortBakeries(bakeries), [bakeries]);

  useImperativeHandle(ref, () => ({
    scrollToBakery(bakery) {
      const el = rowRefs.current[bakery.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
  }), []);

  const handleToggleExpand = (e, bakery) => {
    e.stopPropagation();
    setExpandedId((prev) => (prev === bakery.id ? null : bakery.id));
    onClick(bakery);
  };

  const isSelected = (bakery) => selectedBakery?.id === bakery.id;
  const isExpanded = (bakery) => expandedId === bakery.id && isSelected(bakery);
  const hasRatings = (bakery) => bakery.avg_score != null;

  return (
    <div className="explore-list-panel">
      <div className="explore-list-header">
        <h2>Bakeries</h2>
        {bakeries.length > 0 && (
          <span className="count-badge">{bakeries.length}</span>
        )}
      </div>
      <div className="bakery-list">
        {sorted.map((bakery, i) => {
          const rated = bakery.avg_score != null;
          const isMappable = bakery.latitude != null && bakery.longitude != null;
          const selected = isSelected(bakery);
          const expanded = isExpanded(bakery);
          const hovered = highlightedBakeryId === bakery.id;

          return (
            <div
              key={bakery.id}
              ref={(el) => { rowRefs.current[bakery.id] = el; }}
              className={`bakery-row-wrapper${expanded ? " expanded" : ""}`}
            >
              <button
                className={`bakery-row${selected ? " selected" : ""}${hovered ? " hovered" : ""}`}
                onMouseEnter={() => isMappable && onHover(bakery)}
                onMouseLeave={onLeave}
                onClick={() => onClick(bakery)}
              >
                {rated ? (
                  <span className="bakery-row-rank">{i + 1}</span>
                ) : (
                  <span className="bakery-row-dot" />
                )}
                <div className="bakery-row-body">
                  <span className="bakery-row-name">{bakery.name}</span>
                  <span className="bakery-row-address">{bakery.address}</span>
                </div>
                {rated ? (
                  <span className="bakery-row-score">{bakery.avg_score.toFixed(1)}</span>
                ) : (
                  <span className="bakery-row-unrated">Unrated</span>
                )}
                {hasRatings(bakery) && (
                  <button
                    className="bakery-row-expand"
                    onClick={(e) => handleToggleExpand(e, bakery)}
                    aria-label={expanded ? "Collapse ratings" : "View ratings"}
                  >
                    <ChevronIcon expanded={expanded} />
                  </button>
                )}
              </button>

              {/* Expanded ratings panel */}
              <div className={`bakery-ratings-panel${expanded ? " open" : ""}`}>
                {expanded && (
                  detailLoading ? (
                    <div className="bakery-ratings-loading">Loading ratings...</div>
                  ) : bakeryDetail?.ratings?.length > 0 ? (
                    <div className="bakery-ratings-list">
                      <div className="bakery-ratings-count">
                        {bakeryDetail.ratings.length} rating{bakeryDetail.ratings.length !== 1 ? "s" : ""}
                      </div>
                      {bakeryDetail.ratings.map((r) => (
                        <RatingCard key={r.id} rating={r} />
                      ))}
                    </div>
                  ) : (
                    <div className="bakery-ratings-loading">No ratings yet</div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
