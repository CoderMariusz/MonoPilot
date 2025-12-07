# Memory Bank Pattern

## Overview

The Memory Bank is a persistent context system inspired by Cline's Memory Bank concept. It solves the fundamental challenge of LLM agents: **context loss between sessions**.

### Why Memory Bank Matters

1. **Session Continuity**: Agents lose all context when a session ends. Memory Bank provides persistent storage that survives across sessions.

2. **Reduced Re-discovery**: Without persistent memory, agents waste tokens re-analyzing the same codebase, re-learning patterns, and re-solving problems.

3. **Decision Traceability**: Captures the "why" behind decisions, not just the "what". Critical for long-running projects.

4. **Knowledge Accumulation**: Project-specific learnings compound over time, making agents more effective.

### Core Principle

> "Every session, assume complete amnesia. Memory Bank is your only link to the past."

---

## Structure

Memory Bank lives in `.claude/state/memory-bank/` with four core files:

```
.claude/state/memory-bank/
  project-context.md    # What this project is (static-ish)
  decisions.md          # Why things are the way they are
  patterns-learned.md   # How to do things in this project
  blockers-resolved.md  # Solutions to problems encountered
```

### File Purposes

| File | Updates | Primary Use |
|------|---------|-------------|
| `project-context.md` | Rarely | Session start - understand project |
| `decisions.md` | After key decisions | Justify current state |
| `patterns-learned.md` | As patterns emerge | Guide implementation |
| `blockers-resolved.md` | After solving issues | Prevent re-solving |

---

## Update Protocol

### When to Update

**project-context.md:**
- Initial project setup
- Major tech stack changes
- New major component added
- Architecture shift

**decisions.md:**
- Any non-trivial technical decision
- When choosing between alternatives
- When deviating from standard patterns
- User explicitly requests documentation

**patterns-learned.md:**
- New project-specific pattern discovered
- Anti-pattern identified
- Existing pattern refined

**blockers-resolved.md:**
- Non-obvious problem solved
- Error required debugging
- Solution might be forgotten

### How to Update

1. **Append, don't replace**: Add new entries at the top (most recent first)
2. **Date everything**: Always include timestamp
3. **Attribute source**: Note which agent or user made the update
4. **Keep it concise**: Memory Bank should be scannable
5. **Cross-reference**: Link to related files when relevant

### Update Format

```markdown
### {YYYY-MM-DD} - {Title}
**Context:** {Brief background}
**Content:** {The actual information}
**Source:** {Agent name or "User"}
```

---

## Agent Integration

### Session Start Protocol

Every agent session should begin by reading Memory Bank:

```
1. Read project-context.md (understand what project is)
2. Scan decisions.md (understand current state rationale)
3. Check patterns-learned.md (know how to implement)
4. Review blockers-resolved.md if hitting issues
```

### During Session

- **Before major decisions**: Check if similar decision exists
- **Before implementing**: Check patterns-learned.md
- **When stuck**: Check blockers-resolved.md
- **After solving non-trivial problem**: Update appropriate file

### Session End Protocol

Before ending significant sessions:

```
1. Were any decisions made? -> Update decisions.md
2. Did I discover a pattern? -> Update patterns-learned.md
3. Did I solve a tricky problem? -> Update blockers-resolved.md
4. Did project structure change? -> Update project-context.md
```

---

## Templates

### Decision Entry

```markdown
### {date} - {decision title}
**Context:** {why this decision was needed}
**Decision:** {what was decided}
**Rationale:** {why this choice over alternatives}
**Alternatives:** {what else was considered}
**Impact:** {files/areas affected}
**Made by:** {agent/user}
```

### Pattern Entry

```markdown
### {Pattern Name}
**Use when:** {situation}
**Example:**
```{language}
{code example}
```
**Files using this:** {list}
**Discovered:** {date}
```

### Blocker Entry

```markdown
### {date} - {issue title}
**Problem:** {what went wrong}
**Root Cause:** {why it happened}
**Solution:** {how it was fixed}
**Prevention:** {how to avoid in future}
**Related files:** {list}
```

---

## Best Practices

### Do

1. **Update immediately**: Don't wait until session end - you might forget
2. **Be specific**: Include file paths, exact error messages, concrete examples
3. **Date everything**: Enables tracking decision evolution
4. **Keep entries atomic**: One decision/pattern/blocker per entry
5. **Use consistent formatting**: Makes scanning easier
6. **Cross-reference**: Link related entries across files

### Read Strategically

- **Full read**: Only at session start
- **Targeted read**: When facing specific issue
- **Skim headers**: When checking if something exists

### Prune Periodically

- Archive obsolete decisions (mark as superseded)
- Remove patterns that became standard
- Keep blockers that might recur

---

## Anti-Patterns

### Avoid These

| Anti-Pattern | Problem | Instead Do |
|--------------|---------|------------|
| **Never updating** | Memory Bank becomes useless | Update after each significant action |
| **Over-updating** | Noise drowns signal | Only record non-obvious information |
| **Vague entries** | "Fixed the bug" | Include specifics: error, cause, solution |
| **No dates** | Can't track evolution | Always timestamp entries |
| **Duplicate info** | Wastes space, creates conflicts | Cross-reference instead |
| **Forgetting to read** | Agents repeat mistakes | Always read at session start |
| **Treating as docs** | Wrong purpose | Memory Bank is operational, not documentation |

### Memory Bank is NOT

- **Documentation**: Docs explain to humans, Memory Bank helps agents
- **Git history**: Not a replacement for commits
- **Task tracking**: Use TASK-QUEUE.md for that
- **Meeting notes**: Only extract actionable decisions

---

## Integration with Other State Files

| File | Relationship |
|------|--------------|
| `AGENT-STATE.md` | Current session state (ephemeral) |
| `TASK-QUEUE.md` | What to do (changes constantly) |
| `DECISION-LOG.md` | Formal decisions (may overlap with decisions.md) |
| `memory-bank/*` | Persistent knowledge (accumulates) |

Memory Bank complements, not replaces, other state files.

---

## Bootstrapping New Projects

For new projects, initialize Memory Bank with:

1. Run `analyze-project.sh` to auto-fill `project-context.md`
2. Create empty `decisions.md` with template
3. Create empty `patterns-learned.md` with template
4. Create empty `blockers-resolved.md` with template

As project evolves, Memory Bank naturally fills with valuable context.

---

*Pattern version: 1.0*
*Inspired by: Cline Memory Bank*
*Created: 2025-12-05*
