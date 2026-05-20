interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkmark = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1.5,5 4,7.5 8.5,2.5" />
  </svg>
);

const Checkbox = ({ id, label, checked, onChange }: CheckboxProps) => (
  <label htmlFor={id} className="flex cursor-pointer items-center gap-2">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />
    <div
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
        checked ? 'border-dark-secondary bg-dark-secondary' : 'border-dark-border bg-dark-surface-3'
      }`}
    >
      {checked && <Checkmark />}
    </div>
    <span className="text-sm text-dark-secondary">{label}</span>
  </label>
);

export default Checkbox;
