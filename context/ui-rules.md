# UI Rules

**Version:** 1.0

**Status:** Verified

**Last Updated:** 2026-07-09

**Owner:** Design

---

# Layout

- **Architecture:** Single Page Application (SPA) with a continuous vertical scroll.
- **Main Container:** The dashboard uses a centered, constrained width approach (`max-w-4xl` or `w-full mx-auto px-4 sm:px-6`).
- **Sections:** Major feature areas (Sensors, Chronology, etc.) are wrapped in `<motion.section>` with consistent vertical spacing (`space-y-32 md:space-y-48`).
- **Cards:** Heavy reliance on the custom `.liquid-glass` class. Cards generally use `p-6 rounded-lg flex flex-col`.
- **Grids:** Dashboard metrics utilize a responsive grid (`grid-cols-1 md:grid-cols-3 gap-6`).

---

# Navigation

- **Scroll-Spy Mechanism:** Navigation is driven by native scroll position via `IntersectionObserver`.
- **Bottom Navbar:** 
  - Fixed position at the bottom of the screen (`fixed bottom-3 left-1/2 -translate-x-1/2`).
  - Contains icons and labels for major sections.
  - Smoothly scrolls the window to the target section ID (`scrollIntoView({ behavior: 'smooth' })`).
  - Disappears when the user is at the very top (Hero Section) and translates up once scrolled past a certain threshold.
- **Date Selector:** A horizontal, scrollable timeline (`overflow-x-auto`) is used to change the global selected date.

---

# Forms

- **Structure:** Vertical stacking using Tailwind's `space-y-*` utilities (e.g., `space-y-4` or `space-y-6`).
- **Inputs:** 
  - Standard styling: `bg-black/40 border border-neutral-700/50 focus:border-neutral-500 rounded-md py-2.5 px-4`.
  - Focus rings are explicitly removed (`outline-none`), relying on border color changes for focus states.
  - Text is typically small (`text-xs` or `text-sm`) and uses the sans font.
- **Buttons:** Form submission buttons are uppercase, boldly tracked (`tracking-widest`), and feature background/color transitions on hover.

---

# Tables

- **No HTML Tables:** The application does not use native `<table>` tags for data display in the UI.
- **List Layouts:** Data (like Activity Logs or Time Blocks) is presented using stacked flex/grid containers inside scrollable `div`s.
- *(Note: Markdown exports do generate table structures, but these are not rendered in the React UI).*

---

# Dialogs

- **No Custom Modals:** The application currently lacks a custom dialog or modal system.
- **Native Prompts:** Destructive actions (like deleting an activity or resetting the database) trigger native browser `confirm()` popups.

---

# Empty States

- **Visual Style:** Minimalist, centered text.
- **Container:** Usually presented inside a padded block (`py-20`) with a subtle background (`bg-black/20 rounded-md border border-neutral-800/40`).
- **Typography:** Text is neutral, uppercase, small, and widely tracked (e.g., `text-neutral-600 font-sans font-medium text-xs uppercase tracking-widest`).

---

# Loading States

- **Global App Loading:** A full-screen (`min-h-screen`) centered flex container with a black background.
- **Animation:** Utilizes a bouncing heart icon (`animate-bounce`) and an overarching pulsing effect (`animate-pulse`).
- **Text:** "Initializing Systems..." displayed in uppercase mono font.
- **Component Loading:** Currently, individual components do not exhibit distinct skeleton loaders; they rely on the global initial load.

---

# Error States

- **Implicit Errors:** There are no formalized, cross-component error state UIs (e.g., toast notifications or error banners) implemented. Errors are generally handled silently or logged to the console (e.g., invalid JSON imports).

---

# Accessibility

- **Semantic HTML:** Utilizes `<main>`, `<section>`, and `<button type="button">`.
- **Focus States:** Relies entirely on border color changes (`focus:border-neutral-500`). Default browser outlines are disabled (`outline-none`).
- **Keyboard Navigation:** Scroll-based navigation may bypass traditional tab indexing flows, and lack of visual focus rings outside of borders might impact standard accessibility compliance.

---

# Responsive Rules

- **Mobile First:** Uses Tailwind's default mobile-first approach. 
- **Stacking:** Elements stack vertically (`flex-col`, `grid-cols-1`) on mobile and switch to horizontal rows/grids (`sm:flex-row`, `md:grid-cols-3`) on larger screens.
- **Navbar:** Text labels in the bottom navbar are hidden on mobile (`hidden md:inline-block`), showing only icons to preserve space.

---

# Interaction Patterns

- **Hover Elevation:** Cards and inputs feature subtle elevation changes on hover (`transform: translateY(-2px)` and increased shadow opacities via `.liquid-glass:hover` and `.gothic-glow-red-hover:hover`).
- **Destructive Actions:** Clicking a trash icon (e.g., `Trash2`) immediately invokes a native confirmation prompt rather than a soft-delete or custom modal.
- **Scroll Reveal:** Elements smoothly fade and slide up (`y: 40` to `y: 0`) as they enter the viewport using Framer Motion.

---

# Open Questions

- Will a custom modal/dialog system be implemented to replace native browser `confirm()` prompts?
- Should formal error state UIs (like toast notifications) be designed and implemented?
- Are there plans to improve accessibility by restoring standard focus rings or adding explicit ARIA labels?

---

# Related Documents

Architecture

UI Tokens
