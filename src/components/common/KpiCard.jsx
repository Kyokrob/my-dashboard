export default function KpiCard({ title, value, sub, right }) {
  return (
    <div className="kpi">
      <div className="kpi__top">
        <div className="kpi__title">{title}</div>
        {right ? <div className="kpi__right">{right}</div> : null}
      </div>

      <div className="kpi__value">{value}</div>
      {sub ? <div className="kpi__sub">{sub}</div> : null}
    </div>
  );
}
