import { forwardRef } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, className = "", id, ...rest },
  ref
) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={[
          "block w-full rounded-md border px-3 py-2 text-base text-gray-900",
          "placeholder:text-gray-400",
          "focus:outline-2 focus:outline-blue-600 focus:outline-offset-0 focus:border-blue-600",
          "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
          "min-h-[44px]",
          error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-describedby={
          error ? errorId : helperText ? hintId : undefined
        }
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={hintId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
});
