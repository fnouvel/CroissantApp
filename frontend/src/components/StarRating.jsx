export default function StarRating({ rating, onRate, interactive = false }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          className={`text-lg leading-none ${interactive ? "cursor-pointer hover:scale-125 active:scale-95" : "cursor-default"} transition-all duration-150 ${
            star <= (rating || 0) ? "text-amber-400 drop-shadow-[0_1px_2px_rgba(217,164,6,0.3)]" : "text-stone-200"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
