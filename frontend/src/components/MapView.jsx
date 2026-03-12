import { useRef } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const BOSTON_CENTER = { longitude: -71.06, latitude: 42.36 };

function BakeryMarker({ bakery, onSelect }) {
  const score = bakery.avg_score;
  const hasScore = score != null && score > 0;

  return (
    <Marker
      longitude={bakery.longitude}
      latitude={bakery.latitude}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onSelect(bakery.id);
      }}
    >
      <div className="map-marker" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            boxShadow: "0 2px 8px rgba(0,0,0,.25)",
            border: "2px solid rgba(255,255,255,.8)",
            background: hasScore ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          {hasScore ? score.toFixed(1) : "🥐"}
        </div>
      </div>
    </Marker>
  );
}

export default function MapView({ bakeries, onBakerySelect }) {
  const mapRef = useRef(null);
  const mappable = bakeries.filter((b) => b.latitude && b.longitude);

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
    >
      <NavigationControl position="bottom-right" showCompass={false} />
      {mappable.map((b) => (
        <BakeryMarker key={b.id} bakery={b} onSelect={onBakerySelect} />
      ))}
    </Map>
  );
}
