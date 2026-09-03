interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
}

export function NumberField({ label, value, onChange, placeholder, error, autoFocus }: Props) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-textSecondary">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
        maxLength={12}
        className={`rounded-lg border bg-surface px-4 py-3 text-[17px] text-textPrimary outline-none placeholder:text-textMuted focus:border-accent ${
          error ? "border-danger" : "border-border"
        }`}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
