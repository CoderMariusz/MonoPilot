# 4-DEVELOPMENT - Active Development

## Purpose
Active batch implementation, stories, and technical specifications.

## Structure

```
4-DEVELOPMENT/
├── batches/
│   └── active/           # Currently being developed
│       ├── 04A-1-*/      # Epic 4 batches
│       ├── 04B-*/
│       ├── 04C-*/
│       ├── 05A-*/        # Epic 5 batches
│       ├── 05B-*/
│       ├── 05C-*/
│       ├── 06A-*/        # Epic 6 batches
│       ├── 06B-*/
│       └── 06C-*/
└── README.md
```

## Active Batches

### Epic 4: Production (95% Complete)
| Batch | Name | Stories | Status |
|-------|------|---------|--------|
| 04A-1 | WO Lifecycle | 4.1-4.6 | Done |
| 04A-2 | Material Reservation | 4.7-4.8 | Done |
| 04B-1 | Consumption | 4.9-4.11 | Done |
| 04B-2 | Output Registration | 4.12-4.16 | Done |
| 04C-1 | Config & Traceability | 4.17-4.20 | In Progress |

### Epic 5: Warehouse (Ready for Dev)
| Batch | Name | Stories | Status |
|-------|------|---------|--------|
| 05A-1 | LP Core | 5.1-5.4 | Ready |
| 05A-2 | LP Operations | 5.5-5.7 | Ready |
| 05A-3 | Receiving | 5.8-5.13 | Ready |
| 05B-1 | Stock Moves | 5.14-5.18 | Ready |
| 05B-2 | Pallets | 5.19-5.22 | Ready |
| 05C-1 | Scanner Core | 5.23-5.27 | Ready |
| 05C-2 | Traceability Workflows | 5.28-5.35 | Ready |
| 05C-3 | Offline Queue | 5.36 | Ready |

### Epic 6: Quality (Backlog)
| Batch | Name | Stories | Status |
|-------|------|---------|--------|
| 06A-1 | QA Status | 6.1-6.5 | Backlog |
| 06A-2 | Quality Holds | 6.6-6.9 | Backlog |
| 06B-1 | Specifications | 6.10-6.14 | Backlog |
| 06B-2 | NCR | 6.15-6.18 | Backlog |
| 06C-1 | COA | 6.19-6.21 | Backlog |
| 06C-2 | Reporting | 6.22-6.24 | Backlog |
| 06C-3 | Config | 6.25 | Backlog |

## Batch Structure
Each batch contains:
```
batch-name/
├── tech-spec.md          # Technical specification
├── stories/
│   ├── X.Y-story-name.md # Story definition
│   └── context/
│       └── X.Y.context.xml # AI context file
```

## Workflows
- Story implementation: @.claude/workflows/STORY-WORKFLOW.md
- Dev workflow: @.claude/workflows/DEVELOPMENT-FLOW.md
- Sprint status: @docs/2-MANAGEMENT/sprints/sprint-status.yaml

---
*See @.claude/FILE-MAP.md for code locations*
