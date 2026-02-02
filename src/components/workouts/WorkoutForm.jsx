import { useEffect, useState } from "react";

const DEFAULT = {
  date: "",
  workoutType: "Running",
  intensity: 3,
  weight: "",
  bodyFat: "",
  feel: "",
  drink: false,
  note: "",
};

export default function WorkoutForm({ initial, onSubmit }) {
  const [form, setForm] = useState(DEFAULT);

  useEffect(() => {
    if (initial?.id) {
      setForm({
        date: initial.date || "",
        workoutType: initial.workoutType || "Running",
        intensity: initial.intensity ?? 3,
        weight: initial.weight ?? "",
        bodyFat: initial.bodyFat ?? "",
        feel: initial.feel || "",
        drink: Boolean(initial.drink),
        note: initial.note || "",
      });
    } else {
      setForm(DEFAULT);
    }
  }, [initial]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.date || !form.workoutType) return;

    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      date: form.date,
      workoutType: form.workoutType,
      intensity: Number(form.intensity || 0),
      weight: form.weight === "" ? null : Number(form.weight),
      bodyFat: form.bodyFat === "" ? null : Number(form.bodyFat),
      feel: form.feel,
      drink: Boolean(form.drink),
      note: form.note,
    });
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <input type="date" name="date" value={form.date} onChange={handleChange} />

      <select name="workoutType" value={form.workoutType} onChange={handleChange}>
        {["Running", "Weight Training", "HIIT", "Swim", "Golf range", "Golf course", "Rest"].map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select name="intensity" value={form.intensity} onChange={handleChange}>
        {[1, 2, 3, 4, 5].map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>

      <input
        name="weight"
        type="number"
        step="0.1"
        placeholder="Weight (kg)"
        value={form.weight}
        onChange={handleChange}
      />

      <input
        name="bodyFat"
        type="number"
        step="0.1"
        placeholder="Body fat (%)"
        value={form.bodyFat}
        onChange={handleChange}
      />

      <input name="feel" placeholder="Feel (e.g., Fresh/Tired)" value={form.feel} onChange={handleChange} />
      <input name="note" placeholder="Note" value={form.note} onChange={handleChange} />

      <label style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.9 }}>
        <input type="checkbox" name="drink" checked={form.drink} onChange={handleChange} />
        Drink
      </label>

      <button type="submit">{initial?.id ? "Save Changes" : "Add Workout"}</button>
    </form>
  );
}
