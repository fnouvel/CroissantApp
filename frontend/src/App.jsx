import { useState, useEffect, useCallback } from "react";
import { fetchBakeries, deleteBakery } from "./api";
import MapView from "./components/MapView";
import BakeryList from "./components/BakeryList";
import AddBakeryForm from "./components/AddBakeryForm";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginForm from "./components/LoginForm";

const NAV_LINKS = [
  { label: "Map", href: "#map" },
  { label: "Bakeries", href: "#bakeries" },
  { label: "New Visit", href: "#add" },
];

function AppContent() {
  const { accessToken, loading, logout } = useAuth();
  const [bakeries, setBakeries] = useState([]);
  const [bakeriesLoading, setBakeriesLoading] = useState(true);

  const loadBakeries = useCallback(async () => {
    if (!accessToken) return;
    setBakeriesLoading(true);
    try {
      setBakeries(await fetchBakeries(accessToken));
    } catch (err) {
      console.error(err);
    } finally {
      setBakeriesLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadBakeries();
  }, [loadBakeries]);

  async function handleDelete(id) {
    if (!confirm("Delete this bakery?")) return;
    try {
      await deleteBakery(accessToken, id);
      loadBakeries();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <p className="text-stone-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!accessToken) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-lg border-b border-amber-100/60">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
          <a href="#top" className="flex items-center gap-2.5 group">
            <span className="text-xl group-hover:rotate-12 transition-transform duration-300">🥐</span>
            <span className="font-display text-lg text-stone-800">Croissant Club</span>
          </a>
          <div className="flex items-center gap-0.5">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="px-3 py-1.5 text-sm text-stone-400 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
              >
                {label}
              </a>
            ))}
            <button
              onClick={logout}
              className="ml-2 px-3 py-1.5 text-sm text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50/30"></div>
        <div className="absolute top-10 right-10 text-8xl opacity-[0.06] rotate-12 select-none pointer-events-none">🥐</div>
        <div className="absolute bottom-5 left-16 text-6xl opacity-[0.04] -rotate-6 select-none pointer-events-none">🥐</div>
        <div className="relative max-w-4xl mx-auto px-6 py-20 md:py-24">
          <div className="max-w-lg">
            <p className="text-sm font-medium text-amber-600/70 mb-3 tracking-wide">Your personal croissant journal</p>
            <h1 className="font-display text-4xl md:text-5xl text-stone-800 leading-[1.15]">
              Every great croissant deserves to be remembered
            </h1>
            <p className="mt-4 text-base text-stone-400 leading-relaxed max-w-md">
              Track the bakeries you visit, rate the croissants you try, and find your way back to the ones worth returning for.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#map"
                className="inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium py-3 px-6 rounded-full transition-all hover:shadow-lg hover:shadow-stone-300/30"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Explore the map
              </a>
              <a
                href="#add"
                className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-800 text-sm font-medium py-3 px-6 rounded-full transition-all border border-stone-200 hover:border-stone-300 bg-white/60 hover:bg-white"
              >
                + Add a bakery
              </a>
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-amber-200/50 to-transparent"></div>
      </section>

      {/* Map */}
      <section id="map" className="max-w-4xl mx-auto px-6 pt-14 pb-10 scroll-mt-14">
        <MapView bakeries={bakeries} />
      </section>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent"></div>
      </div>

      {/* Bakeries */}
      <section id="bakeries" className="scroll-mt-14 pt-10 pb-14">
        <div className="max-w-4xl mx-auto px-6">
          <BakeryList bakeries={bakeries} loading={bakeriesLoading} onDelete={handleDelete} />
        </div>
      </section>

      {/* Add form */}
      <section id="add" className="relative scroll-mt-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/40 to-[#faf8f5]"></div>
        <div className="h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent"></div>
        <div className="relative max-w-4xl mx-auto px-6 py-14">
          <div className="max-w-md">
            <AddBakeryForm onAdded={loadBakeries} token={accessToken} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="h-px bg-gradient-to-r from-transparent via-stone-200/50 to-transparent"></div>
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-center gap-2 text-xs text-stone-300">
          <span>made with butter & love</span>
          <span>🥐</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
