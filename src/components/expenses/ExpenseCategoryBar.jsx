import { useMemo } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Box } from "@mui/material";

export default function ExpenseCategoryBar({ rows = [], height = 280, topN = 8 }) {
  const { categories, values } = useMemo(() => {
    const byCat = rows.reduce((acc, e) => {
      const cat = e.category || "Other";
      const amt = Number(e.amount || 0);
      acc[cat] = (acc[cat] || 0) + (Number.isFinite(amt) ? amt : 0);
      return acc;
    }, {});

    const sorted = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);

    return {
      categories: sorted.map(([cat]) => cat),
      values: sorted.map(([, val]) => Math.round(val)),
    };
  }, [rows, topN]);

  if (!categories.length) {
    return (
      <Box sx={{ opacity: 0.6, fontSize: 13 }}>
        No expense data for this month.
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height }}>
      <BarChart
        xAxis={[
          {
            data: categories,
            scaleType: "band",
            tickLabelStyle: {
              fill: "#ffffff",
              fontSize: 12,
            },
            labelStyle: {
              fill: "#ffffff",
            },
          },
        ]}
        yAxis={[
          {
            tickLabelStyle: {
              fill: "#ffffff",
              fontSize: 12,
              marginRight: 4,
            },
            labelStyle: {
              fill: "#ffffff",
            },
          },
        ]}
        series={[
          {
            data: values,
            label: "Total",
            color: "#7c83fd", // pastel indigo

          },
        ]}
        height={height}
        margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
        sx={{
            "& .MuiChartsLegend-root": {
    display: "none",
  },
          // axis lines
          "& .MuiChartsAxis-line": {
            stroke: "rgba(255,255,255,0.3)",
          },
          // grid lines
          "& .MuiChartsGrid-line": {
            stroke: "rgba(255,255,255,0.15)",
          },
          // tooltip
          "& .MuiChartsTooltip-root": {
            color: "#fff",
          },
        }}
      />
    </Box>
  );
}
