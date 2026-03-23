"use client";

type DeadlineEvent = {
  date: string;
  label: string;
  risk?: boolean;
};

type DeadlineStripProps = {
  events: DeadlineEvent[];
};

export function DeadlineStrip({ events }: DeadlineStripProps) {
  return (
    <div className="mb-4">
      {/* Desktop: horizontal timeline */}
      <div className="hidden sm:flex items-start gap-0">
        {events.map((event, idx) => (
          <div key={idx} className="flex-1 relative">
            {/* Connector line */}
            {idx < events.length - 1 && (
              <div className="absolute top-3 left-1/2 w-full h-0.5 bg-gray-300 z-0" />
            )}
            <div className="relative z-10 flex flex-col items-center text-center px-2">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  event.risk
                    ? "border-red-500 bg-red-100"
                    : "border-blue-400 bg-blue-100"
                }`}
              >
                <span
                  className={`text-xs font-bold ${
                    event.risk ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {idx + 1}
                </span>
              </div>
              <span
                className={`mt-1 text-xs font-semibold ${
                  event.risk ? "text-red-600" : "text-gray-600"
                }`}
              >
                {event.date}
              </span>
              <span
                className={`mt-0.5 text-xs leading-tight ${
                  event.risk ? "text-red-700 font-medium" : "text-gray-700"
                }`}
              >
                {event.label}
              </span>
              {event.risk && (
                <span className="mt-0.5 text-xs text-red-500">⚠ Risk</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: vertical timeline */}
      <div className="sm:hidden flex flex-col gap-0">
        {events.map((event, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  event.risk
                    ? "border-red-500 bg-red-100"
                    : "border-blue-400 bg-blue-100"
                }`}
              >
                <span
                  className={`text-xs font-bold ${
                    event.risk ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {idx + 1}
                </span>
              </div>
              {idx < events.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-300 my-1" />
              )}
            </div>
            <div className="pb-4">
              <p
                className={`text-xs font-semibold ${
                  event.risk ? "text-red-600" : "text-gray-600"
                }`}
              >
                {event.date}
              </p>
              <p
                className={`text-sm ${
                  event.risk ? "text-red-700 font-medium" : "text-gray-700"
                }`}
              >
                {event.label}
              </p>
              {event.risk && (
                <span className="text-xs text-red-500">⚠ Late penalty risk</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
