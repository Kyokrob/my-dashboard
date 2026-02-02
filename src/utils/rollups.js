import { inMonth } from "./date.js";

export function sumExpensesByCategory(expenses, monthKey) {
  const totals = {};
  for (const e of expenses) {
    if (!inMonth(e.date, monthKey)) continue;
    totals[e.category] = (totals[e.category] || 0) + Number(e.amount || 0);
  }
  return totals;
}

export function getStatus(remaining, budget) {
  if (budget <= 0) return "On Track";
  if (remaining < 0) return "Over Budget";
  const ratio = remaining / budget;
  if (ratio <= 0.2) return "Warning";
  return "On Track";
}
