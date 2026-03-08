import { BarChart } from "@mui/x-charts/BarChart";
import { Box } from "@mui/material";

export default function MonthlyBarChart({
  labels = [],
  values = [],
  height = 260,
  color = "#7c83fd",
  seriesLabel = "Total",
  valueFormatter,
  emptyLabel = "No data yet.",
}) {
  const hasData = values.some((v) => Number(v || 0) > 0);

  if (!labels.length || !hasData) {
    return (
      <Box sx={{ opacity: 0.6, fontSize: 13 }}>
        {emptyLabel}
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height }}>
      <BarChart
        xAxis={[
          {
            data: labels,
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
            valueFormatter,
          },
        ]}
        series={[
          {
            data: values,
            label: seriesLabel,
            color,
            valueFormatter,
          },
        ]}
        height={height}
        margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
        sx={{
          "& .MuiChartsLegend-root": {
            display: "none",
          },
          "& .MuiChartsAxis-line": {
            stroke: "rgba(255,255,255,0.3)",
          },
          "& .MuiChartsGrid-line": {
            stroke: "rgba(255,255,255,0.15)",
          },
          "& .MuiChartsTooltip-root": {
            color: "#fff",
          },
        }}
      />
    </Box>
  );
}
