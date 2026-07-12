# Code Standards

**Version:** 1.0

**Status:** Verified

**Last Updated:** 2026-07-09

**Owner:** Engineering

---

# Philosophy

The codebase prioritizes local-first performance, simplicity, and explicit state management. Code should be pragmatic and directly solve the user's need for time tracking without over-engineering server abstractions, as the application runs heavily on the client side (Electron / Browser).

---

# Naming

- **React Components:** `PascalCase` (e.g., `ActiveTracker`, `BlockCalendar`).
- **Files:** Match the component name exactly (`PascalCase.tsx`). Utility files use `camelCase` (e.g., `utils.ts`, `types.ts`). Electron backend files use `camelCase` (e.g., `main.cjs`).
- **Interfaces / Types:** `PascalCase` (e.g., `UserProfile`, `TimeBlock`).
- **Functions / Methods:** `camelCase` (e.g., `calculateLostTimeForDate`, `saveActivities`).
- **Constants:** `UPPER_SNAKE_CASE` for global constants (e.g., `DEFAULT_CATEGORIES`, `CATEGORY_COLORS`).

---

# Folder Rules

- `src/`: Root for all frontend application code.
- `src/components/`: A flat directory containing all reusable UI panels and components.
- `electron/`: Root for all desktop environment scripts and IPC configurations.
- `assets/`: Static image assets and icons.
- There are no nested domain-driven subfolders within components. The architecture is currently flat.

---

# File Rules

- **React:** `.tsx` extension must be used for files containing JSX.
- **TypeScript Logic:** `.ts` extension for pure logic, types, and constants.
- **Node Scripts:** `.cjs` for CommonJS scripts required by Electron's main process.

---

# TypeScript

- Interfaces are strictly used over type aliases for object definitions.
- Explicit return types are heavily utilized, especially for asynchronous data accessors (e.g., `Promise<void>`, `Promise<Activity[]>`).
- Strict typing is enforced (as defined in `tsconfig.json`).

---

# React

- **Functional Components:** Exclusively used. No class components.
- **State Management:** Localized within `App.tsx` and distributed downwards via props (prop-drilling).
- **Hooks:** Heavy and explicit use of `useState`, `useEffect`, `useCallback`, and `useMemo` to manage state synchronization and reactivity.

---

# Next.js

N/A - This project is built using Vite, React, and Electron. It does not use Next.js.

---

# APIs

- **IPC Abstraction:** Standard API calls are replaced by native Electron IPC channels. 
- **Wrapper Pattern:** `utils.ts` acts as the single source of truth for "API" calls. It checks for `window.electronAPI` and delegates to IPC if available, otherwise falling back to browser `localStorage`.

---

# Server Actions

N/A - This project operates without a Node.js web server backend or server actions.

---

# Error Handling

- **Try/Catch:** Wraps risky synchronous parsing operations (e.g., `JSON.parse()` in `utils.ts` and IPC handlers).
- **Graceful Fallbacks:** If loading settings or profiles fails, the app falls back to predefined default constants (e.g., returning `{ categories: DEFAULT_CATEGORIES }`).
- **IPC Failures:** The main process catches filesystem errors and returns `null` or `false` to the renderer to prevent hard crashes.

---

# Logging

- **Client/Renderer:** Basic `console.error` usage for caught exceptions during data imports or JSON parsing. No complex telemetry or logging frameworks are implemented.
- **Main Process:** Uses `console.error` to log filesystem access issues (e.g., `Error reading profile.json:`).

---

# Validation

- Minimal explicit validation schemas.
- The UI restricts bad inputs structurally (e.g., native `<input type="date">` elements and `<select>` dropdowns).
- The `importDatabaseFromJSON` function employs a basic `try/catch` to validate incoming JSON structure before committing to disk.

---

# Imports

- Explicit file extensions are required for local relative imports due to Vite/ESM configurations (e.g., `import { Activity } from '../types.ts';`).
- Third-party packages omit extensions (e.g., `import { Search } from 'lucide-react';`).

---

# Exports

- **Components:** Default exports are standard (`export default ActivityLog;`).
- **Utilities & Types:** Named exports are standard for aggregations of functions and interfaces (`export async function getActivities`, `export interface UserProfile`).

---

# Performance

- **Memoization:** React's `memo` is utilized on list-heavy components (like `ActivityLog`) to prevent unnecessary re-renders.
- **Reference Stability:** `useCallback` is heavily used in `App.tsx` to pass stable function references down to child components.
- `useMemo` is used for computationally derived arrays (like generating the `weekdaysChecklist`).

---

# Open Questions

- Will the flat `src/components/` folder structure scale, or should domain-driven folders be introduced?
- As the project grows, should a formal validation library (like Zod) be adopted for the JSON import functionality?

---

# Related Documents

Architecture

Library Docs
