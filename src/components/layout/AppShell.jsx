import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TableChartIcon from "@mui/icons-material/TableChart";
import InsightsIcon from "@mui/icons-material/Insights";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../context/AuthContext.jsx";
import { useDashboard } from "../../context/DashboardContext.jsx";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import "./AppShell.scss";
import FabSpeedDial from "../common/FabSpeedDial.jsx";
import ExpenseDialog from "../expenses/ExpenseDialog.jsx";
import WorkoutDialog from "../workouts/WorkoutDialog.jsx";
import DrinkDialog from "../drinks/DrinkDialog.jsx";
import { apiFetch } from "../../api/apiFetch.js";

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [settingsGateOpen, setSettingsGateOpen] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addWorkoutOpen, setAddWorkoutOpen] = useState(false);
  const [addDrinkOpen, setAddDrinkOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const { logout } = useAuth();
  const { lastUpdate, setLastUpdate, bumpRefresh } = useDashboard();
  const navigate = useNavigate();

  function showSnack(message, severity = "success") {
    setSnack({ open: true, message, severity });
  }

  async function verifySettingsAccess() {
    setSettingsError("");
    if (settingsPassword.length < 6) {
      setSettingsError("Password must be at least 6 characters");
      return;
    }
    try {
      setSettingsLoading(true);
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: settingsPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Verification failed");
      setSettingsGateOpen(false);
      setSettingsPassword("");
      navigate("/settings");
      setOpen(false);
    } catch (err) {
      setSettingsError(err.message || "Verification failed");
    } finally {
      setSettingsLoading(false);
    }
  }

  return (
    <div className={`shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className={`shell__sidebar ${collapsed ? "is-collapsed" : ""} ${open ? "is-open" : ""}`}>
        <div className="shell__brand">
          <button
            type="button"
            className="shell__logo shell__logo--button"
            onClick={() => setCollapsed((s) => !s)}
          >
            K
          </button>
          {!collapsed && <div className="shell__title">Kyokrob</div>}
          <button className="shell__close-btn" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="shell__nav">
          <NavLink to="/" end className="shell__link">
            <DashboardIcon fontSize="small" />
            {!collapsed && <span>Overview</span>}
          </NavLink>
          <NavLink to="/trackers" className="shell__link">
            <TableChartIcon fontSize="small" />
            {!collapsed && <span>Trackers</span>}
          </NavLink>
          <NavLink to="/report" className="shell__link">
            <InsightsIcon fontSize="small" />
            {!collapsed && <span>Insights</span>}
          </NavLink>
        </nav>

        <div className="shell__footer">
          <button
            type="button"
            className="shell__link shell__link--button"
            onClick={() => setSettingsGateOpen(true)}
          >
            <SettingsIcon fontSize="small" />
            {!collapsed && <span>Settings</span>}
          </button>
          <button
            className="shell__link shell__logout"
            onClick={() => setConfirmLogout(true)}
          >
            <LogoutIcon fontSize="small" />
            {!collapsed && <span>Logout</span>}
          </button>
          {!collapsed && (
            <div className="shell__update">
              <div className="shell__updateLabel">Powered by Coremind lab</div>
              <div className="shell__updateValue shell__updateValue--label">
                Last log updated{" "}
                {lastUpdate
                  ? new Date(lastUpdate).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </div>
            </div>
          )}
        </div>
      </aside>

      <button className="shell__menu" onClick={() => setOpen(true)}>
        ☰
      </button>
      {open && <div className="shell__backdrop" onClick={() => setOpen(false)} />}

      <div className="shell__content">{children}</div>

      <FabSpeedDial
        onAddExpense={() => setAddExpenseOpen(true)}
        onAddWorkout={() => setAddWorkoutOpen(true)}
        onAddDrink={() => setAddDrinkOpen(true)}
      />

      <ExpenseDialog
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        initial={null}
        onSubmit={async (row) => {
          try {
            const payload = { ...row };
            delete payload.id;
            await apiFetch("/api/expenses", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            setAddExpenseOpen(false);
            setLastUpdate(new Date().toISOString());
            bumpRefresh();
            showSnack("Expense added", "success");
          } catch (err) {
            showSnack(err.message || "Failed to add expense", "error");
          }
        }}
      />

      <WorkoutDialog
        open={addWorkoutOpen}
        onClose={() => setAddWorkoutOpen(false)}
        initial={null}
        onSubmit={async (row) => {
          try {
            const payload = { ...row };
            delete payload.id;
            await apiFetch("/api/workouts", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            setAddWorkoutOpen(false);
            setLastUpdate(new Date().toISOString());
            bumpRefresh();
            showSnack("Workout added", "success");
          } catch (err) {
            showSnack(err.message || "Failed to add workout", "error");
          }
        }}
      />

      <DrinkDialog
        open={addDrinkOpen}
        onClose={() => setAddDrinkOpen(false)}
        initial={null}
        onSubmit={async (row) => {
          try {
            const payload = { ...row };
            delete payload.id;
            await apiFetch("/api/drinks", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            setAddDrinkOpen(false);
            setLastUpdate(new Date().toISOString());
            bumpRefresh();
            showSnack("Drink log saved", "success");
          } catch (err) {
            showSnack(err.message || "Failed to save drink log", "error");
          }
        }}
      />

      <Dialog
        open={settingsGateOpen}
        onClose={() => {
          setSettingsGateOpen(false);
          setSettingsPassword("");
          setSettingsError("");
        }}
        PaperProps={{ style: { background: "#161A23", borderRadius: 14, padding: 4 } }}
      >
        <DialogTitle>Enter password</DialogTitle>
        <DialogContent>
          <div style={{ display: "grid", gap: 8, minWidth: 280 }}>
            <input
              type="password"
              value={settingsPassword}
              onChange={(e) => setSettingsPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: "10px 12px",
                color: "#fff",
                fontSize: 14,
              }}
            />
            {settingsError ? (
              <div style={{ fontSize: 12, color: "#E3A6A1" }}>{settingsError}</div>
            ) : null}
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSettingsGateOpen(false);
              setSettingsPassword("");
              setSettingsError("");
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={verifySettingsAccess} disabled={settingsLoading}>
            {settingsLoading ? "Checking..." : "Continue"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={confirmLogout}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: "50%", transform: "translateY(-50%)" }}
        onClose={(e, reason) => {
          if (reason === "clickaway") return;
          setConfirmLogout(false);
        }}
      >
        <Alert
          severity="info"
          variant="filled"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={async () => {
                setConfirmLogout(false);
                await logout();
                navigate("/login", { replace: true });
              }}
            >
              Confirm
            </Button>
          }
          sx={{ fontSize: 13 }}
        >
          Confirm logout?
        </Alert>
      </Snackbar>

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
    </div>
  );
}
