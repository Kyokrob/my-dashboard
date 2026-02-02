import { useState } from "react";

export default function ExpenseForm({ onAdd }) {
  const [form, setForm] = useState({
    date: "",
    amount: "",
    category: "Eat",
    subCategory: "",
    type: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.date || !form.amount) return;

    onAdd({
      id: crypto.randomUUID(),
      ...form,
      amount: Number(form.amount),
    });

    setForm({ date: "", amount: "", category: "Eat", subCategory: "", type: "" });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
      <input type="date" name="date" value={form.date} onChange={handleChange} />
      <input type="number" name="amount" placeholder="Amount" value={form.amount} onChange={handleChange} />
      <select name="category" value={form.category} onChange={handleChange}>
        <option>Eat</option>
        <option>Drink</option>
        <option>Golf</option>
        <option>Transport</option>
        <option>Shopping</option>
        <option>Billing</option>
        <option>Others</option>
        <option>Etc</option>
      </select>
      <input name="subCategory" placeholder="Sub category" value={form.subCategory} onChange={handleChange} />
      <input name="type" placeholder="Type" value={form.type} onChange={handleChange} />
      <button type="submit">Add Expense</button>
    </form>
  );
}
