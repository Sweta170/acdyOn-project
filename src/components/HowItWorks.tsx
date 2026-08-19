"use client";

import React, { useEffect, useRef, useState } from "react";
import { TerminalSquare, ScanSearch, GitFork } from "lucide-react";

// ─── useInView hook ──────────────────────────────────────────────────────────

function useInView(threshold = 0.2) {
  const ref    = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ─── Step Visuals ────────────────────────────────────────────────────────────

function CaptureVisual({ active }: { active: boolean }) {
  const lines = [
    { level: "INFO",  text: "POST /api/v1/checkout" },
    { level: "INFO",  text: "Auth.verify() → OK [28ms]" },
    { level: "WARN",  text: "DB: lock wait..." },
    { level: "ERROR", text: "lock timeout [7,001ms]" },
  ];

  return (
    <div className="rounded-xl border border-wire bg-ink overflow-hidden font-mono text-xs shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-wire bg-surface-2">
        <span className="text-amber">$ flowtrace trace --live</span>
        <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
      </div>
      <div className="p-4 space-y-2 min-h-[96px]">
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              opacity:   active ? 1 : 0,
              transform: active ? "none" : "translateY(6px)",
              transition: `opacity 0.4s ease ${i * 0.12 + 0.05}s, transform 0.4s ease ${i * 0.12 + 0.05}s`,
            }}
            className="flex items-center gap-2"
          >
            <span
              className={`font-bold shrink-0 ${
                line.level === "ERROR" ? "text-signal"
                : line.level === "WARN"  ? "text-amber"
                : "text-faint"
              }`}
            >
              [{line.level}]
            </span>
            <span className="text-slate-300">{line.text}</span>
          </div>
        ))}
        <span
          className="inline-block w-2 h-3 bg-amber align-middle"
          style={{ animation: active ? "cursor-blink 1s step-end infinite" : "none" }}
        />
      </div>
    </div>
  );
}

