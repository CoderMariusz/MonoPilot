# Patterns

## Overview
Common patterns used across the agent methodology.

## Code Patterns

### Naming Conventions
- Files: `kebab-case.md`
- Agents: `UPPER-CASE.md`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### File Organization
```
component/
  ├── index.ts          # Main export
  ├── component.ts      # Implementation
  ├── component.test.ts # Tests
  ├── types.ts          # Types
  └── utils.ts          # Utilities
```

## Documentation Patterns

### Markdown Headers
```markdown
# Title (H1) - One per document
## Section (H2)
### Subsection (H3)
```

### Tables
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Data | Data |
```

### Checklists
```markdown
- [ ] Todo item
- [x] Completed item
```

## Communication Patterns

### Status Updates
```markdown
**Status:** {In Progress | Blocked | Complete}
**Progress:** {X}%
**Next:** {next action}
```

### Handoff Format
```markdown
From: {agent}
To: {agent}
Artifact: {what}
Context: {summary}
```

## Reference
See `.claude/patterns/` for detailed pattern documentation.
