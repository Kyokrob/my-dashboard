import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./login.scss";

export default function Login() {
  const { login, bootstrap, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleBootstrap(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await bootstrap(email, password, name || "Admin");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__title">Admin Sign In</div>
        <div className="login__subtitle">Access your dashboard</div>

        <form className="login__form" onSubmit={handleLogin}>
          <label className="login__label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="login__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@email.com"
            required
          />

          <label className="login__label" htmlFor="login-pass">Password</label>
          <input
            id="login-pass"
            className="login__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <label className="login__label" htmlFor="login-name">Admin Name (first time only)</label>
          <input
            id="login-name"
            className="login__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Admin"
          />

          {error ? <div className="login__error">{error}</div> : null}

          <button className="login__btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button className="login__btn login__btn--ghost" onClick={handleBootstrap} disabled={loading}>
            Create Admin (first time)
          </button>
        </form>
      </div>
    </div>
  );
}
