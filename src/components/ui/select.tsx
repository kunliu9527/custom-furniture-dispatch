import { type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: readonly string[] | { value: string; label: string }[];
}

export function Select({ label, id, options, className = "", ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <label className="block space-y-1.5" htmlFor={selectId}>
      {label ? <span className="vi-field-label">{label}</span> : null}
      <select
        id={selectId}
        className={`vi-field ${className}`}
        {...props}
      >
        {options.map((opt) =>
          typeof opt === "string" ? (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ) : (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ),
        )}
      </select>
    </label>
  );
}
