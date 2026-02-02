export default function TierSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {["low", "mid", "high"].map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.14)",
            background: value === t ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
            cursor: "pointer",
            color: "inherit",
          }}
        >
          {t.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
