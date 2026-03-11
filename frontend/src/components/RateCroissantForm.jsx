import { useState } from "react";
import { createRating } from "../api";
import StarRating from "./StarRating";

export default function RateCroissantForm({ bakeries, onRated }) {
  const [bakeryId, setBakeryId] = useState("");
  const [score, setScore] = useState(0);
  const [notes, setNotes] = useState("");
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!bakeryId || score === 0) {
      setError("Please select a bakery and a rating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await createRating(bakeryId, {
        score,
        notes: notes || null,
        visited_at: visitedAt,
      });
      setScore(0);
      setNotes("");
      setBakeryId("");
      setSuccess(true);
      onRated();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm h-full">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Rate a Croissant</h2>
        <p className="text-sm text-slate-400 mt-0.5">How was your latest experience?</p>
      </div>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-2.5 rounded-xl border border-green-100">
          Rating saved!
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Bakery</label>
        <select
          required
          value={bakeryId}
          onChange={(e) => setBakeryId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        >
          <option value="">Select a bakery...</option>
          {bakeries.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Rating</label>
        <StarRating rating={score} onRate={setScore} interactive />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Flaky and buttery..."
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Date visited</label>
        <input
          type="date"
          value={visitedAt}
          onChange={(e) => setVisitedAt(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-200"
      >
        {submitting ? "Saving..." : "Save Rating"}
      </button>
    </form>
  );
}
