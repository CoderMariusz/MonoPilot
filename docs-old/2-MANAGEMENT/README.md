# 2-MANAGEMENT - Project Management

## Purpose
Epic planning, sprint tracking, and project execution documentation.

## Structure

```
2-MANAGEMENT/
├── epics/
│   ├── current/      # Active epics (5-9)
│   └── completed/    # Done epics (1-4)
├── sprints/
│   ├── sprint-status.yaml  # Active tracking
│   └── *.md                # Sprint artifacts
└── README.md
```

## Quick Links

### Active Epics
| Epic | Name | Status | Stories |
|------|------|--------|---------|
| 5 | Warehouse Core | Ready | @current/05-warehouse.md |
| 6 | Quality | Backlog | @current/06-quality.md |
| 7 | Shipping | Backlog | @current/07-shipping.md |
| 8 | NPD | Backlog | @current/08-npd.md |
| 9 | Performance | Backlog | @current/09-performance-optimization.md |

### Completed Epics
| Epic | Name | Completion |
|------|------|------------|
| 1 | Settings & Auth | 100% |
| 2 | Technical Module | 100% |
| 3 | Planning Module | 100% |
| 4 | Production | 95% |

### Sprint Tracking
- **Current:** `sprints/sprint-status.yaml`
- **Format:** YAML with per-story status
- **Statuses:** backlog → drafted → ready-for-dev → in-progress → review → done

## Workflows
- Epic creation: @.claude/agents/planning/ARCHITECT-AGENT.md
- Sprint planning: @.claude/agents/planning/SCRUM-MASTER.md
- Story breakdown: @.claude/workflows/EPIC-WORKFLOW.md

---
*See @PROJECT-STATE.md for current sprint status*
