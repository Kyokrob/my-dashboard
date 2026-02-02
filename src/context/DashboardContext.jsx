import { createContext, useContext, useMemo, useState } from "react";

const DashboardContext = createContext(null);

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
}

export function DashboardProvider({ children }) {
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey()); // ✅ current month
  const [tier, setTier] = useState("low"); // low | mid | high

  const value = useMemo(
    () => ({ monthKey, setMonthKey, tier, setTier }),
    [monthKey, tier]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
