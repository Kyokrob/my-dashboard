import "./DashboardLayout.scss";
import LooksIcon from "@mui/icons-material/Looks";
import { useDashboard } from "../../context/DashboardContext.jsx";

export default function DashboardLayout({ title, right, children }) {
  const { themeOn, toggleTheme } = useDashboard();

  return (
    <div className={`layout ${themeOn ? "theme-on" : ""}`}>
      <header className="layout__header">
        <div>
          <h1 className="layout__title">{title}</h1>
        </div>
        <div className="layout__right">
          <div className="dash-toolbar">
            {right}
            <button
              type="button"
              className={`theme-toggle ${themeOn ? "is-on" : ""}`}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <LooksIcon fontSize="small" />
            </button>
          </div>
        </div>
      </header>

      <div className="layout__sticky">
        <div className="dash-toolbar">
          {right}
          <button
            type="button"
            className={`theme-toggle ${themeOn ? "is-on" : ""}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <LooksIcon fontSize="small" />
          </button>
        </div>
      </div>

      <main className="layout__main">{children}</main>
    </div>
  );
}
