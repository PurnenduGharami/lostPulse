# LostPulse Design & Layout Rules

These rules MUST be followed in all future runs to ensure the design remains consistent and the layout doesn't break.

## 1. Time Tracker Layout
- **DO NOT** rewrite the `TimeTracker.tsx` component to match the layout in `designs/section 4.png`.
- The user **wants** the 24-hour vertical drag-and-drop grid layout.
- We only use the `designs/` folder as a reference for the **visual style** (colors, contrast, typography), NOT the structural layout of the time tracker itself.

## 2. Colors and Typography
- **No Shadowy or Faded Text:** Use solid, pure colors for readability.
  - Primary text MUST be pure white (`text-white` / `#FFFFFF`).
  - Accents MUST be pure red (`text-red-500` / `#FF0000`).
  - Borders MUST use solid dark colors (`border-[#333333]`, `border-[#222222]`).
- **Avoid Low Opacity:** Do not use `text-neutral-500`, `border-white/10`, or anything that makes the UI look "shadowy" against the dark background.

## 3. Global Background Video & Blur (Backdrop-Filter)
- The background video (`hero4k.mp4`) MUST remain at the root of `App.tsx` (or globally behind the scrolling container).
- The `main` scrolling container MUST be `bg-transparent`.
- **Why?** Chrome has a bug where `backdrop-filter: blur(...)` fails if the element being blurred is trapped inside a scrolling container or layered incorrectly. The global video setup ensures `.liquid-glass` panels blur correctly across the entire app.

## 4. Liquid Glass Aesthetic
- Class: `.liquid-glass`
- Uses a very dark, highly opaque background: `rgba(15, 15, 17, 0.85)`
- Applies a heavy blur: `backdrop-filter: blur(24px) saturate(150%)`
- Ensures sections span `100vw` and `100vh` without leaving empty spaces at the bottom (`flex-1` must be used inside flex columns to fill remaining height).

## 5. Native UI Elements Prohibited & Custom Component Reuse
- **CRITICAL COMPONENT REUSE RULE:** Any custom UI element we create (like `LiquidSelect`, `LiquidNumberInput`, custom scrollbars, etc.) MUST be reused everywhere that functionality is needed across the entire application.
- **NEVER use default native browser elements** (like `<select>`, `<input type="number">` with default spinner arrows, default scrollbars) when a custom "Liquid" equivalent exists. They render with the OS/Browser default styling which ruins the dark Liquid Glass theme.
- **ALWAYS use `<LiquidSelect>`** for dropdowns, and **`<LiquidNumberInput>`** for number spinners.
- If a custom component needs slight modification to fit a new context, modify the component to accept new props rather than reverting to a native element.
- This rule applies to any native input element that cannot be fully styled with CSS across browsers. If it looks like 'lame mode' native UI, it must be replaced with a custom Liquid component.

## 6. Time Block Display Rules
- **Short Entries (< 1 Hour):** Must NOT display text. Instead, display a dotted line in the center of the block to indicate an entry exists.
- **Hover Effects:** All entries must have a scale hover effect (\hover:scale-[1.01]\) for better interaction feel.
- **Large Empty Blocks:** If a block has no description and is large, render the title a second time as a large, low-opacity (e.g. \opacity-[0.03]\) watermark in the background to prevent it from looking like empty white space.

## 7. Daily Notes Rules
- **Purpose:** Provide a small space in the Daily Statistics panel to write short daily reflections.
- **Constraints:** Max 7 entries per day, Max 250 characters per entry. It is a time tracker, not a note-taker.
