import Tooltip from "@mui/material/Tooltip";
import "./MonthCalendar.scss";

function monthLabel(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function buildMonthGrid(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const startDay = first.getDay(); // 0 Sun
  const daysInMonth = new Date(y, m, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return { year: y, month: m, cells };
}

function fmtDate(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function MonthCalendar({ monthKey, expenses = [], workouts = [] }) {
  const { year, month, cells } = buildMonthGrid(monthKey);

  // group by date
  const expByDate = expenses.reduce((acc, e) => {
    const k = e.date;
    (acc[k] ||= []).push(e);
    return acc;
  }, {});

  const woByDate = workouts.reduce((acc, w) => {
    const k = w.date;
    (acc[k] ||= []).push(w);
    return acc;
  }, {});

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="mcal">
      <div className="mcal__top">
        <div className="mcal__title">{monthLabel(monthKey)}</div>
        <div className="mcal__hint">Hover a date to see details</div>
      </div>

      <div className="mcal__dow">
        {weekDays.map((d) => (
          <div key={d} className="mcal__dowItem">
            {d}
          </div>
        ))}
      </div>

      <div className="mcal__grid">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="mcal__cell is-empty" />;

          const key = fmtDate(year, month, day);
          const dayExpenses = expByDate[key] || [];
          const dayWorkouts = woByDate[key] || [];
          const hasExp = dayExpenses.length > 0;
          const hasWo = dayWorkouts.length > 0;
          const hasBoth = hasExp && hasWo;

          const spend = dayExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
          const workoutTypes = dayWorkouts.map((w) => w.workoutType || w.workout || "Workout");

          const tooltip = (
            <div className="mcal__tip">
              <div className="mcal__tipDate">{key}</div>

              <div className="mcal__tipRow">
                <span className="mcal__tipLabel">Expenses:</span>
                <span>{dayExpenses.length ? `${dayExpenses.length} · ฿${spend.toLocaleString()}` : "-"}</span>
              </div>

              <div className="mcal__tipRow">
                <span className="mcal__tipLabel">Workouts:</span>
                <span>{dayWorkouts.length ? `${dayWorkouts.length} · ${workoutTypes.join(", ")}` : "-"}</span>
              </div>

              {!!dayExpenses.length && (
                <div className="mcal__tipList">
                  {dayExpenses.slice(0, 4).map((e) => (
                    <div key={e.id} className="mcal__tipItem">
                      • {e.category}: ฿{Number(e.amount || 0).toLocaleString()}
                    </div>
                  ))}
                  {dayExpenses.length > 4 && <div className="mcal__tipMore">+{dayExpenses.length - 4} more…</div>}
                </div>
              )}
            </div>
          );

          const hasAnything = hasExp || hasWo;

          return (
            <Tooltip
              key={idx}
              title={tooltip}
              arrow
              placement="top"
              enterDelay={150}
              enterTouchDelay={0}
              leaveTouchDelay={2000}
              slotProps={{
                popper: {
                  modifiers: [
                    { name: "flip", options: { fallbackPlacements: ["top", "bottom", "right", "left"] } },
                    { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
                  ],
                },
                tooltip: { className: "mcal__tooltip" },
                arrow: { className: "mcal__tooltipArrow" },
              }}
            >
              <div
                className={`mcal__cell ${hasAnything ? "has-data" : ""} ${hasExp ? "has-exp" : ""} ${hasWo ? "has-wo" : ""} ${hasBoth ? "has-both" : ""}`}
              >
                <div className="mcal__day">{day}</div>

                {/* tiny signals */}
                <div className="mcal__chips">
                  {hasExp && <span className="chip chip--exp" aria-hidden="true" />}
                  {hasWo && <span className="chip chip--wo" aria-hidden="true" />}
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
