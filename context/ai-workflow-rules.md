# AI Workflow Rules

**Version:** 1.0

**Status:** Verified

**Last Updated:** 2026-07-09

**Owner:** Core

---

# Required Reading

Before initiating any task, an AI agent MUST read context in the following strict order:
1. `documentation-protocol.md` (The rules of engagement)
2. `file-ownership.md` (The boundary definitions)
3. `Dependency-Graph.md` (The creation and reading hierarchy)
4. `VerificationChecklists.md` (The quality criteria)
5. `document-schemas.md` (The structural templates)
6. Any target-specific dependencies mandated by the Dependency Graph or the user's prompt.

If any required dependency is missing: STOP immediately. Do not infer or invent the missing context.

---

# Planning Rules

- **Discovery First:** Never write code or documentation immediately. Reverse engineer the project state first. Trace imports, components, utilities, and dependencies.
- **Mapping:** Build an internal understanding of responsibilities, boundaries, and relationships.
- **Reality Over Assumptions:** Base all plans on the *actual* codebase state (verified via search or file reads), never on assumed best practices or generalized knowledge.

---

# Documentation Rules

- **Strict Schema Adherence:** Every context document MUST perfectly align with its definition in `document-schemas.md`.
- **Single Ownership:** Every fact has exactly ONE owner (as defined in `file-ownership.md`). If a fact belongs to another document, *reference it*; never duplicate it.
- **No Hallucinations:** Document reality. Never invent features, rename concepts, or outline aspirational architecture. If something cannot be verified, place it in the "Open Questions" section.
- **One Task, One Document:** Generate or update only one document per execution phase, then wait for explicit user instruction to proceed.

---

# Implementation Rules

- **UI & Aesthetics:** Before implementing UI components, agents MUST read `ui-tokens.md` and `ui-rules.md`. Adhere strictly to the defined Tailwind v4 `@theme` tokens and gothic design language (`.liquid-glass`, red accents).
- **Architecture Compliance:** All new code must adhere to `architecture.md` and `code-standards.md`. (e.g., using `utils.ts` for storage abstraction instead of calling native APIs directly from React).
- **Library Compliance:** Adhere to constraints in `library-docs.md` (e.g., no class components in React, no vanilla CSS beyond core tokens, respect Electron IPC boundaries).

---

# Verification Rules

Before finalizing any task or document, agents must execute a rigorous internal quality check:
- **Verification Question:** For every statement made, ask: *"Can this be definitively verified from the project files?"* If NO, investigate further, remove it, or move it to Open Questions.
- **Checklist Execution:** Run the Universal Checklist, the File Specific Checklist, Ownership Audit, Dependency Validation, and Conflict Resolution.
- **Failure Protocol:** If any check fails, do not proceed. Return to the verification phase and correct the discrepancy.

---

# Scope Boundaries

- **Focus:** Do not attempt to refactor out-of-scope files or "clean up" adjacent code unless explicitly instructed.
- **No Inventions:** Do not redesign the architecture or simplify behavior for the sake of convenience.
- **Memory Purge:** Focus exclusively on the active project directory (`lost-pulse`). Ensure unrelated contextual memories from prior generic tasks do not bleed into project-specific outputs.

---

# Escalation Protocol

- **Missing Dependencies:** If a required file or dependency is absent, STOP. Explain to the user exactly what is missing and why it is required. Do not continue execution.
- **Contradictions:** If two context documents or a document and the codebase contradict each other, pause and ask the user for clarification. Do not silently choose one over the other.

---

# Completion Rules

- **Status Assignment:** Every context document must be assigned a status: `Draft`, `Verified`, or `Authoritative`.
- **Validation:** Ensure no duplicated knowledge exists across the context framework.
- **Output:** Deliver exactly what was requested (one document) and explicitly state that the task is finished.
- **Wait:** After outputting the artifact, stop and await the next prompt. Do not chain tasks autonomously without permission.

---

# Context Updates

- Whenever a new feature is successfully implemented and merged, the `progress-tracker.md` MUST be updated.
- If architectural components change, the relevant context documents (e.g., `architecture.md`, `ui-registry.md`) must be flagged or updated immediately to prevent context rot.

---

# Open Questions

*(No open questions regarding AI Workflow Rules at this time).*

---

# Related Documents

Documentation Protocol

File Ownership

Verification Checklists
