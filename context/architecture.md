# Architecture

**Version:** 1.0

**Status:** Verified

**Last Updated:** 2026-07-09

**Owner:** Engineering

---

# Tech Stack

- **Frontend Framework:** React 19
- **Build Tool:** Vite
- **Desktop Runtime:** Electron (v34)
- **Mobile Runtime:** Capacitor (v6)
- **Styling:** Tailwind CSS (v4)
- **Animation:** Motion (Framer Motion)
- **Icons:** Lucide React
- **Language:** TypeScript

---

# Folder Structure

- `src/`: React frontend application source code.
  - `src/components/`: Reusable React components.
  - `src/utils.ts`: Core business logic, storage abstractions, and calculations.
  - `src/types.ts`: TypeScript interfaces and type definitions.
  - `src/App.tsx`: Main application entry point and state container.
- `electron/`: Electron desktop application scripts.
  - `electron/main.cjs`: Main process entry, window creation, and IPC handlers.
  - `electron/preload.cjs`: Preload script exposing safe IPC methods to the renderer.
- `assets/`: Static assets (e.g., icons for Electron builder).
- `dist/` & `out/`: Build output directories for Vite and Electron respectively.
- `context/`: Context Operating System documentation files.

---

# Module Boundaries

- **Frontend (Renderer):** Responsible for UI rendering, local state management (in `App.tsx`), and triggering storage operations. Unaware of the underlying file system.
- **Backend (Main Process):** Responsible for native window management and local file system access via Node.js `fs` module.
- **Bridge (IPC):** `utils.ts` acts as an abstraction layer. It delegates storage requests to `window.electronAPI` if running in Electron, or falls back to standard web `localStorage` if running in a browser.

---

# Rendering Strategy

The application uses **Client-Side Rendering (CSR)** exclusively.
There is no Server-Side Rendering (SSR) or Static Site Generation (SSG). The entire UI is built and managed in the browser/Electron renderer by React.

---

# Routing

There is no traditional URL-based routing (e.g., React Router).
The application functions as a true Single Page Application (SPA) where navigation is managed via:
- **Conditional Rendering:** Toggling between the Onboarding screen and the Main Dashboard based on the presence of a `userProfile`.
- **Scroll-based Navigation:** Utilizing the `IntersectionObserver` API to detect the currently visible section on the screen and updating the active state in the fixed bottom navbar.

---

# Authentication

None. The application is designed for local, personal use only. There are no login screens or user accounts beyond the local `userProfile` config.

---

# Authorization

None. The local user has full access to all data and settings within the application.

---

# APIs

## Internal IPC APIs
Exposed via `window.electronAPI`:
- `loadData(key)`: Reads JSON data from local files.
- `saveData(key, data)`: Writes JSON data to local files.
- `exportMarkdown(content, filename)`: Exports a formatted markdown summary.
- `clearData()`: Deletes all local JSON data files.

## External APIs
- The project includes `@google/genai` in `package.json` and a `GEMINI_API_KEY` in `.env.example`, indicating potential or active integration with the Google Gemini AI API.

---

# Database

No traditional database engine (SQL/NoSQL) is used.
Data is stored as raw JSON text files for each major entity (e.g., `profile.json`, `activities.json`, `blocks.json`, `journal.json`, `settings.json`).

---

# Storage

- **Electron Environment:** JSON files are saved to the user's OS-specific app data folder (`app.getPath('userData')/data/`). Markdown reports are saved to (`app.getPath('userData')/reports/`).
- **Capacitor / Mobile Environment:** Data is saved to the Android WebView's `localStorage` as a fallback when `window.electronAPI` is unavailable.
- **Browser Environment:** Data is saved to the browser's `localStorage` as a fallback.

---

# Data Flow

1. **User Interaction:** The user interacts with a React component (e.g., creating a new activity).
2. **State Update:** The component triggers a callback passed down from `App.tsx` (e.g., `handleActivityCreated`).
3. **Memory Update:** `App.tsx` updates its local React state to instantly reflect the change in the UI.
4. **Persistence:** `App.tsx` synchronously calls a helper method in `utils.ts` (e.g., `saveActivities`).
5. **Storage Execution:** `utils.ts` delegates to `window.electronAPI.saveData` (Electron) or `localStorage.setItem` (Browser).
6. **Side Effects:** In the Electron environment, saving data also triggers a secondary IPC call to generate and export an updated Markdown summary of the user's state.

---

# External Services

- **Google Gemini API:** Provisioned for AI capabilities (via `@google/genai` and `GEMINI_API_KEY`), although specific implementation details inside components remain to be deeply verified.

---

# Environment Variables

- `GEMINI_API_KEY`: API key for Google Gemini AI.
- `APP_URL`: The URL where the application is hosted (relevant for web/Cloud Run deployments).
- `DISABLE_HMR`: Used by Vite config to disable Hot Module Replacement during automated editing.
- `NODE_ENV`: Used by Electron to determine if it should load the Vite dev server (`development`) or the compiled assets.

---

# System Boundaries

- **Local System:** The application is tightly bound to the local operating system's file system when running via Electron.
- **External Network:** The application boundary extends to external networks only when making potential calls to the Gemini API. Otherwise, it operates fully offline.

---

# Open Questions

- Are there specific components actively utilizing the `@google/genai` package, or is it merely provisioned for future use?
- Will the web deployment fallback (`APP_URL`) be fully supported moving forward, or is Electron the primary target?

---

# Related Documents

Project Overview

Library Docs
