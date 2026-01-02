# Epic 03 - Planning Module - Implementation Plan

**Date:** 2025-12-29
**Epic:** 03-planning (Suppliers, POs, TOs, WOs)
**Status:** Ready for Implementation
**Total Stories:** 21 (17 ready + 4 deferred)
**Max Parallel Tracks:** 4

---

## Prerequisites (Must Be COMPLETE Before Starting)

| Dependency | Story | Provides | Critical For |
|------------|-------|----------|--------------|
| Org Context + RLS | 01.1 | org_id, users, roles, RLS | ALL stories |
| Warehouses | 01.8 | warehouses table | 03.3, 03.8 |
| Tax Codes | 01.13 | tax_codes table | 03.1, 03.3 |
| Production Lines | 01.9/01.11 | production_lines | 03.10, 03.12 |
| Products CRUD | 02.1 | products table | 03.2, 03.3, 03.8, 03.10 |
| BOMs CRUD | 02.4 | boms table | 03.10, 03.11a |
| BOM Items | 02.5a | bom_items table | 03.11a |
| Routings | 02.7 | routings table | 03.12 |
| Routing Operations | 02.8 | routing_operations | 03.12 |

---

## Dependency Graph (Critical Path)

```
LEVEL 0: External Prerequisites (Epic 01 + 02)
└── 01.1, 01.8, 01.9, 01.13, 02.1, 02.4, 02.5a, 02.7, 02.8

LEVEL 1: Foundation (Independent - can start immediately)
├── 03.17 - Planning Settings [S, 2d] ← 01.1
└── 03.1 - Suppliers CRUD [M, 4d] ← 01.1, 01.13

LEVEL 2: Core Entities (Parallel possible)
├── 03.2 - Supplier-Products [S, 2d] ← 03.1, 02.1
├── 03.8 - TO CRUD + Lines [L, 4d] ← 01.1, 01.8, 02.1
└── 03.10 - WO CRUD + BOM Auto [L, 5-7d] ← 01.1, 01.11, 02.1, 02.4

LEVEL 3: Entity Extensions
├── 03.3 - PO CRUD + Lines [L, 5-7d] ← 03.1, 03.2 
├── 03.9a - TO Partial Shipments [S, 2d] ← 03.8
├── 03.11a - WO Materials Snapshot [L, 5-7d] ← 03.10, 02.5a
└── 03.12 - WO Operations Copy [M, 4d] ← 03.10, 02.7, 02.8

LEVEL 4: Advanced Features
├── 03.4 - Bulk PO Creation [M, 4d] ← 03.3
├── 03.5a - PO Approval Setup [S, 2d] ← 03.3
├── 03.6 - PO Bulk Operations [M, 4d] ← 03.3, 03.4
└── 03.14 - WO Scheduling [M, 3d] ← 03.10

LEVEL 5: Workflows + Visualization
├── 03.5b - PO Approval Workflow [M, 4d] ← 03.5a
├── 03.7 - PO Status Lifecycle [S, 2d] ← 03.5b
└── 03.15 - WO Gantt Chart [M, 4d] ← 03.14

LEVEL 6: Dashboard
└── 03.16 - Planning Dashboard [M, 4d] ← 03.3, 03.8, 03.10

DEFERRED (Require Epic 05 - Warehouse LP):
├── 03.9b - TO LP Pre-Selection [M, 4d]
├── 03.11b - WO Material Reservations [M, 4d]
└── 03.13 - Material Availability [M, 4d]
```

---

## Sprint Plan (Max 4 Parallel Tracks)

### Sprint 1: Foundation (Days 1-4)

| Track | Story | Complexity | Days | Context Files |
|-------|-------|------------|------|---------------|
| A | **03.17** Planning Settings | S | 2 | `context/03.17/*.yaml` |
| B | **03.1** Suppliers CRUD | M | 4 | `context/03.1/*.yaml` |
| C | **03.8** TO CRUD + Lines | L | 4 | `context/03.8/*.yaml` |
| D | **03.10** WO CRUD + BOM Auto | L | 5-7 | `context/03.10/*.yaml` |

**Blockers:** None (all prerequisites from Epic 01/02 assumed complete)

---

### Sprint 2: Core Extensions (Days 5-10)

