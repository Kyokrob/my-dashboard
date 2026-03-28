import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/apiFetch.js";
import { budgetByCategory as defaultBudgets } from "../config/budget.js";
import { defaultWorkoutTypePrefs } from "../config/workouts.js";
import {
  defaultExpenseCategories,
  defaultDrinkReasons,
  defaultDrinkVenues,
} from "../config/preferences.js";
import { useAuth } from "./AuthContext.jsx";

const DashboardContext = createContext(null);

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
}

export function DashboardProvider({ children }) {
  const { user } = useAuth();
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey()); // ✅ current month
  const [tier, setTier] = useState(() => {
    if (typeof window === "undefined") return "low";
    return localStorage.getItem("budget.tier") || "low";
  }); // low | mid | high
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [themeOn, setThemeOn] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ui.themeOn") === "true";
  });
  const [budgets, setBudgets] = useState(null);
  const [workoutTypes, setWorkoutTypes] = useState(defaultWorkoutTypePrefs);
  const [expenseCategories, setExpenseCategories] = useState(
    defaultExpenseCategories.map((label) => ({ label, enabled: true }))
  );
  const [drinkReasons, setDrinkReasons] = useState(
    defaultDrinkReasons.map((label) => ({ label, enabled: true }))
  );
  const [drinkVenues, setDrinkVenues] = useState(
    defaultDrinkVenues.map((label) => ({ label, enabled: true }))
  );
  const bumpRefresh = () => setRefreshKey((k) => k + 1);
  const toggleTheme = () => setThemeOn((v) => !v);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ui.themeOn", String(themeOn));
  }, [themeOn]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("budget.tier", tier);
  }, [tier]);

  useEffect(() => {
    const loadBudgets = async () => {
      try {
        const data = await apiFetch("/api/budgets");
        setBudgets(data?.budgets || defaultBudgets);
      } catch {
        setBudgets(defaultBudgets);
      }
    };
    if (user?.id) loadBudgets();
    else setBudgets(defaultBudgets);
  }, [user?.id]);

  useEffect(() => {
    const normalizeWorkoutTypes = (list) => {
      const raw = Array.isArray(list) ? list : defaultWorkoutTypePrefs;
      const cleaned = raw
        .map((item) => {
          if (typeof item === "string") return { label: item, enabled: true };
          const label = String(item?.label || "").trim();
          if (!label) return null;
          return { label, enabled: item?.enabled !== false };
        })
        .filter(Boolean);
      return cleaned.length ? cleaned : defaultWorkoutTypePrefs;
    };
    const loadWorkoutTypes = async () => {
      try {
        const data = await apiFetch("/api/workout-types");
        setWorkoutTypes(normalizeWorkoutTypes(data?.workoutTypes));
      } catch {
        setWorkoutTypes(defaultWorkoutTypePrefs);
      }
    };
    if (user?.id) loadWorkoutTypes();
    else setWorkoutTypes(defaultWorkoutTypePrefs);
  }, [user?.id]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const data = await apiFetch("/api/preferences");
        setExpenseCategories(
          Array.isArray(data?.expenseCategories)
            ? data.expenseCategories
            : defaultExpenseCategories.map((label) => ({ label, enabled: true }))
        );
        setDrinkReasons(
          Array.isArray(data?.drinkReasons)
            ? data.drinkReasons
            : defaultDrinkReasons.map((label) => ({ label, enabled: true }))
        );
        setDrinkVenues(
          Array.isArray(data?.drinkVenues)
            ? data.drinkVenues
            : defaultDrinkVenues.map((label) => ({ label, enabled: true }))
        );
      } catch {
        setExpenseCategories(defaultExpenseCategories.map((label) => ({ label, enabled: true })));
        setDrinkReasons(defaultDrinkReasons.map((label) => ({ label, enabled: true })));
        setDrinkVenues(defaultDrinkVenues.map((label) => ({ label, enabled: true })));
      }
    };
    if (user?.id) loadPreferences();
    else {
      setExpenseCategories(defaultExpenseCategories.map((label) => ({ label, enabled: true })));
      setDrinkReasons(defaultDrinkReasons.map((label) => ({ label, enabled: true })));
      setDrinkVenues(defaultDrinkVenues.map((label) => ({ label, enabled: true })));
    }
  }, [user?.id]);

  const value = useMemo(
    () => ({
      monthKey,
      setMonthKey,
      tier,
      setTier,
      lastUpdate,
      setLastUpdate,
      refreshKey,
      bumpRefresh,
      themeOn,
      setThemeOn,
      toggleTheme,
      budgets,
      setBudgets,
      workoutTypes,
      setWorkoutTypes,
      expenseCategories,
      setExpenseCategories,
      drinkReasons,
      setDrinkReasons,
      drinkVenues,
      setDrinkVenues,
    }),
    [
      monthKey,
      tier,
      lastUpdate,
      refreshKey,
      themeOn,
      budgets,
      workoutTypes,
      expenseCategories,
      drinkReasons,
      drinkVenues,
    ]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
