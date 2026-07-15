import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-pill px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" && "bg-accent text-black hover:bg-accent/90",
        variant === "ghost" &&
          "bg-transparent text-textSecondary hover:text-textPrimary",
        variant === "danger" && "bg-danger text-white hover:bg-danger/90",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
