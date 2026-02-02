import { useState } from "react";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";

import "./TodoList.scss";

export default function TodoList({ rows = [], onAdd, onUpdate, onDelete }) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  function handleAdd() {
    if (!draft.trim()) return;

    onAdd({
      id: crypto.randomUUID(),
      text: draft.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    });

    setDraft("");
  }

  function toggleDone(row) {
    onUpdate({ ...row, done: !row.done });
  }

  function startEdit(row) {
    setEditingId(row.id);
    setEditingText(row.text);
  }

  function saveEdit(row) {
    if (!editingText.trim()) return;
    onUpdate({ ...row, text: editingText.trim() });
    setEditingId(null);
    setEditingText("");
  }

  return (
    <div className="todo">
      {/* ADD */}
      <div className="todo__add">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add new task..."
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className="icon-btn success" onClick={handleAdd}>
          <CheckIcon fontSize="small" />
        </button>
      </div>

      {/* LIST */}
      <div className="todo__list">
        {rows.length === 0 && (
          <div className="todo__empty">No tasks yet</div>
        )}

        {rows.map((row) => (
          <div
            key={row.id}
            className={`todo__row ${row.done ? "is-done" : ""}`}
          >
            <button
              className={`todo__check ${row.done ? "checked" : ""}`}
              onClick={() => toggleDone(row)}
            />

            {editingId === row.id ? (
              <input
                className="todo__editInput"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(row)}
              />
            ) : (
              <div className="todo__text">{row.text}</div>
            )}

            <div className="todo__actions">
              {editingId === row.id ? (
                <>
                  <button
                    className="icon-btn success"
                    onClick={() => saveEdit(row)}
                  >
                    <CheckIcon fontSize="small" />
                  </button>
                  <button
                    className="icon-btn neutral"
                    onClick={() => setEditingId(null)}
                  >
                    <CloseIcon fontSize="small" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="icon-btn neutral"
                    onClick={() => startEdit(row)}
                  >
                    <EditIcon fontSize="small" />
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => onDelete(row.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
