import { useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useDashboard } from "../../context/DashboardContext.jsx";
import "./DrinkForm.scss";

const START_TIMES = ["Before 8pm", "After 8pm", "After 10pm"];
const REGRET = ["None", "Mid", "High"];

export default function DrinkForm({ initial, onSubmit, onDelete }) {
  const { drinkReasons, drinkVenues } = useDashboard();
  const reasonOptions = (drinkReasons || []).filter((r) => r.enabled !== false).map((r) => r.label);
  const venueOptions = (drinkVenues || []).filter((v) => v.enabled !== false).map((v) => v.label);
  const safeReasons = reasonOptions.length ? reasonOptions : ["Social/Friend", "Others"];
  const safeVenues = venueOptions.length ? venueOptions : ["Home"];
  const [form, setForm] = useState({
    name: initial?.name || "",
    date: initial?.date || "",
    level: initial?.level ?? 1,
    durationHours: initial?.durationHours ?? "",
    reasons: initial?.reasons ?? [],
    otherReason: initial?.otherReason ?? "",
    venue: initial?.venue ?? "",
    startTime: initial?.startTime ?? "",
    enjoyment: initial?.enjoyment ?? "",
    regret: initial?.regret ?? "None",
    wouldRepeat: initial?.wouldRepeat ?? null,
    note: initial?.note ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState("");
  const isValid = Boolean(form.date);

  function toggleReason(r) {
    setForm((p) => ({
      ...p,
      reasons: p.reasons.includes(r)
        ? p.reasons.filter((x) => x !== r)
        : [...p.reasons, r],
      otherReason: r === "Others" && p.reasons.includes(r) ? "" : p.otherReason,
    }));
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    if (!isValid) {
      setError("Please select a date.");
      return;
    }

    const payload = {
      ...form,
      drank: true,
      level: Number(form.level || 1),
      durationHours: form.durationHours === "" ? null : Number(form.durationHours),
      enjoyment: form.enjoyment === "" ? null : Number(form.enjoyment),
    };

    try {
      setSubmitting(true);
      await onSubmit?.(payload);
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to save. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="drink-form" onSubmit={submit}>
      <div className="drink-form__grid">
        <div className="drink-form__row">
          <label className="form__label">Session name</label>
          <input
            className="form__input"
            type="text"
            placeholder="What do we call this session?"
            value={form.name}
            onChange={(e) => {
              setForm((p) => ({ ...p, name: e.target.value }));
              setError("");
            }}
          />
        </div>

        <div className="drink-form__row">
          <label className="form__label">Date *</label>
          <input
            className="form__input"
            type="date"
            value={form.date}
            onChange={(e) => {
              setForm((p) => ({ ...p, date: e.target.value }));
              setError("");
            }}
          />
        </div>

        <div className="drink-form__row drink-form__row--full">
          <label className="form__label">Level</label>
          <div className="drink-form__level">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`beer ${Number(form.level) === n ? "is-active" : ""}`}
                onClick={() => setForm((p) => ({ ...p, level: n }))}
                aria-label={`Level ${n}`}
              >
                {"🍺".repeat(n)}
              </button>
            ))}
          </div>
        </div>

      <div className="drink-form__row">
        <label className="form__label">Duration (hours)</label>
          <input
            className="form__input"
            type="number"
            inputMode="decimal"
            pattern="[0-9.]*"
            step="0.5"
            placeholder="e.g., 2"
            value={form.durationHours}
            onChange={(e) => {
              setForm((p) => ({ ...p, durationHours: e.target.value }));
              setError("");
            }}
          />
        </div>

        <div className="drink-form__row drink-form__row--full">
          <label className="form__label">Reasons</label>
          <div className="drink-form__chips">
            {safeReasons.map((r) => (
              <button
                key={r}
                type="button"
                className={`chip-btn ${form.reasons.includes(r) ? "is-active" : ""}`}
                onClick={() => toggleReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {form.reasons.includes("Others") && (
          <div className="drink-form__row drink-form__row--full">
            <label className="form__label">Other reason</label>
            <input
              className="form__input"
              type="text"
              placeholder="Write your reason"
              value={form.otherReason}
              onChange={(e) => {
                setForm((p) => ({ ...p, otherReason: e.target.value }));
                setError("");
              }}
            />
          </div>
        )}

        <button
          type="button"
          className="drink-form__more"
          onClick={() => setShowMore((s) => !s)}
        >
          {showMore ? "Hide" : "More context"}
        </button>

        {showMore && (
          <>
            <div className="drink-form__row">
              <label className="form__label">Venue</label>
              <select
                className="form__select"
                value={form.venue}
                onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
              >
                <option value="">-</option>
                {safeVenues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="drink-form__row">
              <label className="form__label">Start time</label>
              <select
                className="form__select"
                value={form.startTime}
                onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
              >
                <option value="">-</option>
                {START_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="drink-form__row">
              <label className="form__label">Enjoyment</label>
              <div className="drink-form__emojis">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`emoji ${Number(form.enjoyment) === n ? "is-active" : ""}`}
                    onClick={() => setForm((p) => ({ ...p, enjoyment: n }))}
                  >
                    {["😕", "😐", "🙂", "😀", "🤩"][n - 1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="drink-form__row">
              <label className="form__label">Regret</label>
              <div className="drink-form__toggle">
                {REGRET.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`pill ${form.regret === v ? "is-active" : ""}`}
                    onClick={() => setForm((p) => ({ ...p, regret: v }))}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="drink-form__row">
              <label className="form__label">Would repeat</label>
              <div className="drink-form__toggle">
                {["Yes", "No"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`pill ${form.wouldRepeat === (v === "Yes") ? "is-active" : ""}`}
                    onClick={() => setForm((p) => ({ ...p, wouldRepeat: v === "Yes" }))}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="drink-form__row drink-form__row--full">
              <label className="form__label">Note</label>
              <textarea
                className="form__textarea"
                rows={3}
                placeholder="Anything you want to remember?"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              />
            </div>
          </>
        )}
      </div>

      <div className="form__actions">
        <Button
          type="submit"
          fullWidth
          disabled={submitting || !isValid}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting ? "Saving..." : "Log Drink"}
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
