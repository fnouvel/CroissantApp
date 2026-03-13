import { useState, useRef, useEffect } from "react";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export default function PlaceSearch({ onSelect, inputClass }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState("");
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleChange(value) {
    setQuery(value);
    setSelectedDisplay("");
    clearTimeout(timerRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: value, format: "json", addressdetails: "1", limit: "5",
        });
        const res = await fetch(`${NOMINATIM_URL}?${params}`, {
          headers: { "Accept-Language": "en" },
        });
        const data = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function handleSelect(place) {
    const addr = place.address || {};
    const parts = [
      addr.house_number && addr.road ? `${addr.house_number} ${addr.road}` : addr.road,
      addr.city || addr.town || addr.village,
      addr.state,
    ].filter(Boolean);
    const shortAddress = parts.join(", ");
    const placeName = place.name && place.name !== addr.road
      ? place.name
      : place.display_name.split(",")[0];

    setQuery("");
    setSelectedDisplay(placeName);
    setOpen(false);
    setResults([]);
    onSelect({
      name: placeName,
      address: shortAddress || place.display_name,
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
    });
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Search for a place</label>
      <div className="relative">
        <input
          type="text"
          value={selectedDisplay || query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (selectedDisplay) { setQuery(selectedDisplay); setSelectedDisplay(""); }
            if (results.length > 0) setOpen(true);
          }}
          placeholder="Start typing a bakery name or address..."
          className={inputClass}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#D2DBCE] border-t-[#D27D56] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full bg-[var(--surface)] rounded-xl border border-[#D2DBCE]/60 shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--bg)] transition-colors cursor-pointer border-b border-[#D2DBCE]/40 last:border-0"
              >
                <p className="text-sm font-medium text-[var(--text)] truncate">
                  {r.name && r.name !== r.display_name.split(",")[0] ? r.name : r.display_name.split(",")[0]}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{r.display_name}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
