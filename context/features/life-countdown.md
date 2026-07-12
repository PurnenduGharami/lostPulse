# Feature: Life Countdown

**Version:** 1.0
**Status:** Verified
**Owner:** Engineering

---

## Overview

The Life Countdown is the primary atmospheric and mathematical feature of the Lost Pulse application. It provides a visceral, real-time visualization of the user's remaining lifespan, calculating exact years, days, hours, minutes, and seconds based on their biological baseline.

## Component Hierarchy

- `App.tsx` (Global State & Clock Driver)
  - `Onboarding.tsx` (Data Capture)
  - `LifeRemainingCard.tsx` (Visualization)

## State Management

### Data Contract
The feature relies on the `UserProfile` object:
```typescript
interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  targetLifespan: number; // in years
}
```

### Real-time Tick
Instead of having the card manage its own interval (which could cause performance issues if multiple sensors need time), `App.tsx` maintains a global 1-second `setInterval` loop that updates a `tick` state. This `tick` is passed down as a prop to `LifeRemainingCard`, forcing it to re-render and re-calculate the remaining time exactly once per second.

## Mathematical Engine

Located in `src/utils.ts` (`calculateLifeRemaining`):

1. **Base Conversion:** Converts `birthDate` and `targetLifespan` into absolute Unix timestamps (milliseconds).
2. **Delta:** Subtracts the current time (`Date.now()`) from the calculated `endTime`.
3. **Extraction:** Uses modulo math to extract discrete units (years based on 365.25 days, days, hours, etc.).
4. **Percentage:** Calculates the exact float percentage of life remaining (`(remainingMs / totalMs) * 100`).

## UI/UX Rules Applied

- **Styling:** Utilizes the `.liquid-glass` CSS class for the container and `#8B0000` (Gothic Red) for the primary text elements.
- **Typography:** Uses `--font-mono` for all numbers to prevent horizontal jittering as seconds tick down.
- **Animation:** The progress bar utilizes a CSS transition (`transition-all duration-1000 ease-linear`) so that it smoothly advances each second.

## Storage

The `UserProfile` is saved via IPC to the native OS filesystem in Electron (`profile.json`) or to `localStorage` when running in the browser fallback mode.
