"use client";

import React, { useState, useEffect, useRef } from "react";
import Hero from "@/components/Hero";
import DashboardMockup from "@/components/DashboardMockup";
import HowItWorks from "@/components/HowItWorks";
import { useTheme } from "@/components/ThemeContext";
import { Sun, Moon, Terminal, ArrowUpRight, Heart } from "lucide-react";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  // ── Sudo easter egg ────────────────────────────────────────────────────────
  const [sudoVisible, setSudoVisible] = useState(false);
  const sudoBuffer = useRef("");
  const sudoTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;
      sudoBuffer.current = (sudoBuffer.current + e.key).slice(-4);
      if (sudoBuffer.current === "sudo") {
        setSudoVisible(true);
        sudoBuffer.current = "";
        if (sudoTimer.current) clearTimeout(sudoTimer.current);
        sudoTimer.current = setTimeout(() => setSudoVisible(false), 4000);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (sudoTimer.current) clearTimeout(sudoTimer.current);
    };
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">

      {/* ── Sudo easter egg toast ──────────────────────────────────────── */}
      <div
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 ${
          sudoVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-ink border border-signal/40 rounded-xl px-5 py-4 shadow-2xl font-mono text-xs max-w-xs">
          <p className="text-signal font-bold mb-1">$ sudo rm -rf /production</p>
          <p className="text-slate-400">
            <span className="text-signal">Permission denied:</span> you are not root.
          </p>
          <p className="text-faint mt-2 text-[10px]">
            (nice try though — FlowTrace logged this attempt)
          </p>
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-wire transition-colors duration-300 overflow-x-hidden"
        style={{ backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4 min-w-0">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono font-bold text-xl text-amber tracking-tight">F</span>
            <span className="font-mono font-bold text-xl tracking-tight text-prose">LOWTRACE</span>
            <span className="text-[9px] font-mono font-bold bg-amber-dim text-accent border border-amber-ring px-2 py-0.5 rounded-full ml-1">
              BETA
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 font-mono text-xs font-semibold text-muted">
            <button
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-prose transition-colors"
            >
              /HOW-IT-WORKS
            </button>
            <button
              onClick={() => document.getElementById("sandbox")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:text-prose transition-colors"
            >
              /SANDBOX
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-prose transition-colors flex items-center gap-0.5"
            >
              /GITHUB <ArrowUpRight className="w-3 h-3" />
            </a>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg border border-wire bg-surface hover:border-wire-2 text-muted hover:text-prose transition-all duration-200"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => alert("Run: npm install -g flowtrace-cli")}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber text-ink text-xs font-mono font-bold hover:bg-amber-light transition-all duration-200"
            >
              <Terminal className="w-3.5 h-3.5" />
              INSTALL CLI
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-grow">

        {/* HERO */}
        <Hero />

        {/* HOW IT WORKS */}
        <section className="border-t border-wire bg-surface/30">
          <HowItWorks />
        </section>

        {/* SANDBOX */}
        <section
          id="sandbox"
          className="border-t border-wire scroll-mt-16"
        >
          <DashboardMockup />
        </section>

        {/* DESIGN TARGET SPECS (simulated targets, not benchmarks) */}
        <section className="border-t border-wire py-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted text-center mb-1">
              Design Target Specifications
            </p>
            <p className="text-center text-[10px] font-mono text-faint mb-10">
              Simulated targets — not measured production benchmarks
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              {[
                { value: "< 0.5ms", label: "Log Injection Target",   color: "text-amber"  },
                { value: "15k/s",   label: "Parse Throughput Target", color: "text-prose"  },
                { value: "3.4 MB",  label: "Package Size Target",     color: "text-sage"   },
                { value: "100%",    label: "Client-Side Redaction",   color: "text-prose"  },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1.5">
                  <span className={`block font-display text-3xl md:text-4xl font-bold ${stat.color}`}>
                    {stat.value}
                  </span>
                  <span className="block text-[10px] font-mono text-muted uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-wire py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">

          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-amber tracking-tight">F</span>
            <span className="font-mono text-xs text-muted">
              © {new Date().getFullYear()} FlowTrace. Made for developers.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-mono text-[10px] font-semibold text-muted">
            <a href="#how-it-works" className="hover:text-prose transition-colors">HOW IT WORKS</a>
            <a href="#sandbox"       className="hover:text-prose transition-colors">SANDBOX</a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-prose transition-colors"
            >
              GITHUB
            </a>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted shrink-0">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-signal fill-signal" />
            <span>in Next.js</span>
          </div>

        </div>
      </footer>
    </div>
  );
}
