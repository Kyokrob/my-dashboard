import { useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useDashboard } from "../../context/DashboardContext.jsx";
import { defaultWorkoutTypes } from "../../config/workouts.js";
import "../../styles/forms.scss";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DEFAULT = {
  date: todayISO(),
  workoutType: "Running",
  intensity: 3,
  weight: "",
  bodyFat: "",
  feel: "Normal",
  note: "",
};

export default function WorkoutForm({ initial, onSubmit, onDelete }) {
  const { workoutTypes } = useDashboard();
  const fallbackTypes = useMemo(() => {
    const activeTypes = (workoutTypes || [])
      .filter((t) => (typeof t === "string" ? true : t.enabled !== false))
      .map((t) => (typeof t === "string" ? t : t.label))
      .filter(Boolean);
    return activeTypes.length ? activeTypes : defaultWorkoutTypes;
  }, [workoutTypes]);
  const fallbackKey = fallbackTypes.join("|");
  const [form, setForm] = useState(DEFAULT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isValid = Boolean(form.date && form.workoutType);

  useEffect(() => {
    if (initial?.id) {
      setForm({
        date: initial.date || todayISO(),
        workoutType: initial.workoutType || fallbackTypes[0] || "Running",
        intensity: initial.intensity ?? 3,
        weight: initial.weight ?? "",
        bodyFat: initial.bodyFat ?? "",
        feel: initial.feel || "Normal",
        note: initial.note || "",
      });
    } else {
      setForm({ ...DEFAULT, date: todayISO(), workoutType: fallbackTypes[0] || "Running" });
    }
  }, [initial, fallbackKey]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    if (!isValid) {
      setError("Please add a date and workout type.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit?.({
        id: initial?.id ?? crypto.randomUUID(),
        date: form.date,
        workoutType: form.workoutType,
        intensity: Number(form.intensity || 0),
        weight: form.weight === "" ? null : Number(form.weight),
        bodyFat: form.bodyFat === "" ? null : Number(form.bodyFat),
        feel: form.feel,
        note: form.note,
      });
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to save. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="form">
      <div className="form__grid">
        <div className="form__row">
          <label className="form__label" htmlFor="wo-date">Date *</label>
          <input
            id="wo-date"
            className="form__input"
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />
        </div>

        <div className="form__row">
          <label className="form__label" htmlFor="wo-type">Workout *</label>
          <select
            id="wo-type"
            className="form__select"
            name="workoutType"
            value={form.workoutType}
            onChange={handleChange}
          >
          {fallbackTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
          </select>
        </div>

        <div className="form__row">
          <label className="form__label" htmlFor="wo-intensity">Intensity</label>
          <select
            id="wo-intensity"
            className="form__select"
            name="intensity"
            value={form.intensity}
            onChange={handleChange}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>

        <div className="form__row">
          <label className="form__label" htmlFor="wo-feel">Energy level</label>
          <select
            id="wo-feel"
            className="form__select"
            name="feel"
            value={form.feel}
            onChange={handleChange}
          >
            {["Low", "Normal", "High"].map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="form__row">
          <label className="form__label" htmlFor="wo-weight">Weight (kg)</label>
          <input
            id="wo-weight"
            className="form__input"
            name="weight"
            type="number"
            inputMode="decimal"
            pattern="[0-9.]*"
            step="0.1"
            placeholder="Optional"
            value={form.weight}
            onChange={handleChange}
          />
        </div>

        <div className="form__row">
          <label className="form__label" htmlFor="wo-bf">Body fat (%)</label>
          <input
            id="wo-bf"
            className="form__input"
            name="bodyFat"
            type="number"
            inputMode="decimal"
            pattern="[0-9.]*"
            step="0.1"
            placeholder="Optional"
            value={form.bodyFat}
            onChange={handleChange}
          />
        </div>

        <div className="form__row form__row--full">
          <label className="form__label" htmlFor="wo-note">Note</label>
          <input
            id="wo-note"
            className="form__input"
            name="note"
            placeholder="Optional note"
            value={form.note}
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
          {submitting ? "Saving..." : initial?.id ? "Save Changes" : "Add Workout"}
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
