import { useState, useEffect } from "react";
import "./dashboard.scss";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MonthCalendar from "../components/common/MonthCalendar.jsx";

import KpiCard from "../components/common/KpiCard.jsx";
import WorkoutTypePie from "../components/workouts/WorkoutTypePie.jsx";
import ExpenseCategoryBar from "../components/expenses/ExpenseCategoryBar.jsx";
import TodoList from "../components/todo/TodoList.jsx";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import MonthPicker from "../components/layout/MonthPicker.jsx";
import SectionCard from "../components/common/SectionCard.jsx";

import FabSpeedDial from "../components/common/FabSpeedDial.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";

import TierSelector from "../components/expenses/TierSelector.jsx";
import ProjectionTable from "../components/expenses/ProjectionTable.jsx";
import ExpenseTable from "../components/expenses/ExpenseTable.jsx";
import ExpenseDialog from "../components/expenses/ExpenseDialog.jsx";

import WorkoutTable from "../components/workouts/WorkoutTable.jsx";
import WorkoutDialog from "../components/workouts/WorkoutDialog.jsx";

import { useDashboard } from "../context/DashboardContext.jsx";
import { sumExpensesByCategory } from "../utils/rollups.js";
import { inMonth } from "../utils/date.js";

import { budgetByCategory, categoryOrder } from "../config/budget.js";




