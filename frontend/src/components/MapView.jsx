import { useRef, useState, useCallback, useImperativeHandle, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import FillBar from "./FillBar";

const BOSTON_CENTER = { longitude: -71.06, latitude: 42.36 };

function BakeryMarker({ bakery, onHover, onLeave, onClick, isHighlighted }) {
  const score = bakery.avg_score;
  const hasScore = score != null && score > 0;

  return (
    <Marker
      longitude={bakery.longitude}
      latitude={bakery.latitude}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick(bakery);
      }}
    >
      <div
        className="map-marker"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        onMouseEnter={() => onHover(bakery)}
        onMouseLeave={onLeave}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            boxShadow: isHighlighted
              ? "0 0 0 3px var(--butter), 0 2px 8px rgba(0,0,0,.25)"
              : "0 2px 8px rgba(0,0,0,.25)",
            border: "2px solid rgba(255,255,255,.8)",
            background: hasScore ? "var(--accent)" : "var(--text-muted)",
            transform: isHighlighted ? "scale(1.18)" : undefined,
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          {hasScore ? score.toFixed(1) : "🥐"}
        </div>
      </div>
    </Marker>
  );
}

function BakeryPopup({ bakery, detail, loading, onClose }) {
  const agg = detail?.aggregate;

  return (
    <Popup
      longitude={bakery.longitude}
      latitude={bakery.latitude}
      anchor="bottom"
      offset={24}
      closeOnClick={false}
      onClose={onClose}
      className="bakery-popup"
    >
      <div style={{ minWidth: 220, maxWidth: 280, padding: "4px 0" }}>
        {/* Header */}
        <h3 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text)",
          margin: "0 0 2px 0",
          lineHeight: 1.3,
        }}>
          {bakery.name}
        </h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px 0" }}>
          {bakery.address}
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "8px 0", fontSize: 13, color: "var(--text-muted)" }}>
            Loading...
          </div>
        ) : agg && agg.rating_count > 0 ? (
          <>
            {/* Overall score */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
              padding: "6px 10px",
              background: "var(--bg)",
              borderRadius: 10,
            }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", fontFamily: "'Fraunces', serif" }}>
                {agg.avg_overall.toFixed(1)}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                / 5 from {agg.rating_count} rating{agg.rating_count !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Category bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <FillBar label="Flakiness" value={agg.avg_flakiness} size="sm" />
              <FillBar label="Butteriness" value={agg.avg_butteriness} size="sm" />
              <FillBar label="Freshness" value={agg.avg_freshness} size="sm" />
              <FillBar label="Size & Value" value={agg.avg_size_value} size="sm" />
            </div>
          </>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "8px 0",
            fontSize: 13,
            color: "var(--text-muted)",
            fontStyle: "italic",
          }}>
            No ratings yet
          </div>
        )}
      </div>
    </Popup>
  );
}

function HoverTooltip({ bakery }) {
  const score = bakery.avg_score;
  const hasScore = score != null && score > 0;

  return (
    <Popup
      longitude={bakery.longitude}
      latitude={bakery.latitude}
      anchor="bottom"
      offset={24}
      closeButton={false}
      closeOnClick={false}
      className="bakery-tooltip"
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "2px 0",
        whiteSpace: "nowrap",
      }}>
        <span style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text)",
        }}>
          {bakery.name}
        </span>
        {hasScore && (
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--accent)",
          }}>
            {score.toFixed(1)}
          </span>
        )}
      </div>
    </Popup>
  );
}

export default function MapView({ ref, bakeries, onBakeryClick, selectedBakery, bakeryDetail, detailLoading, highlightedBakeryId }) {
  const mapRef = useRef(null);
  const [hoveredBakery, setHoveredBakery] = useState(null);
  const mappable = useMemo(
    () => bakeries.filter((b) => b.latitude != null && b.longitude != null),
    [bakeries]
  );

  useImperativeHandle(ref, () => ({
    flyToBakery(bakery) {
      if (!mapRef.current || bakery?.latitude == null) return;
      mapRef.current.flyTo({
        center: [bakery.longitude, bakery.latitude],
        zoom: 14,
        duration: 600,
      });
    },
  }), []);

  const handleHover = useCallback((bakery) => {
    setHoveredBakery(bakery);
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredBakery(null);
  }, []);

  const handleClick = useCallback((bakery) => {
    setHoveredBakery(null);
    onBakeryClick(bakery);
  }, [onBakeryClick]);

  const handleClose = useCallback(() => {
    onBakeryClick(null);
  }, [onBakeryClick]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        ...BOSTON_CENTER,
        zoom: 12.5,
        pitch: 0,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
      attributionControl={false}
      onClick={() => onBakeryClick(null)}
    >
      <NavigationControl position="bottom-right" showCompass={false} />
      {mappable.map((b) => (
        <BakeryMarker
          key={b.id}
          bakery={b}
          onHover={handleHover}
          onLeave={handleLeave}
          onClick={handleClick}
          isHighlighted={b.id === highlightedBakeryId}
        />
      ))}

      {/* Hover tooltip — only when no popup is open for that bakery */}
      {hoveredBakery && (!selectedBakery || selectedBakery.id !== hoveredBakery.id) && (
        <HoverTooltip bakery={hoveredBakery} />
      )}

      {/* Click popup — full bakery profile */}
      {selectedBakery && selectedBakery.latitude != null && (
        <BakeryPopup
          bakery={selectedBakery}
          detail={bakeryDetail}
          loading={detailLoading}
          onClose={handleClose}
        />
      )}
    </Map>
  );
}
