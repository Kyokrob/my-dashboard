import { useState, useEffect, Suspense, lazy } from "react";
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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import PaymentsIcon from "@mui/icons-material/Payments";
import MonthCalendar from "../components/common/MonthCalendar.jsx";

import KpiCard from "../components/common/KpiCard.jsx";
const WorkoutTypePie = lazy(() => import("../components/workouts/WorkoutTypePie.jsx"));
const ExpenseCategoryBar = lazy(() => import("../components/expenses/ExpenseCategoryBar.jsx"));
const ExpenseCategoryPie = lazy(() => import("../components/expenses/ExpenseCategoryPie.jsx"));
import TodoList from "../components/todo/TodoList.jsx";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import MonthPicker from "../components/layout/MonthPicker.jsx";
import SectionCard from "../components/common/SectionCard.jsx";

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
  const { monthKey, setMonthKey, tier, setTier, setLastUpdate, refreshKey, budgets } = useDashboard();
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

  function computeLastUpdate(exp, wo, dr) {
    const all = [...exp, ...wo, ...dr];
    const latest = all.reduce((max, item) => {
      const ts = item.updatedAt || item.createdAt || item.date;
      const time = ts ? new Date(ts).getTime() : 0;
      return time > max ? time : max;
    }, 0);
    if (latest) setLastUpdate(new Date(latest).toISOString());
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
      let exp = [];
      let wo = [];
      let dr = [];
      try {
        exp = await fetchExpenses();
        setExpenseRows(exp);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      setExpenseRows([]);
      showSnack("Failed to load expenses", "error");
    }

      try {
        wo = await fetchWorkouts();
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
        dr = await fetchDrinks();
        setDrinkRows(dr);
      } catch (err) {
        console.error("Failed to load drinks:", err);
        setDrinkRows([]);
        showSnack("Failed to load drinks", "error");
      }

      computeLastUpdate(exp, wo, dr);
    };

    load();
  }, [refreshKey]);

  useEffect(() => {
    try {
      const flash = sessionStorage.getItem("flash");
      if (flash === "signed_in") {
        showSnack("Signed in", "info");
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
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
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

  const top3Cats = (() => {
    const byCat = monthExpenses.reduce((acc, e) => {
      const k = e.category || "Other";
      acc[k] = (acc[k] || 0) + Number(e.amount || 0);
      return acc;
    }, {});
    return Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k)
      .join(" · ") || "-";
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
      .slice(0, 1)
      .map(([r]) => r)
      .join(", ") || "-";
  })();

  const [prevY, prevM] = (() => {
    const d = new Date(curY, curM - 2, 1);
    return [d.getFullYear(), d.getMonth() + 1];
  })();
  const prevMonthKey = `${prevY}-${String(prevM).padStart(2, "0")}`;
  const prevMonthExpenses = expenseRows.filter((e) => inMonth(e.date, prevMonthKey));
  const prevMonthMTD = prevMonthExpenses
    .filter((e) => Number(e.date.split("-")[2]) <= asOfDay)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const thisMonthMTD = monthExpenses
    .filter((e) => Number(e.date.split("-")[2]) <= asOfDay)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const mtdPct = prevMonthMTD > 0 ? ((thisMonthMTD - prevMonthMTD) / prevMonthMTD) * 100 : null;
  const mtdLabel = mtdPct === null ? "—" : `${mtdPct > 0 ? "+" : ""}${mtdPct.toFixed(1)}% vs last month`;
  const mtdTone = mtdPct === null ? "neutral" : mtdPct > 0 ? "bad" : "good";
  const prevMonthSpendTotal = prevMonthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const spendChangePct =
    prevMonthSpendTotal > 0 ? ((totalSpend - prevMonthSpendTotal) / prevMonthSpendTotal) * 100 : null;
  const spendChangeLabel =
    spendChangePct === null ? "—" : `${spendChangePct > 0 ? "+" : ""}${spendChangePct.toFixed(1)}%`;
  const spendChangeTone = spendChangePct === null ? "neutral" : spendChangePct > 0 ? "bad" : "good";
  const avgSpendPerDrinkDay = drinkingDays
    ? totalSpend / drinkingDays
    : 0;

  const biggestCategoryIncrease = (() => {
    const sumByCat = (rows) =>
      rows.reduce((acc, e) => {
        const k = e.category || "Other";
        acc[k] = (acc[k] || 0) + Number(e.amount || 0);
        return acc;
      }, {});
    const cur = sumByCat(monthExpenses);
    const prev = sumByCat(prevMonthExpenses);
    const cats = new Set([...Object.keys(cur), ...Object.keys(prev)]);
    let bestCat = null;
    let bestDiff = 0;
    cats.forEach((k) => {
      const diff = (cur[k] || 0) - (prev[k] || 0);
      if (diff > bestDiff) {
        bestDiff = diff;
        bestCat = k;
      }
    });
    if (!bestCat || bestDiff <= 0) return { label: "No increase", sub: "Vs last month" };
    return { label: `${bestCat} +฿${Math.round(bestDiff).toLocaleString()}`, sub: "Vs last month" };
  })();
  const biggestIncreaseTone = biggestCategoryIncrease.label === "No increase" ? "neutral" : "bad";

  const categoryMomentum = (() => {
    const sumByCat = (rows) =>
      rows.reduce((acc, e) => {
        const k = e.category || "Other";
        acc[k] = (acc[k] || 0) + Number(e.amount || 0);
        return acc;
      }, {});
    const cur = sumByCat(monthExpenses);
    const prev = sumByCat(prevMonthExpenses);
    const topCats = Object.entries(cur)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);
    return topCats.map((cat) => {
      const curVal = cur[cat] || 0;
      const prevVal = prev[cat] || 0;
      if (prevVal <= 0 && curVal > 0) {
        return { cat, label: "New", tone: "neutral", arrow: "→" };
      }
      if (prevVal <= 0) {
        return { cat, label: "—", tone: "neutral", arrow: "→" };
      }
      const pct = ((curVal - prevVal) / prevVal) * 100;
      const arrow = pct > 0.5 ? "↑" : pct < -0.5 ? "↓" : "→";
      const tone = pct > 0.5 ? "bad" : pct < -0.5 ? "good" : "neutral";
      const label = `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`;
      return { cat, label, tone, arrow };
    });
  })();

  const drinkingDates = new Set(monthDrinksAll.filter((d) => d.drank).map((d) => d.date));
  const drinkDaySpend = monthExpenses.filter((e) => drinkingDates.has(e.date));
  const avgDrinkDaySpend = drinkDaySpend.length
    ? drinkDaySpend.reduce((s, e) => s + Number(e.amount || 0), 0) / new Set(drinkDaySpend.map((e) => e.date)).size
    : 0;

  const drinkingDaysPct = totalDays ? (drinkingDays / totalDays) * 100 : 0;
  const avgDrinkLevel = monthDrinksAll.filter((d) => d.drank).length
    ? monthDrinksAll.filter((d) => d.drank).reduce((s, d) => s + Number(d.level || 1), 0) /
      monthDrinksAll.filter((d) => d.drank).length
    : 0;

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
const budgetSource = budgets || budgetByCategory;

const plannedTotal = categoryOrder.reduce((sum, cat) => {
  const tierBudget = budgetSource?.[cat]?.[tier] ?? 0;
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

const daysInMonth = new Date(
  Number(monthKey.split("-")[0]),
  Number(monthKey.split("-")[1]),
  0
).getDate();

/* ======================
   Today Snapshot
====================== */

const todayExpenses = expenseRows.filter((e) => e.date === todayKey);
const todaySpend = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
const todayWorkouts = workoutRows.filter((w) => w.date === todayKey);
const todayWorkoutLabel = todayWorkouts[0]?.workoutType || (todayWorkouts.length ? "Workout" : "None");
const todayDrinks = drinkRows.filter((d) => d.date === todayKey && d.drank);
const todayDrinkLabel = todayDrinks.length ? "Yes" : "None";

/* ======================
   Run-Rate Forecast
====================== */

const daysPassed = Math.max(1, asOfDay);
const projectedSpend = (totalSpend / daysPassed) * daysInMonth;
const hasBudget = plannedTotal > 0;
const runRateStatus = !hasBudget
  ? "No budget"
  : projectedSpend <= plannedTotal
  ? "On track ✓"
  : "Over budget";
const runRateTone = !hasBudget ? "neutral" : projectedSpend <= plannedTotal ? "good" : "bad";
const RunRateIcon = !hasBudget
  ? InfoOutlinedIcon
  : projectedSpend <= plannedTotal
  ? CheckCircleOutlineIcon
  : WarningAmberIcon;

/* ======================
   Drinking Day Spend Multiplier
====================== */

const monthDrinkingDates = new Set(monthDrinksAll.filter((d) => d.drank).map((d) => d.date));
const drinkDayExpenses = monthExpenses.filter((e) => monthDrinkingDates.has(e.date));
const nonDrinkDayExpenses = monthExpenses.filter((e) => !monthDrinkingDates.has(e.date));
const drinkDayTotal = drinkDayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
const nonDrinkDayTotal = nonDrinkDayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
const drinkDayCount = new Set(drinkDayExpenses.map((e) => e.date)).size;
const nonDrinkDayCount = new Set(nonDrinkDayExpenses.map((e) => e.date)).size;
const avgSpendDrinkDay = drinkDayCount ? drinkDayTotal / drinkDayCount : 0;
const avgSpendNonDrinkDay = nonDrinkDayCount ? nonDrinkDayTotal / nonDrinkDayCount : 0;
const drinkSpendMultiplier =
  avgSpendNonDrinkDay > 0 ? avgSpendDrinkDay / avgSpendNonDrinkDay : null;


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
        <div className="kpi-today kpi--tall kpi--bottom theme-mix">
          <KpiCard
            title="Today Snapshot"
            value={
              <div className="kpi-today__rows">
                <div className="kpi-today__row">
                  <span className="kpi-today__label">
                    <PaymentsIcon fontSize="inherit" />
                    Spend
                  </span>
                  <span className="kpi-today__value">฿{Math.round(todaySpend).toLocaleString()}</span>
                </div>
                <div className="kpi-today__row">
                  <span className="kpi-today__label">
                    <FitnessCenterIcon fontSize="inherit" />
                    Workout
                  </span>
                  <span className={`kpi-today__value ${todayWorkouts.length ? "is-good" : "is-muted"}`}>
                    {todayWorkouts.length ? `${todayWorkoutLabel} ✓` : "None"}
                  </span>
                </div>
                <div className="kpi-today__row">
                  <span className="kpi-today__label">
                    <LocalBarIcon fontSize="inherit" />
                    Drink
                  </span>
                  <span className={`kpi-today__value ${todayDrinks.length ? "is-bad" : "is-good"}`}>
                    {todayDrinks.length ? "Yes" : "None"}
                  </span>
                </div>
              </div>
            }
            sub={new Date(todayKey).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          />
        </div>

        <div className="theme-exp kpi--short kpi--bottom">
          <KpiCard
            title="Category Momentum"
            value={
              <div className="kpi-momentum">
                {categoryMomentum.length ? (
                  categoryMomentum.map((row) => (
                    <div key={row.cat} className="kpi-momentum__row">
                      <span className="kpi-momentum__label">{row.cat}</span>
                      <span className={`kpi-momentum__value kpi-momentum__value--${row.tone}`}>
                        {row.arrow} {row.label}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="kpi-momentum__empty">No categories yet</div>
                )}
              </div>
            }
            sub="Top 3 categories"
          />
        </div>

        <div className="theme-exp kpi--wide">
          <KpiCard
            title="Spending by Day (This Month)"
            value={
              <div className="weekly-spend kpi-weekly">
                {weeklySpend.map((d) => (
                  <div key={d.label} className="weekly-spend__row">
                    <div className="weekly-spend__label">{d.label}</div>
                    <div className="weekly-spend__bar-wrap">
                      <div
                        className="weekly-spend__bar"
                        style={{ width: `${(d.amount / maxWeeklySpend) * 100}%` }}
                      />
                    </div>
                    <div className="weekly-spend__value">฿{d.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            }
          />
        </div>

      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* LEFT */}
        <div className="dashboard-col">
          <div className="theme-exp">
            <SectionCard title="Overview" right={<TierSelector value={tier} onChange={setTier} />}>
              <ProjectionTable tier={tier} actualByCat={actualByCat} budgets={budgetSource} />
            </SectionCard>
          </div>
          <div className="theme-exp">
            <SectionCard title="Run-Rate Forecast">
              <div className="runrate-card">
                <div>
                  <div className="runrate-card__label">Status</div>
                  <div className={`runrate-card__status runrate-card__status--${runRateTone}`}>
                    <RunRateIcon fontSize="small" />
                    {runRateStatus}
                  </div>
                  <div className="runrate-card__sub">
                    {hasBudget ? "Based on current monthly pace" : "Add a budget to see tracking"}
                  </div>
                </div>
                <div className="runrate-card__metrics">
                  <div>
                    <span>Monthly spend</span>
                    <span>฿{Math.round(totalSpend).toLocaleString()}</span>
                  </div>
                  <div>
                    <span>Projected end</span>
                    <span>฿{Math.round(projectedSpend).toLocaleString()}</span>
                  </div>
                  <div>
                    <span>Budget</span>
                    <span>{hasBudget ? `฿${Math.round(plannedTotal).toLocaleString()}` : "—"}</span>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="theme-drink">
            <SectionCard title="Drinking Day Spend Multiplier">
              <div className="multiplier-card">
                <div>
                  <div className="multiplier-card__label">On drinking days you spend</div>
                  <div className="multiplier-card__value">
                    {drinkSpendMultiplier ? `${drinkSpendMultiplier.toFixed(1)}× more` : "—"}
                  </div>
                  <div className="multiplier-card__sub">
                    {drinkSpendMultiplier ? "Compared with non‑drinking days" : "Not enough data yet"}
                  </div>
                </div>
                <div className="multiplier-card__metrics">
                  <div>
                    <span>Normal day avg</span>
                    <span>{avgSpendNonDrinkDay ? `฿${Math.round(avgSpendNonDrinkDay).toLocaleString()}` : "—"}</span>
                  </div>
                  <div>
                    <span>Drinking day avg</span>
                    <span>{avgSpendDrinkDay ? `฿${Math.round(avgSpendDrinkDay).toLocaleString()}` : "—"}</span>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="theme-exp">
            <SectionCard title="Monthly Insights">
              <div className="drink-insights-grid">
                <div className="drink-card theme-exp">
                  <div className="drink-card__title">Spend vs last month</div>
                  <div className={`drink-card__value drink-card__value--${spendChangeTone}`}>
                    {spendChangeLabel}
                </div>
                <div className="drink-card__sub">
                  {prevMonthSpendTotal
                    ? `Last month ฿${Math.round(prevMonthSpendTotal).toLocaleString()}`
                    : "No prior data"}
                </div>
              </div>
              <div className="drink-card theme-exp">
                <div className="drink-card__title">Biggest Increase (Category)</div>
                <div className={`drink-card__value drink-card__value--${biggestIncreaseTone}`}>
                  {biggestCategoryIncrease.label}
                </div>
                <div className="drink-card__sub">{biggestCategoryIncrease.sub}</div>
              </div>
              <div className="drink-card theme-exp">
                <div className="drink-card__title">Spend vs Plan</div>
                <div className="drink-card__value">
                  <span style={{ color: spendVarianceIsBad ? "#E3A6A1" : "#9FC8B3" }}>
                    {spendVarianceLabel}
                  </span>
                </div>
                <div className="drink-card__sub">{spendVarianceSub}</div>
              </div>
              <div className="drink-card theme-exp">
                <div className="drink-card__title">Total Spend</div>
                <div className="drink-card__value">฿{totalSpend.toLocaleString()}</div>
                <div className="drink-card__sub">Includes all logged this month expenses</div>
              </div>
            </div>
          </SectionCard>
          </div>
          
          <div className="theme-drink">
            <SectionCard title="Drink Insights">
              <div className="drink-insights-grid">
                <div className="drink-card theme-drink">
                  <div className="drink-card__title">Drinking Days</div>
                  <div className="drink-card__value">{drinkingDays} / {totalDays}</div>
                  <div className="drink-card__sub">As of today</div>
                </div>
                <div className="drink-card theme-drink">
                  <div className="drink-card__title">Most Common Reason</div>
                  <div className="drink-card__value">{topReasons}</div>
                  <div className="drink-card__sub">This month</div>
                </div>
                <div className="drink-card theme-drink">
                  <div className="drink-card__title">Avg Spend on Drinking Days</div>
                  <div className="drink-card__value">฿{Math.round(avgDrinkDaySpend).toLocaleString()}</div>
                  <div className="drink-card__sub">This month</div>
                </div>
                <div className="drink-card theme-drink">
                  <div className="drink-card__title">Avg Drink Level</div>
                  <div className="drink-card__value">{avgDrinkLevel ? avgDrinkLevel.toFixed(1) : "—"}</div>
                  <div className="drink-card__sub">This month</div>
                </div>
              </div>
            </SectionCard>
          </div>
          <div className="theme-neutral">
            <SectionCard title="To-Do / Next Actions">
              <TodoList rows={todos} onAdd={addTodo} onUpdate={updateTodo} onDelete={deleteTodo} />
            </SectionCard>
          </div>
        </div>

        {/* RIGHT */}
        <div className="dashboard-col">
          <div className="theme-neutral">
            <SectionCard title="Calendar">
              <MonthCalendar
                monthKey={monthKey}
                expenses={monthExpenses}
                workouts={monthWorkouts}
                drinks={monthDrinksAll}
              />
            </SectionCard>
          </div>

          

      <div className="theme-wo">
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
            {monthWorkouts.length ? (
              <Suspense fallback={<div style={{ opacity: 0.6, fontSize: 12 }}>Loading chart…</div>}>
                <WorkoutTypePie rows={monthWorkouts} />
              </Suspense>
            ) : (
              <div className="chart-empty">No data yet. Log your first workout to see insights.</div>
            )}
          </div>
        </div>
      </SectionCard>
      </div>

          

          

<div className="theme-exp">
<SectionCard title="Expense Mix (This Month)">
  <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px 0 4px",
    gap: 6,
    color: "white",
  }}>
    {monthExpenses.length ? (
      <Suspense fallback={<div style={{ opacity: 0.6, fontSize: 12 }}>Loading chart…</div>}>
        <ExpenseCategoryPie rows={monthExpenses} />
      </Suspense>
    ) : (
      <div className="chart-empty">No data yet. Log your first expense to see insights.</div>
    )}
  </div>
</SectionCard>
</div>

<div className="theme-exp">
<SectionCard title="Expense Breakdown (This Month)">
  <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px 0 4px",
    gap: 6,
    color: "white",
  }}>
    {monthExpenses.length ? (
      <Suspense fallback={<div style={{ opacity: 0.6, fontSize: 12 }}>Loading chart…</div>}>
        <ExpenseCategoryBar rows={monthExpenses} />
      </Suspense>
    ) : (
      <div className="chart-empty">No data yet. Log your first expense to see insights.</div>
    )}
  </div>
</SectionCard>
</div>


          
 


        </div>
      </div>

      {/* Snackbar */}
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
