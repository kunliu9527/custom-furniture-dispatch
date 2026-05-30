import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--vi-radius-md)] px-4 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-[var(--vi-shadow-sm)] hover:from-indigo-500 hover:to-violet-500 hover:shadow-[var(--vi-shadow-md)]",
  secondary:
    "border border-[var(--vi-border-strong)] bg-zinc-50 text-zinc-800 shadow-[var(--vi-shadow-xs)] hover:bg-white hover:border-zinc-300",
  ghost:
    "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900",
  outline:
    "border border-[var(--vi-border-strong)] bg-white text-zinc-700 shadow-[var(--vi-shadow-xs)] hover:border-indigo-200 hover:bg-indigo-50/40 hover:text-indigo-800",
};

export function Button({
  className = "",
  variant = "primary",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
