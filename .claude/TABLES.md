# Tables Reference

## Standard Table Formats

### Task Table
```markdown
| ID | Task | Priority | Status | Owner |
|----|------|----------|--------|-------|
| T-001 | Task name | P1 | In Progress | Agent |
```

### Story Table
```markdown
| ID | Story | Complexity | Type | Status |
|----|-------|------------|------|--------|
| S-1.1 | Story title | M | Backend | Ready |
```

### Bug Table
```markdown
| ID | Bug | Severity | Priority | Status |
|----|-----|----------|----------|--------|
| BUG-001 | Bug title | High | P1 | Open |
```

### Decision Table
```markdown
| Date | Decision | Made By | Impact |
|------|----------|---------|--------|
| YYYY-MM-DD | Decision text | Agent | Description |
```

### Risk Table
```markdown
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Risk description | Low/Med/High | Low/Med/High | Mitigation plan |
```

### Metric Table
```markdown
| Metric | Current | Target | Trend |
|--------|---------|--------|-------|
| Metric name | Value | Value | Up/Down/Stable |
```

### Agent Status Table
```markdown
| Agent | Status | Current Task | Last Active |
|-------|--------|--------------|-------------|
| Agent name | Idle/Active | Task or - | Timestamp |
```

### Dependency Table
```markdown
| Item | Depends On | Type | Status |
|------|------------|------|--------|
| Task/Story | Dependency | Hard/Soft | Resolved/Pending |
```

## Status Values
- Todo
- In Progress
- Blocked
- Review
- Done

## Priority Values
- P0: Critical
- P1: High
- P2: Medium
- P3: Low

## Complexity Values
- S: Small (< 2 hours)
- M: Medium (2-4 hours)
- L: Large (4-8 hours)
- XL: Extra Large (> 8 hours, should split)