function ParseVisual({ active }: { active: boolean }) {
  const fields = [
    { label: "SERVICE",  value: "checkout-api", color: "text-amber"  },
    { label: "TRACE ID", value: "8f3a-91bc",    color: "text-prose"  },
    { label: "ANOMALY",  value: "DB_LOCK_TIMEOUT", color: "text-signal" },
    { label: "DURATION", value: "7,001 ms",     color: "text-signal" },
  ];

  return (
    <div className="rounded-xl border border-wire bg-ink overflow-hidden font-mono text-xs shadow-lg">
      <div className="px-4 py-2.5 border-b border-wire bg-surface-2 flex items-center gap-2">
        <span className="text-amber">PARSE PASS</span>
        <span className="text-faint">— identifying signals</span>
      </div>
      <div className="p-4 space-y-3">
        {fields.map((f, i) => (
          <div
            key={f.label}
            style={{
              opacity:   active ? 1 : 0,
              transform: active ? "none" : "translateX(-8px)",
              transition: `opacity 0.4s ease ${i * 0.14 + 0.1}s, transform 0.4s ease ${i * 0.14 + 0.1}s`,
            }}
            className="flex items-center gap-3"
          >
            <span className="text-faint tracking-widest text-[9px] w-20 uppercase shrink-0">
              {f.label}
            </span>
            <span className="w-px h-3 bg-wire shrink-0" />
            <span className={`${f.color} font-semibold`}>{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapVisual({ active }: { active: boolean }) {
  const nodes = [
    { label: "API Gateway",  status: "success" as const },
    { label: "Auth Service", status: "success" as const },
    { label: "PostgreSQL",   status: "error"   as const },
    { label: "Error Router", status: "error"   as const },
  ];

  return (
    <div className="rounded-xl border border-wire bg-surface overflow-hidden shadow-lg">
      <div className="px-4 py-2.5 border-b border-wire bg-surface-2 flex items-center gap-2 font-mono text-xs">
        <span className="block w-3 h-px bg-amber" />
        <span className="text-muted">Execution Map</span>
      </div>
      <div className="p-4 flex flex-col">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex flex-col items-start">
            <div
              style={{
                opacity:   active ? 1 : 0,
                transform: active ? "none" : "translateY(8px)",
                transition: `opacity 0.5s ease ${i * 0.14}s, transform 0.5s ease ${i * 0.14}s`,
                boxShadow:
                  active && node.status === "error"
                    ? "0 0 10px rgba(217,95,95,0.18)"
                    : undefined,
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border font-mono text-xs transition-all ${
                node.status === "success"
                  ? "border-sage-ring bg-sage-dim"
                  : "border-signal-ring bg-signal-dim"
              }`}
            >
              <span className={node.status === "success" ? "text-sage" : "text-signal"}>
                {node.label}
              </span>
              <span
                className={`text-[9px] font-bold ${
                  node.status === "success" ? "text-sage" : "text-signal"
                }`}
              >
                {node.status === "success" ? "OK" : "ERR"}
              </span>
            </div>

            {i < nodes.length - 1 && (
              <div className="h-3 flex items-center px-4">
                <div
                  className="w-px h-full transition-colors duration-500"
                  style={{
                    backgroundColor:
                      node.status === "error"
                        ? "rgba(217,95,95,0.4)"
                        : "rgba(78,139,104,0.4)",
                    opacity:    active ? 1 : 0,
                    transition: `opacity 0.4s ease ${i * 0.14 + 0.2}s`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number:  "01",
    tag:     "CAPTURE",
    Icon:    TerminalSquare,
    heading: "Your server writes to stdout.",
    body:    "FlowTrace reads it in real time. No OpenTelemetry setup, no runtime agents, no sidecar containers. One import statement routes your logs through the FlowTrace parser.",
    Visual:  CaptureVisual,
  },
  {
    number:  "02",
    tag:     "PARSE",
    Icon:    ScanSearch,
    heading: "FlowTrace identifies the signals.",
    body:    "Service names, trace IDs, latency spikes, error codes — the parser extracts structured meaning from unstructured text automatically, with no configuration or schema required.",
    Visual:  ParseVisual,
  },
  {
    number:  "03",
    tag:     "MAP",
    Icon:    GitFork,
    heading: "A live execution diagram builds itself.",
    body:    "Every service in your request path becomes a clickable node. Failures are highlighted in real time. Click any node to drill into its logs and read an automated root-cause explanation.",
    Visual:  MapVisual,
  },
];

// ─── Step component (needs its own useInView) ─────────────────────────────────

function Step({
  step,
  idx,
}: {
  step: (typeof STEPS)[0];
  idx: number;
}) {
  const { ref, inView } = useInView(0.2);
  const isEven = idx % 2 === 0;

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center"
    >
      {/* Visual */}
      <div
        className={isEven ? "md:order-1" : "md:order-2"}
        style={{
          opacity:   inView ? 1 : 0,
          transform: inView ? "none" : "translateY(20px)",
          transition: "opacity 0.65s ease 0.05s, transform 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s",
        }}
      >
        <step.Visual active={inView} />
      </div>

      {/* Text */}
      <div
        className={`flex flex-col gap-4 ${isEven ? "md:order-2" : "md:order-1"}`}
        style={{
          opacity:   inView ? 1 : 0,
          transform: inView ? "none" : "translateY(16px)",
          transition: "opacity 0.6s ease 0.15s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s",
        }}
      >
        {/* Step marker */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-accent">{step.number}</span>
          <span className="w-px h-4 bg-wire" />
          <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase text-muted">
            <step.Icon className="w-3 h-3" />
            {step.tag}
          </span>
        </div>

        <h3 className="font-display text-2xl md:text-3xl text-prose leading-tight">
          {step.heading}
        </h3>

        <p className="font-sans text-sm md:text-base text-muted leading-relaxed">
          {step.body}
        </p>
      </div>
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Section header */}
        <div className="mb-20">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="block w-6 h-px bg-accent" />
            <span className="font-mono text-[11px] font-semibold tracking-widest uppercase text-accent">
              How it works
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-prose leading-tight max-w-md">
            Three steps from chaos to clarity.
          </h2>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-24">
          {STEPS.map((step, idx) => (
            <Step key={step.number} step={step} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
