import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/apiFetch.js";
import { budgetByCategory as defaultBudgets } from "../config/budget.js";

const DashboardContext = createContext(null);

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
}

export function DashboardProvider({ children }) {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey()); // ✅ current month
  const [tier, setTier] = useState("low"); // low | mid | high
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [themeOn, setThemeOn] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ui.themeOn") === "true";
  });
  const [budgets, setBudgets] = useState(null);
  const bumpRefresh = () => setRefreshKey((k) => k + 1);
  const toggleTheme = () => setThemeOn((v) => !v);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ui.themeOn", String(themeOn));
  }, [themeOn]);

  useEffect(() => {
    const loadBudgets = async () => {
      try {
        const data = await apiFetch("/api/budgets");
        setBudgets(data?.budgets || defaultBudgets);
      } catch {
        setBudgets(defaultBudgets);
      }
    };
    loadBudgets();
  }, []);

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
    }),
    [monthKey, tier, lastUpdate, refreshKey, themeOn, budgets]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
