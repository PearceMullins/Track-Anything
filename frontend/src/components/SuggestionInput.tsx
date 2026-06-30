import { memo, useEffect, useId, useMemo, useRef, useState } from "react";

const MAX_SUGGESTIONS = 12;

interface SuggestionInputProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  multiline?: boolean;
  /** Called when the user finishes editing (blur, pick, or Enter). Receives the current value. */
  onBlur?: (value: string) => void;
}

export const SuggestionInput = memo(function SuggestionInput({
  value,
  options,
  onChange,
  placeholder,
  id,
  className,
  disabled,
  multiline = false,
  onBlur,
}: SuggestionInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const outsideTapRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const fieldClass = className ?? (multiline ? "textarea" : "input");

  valueRef.current = value;

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    const matches = query
      ? options.filter((opt) => opt.toLowerCase().includes(query))
      : options;
    return matches.slice(0, MAX_SUGGESTIONS);
  }, [value, options]);

  const commit = (nextValue: string) => {
    onBlur?.(nextValue);
  };

  const close = (notify = false) => {
    setOpen(false);
    if (notify) commit(valueRef.current);
  };

  const dismissIfOutsideTap = (event: PointerEvent) => {
    const root = rootRef.current;
    if (!root || root.contains(event.target as Node)) return;

    const start = outsideTapRef.current;
    if (!start?.active) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (dx * dx + dy * dy > 100) return;

    close(true);
    const active = document.activeElement;
    if (active instanceof HTMLElement && root.contains(active)) {
      active.blur();
    }
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        outsideTapRef.current = { x: event.clientX, y: event.clientY, active: true };
      } else {
        outsideTapRef.current = null;
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      dismissIfOutsideTap(event);
      outsideTapRef.current = null;
    };

    const onPointerCancel = () => {
      outsideTapRef.current = null;
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerCancel, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerCancel, true);
    };
  }, [open]);

  const handleFocus = () => {
    setOpen(true);
  };

  const pickOption = (option: string) => {
    valueRef.current = option;
    onChange(option);
    setOpen(false);
    commit(option);
  };

  const handleChange = (nextValue: string) => {
    valueRef.current = nextValue;
    onChange(nextValue);
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      close(false);
      e.currentTarget.blur();
    } else if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      setOpen(false);
      commit(valueRef.current);
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`suggestion-input${open && filtered.length > 0 ? " suggestion-input--open" : ""}`} ref={rootRef}>
      {multiline ? (
        <textarea
          id={inputId}
          className={fieldClass}
          value={value}
          disabled={disabled}
          rows={3}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
      ) : (
        <input
          id={inputId}
          className={fieldClass}
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      )}
      {open && filtered.length > 0 && (
        <ul className="suggestion-list" role="listbox" aria-labelledby={inputId}>
          {filtered.map((option) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => pickOption(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
