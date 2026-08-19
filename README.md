# FlowTrace — Backend Log Visualizer

**FlowTrace** is a developer observability tool that intercepts raw backend stdout logs and translates them into interactive, real-time execution flow diagrams with automated root-cause explanations.

This repository is a **product landing page** built as a coding assessment demonstrating:
- A premium SaaS front-end with a distinctive design system
- A fully interactive "product in action" dashboard mockup (no screenshots — real HTML/CSS/React)
- One polished micro-interaction (rotating conic-gradient CTA border on hover)
- Full dark/light mode with localStorage persistence
- Responsive layout tested at 390px, 768px, and 1440px

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (CSS-first `@theme` — no `tailwind.config.js`) |
| Icons | Lucide React |
| Fonts | Space Grotesk · Inter · JetBrains Mono (via `next/font/google`) |
| Deploy | Vercel |

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
# → http://localhost:3000

# 3. Production build (optional)
npm run build
npm run start
```

Node.js 18+ required.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout — fonts, metadata, ThemeProvider
│   ├── globals.css         # Tailwind v4 @theme tokens, animations, scrollbar
│   └── page.tsx            # Full page — header, hero, sandbox, features, footer
└── components/
    ├── Hero.tsx             # Hero section with rotating-glow CTA micro-interaction
    ├── DashboardMockup.tsx  # 3-panel interactive product dashboard
    └── ThemeContext.tsx     # Dark/light mode context with localStorage persistence
```

---

## Design Decisions

See [DECISIONS.md](./DECISIONS.md) for a concise explanation of:
- Why this visual direction over simpler alternatives
- One trade-off made under time pressure
- Where AI tools were used in the build

---

## Live URL

> **Deployed URL:** https://flowtrace.vercel.app
