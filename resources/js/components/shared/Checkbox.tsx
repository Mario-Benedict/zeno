import CheckIcon from '@public/icons/small/check.svg';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

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
        checked
          ? 'border-dark-secondary bg-dark-secondary'
          : 'border-dark-border bg-dark-surface-3'
      }`}
    >
      {checked && <CheckIcon className="h-2.5 w-2.5 text-white" />}
    </div>
    <span className="text-sm text-dark-secondary">{label}</span>
  </label>
);

export default Checkbox;
