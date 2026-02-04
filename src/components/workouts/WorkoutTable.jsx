import { useMemo, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import Pagination from "@mui/material/Pagination";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";

import "./WorkoutTable.scss";

const INTENSITIES = ["All", 1, 2, 3, 4, 5];

export default function WorkoutTable({
  rows,
  pageSize = 10,
  onUpdate,
  onRequestDelete,
}) {
  // inline edit
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

  // filters + paging
  const [type, setType] = useState("All");
  const [intensity, setIntensity] = useState("All");
  const [page, setPage] = useState(1);

  const WORKOUT_TYPES = useMemo(() => {
    const uniq = Array.from(new Set(rows.map((r) => r.workoutType).filter(Boolean)));
    return ["All", ...uniq];
  }, [rows]);

  const filteredSorted = useMemo(() => {
    return [...rows]
      .filter((r) => (type === "All" ? true : r.workoutType === type))
      .filter((r) =>
        intensity === "All" ? true : Number(r.intensity) === Number(intensity)
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  }, [rows, type, intensity]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filteredSorted.slice(start, start + pageSize);

  const fieldSx = {
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.65)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#1dd1a1" },
    "& .MuiOutlinedInput-root": {
      height: { xs: 36, sm: 42 },
      color: "rgba(255,255,255,0.92)",
      background: "rgba(255,255,255,0.06)",
      borderRadius: "12px",
      "& fieldset": { borderColor: "rgba(255,255,255,0.18)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
      "&.Mui-focused fieldset": { borderColor: "#1dd1a1" },
      "& input, & .MuiSelect-select": { padding: { xs: "8px 10px", sm: "10px 12px" } },
    },
    "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.7)" },
  };

  function startEdit(row) {
    setEditingId(row.id);
    setDraft({ ...row });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }

  function saveEdit() {
    if (!draft?.id) return;

    onUpdate({
      ...draft,
      intensity: draft.intensity === "" ? null : Number(draft.intensity),
      weight: draft.weight === "" ? null : Number(draft.weight),
      bodyFat: draft.bodyFat === "" ? null : Number(draft.bodyFat),
      drink: Boolean(draft.drink),
    });

    cancelEdit();
  }

  return (
    <div className="wtable">
      {/* Controls (no Search) */}
      <div className="wtable__controls">
        <TextField
          className="wtable__field"
          select
          size="small"
          label="Type"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: { xs: 160, sm: 200 }, ...fieldSx }}
        >
          {WORKOUT_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          className="wtable__field"
          select
          size="small"
          label="Intensity"
          value={intensity}
          onChange={(e) => {
            setIntensity(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: { xs: 120, sm: 140 }, ...fieldSx }}
        >
          {INTENSITIES.map((i) => (
            <MenuItem key={i} value={i}>
              {i === "All" ? "All" : i}
            </MenuItem>
          ))}
        </TextField>

        <div className="wtable__meta">
          Showing <b>{pageRows.length}</b> of <b>{filteredSorted.length}</b>
        </div>
      </div>

      {/* Table */}
      <div className="wgrid">
        <div className="wgrid__row wgrid__row--head">
          <div>Date</div>
          <div>Workout</div>
          <div className="center">Intensity</div>
          <div className="right">Weight</div>
          <div className="right">BF%</div>
          <div>Feel</div>
           <div>Note</div>
          <div className="center">Drink</div>
          <div className="right">Actions</div>
        </div>

        {pageRows.map((r) => {
          const isEdit = editingId === r.id;

          return (
            <div className={`wgrid__row ${isEdit ? "is-edit" : ""}`} key={r.id}>
              <div>
                {isEdit ? (
                  <input
                    type="date"
                    value={draft.date || ""}
                    onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  />
                ) : (
                  r.date
                )}
              </div>

              <div>
                {isEdit ? (
                  <input
                    value={draft.workoutType || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, workoutType: e.target.value })
                    }
                  />
                ) : (
                  r.workoutType
                )}
              </div>

              <div className="center">
                {isEdit ? (
                  <select
                    value={draft.intensity ?? 3}
                    onChange={(e) => setDraft({ ...draft, intensity: e.target.value })}
                  >
                    {[1, 2, 3, 4, 5].map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                ) : (
                  r.intensity ?? "-"
                )}
              </div>

              <div className="right">
                {isEdit ? (
                  <input
                    type="number"
                    step="0.1"
                    value={draft.weight ?? ""}
                    onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
                  />
                ) : (
                  r.weight ?? "-"
                )}
              </div>

              <div className="right">
                {isEdit ? (
                  <input
                    type="number"
                    step="0.1"
                    value={draft.bodyFat ?? ""}
                    onChange={(e) => setDraft({ ...draft, bodyFat: e.target.value })}
                  />
                ) : (
                  r.bodyFat ?? "-"
                )}
              </div>

              <div>
                {isEdit ? (
                  <input
                    value={draft.feel || ""}
                    onChange={(e) => setDraft({ ...draft, feel: e.target.value })}
                  />
                ) : (
                  r.feel || "-"
                )}
              </div>

              <div>
                {isEdit ? (
                  <input
                    value={draft.note || ""}
                    onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                  />
                ) : (
                  r.note || "-"
                )}
              </div>

              <div className="center">
                {isEdit ? (
                  <input
                    type="checkbox"
                    checked={Boolean(draft.drink)}
                    onChange={(e) => setDraft({ ...draft, drink: e.target.checked })}
                  />
                ) : (
                  r.drink ? "Yes" : "No"
                )}
              </div>

              <div className="actions">
                {isEdit ? (
                  <>
                    <Tooltip title="Save">
                      <button className="icon-btn success" onClick={saveEdit}>
                        <SaveIcon fontSize="small" />
                      </button>
                    </Tooltip>

                    <Tooltip title="Cancel">
                      <button className="icon-btn neutral" onClick={cancelEdit}>
                        <CancelIcon fontSize="small" />
                      </button>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <button
                        className="icon-btn danger"
                        onClick={() => onRequestDelete(r.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </button>
                    </Tooltip>
                  </>
                ) : (
                  <Tooltip title="Edit">
                    <button className="icon-btn neutral" onClick={() => startEdit(r)}>
                      <EditIcon fontSize="small" />
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="wtable__pager">
        <Pagination
          count={totalPages}
          page={safePage}
          onChange={(e, value) => setPage(value)}
          size="small"
          sx={{
            "& .MuiPaginationItem-root": {
              color: "rgba(255,255,255,0.85)",
              borderRadius: "8px",
            },
            "& .MuiPaginationItem-root:hover": {
              background: "rgba(255,255,255,0.12)",
            },
            "& .Mui-selected": {
              background: "rgba(29,209,161,0.22) !important",
              color: "#1dd1a1",
              fontWeight: 600,
            },
          }}
        />
      </div>
    </div>
  );
}