| Track | Story | Complexity | Days | Depends On | Context Files |
|-------|-------|------------|------|------------|---------------|
| A | **03.2** Supplier-Products | S | 2 | 03.1 | `context/03.2/*.yaml` |
| B | **03.9a** TO Partial Shipments | S | 2 | 03.8 | `context/03.9a/*.yaml` |
| C | **03.11a** WO Materials Snapshot | L | 5-7 | 03.10 | `context/03.11a/*.yaml` |
| D | **03.12** WO Operations Copy | M | 4 | 03.10 | `context/03.12/*.yaml` |

**Blockers:**
- Track A waits for 03.1 (Sprint 1)
- Track B waits for 03.8 (Sprint 1)
- Track C/D wait for 03.10 (Sprint 1)

---

### Sprint 3: PO Core + WO Scheduling (Days 11-18)

| Track | Story | Complexity | Days | Depends On | Context Files |
|-------|-------|------------|------|------------|---------------|
| A | **03.3** PO CRUD + Lines | L | 5-7 | 03.1, 03.2 | `context/03.3/*.yaml` |
| B | **03.14** WO Scheduling | M | 3 | 03.10 | `context/03.14/*.yaml` |
| C | *(continue 03.11a)* | - | - | - | - |
| D | *(continue 03.12)* | - | - | - | - |

**Blockers:**
- Track A waits for 03.2 (Sprint 2)
- Track B can start after 03.10 (Sprint 1)

---

### Sprint 4: PO Advanced + WO Gantt (Days 19-26)

| Track | Story | Complexity | Days | Depends On | Context Files |
|-------|-------|------------|------|------------|---------------|
| A | **03.4** Bulk PO Creation | M | 4 | 03.3 | `context/03.4/*.yaml` |
| B | **03.5a** PO Approval Setup | S | 2 | 03.3 | `context/03.5a/*.yaml` |
| C | **03.15** WO Gantt Chart | M | 4 | 03.14 | `context/03.15/*.yaml` |
| D | **03.6** PO Bulk Operations | M | 4 | 03.3, 03.4 | `context/03.6/*.yaml` |

**Blockers:**
- All tracks wait for 03.3 (Sprint 3)
- Track C waits for 03.14 (Sprint 3)
- Track D waits for 03.4 (same sprint)

---

### Sprint 5: Approval Workflow + Dashboard (Days 27-32)

| Track | Story | Complexity | Days | Depends On | Context Files |
|-------|-------|------------|------|------------|---------------|
| A | **03.5b** PO Approval Workflow | M | 4 | 03.5a | `context/03.5b/*.yaml` |
| B | **03.7** PO Status Lifecycle | S | 2 | 03.5b | `context/03.7/*.yaml` |
| C | **03.16** Planning Dashboard | M | 4 | 03.3, 03.8, 03.10 | `context/03.16/*.yaml` |
| D | *(buffer/fixes)* | - | - | - | - |

**Blockers:**
- Track A waits for 03.5a (Sprint 4)
- Track B waits for 03.5b (same sprint - sequential)
- Track C waits for 03.3, 03.8, 03.10 (Sprints 1-3)

---

## Stories Quick Reference

### Ready for Implementation (17 stories)

| ID | Name | Size | Days | Key Dependencies |
|----|------|------|------|------------------|
| 03.1 | Suppliers CRUD | M | 4 | 01.1, 01.13 |
| 03.2 | Supplier-Products | S | 2 | 03.1, 02.1 |
| 03.3 | PO CRUD + Lines | L | 5-7 | 03.1, 03.2, 01.8, 01.13, 02.1 |
| 03.4 | Bulk PO Creation | M | 4 | 03.3 |
| 03.5a | PO Approval Setup | S | 2 | 03.3 |
| 03.5b | PO Approval Workflow | M | 4 | 03.5a |
| 03.6 | PO Bulk Operations | M | 4 | 03.3, 03.4 |
| 03.7 | PO Status Lifecycle | S | 2 | 03.5b |
| 03.8 | TO CRUD + Lines | L | 4 | 01.1, 01.8, 02.1 |
| 03.9a | TO Partial Shipments | S | 2 | 03.8 |
| 03.10 | WO CRUD + BOM Auto | L | 5-7 | 01.1, 01.11, 02.1, 02.4 |
| 03.11a | WO Materials Snapshot | L | 5-7 | 03.10, 02.5a |
| 03.12 | WO Operations Copy | M | 4 | 03.10, 02.7, 02.8 |
| 03.14 | WO Scheduling | M | 3 | 03.10 |
| 03.15 | WO Gantt Chart | M | 4 | 03.14 |
| 03.16 | Planning Dashboard | M | 4 | 03.3, 03.8, 03.10 |
| 03.17 | Planning Settings | S | 2 | 01.1 |

