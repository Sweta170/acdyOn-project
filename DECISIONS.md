# DECISIONS.md

## 1. Why this visual direction?

The three-panel interactive dashboard was the core design choice, and it was deliberate over simpler alternatives (e.g. a static screenshot, an annotated code block, or a feature list). The rationale: a developer product's landing page has to demonstrate the mechanic, not just describe it. A static screenshot is easy to dismiss as marketing polish. A live interactive component — where clicking a log line highlights the pipeline node that emitted it — proves the product model is coherent in a way a paragraph of copy cannot.

**Dark mode via JS-controlled class** (`document.documentElement.classList`) rather than `prefers-color-scheme` in CSS: this was a deliberate trade-off of simplicity for user control. A CSS media-query approach requires no JavaScript but gives the user no toggle. Using a JS class lets localStorage persist the choice, so the user's preference survives navigation. The `ThemeProvider` wraps the entire tree; the `.dark` class is applied before first render through a carefully sequenced `useEffect` + `mounted` guard.

**Conic-gradient CTA border** over a simple background-color hover or box-shadow glow: the rotating gradient achieves the "alive" feeling without animating any layout property (no `width`, `height`, `border`, or `color` changes). The entire effect runs on `opacity` and `transform: rotate()`, both GPU-composited. One polished interaction is more compelling than five mediocre ones, so all other interactive elements use standard Tailwind transitions.

---

## 2. One trade-off made under time pressure

The pipeline trace visualization is a **vertical flex layout with connector dots**, not a real SVG graph. I chose this because a proper SVG approach requires calculating bounding-client-rect coordinates per node on every resize, wiring ResizeObserver, and drawing bezier curves between dynamically positioned elements. That's reliable but takes an extra day to make responsive and accessible correctly.

The flex layout is immediately responsive and works without JavaScript coordinate math. The trade-off: the connections between nodes are implied (a vertical line with a bouncing dot) rather than true graph edges. With a real week I would implement an SVG overlay layer — absolute-positioned over the node flex column — that reads each node's `offsetTop` and draws smooth curved paths between them, updating on `ResizeObserver` fire. I'd also add more incident scenarios and a live filter input that actually filters the log stream by level.

---

## 3. Where AI tools were used

**AI-scaffolded (initial structure generated, then reviewed and integrated):**
- The Tailwind v4 `@theme` token block in `globals.css` — custom color names, HSL values, and keyframe animation syntax for the conic-gradient spin
- The `incidents` data array in `DashboardMockup.tsx` — the three incident scenarios including log entry sequences, node state objects, and root-cause explanation copy
- The conic-gradient CTA button structure — the `group-hover` opacity-swap pattern and the inner mask that punches out the button background to reveal only the border
- The `ThemeContext.tsx` skeleton — the `useState` + `useEffect` shape and the `mounted` guard pattern to prevent hydration mismatch on SSR

**Written, tested, or rewritten personally:**
- All marketing copy in `Hero.tsx` and `page.tsx` — rewritten to remove any claims that read as real production metrics; the benchmark section labels were revised to read "Design Target Specifications" with an explicit disclaimer
- The bidirectional log↔node click-sync logic in `DashboardMockup.tsx` — AI produced the basic `activeNodeId` / `activeLogIndex` state, but the `handleReset()` behaviour, the mobile tab toggle, and the guard that prevents the node panel from de-syncing on incident switch were added and debugged manually
- The mobile responsive layout — the dashboard titlebar overflow fix (`min-w-0`, `shrink-0`, `truncate`, responsive `hidden sm:inline` labels on node-detail badges) was identified and written manually after inspecting the rendered output at 390 px
- The sudo easter egg — the prompt was mine, but the `useRef` sliding-window buffer (`.slice(-4)` to avoid unbounded string growth) and the `instanceof HTMLInputElement` guard that prevents the trigger firing while the user types in a form field were my own additions
