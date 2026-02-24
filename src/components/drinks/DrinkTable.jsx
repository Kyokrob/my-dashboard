import "./DrinkTable.scss";
import EditIcon from "@mui/icons-material/Edit";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";

function formatLevel(level) {
  const n = Math.max(1, Math.min(5, Number(level || 1)));
  return "🍺".repeat(n);
}

export default function DrinkTable({ rows = [], onEdit, onDelete, onView, loading = false }) {
  if (loading) {
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
        {Array.from({ length: 8 }).map((_, idx) => (
          <div className="dtable__row" key={`sk-${idx}`}>
            <div><Skeleton height={18} width="70%" /></div>
            <div><Skeleton height={18} width="60%" /></div>
            <div><Skeleton height={18} width="50%" /></div>
            <div><Skeleton height={18} width="40%" /></div>
            <div><Skeleton height={18} width="80%" /></div>
            <div><Skeleton height={18} width="50%" /></div>
            <div><Skeleton height={18} width="70%" /></div>
            <div className="actions right"><Skeleton height={18} width={24} /></div>
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="dtable__empty">
        <div className="dtable__emptyTitle">No data yet</div>
        <div className="dtable__emptySub">Log your first drink to see insights.</div>
      </div>
    );
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
