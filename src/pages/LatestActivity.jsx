import { useEffect, useMemo, useState } from "react";
import Skeleton from "@mui/material/Skeleton";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import MonthPicker from "../components/layout/MonthPicker.jsx";
import SectionCard from "../components/common/SectionCard.jsx";
import { apiFetch } from "../api/apiFetch.js";
import { useDashboard } from "../context/DashboardContext.jsx";
import { inMonth } from "../utils/date.js";
import "./LatestActivity.scss";

function parseAmount(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/฿/g, "").replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export default function LatestActivity() {
  const { monthKey, setMonthKey } = useDashboard();
  const [expenses, setExpenses] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [loadingExp, setLoadingExp] = useState(true);
  const [loadingWo, setLoadingWo] = useState(true);
  const [loadingDr, setLoadingDr] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingExp(true);
      setLoadingWo(true);
      setLoadingDr(true);
      try {
        const exp = await apiFetch("/api/expenses");
        setExpenses(Array.isArray(exp) ? exp : []);
      } catch {
        setExpenses([]);
      } finally {
        setLoadingExp(false);
      }
      try {
        const wo = await apiFetch("/api/workouts");
        setWorkouts(Array.isArray(wo) ? wo : []);
      } catch {
        setWorkouts([]);
      } finally {
        setLoadingWo(false);
      }
      try {
        const dr = await apiFetch("/api/drinks");
        setDrinks(Array.isArray(dr) ? dr : []);
      } catch {
        setDrinks([]);
      } finally {
        setLoadingDr(false);
      }
    };
    load();
  }, []);

  const isLoading = loadingExp || loadingWo || loadingDr;

  const monthExpenses = expenses.filter((e) => inMonth(e.date, monthKey));
  const monthWorkouts = workouts.filter((w) => inMonth(w.date, monthKey));
  const monthDrinkLogs = drinks.filter((d) => inMonth(d.date, monthKey) && d.drank);

  const activityLog = useMemo(() => {
    const rows = [];
    expenses.forEach((e) =>
      rows.push({
        type: "Expense",
        date: e.updatedAt || e.createdAt || e.date,
        title: e.category || "Expense",
        meta: e.amount ? `฿${Math.round(parseAmount(e.amount)).toLocaleString()}` : "",
      })
    );
    workouts.forEach((w) =>
      rows.push({
        type: "Workout",
        date: w.updatedAt || w.createdAt || w.date,
        title: w.workoutType || "Workout",
        meta: w.intensity ? `Intensity ${w.intensity}` : "",
      })
    );
    drinks
      .filter((d) => d.drank)
      .forEach((d) =>
        rows.push({
          type: "Drink",
          date: d.updatedAt || d.createdAt || d.date,
          title: d.name || "Drink log",
          meta: d.level ? `Level ${d.level}` : "",
        })
      );
    return rows
      .filter((r) => r.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [expenses, workouts, drinks]);

  return (
    <DashboardLayout title="Latest Activity" right={<MonthPicker value={monthKey} onChange={setMonthKey} />}>
      <div className="activity-page">
        <div className="theme-neutral">
          <SectionCard title="Usage Metrics">
            <div className="report-metrics">
              <div className="report-metric">
                <div className="report-metric__label">Expenses (this month)</div>
                <div className="report-metric__value">
                  {loadingExp ? <Skeleton width={40} /> : monthExpenses.length}
                </div>
              </div>
              <div className="report-metric">
                <div className="report-metric__label">Workouts (this month)</div>
                <div className="report-metric__value">
                  {loadingWo ? <Skeleton width={40} /> : monthWorkouts.length}
                </div>
              </div>
              <div className="report-metric">
                <div className="report-metric__label">Drink logs (this month)</div>
                <div className="report-metric__value">
                  {loadingDr ? <Skeleton width={40} /> : monthDrinkLogs.length}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="theme-neutral">
          <SectionCard title="Activity Log (Last 10)">
            <div className="activity-log">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div className="activity-log__row" key={`sk-${idx}`}>
                    <Skeleton variant="text" width="60%" height={18} />
                    <Skeleton variant="text" width="30%" height={18} />
                  </div>
                ))
              ) : activityLog.length ? (
                activityLog.map((row, idx) => (
                  <div className="activity-log__row" key={`${row.type}-${idx}`}>
                    <div>
                      <div className="activity-log__title">{row.title}</div>
                      <div className="activity-log__meta">
                        {row.type}
                        {row.meta ? ` · ${row.meta}` : ""}
                      </div>
                    </div>
                    <div className="activity-log__time">
                      {new Date(row.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="activity-log__empty">No recent activity yet.</div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
