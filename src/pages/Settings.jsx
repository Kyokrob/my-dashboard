import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import SectionCard from "../components/common/SectionCard.jsx";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { apiFetch } from "../api/apiFetch.js";
import "./Settings.scss";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  async function handleReset(e) {
    e.preventDefault();
    if (currentPassword.length < 6) {
      setSnack({ open: true, message: "Current password must be at least 6 characters", severity: "error" });
      return;
    }
    if (password.length < 6) {
      setSnack({ open: true, message: "Password must be at least 6 characters", severity: "error" });
      return;
    }
    if (password !== confirm) {
      setSnack({ open: true, message: "Passwords do not match", severity: "error" });
      return;
    }

    try {
      setLoading(true);
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword: password }),
      });
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
      setSnack({ open: true, message: "Password updated", severity: "info" });
    } catch (err) {
      setSnack({ open: true, message: err.message || "Failed to update password", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout title="Settings">
      <div className="dashboard-full">
        <SectionCard title="Security">
          <form className="settings-form" onSubmit={handleReset}>
            <label className="settings-form__label" htmlFor="current-password">
              Current Password
            </label>
            <input
              id="current-password"
              className="settings-form__input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <label className="settings-form__label" htmlFor="new-password">
              New Password
            </label>
            <input
              id="new-password"
              className="settings-form__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <label className="settings-form__label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              className="settings-form__input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="settings-form__actions">
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </div>
          </form>
        </SectionCard>
      </div>

      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: "50%", transform: "translateY(-50%)" }}
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
    </DashboardLayout>
  );
}
