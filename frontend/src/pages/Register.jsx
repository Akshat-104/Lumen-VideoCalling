import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { Video } from "lucide-react";
import axios from "axios";
// import { register } from "../lib/auth.js";
// import { Field } from "./Login.jsx";

export default function Register() {
  const navigate = useNavigate();
 const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { 
      const response = await axios.post("http://localhost:4444/api/register", formData);
      console.log("SignUp success:", response.data);
      navigate('/login');
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

        <h1 style={{ fontSize: 28, margin: "16px 0 4px" }}>Create your account</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>Free forever. No credit card.</p>

        <form onSubmit={onSubmit} style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "block" }}>
      <span className="field-label">Name</span>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        className="field-input"
      />
    </label>
    <label style={{ display: "block" }}>
      <span className="field-label">Email</span>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
        className="field-input"
      />
    </label>
    <label style={{ display: "block" }}>
      <span className="field-label">Password</span>
      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        required
        className="field-input"
      />
    </label>
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-text">{error}</motion.p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={loading} className="btn btn-primary gradient-bg glow" style={{ width: "100%" }}>
            {loading ? "Creating…" : "Create account"}
          </motion.button>
        </form>

        <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 22, textAlign: "center" }}>
          Already have one? <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
