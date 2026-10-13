# Project Overview

**Version:** 1.0

**Status:** Verified

**Last Updated:** 2026-07-09

**Owner:** Product

---

# About

Lost Pulse is a personal life and time-tracking application designed to measure daily activities against a user's total estimated lifespan. It functions as a local-first, single-page application that tracks time, schedules events, and encourages reflection.

---

# Problem

People often lose track of how they spend their time and fail to realize the limited nature of their lifespan. There is a lack of intentionality in daily activities and no easy way to visualize "lost time" or how daily actions align with personal values.

---

# Goals

- Provide a real-time visualization of remaining lifespan.
- Track daily activities and time blocks.
- Calculate an intentionality score ("Pulse Score").
- Offer insights into time expenditure through analytics and reports.
- Enable daily journaling and reflection.
- Maintain data privacy through a local-first architecture.

---

# Non Goals

- Cloud-based synchronization (data is stored locally).
- Social sharing or multiplayer capabilities.
- Complex project management or team collaboration.

---

# Users

- Individuals seeking to improve their time management.
- People interested in quantified self and life optimization.
- Users who want to increase intentionality in their daily lives.

---

# Features

- **Onboarding:** Captures user profile and expected lifespan.
- **Dashboard Overview:** Displays today's time budget, Pulse Score, remaining life capacity, and lost time.
- **Activity Tracking:** Allows users to log activities and track time spent.
- **Time Blocking:** Calendar interface for scheduling time blocks.
- **Journaling:** Reflection diary for daily entries.
- **Analytics:** Charts and daily grids visualizing time expenditure.
- **Reports:** Daily, weekly, and monthly retrospective reviews.
- **Backup & Recovery:** Local data export/import (JSON/Markdown).

---

# Pages

The application is a Single Page Application (SPA). It uses scrollable sections instead of distinct pages.

- **Onboarding Screen:** Collects initial user data (lifespan, etc.). Replaced by the main dashboard once completed.
- **Main Dashboard (SPA):**
  - **Overview (Sensors):** High-level metrics and life countdown.
  - **Activity (Chronology):** Active tracking and historical logs.
  - **Calendar (Architecture):** Time block scheduling.
  - **Journal (Reflection):** Diary entries.
  - **Analytics:** Data visualization.
  - **Reports:** Retrospective summaries.
  - **Settings (Recovery):** Backup and reset options.

---

# Navigation

- **Scroll-based Navigation:** Users can scroll vertically through all sections.
- **Bottom Navbar:** A fixed, professional navbar containing icons for Overview, Activity, Calendar, Journal, Analytics, Reports, and Settings. Clicking an icon smoothly scrolls to the respective section.
- **Date Selector:** A horizontal timeline to filter data by specific dates.

---

# User Journey

1. **First Launch:** The user is presented with the Onboarding screen to enter their profile (lifespan).
2. **Daily Usage:** The user opens the app and sees the Hero Section and Dashboard Overview for the current date.
3. **Tracking & Scheduling:** The user logs activities in the Activity section and schedules future blocks in the Calendar.
4. **Reflection:** At the end of the day, the user writes in the Journal.
5. **Review:** The user checks Analytics and Reports to understand their time expenditure.
6. **Data Management:** The user periodically exports backups via the Settings section.

---

# Product Terminology

- **Lost Pulse:** The name of the application.
- **Pulse Score:** An intentionality score calculated based on activities, blocks, and journal entries.
- **Life Limit / Lifespan:** The user's total expected lifespan in years, used to calculate remaining time.
- **Time Block:** A scheduled period of time for a specific activity.
- **Activity:** A logged action or event that consumes time.
- **Journal Entry:** A daily written reflection.

---

# Assumptions

- The application is intended to run as a desktop app via Electron, a mobile app (APK) via Capacitor, or in the browser via Vite.
- All user data is stored locally.

---

# Open Questions

- Does the application intend to support cloud backups or third-party integrations in the future?
- What specific formula is used to calculate the "Pulse Score"?

---

# Related Documents

Architecture

Implementation Roadmap
