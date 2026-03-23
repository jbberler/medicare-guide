"use client";

import { type ReactNode, useRef, useCallback } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  variant?: ButtonVariant;
  disabled?: boolean;
  debounce?: boolean;
  onClick?: () => void;
  children: ReactNode;
  type?: "button" | "submit";
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 border border-transparent",
  secondary:
    "bg-white text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 border border-indigo-600",
  ghost:
    "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 border border-transparent",
};

export function Button({
  variant = "primary",
  disabled = false,
  debounce: useDebounce = false,
  onClick,
  children,
  type = "button",
  className = "",
}: ButtonProps) {
  const cooldownRef = useRef(false);

  const handleClick = useCallback(() => {
    if (disabled) return;
    if (useDebounce && cooldownRef.current) return;

    if (useDebounce) {
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 300);
    }

    onClick?.();
  }, [disabled, useDebounce, onClick]);

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={[
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        variantClasses[variant],
        disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
