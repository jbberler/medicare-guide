"use client";

import React from "react";
import type { ScenarioResults, ScenarioResult } from "@/lib/engine";

type Props = {
  results: ScenarioResults;
};

type RowDef = {
  label: string;
  render: (s: ScenarioResult) => React.ReactNode;
};

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function tagLabel(tag: Exclude<ScenarioResult["tag"], null>): string {
  switch (tag) {
    case "best_fit":
      return "Best fit";
    case "best_fit_cost":
      return "Best value";
    case "best_fit_overall":
      return "Best overall";
    default: {
      // Exhaustiveness guard — catches new ScenarioTag values at compile time
      const _exhaustive: never = tag;
      return String(_exhaustive);
    }
  }
}

// Row definitions for the comparison table
const ROW_DEFS: RowDef[] = [
  {
    label: "Monthly cost",
    render: (s) => {
      if (s.id === "B" && s.medigapUnavailable) {
        return (
          <>
            {fmt(s.monthlyTotal)}
            <span className="block text-xs text-amber-700 mt-1">
              + Medigap (estimates unavailable for your state —{" "}
              <a
                href="https://shiphelp.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                get a free quote at shiphelp.org
              </a>
              )
            </span>
          </>
        );
      }
      return fmt(s.monthlyTotal);
    },
  },
  {
    label: "Annual total",
    render: (s) => fmt(s.annualTotal),
  },
  {
    label: "IRMAA impact",
    render: (s) => s.irmaaImpact,
  },
  {
    label: "Doctor freedom",
    render: (s) => s.doctorFreedom,
  },
  {
    label: "Penalty risk",
    render: (s) => s.penaltyRisk,
  },
  {
    label: "Best when",
    render: (s) => s.bestWhen,
  },
  {
    label: "Your fit",
    render: (s) => s.personalizedFit,
  },
];

export function ComparisonTable({ results }: Props) {
  const { scenarios, recommended } = results;

  function isRecommended(id: "A" | "B" | "C") {
    return id === recommended;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {/* Empty label column */}
            <th className="py-4 px-4 text-left text-gray-400 font-normal w-36 bg-gray-50" />
            {scenarios.map((s) => (
              <th
                key={s.id}
                className={`py-4 px-4 text-left align-top ${
                  isRecommended(s.id)
                    ? "bg-blue-50 border-l-2 border-r-2 border-t-2 border-blue-400"
                    : "bg-white"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Scenario {s.id}
                  </span>
                  <span className="font-semibold text-gray-900 text-sm leading-tight">
                    {s.label}
                  </span>
                  {s.tag && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white w-fit">
                      {tagLabel(s.tag)}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROW_DEFS.map((row, i) => (
            <tr
              key={row.label}
              className={`border-b border-gray-100 last:border-0 ${
                i % 2 === 0 ? "bg-gray-50" : "bg-white"
              }`}
            >
              <td className="py-3 px-4 text-xs font-medium uppercase tracking-wide text-gray-500 align-top bg-gray-50 whitespace-nowrap">
                {row.label}
              </td>
              {scenarios.map((s) => (
                <td
                  key={s.id}
                  className={`py-3 px-4 text-gray-800 align-top text-sm leading-relaxed ${
                    isRecommended(s.id)
                      ? "border-l-2 border-r-2 border-blue-400 bg-blue-50/60"
                      : ""
                  } ${row.label === "Your fit" ? "font-medium" : ""}`}
                >
                  {row.render(s)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
