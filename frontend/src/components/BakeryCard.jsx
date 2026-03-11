import StarRating from "./StarRating";

export default function BakeryCard({ bakery, onDelete }) {
  return (
    <div className="group bg-white rounded-2xl border border-stone-200/60 p-5 hover:shadow-lg hover:shadow-stone-200/40 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 min-w-0 flex-1">
          <h3 className="font-display text-lg text-stone-800 truncate">{bakery.name}</h3>
          <p className="text-sm text-stone-400 truncate flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
            </svg>
            {bakery.address}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <StarRating rating={Math.round(bakery.avg_score || 0)} />
            {bakery.avg_score != null ? (
              <span className="text-sm font-semibold text-amber-600">{bakery.avg_score.toFixed(1)}</span>
            ) : (
              <span className="text-xs text-stone-300 italic">not yet rated</span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(bakery.id)}
          className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all cursor-pointer p-1.5 rounded-lg hover:bg-red-50"
          title="Remove"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
