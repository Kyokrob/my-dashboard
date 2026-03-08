import { LineChart } from "@mui/x-charts/LineChart";
import { Box } from "@mui/material";

export default function MonthlyLineChart({
  labels = [],
  values = [],
  height = 260,
  color = "#7c83fd",
  seriesLabel = "Total",
  valueFormatter,
  emptyLabel = "No data yet.",
  dashed = false,
  showMarks = false,
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
      <LineChart
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
            curve: "linear",
            showMark: showMarks,
          },
        ]}
        height={height}
        margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
        sx={{
          "& .MuiChartsLegend-root": {
            display: "none",
          },
          "& .MuiLineElement-root": dashed
            ? {
                strokeDasharray: "4 4",
              }
            : undefined,
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
