# 3-ARCHITECTURE - Design Artifacts

## Purpose
User experience design, wireframes, and component specifications.

## Structure

```
3-ARCHITECTURE/
├── ux/
│   ├── flows/        # User flow diagrams
│   ├── wireframes/   # UI wireframes
│   └── specs/        # Component specifications
└── README.md
```

## UX Specifications

### Module Specs
| Module | File | Status |
|--------|------|--------|
| Settings | ux-design-settings-module.md | Complete |
| Planning (PO) | ux-design-planning-po-module.md | Complete |
| Planning (TO) | ux-design-planning-to-module.md | Complete |
| Planning (WO) | ux-design-planning-wo-spreadsheet.md | Complete |
| Technical | ux-design-technical-module.md | Complete |
| Production | ux-design-production-module.md | Complete |
| Quality | ux-design-quality-module.md | Complete |
| Shipping | ux-design-shipping-module.md | Complete |
| NPD | ux-design-npd-module.md | Complete |

### Pattern Specs
| Pattern | File | Usage |
|---------|------|-------|
| Detail Page | ux-design-detail-page-pattern.md | Entity detail views |
| Modal CRUD | ux-design-modal-crud-pattern.md | Create/Edit modals |
| Shared System | ux-design-shared-system.md | Common components |
| Subroute Strategy | ux-design-subroute-strategy.md | Navigation patterns |

## Design System
- **UI Framework:** shadcn/ui + Tailwind
- **Components:** @apps/frontend/components/ui/
- **Patterns:** @.claude/PATTERNS.md (UI section)

## Workflows
- UX Design: @.claude/agents/planning/UX-DESIGNER.md
- Component specs: Include dimensions, states, interactions

---
*See @.claude/FILE-MAP.md for component locations*
