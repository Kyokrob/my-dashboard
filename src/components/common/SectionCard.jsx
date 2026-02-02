import "./SectionCard.scss";

export default function SectionCard({ title, right, children }) {
  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">{title}</h2>
        <div className="card__right">{right}</div>
      </div>
      <div className="card__body">{children}</div>
    </section>
  );
}
