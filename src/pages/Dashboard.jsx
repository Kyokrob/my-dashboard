import { useState, useEffect, Suspense, lazy } from "react";
import { apiFetch } from "../api/apiFetch.js";
import "./Dashboard.scss";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import LinearProgress from "@mui/material/LinearProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
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
import CoachTour from "../components/common/CoachTour.jsx";
import MonthlyLineChart from "../components/insights/MonthlyLineChart.jsx";

import { useDashboard } from "../context/DashboardContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { sumExpensesByCategory } from "../utils/rollups.js";
import { inMonth } from "../utils/date.js";
import { useNavigate } from "react-router-dom";
import { readCache, writeCache } from "../utils/cache.js";

import { budgetByCategory } from "../config/budget.js";

const MobileSectionCard = ({ collapsible = true, ...props }) => (
  <SectionCard collapsible={collapsible} collapsibleOnMobile {...props} />
);

export default function Dashboard() {
  const { monthKey, setMonthKey, tier, setTier, setLastUpdate, refreshKey, budgets, expenseCategories } =
    useDashboard();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const skeletonProps = { sx: { bgcolor: "rgba(255, 255, 255, 0.08)" } };

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
  const [loadingData, setLoadingData] = useState(true);

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isWorkoutDialogOpen, setIsWorkoutDialogOpen] = useState(false);
  const [isDrinkDialogOpen, setIsDrinkDialogOpen] = useState(false);
  const [viewDrink, setViewDrink] = useState(null);
  const [editingDrink, setEditingDrink] = useState(null);
  const [drinkDelete, setDrinkDelete] = useState({ open: false, id: null });
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [expenseChartView, setExpenseChartView] = useState("mix");
  const [bodyChartView, setBodyChartView] = useState("weight");

  /* ======================
   Load from API (STRICT)
====================== */
  useEffect(() => {
    const userKey = user?.id || "guest";
    const expKey = `cache:${userKey}:expenses`;
    const woKey = `cache:${userKey}:workouts`;
    const drKey = `cache:${userKey}:drinks`;
    const tdKey = `cache:${userKey}:todos`;
    const expCache = readCache(expKey);
    const woCache = readCache(woKey);
    const drCache = readCache(drKey);
    const tdCache = readCache(tdKey);
    const hasCache = Boolean(expCache || woCache || drCache || tdCache);

    if (expCache) setExpenseRows(expCache);
    if (woCache) setWorkoutRows(woCache);
    if (drCache) setDrinkRows(drCache);
    if (tdCache) setTodos(tdCache);
    if (hasCache) {
      computeLastUpdate(expCache || [], woCache || [], drCache || []);
      setLoadingData(false);
    }

    const load = async () => {
      setLoadingData(!hasCache);
      let exp = [];
      let wo = [];
      let dr = [];
      try {
        exp = await fetchExpenses();
        setExpenseRows(exp);
        writeCache(expKey, exp);
      } catch (err) {
        console.error("Failed to load expenses:", err);
        if (!expCache) {
          setExpenseRows([]);
          showSnack("Failed to load expenses", "error");
        }
      }

      try {
        wo = await fetchWorkouts();
        setWorkoutRows(wo);
        writeCache(woKey, wo);
      } catch (err) {
        console.error("Failed to load workouts:", err);
        if (!woCache) {
          setWorkoutRows([]);
          showSnack("Failed to load workouts", "error");
        }
      }

      try {
        const td = await fetchTodos();
        setTodos(td);
        writeCache(tdKey, td);
      } catch (err) {
        console.error("Failed to load todos:", err);
        if (!tdCache) {
          setTodos([]);
          showSnack("Failed to load tasks", "error");
        }
      }

      try {
        dr = await fetchDrinks();
        setDrinkRows(dr);
        writeCache(drKey, dr);
      } catch (err) {
        console.error("Failed to load drinks:", err);
        if (!drCache) {
          setDrinkRows([]);
          showSnack("Failed to load drinks", "error");
        }
      }

      computeLastUpdate(exp, wo, dr);
      setLoadingData(false);
    };

    load();
  }, [refreshKey, user?.id]);

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
  const monthExpenses = expenseRows.filter((e) => inMonth(e.date || e.createdAt || e.updatedAt, monthKey));
  const monthWorkouts = workoutRows.filter((w) => inMonth(w.date || w.createdAt || w.updatedAt, monthKey));
  const monthDrinksAll = drinkRows.filter((d) => inMonth(d.date || d.createdAt || d.updatedAt, monthKey));
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
  const prevMonthWorkouts = workoutRows.filter((w) => inMonth(w.date || w.createdAt || w.updatedAt, prevMonthKey));
  const workoutDeltaPct = prevMonthWorkouts.length
    ? ((workoutCount - prevMonthWorkouts.length) / prevMonthWorkouts.length) * 100
    : null;
  const workoutDeltaLabel =
    workoutDeltaPct === null
      ? "No prior data"
      : `${workoutDeltaPct > 0 ? "+" : ""}${workoutDeltaPct.toFixed(0)}% vs last month`;
  const workoutDeltaTone =
    workoutDeltaPct === null ? "neutral" : workoutDeltaPct >= 0 ? "good" : "bad";
  const prevMonthExpenses = expenseRows.filter((e) => inMonth(e.date || e.createdAt || e.updatedAt, prevMonthKey));
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
const budgetCategories = Object.keys(budgetSource || {});
const activeExpenseCategories =
  expenseCategories?.filter((c) => c.enabled !== false).map((c) => c.label) || [];
