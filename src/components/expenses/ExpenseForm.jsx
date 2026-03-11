import { useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useDashboard } from "../../context/DashboardContext.jsx";
import "../../styles/forms.scss";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ExpenseForm({ initial, onSubmit, onDelete }) {
  const { expenseCategories } = useDashboard();
  const fallbackCategories = useMemo(() => {
    const activeCategories = (expenseCategories || [])
      .filter((c) => c.enabled !== false)
      .map((c) => c.label)
      .filter(Boolean);
    return activeCategories.length
      ? activeCategories
      : ["Eat", "Drink", "Golf", "Transport", "Shopping", "Billing", "Others", "Etc"];
  }, [expenseCategories]);
  const fallbackKey = fallbackCategories.join("|");
  const [form, setForm] = useState({
    date: todayISO(),
    amount: "",
    category: fallbackCategories[0] || "Eat",
    subCategory: "",
    type: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isValid = Boolean(form.date && String(form.amount).trim() !== "");

  useEffect(() => {
    if (initial?.id) {
      setForm({
        date: initial.date || todayISO(),
        amount: initial.amount ?? "",
        category: initial.category || fallbackCategories[0] || "Eat",
        subCategory: initial.subCategory || "",
        type: initial.type || "",
      });
    } else {
      setForm({
        date: todayISO(),
        amount: "",
        category: fallbackCategories[0] || "Eat",
        subCategory: "",
        type: "",
      });
    }
  }, [initial, fallbackKey]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) {
      setError("Please add a date and amount.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit?.({
        id: initial?.id ?? crypto.randomUUID(),
        ...form,
        amount: Number(form.amount),
      });
      setForm({
        date: todayISO(),
        amount: "",
        category: fallbackCategories[0] || "Eat",
        subCategory: "",
        type: "",
      });
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to save. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form__grid">
        <div className="form__row">
          <label className="form__label" htmlFor="expense-date">Date *</label>
          <input
            id="expense-date"
            className="form__input"
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />
        </div>

        <div className="form__row">
          <label className="form__label" htmlFor="expense-amount">Amount *</label>
          <input
            id="expense-amount"
            className="form__input"
            type="number"
            inputMode="decimal"
            pattern="[0-9.]*"
            name="amount"
            placeholder="0"
            value={form.amount}
            onChange={handleChange}
          />
        </div>

        <div className="form__row">
          <label className="form__label" htmlFor="expense-category">Category</label>
          <select
            id="expense-category"
            className="form__select"
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            {fallbackCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form__row">
          <label className="form__label" htmlFor="expense-sub">Sub category</label>
          <input
            id="expense-sub"
            className="form__input"
            name="subCategory"
            placeholder="e.g., Lunch"
            value={form.subCategory}
            onChange={handleChange}
          />
        </div>

        <div className="form__row form__row--full">
          <label className="form__label" htmlFor="expense-type">Type</label>
          <input
            id="expense-type"
            className="form__input"
            name="type"
            placeholder="Card / Cash / Transfer"
            value={form.type}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form__actions">
        <Button
          type="submit"
          fullWidth
          disabled={submitting || !isValid}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting ? "Saving..." : initial?.id ? "Save Changes" : "Add Expense"}
        </Button>
      </div>
      {error && <div className="form__error">{error}</div>}

      {onDelete && (
        <div className="form__actions">
          <Button variant="outlined" color="error" onClick={onDelete} fullWidth>
            Delete Log
          </Button>
        </div>
      )}
    </form>
  );
}
