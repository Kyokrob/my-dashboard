import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const MIN_MONTH = "2026-01";


function isBeforeMin(monthKey) {
  return monthKey < MIN_MONTH;
}


function shiftMonth(monthKey, delta) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthPicker({ value, onChange }) {
  const label = new Date(
    Number(value.split("-")[0]),
    Number(value.split("-")[1]) - 1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Tooltip title="Previous month">
        <IconButton
          size="small"
          onClick={() => onChange(shiftMonth(value, -1))}
          disabled={isBeforeMin(shiftMonth(value, -1))}
          sx={{
    color: "rgba(255,255,255,0.9)",
    "&:hover": {
      backgroundColor: "rgba(255,255,255,0.08)",
    },
  }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <div
        style={{
          minWidth: 120,
          textAlign: "center",
          fontWeight: 600,
        }}
      >
        {label}
      </div>

      <Tooltip title="Next month">
        <IconButton
          size="small"
          onClick={() => onChange(shiftMonth(value, 1))}
          sx={{
    color: "rgba(255,255,255,0.9)",
    "&:hover": {
      backgroundColor: "rgba(255,255,255,0.08)",
    },
  }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
}
