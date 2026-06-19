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
  const skipBlurCommit = useRef(false);
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fieldClass = className ?? (multiline ? "textarea" : "input");

  valueRef.current = value;

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    const matches = query
      ? options.filter((opt) => opt.toLowerCase().includes(query))
      : options;
    return matches.slice(0, MAX_SUGGESTIONS);
  }, [value, options]);

  const clearBlurTimer = () => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  };

  const commit = (nextValue: string) => {
    onBlur?.(nextValue);
  };

  const close = (notify = false) => {
    clearBlurTimer();
    setOpen(false);
    if (notify) commit(valueRef.current);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        skipBlurCommit.current = true;
        close(true);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  const handleFocus = () => {
    clearBlurTimer();
    skipBlurCommit.current = false;
    setOpen(true);
  };

  const handleBlur = () => {
    clearBlurTimer();
    blurTimer.current = setTimeout(() => {
      setOpen(false);
      if (!skipBlurCommit.current) commit(valueRef.current);
      skipBlurCommit.current = false;
    }, 120);
  };

  const pickOption = (option: string) => {
    clearBlurTimer();
    skipBlurCommit.current = true;
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
      skipBlurCommit.current = true;
      close(false);
      e.currentTarget.blur();
    } else if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      skipBlurCommit.current = true;
      clearBlurTimer();
      setOpen(false);
      commit(valueRef.current);
      e.currentTarget.blur();
    }
  };

  return (
    <div className="suggestion-input" ref={rootRef}>
      {multiline ? (
        <textarea
          id={inputId}
          className={fieldClass}
          value={value}
          disabled={disabled}
          rows={3}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
          onBlur={handleBlur}
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
