import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export default function CoachTour({ steps = [], storageKey }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [isFixed, setIsFixed] = useState(false);
  const [missingTarget, setMissingTarget] = useState(false);
  const tooltipRef = useRef(null);

  const total = steps.length;
  const step = steps[index];

  useEffect(() => {
    if (!storageKey || !steps.length) return;
    try {
      const done = localStorage.getItem(storageKey) === "done";
      if (!done) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [storageKey, steps.length]);

  useEffect(() => {
    if (!open) {
      document.body.classList.remove("tour-active");
      return;
    }
    document.body.classList.add("tour-active");
    return () => document.body.classList.remove("tour-active");
  }, [open]);

  function pickVisibleTarget(selector) {
    const nodes = Array.from(document.querySelectorAll(selector));
    for (const node of nodes) {
      const r = node.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return node;
    }
    return nodes[0] || null;
  }

  function measureTarget() {
    if (!open || !step?.selector) return;
    const el = pickVisibleTarget(step.selector);
    if (!el) {
      if (step?.selector === "[data-tour='quick-add']") {
        const size = 44;
        const pad = 24;
        setIsFixed(true);
        setMissingTarget(false);
        setRect({
          top: window.innerHeight - pad - size,
          left: window.innerWidth - pad - size,
          width: size,
          height: size,
        });
        return;
      }
      setMissingTarget(true);
      setRect(null);
      setIsFixed(true);
      return;
    }
    const style = window.getComputedStyle(el);
    const fixed = style.position === "fixed";
    setIsFixed(true);
    setMissingTarget(false);
    if (!fixed) {
      const shouldScroll =
        (step?.selector !== "[data-tour='month-picker']" || window.innerWidth > 720) &&
        !(window.innerWidth <= 720 && step?.selector === "[data-tour='calendar']");
      if (shouldScroll) {
        try {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch {
          // ignore
        }
      }
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }

  useEffect(() => {
    if (!open) return;
    measureTarget();
    const onResize = () => measureTarget();
    const onScroll = () => measureTarget();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, step, index, total]);

  useLayoutEffect(() => {
    if (!tooltipRef.current) return;
    if (!rect && !missingTarget) return;
    const tooltip = tooltipRef.current;
    const pad = 14;
    const tooltipWidth = tooltip.offsetWidth || 320;
    let left = rect ? rect.left : (window.innerWidth - tooltipWidth) / 2;
    left = Math.min(left, window.innerWidth - tooltipWidth - pad);
    left = Math.max(pad, left);
    let top = rect ? rect.top + rect.height + 14 : window.innerHeight / 2 - 80;
    const tooltipHeight = tooltip.offsetHeight || 140;
    const viewportBottom = window.innerHeight - pad;
    if (rect && step?.selector === "[data-tour='calendar']" && window.innerWidth <= 720) {
      const above = rect.top - tooltipHeight - 10;
      top = above < pad ? rect.top + rect.height + 10 : above;
    } else if (rect && top + tooltipHeight > viewportBottom) {
      top = rect.top - tooltipHeight - 14;
    }
    if (top + tooltipHeight > viewportBottom) {
      top = viewportBottom - tooltipHeight;
    }
    if (top < pad) top = pad;
    if (step?.selector === "[data-tour='month-picker']" && window.innerWidth <= 720) {
      tooltip.style.left = "50%";
      tooltip.style.transform = "translateX(-50%)";
    } else {
      tooltip.style.transform = "none";
    }
    if (step?.selector === "[data-tour='quick-add']") {
      if (window.innerWidth <= 720) {
        const bottom = 24 + 56 + 6;
        tooltip.style.left = "auto";
        tooltip.style.right = "calc(16px + env(safe-area-inset-right))";
        tooltip.style.transform = "none";
        tooltip.style.top = "auto";
        tooltip.style.bottom = `calc(${bottom}px + env(safe-area-inset-bottom))`;
      } else {
        const bottom = 24 + 56 + 6;
        tooltip.style.right = "28px";
        tooltip.style.left = "auto";
        tooltip.style.top = "auto";
        tooltip.style.bottom = `${bottom}px`;
      }
      return;
    }
    const baseTop = rect ? top : top;
    if (window.innerWidth <= 720) {
      tooltip.style.left = "50%";
      tooltip.style.right = "auto";
      tooltip.style.transform = "translateX(-50%)";
    } else {
      tooltip.style.left = `${left}px`;
      tooltip.style.right = "auto";
      tooltip.style.transform = "none";
    }
    tooltip.style.top = `${Math.max(pad, baseTop)}px`;
    tooltip.style.bottom = "auto";
  }, [rect, index, missingTarget, isFixed, step]);

  const highlightStyle = useMemo(() => {
    if (step?.selector === "[data-tour='quick-add']") {
      const size = 44;
      const pad = 6;
      return {
        position: "fixed",
        top: window.innerHeight - 28 - size - pad,
        left: window.innerWidth - 28 - size - pad,
        width: size + pad * 2,
        height: size + pad * 2,
      };
    }
    if (!rect) return { display: "none" };
    const pad = 6;
    const width = rect.width + pad * 2;
    const height = rect.height + pad * 2;
    const maxLeft = window.innerWidth - width - pad;
    const maxTop = window.innerHeight - height - pad;
    const left = Math.min(Math.max(rect.left - pad, pad), maxLeft);
    const top = Math.min(Math.max(rect.top - pad, pad), maxTop);
    return {
      position: "fixed",
      top,
      left,
      width,
      height,
    };
  }, [rect, isFixed, step]);

  function closeTour() {
    setOpen(false);
    try {
      if (storageKey) localStorage.setItem(storageKey, "done");
    } catch {
      // ignore
    }
  }

  function next() {
    if (index >= total - 1) return closeTour();
    setIndex((i) => i + 1);
  }

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  if (!open || !step) return null;

  return (
    <div className="coach-tour">
      <div className="coach-tour__backdrop" />
      <div className="coach-tour__highlight" style={highlightStyle} />
      <div
        className="coach-tour__tooltip"
        ref={tooltipRef}
        style={{ position: isFixed ? "fixed" : "absolute" }}
      >
        <div className="coach-tour__count">
          {index + 1} / {total}
        </div>
        <div className="coach-tour__title">{step.title}</div>
        <div className="coach-tour__body">{step.body}</div>
        <div className="coach-tour__actions">
          <button type="button" className="coach-tour__btn ghost" onClick={closeTour}>
            Skip
          </button>
          <div className="coach-tour__spacer" />
          <button type="button" className="coach-tour__btn ghost" onClick={prev} disabled={index === 0}>
            Back
          </button>
          <button type="button" className="coach-tour__btn solid" onClick={next}>
            {index === total - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
