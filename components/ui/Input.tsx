import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  charCount?: string; // e.g. "30/100" shown top-right like the Figma form
}

export function Input({ label, error, charCount, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-textPrimary">{label}</label>
          {charCount && <span className="text-xs text-textSecondary">{charCount}</span>}
        </div>
      )}
      <input
        className={clsx(
          "w-full rounded-card border bg-surface px-3.5 py-3 text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none focus:ring-1",
          error
            ? "border-danger focus:ring-danger"
            : "border-border focus:ring-accent",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-textPrimary">
          {label}
        </label>
      )}
      <textarea
        className={clsx(
          "w-full rounded-card border bg-surface px-3.5 py-3 text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none focus:ring-1",
          error
            ? "border-danger focus:ring-danger"
            : "border-border focus:ring-accent",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
