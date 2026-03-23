type NumberExampleLine = {
  label: string;
  value: string;
  highlight?: boolean;
};

type NumberExampleProps = {
  heading: string;
  lines: NumberExampleLine[];
  footnote?: string;
};

export function NumberExample({ heading, lines, footnote }: NumberExampleProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
        Example
      </p>
      <p className="text-sm font-medium text-amber-900 mb-3">{heading}</p>
      <div className="space-y-1">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`flex items-center justify-between gap-4 rounded px-2 py-1 text-sm ${
              line.highlight
                ? "bg-amber-200 font-semibold text-amber-900"
                : "text-amber-800"
            }`}
          >
            <span>{line.label}</span>
            <span className="font-mono tabular-nums">{line.value}</span>
          </div>
        ))}
      </div>
      {footnote && (
        <p className="mt-2 text-xs text-amber-700 leading-relaxed">{footnote}</p>
      )}
    </div>
  );
}
