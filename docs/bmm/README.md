# BMad Method Documentation

This directory contains all BMad Method (BMM) artifacts and documentation for the MonoPilot project.

**Project**: MonoPilot (Unreal) - Manufacturing Execution System  
**Type**: Brownfield (Active Development)  
**Initialized**: 2025-01-11

---

## 📁 Directory Structure

```
docs/bmm/
├── README.md                    # This file
├── .bmad-status.yaml            # Project status & metrics
├── artifacts/                   # BMM Artifacts
│   └── tech-spec.md            # Technical Specification (BROWNFIELD)
├── epics/                       # Epic Plans (future)
└── sessions/                    # Workflow Session Logs
    └── 2025-01-11-brainstorm-init.md
```

---

## 🎯 Current Status

**Phase**: Document-Project (Completed)  
**Next**: Plan Epic "BOM Complexity v2"

### Workflows Completed

1. ✅ **workflow-init** - Project initialization and configuration
2. ✅ **brainstorm** - Strategic planning and prioritization
3. ✅ **document-project** - Comprehensive brownfield documentation

### Workflows Pending

1. ⏳ **plan-epic** - "BOM Complexity v2" (Priority 1)
2. ⏳ **plan-epic** - "Traceability & Compliance" (Priority 2)
3. ⏳ **implement** - Feature development

---

## 📚 Key Documents

### 1. Technical Specification

**File**: `artifacts/tech-spec.md`  
**Purpose**: Comprehensive brownfield documentation

**Contents**:
- Architecture overview (Next.js + Supabase)
- Database schema (34 tables, 44 migrations)
- API patterns (20+ modules)
- Component inventory (60+ components)
- Data flow diagrams
- Known issues & technical debt
- Planned features (BOM Complexity, Traceability)

### 2. Brainstorm Session

**File**: `sessions/2025-01-11-brainstorm-init.md`  
**Purpose**: Strategic planning outcomes

**Key Decisions**:
- **Top Priority 1**: BOM Complexity Enhancement
  - By-products support
  - Multi-version BOMs
  - Conditional components

- **Top Priority 2**: Traceability System
  - LP genealogy
  - Batch tracking
  - Recall reports

### 3. Status Tracking

**File**: `.bmad-status.yaml`  
**Purpose**: Machine-readable project status

**Metrics**:
- 34 database tables
- 44 migrations
- 60+ React components
- ~50,000 lines of code
- ~60% test coverage

---

## 🗺️ Roadmap

### Phase 1: BOM Complexity Enhancement (4-6 weeks)

**Epic**: "BOM Complexity v2"

**Features**:
1. By-products support (`wo_by_products` table)
2. Multi-version BOM (effective dates)
3. Conditional components (JSONB rules)

**Success Criteria**:
- ✅ Multiple outputs per WO
- ✅ BOM versioning working
- ✅ All tests green
- ✅ Query performance < 500ms

### Phase 2: Traceability System (3-4 weeks)

**Epic**: "Traceability & Compliance"

**Features**:
1. LP genealogy recursive queries
2. Batch tracking across production stages
3. Recall reports (FDA/USDA compliance)

**Success Criteria**:
- ✅ Recall query < 2 seconds
- ✅ Full batch trace working
- ✅ Compliance dashboard functional

### Phase 3: Scanner Integration (6-8 weeks)

**Epic**: "Scanner Integration & Real-time Sync"

**Features**:
1. Scanner HTTP API endpoints
2. WebSocket real-time sync
3. Offline mode with conflict resolution

### Phase 4: Status Workflow Guards (2-3 weeks)

**Epic**: "Workflow Governance"

**Features**:
1. Status transition validation triggers
2. Audit log system
3. Role-based permissions

---

## 🏗️ Architecture Highlights

### Technology Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Monorepo**: pnpm workspaces

### Module Status

| Module | Status | Completion |
|--------|--------|------------|
| Settings | ✅ Complete | 100% |
| Products & BOM | ✅ Complete | 100% |
| Planning (TO/PO/WO) | 🟡 In Progress | 70% |
| Production | ❌ Planned | 0% |
| Warehouse | ❌ Planned | 0% |
| QA/Traceability | ❌ Planned | 0% |

---

## 🔧 Using BMad Method

### Installed Modules

