import { useEffect, useState, Suspense, lazy } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";

import "./Trackers.scss";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import MonthPicker from "../components/layout/MonthPicker.jsx";
import SectionCard from "../components/common/SectionCard.jsx";

import ExpenseTable from "../components/expenses/ExpenseTable.jsx";
import ExpenseDialog from "../components/expenses/ExpenseDialog.jsx";
import WorkoutTable from "../components/workouts/WorkoutTable.jsx";
import WorkoutDialog from "../components/workouts/WorkoutDialog.jsx";
import DrinkTable from "../components/drinks/DrinkTable.jsx";
import DrinkDialog from "../components/drinks/DrinkDialog.jsx";
import DrinkLogsDialog from "../components/drinks/DrinkLogsDialog.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import { useAuth } from "../context/AuthContext.jsx";

import { apiFetch } from "../api/apiFetch.js";
import { useDashboard } from "../context/DashboardContext.jsx";
import { inMonth } from "../utils/date.js";

const WorkoutTypePie = lazy(() => import("../components/workouts/WorkoutTypePie.jsx"));
const ExpenseCategoryBar = lazy(() => import("../components/expenses/ExpenseCategoryBar.jsx"));

function DrinkLevelBars({ rows }) {
  const counts = [1, 2, 3, 4, 5].map((lvl) => ({
    level: lvl,
    count: rows.filter((r) => Number(r.level || 0) === lvl).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="drink-bars">
      {counts.map((c) => (
        <div key={c.level} className="drink-bars__row">
          <div className="drink-bars__label">L{c.level}</div>
          <div className="drink-bars__track">
            <div className="drink-bars__fill" style={{ width: `${(c.count / max) * 100}%` }} />
          </div>
          <div className="drink-bars__value">{c.count}</div>
        </div>
      ))}
    </div>
  );
}

export default function Trackers() {
  const { monthKey, setMonthKey, setLastUpdate, refreshKey } = useDashboard();
  const { logout } = useAuth();

  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  function showSnack(message, severity = "success") {
    setSnack({ open: true, message, severity });
  }

  const normalizeExpense = (e) => ({ ...e, id: e.id ?? e._id });
  const normalizeWorkout = (w) => ({ ...w, id: w.id ?? w._id });
  const normalizeDrink = (d) => ({ ...d, id: d.id ?? d._id });

  const [expenseRows, setExpenseRows] = useState([]);
  const [workoutRows, setWorkoutRows] = useState([]);
  const [drinkRows, setDrinkRows] = useState([]);
  const [loadingExp, setLoadingExp] = useState(true);
  const [loadingWo, setLoadingWo] = useState(true);
  const [loadingDr, setLoadingDr] = useState(true);

  const [editingExpense, setEditingExpense] = useState(null);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editingDrink, setEditingDrink] = useState(null);
  const [viewDrink, setViewDrink] = useState(null);

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isWorkoutDialogOpen, setIsWorkoutDialogOpen] = useState(false);
  const [isDrinkDialogOpen, setIsDrinkDialogOpen] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, id: null, kind: "expense" });
  const [drinkDelete, setDrinkDelete] = useState({ open: false, id: null });

  async function fetchExpenses() {
    const data = await apiFetch("/api/expenses");
    if (!Array.isArray(data)) return [];
    return data.map(normalizeExpense);
  }

  async function fetchWorkouts() {
    const data = await apiFetch("/api/workouts");
    if (!Array.isArray(data)) return [];
    return data.map(normalizeWorkout);
  }

  async function fetchDrinks() {
    const data = await apiFetch("/api/drinks");
    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrink);
  }

  function computeLastUpdate(exp, wo, dr) {
    const all = [...exp, ...wo, ...dr];
    const latest = all.reduce((max, item) => {
      const ts = item.updatedAt || item.createdAt || item.date;
      const time = ts ? new Date(ts).getTime() : 0;
      return time > max ? time : max;
    }, 0);
    if (latest) setLastUpdate(new Date(latest).toISOString());
  }

  useEffect(() => {
    const load = async () => {
      let exp = [];
      let wo = [];
      let dr = [];

      try {
        exp = await fetchExpenses();
        setExpenseRows(exp);
        setLoadingExp(false);
      } catch {
        showSnack("Failed to load expenses", "error");
        setLoadingExp(false);
      }

      try {
        wo = await fetchWorkouts();
        setWorkoutRows(wo);
        setLoadingWo(false);
      } catch {
        showSnack("Failed to load workouts", "error");
        setLoadingWo(false);
      }

      try {
        dr = await fetchDrinks();
        setDrinkRows(dr);
        setLoadingDr(false);
      } catch {
        showSnack("Failed to load drinks", "error");
        setLoadingDr(false);
      }

      computeLastUpdate(exp, wo, dr);
    };
    load();
  }, [refreshKey]);


  async function addExpense(row) {
    try {
      const payload = { ...row };
      delete payload.id;
      const created = normalizeExpense(
        await apiFetch("/api/expenses", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
      setExpenseRows((prev) => [...prev, created]);
      setLastUpdate(new Date().toISOString());
      showSnack("Expense added", "success");
    } catch {
      showSnack("Failed to add expense", "error");
    }
  }

  async function updateExpense(updated) {
    try {
      const id = updated.id ?? updated._id;
      if (!id) throw new Error();
      const payload = { ...updated };
      delete payload.id;
      delete payload._id;
      const saved = normalizeExpense(
        await apiFetch(`/api/expenses/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      );
      setExpenseRows((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      setLastUpdate(new Date().toISOString());
      showSnack("Expense updated", "info");
    } catch {
      showSnack("Failed to update expense", "error");
    }
  }

  async function deleteExpense(id) {
    try {
      await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
      setExpenseRows((prev) => prev.filter((r) => r.id !== id));
      setLastUpdate(new Date().toISOString());
      showSnack("Expense deleted", "warning");
    } catch {
      showSnack("Failed to delete expense", "error");
    }
  }

  async function addWorkout(row) {
    try {
      const payload = { ...row };
      delete payload.id;
      const created = normalizeWorkout(
        await apiFetch("/api/workouts", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
      setWorkoutRows((prev) => [...prev, created]);
      setLastUpdate(new Date().toISOString());
      showSnack("Workout added", "success");
    } catch {
      showSnack("Failed to add workout", "error");
    }
  }

  async function updateWorkout(updated) {
    try {
      const id = updated.id ?? updated._id;
      if (!id) throw new Error();
      const payload = { ...updated };
      delete payload.id;
      delete payload._id;
      const saved = normalizeWorkout(
        await apiFetch(`/api/workouts/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      );
      setWorkoutRows((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      setLastUpdate(new Date().toISOString());
      showSnack("Workout updated", "info");
    } catch {
      showSnack("Failed to update workout", "error");
    }
  }

  async function deleteWorkout(id) {
    try {
      await apiFetch(`/api/workouts/${id}`, { method: "DELETE" });
      setWorkoutRows((prev) => prev.filter((r) => r.id !== id));
      setLastUpdate(new Date().toISOString());
      showSnack("Workout deleted", "warning");
    } catch {
      showSnack("Failed to delete workout", "error");
    }
  }

  async function addDrink(row) {
    try {
      const payload = { ...row };
      delete payload.id;
      const created = normalizeDrink(
        await apiFetch("/api/drinks", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
      setDrinkRows((prev) => {
        const exists = prev.find((d) => d.date === created.date);
        if (exists) return prev.map((d) => (d.date === created.date ? created : d));
        return [created, ...prev];
      });
      setLastUpdate(new Date().toISOString());
      showSnack("Drink log saved", "success");
    } catch {
      showSnack("Failed to save drink log", "error");
    }
  }

  async function updateDrink(updated) {
    try {
      const id = updated.id ?? updated._id;
      if (!id) throw new Error();
      const payload = { ...updated };
      delete payload.id;
      delete payload._id;
      payload.drank = true;
      const saved = normalizeDrink(
        await apiFetch(`/api/drinks/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      );
      setDrinkRows((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
      setLastUpdate(new Date().toISOString());
      showSnack("Drink log updated", "info");
    } catch {
      showSnack("Failed to update drink log", "error");
    }
  }

  async function deleteDrink(id) {
    try {
      await apiFetch(`/api/drinks/${id}`, { method: "DELETE" });
      setDrinkRows((prev) => prev.filter((d) => d.id !== id));
      setLastUpdate(new Date().toISOString());
      showSnack("Drink log deleted", "warning");
    } catch {
      showSnack("Failed to delete drink log", "error");
    }
  }

  const monthExpenses = expenseRows.filter((e) => inMonth(e.date, monthKey));
  const monthWorkouts = workoutRows.filter((w) => inMonth(w.date, monthKey));
  const monthDrinks = drinkRows.filter((d) => inMonth(d.date, monthKey));

  return (
    <DashboardLayout
      title="Trackers"
      right={<MonthPicker value={monthKey} onChange={setMonthKey} />}
    >
      <div className="trackers-charts">
        <div className="theme-exp">
          <SectionCard title="Spending Mix">
            <div className="trackers-chart">
              {loadingExp ? (
                <Skeleton variant="rectangular" width="100%" height={180} />
              ) : monthExpenses.length ? (
                <Suspense fallback={<div className="trackers-chart__empty">Loading chart…</div>}>
                  <ExpenseCategoryBar rows={monthExpenses} />
                </Suspense>
              ) : (
                <div className="trackers-chart__empty">
                  No data yet. Log your first expense to see insights.
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="theme-wo">
          <SectionCard title="Training Mix">
            <div className="trackers-chart">
              {loadingWo ? (
                <Skeleton variant="rectangular" width="100%" height={180} />
              ) : monthWorkouts.length ? (
                <Suspense fallback={<div className="trackers-chart__empty">Loading chart…</div>}>
                  <WorkoutTypePie rows={monthWorkouts} />
                </Suspense>
              ) : (
                <div className="trackers-chart__empty">
                  No data yet. Log your first workout to see insights.
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="theme-drink">
          <SectionCard title="Drink Levels">
            <div className="trackers-chart">
              {loadingDr ? (
                <Skeleton variant="rectangular" width="100%" height={180} />
              ) : monthDrinks.length ? (
                <DrinkLevelBars rows={monthDrinks} />
              ) : (
                <div className="trackers-chart__empty">
                  No data yet. Log your first drink to see insights.
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="dashboard-full">
        <div className="theme-exp">
          <SectionCard title="Spending Tracker">
            <ExpenseTable
              rows={monthExpenses}
              loading={loadingExp}
              onEdit={(row) => {
                setEditingExpense(row);
                setIsExpenseDialogOpen(true);
              }}
              pageSize={10}
            />
          </SectionCard>
        </div>
      </div>

      <div className="dashboard-full">
        <div className="theme-wo">
          <SectionCard title="Training Tracker">
            <WorkoutTable
              rows={monthWorkouts}
              loading={loadingWo}
              onEdit={(row) => {
                setEditingWorkout(row);
                setIsWorkoutDialogOpen(true);
              }}
              pageSize={10}
            />
          </SectionCard>
        </div>
      </div>

      <div className="dashboard-full">
        <div className="theme-drink">
          <SectionCard title="Drinking Tracker">
            <DrinkTable
              rows={monthDrinks}
              loading={loadingDr}
              onEdit={(row) => {
                setEditingDrink(row);
                setIsDrinkDialogOpen(true);
              }}
              onDelete={deleteDrink}
              onView={(row) => setViewDrink(row)}
            />
          </SectionCard>
        </div>
      </div>

      <ExpenseDialog
        open={isExpenseDialogOpen}
        onClose={() => {
          setIsExpenseDialogOpen(false);
          setEditingExpense(null);
        }}
        initial={editingExpense}
        onDelete={
          editingExpense?.id || editingExpense?._id
            ? () => {
                setIsExpenseDialogOpen(false);
                setEditingExpense(null);
                setConfirm({ open: true, id: editingExpense.id ?? editingExpense._id, kind: "expense" });
              }
            : null
        }
        onSubmit={(row) => {
          if (editingExpense?.id || editingExpense?._id) return updateExpense({ ...editingExpense, ...row });
          return addExpense(row);
        }}
      />

      <WorkoutDialog
        open={isWorkoutDialogOpen}
        onClose={() => {
          setIsWorkoutDialogOpen(false);
          setEditingWorkout(null);
        }}
        initial={editingWorkout}
        onDelete={
          editingWorkout?.id || editingWorkout?._id
            ? () => {
                setIsWorkoutDialogOpen(false);
                setEditingWorkout(null);
                setConfirm({ open: true, id: editingWorkout.id ?? editingWorkout._id, kind: "workout" });
              }
            : null
        }
        onSubmit={(row) => {
          if (editingWorkout?.id || editingWorkout?._id) return updateWorkout({ ...editingWorkout, ...row });
          return addWorkout(row);
        }}
      />

      <DrinkDialog
        open={isDrinkDialogOpen}
        onClose={() => {
          setIsDrinkDialogOpen(false);
          setEditingDrink(null);
        }}
        initial={editingDrink}
        onDelete={
          editingDrink?.id || editingDrink?._id
            ? () => {
                setIsDrinkDialogOpen(false);
                setEditingDrink(null);
                setDrinkDelete({ open: true, id: editingDrink.id ?? editingDrink._id });
              }
            : null
        }
        onSubmit={(row) => {
          if (editingDrink?.id || editingDrink?._id) return updateDrink({ ...editingDrink, ...row });
          return addDrink(row);
        }}
      />

      <DrinkLogsDialog open={Boolean(viewDrink)} onClose={() => setViewDrink(null)} row={viewDrink} />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.kind === "workout" ? "Delete workout?" : "Delete expense?"}
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false, id: null, kind: "expense" })}
        onConfirm={() => {
          if (confirm.kind === "expense") deleteExpense(confirm.id);
          if (confirm.kind === "workout") deleteWorkout(confirm.id);
          setConfirm({ open: false, id: null, kind: "expense" });
        }}
      />

      <ConfirmDialog
        open={drinkDelete.open}
        title="Delete drink log?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setDrinkDelete({ open: false, id: null })}
        onConfirm={() => {
          if (drinkDelete.id) deleteDrink(drinkDelete.id);
          setDrinkDelete({ open: false, id: null });
        }}
      />

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

      {/* Speed dial lives in AppShell */}
    </DashboardLayout>
  );
}
