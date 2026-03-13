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

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-emoji">🥐</span>
          <h1 className="login-title">Croissant Club</h1>
          <p className="login-subtitle">Your personal croissant journal</p>
        </div>

        <div className="login-form-card">
          <h2 className="login-form-title">
            {isRegistering ? "Create an account" : "Welcome back"}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{
                background: "#FCEAE4",
                color: "#C2785A",
                fontSize: 13,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #F0D8C8",
              }}>
                {error}
              </div>
            )}

            <div className="field">
              <label>Username</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                required
                autoComplete={isRegistering ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 4, borderRadius: 100 }}
            >
              {submitting
                ? isRegistering ? "Creating account..." : "Logging in..."
                : isRegistering ? "Create Account" : "Log in"}
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
              className="link-btn"
            >
              {isRegistering ? "Already have an account? Log in" : "Need an account? Register"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--pebble)", marginTop: 24 }}>
          made with butter & love
        </p>
      </div>
    </div>
  );
}
