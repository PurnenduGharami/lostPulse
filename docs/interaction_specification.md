# LostPulse Interaction Specification

## Purpose
This document acts as the definitive single source of truth for user interactions within the LostPulse application. By strictly adhering to these rules, we prevent UX inconsistencies and significantly reduce state-management bugs as the application scales.

---

## 1. Mouse Interactions (Time Blocks)

### Click
- **Behavior**: Places keyboard focus (`tabIndex=0`) on the selected block and reveals inline quick-action buttons (Edit/Delete) via CSS group-hover/focus states.
- **Rules**: Clicking *never* directly opens modals or forms. It strictly serves to highlight and focus the entity.

### Double-Click
- **Behavior**: Immediately opens the Edit Modal for the targeted time block.
- **Rules**: Serves as the primary mouse-driven method for opening detailed modification forms.

### Right-Click
- **Behavior**: Intercepts and prevents the native browser context menu, opening a custom "Liquid Glass" Context Menu positioned precisely at the cursor coordinates.
- **Options**:
  - **Edit**: Opens the Edit Modal.
  - **Duplicate**: Clones the block, shifting the start time of the new block to precisely match the end time of the original block.
  - **Delete**: Triggers the global deletion flow.

---

## 2. Dragging and Resizing

### Dragging on Grid (Empty Space)
- **Behavior**: Clicking and dragging vertically on the timeline grid paints a new time block.
- **Rules**: 
  - The dragged preview dynamically snaps to 15-minute intervals.
  - Releasing the mouse button (MouseUp) instantly creates the block and saves it to the global state.

### Dragging Existing Blocks (Moving)
- **Behavior**: *Currently strictly prohibited.*
- **Rules**: Blocks cannot be dragged to new times. They are locked in place. All time shifting must occur explicitly via the Edit Modal.

### Resizing Entries
- **Behavior**: *Currently strictly prohibited.*
- **Rules**: Users cannot pull the edges (top/bottom) of a block to change its duration. Time modifications must be made explicitly via the Edit Modal.

---

## 3. Data Integrity & Overlaps

### Overlap Prevention
- **Behavior**: Time blocks are strictly forbidden from overlapping one another. 
- **Rules**:
  - Every save/update action routes through the pure functions `hasOverlap` and `checkLiveSessionCollision` located in `src/utils.ts`.
  - If a collision is detected during creation, editing, or dragging, the action is rejected entirely.
  - The UI responds with a non-intrusive red toast notification (animate-pulse) alerting the user to the collision.

---

## 4. Keyboard Shortcuts & Accessibility

### Prioritization Hierarchy
Local element shortcuts supersede global application shortcuts to ensure focus-based actions behave predictably.

### Global Shortcuts (Window Level)
Handled globally, but intentionally suppressed if the user's `document.activeElement` is an `input` or `textarea`.
- **Ctrl+Z / Cmd+Z**: Undo the last state mutation (reverts `timeBlocks` to the previous history snapshot).
- **Ctrl+Y / Cmd+Shift+Z**: Redo the previously undone mutation.

### Local Shortcuts (Element Level)
Triggered explicitly when a Time Block holds focus.
- **Enter**: Maps to Double-Click (Opens Edit Modal).
- **Delete / Backspace**: Triggers the deletion flow.

---

## 5. Application State & Navigation

### Switching Dates During an Active Session
- **Behavior**: The Live Session is managed globally and persists seamlessly.
- **Rules**: Navigating backward or forward in time via the Retrospective Grid or Time Journal does *not* interrupt, pause, or lose the active Live Session timer. The user can safely browse past days while currently tracking.

### Unsaved Edits
- **Modals / Forms (Cancel Button)**: If a user has dirtied the form state (modified any value from its original prop state) and attempts to close the modal via "Cancel" or background click, a strict `window.confirm` prompt will intercept the action: *"You have unsaved changes. Discard them?"*.
- **Browser Close / Refresh**: If the user forcefully closes the browser tab while a modal is open with unsaved edits, those edits are *discarded*. There is no aggressive local drafting/autosave for partial modal forms to prevent corrupt or incomplete state recovery.

### View Synchronization
- **Behavior**: All views (Grid, Journal, Live Session, Statistics) remain instantly and perfectly synchronized.
- **Rules**: No component maintains its own local copy of business data. All components consume the exact same `timeBlocks` state passed down from the root `App.tsx`. Mutating data through `blockActions` triggers a top-down re-render, ensuring a single unbreakable source of truth.
