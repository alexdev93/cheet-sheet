import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-extrabold text-[12px] tracking-[0.04em] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-[var(--color-panel)] hover:bg-[var(--color-accent-hover)] border border-transparent",
  secondary: "bg-transparent text-[var(--color-text-2)] border border-[var(--color-border-strong)] hover:bg-[var(--color-panel-3)]",
  ghost: "bg-transparent text-[var(--color-text-3)] border border-transparent hover:bg-[var(--color-panel-3)] hover:text-[var(--color-text)]",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} h-9 px-4 ${className}`} {...props} />;
}
