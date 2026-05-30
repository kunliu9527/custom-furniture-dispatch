import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="vi-field-label">{label}</span>
      <input
        id={inputId}
        className={`vi-field ${className}`}
        {...props}
      />
    </label>
  );
}
