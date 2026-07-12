# UI Registry

**Version:** 1.0

**Status:** Verified

**Last Updated:** 2026-07-09

**Owner:** Engineering

---

## ActiveTracker

**Purpose:** Provides a form and stopwatch mechanism for users to log activities. Displays active time tracking and allows manual submission of past events.
**Location:** `src/components/ActiveTracker.tsx`
**Dependencies:** `lucide-react`, `motion/react`, `../utils.ts`, `../types.ts`
**Props:**
- `onActivityCreated`: Callback when a new activity is saved.
- `blocks`: Array of `TimeBlock` data (used for context or autofill).
**Variants:** N/A (Monolithic feature component)
**Usage:** Rendered within the "Chronology" section of `App.tsx`.
**Related Components:** `ActivityLog`, `BlockCalendar`

---

## ActivityLog

**Purpose:** Displays a chronological, filterable, and searchable list of previously recorded activities. Allows deletion of individual logs.
**Location:** `src/components/ActivityLog.tsx`
**Dependencies:** `lucide-react`, `../utils.ts`, `../types.ts`
**Props:**
- `activities`: Array of `Activity` objects to display.
- `onActivityDeleted`: Callback when a user confirms the deletion of an activity.
**Variants:** N/A
**Usage:** Rendered below `ActiveTracker` in the "Chronology" section of `App.tsx`.
**Related Components:** `ActiveTracker`

---

## AnalyticsPanel

**Purpose:** Visualizes user data over time using charts and heatmaps to demonstrate time expenditure and intentionality trends.
**Location:** `src/components/AnalyticsPanel.tsx`
**Dependencies:** `recharts`, `lucide-react`, `../utils.ts`, `../types.ts`
**Props:**
- `activities`: Array of `Activity` records.
- `blocks`: Array of `TimeBlock` records.
- `journal`: Array of `JournalEntry` records.
- `selectedDate`: String representing the currently selected date context.
- `onDateChange`: Callback to globally update the selected date.
**Variants:** N/A
**Usage:** Rendered in the "Analytics" section of `App.tsx`.
**Related Components:** `ReportsPanel`, `TodayBudget`

---

## BackupSystem

**Purpose:** Manages local data persistence settings. Provides options to export the entire database as JSON or Markdown, and import existing JSON backups.
**Location:** `src/components/BackupSystem.tsx`
**Dependencies:** `lucide-react`, `../utils.ts`
**Props:**
- `onDatabaseRestored`: Callback to trigger a global data reload in `App.tsx` after a successful import.
**Variants:** N/A
**Usage:** Rendered in the "Settings" (Recovery) section of `App.tsx`.
**Related Components:** N/A

---

## BlockCalendar

**Purpose:** Provides a visual scheduling interface to plan "Time Blocks" for specific days, mark them as completed, or delete them.
**Location:** `src/components/BlockCalendar.tsx`
**Dependencies:** `lucide-react`, `../utils.ts`, `../types.ts`
**Props:**
- `dateStr`: Currently selected date string.
- `blocks`: Array of `TimeBlock` records.
- `onBlockCreated`: Callback when a new block is scheduled.
- `onBlockUpdated`: Callback when a block's status changes.
- `onBlockDeleted`: Callback when a block is removed.
**Variants:** N/A
**Usage:** Rendered in the "Calendar" (Architecture) section of `App.tsx`.
**Related Components:** `ActiveTracker`

---

## HeroSection

**Purpose:** Renders the atmospheric, visually striking header at the top of the application, welcoming the user and establishing the thematic tone.
**Location:** `src/components/HeroSection.tsx`
**Dependencies:** `motion/react`, `../types.ts`
**Props:**
- `userProfile`: The user's configuration containing their name and birth date.
**Variants:** N/A
**Usage:** Rendered at the absolute top of the `App.tsx` layout.
**Related Components:** `LifeRemainingCard`

---

## LifeRemainingCard

