import { useState } from "react";
import { createBakery, createRating } from "../api";
import StarRating from "./StarRating";
import PlaceSearch from "./PlaceSearch";

export default function AddBakeryForm({ onAdded, token }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [score, setScore] = useState(0);
  const [notes, setNotes] = useState("");
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function handlePlaceSelect(place) {
    setName(place.name);
    setAddress(place.address);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const bakery = await createBakery(token, { name, address });
      if (score > 0) {
        await createRating(token, bakery.id, {
          score,
          notes: notes || null,
          visited_at: visitedAt,
        });
      }
      setName("");
      setAddress("");
      setScore(0);
      setNotes("");
      setVisitedAt(new Date().toISOString().slice(0, 10));
      setSuccess(true);
      onAdded();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all shadow-sm shadow-stone-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-stone-800">Add a new spot</h2>
        <p className="text-sm text-stone-400 mt-1">Found a bakery worth remembering? Jot it down here.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-600 text-sm px-4 py-3 rounded-xl border border-emerald-100 flex items-center gap-2">
          <span>✓</span>
          {score > 0 ? "Saved with your rating!" : "Bakery added!"}
        </div>
      )}

      <div className="space-y-3">
        <PlaceSearch onSelect={handlePlaceSelect} inputClass={inputClass} />

        <div>
          <label className="block text-sm font-medium text-stone-500 mb-1.5">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bakery name"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-500 mb-1.5">Address</label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address"
            className={inputClass}
          />
        </div>
      </div>

      <div className="border-t border-stone-100 pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-stone-500">How was the croissant?</label>
          {score > 0 && (
            <button
              type="button"
              onClick={() => { setScore(0); setNotes(""); }}
              className="text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              clear
            </button>
          )}
        </div>
        <StarRating rating={score} onRate={setScore} interactive />
        <div>
          <label className="block text-sm font-medium text-stone-500 mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Flaky, buttery, still warm from the oven..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-500 mb-1.5">Date visited</label>
          <input
            type="date"
            value={visitedAt}
            onChange={(e) => setVisitedAt(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-stone-800 hover:bg-stone-700 text-white font-medium text-sm py-3 px-4 rounded-full transition-all disabled:opacity-50 cursor-pointer hover:shadow-lg hover:shadow-stone-300/30"
      >
        {submitting ? "Saving..." : score > 0 ? "Save bakery & rating" : "Add bakery"}
      </button>
    </form>
  );
}
