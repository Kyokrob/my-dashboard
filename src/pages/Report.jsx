import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import MonthPicker from "../components/layout/MonthPicker.jsx";
import SectionCard from "../components/common/SectionCard.jsx";
import MonthlyBarChart from "../components/insights/MonthlyBarChart.jsx";
import MonthlyLineChart from "../components/insights/MonthlyLineChart.jsx";
import { apiFetch } from "../api/apiFetch.js";
import { useDashboard } from "../context/DashboardContext.jsx";
import { inMonth } from "../utils/date.js";
import "./Report.scss";

function parseAmount(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/฿/g, "").replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export default function Report() {
  const { monthKey, setMonthKey } = useDashboard();
  const [expenseChartType, setExpenseChartType] = useState(() => {
    if (typeof window === "undefined") return "bar";
    return localStorage.getItem("insights.expenseChartType") || "bar";
  });
  const [drinkChartType, setDrinkChartType] = useState(() => {
    if (typeof window === "undefined") return "bar";
    return localStorage.getItem("insights.drinkChartType") || "bar";
  });
  const [drinkMetric, setDrinkMetric] = useState(() => {
    if (typeof window === "undefined") return "days";
    return localStorage.getItem("insights.drinkMetric") || "days";
  });
  const [expenses, setExpenses] = useState([]);
  const [drinks, setDrinks] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const exp = await apiFetch("/api/expenses");
        setExpenses(Array.isArray(exp) ? exp : []);
      } catch {
        setExpenses([]);
      }
      try {
        const dr = await apiFetch("/api/drinks");
        setDrinks(Array.isArray(dr) ? dr : []);
      } catch {
        setDrinks([]);
      }
    };
    load();
  }, []);

  const [curY, curM] = monthKey.split("-").map(Number);

  function addMonths(key, offset) {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  const monthKeys = useMemo(() => [addMonths(monthKey, -2), addMonths(monthKey, -1), monthKey], [monthKey]);

  const monthLabels = useMemo(() => {
    const [anchorYear] = monthKey.split("-").map(Number);
    return monthKeys.map((key) => {
      const [y, m] = key.split("-").map(Number);
      const base = new Date(y, m - 1, 1).toLocaleString(undefined, { month: "short" });
      return y === anchorYear ? base : `${base} ${String(y).slice(2)}`;
    });
  }, [monthKey, monthKeys]);

  const monthDayCounts = useMemo(
    () =>
      monthKeys.map((key) => {
        const [y, m] = key.split("-").map(Number);
        return new Date(y, m, 0).getDate();
      }),
    [monthKeys]
  );

  const expenseTotals = useMemo(
    () =>
      monthKeys.map((key) =>
        expenses
          .filter((e) => inMonth(e.date, key))
          .reduce((sum, e) => sum + parseAmount(e.amount), 0)
      ),
    [expenses, monthKeys]
  );

  const drinkDayTotals = useMemo(
    () =>
      monthKeys.map((key) => {
        const monthSet = new Set(
          drinks.filter((d) => inMonth(d.date, key) && d.drank).map((d) => d.date)
        );
        return monthSet.size;
      }),
    [drinks, monthKeys]
  );

  const drinkLevelStats = useMemo(
    () =>
      monthKeys.map((key) => {
        const rows = drinks.filter((d) => inMonth(d.date, key) && d.drank);
        const byDate = rows.reduce((acc, d) => {
          const level = Number(d.level || 0);
          if (!Number.isFinite(level) || level <= 0) return acc;
          if (!acc[d.date]) acc[d.date] = [];
          acc[d.date].push(level);
          return acc;
        }, {});
        const dayAverages = Object.values(byDate).map((levels) => {
          const sum = levels.reduce((s, v) => s + v, 0);
          return levels.length ? sum / levels.length : 0;
        });
        const sum = dayAverages.reduce((s, v) => s + v, 0);
        const count = dayAverages.length;
        const avg = count ? sum / count : 0;
        return { sum, count, avg };
      }),
    [drinks, monthKeys]
  );

  const drinkLevelAverages = drinkLevelStats.map((s) => Number(s.avg.toFixed(2)));
  const drinkLevelTotal = drinkLevelStats.reduce((acc, s) => acc + s.sum, 0);
  const drinkLevelCount = drinkLevelStats.reduce((acc, s) => acc + s.count, 0);
  const drinkLevelWeightedAvg = drinkLevelCount ? drinkLevelTotal / drinkLevelCount : 0;

  const totalExpense3mo = expenseTotals.reduce((sum, v) => sum + Number(v || 0), 0);
  const totalDrinkDays3mo = drinkDayTotals.reduce((sum, v) => sum + Number(v || 0), 0);

  const monthExpenses = expenses.filter((e) => inMonth(e.date, monthKey));
  const monthDrinkDays = new Set(
    drinks.filter((d) => inMonth(d.date, monthKey) && d.drank).map((d) => d.date)
  ).size;
  const [prevY, prevM] = (() => {
    const d = new Date(curY, curM - 2, 1);
    return [d.getFullYear(), d.getMonth() + 1];
  })();
  const prevMonthKey = `${prevY}-${String(prevM).padStart(2, "0")}`;
  const prevMonthExpenses = expenses.filter((e) => inMonth(e.date, prevMonthKey));

  const monthSpendTotal = monthExpenses.reduce((sum, e) => sum + parseAmount(e.amount), 0);
  const avgSpendPerDrinkDay = monthDrinkDays ? monthSpendTotal / monthDrinkDays : 0;

  const byCategory = (rows) =>
    rows.reduce((acc, e) => {
      const key = e.category || "Other";
      const amt = parseAmount(e.amount);
      acc[key] = (acc[key] || 0) + (Number.isFinite(amt) ? amt : 0);
      return acc;
    }, {});

  const currByCat = byCategory(monthExpenses);
  const prevByCat = byCategory(prevMonthExpenses);
  const allCats = Array.from(new Set([...Object.keys(currByCat), ...Object.keys(prevByCat)]));
  const varianceByCat = allCats.map((cat) => {
    const curr = currByCat[cat] || 0;
    const prev = prevByCat[cat] || 0;
    return { cat, diff: curr - prev, curr, prev };
  });
  const biggestVariance = varianceByCat.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];
  const varianceLabel = biggestVariance
    ? `${biggestVariance.cat}`
    : "—";
  const varianceValue = biggestVariance
    ? `${biggestVariance.diff >= 0 ? "+" : ""}฿${Math.round(biggestVariance.diff).toLocaleString()}`
    : "—";

  const topCategory = Object.entries(currByCat)
    .sort((a, b) => b[1] - a[1])[0];
  const topCategoryLabel = topCategory ? topCategory[0] : "—";
  const topCategoryPct = topCategory && monthSpendTotal
    ? Math.round((topCategory[1] / monthSpendTotal) * 100)
    : 0;

  const cumulativeSpend = expenseTotals.reduce((acc, val) => {
    const last = acc.length ? acc[acc.length - 1] : 0;
    acc.push(last + Number(val || 0));
    return acc;
  }, []);

  const avgSpendPerDayByMonth = expenseTotals.map((total, idx) => {
    const days = monthDayCounts[idx] || 1;
    return Number((Number(total || 0) / days).toFixed(2));
  });

  const prevMonthSpendTotal = prevMonthExpenses.reduce((sum, e) => sum + parseAmount(e.amount), 0);
  const spendChangePct =
    prevMonthSpendTotal > 0 ? ((monthSpendTotal - prevMonthSpendTotal) / prevMonthSpendTotal) * 100 : null;
  const spendChangeLabel =
    spendChangePct === null ? "—" : `${spendChangePct > 0 ? "+" : ""}${spendChangePct.toFixed(1)}%`;
  const spendChangeTone = spendChangePct === null ? "neutral" : spendChangePct > 0 ? "bad" : "good";

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("insights.expenseChartType", expenseChartType);
  }, [expenseChartType]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("insights.drinkChartType", drinkChartType);
  }, [drinkChartType]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("insights.drinkMetric", drinkMetric);
  }, [drinkMetric]);

  return (
    <DashboardLayout title="Insights" right={<MonthPicker value={monthKey} onChange={setMonthKey} />}>
      <div className="report-stats-grid">
        <div className="report-stat">
          <div className="report-stat__label">Avg spend per drinking day</div>
          <div className="report-stat__value">
            {monthDrinkDays ? `฿${Math.round(avgSpendPerDrinkDay).toLocaleString()}` : "—"}
          </div>
          <div className="report-stat__sub">
            {monthDrinkDays ? `${monthDrinkDays} drinking days` : "No drinking days"}
          </div>
        </div>
        <div className="report-stat">
          <div className="report-stat__label">Top category share</div>
          <div className="report-stat__value">{topCategoryLabel}</div>
          <div className="report-stat__sub">
            {topCategoryLabel === "—" ? "No category data" : `${topCategoryPct}% of spend`}
          </div>
        </div>
        <div className="report-stat">
          <div className="report-stat__label">Largest variance vs last month</div>
          <div className="report-stat__value">{varianceLabel}</div>
          <div className="report-stat__sub">{varianceValue}</div>
        </div>
        <div className="report-stat">
          <div className="report-stat__label">Spend vs last month</div>
          <div className={`report-stat__value report-stat__value--${spendChangeTone}`}>
            {spendChangeLabel}
          </div>
          <div className="report-stat__sub">
            {prevMonthSpendTotal ? `Last month ฿${Math.round(prevMonthSpendTotal).toLocaleString()}` : "No prior data"}
          </div>
        </div>
      </div>

      <div className="report-charts">
        <SectionCard
          title="Monthly Expense Summary"
          right={
            <div className="report-toggle report-toggle--compact" role="group" aria-label="Expense chart type">
              <button
                type="button"
                className={`report-toggle__btn ${expenseChartType === "bar" ? "is-active" : ""}`}
                onClick={() => setExpenseChartType("bar")}
              >
                Bar
              </button>
              <button
                type="button"
                className={`report-toggle__btn ${expenseChartType === "line" ? "is-active" : ""}`}
                onClick={() => setExpenseChartType("line")}
              >
                Line
              </button>
            </div>
          }
        >
          <div className="report-chart">
            <div className="report-summary">
              <div className="report-summary__label">3-mo total</div>
              <div className="report-summary__value">฿{Math.round(totalExpense3mo).toLocaleString()}</div>
            </div>
            <div className="report-chart__sub">Total spend per month</div>
            {expenseChartType === "line" ? (
              <MonthlyLineChart
                labels={monthLabels}
                values={expenseTotals.map((v) => Math.round(v))}
                seriesLabel="Spend"
                color="#7c83fd"
                valueFormatter={(v) => `฿${Number(v || 0).toLocaleString()}`}
                emptyLabel="No expenses logged in these months."
                dashed
                showMarks
              />
            ) : (
              <MonthlyBarChart
                labels={monthLabels}
                values={expenseTotals.map((v) => Math.round(v))}
                seriesLabel="Spend"
                color="#7c83fd"
                valueFormatter={(v) => `฿${Number(v || 0).toLocaleString()}`}
                emptyLabel="No expenses logged in these months."
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Monthly Drinking Summary"
          right={
            <div className="report-header-controls">
              <div className="report-toggle report-toggle--compact" role="group" aria-label="Drink chart type">
                <button
                  type="button"
                  className={`report-toggle__btn ${drinkChartType === "bar" ? "is-active" : ""}`}
                  onClick={() => setDrinkChartType("bar")}
                >
                  Bar
                </button>
                <button
                  type="button"
                  className={`report-toggle__btn ${drinkChartType === "line" ? "is-active" : ""}`}
                  onClick={() => setDrinkChartType("line")}
                >
                  Line
                </button>
              </div>
              <div className="report-toggle report-toggle--compact" role="group" aria-label="Drinking metric">
                <button
                  type="button"
                  className={`report-toggle__btn ${drinkMetric === "days" ? "is-active" : ""}`}
                  onClick={() => setDrinkMetric("days")}
                >
                  Drink days
                </button>
                <button
                  type="button"
                  className={`report-toggle__btn ${drinkMetric === "avg" ? "is-active" : ""}`}
                  onClick={() => setDrinkMetric("avg")}
                >
                  Avg level
                </button>
              </div>
            </div>
          }
        >
          <div className="report-chart">
            <div className="report-summary">
              <div className="report-summary__label">
                {drinkMetric === "avg" ? "3-mo avg level" : "3-mo total"}
              </div>
              <div className="report-summary__value">
                {drinkMetric === "avg"
                  ? drinkLevelWeightedAvg
                    ? drinkLevelWeightedAvg.toFixed(2)
                    : "—"
                  : totalDrinkDays3mo}
              </div>
            </div>
            <div className="report-chart__sub">
              {drinkMetric === "avg" ? "Average level per month" : "Drinking days per month"}
            </div>
            {drinkChartType === "line" ? (
              <MonthlyLineChart
                labels={monthLabels}
                values={drinkMetric === "avg" ? drinkLevelAverages : drinkDayTotals}
                seriesLabel={drinkMetric === "avg" ? "Avg Level" : "Drink Days"}
                color={drinkMetric === "avg" ? "#F4C76E" : "#9FC8B3"}
                valueFormatter={(v) => `${Number(v || 0)}`}
                emptyLabel="No drinking logs in these months."
              />
            ) : (
              <MonthlyBarChart
                labels={monthLabels}
                values={drinkMetric === "avg" ? drinkLevelAverages : drinkDayTotals}
                seriesLabel={drinkMetric === "avg" ? "Avg Level" : "Drink Days"}
                color={drinkMetric === "avg" ? "#F4C76E" : "#9FC8B3"}
                valueFormatter={(v) => `${Number(v || 0)}`}
                emptyLabel="No drinking logs in these months."
              />
            )}
          </div>
        </SectionCard>
      </div>

      <div className="report-extra-grid">
        <SectionCard title="Cumulative Spend (3 Months)">
          <div className="report-chart">
            <div className="report-chart__sub">Running total across the window</div>
            <MonthlyLineChart
              labels={monthLabels}
              values={cumulativeSpend.map((v) => Math.round(v))}
              seriesLabel="Cumulative"
              color="#9FC8B3"
              valueFormatter={(v) => `฿${Number(v || 0).toLocaleString()}`}
              emptyLabel="No expenses logged in these months."
              showMarks
            />
          </div>
        </SectionCard>

        <SectionCard title="Avg Spend per Day (3 Months)">
          <div className="report-chart">
            <div className="report-chart__sub">Monthly total divided by days in month</div>
            <MonthlyLineChart
              labels={monthLabels}
              values={avgSpendPerDayByMonth}
              seriesLabel="Avg/Day"
              color="#F4C76E"
              valueFormatter={(v) => `฿${Number(v || 0).toLocaleString()}`}
              emptyLabel="No expenses logged in these months."
              showMarks
            />
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
