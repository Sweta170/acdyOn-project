"use client";

import React, { useState, useRef } from "react";
import {
  Server,
  Database,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Activity,
  Layers,
  XCircle,
  MinusCircle,
} from "lucide-react";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface LogEntry {
  time: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  nodeId: string;
}

interface TraceNode {
  id: string;
  name: string;
  status: "success" | "warning" | "error" | "skipped";
  duration: string;
  type: "gateway" | "auth" | "cache" | "db" | "limiter" | "handler";
  details: string;
}

interface Incident {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  timestamp: string;
  logs: LogEntry[];
  nodes: TraceNode[];
  explanation: {
    title: string;
    subtitle: string;
    details: string;
    fix: string;
    metric: string;
  };
}

// ─── Data (unchanged from previous version) ──────────────────────────────────

const incidents: Incident[] = [
  {
    id: "incident-1",
    code: "ERR-504",
    title: "Database Lock Contention Timeout",
    description: "POST /api/v1/orders/checkout timed out waiting for checkout_db_lock.",
    severity: "high",
    timestamp: "12:45:08",
    logs: [
      { time: "12:45:01.309", level: "INFO",  message: "Incoming request POST /api/v1/orders/checkout", nodeId: "gw" },
      { time: "12:45:01.320", level: "INFO",  message: "Session token check: Status 200 (Active)",       nodeId: "auth" },
      { time: "12:45:01.350", level: "INFO",  message: "Query cached session token: Redis HIT (3.2ms)",  nodeId: "cache" },
      { time: "12:45:01.355", level: "INFO",  message: "Initiating database transaction: checkout_db_lock", nodeId: "db" },
      { time: "12:45:03.010", level: "WARN",  message: "Row lock waiting on primary key block in table 'inventory_items'", nodeId: "db" },
      { time: "12:45:08.356", level: "ERROR", message: "DB Query execution failed: Wait timeout exceeded on lock", nodeId: "db" },
      { time: "12:45:08.358", level: "ERROR", message: "POST /checkout failed with code 504 (Timeout)", nodeId: "handler" },
    ],
    nodes: [
      { id: "gw",      name: "API Gateway",  status: "success", duration: "11ms",   type: "gateway", details: "Handled edge SSL termination & route matching." },
      { id: "auth",    name: "Auth Service", status: "success", duration: "32ms",   type: "auth",    details: "Checked payload signatures and validated identity." },
      { id: "cache",   name: "Redis Cache",  status: "success", duration: "3ms",    type: "cache",   details: "Token verified. Cache HIT. Session stats loaded." },
      { id: "db",      name: "PostgreSQL DB",status: "error",   duration: "7000ms", type: "db",      details: "Lock contention timeout. Target table: 'inventory_items'." },
      { id: "handler", name: "Error Router", status: "warning", duration: "2ms",    type: "handler", details: "Translated db fail to gateway error 504." },
    ],
    explanation: {
      title:    "Write Lock Contention on Inventory Table",
      subtitle: "checkout_db_lock transaction held by PID 1492",
      details:  "The checkout process attempted to acquire an exclusive write lock on 'inventory_items' row ID 9822. However, a bulk reconciliation job (PID 1492) running concurrently held a table-level lock for over 7.0 seconds. This exceeded FlowTrace's database query threshold of 5.0 seconds, causing thread pool exhaustion and a gateway timeout.",
      fix:      "Add an active retry wrapper around the checkout lock acquisition with randomized exponential backoff, and schedule batch reconciliation routines during off-peak hours.",
      metric:   "7,001ms latency (99th percentile spike)",
    },
  },
  {
    id: "incident-2",
    code: "ERR-401",
    title: "Unauthorized Access on Suspended Account",
    description: "GET /api/v1/analytics/overview rejected with AUTH_SUSPENDED.",
    severity: "medium",
    timestamp: "14:02:11",
    logs: [
      { time: "14:02:11.102", level: "INFO",  message: "Incoming request GET /api/v1/analytics/overview", nodeId: "gw" },
      { time: "14:02:11.109", level: "INFO",  message: "Extracting Authorization Bearer token...",         nodeId: "auth" },
      { time: "14:02:11.115", level: "INFO",  message: "Querying Redis Session Store: Token not found (Cache MISS)", nodeId: "cache" },
      { time: "14:02:11.120", level: "WARN",  message: "Fallback DB query: User 'usr_9x44f' found, status: SUSPENDED", nodeId: "auth" },
      { time: "14:02:11.122", level: "ERROR", message: "Access Denied: Account suspended for billing violations", nodeId: "auth" },
      { time: "14:02:11.124", level: "ERROR", message: "GET /analytics rejected with code 401 (Unauthorized)", nodeId: "handler" },
    ],
    nodes: [
      { id: "gw",      name: "API Gateway",  status: "success", duration: "7ms",  type: "gateway", details: "Forwarded raw GET header routing rules." },
      { id: "cache",   name: "Redis Cache",  status: "warning", duration: "4ms",  type: "cache",   details: "Cache MISS. Token token_sec_99a is expired or evicted." },
      { id: "auth",    name: "Auth Service", status: "error",   duration: "12ms", type: "auth",    details: "Failed credential check. Code: AUTH_SUSPENDED." },
      { id: "db",      name: "PostgreSQL DB",status: "success", duration: "2ms",  type: "db",      details: "Returned profile data. Account state: SUSPENDED." },
      { id: "handler", name: "Error Router", status: "success", duration: "1ms",  type: "handler", details: "Responded with 401 Unauthorized." },
    ],
    explanation: {
      title:    "Suspended Identity Token Execution",
      subtitle: "User usr_9x44f marked INACTIVE due to overdue invoice #9112",
      details:  "The request token was evicted from the Redis cache due to standard TTL expiration. The auth handler fell back to querying PostgreSQL to resolve token user claims, discovering that the user was suspended 2 hours ago. The service correctly aborted execution and rejected the client request before rendering the analytics interface.",
      fix:      "Ensure revoked/suspended user flags are broadcast immediately to Redis using a Redis Pub/Sub channel to avoid database hits on invalid requests.",
      metric:   "Auth execution terminated in 12ms (DB hit saved)",
    },
  },
  {
    id: "incident-3",
    code: "ERR-429",
    title: "Client Rate-Limit Interception",
    description: "GET /api/v1/metrics/live blocked at limit gate.",
    severity: "low",
    timestamp: "15:10:00",
    logs: [
      { time: "15:10:00.005", level: "INFO",  message: "Incoming request GET /api/v1/metrics/live",              nodeId: "gw" },
      { time: "15:10:00.006", level: "INFO",  message: "Client IP: 198.51.100.42",                               nodeId: "gw" },
      { time: "15:10:00.007", level: "INFO",  message: "Token Bucket Check: client_tier_free has 0 tokens remaining", nodeId: "limiter" },
      { time: "15:10:00.008", level: "ERROR", message: "Quota exceeded: Client req rate 102/100 per minute",     nodeId: "limiter" },
      { time: "15:10:00.010", level: "INFO",  message: "Skipping DB execution and API Router logic",             nodeId: "db" },
      { time: "15:10:00.012", level: "ERROR", message: "GET /metrics/live rejected with code 429",              nodeId: "handler" },
    ],
    nodes: [
      { id: "gw",      name: "API Gateway",  status: "success", duration: "4ms", type: "gateway", details: "Captured client IP headers." },
      { id: "limiter", name: "Rate Limiter", status: "error",   duration: "1ms", type: "limiter", details: "Rate limit triggered. Quota 100 req/min exceeded." },
      { id: "db",      name: "PostgreSQL DB",status: "skipped", duration: "0ms", type: "db",      details: "Query skipped. Intercepted by middleware." },
      { id: "handler", name: "Error Router", status: "success", duration: "1ms", type: "handler", details: "Responded with 429 Too Many Requests." },
    ],
    explanation: {
      title:    "Rate Limit Gate Enforcement",
      subtitle: "IP 198.51.100.42 exceeded rate threshold (Free Tier)",
      details:  "A client on the free tier made 102 queries within a sliding window of 60 seconds, violating the quota configuration. The Rate Limiter middleware intercepted the connection immediately. Database queries and backend server compute were skipped entirely, shielding the backend resources from excessive workload.",
      fix:      "Configure the API gateway to reply with a 'Retry-After' header indicating the seconds remaining until the quota window resets (58s in this case).",
      metric:   "Request rejected in 2ms, database operations bypassed",
    },
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardMockup() {
  const [activeIncidentIndex, setActiveIncidentIndex] = useState(0);
  const [activeNodeId,        setActiveNodeId]        = useState<string | null>(null);
  const [activeLogIndex,      setActiveLogIndex]      = useState<number | null>(null);
  const [mobileTab,           setMobileTab]           = useState<"trace" | "logs" | "details">("trace");
  const [fixApplied,          setFixApplied]          = useState(false);
  const fixTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeIncident = incidents[activeIncidentIndex];

  const handleNodeClick = (nodeId: string) => {
    setActiveNodeId(nodeId === activeNodeId ? null : nodeId);
    const idx = activeIncident.logs.findIndex((l) => l.nodeId === nodeId);
    setActiveLogIndex(idx !== -1 ? idx : null);
  };

  const handleLogClick = (idx: number) => {
    setActiveLogIndex(idx === activeLogIndex ? null : idx);
    setActiveNodeId(activeIncident.logs[idx].nodeId);
  };

  const handleReset = () => {
    setActiveNodeId(null);
    setActiveLogIndex(null);
  };

  const handleFixApply = () => {
    if (fixApplied) return;
    setFixApplied(true);
    if (fixTimer.current) clearTimeout(fixTimer.current);
    fixTimer.current = setTimeout(() => setFixApplied(false), 3000);
  };

  const getNodeIcon = (type: TraceNode["type"], status: TraceNode["status"]) => {
    let cls = "w-5 h-5 ";
    if (status === "error")   cls += "text-signal";
    else if (status === "warning") cls += "text-amber";
    else if (status === "skipped") cls += "text-faint";
    else                           cls += "text-sage";

    switch (type) {
      case "gateway": return <Server      className={cls} />;
      case "auth":    return <ShieldAlert className={cls} />;
      case "cache":   return <Layers      className={cls} />;
      case "db":      return <Database    className={cls} />;
      case "limiter": return <Cpu         className={cls} />;
      default:        return <Activity    className={cls} />;
    }
  };

  // ── Severity colour helper ───────────────────────────────────────────────

  const severityClasses = {
    high:   "bg-signal-dim border-signal-ring text-signal",
    medium: "bg-amber-dim border-amber-ring text-amber",
    low:    "bg-sage-dim border-sage-ring text-sage",
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 py-16 overflow-x-hidden">

      {/* ── Fix-applied toast ────────────────────────────────────────────── */}
      <div
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-400 ${
          fixApplied
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2.5 bg-sage-dim border border-sage-ring text-sage font-mono text-xs font-bold px-5 py-3 rounded-xl shadow-2xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Fix applied — hotpatch deployed to staging
        </div>
      </div>

      {/* ── Section header ───────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-semibold rounded-full bg-amber-dim border border-amber-ring text-accent mb-4 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Product in action
        </div>
        <h2 className="font-display text-3xl md:text-4xl text-prose leading-tight">
          See FlowTrace in action.
        </h2>
        <p className="text-sm text-muted font-sans mt-2 max-w-lg mx-auto">
          Three real incident scenarios. Click any node or log line — they stay in sync.
        </p>
      </div>

      {/* ── Incident selector tabs ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-4 justify-center">
        {incidents.map((inc, idx) => {
          const active = idx === activeIncidentIndex;
          return (
            <button
              key={inc.id}
              onClick={() => {
                setActiveIncidentIndex(idx);
                setActiveNodeId(null);
                setActiveLogIndex(null);
                setMobileTab("trace");
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-xs font-mono font-semibold transition-all duration-200 ${
                active
                  ? "bg-amber-dim border-amber-ring text-accent"
                  : "bg-surface border-wire text-muted hover:border-wire-2 hover:text-prose"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  inc.severity === "high"   ? "bg-signal"
                  : inc.severity === "medium" ? "bg-amber"
                  : "bg-sage"
                }`}
              />
              {inc.code}
              <span className="hidden sm:inline text-faint font-normal">— {inc.title.split(" ").slice(0, 3).join(" ")}…</span>
            </button>
          );
        })}
      </div>

      {/* ── Dashboard panel ──────────────────────────────────────────── */}
      <div className="w-full bg-surface rounded-2xl border border-wire shadow-2xl overflow-hidden">

        {/* Terminal-style chrome bar */}
        <div className="px-4 sm:px-5 py-3 bg-surface-2 border-b border-wire flex items-center justify-between gap-3 min-w-0 font-mono text-xs">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <span className="text-accent shrink-0">$</span>
            <span className="text-muted truncate">
              flowtrace trace{" "}
              <span className="text-prose">--id={activeIncident.id}</span>
              {" "}
              <span className="text-prose hidden sm:inline">--ts={activeIncident.timestamp}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {(activeNodeId || activeLogIndex !== null) && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[11px] text-muted hover:text-prose transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">RESET</span>
              </button>
            )}
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
              <span className="hidden sm:inline">LIVE</span>
            </span>
          </div>
        </div>

        {/* Mobile tab switcher */}
        <div className="flex md:hidden border-b border-wire bg-surface-2">
          {(["trace", "logs", "details"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`flex-1 py-3 text-center text-[11px] font-mono font-semibold border-b-2 transition-all ${
                mobileTab === tab
                  ? "border-amber text-accent bg-amber-dim"
                  : "border-transparent text-muted"
              }`}
            >
              {tab === "trace" ? "VISUAL TRACE" : tab === "logs" ? "RAW LOGS" : "EXPLAINER"}
            </button>
          ))}
        </div>

        {/* Three-panel grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[520px]">

          {/* ── COLUMN 1: Pipeline map ─────────────────────────── */}
          <div
            className={`md:col-span-4 p-5 border-r border-wire flex flex-col gap-3 bg-surface ${
              mobileTab !== "trace" ? "hidden md:flex" : "flex"
            }`}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted flex items-center gap-1.5">
              <span className="block w-3 h-px bg-accent" />
              Request pipeline
            </p>

            <div className="flex flex-col gap-0 flex-1">
              {activeIncident.nodes.map((node, nodeIdx) => {
                const isActive  = activeNodeId === node.id;
                const isSkipped = node.status === "skipped";
                const isErr     = node.status === "error";
                const isWarn    = node.status === "warning";
                const isOk      = node.status === "success";
                // When fix is applied, all non-skipped nodes briefly flash green
                const fixOverride = fixApplied && !isSkipped;

                const cardBase = "w-full flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200";
                const cardStyle = fixOverride
                  ? `${cardBase} border-sage-ring bg-sage-dim shadow-[0_0_12px_rgba(78,139,104,0.25)]`
                  : isActive
                  ? isErr   ? `${cardBase} border-signal-ring bg-signal-dim shadow-[0_0_12px_rgba(217,95,95,0.15)]`
                    : isWarn ? `${cardBase} border-amber-ring bg-amber-dim shadow-[0_0_12px_rgba(224,145,50,0.15)]`
                    : `${cardBase} border-amber-ring bg-amber-dim`
                  : isSkipped ? `${cardBase} border-wire opacity-40`
                  : `${cardBase} border-wire hover:border-wire-2`;

                return (
                  <div key={node.id} className="flex flex-col">
                    <button
                      onClick={() => handleNodeClick(node.id)}
                      className={cardStyle}
                    >
                      <div className="mt-0.5 shrink-0">{getNodeIcon(node.type, node.status)}</div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs font-mono font-semibold ${
                            isActive ? "text-prose"
                            : isSkipped ? "text-faint"
                            : "text-prose"
                          }`}>
                            {node.name}
                          </span>
                          <span className="text-[10px] font-mono text-muted shrink-0">{node.duration}</span>
                        </div>
                        <p className="text-[10px] text-muted leading-snug line-clamp-2">{node.details}</p>
                        {isActive && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {isErr  ? <XCircle    className="w-3 h-3 text-signal" /> :
                             isWarn ? <AlertTriangle className="w-3 h-3 text-amber" /> :
                             isOk   ? <CheckCircle2  className="w-3 h-3 text-sage"   /> :
                                      <MinusCircle   className="w-3 h-3 text-faint"  />}
                            <span className={`text-[10px] font-mono font-bold ${
                              isErr  ? "text-signal"
                              : isWarn ? "text-amber"
                              : isOk   ? "text-sage"
                              : "text-faint"
                            }`}>
                              {isErr ? "ERROR" : isWarn ? "WARNING" : isOk ? "OK" : "SKIPPED"}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Connector */}
                    {nodeIdx < activeIncident.nodes.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <div
                          className="w-px h-4 transition-colors duration-300"
                          style={{
                            backgroundColor:
                              node.status === "error"   ? "rgba(217,95,95,0.4)"
                              : node.status === "warning" ? "rgba(224,145,50,0.4)"
                              : node.status === "success" ? "rgba(78,139,104,0.4)"
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

          {/* ── COLUMN 2: Log stream ───────────────────────────── */}
          <div
            className={`md:col-span-4 flex flex-col border-r border-wire bg-ink ${
              mobileTab !== "logs" ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="px-4 py-3 border-b border-wire bg-surface-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                stdout stream
              </span>
              <span className="font-mono text-[10px] text-faint">{activeIncident.logs.length} lines</span>
            </div>

            {/* Log entries */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-[11px]">
              {activeIncident.logs.map((log, i) => {
                const isActive = i === activeLogIndex;
                return (
                  <button
                    key={i}
                    onClick={() => handleLogClick(i)}
                    className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded transition-all duration-150 ${
                      isActive
                        ? "border-l-2 border-amber bg-amber-dim pl-1.5"
                        : "border-l-2 border-transparent hover:border-wire hover:bg-surface/50"
                    }`}
                  >
                    <span className="text-faint shrink-0 tabular-nums hidden sm:inline">{log.time}</span>
                    <span
                      className={`font-bold shrink-0 ${
                        log.level === "ERROR" ? "text-signal"
                        : log.level === "WARN"  ? "text-amber"
                        : "text-muted"
                      }`}
                    >
                      [{log.level}]
                    </span>
                    <span className={`break-all leading-snug ${isActive ? "text-slate-200" : "text-slate-400"}`}>
                      {log.message}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Grep bar */}
            <div className="border-t border-wire px-4 py-2.5 bg-surface-2 flex items-center gap-2 font-mono text-xs text-faint">
              <span className="text-accent">$</span>
              <span>grep -i &quot;error&quot; stdout.log</span>
              <span
                className="inline-block w-1.5 h-3.5 bg-amber align-middle ml-0.5"
                style={{ animation: "cursor-blink 1s step-end infinite" }}
              />
            </div>
          </div>

          {/* ── COLUMN 3: Root-cause explainer ────────────────── */}
          <div
            className={`md:col-span-4 flex flex-col ${
              mobileTab !== "details" ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Explainer header */}
            <div className="px-5 py-4 border-b border-wire bg-surface-2">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${severityClasses[activeIncident.severity]}`}>
                  {activeIncident.severity.toUpperCase()} SEVERITY
                </span>
                <span className="text-[10px] font-mono text-faint">{activeIncident.code}</span>
              </div>
              <h4 className="font-display text-base text-prose leading-snug">
                {activeIncident.explanation.title}
              </h4>
              <p className="font-mono text-[10px] text-muted mt-1">
                {activeIncident.explanation.subtitle}
              </p>
            </div>

            {/* Explainer body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              <div>
                <h5 className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
                  <span className="block w-2 h-px bg-accent" /> What happened
                </h5>
                <p className="text-xs text-muted leading-relaxed font-sans">
                  {activeIncident.explanation.details}
                </p>
              </div>

              <div>
                <h5 className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
                  <span className="block w-2 h-px bg-sage" /> Suggested fix
                </h5>
                <p className="text-xs text-muted leading-relaxed font-sans">
                  {activeIncident.explanation.fix}
                </p>
              </div>
            </div>

            {/* Summary stats */}
            <div className="border-t border-wire p-4 space-y-2 bg-surface-2">
              <div className="flex justify-between items-center font-mono text-[11px]">
                <span className="text-muted">LATENCY / ANOMALY:</span>
                <span className="text-amber font-bold">{activeIncident.explanation.metric}</span>
              </div>
              <div className="flex justify-between items-center font-mono text-[11px]">
                <span className="text-muted">HOOK-TO-DISPATCH (EXAMPLE):</span>
                <span className="text-prose font-bold">~12ms</span>
              </div>

              <button
                onClick={handleFixApply}
                disabled={fixApplied}
                className={`w-full mt-2 flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold py-2 rounded-lg transition-all duration-300 ${
                  fixApplied
                    ? "bg-sage text-ink cursor-default"
                    : "bg-amber text-ink hover:bg-amber-light"
                }`}
              >
                {fixApplied ? (
                  <><CheckCircle2 className="w-3 h-3" /> FIX APPLIED</>
                ) : (
                  <><Sparkles className="w-3 h-3" /> AUTO-APPLY FIX OVERLAY</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
