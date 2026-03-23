"use client";

import { useState } from "react";
import type { ScenarioResults, ScenarioResult } from "@/lib/engine";

type Props = {
  results: ScenarioResults;
};

const TAB_LABELS: Record<"A" | "B" | "C", string> = {
  A: "A: Employer",
  B: "B: Med + Medigap",
  C: "C: Advantage",
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

const DETAIL_ROWS: { label: string; key: keyof ScenarioResult }[] = [
  { label: "IRMAA impact", key: "irmaaImpact" },
  { label: "Doctor freedom", key: "doctorFreedom" },
  { label: "Penalty risk", key: "penaltyRisk" },
  { label: "Best when", key: "bestWhen" },
];

export function ScenarioTabs({ results }: Props) {
  const { scenarios, recommended } = results;
  const [activeTab, setActiveTab] = useState<"A" | "B" | "C">(
    recommended ?? "A"
  );

  const active = scenarios.find((s) => s.id === activeTab) ?? scenarios[0];

  return (
    // Extra bottom padding so content isn't obscured by the sticky cost bar
    <div className="flex flex-col pb-24">
      {/* Tab bar */}
      <div
        className="flex border-b border-gray-200"
        role="tablist"
        aria-label="Medicare scenarios"
      >
        {scenarios.map((s) => (
          <button
            key={s.id}
            id={`tab-${s.id}`}
            role="tab"
            aria-selected={activeTab === s.id}
            aria-controls={`tab-panel-${s.id}`}
            onClick={() => setActiveTab(s.id)}
            className={`flex-1 py-3 px-2 text-sm font-medium text-center transition-colors relative ${
              activeTab === s.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {TAB_LABELS[s.id]}
            {/* Dot indicator on the recommended scenario only */}
            {s.id === recommended && (
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* Active scenario detail panel */}
      <div
        id={`tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="p-4 space-y-5"
      >
        {/* Tag badge */}
        {active.tag && (
          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white">
            {tagLabel(active.tag)}
          </span>
        )}

        {/* Scenario heading + personalized fit */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{active.label}</h3>
          <div className="mt-3 space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Monthly cost
            </span>
            <p className="text-2xl font-bold text-gray-900">
              {fmt(active.monthlyTotal)}
              <span className="text-base font-normal text-gray-500">/mo</span>
            </p>
            <p className="text-xs text-gray-500">
              {fmt(active.annualTotal)}/year
            </p>
          </div>
        </div>

        {/* Your fit */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Your fit
          </span>
          <p className="text-gray-800 text-sm mt-1 font-medium">
            {active.personalizedFit}
          </p>
        </div>

        {/* Detail rows */}
        <div className="space-y-4">
          {DETAIL_ROWS.map(({ label, key }) => (
            <div key={label}>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label}
              </span>
              <p className="text-gray-800 text-sm mt-0.5">
                {active[key] as string}
              </p>
            </div>
          ))}
        </div>

        {/* Medigap unavailable notice */}
        {active.id === "B" && active.medigapUnavailable && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Medigap estimates are not available for your state. The cost above
            excludes Medigap.{" "}
            <a
              href="https://shiphelp.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Get a free quote at shiphelp.org
            </a>
            .
          </div>
        )}
      </div>

      {/* Sticky cost comparison bar — lets user compare all three monthly costs at a glance */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 pb-[env(safe-area-inset-bottom)]">
        <div className="flex divide-x divide-gray-200">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              aria-label={`View Scenario ${s.id}: ${fmt(s.monthlyTotal)} per month`}
              className={`flex-1 py-3 flex flex-col items-center transition-colors ${
                s.id === activeTab ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  s.id === activeTab ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {TAB_LABELS[s.id].split(":")[0]}
              </span>
              <span
                className={`text-base font-bold ${
                  s.id === activeTab ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {fmt(s.monthlyTotal)}
              </span>
              <span className="text-xs text-gray-400">/mo</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
