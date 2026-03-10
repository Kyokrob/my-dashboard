import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import SectionCard from "../components/common/SectionCard.jsx";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import { apiFetch } from "../api/apiFetch.js";
import { useDashboard } from "../context/DashboardContext.jsx";
import { budgetByCategory, categoryOrder } from "../config/budget.js";
import { defaultWorkoutTypes } from "../config/workouts.js";
import "./Settings.scss";

export default function Settings() {
  const { budgets, setBudgets, workoutTypes, setWorkoutTypes } = useDashboard();
  const [tab, setTab] = useState("security");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetForm, setBudgetForm] = useState(budgets || budgetByCategory);
  const [workoutForm, setWorkoutForm] = useState(workoutTypes || defaultWorkoutTypes);
  const [newWorkout, setNewWorkout] = useState("");
  const [savingWorkouts, setSavingWorkouts] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    setBudgetForm(budgets || budgetByCategory);
  }, [budgets]);

  useEffect(() => {
    setWorkoutForm(workoutTypes || defaultWorkoutTypes);
  }, [workoutTypes]);

  const breadcrumbLabel = useMemo(() => {
    if (tab === "security") return "Security";
    if (tab === "budget") return "Budget";
    if (tab === "workouts") return "Workouts";
    return "Settings";
  }, [tab]);

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

  function updateBudget(cat, tier, value) {
    setBudgetForm((prev) => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [tier]: Number(value),
      },
    }));
  }

  async function saveBudgets() {
    try {
      setSavingBudget(true);
      const payload = { budgets: budgetForm };
      const res = await apiFetch("/api/budgets", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setBudgets(res?.budgets || budgetForm);
      setSnack({ open: true, message: "Budgets updated", severity: "success" });
    } catch (err) {
      setSnack({ open: true, message: err.message || "Failed to update budgets", severity: "error" });
    } finally {
      setSavingBudget(false);
    }
  }

  function addWorkoutType() {
    const value = newWorkout.trim();
    if (!value) return;
    if (workoutForm.some((w) => w.toLowerCase() === value.toLowerCase())) {
      setSnack({ open: true, message: "Workout already exists", severity: "error" });
      return;
    }
    setWorkoutForm((prev) => [...prev, value]);
    setNewWorkout("");
  }

  function removeWorkoutType(name) {
    setWorkoutForm((prev) => prev.filter((w) => w !== name));
  }

  async function saveWorkoutTypes() {
    try {
      setSavingWorkouts(true);
      const payload = { workoutTypes: workoutForm };
      const res = await apiFetch("/api/workout-types", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setWorkoutTypes(res?.workoutTypes || workoutForm);
      setSnack({ open: true, message: "Workout types updated", severity: "success" });
    } catch (err) {
      setSnack({ open: true, message: err.message || "Failed to update workouts", severity: "error" });
    } finally {
      setSavingWorkouts(false);
    }
  }

  return (
    <DashboardLayout title="Settings">
      <div className="settings-head">
        <Breadcrumbs aria-label="breadcrumb" className="settings-breadcrumbs">
          <span>Settings</span>
          <span>{breadcrumbLabel}</span>
        </Breadcrumbs>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          className="settings-tabs"
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab value="security" label="Security" />
          <Tab value="budget" label="Budget" />
          <Tab value="workouts" label="Workouts" />
        </Tabs>
      </div>

      <div className="dashboard-full">
        {tab === "security" ? (
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
        ) : tab === "budget" ? (
          <SectionCard title="Budget">
            <div className="budget-table">
              <div className="budget-table__head">
                <div>Category</div>
                <div className="right">Low</div>
                <div className="right">Mid</div>
                <div className="right">High</div>
              </div>
              {categoryOrder.map((cat) => (
                <div className="budget-table__row" key={cat}>
                  <div>{cat}</div>
                  {["low", "mid", "high"].map((tierKey) => (
                    <div className="right" key={`${cat}-${tierKey}`}>
                      <TextField
                        value={budgetForm?.[cat]?.[tierKey] ?? 0}
                        onChange={(e) => updateBudget(cat, tierKey, e.target.value)}
                        size="small"
                        type="number"
                        inputProps={{ min: 0 }}
                        sx={{
                          "& .MuiInputBase-root": {
                            color: "#fff",
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: "10px",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.12)",
                          },
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="settings-form__actions">
              <Button variant="contained" onClick={saveBudgets} disabled={savingBudget}>
                {savingBudget ? "Saving..." : "Save Budgets"}
              </Button>
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="Workout Types">
            <div className="workout-types">
              <div className="workout-types__add">
                <TextField
                  value={newWorkout}
                  onChange={(e) => setNewWorkout(e.target.value)}
                  size="small"
                  placeholder="Add workout type"
                  sx={{
                    flex: 1,
                    "& .MuiInputBase-root": {
                      color: "#fff",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: "10px",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.12)",
                    },
                  }}
                />
                <Button variant="contained" onClick={addWorkoutType}>
                  Add
                </Button>
              </div>
              <div className="workout-types__list">
                {workoutForm.map((w) => (
                  <div key={w} className="workout-types__item">
                    <span>{w}</span>
                    <Button size="small" color="error" onClick={() => removeWorkoutType(w)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <div className="settings-form__actions">
                <Button variant="contained" onClick={saveWorkoutTypes} disabled={savingWorkouts}>
                  {savingWorkouts ? "Saving..." : "Save Workouts"}
                </Button>
              </div>
            </div>
          </SectionCard>
        )}
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
