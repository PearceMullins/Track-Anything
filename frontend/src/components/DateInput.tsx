import { displayToIso, isoToDisplay, todayDisplay, todayIso } from "../dateFormat";

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

  return (
    <div className="field">
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
    </div>
  );
}