const plannedCategories = activeExpenseCategories.length ? activeExpenseCategories : budgetCategories;

const plannedTotal = plannedCategories.reduce((sum, cat) => {
  const tierBudget = budgetSource?.[cat]?.[tier] ?? 0;
  return sum + Number(tierBudget);
}, 0);

const categoryMomentum = (() => {
  const topCats = plannedCategories
    .map((cat) => [cat, Number(actualByCat?.[cat] || 0)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  return topCats.map((cat) => {
    const actual = Number(actualByCat?.[cat] || 0);
    const budget = Number(budgetSource?.[cat]?.[tier] ?? 0);
    if (!budget) {
      return { cat, label: "No budget", tone: "neutral", arrow: "→" };
    }
    if (!actual) {
      return { cat, label: "—", tone: "neutral", arrow: "→" };
    }
    const pct = ((actual - budget) / budget) * 100;
    const arrow = pct > 1 ? "↑" : pct < -1 ? "↓" : "→";
    const tone = pct > 1 ? "bad" : pct < -1 ? "good" : "neutral";
    const label = `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`;
    return { cat, label, tone, arrow };
  });
})();

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
   Onboarding
====================== */

const hasExpense = monthExpenses.length > 0;
const hasWorkout = monthWorkouts.length > 0;
const hasDrink = monthDrinksAll.length > 0;
const settingsKey = `onboarding:settings:${user?.id || "anon"}`;
const hasVisitedSettings =
  typeof window !== "undefined" && localStorage.getItem(settingsKey) === "true";

const msPerDay = 1000 * 60 * 60 * 24;
const onboardingStart = user?.onboardingStartAt || user?.createdAt;
const onboardingStartDate = onboardingStart ? new Date(onboardingStart) : null;
const daysSinceSignup = onboardingStartDate
  ? Math.floor((Date.now() - onboardingStartDate.getTime()) / msPerDay)
  : null;
const onboardingDaysLeft = daysSinceSignup === null ? null : Math.max(0, 3 - daysSinceSignup);
const showOnboarding = onboardingDaysLeft === null ? true : onboardingDaysLeft > 0;
const onboardingSteps = [
  {
    key: "expense",
    title: "Log your first expense",
    sub: "Track a purchase to unlock spending insights.",
    done: hasExpense,
    actionLabel: "Add",
    onClick: () => setIsExpenseDialogOpen(true),
  },
  {
    key: "workout",
    title: "Log your first workout",
    sub: "Add a workout to populate your activity stats.",
    done: hasWorkout,
    actionLabel: "Add",
    onClick: () => setIsWorkoutDialogOpen(true),
  },
  {
    key: "drink",
    title: "Log your first drink",
    sub: "Capture a drink day to start habit insights.",
    done: hasDrink,
    actionLabel: "Add",
    onClick: () => setIsDrinkDialogOpen(true),
  },
  {
    key: "insights",
    title: "Set your categories",
    sub: "Update expense, workout, and drink categories in Settings.",
    done: hasVisitedSettings,
    actionLabel: "Settings",
    onClick: () => {
      localStorage.setItem(settingsKey, "true");
      navigate("/settings");
    },
  },
];
const onboardingDoneCount = onboardingSteps.filter((step) => step.done).length;
const onboardingTotal = onboardingSteps.length;
const onboardingProgress =
  onboardingTotal === 0 ? 0 : Math.min(100, Math.round((onboardingDoneCount / onboardingTotal) * 100));

const daysPassed = Math.max(1, asOfDay);
const projectedSpend = (totalSpend / daysPassed) * daysInMonth;
const hasBudget = plannedTotal > 0;
const runRateStatus = !hasBudget
  ? "No budget"
  : projectedSpend <= plannedTotal
  ? "On track ✓"
  : "Over budget";
const runRateTone = !hasBudget ? "neutral" : projectedSpend <= plannedTotal ? "good" : "bad";
const avgDailySpend = totalSpend / daysPassed;
const budgetDaily = hasBudget ? plannedTotal / daysInMonth : 0;
const paceMultiplier = hasBudget && budgetDaily > 0 ? avgDailySpend / budgetDaily : null;
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

const topWorkoutTypes = (() => {
  const map = monthWorkouts.reduce((acc, w) => {
    const key = w.workoutType || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => ({ type, count }));
})();

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const n = Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const bodyLogsThisMonth = monthWorkouts
  .filter((w) => {
    const weight = toNumber(w.weight ?? w.weightKg ?? w.bodyWeight);
    const fat = toNumber(w.bodyFat ?? w.body_fat ?? w.bodyfat);
    return weight > 0 || fat > 0;
  })
  .map((w) => ({
    ...w,
    _date: w.date || w.createdAt || w.updatedAt,
  }))
  .filter((w) => w._date)
  .sort((a, b) => new Date(a._date).getTime() - new Date(b._date).getTime());

const bodyDatesThisMonth = bodyLogsThisMonth.map((w) => new Date(w._date));
const bodyWeightSeriesThisMonth = bodyLogsThisMonth.map((w) => {
  const val = toNumber(w.weight ?? w.weightKg ?? w.bodyWeight);
  return val > 0 ? val : null;
});
const bodyFatSeriesThisMonth = bodyLogsThisMonth.map((w) => {
  const val = toNumber(w.bodyFat ?? w.body_fat ?? w.bodyfat);
  return val > 0 ? val : null;
});

/* ======================
   Run-Rate Forecast
====================== */





  return (
    <DashboardLayout
      title={`Welcome Back ${user?.name || "there"}`}
      right={<MonthPicker value={monthKey} onChange={setMonthKey} tourId="month-picker" />}
      titleInline
    >
      {/* KPI STRIP */}
      <div className="kpi-grid" data-tour="kpi">
        <div className="kpi-today kpi--tall kpi--bottom theme-mix" data-tour="today-snapshot">
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
            title="Run-Rate Forecast"
            value={
              <div className="runrate-card">
                <div>
                  <div className="runrate-card__label">Status</div>
                <div className={`runrate-card__status runrate-card__status--${runRateTone}`}>
                  <RunRateIcon fontSize="small" />
                  {runRateStatus}
                </div>
                <div className="runrate-card__pace">
                  Pace {paceMultiplier ? `${paceMultiplier.toFixed(1)}×` : "—"}
                </div>
                <div className="runrate-card__sub">
                  {hasBudget ? "Based on current monthly pace" : "Add a budget to see tracking"}
                </div>
              </div>
              <div className="runrate-card__metrics">
                <div>
                  <span>Daily average</span>
                  <span>฿{Math.round(avgDailySpend).toLocaleString()}</span>
                </div>
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
            }
          />
        </div>

      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* LEFT */}
        <div className="dashboard-col">
          {showOnboarding && (
            <div className="theme-neutral">
              <MobileSectionCard
                title="Getting Started"
                persistKey="dash-getting-started"
                right={
                <div className="onboard-progress">
                  Step {onboardingDoneCount}/{onboardingTotal}
                </div>
              }
            >
              <div className="onboard-subhead">
                Your lifestyle performance dashboard brings spending, workouts, and drinking habits into
                one place.
              </div>
              <LinearProgress
                variant="determinate"
                value={onboardingProgress}
                sx={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  margin: "6px 0 12px",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg, rgba(159, 200, 179, 0.95), rgba(116, 199, 191, 0.9))",
                    boxShadow: "0 0 8px rgba(159, 200, 179, 0.35)",
                  },
                }}
              />
              <div className="onboard-list">
                {onboardingSteps.map((step, index) => (
                  <div className={`onboard-item ${step.done ? "is-done" : ""}`} key={step.key}>
                    <div className="onboard-item__text">
                      <span className="onboard-step">Step {index + 1}</span>
                      <div className="onboard-title">{step.title}</div>
                      <div className="onboard-sub">{step.sub}</div>
                    </div>
                    {step.done ? (
                      <span className="onboard-status">
                        <CheckCircleOutlineIcon fontSize="small" />
                        Done
                      </span>
                    ) : (
                      <Button size="small" variant="contained" onClick={step.onClick}>
                        {step.actionLabel}
                      </Button>
                    )}
                  </div>
                ))}
                <div className="onboard-footnote">
                  {onboardingDaysLeft !== null
                    ? `This guide will hide in ${onboardingDaysLeft} ${
                        onboardingDaysLeft === 1 ? "day" : "days"
                      }.${onboardingDaysLeft === 1 && onboardingDoneCount < onboardingTotal
                        ? " Make sure to complete all the steps."
                        : ""}`
                    : "This guide will hide 3 days after signup."}
                </div>
              </div>
              </MobileSectionCard>
          </div>
          )}

          <div className="theme-exp">
            <MobileSectionCard
              title="Overview"
              right={<TierSelector value={tier} onChange={setTier} />}
              stackRightOnMobile={false}
              noWrapOnMobile
              togglePosition="right"
              persistKey="dash-overview"
            >
              <ProjectionTable
                tier={tier}
                actualByCat={actualByCat}
                budgets={budgetSource}
                categories={plannedCategories}
              />
            </MobileSectionCard>
          </div>

          <div className="theme-exp" data-tour="monthly-insights">
            <MobileSectionCard title="Monthly Summary" persistKey="dash-monthly-summary">
              {loadingData ? (
                <div className="drink-insights-grid">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div className="drink-card theme-exp" key={`monthly-skel-${index}`}>
                      <Skeleton variant="text" width="60%" height={16} {...skeletonProps} />
                      <Skeleton variant="text" width="50%" height={28} {...skeletonProps} />
                      <Skeleton variant="text" width="80%" height={14} {...skeletonProps} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="drink-insights-grid">
                  <div className="drink-card theme-exp">
                    <div className="drink-card__title">Total Spend</div>
                    <div className="drink-card__value">฿{totalSpend.toLocaleString()}</div>
                    <div className="drink-card__sub">Includes all logged this month expenses</div>
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
                    <div className="drink-card__title">Biggest Increase (Category)</div>
                    <div className={`drink-card__value drink-card__value--${biggestIncreaseTone}`}>
                      {biggestCategoryIncrease.label}
                    </div>
                    <div className="drink-card__sub">{biggestCategoryIncrease.sub}</div>
                  </div>
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
                </div>
              )}
            </MobileSectionCard>
          </div>

          <div className="theme-exp" data-tour="spending-by-day">
            <MobileSectionCard title="Spending by Day (This Month)" persistKey="dash-spending-by-day">
              {loadingData ? (
                <div className="weekly-spend">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <div key={`spend-skel-${index}`} className="weekly-spend__row">
                      <Skeleton variant="text" width={24} height={14} {...skeletonProps} />
                      <Skeleton variant="rectangular" height={10} {...skeletonProps} sx={{ borderRadius: 999 }} />
                      <Skeleton variant="text" width={60} height={14} {...skeletonProps} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="weekly-spend">
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
              )}
            </MobileSectionCard>
          </div>
          
          <div className="theme-drink">
            <MobileSectionCard title="Drink Insights" persistKey="dash-drink-insights">
              {loadingData ? (
                <div className="drink-insights-grid">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div className="drink-card theme-drink" key={`drink-skel-${index}`}>
                      <Skeleton variant="text" width="60%" height={16} {...skeletonProps} />
                      <Skeleton variant="text" width="50%" height={28} {...skeletonProps} />
                      <Skeleton variant="text" width="80%" height={14} {...skeletonProps} />
                    </div>
                  ))}
                </div>
              ) : (
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
              )}
            </MobileSectionCard>
          </div>

          <div className="theme-drink">
            <MobileSectionCard title="Drinking Day Spend Multiplier" persistKey="dash-drink-multiplier">
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
            </MobileSectionCard>
          </div>
          <div className="theme-neutral">
            <MobileSectionCard title="To-Do / Next Actions" persistKey="dash-todo">
              <TodoList rows={todos} onAdd={addTodo} onUpdate={updateTodo} onDelete={deleteTodo} />
            </MobileSectionCard>
          </div>
        </div>

        {/* RIGHT */}
        <div className="dashboard-col">
          <div className="theme-neutral" data-tour="calendar">
            <MobileSectionCard title="Calendar" collapsible={false} persistKey="dash-calendar">
              <MonthCalendar
                monthKey={monthKey}
                expenses={monthExpenses}
                workouts={monthWorkouts}
                drinks={monthDrinksAll}
              />
            </MobileSectionCard>
          </div>

          <div className="theme-exp" data-tour="expense-chart">
            <MobileSectionCard
              title={
                <div className="chart-card__title">
                  <span>Expenses (This Month)</span>
                  <div className="chart-toggle">
                    <Button
                      size="small"
                      variant={expenseChartView === "mix" ? "contained" : "outlined"}
                      onClick={() => setExpenseChartView("mix")}
                      className={`chart-toggle__btn ${expenseChartView === "mix" ? "is-active" : ""}`}
                    >
                      Mix
                    </Button>
                    <Button
                      size="small"
                      variant={expenseChartView === "breakdown" ? "contained" : "outlined"}
                      onClick={() => setExpenseChartView("breakdown")}
                      className={`chart-toggle__btn ${expenseChartView === "breakdown" ? "is-active" : ""}`}
                    >
                      Breakdown
                    </Button>
                  </div>
                </div>
              }
              persistKey="dash-expenses-chart"
            >
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
                {loadingData ? (
                  <Skeleton variant="rectangular" width="100%" height={180} {...skeletonProps} />
                ) : monthExpenses.length ? (
                  <Suspense fallback={<div style={{ opacity: 0.6, fontSize: 12 }}>Loading chart…</div>}>
                    {expenseChartView === "mix" ? (
                      <ExpenseCategoryPie rows={monthExpenses} />
                    ) : (
                      <ExpenseCategoryBar rows={monthExpenses} />
                    )}
                  </Suspense>
                ) : (
                  <div className="chart-empty">No data yet. Log your first expense to see insights.</div>
                )}
              </div>
            </MobileSectionCard>
          </div>

          

      <div className="theme-wo">
      <MobileSectionCard title="Workout Mix" persistKey="dash-workout-mix">
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
          <div style={{ marginTop: 8, width: "100%", display: "flex", justifyContent: "center" }}>
            {loadingData ? (
              <Skeleton variant="rectangular" width="100%" height={180} {...skeletonProps} />
            ) : monthWorkouts.length ? (
              <Suspense fallback={<div style={{ opacity: 0.6, fontSize: 12 }}>Loading chart…</div>}>
                <WorkoutTypePie rows={monthWorkouts} />
              </Suspense>
            ) : (
              <div className="chart-empty">No data yet. Log your first workout to see insights.</div>
            )}
          </div>
        </div>
      </MobileSectionCard>
      </div>

          <div className="theme-wo">
            <MobileSectionCard title="Workout Insights" persistKey="dash-workout-insights">
              {loadingData ? (
                <div className="workout-insights-grid">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div className="drink-card theme-wo" key={`workout-skel-${index}`}>
                      <Skeleton variant="text" width="60%" height={16} {...skeletonProps} />
                      <Skeleton variant="text" width="40%" height={30} {...skeletonProps} />
                      <Skeleton variant="text" width="70%" height={14} {...skeletonProps} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="workout-insights-grid">
                  <div className="drink-card theme-wo">
                    <div className="drink-card__title">Total Workouts</div>
                    <div className="drink-card__value is-large">{workoutCount}</div>
                    <div className={`drink-card__sub drink-card__value--${workoutDeltaTone}`}>
                      {workoutDeltaLabel}
                    </div>
                  </div>
                  <div className="drink-card theme-wo">
                    <div className="drink-card__title">Top Workout Types</div>
                    {topWorkoutTypes.length ? (
                      <div className="kpi-momentum">
                        {topWorkoutTypes.map((row) => (
                          <div className="kpi-momentum__row" key={row.type}>
                            <span className="kpi-momentum__label">{row.type}</span>
                            <span className="kpi-momentum__value kpi-momentum__value--neutral">
                              {row.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="kpi-momentum__empty">No workout data yet</div>
                    )}
                  </div>
                </div>
              )}
            </MobileSectionCard>
          </div>

          <div className="theme-wo">
            <MobileSectionCard
              title="Monthly Tracker"
              right={
                <div className="chart-toggle">
                  <Button
                    size="small"
                    variant={bodyChartView === "weight" ? "contained" : "outlined"}
                    onClick={() => setBodyChartView("weight")}
                    className={`chart-toggle__btn ${bodyChartView === "weight" ? "is-active" : ""}`}
                  >
                    Weight
                  </Button>
                  <Button
                    size="small"
                    variant={bodyChartView === "fat" ? "contained" : "outlined"}
                    onClick={() => setBodyChartView("fat")}
                    className={`chart-toggle__btn ${bodyChartView === "fat" ? "is-active" : ""}`}
                  >
                    Body Fat
                  </Button>
                </div>
              }
              stackRightOnMobile={false}
              noWrapOnMobile
              togglePosition="right"
              persistKey="dash-monthly-tracker"
            >
              <div className="report-chart">
                <div className="report-chart__sub">Every log this month</div>
                {loadingData ? (
                  <Skeleton variant="rectangular" width="100%" height={220} {...skeletonProps} />
                ) : bodyLogsThisMonth.length ? (
                  <MonthlyLineChart
                    xAxisData={bodyDatesThisMonth}
                    xAxisScaleType="time"
                    xAxisValueFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                    curve="monotoneX"
                    yAxisMin={bodyChartView === "weight" ? 50 : 15}
                    yAxisMax={bodyChartView === "weight" ? 90 : 30}
                    series={[
                      bodyChartView === "weight"
                        ? {
                            data: bodyWeightSeriesThisMonth,
                            label: "Weight (kg)",
                            color: "#9FC8B3",
                            valueFormatter: (v) => `${Number(v || 0).toFixed(1)} kg`,
                          }
                        : {
                            data: bodyFatSeriesThisMonth,
                            label: "Body Fat (%)",
                            color: "#F4C76E",
                            valueFormatter: (v) => `${Number(v || 0).toFixed(1)}%`,
                          },
                    ]}
                    emptyLabel="No body stats logged this month."
                    showMarks
                  />
                ) : (
                  <div className="chart-empty">No body stats logged this month.</div>
                )}
              </div>
            </MobileSectionCard>
          </div>

          

          


        </div>
      </div>

      <ExpenseDialog
        open={isExpenseDialogOpen}
        onClose={() => {
          setIsExpenseDialogOpen(false);
          setEditingExpense(null);
        }}
        initial={editingExpense}
        onSubmit={async (row) => {
          if (editingExpense?.id) {
            await updateExpense(row);
          } else {
            await addExpense(row);
          }
        }}
        onDelete={
          editingExpense?.id
            ? () => {
                requestDeleteExpense(editingExpense.id);
                setIsExpenseDialogOpen(false);
                setEditingExpense(null);
              }
            : undefined
        }
      />

      <WorkoutDialog
        open={isWorkoutDialogOpen}
        onClose={() => {
          setIsWorkoutDialogOpen(false);
          setEditingWorkout(null);
        }}
        initial={editingWorkout}
        onSubmit={async (row) => {
          if (editingWorkout?.id) {
            await updateWorkout(row);
          } else {
            await addWorkout(row);
          }
        }}
        onDelete={
          editingWorkout?.id
            ? () => {
                requestDeleteWorkout(editingWorkout.id);
                setIsWorkoutDialogOpen(false);
                setEditingWorkout(null);
              }
            : undefined
        }
      />

      <DrinkDialog
        open={isDrinkDialogOpen}
        onClose={() => {
          setIsDrinkDialogOpen(false);
          setEditingDrink(null);
        }}
        initial={editingDrink}
        onSubmit={async (row) => {
          if (editingDrink?.id) {
            await updateDrink({ ...editingDrink, ...row, id: editingDrink.id });
          } else {
            await addDrink(row);
          }
        }}
        onDelete={
          editingDrink?.id
            ? () => {
                setDrinkDelete({ open: true, id: editingDrink.id });
                setIsDrinkDialogOpen(false);
                setEditingDrink(null);
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.kind === "workout" ? "Delete workout?" : "Delete expense?"}
        description="This will permanently remove this entry."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onClose={() => setConfirm({ open: false, id: null, kind: "expense" })}
      />

      <ConfirmDialog
        open={drinkDelete.open}
        title="Delete drink log?"
        description="This will permanently remove this drink log."
        confirmText="Delete"
        onConfirm={async () => {
          await deleteDrink(drinkDelete.id);
          setDrinkDelete({ open: false, id: null });
        }}
        onClose={() => setDrinkDelete({ open: false, id: null })}
      />

      {/* Snackbar */}
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

      <CoachTour
        storageKey={`tour:dashboard:${user?.id || "anon"}`}
        steps={[
          {
            selector: "[data-tour='quick-add']",
            title: "Quick Add",
            body: "Tap here to log an expense, workout, or drink in seconds.",
          },
          {
            selector: "[data-tour='today-snapshot']",
            title: "Daily Highlights",
            body: "Your spend, workout, and drink status at a glance.",
          },
          ...(window.innerWidth <= 720
            ? [
                {
                  selector: "[data-tour='month-picker']",
                  title: "Month Picker",
                  body: "Jump between months to review history or compare trends.",
                },
              ]
            : [
                {
                  selector: "[data-tour='calendar']",
                  title: "Calendar View",
                  body: "Scan your month quickly and spot patterns at a glance.",
                },
                {
                  selector: "[data-tour='month-picker']",
                  title: "Month Picker",
                  body: "Jump between months to review history or compare trends.",
                },
              ]),
        ]}
      />
    </DashboardLayout>
  );
}
