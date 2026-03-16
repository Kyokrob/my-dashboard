import { useEffect, useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import "./SectionCard.scss";

export default function SectionCard({
  title,
  right,
  children,
  collapsible = false,
  collapsibleOnMobile = false,
  defaultCollapsed = false,
  stackRightOnMobile = true,
  persistKey,
  noWrapOnMobile = false,
  togglePosition = "title",
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!collapsibleOnMobile) return undefined;
    const query = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(query.matches);
    update();
    if (query.addEventListener) {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, [collapsibleOnMobile]);

  const canCollapse = collapsible && (!collapsibleOnMobile || isMobile);
  const isCollapsed = canCollapse ? collapsed : false;
  const stackRight = Boolean(right) && stackRightOnMobile;
  const noWrap = Boolean(right) && noWrapOnMobile;

  useEffect(() => {
    if (!canCollapse || !persistKey || typeof window === "undefined") return;
    const stored = localStorage.getItem(`ui.cardCollapsed:${persistKey}`);
    if (stored === null) return;
    setCollapsed(stored === "true");
  }, [canCollapse, persistKey]);

  return (
    <section
      className={`card ${canCollapse ? "card--collapsible" : ""} ${stackRight ? "card--stack-right" : ""} ${noWrap ? "card--nowrap-right" : ""}`}
      data-collapsed={isCollapsed}
    >
      <div className="card__head">
        <div className="card__title-row">
          <h2 className="card__title">{title}</h2>
          {canCollapse && togglePosition === "title" && (
            <button
              type="button"
              className="card__toggle"
              onClick={() => {
                setCollapsed((prev) => {
                  const next = !prev;
                  if (persistKey && typeof window !== "undefined") {
                    localStorage.setItem(`ui.cardCollapsed:${persistKey}`, String(next));
                  }
                  return next;
                });
              }}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? "Expand section" : "Collapse section"}
            >
              {isCollapsed ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
            </button>
          )}
        </div>
        <div className="card__right">
          {right}
          {canCollapse && togglePosition === "right" && (
            <button
              type="button"
              className="card__toggle"
              onClick={() => {
                setCollapsed((prev) => {
                  const next = !prev;
                  if (persistKey && typeof window !== "undefined") {
                    localStorage.setItem(`ui.cardCollapsed:${persistKey}`, String(next));
                  }
                  return next;
                });
              }}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? "Expand section" : "Collapse section"}
            >
              {isCollapsed ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
            </button>
          )}
        </div>
      </div>
      <div className="card__body">{children}</div>
    </section>
  );
}
