import type { ReactNode } from "react";

interface TextProps {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  type?: "text" | "email" | "date" | "number" | "tel";
  placeholder?: string;
  hint?: ReactNode;
}

/** Labelled text/date/number input. Empty input reports "". */
export function TextField({ label, value, onChange, type = "text", placeholder, hint }: TextProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

interface SelectProps {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  /** Adds a first "—" option meaning "none". */
  allowEmpty?: boolean;
}

export function SelectField({ label, value, onChange, options, allowEmpty }: SelectProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className="select" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {allowEmpty && <option value="">—</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
