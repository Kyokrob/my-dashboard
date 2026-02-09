import "./DashboardLayout.scss";

export default function DashboardLayout({ title, right, children }) {
  return (
    <div className="layout">
      <header className="layout__header">
        <div>
          <h1 className="layout__title">{title}</h1>
        </div>
        <div className="layout__right">{right}</div>
      </header>

      <div className="layout__sticky">{right}</div>

      <main className="layout__main">{children}</main>
    </div>
  );
}
