interface PermanentDeleteConfirmProps {
  id?: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function PermanentDeleteConfirm({ id, label, checked, onChange }: PermanentDeleteConfirmProps) {
  return (
    <label className="confirm-row">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
