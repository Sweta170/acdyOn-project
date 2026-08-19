"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Server, ShieldAlert, Layers, Database, Activity } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type LogLevel = "INFO" | "WARN" | "ERROR";
type NodeStatus = "idle" | "success" | "warning" | "error";

interface LogEntry {
  time: string;
  level: LogLevel;
  text: string;
}

// ─── Animation sequence ─────────────────────────────────────────────────────
// Each step adds one log line and updates node statuses.
// NODE ORDER: gw (0), auth (1), cache (2), db (3), handler (4)

const LOG_SEQUENCE: LogEntry[] = [
  { time: "12:45:01.309", level: "INFO",  text: "POST /api/v1/checkout → routed"         },
  { time: "12:45:01.341", level: "INFO",  text: "Auth.verify(token_8f3a) → valid [28ms]" },
  { time: "12:45:01.350", level: "INFO",  text: "Redis: session HIT [3ms]"               },
  { time: "12:45:03.011", level: "WARN",  text: "PostgreSQL: awaiting row lock..."        },
  { time: "12:45:08.356", level: "ERROR", text: "PostgreSQL: lock timeout [7,001ms]"     },
  { time: "12:45:08.358", level: "ERROR", text: "→ 504 Gateway Timeout"                  },
];

// Pre-computed node statuses per step (avoids re-derivation on every render)
const NODE_STATES: NodeStatus[][] = [
  ["idle",    "idle",    "idle",    "idle",    "idle"  ], // 0 — baseline
  ["success", "idle",    "idle",    "idle",    "idle"  ], // 1 — gateway logs in
  ["success", "success", "idle",    "idle",    "idle"  ], // 2 — auth ok
  ["success", "success", "success", "idle",    "idle"  ], // 3 — cache hit
  ["success", "success", "success", "warning", "idle"  ], // 4 — db lock wait
  ["success", "success", "success", "error",   "idle"  ], // 5 — db timeout
  ["success", "success", "success", "error",   "error" ], // 6 — 504
];

// ms to wait at each step before advancing (indexed by current step)
const STEP_DELAYS = [800, 1100, 1100, 1100, 1700, 1100];
const RESET_DELAY = 3200;

// ─── Node definitions ────────────────────────────────────────────────────────

