import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TableChartIcon from "@mui/icons-material/TableChart";
import InsightsIcon from "@mui/icons-material/Insights";
import HistoryIcon from "@mui/icons-material/History";
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
import { ShellProvider } from "./ShellContext.jsx";

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addWorkoutOpen, setAddWorkoutOpen] = useState(false);
  const [addDrinkOpen, setAddDrinkOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const { logout, user } = useAuth();
  const { lastUpdate, setLastUpdate, bumpRefresh } = useDashboard();
  const navigate = useNavigate();

  function showSnack(message, severity = "success") {
    setSnack({ open: true, message, severity });
  }

  function handleNavClick() {
    setOpen(false);
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
            {(user?.name || user?.email || "K").trim().charAt(0).toUpperCase()}
          </button>
          {!collapsed && <div className="shell__title">{user?.name || "Dashboard"}</div>}
          <button className="shell__close-btn" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="shell__nav">
          <NavLink to="/" end className="shell__link" onClick={handleNavClick}>
            <DashboardIcon fontSize="small" />
            {!collapsed && <span>Overview</span>}
          </NavLink>
          <NavLink to="/trackers" className="shell__link" onClick={handleNavClick}>
            <TableChartIcon fontSize="small" />
            {!collapsed && <span>Trackers</span>}
          </NavLink>
          <NavLink to="/report" className="shell__link" onClick={handleNavClick}>
            <InsightsIcon fontSize="small" />
            {!collapsed && <span>Insights</span>}
          </NavLink>
          <NavLink to="/activity" className="shell__link" onClick={handleNavClick}>
            <HistoryIcon fontSize="small" />
            {!collapsed && <span>Latest Activity</span>}
          </NavLink>
        </nav>

        <div className="shell__footer">
          <button
            type="button"
            className="shell__link shell__link--button"
            onClick={() => {
              navigate("/settings");
              setOpen(false);
            }}
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
                Last updated{" "}
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

      {open && <div className="shell__backdrop" onClick={() => setOpen(false)} />}

      <ShellProvider value={{ openMenu: () => setOpen(true) }}>
        <div className="shell__content">{children}</div>
      </ShellProvider>

      <FabSpeedDial
        initial={(user?.name || user?.email || "K").trim().charAt(0).toUpperCase()}
        onAddExpense={() => setAddExpenseOpen(true)}
        onAddWorkout={() => setAddWorkoutOpen(true)}
        onAddDrink={() => setAddDrinkOpen(true)}
      />
      <span className="tour-anchor tour-anchor--fab" data-tour="quick-add" />

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

      <Snackbar
        open={confirmLogout}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: 24 }}
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
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: 24 }}
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
