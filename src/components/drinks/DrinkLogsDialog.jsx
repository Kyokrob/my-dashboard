import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import "./DrinkLogsDialog.scss";

const LABELS = [
  ["date", "Date"],
  ["name", "Session name"],
  ["level", "Level"],
  ["durationHours", "Duration (hours)"],
  ["reasons", "Reasons"],
  ["otherReason", "Other reason"],
  ["venue", "Venue"],
  ["startTime", "Start time"],
  ["enjoyment", "Enjoyment"],
  ["regret", "Regret"],
  ["wouldRepeat", "Would repeat"],
  ["note", "Note"],
];

function formatValue(key, value) {
  if (value === null || value === undefined || value === "") return "-";
  if (key === "reasons") return Array.isArray(value) ? value.join(", ") : "-";
  if (key === "wouldRepeat") return value ? "Yes" : "No";
  if (key === "level") return "🍺".repeat(Number(value || 1));
  return String(value);
}

export default function DrinkLogsDialog({ open, onClose, row }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Drink Log
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <div className="drink-logs">
          {!row && <div className="drink-logs__empty">No log selected.</div>}
          {row && (
            <div className="drink-logs__card">
              {LABELS.map(([key, label]) => (
                <div key={key} className="drink-logs__row">
                  <div className="drink-logs__label">{label}</div>
                  <div className="drink-logs__value">{formatValue(key, row[key])}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