**Purpose:** Calculates and displays the real-time countdown clock (Years, Days, Hours, Minutes, Seconds) of the user's remaining statistical lifespan.
**Location:** `src/components/LifeRemainingCard.tsx`
**Dependencies:** `../utils.ts`, `../types.ts`
**Props:**
- `userProfile`: Used to extract `birthDate` and `lifespan` limit for calculations.
**Variants:** N/A
**Usage:** Rendered inside the top grid of the "Overview" (Sensors) section in `App.tsx`.
**Related Components:** `PulseScoreCard`, `TodayBudget`

---

## LostTimeCard

**Purpose:** Displays the percentage and raw minutes of untracked ("lost") time for the currently selected date.
**Location:** `src/components/LostTimeCard.tsx`
**Dependencies:** `lucide-react`, `../utils.ts`, `../types.ts`
**Props:**
- `dateStr`: Currently selected date string.
- `activities`: Used to calculate tracked vs untracked minutes.
**Variants:** N/A
**Usage:** Rendered inside the top grid of the "Overview" (Sensors) section in `App.tsx`.
**Related Components:** `TodayBudget`

---

## Onboarding

**Purpose:** The initial screen presented to users lacking a profile. Captures baseline biological data (name, birthday, expected lifespan) needed for core calculations.
**Location:** `src/components/Onboarding.tsx`
**Dependencies:** `lucide-react`, `../types.ts`
**Props:**
- `onComplete`: Callback passing the constructed `UserProfile` back to `App.tsx`.
**Variants:** N/A
**Usage:** Conditionally rendered in `App.tsx` if no `userProfile` exists.
**Related Components:** N/A

---

## PulseScoreCard

**Purpose:** Calculates and visualizes the daily "Pulse Score"—a composite metric representing the user's intentionality and adherence to their planned blocks.
**Location:** `src/components/PulseScoreCard.tsx`
**Dependencies:** `lucide-react`, `../utils.ts`, `../types.ts`
**Props:**
- `dateStr`: Currently selected date string.
- `activities`: Used in score calculation.
- `blocks`: Used in score calculation.
- `journal`: Used in score calculation.
**Variants:** N/A
**Usage:** Rendered inside the top grid of the "Overview" (Sensors) section in `App.tsx`.
**Related Components:** `LostTimeCard`, `TodayBudget`

---

## ReflectionDiary

**Purpose:** Provides a daily journaling interface allowing users to log their mood, what mattered, what was wasted, and how they will improve.
**Location:** `src/components/ReflectionDiary.tsx`
**Dependencies:** `lucide-react`, `../types.ts`
**Props:**
- `dateStr`: Currently selected date string.
- `journal`: Array of existing `JournalEntry` records.
- `onReflectionSaved`: Callback when a new journal entry is submitted.
**Variants:** N/A
**Usage:** Rendered in the "Journal" (Reflection) section of `App.tsx`.
**Related Components:** `PulseScoreCard`

---

## ReportsPanel

**Purpose:** Generates structured, retrospective text/table summaries evaluating the user's progress over daily, weekly, and monthly horizons.
**Location:** `src/components/ReportsPanel.tsx`
**Dependencies:** `lucide-react`, `../utils.ts`, `../types.ts`
**Props:**
- `activities`: Array of `Activity` records.
- `blocks`: Array of `TimeBlock` records.
- `journal`: Array of `JournalEntry` records.
- `selectedDate`: String representing the currently selected date context.
**Variants:** N/A
**Usage:** Rendered in the "Reports" section of `App.tsx`.
**Related Components:** `AnalyticsPanel`

---

## TodayBudget

**Purpose:** Displays a circular progress visualization representing how much of the current day's time budget (1440 minutes) has been actively tracked.
**Location:** `src/components/TodayBudget.tsx`
**Dependencies:** `lucide-react`, `../utils.ts`, `../types.ts`
**Props:**
- `dateStr`: Currently selected date string.
- `activities`: Used to calculate total duration tracked today.
**Variants:** N/A
**Usage:** Rendered inside the top grid of the "Overview" (Sensors) section in `App.tsx`.
**Related Components:** `LostTimeCard`, `PulseScoreCard`

---

# Open Questions

- Should smaller, truly reusable atomic components (e.g., custom Buttons, Inputs, Cards) be abstracted out from the monolithic domain components?
- Are there hidden prop-drilling optimizations that could be solved by moving state into a React Context?

---

# Related Documents

UI Rules

Architecture
