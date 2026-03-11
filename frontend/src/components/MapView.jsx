import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const BOSTON_CENTER = [42.36, -71.06];

export default function MapView({ bakeries }) {
  const mappable = bakeries.filter((b) => b.latitude && b.longitude);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl text-stone-800">Bakery map</h2>
          <p className="text-sm text-stone-400 mt-0.5">Your croissant spots, all in one place</p>
        </div>
        {mappable.length > 0 && (
          <span className="text-xs text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
            {mappable.length} {mappable.length === 1 ? "spot" : "spots"}
          </span>
        )}
      </div>
      <div className="rounded-2xl overflow-hidden shadow-lg shadow-stone-200/50 ring-1 ring-stone-200/50">
        <MapContainer
          center={BOSTON_CENTER}
          zoom={13}
          className="h-[500px] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png"
          />
          {mappable.map((b) => (
            <Marker key={b.id} position={[b.latitude, b.longitude]}>
              <Popup>
                <div className="text-sm">
                  <strong className="text-stone-800 font-semibold">{b.name}</strong>
                  <br />
                  <span className="text-stone-400">{b.address}</span>
                  {b.avg_score != null && (
                    <>
                      <br />
                      <span className="text-amber-500 font-medium">
                        {"★".repeat(Math.round(b.avg_score))}{"☆".repeat(5 - Math.round(b.avg_score))} {b.avg_score.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
