# agent.md

# Agent Instructions

You are the implementation agent for this project.

Your primary responsibility is to implement features while following the project's architecture, design system, coding standards, and workflow exactly.

---

# Startup Procedure (Mandatory)

Before performing **any** task, always read the following files in this exact order:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-tokens.md`
4. `context/ui-rules.md`
5. `context/ui-registry.md`
6. `context/code-standards.md`
7. `context/library-docs.md`
8. `context/implementation-roadmap.md`
9. `context/progress-tracker.md`
10. `context/ai-workflow-rules.md`

Do not skip any document.

Always assume these files may have changed since your previous execution.

Never rely on memory.

Always reread them before making any implementation decision.

---

# Source of Truth

These context files are the project's source of truth.

If a request conflicts with them:

* Follow the context files.
* Do not invent architecture.
* Do not create new design systems.
* Do not introduce new coding conventions.
* Do not ignore existing patterns.

---

# Coding Standard

When writing code:

* Follow every rule defined inside `context/code-standards.md`.
* Reuse existing components whenever possible.
* Follow the established folder structure.
* Match existing naming conventions.
* Keep implementations simple.
* Avoid unnecessary abstractions.
* Do not over-engineer.
* Produce production-quality code.
* Prefer readability over cleverness.

---

# UI Rules

Every UI implementation must follow:

* `context/ui-tokens.md`
* `context/ui-rules.md`
* `context/ui-registry.md`

**CRITICAL COMPONENT REUSE RULE:**
* Any custom UI element we create (like LiquidSelect, LiquidNumberInput, custom scrollbars, etc.) MUST be reused everywhere that functionality is needed across the entire application.
* NEVER use default native browser elements (like `<select>`, `<input type="number">` with default arrows, default scrollbars) when a custom "Liquid" equivalent exists. 
* If a custom component needs slight modification to fit a new context, modify the component to accept new props rather than reverting to a native element.

Never invent colors, spacing, typography, or components outside the design system unless explicitly instructed.

---

# Architecture Rules

All implementations must follow `context/architecture.md`.

Do not:

* change architecture
* bypass existing systems
* duplicate functionality
* introduce alternative patterns

without explicit approval.

---

# Workflow

Before implementing:

1. Read every required context document.
2. Understand the requested feature.
3. Identify existing systems that should be reused.
4. Create the smallest implementation that satisfies the request.
5. Verify it follows the project architecture.
6. Update any required progress tracking if instructed.
7. **Context Maintenance (CRITICAL):** Proactively update all relevant `context/*.md` files whenever architectural decisions, data models, or feature sets change to prevent context rot.

---

# Library Usage

When using frameworks, libraries, or APIs:

* Follow `context/library-docs.md`.
* Do not assume APIs from memory if project documentation specifies otherwise.
* Prefer existing project utilities over introducing new dependencies.

---

# Implementation Roadmap

Treat `context/implementation-roadmap.md` as the implementation priority.

Do not build future roadmap items unless explicitly requested.

---

# Progress Tracking

Use `context/progress-tracker.md` to understand project status.

When requested, update progress accurately after implementation.

Never mark incomplete work as complete.

---

# AI Workflow

Follow every rule defined in:

`context/ai-workflow-rules.md`

These rules govern how implementation tasks should be executed.

---

# Code Generation Skill

All code generation should follow the Ponytail coding methodology and conventions.

Use the Ponytail skill as the primary implementation guide:

ponytail

Adhere to its workflow, planning approach, implementation philosophy, and code quality practices whenever they do not conflict with the project's context documents.

If a conflict exists:

1. Project context files take highest priority.
2. Ponytail conventions come second.
3. General best practices come last.

---

# Default Behavior

For every task:

* Read all required context files.
* Think before coding.
* Reuse existing code.
* Keep changes minimal.
* Preserve consistency.
* Avoid unnecessary refactors.
* Write maintainable, production-ready code.
* Never skip the startup procedure.
