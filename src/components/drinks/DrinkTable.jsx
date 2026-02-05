import "./DrinkTable.scss";
import EditIcon from "@mui/icons-material/Edit";
import Tooltip from "@mui/material/Tooltip";

function formatLevel(level) {
  const n = Math.max(1, Math.min(5, Number(level || 1)));
  return "🍺".repeat(n);
}

export default function DrinkTable({ rows = [], onEdit, onDelete, onView }) {
  if (!rows.length) {
    return <div style={{ opacity: 0.6, fontSize: 13 }}>No drink logs yet.</div>;
  }

  return (
    <div className="dtable">
      <div className="dtable__row dtable__row--head">
        <div>Name</div>
        <div>Date</div>
        <div>Level</div>
        <div>Duration</div>
        <div>Reasons</div>
        <div>Start time</div>
        <div>Note</div>
        <div className="right">Actions</div>
      </div>

      {rows.map((r) => (
        <div className="dtable__row" key={r.id ?? r._id}>
          <div>{r.name || "-"}</div>
          <div>{r.date}</div>
          <div>{formatLevel(r.level)}</div>
          <div>{r.durationHours ? `${r.durationHours}h` : "-"}</div>
          <div className="dtable__reasons">
            {(r.reasons || []).length ? r.reasons.join(", ") : "-"}
            {r.otherReason ? ` · ${r.otherReason}` : ""}
          </div>
          <div>{r.startTime || "-"}</div>
          <div className="dtable__note">{r.note || "-"}</div>
          <div className="actions right">
            <button className="link-btn" onClick={() => onView?.(r)}>
              View
            </button>
            <Tooltip title="Edit">
              <button className="icon-btn neutral" onClick={() => onEdit?.(r)}>
                <EditIcon fontSize="small" />
              </button>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}
