import { useRef, useImperativeHandle, useMemo } from "react";

function sortBakeries(bakeries) {
  const rated = bakeries
    .filter((b) => b.avg_score != null)
    .sort((a, b) => b.avg_score - a.avg_score);
  const unrated = bakeries
    .filter((b) => b.avg_score == null)
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...rated, ...unrated];
}

export default function BakeryList({ ref, bakeries, selectedBakery, highlightedBakeryId, onHover, onLeave, onClick }) {
  const rowRefs = useRef({});
  const sorted = useMemo(() => sortBakeries(bakeries), [bakeries]);

  useImperativeHandle(ref, () => ({
    scrollToBakery(bakery) {
      const el = rowRefs.current[bakery.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
  }), []);

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
          const isRated = bakery.avg_score != null;
          const isMappable = bakery.latitude != null && bakery.longitude != null;
          const isSelected = selectedBakery?.id === bakery.id;
          const isHovered = highlightedBakeryId === bakery.id;

          return (
            <button
              key={bakery.id}
              ref={(el) => { rowRefs.current[bakery.id] = el; }}
              className={`bakery-row${isSelected ? " selected" : ""}${isHovered ? " hovered" : ""}`}
              onMouseEnter={() => isMappable && onHover(bakery)}
              onMouseLeave={onLeave}
              onClick={() => onClick(bakery)}
            >
              {isRated ? (
                <span className="bakery-row-rank">{i + 1}</span>
              ) : (
                <span className="bakery-row-dot" />
              )}
              <div className="bakery-row-body">
                <span className="bakery-row-name">{bakery.name}</span>
                <span className="bakery-row-address">{bakery.address}</span>
              </div>
              {isRated ? (
                <span className="bakery-row-score">{bakery.avg_score.toFixed(1)}</span>
              ) : (
                <span className="bakery-row-unrated">Unrated</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
