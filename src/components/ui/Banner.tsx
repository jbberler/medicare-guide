export type BannerVariant = "info" | "warning" | "error";

export interface BannerProps {
  variant?: BannerVariant;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<
  BannerVariant,
  { wrapper: string; iconChar: string }
> = {
  info: {
    wrapper: "bg-blue-50 border-blue-300 text-blue-800",
    iconChar: "ℹ",
  },
  warning: {
    wrapper: "bg-yellow-50 border-yellow-400 text-yellow-900",
    iconChar: "⚠",
  },
  error: {
    wrapper: "bg-red-50 border-red-400 text-red-800",
    iconChar: "✕",
  },
};

export function Banner({
  variant = "info",
  children,
  onDismiss,
  className = "",
}: BannerProps) {
  const { wrapper, iconChar } = VARIANT_STYLES[variant];

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm leading-snug ${wrapper} ${className}`}
    >
      <span className="mt-0.5 shrink-0 font-bold" aria-hidden="true">
        {iconChar}
      </span>
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 shrink-0 rounded p-1 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-current"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
