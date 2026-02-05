import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import "./login.scss";

export default function Login() {
  const { login, bootstrap, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    try {
      const flash = sessionStorage.getItem("flash");
      if (flash === "signed_out") {
        setSnack({ open: true, message: "Signed out", severity: "success" });
        sessionStorage.removeItem("flash");
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const message = err.message || "Login failed";
      setError(message);
      setSnack({ open: true, message, severity: "error" });
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
      const message = err.message || "Failed to create admin";
      setError(message);
      setSnack({ open: true, message, severity: "error" });
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
            placeholder="••••••••"
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
            placeholder="••••••••"
          />

          {error ? <div className="login__error">{error}</div> : null}

          <Button
            type="submit"
            disabled={loading}
            fullWidth
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <Button
            variant="outlined"
            onClick={handleBootstrap}
            disabled={loading}
            fullWidth
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Create Admin (first time)
          </Button>
        </form>
      </div>

      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={(e, reason) => {
          if (reason === "clickaway") return;
          setSnack((s) => ({ ...s, open: false }));
        }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ fontSize: 13 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
