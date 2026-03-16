import { LineChart } from "@mui/x-charts/LineChart";
import { Box } from "@mui/material";

export default function MonthlyLineChart({
  labels = [],
  values = [],
  series,
  xAxisData,
  xAxisScaleType = "band",
  xAxisValueFormatter,
  height = 260,
  color = "#7c83fd",
  seriesLabel = "Total",
  valueFormatter,
  emptyLabel = "No data yet.",
  dashed = false,
  showMarks = false,
  curve = "linear",
  yAxisMin,
  yAxisMax,
}) {
  const seriesList = Array.isArray(series) && series.length
    ? series
    : [
        {
          data: values,
          label: seriesLabel,
          color,
          valueFormatter,
        },
      ];

  const hasData = seriesList.some((s) => (s.data || []).some((v) => Number(v || 0) > 0));
  const hasXAxis = (Array.isArray(xAxisData) && xAxisData.length) || labels.length;

  if (!hasXAxis || !hasData) {
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
            data: xAxisData || labels,
            scaleType: xAxisData ? xAxisScaleType : "band",
            valueFormatter: xAxisValueFormatter,
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
            min: typeof yAxisMin === "number" ? yAxisMin : undefined,
            max: typeof yAxisMax === "number" ? yAxisMax : undefined,
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
        series={seriesList.map((s) => ({
          data: s.data,
          label: s.label,
          color: s.color,
          valueFormatter: s.valueFormatter || valueFormatter,
          curve,
          showMark: showMarks,
        }))}
        height={height}
        margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
        sx={{
          "& .MuiChartsLegend-root": {
            display: seriesList.length > 1 ? "block" : "none",
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
