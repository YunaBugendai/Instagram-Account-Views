interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function TextField({ label, value, onChange, placeholder, error }: Props) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-textSecondary">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={30}
        autoCapitalize="none"
        autoCorrect="off"
        className={`rounded-lg border bg-surface px-4 py-3 text-[17px] text-textPrimary outline-none placeholder:text-textMuted focus:border-accent ${
          error ? "border-danger" : "border-border"
        }`}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
