import { PieChart } from "@mui/x-charts/PieChart";

function parseAmount(value) {
  if (value === null || value === undefined) return 0;

  // already a number
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  // string: remove commas, currency symbols, spaces
  const cleaned = String(value)
    .replace(/฿/g, "")
    .replace(/,/g, "")
    .trim();

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export default function ExpenseCategoryPie({ rows = [] }) {
  const totals = rows.reduce((acc, e) => {
    const key = e.category || "Other";
    const amt = parseAmount(e.amount);
    acc[key] = (acc[key] || 0) + amt;
    return acc;
  }, {});

  const data = Object.entries(totals)
    .map(([label, value], i) => ({
      id: i,
      label,
      value: Math.round(value),
    }))
    .filter((d) => Number.isFinite(d.value) && d.value > 0) // ✅ remove 0/NaN slices
    .sort((a, b) => b.value - a.value);

  const totalSpend = data.reduce((s, d) => s + d.value, 0);

  if (!data.length) {
    return <div style={{ opacity: 0.6, fontSize: 13 }}>No expenses logged</div>;
  }

  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 6 }}>
      <div style={{ fontSize: 14, fontWeight: 650, color: "#fff" }}>
        Expense Mix
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, color: "#fff" }}>
        Total ฿{totalSpend.toLocaleString()} · by category (this month)
      </div>

      <PieChart
        series={[
          {
            data,
            innerRadius: 55,
            outerRadius: 90,
            paddingAngle: 3,
            cornerRadius: 6,
            valueFormatter: (v) => {
              const pct = totalSpend ? Math.round((Number(v) / totalSpend) * 100) : 0;
              return `฿${Number(v).toLocaleString()} (${pct}%)`;
            },
          },
        ]}
        width={300}
        height={310}
        slotProps={{ legend: { hidden: true } }}
        sx={{
    "& .MuiPieArcLabel-root": {
      fill: "#fff",
      fontWeight: 600,
      fontSize: 12,
    },
    "& .css-1308xjd-MuiChartsLegend-root": {
      color: "white"
    }
  }}
      />
    </div>
  );
}
