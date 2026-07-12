# Implementation Roadmap

**Version:** 1.0

**Status:** Verified

**Last Updated:** 2026-07-09

**Owner:** Engineering

---

# Phase 1: Foundation & Backend Configuration

**Goal:** Establish the cross-platform application harness and secure data pipeline.

- **Step 1:** Initialize the Vite + React (TypeScript) project.
- **Step 2:** Install core dependencies (Tailwind v4, Framer Motion, Recharts, Lucide React).
- **Step 3:** Configure the Electron environment (`electron/main.cjs` and `preload.cjs`), establishing the IPC channels (`load-data`, `save-data`, `export-markdown`).
- **Step 4:** Define core data contracts in `src/types.ts` (`UserProfile`, `Activity`, `TimeBlock`, `JournalEntry`).
- **Definition of Done:** The application launches successfully as a native Electron window, and the IPC bridge successfully reads/writes a test JSON payload to the local operating system data directory.

---

# Phase 2: Core Logic & Styling Abstractions

**Goal:** Bridge the backend pipeline to the frontend and establish the visual design system.

- **Step 1:** Implement `src/utils.ts` to act as the universal data access layer (checking `window.electronAPI` with `localStorage` fallbacks).
- **Step 2:** Implement core mathematical engines in `utils.ts` (e.g., `calculateLifeRemaining`, `calculatePulseScoreForDate`, `calculateLostTimeForDate`).
- **Step 3:** Configure `src/index.css` by defining the Tailwind `@theme` font variables and creating the base `.liquid-glass` and `.gothic-glow-red` utility classes.
- **Definition of Done:** The data access layer securely persists TypeScript objects to disk, and the core CSS tokens are available for UI consumption.

---

# Phase 4: Application Shell & Onboarding

**Goal:** Create the global state container and handle initial user acquisition.

- **Step 1:** Implement the global state container within `src/App.tsx` (using `useState` and `useEffect` to hydrate data on mount).
- **Step 2:** Build the `<Onboarding />` component to capture the user's biological baseline (Name, Birth Date, Target Lifespan).
- **Step 3:** Implement the global 1-second `setInterval` loop in `App.tsx` to drive real-time clocks.
- **Step 4:** Build the global layout, including the Hero Section, scroll-spy `<section>` wrappers, and the fixed bottom Navigation bar.
- **Definition of Done:** A new user can complete the onboarding flow, advancing to an empty (but styled) application shell with functional smooth-scroll navigation.

---

# Phase 5: Sensor Array (Top Metrics)

**Goal:** Provide immediate, visceral feedback on the user's temporal state.

- **Step 1:** Implement `<LifeRemainingCard />` consuming the real-time clock tick from `App.tsx`.
- **Step 2:** Implement `<TodayBudget />` to visualize the 1440-minute daily capacity.
- **Step 3:** Implement `<LostTimeCard />` to calculate untracked vs tracked ratios.
- **Step 4:** Implement `<PulseScoreCard />` to aggregate the daily intentionality score.
- **Definition of Done:** The top grid renders successfully and accurately calculates metrics based on empty or mocked array data.

---

# Phase 6: Input Systems (Chronology & Architecture)

**Goal:** Allow the user to input and manage their time blocks and activities.

- **Step 1:** Implement `<ActiveTracker />` with an integrated stopwatch and manual logging form.
- **Step 2:** Implement `<ActivityLog />` to list, filter, and delete historical activity records.
- **Step 3:** Implement `<BlockCalendar />` to schedule intent and track completion states ("Completed", "Partial", "Missed").
- **Step 4:** Implement `<ReflectionDiary />` for end-of-day qualitative journaling.
- **Definition of Done:** Users can successfully create, view, and permanently delete activities, blocks, and journal entries, with all changes immediately persisting to local storage.

---

# Phase 7: Analytics & Export Systems

**Goal:** Provide retrospective analysis and data sovereignty.

- **Step 1:** Implement `<AnalyticsPanel />` using Recharts to visualize weekly allocation and category distributions.
- **Step 2:** Implement `<ReportsPanel />` to generate structured text summaries of the user's progress.
- **Step 3:** Implement the backend markdown exporter (`exportMarkdown` in IPC) alongside the automated `syncMarkdown` trigger in `utils.ts`.
- **Step 4:** Implement `<BackupSystem />` allowing raw JSON database exports and imports.
- **Definition of Done:** The user can view visual trend data, and successfully export/import their entire `.json` database file from the Settings menu.

---

# Open Questions

- Should a dedicated testing phase (e.g., unit testing `utils.ts` calculators) be injected into Phase 2 for future rebuilds?
- Is there a need to decouple the monolithic `App.tsx` state into a React Context before Phase 4 is considered fully "Done"?

---

# Related Documents

Project Overview

Architecture
