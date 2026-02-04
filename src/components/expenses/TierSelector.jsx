import "./TierSelector.scss";

export default function TierSelector({ value, onChange }) {
  return (
    <div className="tier">
      {["low", "mid", "high"].map((t) => (
        <button
          key={t}
          className={`tier__btn ${value === t ? "is-active" : ""}`}
          onClick={() => onChange(t)}
        >
          {t.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
