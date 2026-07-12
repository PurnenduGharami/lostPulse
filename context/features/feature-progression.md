# Feature: Progressive Unlocking

**Version:** 1.0
**Status:** Verified
**Owner:** Engineering

---

## Overview

The Feature Progression system ensures that Lost Pulse does not overwhelm the user on day one. By locking advanced tools, we build a gamified loop that uses positive reinforcement to turn tracking into a habit.

## The Roadmap

1.  **Tier 0 (Unlocks Immediately)**: 
    *   **Hero Countdown Section**: A stark reminder of limited time.
    *   **Time Tracker**: Unlocked immediately upon scrolling down from the Hero Section. Teaches accountability.
2.  **Tier 1 (Locked Initial State)**:
    *   **Time Planner**: Allows users to plan future blocks.
    *   *Unlock Condition*: Must track a cumulative total of **12 Hours** in the Time Tracker.

## Visual Rules

*   **Locked State (`LockedFeature.tsx`)**: Rendered with the `.liquid-glass` class. It includes a red progress bar indicating exactly how close the user is to unlocking the feature.
*   **Scroll Snapping**: We utilize `snap-y snap-mandatory` on the main viewport so users intuitively lock into the next feature block below the Hero Section.

## Storage Logic

Progression relies on calculating the cumulative duration of all `TimeBlock` entries stored in `timeBlocks` (`Record<string, TimeBlock[]>`). 

*Future expansion will involve creating a formal `FeatureUnlockState` in `UserProfile`, but dynamically calculating from blocks prevents desynchronization for now.*
