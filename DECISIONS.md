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

## 3. Where AI was used

**AI wrote the initial scaffolding for:**
- The Tailwind v4 `@theme` token block in `globals.css` (custom colors, keyframe animation syntax)
- The `incidents` data array in `DashboardMockup.tsx` — the three incident scenarios with log entries and node state objects
- The conic-gradient CTA button structure (`group-hover`, opacity swap, inner mask pattern)
- The `ThemeContext.tsx` structure including the `mounted` guard pattern

**I reviewed, tested, and modified:**
- All copy in `Hero.tsx` and `page.tsx` — rewritten to remove any claims that read like real metrics. The feature blurbs, benchmark section labels, and body text were all reviewed for honesty.
- The bidirectional log↔node click sync logic in `DashboardMockup.tsx` — AI produced the basic `activeNodeId` / `activeLogIndex` state, but the `handleReset()` behavior and the mobile tab state were added and debugged manually.
- The mobile responsive layout — the dashboard titlebar overflow fix (`min-w-0`, `shrink-0`, `truncate`, responsive `hidden sm:inline` labels) was identified and written manually after inspecting the rendered output.
- The sudo easter egg — prompt driven, but the `useRef` buffer pattern (`.slice(-4)` to avoid unbounded string growth) and the guard against firing inside `<input>` elements were my own additions.
