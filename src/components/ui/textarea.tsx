import { type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function Textarea({ label, id, className = "", ...props }: TextareaProps) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="vi-field-label">{label}</span>
      <textarea
        id={inputId}
        rows={3}
        className={`vi-field resize-y ${className}`}
        {...props}
      />
    </label>
  );
}