export default function Dashboard() {
  const { monthKey, setMonthKey, tier, setTier } = useDashboard();

  /* ======================
     Snackbar
  ====================== */
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  function showSnack(message, severity = "success") {
    setSnack({ open: true, message, severity });
  }

  /* ======================
     Helpers
  ====================== */
  const normalizeExpense = (e) => ({ ...e, id: e.id ?? e._id });
  const normalizeWorkout = (w) => ({ ...w, id: w.id ?? w._id });

  async function fetchExpenses() {
    const res = await fetch("/api/expenses");
    if (!res.ok) throw new Error(`GET /api/expenses failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(normalizeExpense);
  }

  async function fetchWorkouts() {
    const res = await fetch("/api/workouts");
    if (!res.ok) throw new Error(`GET /api/workouts failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(normalizeWorkout);
  }

  /* ======================
     State
  ====================== */
  // ✅ Both are DB source of truth now
  const [expenseRows, setExpenseRows] = useState([]);
  const [workoutRows, setWorkoutRows] = useState([]);

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isWorkoutDialogOpen, setIsWorkoutDialogOpen] = useState(false);

  /* ======================
   Load from API (STRICT)
====================== */
useEffect(() => {
  const load = async () => {
    try {
      const exp = await fetchExpenses();
      setExpenseRows(exp);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      setExpenseRows([]);
      showSnack("Failed to load expenses", "error");
    }

    try {
      const wo = await fetchWorkouts();
      setWorkoutRows(wo);
    } catch (err) {
      console.error("Failed to load workouts:", err);
      setWorkoutRows([]);
      showSnack("Failed to load workouts", "error");
    }
  };

  load();
}, []);


  

  /* ======================
     Todo List (localStorage ok)
  ====================== */
  const LS_TODO = "mydash:v1:todos";

  const [todos, setTodos] = useState(() => {
    const raw = localStorage.getItem(LS_TODO);
    return raw ? JSON.parse(raw) : [];
  });

  useEffect(() => {
    localStorage.setItem(LS_TODO, JSON.stringify(todos));
  }, [todos]);

  function addTodo(row) {
    setTodos((prev) => [row, ...prev]);
  }

  function updateTodo(updated) {
    setTodos((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function deleteTodo(id) {
    setTodos((prev) => prev.filter((r) => r.id !== id));
  }

  /* ======================
     CRUD - Expenses (API)
  ====================== */
  async function addExpense(row) {
    try {
      const payload = { ...row };
      delete payload.id;

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`POST /api/expenses failed: ${res.status}`);

      const created = normalizeExpense(await res.json());
      setExpenseRows((prev) => [...prev, created]);
      showSnack("Expense added", "success");
    } catch (err) {
      console.error(err);
      showSnack("Failed to add expense", "error");
    }
  }

  async function updateExpense(updated) {
    try {
      const id = updated.id ?? updated._id;
      if (!id) throw new Error("Missing expense id");

      const payload = { ...updated };
      delete payload.id;
      delete payload._id;

      const res = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`PUT /api/expenses/${id} failed: ${res.status}`);

      const saved = normalizeExpense(await res.json());
      setExpenseRows((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      showSnack("Expense updated", "info");
    } catch (err) {
      console.error(err);
      showSnack("Failed to update expense", "error");
    }
  }

  async function deleteExpense(id) {
    try {
      if (!id) return;

      const res = await fetch(`/api/expenses/${id}`, { 
        method: "DELETE",
        credentials: "include",
 });

      if (!res.ok && res.status !== 204) {
        throw new Error(`DELETE /api/expenses/${id} failed: ${res.status}`);
      }

      setExpenseRows((prev) => prev.filter((r) => r.id !== id));
      showSnack("Expense deleted", "warning");
    } catch (err) {
      console.error(err);
      showSnack("Failed to delete expense", "error");
    }
  }

  /* ======================
     CRUD - Workouts (API)
  ====================== */
  async function addWorkout(row) {
    try {
      const payload = { ...row };
      delete payload.id;

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`POST /api/workouts failed: ${res.status}`);

      const created = normalizeWorkout(await res.json());
      setWorkoutRows((prev) => [...prev, created]);
      showSnack("Workout added", "success");
    } catch (err) {
      console.error(err);
      showSnack("Failed to add workout", "error");
    }
  }

  async function updateWorkout(updated) {
    try {
      const id = updated.id ?? updated._id;
      if (!id) throw new Error("Missing workout id");

      const payload = { ...updated };
      delete payload.id;
      delete payload._id;

      const res = await fetch(`/api/workouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`PUT /api/workouts/${id} failed: ${res.status}`);

      const saved = normalizeWorkout(await res.json());
      setWorkoutRows((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      showSnack("Workout updated", "info");
    } catch (err) {
      console.error(err);
      showSnack("Failed to update workout", "error");
    }
  }

  async function deleteWorkout(id) {
    try {
      if (!id) return;

      const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });

      if (!res.ok && res.status !== 204) {
        throw new Error(`DELETE /api/workouts/${id} failed: ${res.status}`);
      }

      setWorkoutRows((prev) => prev.filter((r) => r.id !== id));
      showSnack("Workout deleted", "warning");
    } catch (err) {
      console.error(err);
      showSnack("Failed to delete workout", "error");
    }
  }

  /* ======================
     Shared Confirm Dialog
  ====================== */
  const [confirm, setConfirm] = useState({ open: false, id: null, kind: "expense" });

  function requestDeleteExpense(id) {
    setConfirm({ open: true, id, kind: "expense" });
  }

  function requestDeleteWorkout(id) {
    setConfirm({ open: true, id, kind: "workout" });
  }

  async function confirmDelete() {
    if (!confirm.id) return;

    if (confirm.kind === "expense") await deleteExpense(confirm.id);
    if (confirm.kind === "workout") await deleteWorkout(confirm.id);

    setConfirm({ open: false, id: null, kind: "expense" });
  }

  /* ======================
     Derived Data
  ====================== */
  const monthExpenses = expenseRows.filter((e) => inMonth(e.date, monthKey));
  const monthWorkouts = workoutRows.filter((w) => inMonth(w.date, monthKey));
  const actualByCat = sumExpensesByCategory(expenseRows, monthKey);

  /* ======================
     KPI
  ====================== */
  const totalSpend = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const topCat = (() => {
    const byCat = monthExpenses.reduce((acc, e) => {
      const k = e.category || "Other";
      acc[k] = (acc[k] || 0) + Number(e.amount || 0);
      return acc;
    }, {});
    return Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  })();

  const workoutCount = monthWorkouts.length;

  // Planned total based on selected tier
const plannedTotal = categoryOrder.reduce((sum, cat) => {
  const tierBudget = budgetByCategory?.[cat]?.[tier] ?? 0;
  return sum + Number(tierBudget);
}, 0);

// Variance: + = over budget, - = under budget
const spendVariance = plannedTotal - totalSpend;

const spendVarianceLabel =
  spendVariance >= 0
    ? `+฿${spendVariance.toLocaleString()}`
    : `-฿${Math.abs(spendVariance).toLocaleString()}`;

const spendVarianceSub = spendVariance >= 0 ? "Remaining" : "Over budget";
const spendVarianceIsBad = spendVariance < 0;

  /* ======================
   KPI – Active Days
====================== */

const activeDays = new Set(
  monthWorkouts.map((w) => w.date)
).size;

const daysInMonth = new Date(
  Number(monthKey.split("-")[0]),
  Number(monthKey.split("-")[1]),
  0
).getDate();


/* ======================
   Weekly Spend Breakdown
====================== */

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const weeklySpend = (() => {
  const map = {};

  monthExpenses.forEach((e) => {
    const d = new Date(e.date);
    const day = d.getDay(); // 0–6
    map[day] = (map[day] || 0) + Number(e.amount || 0);
  });

  return weekdayLabels.map((label, idx) => ({
    label,
    amount: map[idx] || 0,
  }));
})();

const maxWeeklySpend = Math.max(...weeklySpend.map((d) => d.amount), 1);





  return (
    <DashboardLayout
      title={
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span>Welcome Back Kyokrob</span>
          <span style={{ fontSize: 18, opacity: 0.65, marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
           <CalendarMonthIcon/> {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      }
      right={<MonthPicker value={monthKey} onChange={setMonthKey} />}
    >
      {/* KPI STRIP */}
      <div className="kpi-grid">
        <KpiCard
          title="Total Spend"
          value={`฿${totalSpend.toLocaleString()}`}
          sub="Includes all logged this month expenses"
        />
        <KpiCard
  title="Spend vs Plan"
  value={
    <span style={{ color: spendVarianceIsBad ? "#E3A6A1" : "#9FC8B3" }}>
      {spendVarianceLabel}
    </span>
  }
  sub={spendVarianceSub}
/>

<KpiCard title="Top Spending Category" value={topCat} sub="Highest total spend category this month" />
<KpiCard
  title="Active Days"
  value={`${activeDays} / ${daysInMonth}`}
  sub="Days with at least one workout in this month"
/>


      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* LEFT */}
        <div className="dashboard-col">
          <SectionCard title="Tracking Projection" right={<TierSelector value={tier} onChange={setTier} />}>
            <ProjectionTable tier={tier} actualByCat={actualByCat} />
          </SectionCard>

          <SectionCard title="Expenses (This Month)">
            <ExpenseTable
              rows={monthExpenses}
              onUpdate={updateExpense}
              onRequestDelete={requestDeleteExpense}
              pageSize={10}
            />
          </SectionCard>
          <SectionCard title="To-Do / Next Actions">
            <TodoList rows={todos} onAdd={addTodo} onUpdate={updateTodo} onDelete={deleteTodo} />
          </SectionCard>
         
        </div>

        {/* RIGHT */}
        <div className="dashboard-col">
          <SectionCard title="Calendar">
            <MonthCalendar monthKey={monthKey} expenses={monthExpenses} workouts={monthWorkouts} />
          </SectionCard>

          <SectionCard title="Workout Mix">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "8px 0 4px",
                gap: 6,
                color: "white",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>Distribution by workout type</div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>Based on logged workouts this month</div>
              <div style={{ marginTop: 8 }}>
                <WorkoutTypePie rows={monthWorkouts} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Expense Breakdown (This Month)">
  <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px 0 4px",
    gap: 6,
    color: "white",
  }}> <ExpenseCategoryBar rows={monthExpenses}  /></div>
</SectionCard>

 <SectionCard title="Spending by Day (This Month)">
  <div className="weekly-spend">
    {weeklySpend.map((d) => (
      <div key={d.label} className="weekly-spend__row">
        <div className="weekly-spend__label">{d.label}</div>

        <div className="weekly-spend__bar-wrap">
          <div
            className="weekly-spend__bar"
            style={{
              width: `${(d.amount / maxWeeklySpend) * 100}%`,
            }}
          />
        </div>

        <div className="weekly-spend__value">
          ฿{d.amount.toLocaleString()}
        </div>
      </div>
    ))}
  </div>
</SectionCard>
 


        </div>
      </div>

      {/* FULL WIDTH WORKOUT */}
      <div className="dashboard-full">
        <SectionCard title="Workout Tracker">
          <WorkoutTable
            rows={monthWorkouts}
            onUpdate={updateWorkout}
            onRequestDelete={requestDeleteWorkout}
            pageSize={10}
          />
        </SectionCard>
      </div>

      {/* Dialogs */}
      <ExpenseDialog
        open={isExpenseDialogOpen}
        onClose={() => setIsExpenseDialogOpen(false)}
        onAdd={addExpense}
      />

      <WorkoutDialog
        open={isWorkoutDialogOpen}
        onClose={() => setIsWorkoutDialogOpen(false)}
        onSubmit={addWorkout}
      />

      {/* Speed Dial */}
      <FabSpeedDial
        onAddExpense={() => setIsExpenseDialogOpen(true)}
        onAddWorkout={() => setIsWorkoutDialogOpen(true)}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.kind === "workout" ? "Delete workout?" : "Delete expense?"}
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirm({ open: false, id: null, kind: "expense" })}
        onConfirm={confirmDelete}
      />

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
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
