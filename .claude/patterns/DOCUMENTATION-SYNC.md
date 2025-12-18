# Documentation Sync Protocol

## Purpose

Prevent documentation drift from implementation through proactive, scheduled, and triggered sync mechanisms.

## Sync Triggers

### 1. Sprint Start Check (Scheduled)
**When:** Every sprint start
**Who:** DOC-AUDITOR
**What:** Quick drift detection scan

```
Sprint Start → DOC-AUDITOR scans git changes → Drift Score → Action
```

| Drift Score | Status | Action |
|-------------|--------|--------|
| 0-10% | GREEN | Proceed with sprint |
| 11-25% | YELLOW | Add doc tasks to backlog |
| 26%+ | RED | Prioritize doc sync |

### 2. Code Change Trigger (Event-driven)
**When:** CODE-REVIEWER detects doc-impacting changes
**Who:** CODE-REVIEWER → TECH-WRITER
**What:** Immediate doc update

```
Code Review → Detect: API/Schema/Config change → Flag doc_update_required → TECH-WRITER
```

**Triggers:**
- API endpoints added/modified/removed
- Database schema changed
- Config options added/changed
- Public interfaces modified
- Breaking changes (BLOCKING)

### 3. Periodic Full Audit (Scheduled)
**When:** Every N sprints (configurable, default: 3)
**Who:** DOC-AUDITOR
**What:** Full documentation audit

```yaml
# .claude/config/doc-sync-config.yaml
periodic_audit:
  frequency: 3  # sprints
  depth: deep
  scope: all
  owner: DOC-AUDITOR
  output: docs/reviews/PERIODIC-AUDIT-{date}.md
```

### 4. Release Gate (Event-driven)
**When:** Before any release
**Who:** DOC-AUDITOR
**What:** Pre-release documentation check

```
Release Prep → DOC-AUDITOR pre-release check → PASS/FAIL → Release/Block
```

## Version Tagging

### Document Version Format
```markdown
---
doc_version: 1.2.0
code_version: v2.3.1
last_sync: 2025-12-08
sync_status: current | outdated | needs_review
---
```

### Version Rules

| Situation | Doc Version Change |
|-----------|-------------------|
| Typo/formatting fix | Patch (1.2.x) |
| Content addition | Minor (1.x.0) |
| Major restructure | Major (x.0.0) |
| Breaking API change | Must match code major |

### Sync Status Definitions

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| `current` | Doc matches code | None |
| `outdated` | Code changed, doc not updated | Update doc |
| `needs_review` | Uncertain if current | DOC-AUDITOR review |

## Implementation

### In SPRINT-WORKFLOW
```
Step 1: ORCHESTRATOR Init
Step 1.5: DOC-AUDITOR Sync Check  ← NEW
Step 2: SCRUM-MASTER Planning
```

### In CODE-REVIEWER
```yaml
# Output includes:
doc_update_required: boolean
doc_areas_affected: [api, schema, config, interface]

# If doc_update_required AND approved:
# Parallel handoff to QA-AGENT + TECH-WRITER
```

### In STORY-WORKFLOW
```
... → CODE-REVIEWER → (parallel) → QA-AGENT
                                 → TECH-WRITER (if doc_update)
```

## Drift Detection Algorithm

```python
def calculate_drift_score(last_sprint_end, now):
    """
    Analyze git commits for doc-impacting changes
    """
    changes = {
        'api': count_api_changes(),      # routes, endpoints
        'schema': count_schema_changes(), # migrations, models
        'config': count_config_changes(), # env, settings
        'docs': count_doc_updates()       # docs/ folder
    }

    code_changes = changes['api'] + changes['schema'] + changes['config']
    doc_updates = changes['docs']

    if code_changes == 0:
        return 0  # No drift possible

    # Drift = undocumented changes / total changes
    drift = (code_changes - doc_updates) / code_changes * 100
    return max(0, drift)
```

## Audit Schedule

### Sprint-based Schedule
```
Sprint 1: Start check (quick)
Sprint 2: Start check (quick)
Sprint 3: Start check (quick) + FULL AUDIT
Sprint 4: Start check (quick)
Sprint 5: Start check (quick)
Sprint 6: Start check (quick) + FULL AUDIT
...
```

### Calendar Override
For time-sensitive projects:
```yaml
# .claude/config/doc-sync-config.yaml
calendar_audit:
  enabled: true
  frequency: monthly
  day: 1  # First of month
```

## Quality Gates

### Sprint Start Gate
- [ ] Drift score calculated
- [ ] Doc tasks added if YELLOW/RED
- [ ] SCRUM-MASTER notified

### Code Review Gate
- [ ] Doc impact assessed
- [ ] doc_update_required flag set
- [ ] TECH-WRITER triggered if needed

### Release Gate
- [ ] All docs marked `current`
- [ ] No `outdated` docs for changed features
- [ ] Version tags match release

## Handoff to TECH-WRITER

### From CODE-REVIEWER
```yaml
trigger: code_change_doc_sync
story: "1.3"
areas_affected: ["api"]
changed_files:
  - src/routes/users.ts
  - src/controllers/userController.ts
docs_to_update:
  - docs/api/users.md
priority: normal
```

### From DOC-AUDITOR (Drift)
```yaml
trigger: drift_detected
drift_score: 35
areas:
  - area: api
    changes: 5
    documented: 2
    files: [...]
  - area: schema
    changes: 2
    documented: 0
    files: [...]
priority: high
```

## Metrics

Track in METRICS.md:
```markdown
## Documentation Health

| Sprint | Drift Score | Audit Score | Doc Tasks | Status |
|--------|-------------|-------------|-----------|--------|
| 5 | 8% | 92% | 2 | GREEN |
| 6 | 15% | 88% | 5 | YELLOW |
| 7 | 5% | 95% | 1 | GREEN |

### Trends
- Average drift: 9%
- Audit frequency: Every 3 sprints
- Doc task completion: 94%
```

## Error Recovery

| Situation | Recovery |
|-----------|----------|
| High drift (>25%) | Schedule doc sprint or parallel doc work |
| Missing TECH-WRITER | DOC-AUDITOR creates minimal update, flags for full write |
| Version mismatch | Force sync, update all version tags |
| Audit timeout | Split into smaller scopes, audit incrementally |

## Integration Points

| System | Integration |
|--------|-------------|
| SPRINT-WORKFLOW | Step 1.5 sync check |
| CODE-REVIEWER | doc_update_required output |
| STORY-WORKFLOW | Parallel TECH-WRITER handoff |
| ORCHESTRATOR | Routing for doc updates |
| DOC-AUDITOR | Drift detection, audits |
| TECH-WRITER | Doc updates execution |
