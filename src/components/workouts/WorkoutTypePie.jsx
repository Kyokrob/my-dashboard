import { PieChart } from "@mui/x-charts/PieChart";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function WorkoutTypePie({ rows = [] }) {
  const isMobile = useMediaQuery("(max-width: 720px)");
  const counts = rows.reduce((acc, w) => {
    const key = w.workout || w.workoutType || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const intensityCounts = rows.reduce((acc, w) => {
    const level = Number(w.intensity || 0);
    if (!Number.isFinite(level) || level <= 0) return acc;
    const key = Math.min(5, Math.max(1, Math.round(level)));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([label, value], i) => ({
    id: i,
    label,
    value,
  }));

  const intensityColors = ["#A7D3FF", "#7CB4FF", "#5B9BD5", "#3F7FBF", "#2E5D8F"];
  const intensityData = Object.entries(intensityCounts)
    .map(([level, value], i) => ({
      id: `i-${level}`,
      label: `Intensity ${level}`,
      value,
      color: intensityColors[(Number(level) - 1) % intensityColors.length],
    }))
    .filter((row) => row.value > 0);

  if (!data.length) {
    return <div style={{ opacity: 0.6, fontSize: 13 }}>No workouts logged</div>;
  }

  const size = isMobile ? 220 : 260;
  const outerRadius = isMobile ? 82 : 95;
  const innerRadius = isMobile ? 44 : 50;
  const ringGap = isMobile ? 8 : 10;

  return (
    <PieChart
      series={[
        {
          data,
          innerRadius,
          outerRadius,
          paddingAngle: 3,
          cornerRadius: 10,
          // arcLabel: (item) => `${item.value}`,
          arcLabelMinAngle: 12,
          arcLabelRadius: "60%",
        },
        ...(intensityData.length
          ? [
              {
                id: "intensity",
                data: intensityData,
                innerRadius: outerRadius + ringGap,
                outerRadius: outerRadius + ringGap + (isMobile ? 12 : 14),
                paddingAngle: 2,
                cornerRadius: 8,
                arcLabelMinAngle: 999,
              },
            ]
          : []),
      ]}
      width={size}
      height={size}
      legend={{ hidden: true }}
      sx={{
        "& .MuiChartsLegend-root": {
          display: "none",
        },
        "& .MuiPieArcLabel-root": {
          fill: "#fff",
          fontWeight: 600,
          fontSize: 12,
        },
        "& .MuiPieArc-root[data-series-id='intensity']": {
          opacity: 0.7,
        },
      }}
    />
  );
}
