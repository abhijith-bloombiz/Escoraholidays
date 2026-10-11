import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    if (!result.ok) {
      setError("Invalid username or password.");
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f1a12",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        padding: "48px 40px",
        background: "#162c1f",
        border: "1px solid rgba(203,171,110,0.15)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "32px",
            fontWeight: 300,
            color: "#f0ebe0",
            letterSpacing: "0.05em",
          }}>
            Escora
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            letterSpacing: "0.3em",
            color: "#cbab6e",
            textTransform: "uppercase",
            marginTop: "6px",
          }}>
            Admin Portal
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#cbab6e",
              marginBottom: "8px",
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(203,171,110,0.2)",
                color: "#f0ebe0",
                fontFamily: "'Manrope', sans-serif",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(203,171,110,0.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(203,171,110,0.2)"}
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{
              display: "block",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#cbab6e",
              marginBottom: "8px",
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(203,171,110,0.2)",
                color: "#f0ebe0",
                fontFamily: "'Manrope', sans-serif",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(203,171,110,0.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(203,171,110,0.2)"}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: "20px",
              padding: "10px 14px",
              background: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.3)",
              color: "#fca5a5",
              fontFamily: "'Manrope', sans-serif",
              fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "rgba(203,171,110,0.4)" : "#cbab6e",
              border: "none",
              color: "#0f1a12",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{
          marginTop: "32px",
          paddingTop: "24px",
          borderTop: "1px solid rgba(203,171,110,0.1)",
          textAlign: "center",
          fontFamily: "'Manrope', sans-serif",
          fontSize: "12px",
          color: "rgba(240,235,224,0.3)",
        }}>
          Escora · Private Portal · Kochi, Kerala
        </div>
      </div>
    </div>
  );
}
