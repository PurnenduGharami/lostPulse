# Library Documentation

**Version:** 1.0

**Status:** Verified

**Last Updated:** 2026-07-09

**Owner:** Engineering

---

# Library Usage

## React (v19)
- **Purpose:** Core UI rendering library.
- **Why We Use It:** Industry standard for building component-driven single-page applications. Allows for reactive state management of the complex dashboard UI.
- **Initialization:** Bootstrapped via Vite (`main.tsx`). Uses `StrictMode` and `createRoot`.
- **Project Usage:** Used universally across the `src/` directory. Heavily relies on functional components and Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `memo`).
- **Restrictions:** No class components are permitted.
- **Common Mistakes:** Forgetting to memoize expensive derived state calculations (e.g., in `AnalyticsPanel.tsx`) causing unnecessary re-renders when the global clock ticks.
- **Upgrade Notes:** Currently on React 19. Ensure `react-dom` matches the exact version of `react`.

## Tailwind CSS (v4)
- **Purpose:** Utility-first CSS framework for rapid UI styling.
- **Why We Use It:** Removes the need for separate stylesheet files (mostly) and provides a consistent, scalable design system out of the box.
- **Initialization:** Injected via the `@tailwindcss/vite` plugin in `vite.config.ts`. Core theme extended in `src/index.css` using the new `@theme` directive.
- **Project Usage:** Used for almost all styling via inline `className` props. Custom tokens (fonts) are defined in `@theme` and utilized as utilities (e.g., `font-cinzel`).
- **Restrictions:** Avoid using inline `style={{}}` tags unless dynamically calculating values (like colors based on severity scores). Do not write vanilla CSS unless building complex custom effects (like `.liquid-glass`).
- **Common Mistakes:** Attempting to use old `tailwind.config.js` syntax. Version 4 relies heavily on CSS-native variables and the `@theme` block.
- **Upgrade Notes:** V4 introduces massive changes to initialization and configuration compared to V3. Consult the Tailwind v4 migration guide before any major dependency updates.

## Framer Motion (`motion/react`)
- **Purpose:** Animation library for React.
- **Why We Use It:** Simplifies complex, declarative scroll-reveal and layout animations that would be tedious to manage with vanilla CSS transitions.
- **Initialization:** No global initialization required. Imported directly into components as needed.
- **Project Usage:** Used primarily for `<motion.section>` layout wrappers in `App.tsx` to create the smooth "fade and slide up" scroll reveal effects.
- **Restrictions:** Limit usage to major layout transitions or highly interactive elements to prevent performance degradation on lower-end machines. Use Tailwind transitions for simple hover effects.
- **Common Mistakes:** Overusing `whileInView` on heavily nested or deeply repeated list items (like the `ActivityLog` list), which can cause layout thrashing.
- **Upgrade Notes:** Keep an eye on package size and tree-shaking efficacy when updating.

## Recharts
- **Purpose:** Charting and data visualization library for React.
- **Why We Use It:** Provides responsive, accessible, and easily customizable SVG charts for the Analytics sections.
- **Initialization:** Imported directly where needed (e.g., `AnalyticsPanel.tsx`).
- **Project Usage:** Used to render the "Weekly Time Allocation" (BarChart) and "Category Distribution" (PieChart) components.
- **Restrictions:** Custom tooltips must be heavily styled to match the dark gothic aesthetic of the app (black backgrounds, red accents). Default light tooltips are not permitted.
- **Common Mistakes:** Passing unstable array references to chart data props, causing infinite re-render loops within the Recharts context.
- **Upgrade Notes:** Recharts minor updates occasionally introduce SVG rendering changes. Visually regression test the `AnalyticsPanel` after upgrading.

## Lucide React
- **Purpose:** SVG Icon library.
- **Why We Use It:** Provides clean, consistent, and lightweight icons that integrate perfectly with React and Tailwind (inheriting text color and size).
- **Initialization:** Imported directly per icon.
- **Project Usage:** Heavily used in the fixed navigation bar, buttons, and list items (e.g., `Search`, `Trash2`, `CalendarClock`).
- **Restrictions:** Use standard imports (e.g., `import { Search } from 'lucide-react'`).
- **Common Mistakes:** Importing the entire icon bundle instead of named exports, potentially bloating the bundle size (though Vite usually tree-shakes this successfully).
- **Upgrade Notes:** Low risk.

## Electron
- **Purpose:** Cross-platform desktop application framework.
- **Why We Use It:** Allows the web app to run as a native desktop application with direct, uninhibited access to the local filesystem for pure, secure local storage without a cloud backend.
- **Initialization:** Bootstrapped via `electron/main.cjs`. Uses `electron-builder` for packaging.
- **Project Usage:** Runs the main process, serving the Vite build from `dist/`. Handles IPC (Inter-Process Communication) via `preload.cjs` to save and load JSON files directly to the user's OS data directory.
- **Restrictions:** The renderer process (`src/`) must NEVER attempt to import Node.js core modules (`fs`, `path`) directly. All native access must pass through the `window.electronAPI` bridge.
- **Common Mistakes:** Forgetting to handle asynchronous IPC resolution states in the React UI, leading to race conditions before data is loaded from disk.
- **Upgrade Notes:** Electron upgrades frequently break IPC syntax or introduce new security sandbox requirements. Read Electron breaking changes thoroughly before upgrading.

---

# Open Questions

- `package.json` lists `@google/genai` and `express` as dependencies, but they are not currently utilized in the `src/` or `electron/` environments. Should these be uninstalled to reduce dependency bloat?
- Are there plans to replace Recharts with a lighter alternative if the bundle size becomes an issue, or is the feature set sufficient?

---

# Related Documents

Architecture

Code Standards
