import { useId, useMemo, useRef, useState } from "react";

interface SuggestionInputProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function SuggestionInput({
  value,
  options,
  onChange,
  placeholder,
  id,
  className = "input",
}: SuggestionInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return options;
    return options.filter((opt) => opt.toLowerCase().includes(query));
  }, [value, options]);

  const clearBlurTimer = () => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  };

  const handleFocus = () => {
    clearBlurTimer();
    setOpen(true);
  };

  const handleBlur = () => {
    clearBlurTimer();
    blurTimer.current = setTimeout(() => setOpen(false), 180);
  };

  const pickOption = (option: string) => {
    clearBlurTimer();
    onChange(option);
    setOpen(true);
  };

  return (
    <div className="suggestion-input">
      <input
        id={inputId}
        className={className}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
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
}
