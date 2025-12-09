# Decision Log

Persistent record of important decisions made during project development.

> **Purpose:** Capture the "why" behind decisions so future sessions understand the rationale, not just the outcome.

---

## How to Use This File

**Reading:**
- Scan headers to find relevant decisions
- Most recent decisions are at the top
- Check before making similar decisions

**Writing:**
- Add new decisions at the top (below this section)
- Use the template provided at the bottom
- Be specific about alternatives considered

---

## Recent Decisions

{New decisions go here - most recent first}

<!--
### 2025-XX-XX - Example Decision Title
**Context:** Why this decision was needed
**Decision:** What was decided
**Rationale:** Why this choice over alternatives
**Alternatives:**
- Option A: {description} - rejected because {reason}
- Option B: {description} - rejected because {reason}
**Impact:** Files/areas affected
**Made by:** {agent name or "User"}
-->

---

## Decision Template

Copy this template when adding new decisions:

```markdown
### {YYYY-MM-DD} - {Decision Title}
**Context:** {Why this decision was needed - what problem or question arose?}
**Decision:** {What was decided - be specific}
**Rationale:** {Why this choice? What factors influenced it?}
**Alternatives:**
- {Option A}: {description} - rejected because {reason}
- {Option B}: {description} - rejected because {reason}
**Impact:** {Which files, components, or areas are affected?}
**Made by:** {Agent name (e.g., ARCHITECT-AGENT) or "User"}
```

---

## Decision Categories

Use these tags in decision titles for easier scanning:

- `[ARCH]` - Architecture decisions
- `[TECH]` - Technology/library choices
- `[API]` - API design decisions
- `[DB]` - Database design decisions
- `[SEC]` - Security-related decisions
- `[PERF]` - Performance-related decisions
- `[PROC]` - Process/workflow decisions

---

*File created: 2025-12-05*
*Purpose: Persistent decision memory across sessions*