const FLOW_NODES = [
  { id: "gw",      label: "API Gateway",  sublabel: "EDGE",     icon: <Server className="w-3.5 h-3.5" />      },
  { id: "auth",    label: "Auth Service", sublabel: "AUTH",     icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  { id: "cache",   label: "Redis Cache",  sublabel: "CACHE",    icon: <Layers className="w-3.5 h-3.5" />      },
  { id: "db",      label: "PostgreSQL",   sublabel: "DATABASE", icon: <Database className="w-3.5 h-3.5" />    },
  { id: "handler", label: "Error Router", sublabel: "HANDLER",  icon: <Activity className="w-3.5 h-3.5" />   },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nodeClasses(status: NodeStatus, visible: boolean) {
  const baseBox = "rounded-lg border px-3 py-2 flex items-center justify-between transition-all duration-500";
  const opacity = visible ? 1 : 0.18;

  if (status === "success") return {
    box: `${baseBox} border-sage-ring bg-sage-dim`,
    icon: "text-sage", label: "text-prose",
    badge: <span className="text-[9px] font-mono font-bold text-sage">OK</span>,
    glow: undefined, opacity,
  };
  if (status === "warning") return {
    box: `${baseBox} border-amber-ring bg-amber-dim`,
    icon: "text-amber", label: "text-prose",
    badge: <span className="text-[9px] font-mono font-bold text-amber">WAIT</span>,
    glow: "0 0 12px rgba(224,145,50,0.18)", opacity,
  };
  if (status === "error") return {
    box: `${baseBox} border-signal-ring bg-signal-dim`,
    icon: "text-signal", label: "text-prose",
    badge: <span className="text-[9px] font-mono font-bold text-signal">ERR</span>,
    glow: "0 0 14px rgba(217,95,95,0.22)", opacity,
  };
  return {
    box: `${baseBox} border-wire bg-surface`,
    icon: "text-faint", label: "text-muted",
    badge: null, glow: undefined, opacity,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Hero() {
  const [step, setStep] = useState(0);

  // Recursive timeout chain: advances step, then resets after last step
  useEffect(() => {
    const isLast = step >= LOG_SEQUENCE.length;
    const delay  = isLast ? RESET_DELAY : STEP_DELAYS[step];
    const timer  = setTimeout(() => setStep(isLast ? 0 : (s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [step]);

  const visibleLogs  = LOG_SEQUENCE.slice(0, step);
  const nodeStatuses = NODE_STATES[step];

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center py-16 overflow-hidden">

      {/* Subtle dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--t-wire) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.35,
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 50%, transparent 100%)",
        }}
      />

      {/* Amber ambient bloom */}
      <div
        aria-hidden
        className="absolute -top-40 -left-20 w-[600px] h-[480px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(224,145,50,0.06) 0%, transparent 65%)" }}
      />

      <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* ── LEFT — Copy ─────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Eyebrow */}
            <div className="flex items-center gap-2.5">
              <span className="block w-6 h-px bg-accent" />
              <span className="font-mono text-[11px] font-semibold tracking-widest uppercase text-accent">
                Developer Observability
              </span>
            </div>

            {/* Headline — DM Serif Display + italic accent */}
            <h1 className="font-display text-[2.5rem] sm:text-5xl md:text-[2.8rem] lg:text-[3.4rem] leading-[1.05] tracking-tight text-prose">
              Stop reading logs.{" "}
              <span className="italic text-amber">Start reading maps.</span>
            </h1>

            {/* Body */}
            <p className="font-sans text-base md:text-lg text-muted leading-relaxed max-w-[480px]">
              FlowTrace intercepts your backend stdout and rebuilds the complete execution path
              as a live, interactive diagram — with automated root-cause explanations when
              something fails.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() =>
                  document.getElementById("sandbox")?.scrollIntoView({ behavior: "smooth" })
                }
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-amber text-ink text-sm font-mono font-bold transition-all duration-200 hover:bg-amber-light hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2"
              >
                Launch Sandbox
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() =>
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-wire text-sm font-mono font-medium text-muted hover:border-amber-ring hover:text-accent transition-all duration-200"
              >
                How it works
              </button>
            </div>

            {/* Product mechanics — honest, no stats */}
            <div className="pt-5 border-t border-wire space-y-2.5">
              {[
                "No sidecar agents — one import statement",
                "Bidirectional log-to-node click sync",
                "Client-side PII redaction before any upload",
              ].map((line) => (
                <div key={line} className="flex items-center gap-2.5">
                  <span className="w-1 h-1 rounded-full bg-amber shrink-0" />
                  <span className="font-mono text-xs text-muted">{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT — Live animation ─────────────────────────── */}
          <div className="flex flex-col gap-3">

            {/* Terminal */}
            <div className="rounded-xl border border-wire bg-ink overflow-hidden">
              {/* Chrome bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-wire bg-surface-2">
                <span className="font-mono text-xs text-amber">$ flowtrace trace --live</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
                  STREAMING
                </span>
              </div>

              {/* Log lines */}
              <div className="px-4 py-3 min-h-[150px] font-mono text-xs space-y-1.5 overflow-hidden">
                {visibleLogs.map((log, i) => (
                  <div
                    key={i}
                    style={{ animation: "log-slide-in 0.35s ease-out forwards" }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-faint shrink-0 hidden sm:inline tabular-nums">{log.time}</span>
                    <span
                      className={`font-bold shrink-0 ${
                        log.level === "ERROR" ? "text-signal"
                        : log.level === "WARN"  ? "text-amber"
                        : "text-muted"
                      }`}
                    >
                      [{log.level}]
                    </span>
                    <span className="text-slate-300 break-all">{log.text}</span>
                  </div>
                ))}

                {/* Blinking cursor */}
                <span
                  className="inline-block w-2 h-[13px] bg-amber align-middle"
                  style={{ animation: "cursor-blink 1s step-end infinite" }}
                />
              </div>
            </div>

            {/* Execution Flow Diagram */}
            <div className="rounded-xl border border-wire bg-surface px-4 py-4">
              <p className="font-mono text-[10px] text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="block w-3 h-px bg-amber" />
                Execution Flow
              </p>

              <div className="flex flex-col">
                {FLOW_NODES.map((node, i) => {
                  const status  = nodeStatuses[i];
                  const visible = i < step;
                  const c       = nodeClasses(status, visible);

                  return (
                    <div key={node.id} className="flex flex-col items-stretch">
                      <div
                        className={c.box}
                        style={{
                          opacity:    c.opacity,
                          boxShadow: c.glow,
                          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`${c.icon} shrink-0 transition-colors duration-500`}>
                            {node.icon}
                          </span>
                          <div>
                            <span className={`block text-xs font-mono font-medium ${c.label} leading-none transition-colors duration-500`}>
                              {node.label}
                            </span>
                            <span className="text-[9px] font-mono text-faint">{node.sublabel}</span>
                          </div>
                        </div>
                        {c.badge}
                      </div>

                      {/* Connector line */}
                      {i < FLOW_NODES.length - 1 && (
                        <div className="flex justify-center py-0.5 h-3">
                          <div
                            className="w-px transition-colors duration-500"
                            style={{
                              backgroundColor:
                                status === "error"   ? "rgba(217,95,95,0.5)"
                                : status === "warning" ? "rgba(224,145,50,0.5)"
                                : status === "success" ? "rgba(78,139,104,0.5)"
                                : "var(--t-wire)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
