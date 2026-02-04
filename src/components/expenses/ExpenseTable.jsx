import { useMemo, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import Pagination from "@mui/material/Pagination";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";

import { formatTHB } from "../../utils/money.js";
import "./ExpenseTable.scss";

const CATEGORIES = ["All", "Eat", "Drink", "Golf", "Transport", "Shopping", "Billing", "Others", "Etc"];

export default function ExpenseTable({
  rows,
  onUpdate,
  onRequestDelete,
  pageSize = 10,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

  // filters + paging
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  function startEdit(row) {
    setEditingId(row.id);
    setDraft({ ...row });
  }
  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }
  function saveEdit() {
    onUpdate(draft);
    cancelEdit();
  }

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...rows]
      .filter((r) => (category === "All" ? true : r.category === category))
      .filter((r) => {
        if (!q) return true;
        const hay = `${r.subCategory || ""} ${r.type || ""} ${r.note || ""}`.toLowerCase();
        return hay.includes(q);
      })
      // newest first (YYYY-MM-DD sorts lexicographically)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [rows, category, search]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));

  // keep page in range if filters reduce results
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filteredSorted.slice(start, start + pageSize);

  return (
    <div className="etable">
      {/* Controls */}
      <div className="etable__controls">
       <TextField
  className="etable__field"
  select
  size="small"
  label="Category"
  value={category}
  onChange={(e) => {
    setCategory(e.target.value);
    setPage(1);
  }}
  sx={{
    minWidth: { xs: 140, sm: 180 },
    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.65)",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#1dd1a1",
    },
    "& .MuiOutlinedInput-root": {
      height: { xs: 36, sm: 42 },
      color: "rgba(255,255,255,0.92)",
      background: "rgba(255,255,255,0.06)",
      borderRadius: "12px",
      "& input, & .MuiSelect-select": {
        padding: { xs: "8px 10px", sm: "10px 12px" },
      },
      "& fieldset": {
        borderColor: "rgba(255,255,255,0.18)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255,255,255,0.35)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#1dd1a1",
      },
    },
    "& .MuiSvgIcon-root": {
      color: "rgba(255,255,255,0.7)",
    },
  }}
>
  {CATEGORIES.map((c) => (
    <MenuItem key={c} value={c}>
      {c}
    </MenuItem>
  ))}
</TextField>



        <TextField
  className="etable__field"
  size="small"
  label="Search"
  value={search}
  onChange={(e) => {
    setSearch(e.target.value);
    setPage(1);
  }}
  placeholder="sub / type / note"
  sx={{
    minWidth: { xs: 200, sm: 260, md: 300 },
    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.65)",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#1dd1a1",
    },
    "& .MuiOutlinedInput-root": {
      height: { xs: 36, sm: 42 },
      color: "rgba(255,255,255,0.92)",
      background: "rgba(255,255,255,0.06)",
      borderRadius: "12px",
      "& input": {
        padding: { xs: "8px 10px", sm: "10px 12px" },
      },
      "& fieldset": {
        borderColor: "rgba(255,255,255,0.18)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255,255,255,0.35)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#1dd1a1",
      },
    },
  }}
/>



        <div className="etable__meta">
          Showing <b>{pageRows.length}</b> of <b>{filteredSorted.length}</b>
        </div>
      </div>

      {/* Table */}
      <div className="table">
        <div className="table__row table__row--head">
          <div>Date</div>
          <div className="right">Amount</div>
          <div className="center">Category</div>
          <div className="center">Sub</div>
          <div className="center">Type</div>
          <div className="right">Actions</div>
        </div>

        {pageRows.map((r) => {
          const isEdit = editingId === r.id;

          return (
            <div className={`table__row ${isEdit ? "is-edit" : ""}`} key={r.id}>
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

              <div className="right">
                {isEdit ? (
                  <input
                    type="number"
                    value={draft.amount ?? ""}
                    onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
                  />
                ) : (
                  formatTHB(r.amount)
                )}
              </div>

              <div className="center">
                {isEdit ? (
                  <select
                    value={draft.category || "Eat"}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  r.category
                )}
              </div>

              <div className="center">
                {isEdit ? (
                  <input
                    value={draft.subCategory || ""}
                    onChange={(e) => setDraft({ ...draft, subCategory: e.target.value })}
                  />
                ) : (
                  r.subCategory || "-"
                )}
              </div>

              <div className="center">
                {isEdit ? (
                  <input
                    value={draft.type || ""}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                  />
                ) : (
                  r.type || "-"
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
                      <button className="icon-btn danger" onClick={() => onRequestDelete(r.id)}>
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
      <div className="etable__pager">
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