### Deferred (4 stories - Require Epic 05)

| ID | Name | Size | Days | Blocker |
|----|------|------|------|---------|
| 03.9b | TO LP Pre-Selection | M | 4 | Epic 05 - license_plates table |
| 03.11b | WO Material Reservations | M | 4 | Epic 05 - lp_reservations |
| 03.13 | Material Availability | M | 4 | Epic 05 - LP inventory queries |

---

## Agent Context Mapping

For each story, load the following context files to agent:

```yaml
story_contexts:
  "03.1":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.1/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.2":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.2/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.3":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.3/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.4":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.4/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.5a":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.5a/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.5b":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.5b/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.6":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.6/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.7":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.7/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.8":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.8/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.9a":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.9a/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.10":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.10/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.11a":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.11a/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.12":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.12/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.14":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.14/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.15":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.15/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.16":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.16/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "03.17":
    path: "docs/2-MANAGEMENT/epics/current/03-planning/context/03.17/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]
```

---

## Critical Path Analysis

**Longest Path (PO Track):**
```
03.1 [4d] → 03.2 [2d] → 03.3 [7d] → 03.5a [2d] → 03.5b [4d] → 03.7 [2d]
Total: ~21 days sequential
```

**WO Track:**
```
03.10 [7d] → 03.11a [7d] + 03.12 [4d] (parallel) + 03.14 [3d] → 03.15 [4d]
Total: ~18 days
```

**TO Track:**
```
03.8 [4d] → 03.9a [2d]
Total: ~6 days
```

**With 4 parallel tracks:**
- Estimated total: **30-35 days**
- Critical path: PO workflow (03.1 → 03.7)

---

## Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Epic 02 incomplete | HIGH | Verify 02.1, 02.4, 02.5a, 02.7, 02.8 before Sprint 1 |
| BOM Snapshot complexity | HIGH | Allocate extra time for 03.11a, use ADR-002 pattern |
| Gantt chart performance | MEDIUM | Index optimization in 03.15 |
| Approval workflow edge cases | MEDIUM | Comprehensive tests in 03.5b |
| Dashboard aggregation | LOW | Redis caching in 03.16 |

---

## Definition of Done (Per Story)

- [ ] All context YAML files reviewed
- [ ] Database migration created (if applicable)
- [ ] RLS policies applied (ADR-013)
- [ ] API endpoints implemented
- [ ] Service layer with business logic
- [ ] Zod validation schemas
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests (API + database)
- [ ] E2E smoke test (critical flow)
- [ ] Mobile responsive
- [ ] PROJECT-STATE.md updated

---

## Handoff Instructions for Orchestrator

```yaml
epic: "03-planning"
base_path: "docs/2-MANAGEMENT/epics/current/03-planning/"
context_path: "context/{story_id}/"
story_md_pattern: "{story_id}.{slug}.md"

execution_order:
  sprint_1: ["03.17", "03.1", "03.8", "03.10"]
  sprint_2: ["03.2", "03.9a", "03.11a", "03.12"]
  sprint_3: ["03.3", "03.14"]
  sprint_4: ["03.4", "03.5a", "03.15", "03.6"]
  sprint_5: ["03.5b", "03.7", "03.16"]

max_parallel_agents: 4
deferred: ["03.9b", "03.11b", "03.13"]

agent_context_template: |
  Read the following files before implementing:
  1. {context_path}/_index.yaml - dependencies, deliverables
  2. {context_path}/database.yaml - tables, RLS
  3. {context_path}/api.yaml - endpoints, validation
  4. {context_path}/frontend.yaml - components, pages
  5. {context_path}/tests.yaml - acceptance criteria
```

---

**Generated:** 2025-12-29
**Author:** Claude Code (AI Agent)
**Epic Owner:** Planning Module
