"use client";

import { useState } from "react";

type RuleSummaryProps = {
  rule: string;
  whyItMatters: string;
};

export function RuleSummary({ rule, whyItMatters }: RuleSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-blue-600 text-lg leading-none select-none" aria-hidden="true">
          ℹ
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900">{rule}</p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs font-medium text-blue-700 hover:text-blue-900 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-expanded={expanded}
          >
            {expanded ? "Hide explanation" : "Why this matters"}
          </button>
          {expanded && (
            <p className="mt-2 text-sm text-blue-800 leading-relaxed">{whyItMatters}</p>
          )}
        </div>
      </div>
    </div>
  );
}
