"use client";

type NumberExampleLine = {
  label: string;
  value: string;
  highlight?: boolean;
};

type NumberExampleProps = {
  title: string;
  lines: NumberExampleLine[];
};

export function NumberExample({ title, lines }: NumberExampleProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="divide-y divide-gray-100">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between py-2 ${
              line.highlight ? "bg-amber-50 -mx-4 px-4" : ""
            }`}
          >
            <span
              className={`text-sm ${
                line.highlight ? "text-amber-800 font-medium" : "text-gray-600"
              }`}
            >
              {line.label}
            </span>
            <span
              className={`text-sm font-semibold ${
                line.highlight ? "text-amber-700" : "text-gray-800"
              }`}
            >
              {line.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
