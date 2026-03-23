type DeadlineMilestone = {
  label: string;
  description: string;
  isWarning?: boolean;
};

type DeadlineStripProps = {
  heading: string;
  milestones: DeadlineMilestone[];
  warningNote?: string;
};

export function DeadlineStrip({ heading, milestones, warningNote }: DeadlineStripProps) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 mb-3">
        Key Deadlines
      </p>
      <p className="text-sm font-medium text-rose-900 mb-4">{heading}</p>

      <div className="relative">
        {/* Connecting line */}
        <div
          className="absolute left-3 top-3 bottom-3 w-0.5 bg-rose-200"
          aria-hidden="true"
        />

        <ol className="space-y-4">
          {milestones.map((m, i) => (
            <li key={i} className="flex gap-4 relative">
              <div
                className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                  m.isWarning
                    ? "border-rose-500 bg-rose-500 text-white"
                    : "border-rose-300 bg-white text-rose-600"
                }`}
                aria-hidden="true"
              >
                {i + 1}
              </div>
              <div className="pt-0.5 min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    m.isWarning ? "text-rose-700" : "text-rose-900"
                  }`}
                >
                  {m.label}
                </p>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  {m.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {warningNote && (
        <div className="mt-3 rounded bg-rose-100 border border-rose-300 px-3 py-2">
          <p className="text-xs font-medium text-rose-800 leading-relaxed">
            ⚠ {warningNote}
          </p>
        </div>
      )}
    </div>
  );
}
