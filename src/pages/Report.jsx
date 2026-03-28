import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import MonthPicker from "../components/layout/MonthPicker.jsx";
import SectionCard from "../components/common/SectionCard.jsx";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";
import MonthlyBarChart from "../components/insights/MonthlyBarChart.jsx";
import MonthlyLineChart from "../components/insights/MonthlyLineChart.jsx";
import Skeleton from "@mui/material/Skeleton";
import { apiFetch } from "../api/apiFetch.js";
import { useDashboard } from "../context/DashboardContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { inMonth } from "../utils/date.js";
import { readCache, writeCache } from "../utils/cache.js";
import "./Report.scss";

const MobileSectionCard = ({ collapsible = true, ...props }) => (
  <SectionCard collapsible={collapsible} collapsibleOnMobile {...props} />
);

const titleWithInfo = (text, info) => (
  <span className="card__title-with-info">
    <span>{text}</span>
    <Tooltip title={info} arrow>
      <span className="card__info-icon" aria-label={info}>
        <InfoOutlineIcon fontSize="inherit" />
      </span>
    </Tooltip>
  </span>
);


function parseAmount(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/฿/g, "").replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const n = Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function Report() {
  const { monthKey, setMonthKey } = useDashboard();
  const { user } = useAuth();
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
  const [bodyChartView, setBodyChartView] = useState("weight");
  const [expenses, setExpenses] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loadingExp, setLoadingExp] = useState(true);
  const [loadingDr, setLoadingDr] = useState(true);
  const [loadingWo, setLoadingWo] = useState(true);

  useEffect(() => {
    const userKey = user?.id || "guest";
    const expKey = `cache:${userKey}:expenses`;
    const woKey = `cache:${userKey}:workouts`;
    const drKey = `cache:${userKey}:drinks`;
    const expCache = readCache(expKey);
    const woCache = readCache(woKey);
    const drCache = readCache(drKey);

    if (expCache) {
      setExpenses(Array.isArray(expCache) ? expCache : []);
      setLoadingExp(false);
    }
    if (drCache) {
      setDrinks(Array.isArray(drCache) ? drCache : []);
      setLoadingDr(false);
    }
    if (woCache) {
      setWorkouts(Array.isArray(woCache) ? woCache : []);
      setLoadingWo(false);
    }

    const load = async () => {
      setLoadingExp(!expCache);
      setLoadingDr(!drCache);
      setLoadingWo(!woCache);
      try {
        const exp = await apiFetch("/api/expenses");
        setExpenses(Array.isArray(exp) ? exp : []);
        writeCache(expKey, Array.isArray(exp) ? exp : []);
      } catch {
        if (!expCache) setExpenses([]);
      } finally {
        setLoadingExp(false);
      }
      try {
        const dr = await apiFetch("/api/drinks");
        setDrinks(Array.isArray(dr) ? dr : []);
        writeCache(drKey, Array.isArray(dr) ? dr : []);
      } catch {
        if (!drCache) setDrinks([]);
      } finally {
        setLoadingDr(false);
      }
      try {
        const wo = await apiFetch("/api/workouts");
        setWorkouts(Array.isArray(wo) ? wo : []);
        writeCache(woKey, Array.isArray(wo) ? wo : []);
      } catch {
        if (!woCache) setWorkouts([]);
      } finally {
        setLoadingWo(false);
      }
    };
    load();
  }, [user?.id]);

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
  const cumulativeSpend = expenseTotals.reduce((acc, val) => {
    const last = acc.length ? acc[acc.length - 1] : 0;
    acc.push(last + Number(val || 0));
    return acc;
  }, []);

  const avgSpendPerDayByMonth = expenseTotals.map((total, idx) => {
    const days = monthDayCounts[idx] || 1;
    return Number((Number(total || 0) / days).toFixed(2));
  });

  const workoutIntensityByMonth = useMemo(
    () =>
      monthKeys.map((key) => {
        const rows = workouts.filter((w) => inMonth(w.date, key));
        const sum = rows.reduce((acc, w) => acc + Number(w.intensity || 0), 0);
        const count = rows.filter((w) => Number(w.intensity || 0) > 0).length;
        return count ? Number((sum / count).toFixed(2)) : 0;
      }),
    [workouts, monthKeys]
  );

  const workoutCountByMonth = useMemo(
    () => monthKeys.map((key) => workouts.filter((w) => inMonth(w.date, key)).length),
    [workouts, monthKeys]
  );

  const totalWorkouts3mo = useMemo(
    () => workoutCountByMonth.reduce((sum, v) => sum + Number(v || 0), 0),
    [workoutCountByMonth]
  );

  const bodyLogs3mo = useMemo(
    () =>
      workouts
        .filter((w) => {
          const dateValue = w.date || w.createdAt || w.updatedAt;
          const inRange = monthKeys.some((key) => inMonth(dateValue, key));
          if (!inRange) return false;
          const weight = toNumber(w.weight ?? w.weightKg ?? w.bodyWeight);
          const fat = toNumber(w.bodyFat ?? w.body_fat ?? w.bodyfat);
          return weight > 0 || fat > 0;
        })
        .map((w) => ({
          ...w,
          _date: w.date || w.createdAt || w.updatedAt,
        }))
        .filter((w) => w._date)
        .sort((a, b) => new Date(a._date).getTime() - new Date(b._date).getTime()),
    [workouts, monthKeys]
  );

  const bodyDates3mo = useMemo(() => bodyLogs3mo.map((w) => new Date(w._date)), [bodyLogs3mo]);
  const bodyWeightSeries3mo = useMemo(
    () =>
      bodyLogs3mo.map((w) => {
        const val = toNumber(w.weight ?? w.weightKg ?? w.bodyWeight);
        return val > 0 ? val : null;
      }),
    [bodyLogs3mo]
  );
  const bodyFatSeries3mo = useMemo(
    () =>
      bodyLogs3mo.map((w) => {
        const val = toNumber(w.bodyFat ?? w.body_fat ?? w.bodyfat);
        return val > 0 ? val : null;
      }),
    [bodyLogs3mo]
  );

  const monthWorkouts = workouts.filter((w) => inMonth(w.date, monthKey));
  const monthDrinkLogs = drinks.filter((d) => inMonth(d.date, monthKey) && d.drank);

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

  const isLoading = loadingExp || loadingDr || loadingWo;

  return (
    <DashboardLayout title="Insights" right={<MonthPicker value={monthKey} onChange={setMonthKey} />}>
      <div className="report-charts">
        <div className="theme-exp">
          <MobileSectionCard
            title={titleWithInfo(
              "Monthly Expense Summary",
              "3-month spend totals and trends for expenses."
            )}
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
            persistKey="insights-expense-summary"
          >
            <div className="report-chart">
              <div className="report-summary">
                <div className="report-summary__label">3-mo total</div>
                <div className="report-summary__value">
                  {isLoading ? <Skeleton variant="text" width={90} height={26} /> : `฿${Math.round(totalExpense3mo).toLocaleString()}`}
                </div>
              </div>
              <div className="report-chart__sub">Total spend per month</div>
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" height={240} />
              ) : expenseChartType === "line" ? (
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
          </MobileSectionCard>
        </div>

        <div className="theme-drink">
          <MobileSectionCard
            title={titleWithInfo(
              "Monthly Drinking Summary",
              "3-month drink days or average level trends."
            )}
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
            persistKey="insights-drink-summary"
          >
            <div className="report-chart">
              <div className="report-summary">
                <div className="report-summary__label">
                  {drinkMetric === "avg" ? "3-mo avg level" : "3-mo total"}
                </div>
                <div className="report-summary__value">
                  {isLoading ? (
                    <Skeleton variant="text" width={64} height={26} />
                  ) : drinkMetric === "avg" ? (
                    drinkLevelWeightedAvg
                      ? drinkLevelWeightedAvg.toFixed(2)
                      : "—"
                  ) : (
                    totalDrinkDays3mo
                  )}
                </div>
              </div>
              <div className="report-chart__sub">
                {drinkMetric === "avg" ? "Average level per month" : "Drinking days per month"}
              </div>
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" height={240} />
              ) : drinkChartType === "line" ? (
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
          </MobileSectionCard>
        </div>
      </div>

      <div className="report-extra-grid">
        <div className="theme-exp">
          <MobileSectionCard
            title={titleWithInfo(
              "Cumulative Spend (3 Months)",
              "Running total of spending across the 3-month window."
            )}
            persistKey="insights-cumulative-spend"
          >
            <div className="report-chart">
              <div className="report-chart__sub">Running total across the window</div>
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" height={220} />
              ) : (
                <MonthlyLineChart
                  labels={monthLabels}
                  values={cumulativeSpend.map((v) => Math.round(v))}
                  seriesLabel="Cumulative"
                  color="#9FC8B3"
                  valueFormatter={(v) => `฿${Number(v || 0).toLocaleString()}`}
                  emptyLabel="No expenses logged in these months."
                  showMarks
                />
              )}
            </div>
          </MobileSectionCard>
        </div>

        <div className="theme-exp">
          <MobileSectionCard
            title={titleWithInfo(
              "Avg Spend per Day (3 Months)",
              "Average daily spend by month across the 3-month window."
            )}
            persistKey="insights-avg-spend-day"
          >
            <div className="report-chart">
              <div className="report-chart__sub">Monthly total divided by days in month</div>
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" height={220} />
              ) : (
                <MonthlyLineChart
                  labels={monthLabels}
                  values={avgSpendPerDayByMonth}
                  seriesLabel="Avg/Day"
                  color="#F4C76E"
                  valueFormatter={(v) => `฿${Number(v || 0).toLocaleString()}`}
                  emptyLabel="No expenses logged in these months."
                  showMarks
                />
              )}
            </div>
          </MobileSectionCard>
        </div>

        <div className="theme-wo">
          <MobileSectionCard
            title={titleWithInfo(
              "Avg Workout Intensity (3 Months)",
              "Average workout intensity by month."
            )}
            persistKey="insights-avg-intensity"
          >
            <div className="report-chart">
              <div className="report-chart__sub">Average intensity per month</div>
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" height={220} />
              ) : (
                <MonthlyLineChart
                  labels={monthLabels}
                  values={workoutIntensityByMonth}
                  seriesLabel="Avg Intensity"
                  color="#64B5F6"
                  valueFormatter={(v) => `${Number(v || 0)}`}
                  emptyLabel="No workouts logged in these months."
                  showMarks
                />
              )}
            </div>
          </MobileSectionCard>
        </div>

        <div className="theme-wo">
          <MobileSectionCard
            title={titleWithInfo(
              "Workout Volume (3 Months)",
              "Total workouts per month across the 3-month window."
            )}
            persistKey="insights-workout-volume"
          >
            <div className="report-chart">
              <div className="report-summary">
                <div className="report-summary__label">Total workouts (3 months)</div>
                <div className="report-summary__value">
                  {isLoading ? (
                    <Skeleton variant="text" width={90} height={26} />
                  ) : (
                    totalWorkouts3mo.toLocaleString()
                  )}
                </div>
              </div>
              <div className="report-chart__sub">Workouts per month</div>
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" height={220} />
              ) : (
                <MonthlyBarChart
                  labels={monthLabels}
                  values={workoutCountByMonth}
                  seriesLabel="Workouts"
                  color="#64B5F6"
                  valueFormatter={(v) => `${Number(v || 0)}`}
                  emptyLabel="No workouts logged in these months."
                />
              )}
            </div>
          </MobileSectionCard>
        </div>

        <div className="theme-wo">
          <MobileSectionCard
            title={titleWithInfo(
              "Body Tracker (3 Months)",
              "Weight or body fat trends across the last 3 months."
            )}
            right={
              <div className="report-toggle report-toggle--compact" role="group" aria-label="Body tracker metric">
                <button
                  type="button"
                  className={`report-toggle__btn ${bodyChartView === "weight" ? "is-active" : ""}`}
                  onClick={() => setBodyChartView("weight")}
                >
                  Weight
                </button>
                <button
                  type="button"
                  className={`report-toggle__btn ${bodyChartView === "fat" ? "is-active" : ""}`}
                  onClick={() => setBodyChartView("fat")}
                >
                  Body Fat
                </button>
              </div>
            }
            persistKey="insights-body-tracker"
          >
            <div className="report-chart">
              <div className="report-chart__sub">Every log across the last 3 months</div>
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" height={220} />
              ) : (
                <MonthlyLineChart
                  xAxisData={bodyDates3mo}
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
                          data: bodyWeightSeries3mo,
                          label: "Weight (kg)",
                          color: "#9FC8B3",
                          valueFormatter: (v) => `${Number(v || 0).toFixed(1)} kg`,
                        }
                      : {
                          data: bodyFatSeries3mo,
                          label: "Body Fat (%)",
                          color: "#F4C76E",
                          valueFormatter: (v) => `${Number(v || 0).toFixed(1)}%`,
                        },
                  ]}
                  emptyLabel="No body stats logged in these months."
                  showMarks
                />
              )}
            </div>
          </MobileSectionCard>
        </div>

      </div>



    </DashboardLayout>
  );
}
