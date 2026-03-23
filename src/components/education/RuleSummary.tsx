"use client";

import { useState } from "react";

type RuleSummaryProps = {
  rule: string;
  whyItMatters: string;
};

export function RuleSummary({ rule, whyItMatters }: RuleSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
      <p className="font-semibold text-gray-900">{rule}</p>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-2 text-sm text-blue-700 hover:text-blue-900 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded"
        aria-expanded={expanded}
      >
        Why this matters {expanded ? "▲" : "▼"}
      </button>
      {expanded && (
        <p className="mt-2 text-sm text-gray-700 leading-relaxed">
          {whyItMatters}
        </p>
      )}
    </div>
  );
}
