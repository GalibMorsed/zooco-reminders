import { SelectHTMLAttributes } from "react";
import clsx from "clsx";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-textPrimary">
          {label}
        </label>
      )}
      <select
        className={clsx(
          "w-full appearance-none rounded-card border bg-surface px-3.5 py-3 text-sm text-textPrimary focus:outline-none focus:ring-1",
          error ? "border-danger focus:ring-danger" : "border-border focus:ring-accent",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
