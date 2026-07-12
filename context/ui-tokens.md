# UI Tokens

**Version:** 1.0

**Status:** Verified

**Last Updated:** 2026-07-09

**Owner:** Design

---

# Colors

## Core Palette
- **Background:** `#050505` (Deep Black)
- **Text Default:** `#F0EDE8` (Off-White/Bone)
- **Accent/Brand (Gothic Red):** `#8B0000`
- **Highlight Red:** `#ff2222`

## Activity Category Colors (`CATEGORY_COLORS`)
- **Study:** `#ffffff`
- **Work:** `#d1d1d1`
- **Sleep:** `#7a7a7a`
- **Gaming:** `#a01212`
- **Social:** `#4a4a4a`
- **Other:** `#2a2a2a`

## Severity & Status Colors
- **Excellent / Completed:** `#4ade80` (Green)
- **Good / Equilibrium / Partial:** `#f0ede8` (Off-white)
- **Warning / Degradation:** `#f59e0b` (Amber)
- **Critical / Overdue / Terrible:** `#8B0000` (Dark Red)
- **Neutral / Static Void:** `rgba(240, 237, 232, 0.45)`

## Scrollbar
- **Track:** `#050505`
- **Thumb:** `rgba(255, 255, 255, 0.08)`
- **Thumb Hover:** `#8B0000`

---

# Typography

- **Display (`--font-cinzel`):** "Cinzel", serif (Used for high-impact metrics and titles)
- **Serif (`--font-serif`):** "Marcellus", serif (Used for headings and elegant subtext)
- **Sans (`--font-sans`):** "Inter", ui-sans-serif, system-ui, sans-serif (Standard body and UI text)
- **Mono (`--font-mono`):** "JetBrains Mono", ui-monospace, SFMono-Regular, monospace (Data, numbers, and system logs)

*(Font sizes and weights utilize standard Tailwind CSS utility classes such as `text-xs`, `text-3xl`, `font-medium`, `font-bold`)*

---

# Spacing

The project relies entirely on Tailwind CSS v4 default spacing scales (e.g., `p-4`, `space-y-8`, `gap-6`, `pb-32`). There are no custom spacing tokens defined in the CSS.

---

# Radius

- **Scrollbar Thumb:** `4px`
- **UI Elements:** Relies on standard Tailwind rounded classes (e.g., `rounded-lg`, `rounded-full`, `rounded-[24px]`).

---

# Shadows

## Custom Glass & Glow Classes (`index.css`)
- **Liquid Glass (`.liquid-glass`):**
  - Background: `linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))` with `blur(24px)`
  - Border: `1px solid rgba(255, 255, 255, 0.08)`
  - Normal Shadow: `0 4px 30px rgba(0, 0, 0, 0.8)` with inner white highlights
  - Hover Shadow: `0 10px 40px rgba(0, 0, 0, 0.9)` with increased opacity and `translateY(-2px)`
- **Gothic Glow (`.gothic-glow-red`):**
  - Normal: `0 4px 20px rgba(0, 0, 0, 0.4)`
  - Hover (`.gothic-glow-red-hover:hover`): `0 8px 30px rgba(0, 0, 0, 0.6)`

*(Standard Tailwind shadow utilities like `shadow-md`, `shadow-2xl` are also used)*

---

# Animation

## CSS Transitions
- **Liquid Glass:** `transition: all 0.3s ease`
- **Liquid Glass Hover Transform:** `transform: translateY(-2px)`

## Framer Motion Presets
- **Scroll Reveal (Section entry):**
  - Initial: `{ opacity: 0, y: 40 }`
  - WhileInView: `{ opacity: 1, y: 0 }`
  - Transition: `{ duration: 0.6, ease: "easeOut" }`

*(Standard Tailwind transition utilities like `transition-all duration-300` are heavily used for button hovers)*

---

# Breakpoints

The project relies completely on Tailwind CSS default responsive breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`). No custom breakpoints are defined.

---

# CSS Variables

Defined in `index.css` via the `@theme` directive:
- `--font-cinzel`
- `--font-serif`
- `--font-sans`
- `--font-mono`

---

# Theme Rules

- Tailwind v4 `@theme` block is used to inject custom font families into the utility pipeline.
- The UI is strictly dark-mode. There is no light mode implementation.
- Liquid glass effects (`backdrop-filter: blur(20px) saturate(140%)`) combined with semi-transparent backgrounds (`rgba(20, 20, 22, 0.6)`) form the core visual language of surface containers.

---

# Open Questions

- Are there plans to introduce a formalized design token management system instead of hardcoded hex values in `utils.ts` and `ReflectionDiary.tsx`?
- Will the severity colors be migrated into the Tailwind `@theme` configuration for easier utility class usage?

---

# Related Documents

Architecture

UI Rules
