import { forwardRef } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, options, error, placeholder, className = "", id, ...rest },
    ref
  ) {
    const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const errorId = `${selectId}-error`;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={[
            "block w-full rounded-md border px-3 py-2 text-base text-gray-900 bg-white",
            "focus:outline-2 focus:outline-blue-600 focus:outline-offset-0 focus:border-blue-600",
            "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
            "min-h-[44px]",
            error ? "border-red-500 bg-red-50" : "border-gray-300",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          {...rest}
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
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);
