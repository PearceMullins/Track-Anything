import { useId } from "react";
import { SuggestionInput } from "./SuggestionInput";

interface ComboInputProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
  listId?: string;
}

export function ComboInput({
  label,
  value,
  options,
  onChange,
  placeholder,
  listId,
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
      />
    </div>
  );
}
