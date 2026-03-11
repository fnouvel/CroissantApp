import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginForm() {
  const { login, register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegistering) {
        await register(username, password);
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all shadow-sm shadow-stone-100";

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 select-none">🥐</div>
          <h1 className="font-display text-2xl text-stone-800">Croissant Club</h1>
          <p className="text-sm text-stone-400 mt-1">Your personal croissant journal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm shadow-stone-100/80 p-7">
          <h2 className="font-display text-lg text-stone-700 mb-5">
            {isRegistering ? "Create an account" : "Welcome back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-500 mb-1.5">Username</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-500 mb-1.5">Password</label>
              <input
                type="password"
                required
                autoComplete={isRegistering ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white font-medium text-sm py-3 px-4 rounded-full transition-all disabled:opacity-50 cursor-pointer hover:shadow-lg hover:shadow-stone-300/30 mt-2"
            >
              {submitting
                ? isRegistering
                  ? "Creating account..."
                  : "Logging in..."
                : isRegistering
                ? "Create Account"
                : "Log in"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-sm text-stone-400 hover:text-amber-700 transition-colors cursor-pointer"
            >
              {isRegistering
                ? "Already have an account? Log in"
                : "Need an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
