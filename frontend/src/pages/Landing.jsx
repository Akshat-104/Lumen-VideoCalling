import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, Users, Sparkles, ArrowRight, LayoutDashboard, LogOut } from "lucide-react";

export default function Landing() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the token exists in localStorage
    const token = localStorage.getItem("token"); // Change "token" to your exact key name if different
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove the token
    setIsLoggedIn(false);
    navigate("/"); // Redirect to landing page / refresh view
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Navigation */}
      <nav className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px" }}>
        <Link to="/" className="logo">
          <span className="logo-mark gradient-bg"><Video size={16} /></span>
          <span className="gradient-text">Lumen</span>
        </Link>
        <div style={{ display: "flex", gap: 12 }}>
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button onClick={handleLogout} className="btn btn-primary gradient-bg glow" style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer" }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Sign in</Link>
              <Link to="/register" className="btn btn-primary gradient-bg glow">Get started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Header */}
      <header className="container" style={{ textAlign: "center", padding: "80px 24px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, border: "1px solid var(--border)", fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
            <Sparkles size={14} /> Crystal-clear video, anywhere
          </div>
          <h1 style={{ fontSize: "clamp(40px, 7vw, 72px)", margin: 0, lineHeight: 1.05, fontWeight: 800 }}>
            Meetings that feel <span className="gradient-text">human.</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 18, maxWidth: 560, margin: "20px auto 0" }}>
            Spin up a room in seconds. No downloads, no friction — just talk.
          </p>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn btn-primary gradient-bg glow" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary gradient-bg glow" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  Start a call <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="btn btn-ghost">I already have an account</Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </header>

      {/* Features Section */}
      <section className="container" style={{ padding: "40px 24px 80px", display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {[
          { icon: <Video size={20} />, title: "HD Video", desc: "Adaptive quality that just works." },
          { icon: <Users size={20} />, title: "Unlimited rooms", desc: "Invite anyone with a link." },
          { icon: <Sparkles size={20} />, title: "Beautiful by default", desc: "Designed to delight." },
        ].map((f, i) => (
          <motion.div key={f.title} className="glass" style={{ padding: 24, borderRadius: 20 }}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}>
            <div className="gradient-bg" style={{ width: 40, height: 40, borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>{f.icon}</div>
            <h3 style={{ margin: "0 0 6px" }}>{f.title}</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>{f.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}