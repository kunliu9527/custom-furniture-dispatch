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
  primary:
    "border border-indigo-500/30 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-[var(--vi-shadow-sm)] ring-1 ring-indigo-400/25 [box-shadow:var(--vi-shadow-sm),var(--vi-shadow-inset-top)] hover:from-indigo-500 hover:to-violet-500 hover:shadow-[var(--vi-shadow-md)] hover:ring-indigo-400/35",
  secondary:
    "border border-[var(--vi-border-strong)] bg-white text-zinc-800 shadow-[var(--vi-shadow-sm)] hover:border-indigo-200 hover:bg-indigo-50/30 hover:text-indigo-900",
  ghost:
    "border border-transparent text-zinc-600 hover:border-[var(--vi-border)] hover:bg-zinc-100/90 hover:text-zinc-900",
  outline:
    "border border-indigo-200 bg-white text-zinc-700 shadow-[var(--vi-shadow-xs)] hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-800",
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
