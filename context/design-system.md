# Design System

**Version:** 1.0
**Status:** Verified
**Owner:** Design Team

---

## Core Directive: USE THE DESIGNS FOLDER

**CRITICAL INSTRUCTION:** When working on UI/UX changes, you MUST refer to the `designs/` folder in the root directory for exact mockups.
- **Do not invent colors.**
- **Do not guess opacities or layouts.**
- The user demands 100% adherence to the visual styles shown in those images.

## Liquid Glass Aesthetic

The application uses a highly opaque "liquid glass" style. It is NOT a perfectly transparent frosted blur.
- **Background**: `rgba(15, 15, 17, 0.85)` (Very dark, highly opaque)
- **Blur**: `blur(24px) saturate(150%)`
- **Typography**: High contrast. Use `text-white`, `text-red-500`, and `font-bold` for important metrics so they pop.

## Layout

Sections below the Hero Video MUST take exactly `100vw` and `100vh`. They should stretch strictly edge-to-edge with no external margins, ensuring the UI completely covers the viewport while allowing the hero video to faintly bleed through the heavy liquid-glass background.
