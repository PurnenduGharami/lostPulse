# Feature: Time Tracker

**Version:** 1.0
**Status:** Verified
**Owner:** Engineering

---

## Overview

The Time Tracker is the first feature users interact with after the Hero section. It is a visual, interactive 24-hour timeline that serves as a reality check, forcing users to be accountable for how they just spent their time.

## Core Mechanics

- **Bespoke CSS Grid**: We opted against using bulky calendar libraries. The grid is a custom flex layout where 1 hour strictly equals 60px on the Y-axis. This gives complete control over styling, interactions, and performance.
- **Drag-to-Track**: Users click and drag vertically on the timeline to create a block of "Completed" time.
- **Snap to 15**: Dragging snaps to 15-minute intervals to maintain visual tidiness.

## Constraints (The Rules of Accountability)

To ensure the feature functions as an accountability mirror and not a fantasy planner, strict rules are enforced via Javascript validation in `TimeTracker.tsx`:

1.  **No Future Tracking**: A block's `endTime` cannot exceed `Date.now()`. You cannot mark time that hasn't happened.
2.  **No Pre-Registration Tracking**: A block's `startTime` cannot be before `userProfile.createdAt`. You cannot artificially inflate your tracked hours by marking time before you even downloaded the app.

## Data Schema

Stored as a dictionary grouping blocks by date for rapid lookup and scaling:
```typescript
Record<string, TimeBlock[]>
// Example:
// {
//   "2026-07-09": [ { id, title, startTime, endTime, status } ]
// }
```

## Timeline Canvas Layout Rules

To preserve the UI/UX philosophy of "The Timeline is the Product", future edits must adhere to these strict layout constraints:
1. **Separation of Concerns:** The "Grid Entry" (reviewing) and "Live Session" (tracking) modes must remain separated via tabs. Do not mix active session controls into the historical grid.
2. **Canvas Ownership:** The Grid layout consists of a fixed Time Column and a `flex-1` Timeline Canvas. The remaining horizontal space is dead.
3. **Event Ownership:** Activity blocks MUST consume 100% of the available Timeline Canvas width (`left-0 right-4`). They are not floating dashboard cards.
4. **3-Layer Depth Model:** The body of an activity block must be mostly transparent to ensure Layer 1 (Background Image) and Layer 2 (Timeline Grid Lines) are always visible underneath it. Only the top/bottom borders and the Event Header should be highly visible.
