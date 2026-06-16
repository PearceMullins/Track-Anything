import { useId } from "react";
import { SuggestionInput } from "./SuggestionInput";

interface ComboInputProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
  listId?: string;
  disabled?: boolean;
  onBlur?: (value: string) => void;
}

export function ComboInput({
  label,
  value,
  options,
  onChange,
  placeholder,
  listId,
  disabled,
  onBlur,
}: ComboInputProps) {
  const autoId = useId();
  const id = listId ?? autoId;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <SuggestionInput
        id={id}
        value={value}
        options={options}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onBlur={onBlur}
      />
    </div>
  );
}
