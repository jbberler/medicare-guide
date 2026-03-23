"use client";

import { type ReactNode } from "react";

type BannerVariant = "info" | "warning" | "error";

type BannerProps = {
  variant: BannerVariant;
  children: ReactNode;
  onDismiss?: () => void;
};

const variantStyles: Record<
  BannerVariant,
  { container: string; icon: string; dismiss: string }
> = {
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: "ℹ️",
    dismiss: "text-blue-600 hover:text-blue-800",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: "⚠️",
    dismiss: "text-yellow-700 hover:text-yellow-900",
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: "✕",
    dismiss: "text-red-600 hover:text-red-800",
  },
};

export function Banner({ variant, children, onDismiss }: BannerProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${styles.container}`}
    >
      <span aria-hidden="true" className="shrink-0 mt-0.5">
        {styles.icon}
      </span>
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={`shrink-0 ml-2 text-lg leading-none focus:outline-none ${styles.dismiss}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
