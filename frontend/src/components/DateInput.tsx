import { useEffect, useRef, useState } from "react";
import {
  WEEKDAY_LABELS,
  displayToIso,
  isoToDisplay,
  isoToYearMonth,
  monthGridIso,
  shiftYearMonth,
  todayDisplay,
  todayIso,
  yearMonthLabel,
} from "../dateFormat";

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

function toIsoValue(display: string): string {
  try {
    return displayToIso(display);
  } catch {
    return todayIso();
  }
}

export function DateInput({ id, value, onChange }: DateInputProps) {
  const isoValue = toIsoValue(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => isoToYearMonth(isoValue));
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggleCalendar = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setView(isoToYearMonth(isoValue));
    setOpen(true);
  };

  const pick = (iso: string) => {
    onChange(isoToDisplay(iso));
    setOpen(false);
  };

  const today = todayIso();
  const currentMonth = `${view.year}-${String(view.month + 1).padStart(2, "0")}`;

  return (
    <div className="field" ref={wrapRef}>
      <label htmlFor={id}>Date</label>
      <input
        id={id}
        type="date"
        className="input input-date"
        value={isoValue}
        onChange={(e) => {
          const iso = e.target.value;
          onChange(iso ? isoToDisplay(iso) : todayDisplay());
        }}
        autoComplete="off"
      />
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={toggleCalendar}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          Calendar
        </button>
      </div>

      {open ? (
        <div className="calendar" role="dialog" aria-label="Choose a date">
          <div className="calendar-head">
            <button
              type="button"
              className="btn btn-ghost btn-sm calendar-nav"
              aria-label="Previous month"
              onClick={() => setView((prev) => shiftYearMonth(prev, -1))}
            >
              ‹
            </button>
            <span className="calendar-title" aria-live="polite">
              {yearMonthLabel(view)}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm calendar-nav"
              aria-label="Next month"
              onClick={() => setView((prev) => shiftYearMonth(prev, 1))}
            >
              ›
            </button>
          </div>

          <div className="calendar-weekdays" aria-hidden>
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {monthGridIso(view).map((dayIso) => {
              const outside = dayIso.slice(0, 7) !== currentMonth;
              const classes = ["calendar-day"];
              if (outside) classes.push("outside");
              if (dayIso === isoValue) classes.push("selected");
              if (dayIso === today) classes.push("today");
              return (
                <button
                  key={dayIso}
                  type="button"
                  className={classes.join(" ")}
                  aria-label={isoToDisplay(dayIso)}
                  aria-current={dayIso === isoValue ? "date" : undefined}
                  onClick={() => pick(dayIso)}
                >
                  {Number(dayIso.slice(8))}
                </button>
              );
            })}
          </div>

          <div className="calendar-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setView(isoToYearMonth(today));
                pick(today);
              }}
            >
              Today — {todayDisplay()}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
