import { useState, useEffect } from "react";
import { apiFetch } from "../api/apiFetch.js";
import "./Dashboard.scss";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
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
import DrinkDialog from "../components/drinks/DrinkDialog.jsx";
import DrinkTable from "../components/drinks/DrinkTable.jsx";
import DrinkLogsDialog from "../components/drinks/DrinkLogsDialog.jsx";

import { useDashboard } from "../context/DashboardContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { sumExpensesByCategory } from "../utils/rollups.js";
import { inMonth } from "../utils/date.js";

import { budgetByCategory, categoryOrder } from "../config/budget.js";




export default function Dashboard() {
  const { monthKey, setMonthKey, tier, setTier } = useDashboard();
  const { logout } = useAuth();

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
  const normalizeDrink = (d) => ({ ...d, id: d.id ?? d._id });

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

  /* ======================
     State
  ====================== */
  // ✅ Both are DB source of truth now
  const [expenseRows, setExpenseRows] = useState([]);
  const [workoutRows, setWorkoutRows] = useState([]);
  const [drinkRows, setDrinkRows] = useState([]);

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isWorkoutDialogOpen, setIsWorkoutDialogOpen] = useState(false);
  const [isDrinkDialogOpen, setIsDrinkDialogOpen] = useState(false);
  const [viewDrink, setViewDrink] = useState(null);
  const [editingDrink, setEditingDrink] = useState(null);
  const [drinkDelete, setDrinkDelete] = useState({ open: false, id: null });
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingWorkout, setEditingWorkout] = useState(null);

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

      try {
        const td = await fetchTodos();
        setTodos(td);
      } catch (err) {
        console.error("Failed to load todos:", err);
        setTodos([]);
        showSnack("Failed to load tasks", "error");
      }

      try {
        const dr = await fetchDrinks();
        setDrinkRows(dr);
      } catch (err) {
        console.error("Failed to load drinks:", err);
        setDrinkRows([]);
        showSnack("Failed to load drinks", "error");
      }
    };

    load();
  }, []);

  useEffect(() => {
    try {
      const flash = sessionStorage.getItem("flash");
      if (flash === "signed_in") {
        showSnack("Signed in", "success");
        sessionStorage.removeItem("flash");
      }
    } catch {
      // ignore storage errors
    }
  }, []);


  

  /* ======================
     Todo List (API)
  ====================== */
  const [todos, setTodos] = useState([]);
  const normalizeTodo = (t) => ({ ...t, id: t.id ?? t._id });

  async function fetchTodos() {
    const data = await apiFetch("/api/todos");
    if (!Array.isArray(data)) return [];
    return data.map(normalizeTodo);
  }

  async function addTodo(row) {
    try {
      const payload = { ...row };
      delete payload.id;
      const created = normalizeTodo(
        await apiFetch("/api/todos", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
      setTodos((prev) => [created, ...prev]);
      showSnack("Task added", "success");
    } catch (err) {
      console.error(err);
      showSnack("Failed to add task", "error");
    }
  }

  async function updateTodo(updated) {
    try {
      const id = updated.id ?? updated._id;
      if (!id) throw new Error("Missing todo id");

      const payload = { ...updated };
      delete payload.id;
      delete payload._id;
      payload.drank = true;

      const saved = normalizeTodo(
        await apiFetch(`/api/todos/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      );

      setTodos((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      showSnack("Task updated", "info");
    } catch (err) {
      console.error(err);
      showSnack("Failed to update task", "error");
    }
  }

  async function deleteTodo(id) {
    try {
      if (!id) return;
      await apiFetch(`/api/todos/${id}`, { method: "DELETE" });
      setTodos((prev) => prev.filter((r) => r.id !== id));
      showSnack("Task deleted", "warning");
    } catch (err) {
      console.error(err);
      showSnack("Failed to delete task", "error");
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
        if (exists) {
          return prev.map((d) => (d.date === created.date ? created : d));
        }
        return [created, ...prev];
      });
      showSnack("Drink log saved", "success");
    } catch (err) {
      console.error(err);
      showSnack("Failed to save drink log", "error");
    }
  }

  async function updateDrink(updated) {
    try {
      const id = updated.id ?? updated._id;
      if (!id) throw new Error("Missing drink id");

      const payload = { ...updated };
      delete payload.id;
      delete payload._id;

      const saved = normalizeDrink(
        await apiFetch(`/api/drinks/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      );

      setDrinkRows((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
      showSnack("Drink log updated", "info");
    } catch (err) {
      console.error(err);
      showSnack("Failed to update drink log", "error");
    }
  }

  async function deleteDrink(id) {
    try {
      if (!id) return;
      await apiFetch(`/api/drinks/${id}`, { method: "DELETE" });
      setDrinkRows((prev) => prev.filter((d) => d.id !== id));
      showSnack("Drink log deleted", "warning");
    } catch (err) {
      console.error(err);
      showSnack("Failed to delete drink log", "error");
    }
  }

  /* ======================
     CRUD - Expenses (API)
  ====================== */
  async function addExpense(row) {
  try {
    const payload = { ...row };
    delete payload.id;

    const created = normalizeExpense(
      await apiFetch("/api/expenses", {
        credentials: "include",
        method: "POST",
        body: JSON.stringify(payload),
      })
    );

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

    const saved = normalizeExpense(
      await apiFetch(`/api/expenses/${id}`, {
        credentials: "include",
        method: "PUT",
        body: JSON.stringify(payload),
      })
    );

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

    await apiFetch(`/api/expenses/${id}`, { 
      credentials: "include",
      method: "DELETE" });

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

    const created = normalizeWorkout(
      await apiFetch("/api/workouts", {
        credentials: "include",
        method: "POST",
        body: JSON.stringify(payload),
      })
    );

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

    const saved = normalizeWorkout(
      await apiFetch(`/api/workouts/${id}`, {
        credentials: "include",
        method: "PUT",
        body: JSON.stringify(payload),
      })
    );

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

    await apiFetch(`/api/workouts/${id}`, { 
      credentials: "include",
      method: "DELETE" });

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
  const monthDrinksAll = drinkRows.filter((d) => inMonth(d.date, monthKey));
  const now = new Date();
  const [curY, curM] = monthKey.split("-").map(Number);
  const isCurrentMonth = now.getFullYear() === curY && now.getMonth() + 1 === curM;
  const asOfDay = isCurrentMonth ? now.getDate() : new Date(curY, curM, 0).getDate();
  const monthDrinks = monthDrinksAll.filter((d) => {
    const day = Number(d.date.split("-")[2]);
    return day <= asOfDay;
  });
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
  const drinkingDays = monthDrinks.filter((d) => d.drank).length;
  const totalDays = asOfDay;
  const topReasons = (() => {
    const map = {};
    monthDrinks.forEach((d) => {
      (d.reasons || []).forEach((r) => {
        map[r] = (map[r] || 0) + 1;
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([r]) => r)
      .join(", ") || "-";
  })();

  const trendLabel = (() => {
    if (!monthDrinks.length) return "Stable";
    const splitDay = Math.max(1, Math.ceil(asOfDay / 2));
    const early = monthDrinks.filter((d) => Number(d.date.split("-")[2]) <= splitDay && d.drank);
    const recent = monthDrinks.filter((d) => Number(d.date.split("-")[2]) > splitDay && d.drank);
    const avg = (arr) =>
      arr.length ? arr.reduce((s, d) => s + Number(d.level || 1), 0) / arr.length : null;
    const earlyAvg = avg(early);
    const recentAvg = avg(recent);
    if (earlyAvg === null || recentAvg === null) return "Stable";
    const diff = recentAvg - earlyAvg;
    if (diff > 0.3) return "Heavier this month";
    if (diff < -0.3) return "Getting lighter";
    return "Stable";
  })();

  const reflectionPrompt = (() => {
    const prompts = [
      "Was drinking mostly intentional this month?",
      "Do you like how this month looks?",
      "Anything you’d change next month?",
    ];
    const seed = `${monthKey}`.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    return prompts[seed % prompts.length];
  })();

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
  value={`${activeDays} / ${asOfDay}`}
  sub="Days with at least one workout in this month"
  right={<span className="kpi__tag">out of {daysInMonth} days</span>}
/>


      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* LEFT */}
        <div className="dashboard-col">
          <SectionCard title="Tracking Projection" right={<TierSelector value={tier} onChange={setTier} />}>
            <ProjectionTable tier={tier} actualByCat={actualByCat} />
          </SectionCard>
          <SectionCard title="Drink Insights">
            <div className="drink-insights-grid">
              <div className="drink-card">
                <div className="drink-card__title">Drinking Days</div>
                <div className="drink-card__value">{drinkingDays} / {totalDays}</div>
                <div className="drink-card__sub">As of today</div>
              </div>
              <div className="drink-card">
                <div className="drink-card__title">Most Common Reason</div>
                <div className="drink-card__value">{topReasons}</div>
                <div className="drink-card__sub">This month</div>
              </div>
              <div className="drink-card">
                <div className="drink-card__title">Trend</div>
                <div className="drink-card__value">{trendLabel}</div>
                <div className="drink-card__sub">Early vs recent level</div>
              </div>
              <div className="drink-card">
                <div className="drink-card__title">Quick Reflection</div>
                <div className="drink-card__value">{reflectionPrompt}</div>
                <div className="drink-card__sub">No input required</div>
              </div>
            </div>
          </SectionCard>
          <SectionCard title="To-Do / Next Actions">
            <TodoList rows={todos} onAdd={addTodo} onUpdate={updateTodo} onDelete={deleteTodo} />
          </SectionCard>
        </div>

        {/* RIGHT */}
        <div className="dashboard-col">
          <SectionCard title="Calendar">
            <MonthCalendar
              monthKey={monthKey}
              expenses={monthExpenses}
              workouts={monthWorkouts}
              drinks={monthDrinksAll}
            />
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

      {/* FULL WIDTH DRINKS */}

      <div className="dashboard-full">
        <SectionCard title="Expenses (This Month)">
            <ExpenseTable
              rows={monthExpenses}
              onEdit={(row) => {
                setEditingExpense(row);
                setIsExpenseDialogOpen(true);
              }}
              pageSize={10}
            />
          </SectionCard>
      </div>
      <div className="dashboard-full">
        <SectionCard title="Drinking Tracker">
          <DrinkTable
            rows={monthDrinksAll}
            onEdit={(row) => {
              setEditingDrink(row);
              setIsDrinkDialogOpen(true);
            }}
            onDelete={deleteDrink}
            onView={(row) => setViewDrink(row)}
          />
        </SectionCard>
      </div>


      {/* FULL WIDTH WORKOUT */}
      <div className="dashboard-full">
        <SectionCard title="Workout Tracker">
      <WorkoutTable
            rows={monthWorkouts}
            onEdit={(row) => {
              setEditingWorkout(row);
              setIsWorkoutDialogOpen(true);
            }}
            pageSize={10}
          />
        </SectionCard>
      </div>

      {/* Dialogs */}
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

      <DrinkLogsDialog
        open={Boolean(viewDrink)}
        onClose={() => setViewDrink(null)}
        row={viewDrink}
      />

      <Dialog open={drinkDelete.open} onClose={() => setDrinkDelete({ open: false, id: null })}>
        <DialogTitle>Delete drink log?</DialogTitle>
        <DialogContent>
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDrinkDelete({ open: false, id: null })} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (drinkDelete.id) deleteDrink(drinkDelete.id);
              setDrinkDelete({ open: false, id: null });
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Speed Dial */}
      <FabSpeedDial
        onAddExpense={() => {
          setEditingExpense(null);
          setIsExpenseDialogOpen(true);
        }}
        onAddWorkout={() => {
          setEditingWorkout(null);
          setIsWorkoutDialogOpen(true);
        }}
        onAddDrink={() => setIsDrinkDialogOpen(true)}
        onLogout={logout}
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
