import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import "../../styles/forms.scss";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ExpenseForm({ initial, onSubmit, onDelete }) {
  const [form, setForm] = useState({
    date: todayISO(),
    amount: "",
    category: "Eat",
    subCategory: "",
    type: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initial?.id) {
      setForm({
        date: initial.date || todayISO(),
        amount: initial.amount ?? "",
        category: initial.category || "Eat",
        subCategory: initial.subCategory || "",
        type: initial.type || "",
      });
    } else {
      setForm({ date: todayISO(), amount: "", category: "Eat", subCategory: "", type: "" });
    }
  }, [initial]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.date || !form.amount) return;

    try {
      setSubmitting(true);
      await onSubmit?.({
        id: initial?.id ?? crypto.randomUUID(),
        ...form,
        amount: Number(form.amount),
      });
      setForm({ date: todayISO(), amount: "", category: "Eat", subCategory: "", type: "" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form__grid">
        <div className="form__row">
          <label className="form__label" htmlFor="expense-date">Date</label>
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
          <label className="form__label" htmlFor="expense-amount">Amount</label>
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
            <option>Eat</option>
            <option>Drink</option>
            <option>Golf</option>
            <option>Transport</option>
            <option>Shopping</option>
            <option>Billing</option>
            <option>Others</option>
            <option>Etc</option>
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
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting ? "Saving..." : initial?.id ? "Save Changes" : "Add Expense"}
        </Button>
      </div>

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
