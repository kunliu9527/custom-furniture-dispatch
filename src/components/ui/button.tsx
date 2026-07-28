import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "default" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "vi-btn inline-flex items-center justify-center gap-2 font-semibold transition-[background-color,border-color,color,box-shadow,filter,opacity] duration-[var(--duration-fast)] ease-[var(--ease-default)] disabled:cursor-not-allowed disabled:opacity-50";

const sizes: Record<Size, string> = {
  default: "min-h-[44px] px-4 py-2.5 text-sm",
  sm: "min-h-9 px-3 py-1.5 text-xs",
};

const variants: Record<Variant, string> = {
  primary: "vi-btn-primary",
  secondary: "vi-btn-secondary",
  ghost:
    "border border-transparent bg-transparent text-[var(--label-secondary)] hover:bg-[var(--fill-quaternary)] hover:text-[var(--label-primary)]",
  outline: "vi-btn-outline",
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
