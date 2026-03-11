import "./DashboardLayout.scss";
import LooksIcon from "@mui/icons-material/Looks";
import { useDashboard } from "../../context/DashboardContext.jsx";
import { useShell } from "./ShellContext.jsx";

export default function DashboardLayout({ title, right, children, titleInline = false }) {
  const { themeOn, toggleTheme } = useDashboard();
  const { openMenu } = useShell();

  return (
    <div className={`layout ${themeOn ? "theme-on" : ""}`}>
      <div className="layout__sticky">
        <div className="dash-toolbar">
          <button type="button" className="shell__menu" onClick={openMenu}>
            ☰
          </button>
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

      <header className={`layout__header ${titleInline ? "layout__header--inline" : ""}`}>
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

      <main className="layout__main">{children}</main>
    </div>
  );
}