- **bmm** (BMad Method Module) - Planning & workflow management
- **bmb** (BMad Base) - Core utilities
- **bmgd** (BMad Greenfield/Domain) - Domain modeling
- **cis** (Code Integrity System) - Quality checks

### Available Commands

```bash
# Check BMad status
pnpm bmad:status

# List available modules
pnpm bmad:list

# Update BMad
pnpm bmad:update

# Direct BMad CLI access
pnpm bmad [command]
```

### Configured Agents

- `bmm-architect` - Architecture design
- `bmm-analyst` - Business requirements
- `bmm-planner` - Task planning
- `bmm-dev` - Development execution
- `bmm-qa` - Quality assurance

---

## 📝 Documentation Guidelines

### When Creating New Artifacts

1. **Name Convention**: `{date}-{type}-{description}.md`
   - Example: `2025-01-15-epic-bom-complexity-v2.md`

2. **Location**:
   - **Epics**: `epics/`
   - **Session Logs**: `sessions/`
   - **Specs**: `artifacts/`

3. **Format**: Markdown with YAML frontmatter

```yaml
---
date: 2025-01-11
type: epic
title: "BOM Complexity v2"
priority: P0
status: planned
---
```

### Updating Status

Edit `.bmad-status.yaml` when:
- Completing a workflow
- Changing module status
- Adding/resolving technical debt
- Updating metrics

---

## 🔗 Related Documentation

### Project Documentation

- [System Overview](../01_system_overview.md)
- [Project Structure](../11_PROJECT_STRUCTURE.md)
- [Database Tables](../12_DATABASE_TABLES.md)
- [Database Migrations](../13_DATABASE_MIGRATIONS.md)
- [Inconsistencies Checklist](../14_NIESPOJNOSCI_FIX_CHECKLIST.md)
- [Documentation Audit](../15_DOCUMENTATION_AUDIT.md)

### External Resources

- [BMad Method Documentation](../../.bmad/bmm/docs/quick-start.md)
- [BMad Agents Guide](../../.bmad/bmm/docs/agents-guide.md)
- [Brownfield Guide](../../.bmad/bmm/docs/brownfield-guide.md)

---

## 🤝 Contributing

### For Team Members

When working on BMad artifacts:

1. **Read** relevant documentation first
2. **Update** `.bmad-status.yaml` after major changes
3. **Document** decisions in session logs
4. **Link** related artifacts in commit messages

### For AI Agents

When using BMad Method workflows:

1. **Check** `.bmad-status.yaml` for current state
2. **Reference** `tech-spec.md` for architecture
3. **Follow** BMM patterns (PRD → Tech-Spec → Epic → Feature → Story)
4. **Update** status files after workflow completion

---

## 📊 Metrics Dashboard

### Current State (2025-01-11)

- **Total Tables**: 34
- **Total Migrations**: 44
- **API Modules**: 20+
- **React Components**: 60+
- **Lines of Code**: ~50,000
- **Test Coverage**: ~60% (unit tests only)
- **E2E Coverage**: 0% (Playwright setup, no tests yet)

### Quality Indicators

- ✅ **TypeScript**: Strict mode enabled
- ✅ **RLS**: Enabled on 33/34 tables
- ✅ **Migrations**: Organized (one per table)
- ✅ **Conventional Commits**: Used
- ⚠️ **E2E Tests**: Missing
- ⚠️ **API Docs**: Not generated

---

## 🆘 Troubleshooting

### Common Issues

1. **"BMad command not found"**
   - Solution: Run `pnpm bmad:status` or `npx bmad-method@alpha --version`

2. **"Tech-Spec outdated"**
   - Solution: Re-run `document-project` workflow or manually update `tech-spec.md`

3. **"Workflow status unclear"**
   - Solution: Check `.bmad-status.yaml` → `workflows_completed` section

---

## 📅 Changelog

| Date | Event | Details |
|------|-------|---------|
| 2025-01-11 | **Project Initialized** | Workflow-init + Brainstorm + Document-Project completed |
| 2025-01-11 | **Tech-Spec Created** | Comprehensive brownfield documentation (tech-spec.md) |
| 2025-01-11 | **Priorities Set** | BOM Complexity (P1), Traceability (P2) |

---

**Maintained by**: MonoPilot Team  
**Last Updated**: 2025-01-11  
**BMad Version**: 6.0.0-alpha.8

