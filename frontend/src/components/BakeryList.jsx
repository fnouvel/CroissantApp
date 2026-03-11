import BakeryCard from "./BakeryCard";

export default function BakeryList({ bakeries, loading, onDelete }) {
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-5 h-5 border-2 border-amber-100 border-t-amber-400 rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-stone-400">Loading your bakeries...</p>
      </div>
    );
  }

  if (bakeries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🥐</div>
        <p className="font-display text-xl text-stone-700">No bakeries yet</p>
        <p className="text-sm text-stone-400 mt-2 max-w-xs mx-auto">
          Your journal is empty.{" "}
          <a href="#add" className="text-amber-600 hover:text-amber-700 underline underline-offset-2 decoration-amber-300">Add your first bakery</a>{" "}
          and start tracking your favorite croissants.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl text-stone-800">Your bakeries</h2>
          <p className="text-sm text-stone-400 mt-0.5">All the spots you've been tracking</p>
        </div>
        <span className="text-xs text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
          {bakeries.length}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {bakeries.map((b) => (
          <BakeryCard key={b.id} bakery={b} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
