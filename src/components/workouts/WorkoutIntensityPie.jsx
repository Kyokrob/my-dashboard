import { PieChart } from "@mui/x-charts/PieChart";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function WorkoutIntensityPie({ rows = [] }) {
  const isMobile = useMediaQuery("(max-width: 720px)");
  const counts = rows.reduce((acc, w) => {
    const level = Number(w.intensity || 0);
    if (!Number.isFinite(level) || level <= 0) return acc;
    const key = Math.min(5, Math.max(1, Math.round(level)));
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const intensityColors = ["#6FE3C1", "#4FD6FF", "#7CB4FF", "#9FC8B3", "#5B9BD5"];
  const data = Object.entries(counts)
    .map(([level, value], i) => ({
      id: i,
      label: `Intensity ${level}`,
      value,
      color: intensityColors[(Number(level) - 1) % intensityColors.length],
    }))
    .filter((row) => row.value > 0);

  if (!data.length) {
    return <div style={{ opacity: 0.6, fontSize: 13 }}>No intensity data</div>;
  }

  const totalWorkouts = data.reduce((sum, d) => sum + d.value, 0);
  const size = isMobile ? 220 : 260;
  const outerRadius = isMobile ? 82 : 95;
  const innerRadius = isMobile ? 44 : 50;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 650, color: "#fff", textAlign: "center" }}>
        Workout Intensity
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, color: "#fff", textAlign: "center" }}>
        Total {totalWorkouts.toLocaleString()} · by intensity (this month)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PieChart
            series={[
              {
                data,
                innerRadius,
                outerRadius,
                paddingAngle: 3,
                cornerRadius: 6,
                arcLabelMinAngle: 12,
                arcLabelRadius: "60%",
              },
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
            }}
          />
        </div>
        <div style={{ display: "grid", gap: 8, minWidth: 140, fontSize: 12 }}>
          {data.map((row) => (
            <div
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns: "10px 1fr auto",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: row.color }} />
              <span style={{ opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {row.label}
              </span>
              <span style={{ fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
