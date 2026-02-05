import { useMemo, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import Pagination from "@mui/material/Pagination";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

import EditIcon from "@mui/icons-material/Edit";

import "./WorkoutTable.scss";

const INTENSITIES = ["All", 1, 2, 3, 4, 5];

export default function WorkoutTable({
  rows,
  pageSize = 10,
  onEdit,
}) {
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
          <div className="center">Feel</div>
           <div>Note</div>
          <div className="right">Actions</div>
        </div>

        {pageRows.map((r) => {
          return (
            <div className="wgrid__row" key={r.id}>
              <div>{r.date}</div>
              <div>{r.workoutType}</div>
              <div className="center">{r.intensity ?? "-"}</div>
              <div className="right">{r.weight ?? "-"}</div>
              <div className="right">{r.bodyFat ?? "-"}</div>
              <div className="center">{r.feel || "-"}</div>
              <div>{r.note || "-"}</div>

              <div className="actions">
                <Tooltip title="Edit">
                  <button className="icon-btn neutral" onClick={() => onEdit?.(r)}>
                    <EditIcon fontSize="small" />
                  </button>
                </Tooltip>
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
