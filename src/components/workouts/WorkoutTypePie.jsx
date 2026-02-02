import { PieChart } from "@mui/x-charts/PieChart";

export default function WorkoutTypePie({ rows = [] }) {
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

  return (
   <PieChart
  series={[
    {
      data,
      innerRadius: 50,
      outerRadius: 95,
      paddingAngle: 3,
      cornerRadius: 10,
      // arcLabel: (item) => `${item.value}`,
      arcLabelMinAngle: 12,
      arcLabelRadius: "60%",
    },
  ]}
  width={260}
  height={260}
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


  );
}
