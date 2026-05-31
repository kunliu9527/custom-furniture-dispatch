import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "default" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--vi-radius-md)] font-semibold tracking-tight transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]";

const sizes: Record<Size, string> = {
  default: "px-4 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

const variants: Record<Variant, string> = {
  primary: "vi-btn-primary",
  secondary:
    "border border-[var(--vi-border-strong)] bg-white text-zinc-800 shadow-[var(--vi-shadow-sm)] hover:border-[var(--vi-border)] hover:bg-zinc-50 hover:text-zinc-900",
  ghost:
    "border border-transparent text-zinc-600 hover:border-[var(--vi-border)] hover:bg-zinc-100/90 hover:text-zinc-900",
  outline: "vi-btn-outline border bg-white shadow-[var(--vi-shadow-xs)]",
};

export function Button({
  className = "",
  variant = "primary",
  size = "default",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
