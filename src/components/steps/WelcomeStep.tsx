"use client";

import { useState } from "react";
import { useWizard } from "@/components/wizard/WizardShell";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * Medicare Decision Map SVG — the brand hero.
 * Shows the decision flow: Current Coverage → Your Age → Your Income → Your Recommendation.
 */
function DecisionMapSVG() {
  const nodes = [
    { label: "Current\nCoverage", color: "#3B82F6" },
    { label: "Your\nAge", color: "#6366F1" },
    { label: "Your\nIncome", color: "#8B5CF6" },
    { label: "Your\nRecommendation", color: "#059669" },
  ];

  const nodeW = 120;
  const nodeH = 64;
  const gapX = 60;
  const totalW = nodes.length * nodeW + (nodes.length - 1) * gapX;
  const svgH = 100;
  const svgW = totalW + 24;
  const y = (svgH - nodeH) / 2;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      aria-label="Medicare Decision Map: Current Coverage leads to Your Age, then Your Income, then Your Recommendation"
      role="img"
      className="w-full max-w-2xl mx-auto"
    >
      {nodes.map((node, i) => {
        const x = 12 + i * (nodeW + gapX);
        const cx = x + nodeW / 2;
        const [line1, line2] = node.label.split("\n");

        return (
          <g key={i}>
            {/* Arrow from previous node */}
            {i > 0 && (
              <g>
                <line
                  x1={x - gapX + 4}
                  y1={svgH / 2}
                  x2={x - 6}
                  y2={svgH / 2}
                  stroke="#D1D5DB"
                  strokeWidth="2"
                />
                <polygon
                  points={`${x - 6},${svgH / 2 - 5} ${x + 2},${svgH / 2} ${x - 6},${svgH / 2 + 5}`}
                  fill="#D1D5DB"
                />
              </g>
            )}

            {/* Node box */}
            <rect
              x={x}
              y={y}
              width={nodeW}
              height={nodeH}
              rx={10}
              fill={node.color}
            />

            {/* Step number badge */}
            <circle cx={x + 18} cy={y + 14} r={10} fill="rgba(255,255,255,0.25)" />
            <text
              x={x + 18}
              y={y + 18}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="700"
            >
              {i + 1}
            </text>

            {/* Label */}
            <text
              x={cx}
              y={y + nodeH / 2 - 4}
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="600"
            >
              {line1}
            </text>
            {line2 && (
              <text
                x={cx}
                y={y + nodeH / 2 + 11}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="600"
              >
                {line2}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function WelcomeStep() {
  const { state, setField, advance, dismissResumeBanner, clearAndReset } =
    useWizard();
  const [name, setName] = useState(state.inputs.name ?? "");

  function handleStart() {
    if (name.trim()) setField("name", name.trim());
    advance();
  }

  function handleResumeContinue() {
    dismissResumeBanner();
    advance();
  }

  function handleStartOver() {
    clearAndReset();
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Return-visit resume banner */}
      {state.showResumeBanner && (
        <Banner variant="info" className="rounded-none border-x-0 border-t-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>
              <strong>Welcome back</strong> — your information is saved locally.
              Pick up where you left off.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="primary" onClick={handleResumeContinue}>
                Continue
              </Button>
              <Button variant="ghost" onClick={handleStartOver}>
                Start over
              </Button>
            </div>
          </div>
        </Banner>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 md:py-12">
        <div className="w-full max-w-2xl space-y-6 md:space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Medicare Guidepost
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Answer a few questions. Get a personalized decision memo.
            </p>
          </div>

          {/* Decision Map Hero */}
          <div className="space-y-3">
            <p className="text-center text-sm font-medium text-gray-500 uppercase tracking-wide">
              How it works
            </p>
            <DecisionMapSVG />
          </div>

          {/* Expectations copy */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">What to expect</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5" aria-hidden="true">
                  ✓
                </span>
                <span>15–20 minutes to complete all 6 input steps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5" aria-hidden="true">
                  ✓
                </span>
                <span>Personalized cost comparison across your three Medicare options</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5" aria-hidden="true">
                  ✓
                </span>
                <span>
                  Printable decision memo you can share with a SHIP counselor or
                  your family
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5" aria-hidden="true">
                  ✓
                </span>
                <span>
                  <strong>No data leaves your browser</strong> — everything stays
                  on your device
                </span>
              </li>
            </ul>
          </div>

          {/* Optional name + CTA */}
          <div className="space-y-4">
            <Input
              id="welcome-name"
              label="What should we call you? (optional — stays in your browser)"
              type="text"
              placeholder="Your first name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleStart();
              }}
              autoComplete="given-name"
            />

            <Button
              variant="primary"
              onClick={handleStart}
              className="w-full text-base py-3"
            >
              Build my decision memo →
            </Button>
          </div>

          {/* Private browsing notice */}
          {state.isPrivateBrowsing && (
            <Banner variant="warning">
              Private browsing detected — your progress won&apos;t be saved if
              you close this tab.
            </Banner>
          )}
        </div>
      </div>
    </div>
  );
}
