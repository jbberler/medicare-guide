"use client";

import { useRef, useCallback } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Prevent re-clicks within this window (ms). Useful for nav buttons. */
  debounce?: number;
}

export function Button({
  variant = "primary",
  debounce: debounceProp,
  onClick,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const pendingRef = useRef(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick) return;
      if (debounceProp !== undefined) {
        if (pendingRef.current) return;
        pendingRef.current = true;
        setTimeout(() => {
          pendingRef.current = false;
        }, debounceProp);
      }
      onClick(e);
    },
    [onClick, debounceProp]
  );

  const base =
    "inline-flex items-center justify-center rounded-md text-base font-medium " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 " +
    "transition-colors min-h-[44px] px-5 py-2.5 cursor-pointer select-none " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900",
    secondary:
      "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 active:bg-gray-100",
    ghost: "bg-transparent text-blue-700 hover:bg-blue-50 active:bg-blue-100",
  };

  return (
    <button
      {...rest}
      disabled={disabled}
      onClick={handleClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
