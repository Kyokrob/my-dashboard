import { PieChart } from "@mui/x-charts/PieChart";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function WorkoutTypePie({ rows = [] }) {
  const isMobile = useMediaQuery("(max-width: 720px)");
  const counts = rows.reduce((acc, w) => {
    const key = w.workout || w.workoutType || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([label, value], i) => ({
    id: i,
    label,
    value,
  }));

  if (!data.length) {
    return <div style={{ opacity: 0.6, fontSize: 13 }}>No workouts logged</div>;
  }

  const size = isMobile ? 220 : 260;
  const outerRadius = isMobile ? 82 : 95;
  const innerRadius = isMobile ? 44 : 50;

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
      ]}
      width={size}
      height={size}
      sx={{
        "& .MuiPieArcLabel-root": {
          fill: "#fff",
          fontWeight: 600,
          fontSize: 12,
        },
        "& .MuiChartsLegend-root, & .MuiChartsLegend-root text": {
          color: "#fff",
          fill: "#fff",
        },
      }}
    />
  );
}
