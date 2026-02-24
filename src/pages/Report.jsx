import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import SectionCard from "../components/common/SectionCard.jsx";
import { apiFetch } from "../api/apiFetch.js";
import { useDashboard } from "../context/DashboardContext.jsx";
import { inMonth } from "../utils/date.js";
import "./Report.scss";

export default function Report() {
  const { monthKey } = useDashboard();
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

  const monthExpenses = expenses.filter((e) => inMonth(e.date, monthKey));
  const monthDrinks = drinks.filter((d) => inMonth(d.date, monthKey));

  const [curY, curM] = monthKey.split("-").map(Number);
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === curY && now.getMonth() + 1 === curM;
  const asOfDay = isCurrentMonth ? now.getDate() : new Date(curY, curM, 0).getDate();

  const [prevY, prevM] = (() => {
    const d = new Date(curY, curM - 2, 1);
    return [d.getFullYear(), d.getMonth() + 1];
  })();
  const prevMonthKey = `${prevY}-${String(prevM).padStart(2, "0")}`;
  const prevMonthExpenses = expenses.filter((e) => inMonth(e.date, prevMonthKey));

  const prevMonthMTD = prevMonthExpenses
    .filter((e) => Number(e.date.split("-")[2]) <= asOfDay)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const thisMonthMTD = monthExpenses
    .filter((e) => Number(e.date.split("-")[2]) <= asOfDay)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const mtdPct = prevMonthMTD > 0 ? ((thisMonthMTD - prevMonthMTD) / prevMonthMTD) * 100 : null;
  const mtdPctText = mtdPct === null ? "—" : `${mtdPct > 0 ? "+" : ""}${mtdPct.toFixed(1)}%`;
  const mtdTone = mtdPct === null ? "neutral" : mtdPct > 0 ? "bad" : "good";

  const drinkDays = monthDrinks.filter((d) => d.drank).length;
  const drinkDaysPct = asOfDay ? (drinkDays / asOfDay) * 100 : 0;
  const drinkPctText = `${drinkDaysPct.toFixed(0)}%`;

  return (
    <DashboardLayout title="Insights">
      <div className="report-grid">
        <SectionCard title="Spending vs Last Month (MTD)">
          <div className="report-card">
            <div className={`report-card__value report-card__value--${mtdTone}`}>{mtdPctText}</div>
            <div className="report-card__sub">Same-day window</div>
          </div>
        </SectionCard>

        <SectionCard title="Drink Days %">
          <div className="report-card">
            <div className="report-card__value">{drinkPctText}</div>
            <div className="report-card__sub">
              {drinkDays} / {asOfDay} days
            </div>
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
