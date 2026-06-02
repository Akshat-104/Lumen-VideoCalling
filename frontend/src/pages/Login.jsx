import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { Video } from "lucide-react";
// import { login } from "../lib/auth.js";

export function Field({ label, type, value, onChange }) {
  return (
    <label style={{ display: "block" }}>
      <span className="field-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="field-input"
      />
    </label>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { 
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        // Save token in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user",JSON.stringify(data.user));
        // localStorage.setItem("userid" , data.user.id);
        navigate("/dashboard");
      }
     }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass"
        style={{ width: "100%", maxWidth: 440, padding: 36, borderRadius: 24 }}
      >
        <Link to="/" className="logo" style={{ marginBottom: 24 }}>
          <span className="logo-mark gradient-bg"><Video size={16} /></span>
          <span className="gradient-text">Lumen</span>
        </Link>

        <h1 style={{ fontSize: 28, margin: "16px 0 4px" }}>Welcome back</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>Sign in to start a call.</p>

        <form onSubmit={onSubmit} style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Password" type="password" value={password} onChange={setPassword} />
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-text">{error}</motion.p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={loading} className="btn btn-primary gradient-bg glow" style={{ width: "100%" }}>
            {loading ? "Signing in…" : "Sign in"}
          </motion.button>
        </form>

        <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 22, textAlign: "center" }}>
          No account? <Link to="/register" style={{ color: "var(--accent)" }}>Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
