# Epic 04 - Production Module - Implementation Plan

**Date:** 2026-01-04 (Updated: 2026-01-14)
**Epic:** 04-production (WO Execution, Consumption, Outputs, OEE)
**Status:** Phase 0 COMPLETE | Phase 1-2 Stories Defined
**Total Stories:** 18 (7 Phase 0 + 10 Phase 1 + 11 Phase 2)
**Max Parallel Tracks:** 3
**Story Definition:** 100% complete (all Phase 1-2 markdown + context created 2026-01-14)

---

## Prerequisites (Must Be COMPLETE Before Starting)

| Dependency | Story | Provides | Critical For |
|------------|-------|----------|--------------|
| Org Context + RLS | 01.1 | org_id, users, roles, RLS | ALL stories |
| Machines | 01.10 | machines table | 04.5, 04.9c |
| Production Lines | 01.11 | production_lines table | 04.1, 04.2a, 04.5 |
| Products CRUD | 02.1 | products table | 04.7a, 04.7c |
| BOMs CRUD | 02.4 | boms table | 04.7c (by-products) |
| BOM Items | 02.5a | bom_items table | 04.7c (by-products) |
| Work Orders CRUD | 03.10 | work_orders table | 04.1, 04.2a-c, 04.3, 04.4 |
| WO Materials Snapshot | 03.11a | wo_materials table | 04.1, 04.6a-e |
| WO Operations Copy | 03.12 | wo_operations table | 04.1, 04.2c, 04.3 |

### Critical External Blocker

| Dependency | Story | Provides | Blocks |
|------------|-------|----------|--------|
| **License Plates** | Epic 05.1 | license_plates, lp_genealogy | **ALL Phase 1 Stories** |

---

## Phase Structure

### Phase 0 - MVP Core (NO LP Dependency) - 7 Stories
WO lifecycle without material consumption/output registration.

### Phase 1 - Full Production (After Epic 05) - 10 Stories
LP-based consumption and output registration.

### Phase 2 - OEE & Analytics (After Phase 1) - 11 Stories
OEE calculation, downtime tracking, production reports.

---

## Dependency Graph (Critical Path)

```
LEVEL 0: External Prerequisites (Epic 01 + 02 + 03)
└── 01.1, 01.10, 01.11, 02.1, 02.4, 02.5a, 03.10, 03.11a, 03.12

================================================================================
                         PHASE 0 - MVP CORE (NO LP DEPENDENCY)
================================================================================

LEVEL 1: Foundation
└── 04.5 - Production Settings [S, 2d] ← 01.1, 01.10, 01.11

LEVEL 2: Dashboard + WO Start (Parallel)
├── 04.1 - Production Dashboard [M, 3-4d] ← 03.10, 03.11a, 03.12, 04.5
└── 04.2a - WO Start [M, 3d] ← 03.10, 04.5 (soft)

LEVEL 3: WO Lifecycle Extensions (Parallel)
├── 04.2b - WO Pause/Resume [S, 1-2d] ← 04.2a
├── 04.3 - Operation Start/Complete [M, 3-4d] ← 03.12, 04.2a
└── 04.4 - Yield Tracking [M, 3d] ← 03.10, 04.2a

LEVEL 4: WO Completion
└── 04.2c - WO Complete [M, 3-4d] ← 04.2a, 04.2b, 04.3, 04.5

================================================================================
                     PHASE 1 - FULL PRODUCTION (REQUIRES EPIC 05)
================================================================================

LEVEL 5: Core LP Operations (Parallel - After Epic 05)
├── 04.6a - Material Consumption Desktop [L, 4d] ← Epic 05, 04.2a
├── 04.7a - Output Registration Desktop [L, 4d] ← Epic 05, 04.2a
└── 04.8 - Material Reservations [L, 5d] ← Epic 05, 04.2a

LEVEL 6: Consumption Extensions
├── 04.6b - Material Consumption Scanner [L, 4d] ← 04.6a
├── 04.6c - 1:1 Consumption Enforcement [S, 2d] ← 04.6a
├── 04.6d - Consumption Correction [M, 3d] ← 04.6a
└── 04.6e - Over-Consumption Control [M, 3d] ← 04.6a

LEVEL 7: Output Extensions
├── 04.7b - Output Registration Scanner [L, 4d] ← 04.7a
├── 04.7c - By-Product Registration [M, 3d] ← 04.7a, 02.4, 02.5a
└── 04.7d - Multiple Outputs per WO [S, 2d] ← 04.7a

================================================================================
                       PHASE 2 - OEE & ANALYTICS (AFTER PHASE 1)
================================================================================

LEVEL 8: OEE Foundation
├── 04.9d - Shift Management [M, 3d] ← 01.1
└── 04.9b - Downtime Tracking [M, 3d] ← 04.2b

LEVEL 9: OEE Core
├── 04.9a - OEE Calculation [L, 5d] ← 04.3, 04.7a, 04.9b, 04.9d
└── 04.9c - Machine Integration [M, 3d] ← 01.10, 04.9a

LEVEL 10: Analytics Reports (Parallel)
├── 04.10a - OEE Summary Report [M, 3d] ← 04.9a
├── 04.10b - Downtime Analysis Report [M, 3d] ← 04.9b
├── 04.10c - Yield Analysis Report [S, 2d] ← 04.4, 04.7a
├── 04.10d - Production Output Report [S, 2d] ← 04.7a
├── 04.10e - Material Consumption Report [S, 2d] ← 04.6a
├── 04.10f - Quality Rate Report [S, 2d] ← 04.7a
└── 04.10g - WO Completion Report [S, 2d] ← 04.2c
```

---

## Sprint Plan (Max 3 Parallel Tracks)

### Sprint 1: Phase 0 Foundation (Days 1-5)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **04.5** Production Settings | S | 2 | 01.1, 01.10, 01.11 | `context/04.5/*.yaml` |
| B | **04.1** Production Dashboard | M | 3-4 | 03.10, 03.11a, 03.12 | `context/04.1/*.yaml` |
| C | **04.2a** WO Start | M | 3 | 03.10, (04.5 soft) | `context/04.2a/*.yaml` |

**Notes:**
- 04.5 should complete first (Day 2) as other stories read settings
- 04.1 and 04.2a can run in parallel, 04.1 has soft dependency on 04.5
- 04.2a enables all subsequent WO lifecycle stories

---

### Sprint 2: Phase 0 WO Lifecycle (Days 6-11)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **04.2b** WO Pause/Resume | S | 1-2 | 04.2a | `context/04.2b/*.yaml` |
| B | **04.3** Operation Start/Complete | M | 3-4 | 03.12, 04.2a | `context/04.3/*.yaml` |
| C | **04.4** Yield Tracking | M | 3 | 03.10, 04.2a | `context/04.4/*.yaml` |

**Blockers:**
- All tracks wait for 04.2a (Sprint 1)
- 04.3 also needs 03.12 (wo_operations table)

---

### Sprint 3: Phase 0 Completion (Days 12-15)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **04.2c** WO Complete | M | 3-4 | 04.2a, 04.2b, 04.3, 04.5 | `context/04.2c/*.yaml` |
| B | *(buffer/fixes/testing)* | - | - | - | - |
| C | *(buffer/fixes/testing)* | - | - | - | - |

**Notes:**
- 04.2c is the Phase 0 capstone - depends on most other Phase 0 stories
- Buffer time for integration testing and bug fixes
- **Phase 0 MVP Complete after Sprint 3**

---

### BLOCKER: Wait for Epic 05 - License Plates

**Phase 1 cannot start until Epic 05 provides:**
- `license_plates` table
- `lp_genealogy` table
- LP CRUD services
- LP quantity management

---

### Sprint 4: Phase 1 Core LP Operations (Days 1-6 post-Epic 05)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **04.6a** Material Consumption Desktop | L | 4 | Epic 05, 04.2a | `context/04.6a/*.yaml` |
| B | **04.7a** Output Registration Desktop | L | 4 | Epic 05, 04.2a | `context/04.7a/*.yaml` |
| C | **04.8** Material Reservations | L | 5 | Epic 05, 04.2a | `context/04.8/*.yaml` |

**Notes:**
- All three tracks can start in parallel after Epic 05
- These are the core LP operations - consumption, output, reservations

---

### Sprint 5: Phase 1 Consumption Extensions (Days 7-12 post-Epic 05)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **04.6b** Consumption Scanner | L | 4 | 04.6a | `context/04.6b/*.yaml` |
| B | **04.6c** 1:1 Consumption | S | 2 | 04.6a | `context/04.6c/*.yaml` |
| B' | **04.6d** Consumption Correction | M | 3 | 04.6a | `context/04.6d/*.yaml` |
| C | **04.6e** Over-Consumption Control | M | 3 | 04.6a | `context/04.6e/*.yaml` |

**Blockers:**
- All tracks wait for 04.6a (Sprint 4)
- Track B runs 04.6c then 04.6d sequentially

---

### Sprint 6: Phase 1 Output Extensions (Days 13-18 post-Epic 05)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **04.7b** Output Scanner | L | 4 | 04.7a | `context/04.7b/*.yaml` |
| B | **04.7c** By-Product Registration | M | 3 | 04.7a, 02.4, 02.5a | `context/04.7c/*.yaml` |
| C | **04.7d** Multiple Outputs | S | 2 | 04.7a | `context/04.7d/*.yaml` |

**Blockers:**
- All tracks wait for 04.7a (Sprint 4)
- **Phase 1 Complete after Sprint 6**

---

### Sprint 7: Phase 2 OEE Foundation (Days 19-24 post-Epic 05)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **04.9d** Shift Management | M | 3 | 01.1 | `context/04.9d/*.yaml` |
| B | **04.9b** Downtime Tracking | M | 3 | 04.2b | `context/04.9b/*.yaml` |
| C | *(buffer)* | - | - | - | - |

**Notes:**
- 04.9d and 04.9b are foundations for OEE calculation

---

### Sprint 8: Phase 2 OEE Core (Days 25-30 post-Epic 05)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **04.9a** OEE Calculation | L | 5 | 04.3, 04.7a, 04.9b, 04.9d | `context/04.9a/*.yaml` |
| B | **04.9c** Machine Integration | M | 3 | 01.10, (04.9a soft) | `context/04.9c/*.yaml` |
| C | *(buffer)* | - | - | - | - |

**Blockers:**
- 04.9a waits for 04.9b, 04.9d (Sprint 7) and 04.3, 04.7a (earlier sprints)

---

### Sprint 9: Phase 2 Analytics Reports (Days 31-36 post-Epic 05)

| Track | Story | Complexity | Days | Dependencies | Context Files |
|-------|-------|------------|------|--------------|---------------|
| A | **04.10a** OEE Summary Report | M | 3 | 04.9a | `context/04.10a/*.yaml` |
| A' | **04.10b** Downtime Analysis | M | 3 | 04.9b | `context/04.10b/*.yaml` |
| B | **04.10c** Yield Analysis | S | 2 | 04.4, 04.7a | `context/04.10c/*.yaml` |
| B' | **04.10d** Production Output | S | 2 | 04.7a | `context/04.10d/*.yaml` |
| B'' | **04.10e** Material Consumption | S | 2 | 04.6a | `context/04.10e/*.yaml` |
| C | **04.10f** Quality Rate | S | 2 | 04.7a | `context/04.10f/*.yaml` |
| C' | **04.10g** WO Completion | S | 2 | 04.2c | `context/04.10g/*.yaml` |

**Notes:**
- Reports can be highly parallelized (7 reports across 3 tracks)
- Each track runs 2-3 small reports sequentially
- **Phase 2 Complete after Sprint 9**

---

## Stories Quick Reference

### Phase 0 - MVP Core (7 stories) - NO LP DEPENDENCY

| ID | Name | Size | Days | Key Dependencies |
|----|------|------|------|------------------|
| 04.5 | Production Settings | S | 2 | 01.1, 01.10, 01.11 |
| 04.1 | Production Dashboard | M | 3-4 | 03.10, 03.11a, 03.12, 04.5 |
| 04.2a | WO Start | M | 3 | 03.10, 04.5 |
| 04.2b | WO Pause/Resume | S | 1-2 | 04.2a |
| 04.2c | WO Complete | M | 3-4 | 04.2a, 04.2b, 04.3, 04.5 |
| 04.3 | Operation Start/Complete | M | 3-4 | 03.12, 04.2a |
| 04.4 | Yield Tracking | M | 3 | 03.10, 04.2a |

**Total Phase 0:** ~18-22 days (1 dev) / ~10-15 days (3 parallel tracks)

### Phase 1 - Full Production (10 stories) - REQUIRES Epic 05

| ID | Name | Size | Days | Key Dependencies |
|----|------|------|------|------------------|
| 04.6a | Material Consumption Desktop | L | 4 | Epic 05, 04.2a |
| 04.6b | Material Consumption Scanner | L | 4 | 04.6a |
| 04.6c | 1:1 Consumption Enforcement | S | 2 | 04.6a |
| 04.6d | Consumption Correction | M | 3 | 04.6a |
| 04.6e | Over-Consumption Control | M | 3 | 04.6a |
| 04.7a | Output Registration Desktop | L | 4 | Epic 05, 04.2a |
| 04.7b | Output Registration Scanner | L | 4 | 04.7a |
| 04.7c | By-Product Registration | M | 3 | 04.7a, 02.4, 02.5a |
| 04.7d | Multiple Outputs per WO | S | 2 | 04.7a |
| 04.8 | Material Reservations | L | 5 | Epic 05, 04.2a |

**Total Phase 1:** ~34 days (1 dev) / ~18 days (3 parallel tracks)

### Phase 2 - OEE & Analytics (11 stories)

| ID | Name | Size | Days | Key Dependencies |
|----|------|------|------|------------------|
| 04.9a | OEE Calculation | L | 5 | 04.3, 04.7a, 04.9b, 04.9d |
| 04.9b | Downtime Tracking | M | 3 | 04.2b |
| 04.9c | Machine Integration | M | 3 | 01.10, 04.9a |
| 04.9d | Shift Management | M | 3 | 01.1 |
| 04.10a | OEE Summary Report | M | 3 | 04.9a |
| 04.10b | Downtime Analysis Report | M | 3 | 04.9b |
| 04.10c | Yield Analysis Report | S | 2 | 04.4, 04.7a |
| 04.10d | Production Output Report | S | 2 | 04.7a |
| 04.10e | Material Consumption Report | S | 2 | 04.6a |
| 04.10f | Quality Rate Report | S | 2 | 04.7a |
| 04.10g | WO Completion Report | S | 2 | 04.2c |

**Total Phase 2:** ~30 days (1 dev) / ~18 days (3 parallel tracks)

---

## Agent Context Mapping

For each story, load the following context files to agent:

```yaml
story_contexts:
  "04.1":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.1/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.2a":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.2a/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.2b":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.2b/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.2c":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.2c/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.3":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.3/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.4":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.4/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.5":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.5/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  # Phase 1 stories (context to be created after Epic 05)
  "04.6a":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.6a/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.6b":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.6b/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.6c":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.6c/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.6d":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.6d/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.6e":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.6e/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.7a":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.7a/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.7b":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.7b/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.7c":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.7c/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.7d":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.7d/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.8":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.8/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  # Phase 2 stories (context to be created)
  "04.9a":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.9a/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.9b":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.9b/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.9c":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.9c/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.9d":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.9d/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.10a":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.10a/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.10b":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.10b/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.10c":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.10c/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.10d":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.10d/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.10e":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.10e/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.10f":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.10f/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]

  "04.10g":
    path: "docs/2-MANAGEMENT/epics/current/04-production/context/04.10g/"
    files: ["_index.yaml", "database.yaml", "api.yaml", "frontend.yaml", "tests.yaml"]
```

---

## Critical Path Analysis

### Phase 0 Critical Path (MVP):
```
04.5 [2d] → 04.2a [3d] → 04.2b [2d] → 04.2c [4d]
                      → 04.3 [4d] ↗
Total: ~11 days sequential (critical path through 04.5 → 04.2a → 04.3 → 04.2c)
```

### Phase 1 Critical Path (Consumption Track):
```
Epic 05 → 04.6a [4d] → 04.6b [4d]
Total: ~8 days after Epic 05 (consumption scanner)
```

### Phase 1 Critical Path (Output Track):
```
Epic 05 → 04.7a [4d] → 04.7b [4d]
Total: ~8 days after Epic 05 (output scanner)
```

### Phase 2 Critical Path (OEE):
```
04.9d [3d] + 04.9b [3d] (parallel) → 04.9a [5d] → 04.10a [3d]
Total: ~11 days (through OEE calculation to report)
```

### Overall Timeline Estimates:

| Phase | Sequential (1 dev) | Parallel (3 tracks) |
|-------|-------------------|---------------------|
| Phase 0 (MVP) | 18-22 days | 10-15 days |
| **Wait for Epic 05** | - | - |
| Phase 1 | 34 days | 18 days |
| Phase 2 | 30 days | 18 days |
| **Total** | ~82-86 days | ~46-51 days |

---

## Blockers & Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Epic 05 delay blocks Phase 1** | HIGH | Medium | Phase 0 can deliver value independently |
| LP genealogy complexity | HIGH | Medium | Clear data model in 04.7a, integration tests |
| Scanner UX issues | HIGH | Medium | 48px+ touch targets, audio feedback, user testing |
| OEE calculation errors | MEDIUM | Medium | Unit tests with known examples, validation |
| Dashboard performance | MEDIUM | Low | 30s cache TTL, efficient indexes |
| Concurrent WO edits | MEDIUM | Low | Optimistic locking, RLS |
| Settings scope creep | LOW | Low | Strict Phase 0/1/2 setting enforcement |

---

## Database Tables (Created by Epic 04)

### Phase 0 Tables
| Table | Story | Purpose |
|-------|-------|---------|
| `production_settings` | 04.5 | Module configuration |
| `wo_pauses` | 04.2b | Pause history |
| `operation_logs` | 04.3 | Operation audit trail |
| `yield_logs` | 04.4 | Yield entry history |

### Phase 1 Tables
| Table | Story | Purpose |
|-------|-------|---------|
| `material_consumptions` | 04.6a | Consumption records |
| `production_outputs` | 04.7a | Output LP references |
| `material_reservations` | 04.8 | LP reservations |
| `over_consumption_approvals` | 04.6e | Approval requests |

### Phase 2 Tables
| Table | Story | Purpose |
|-------|-------|---------|
| `shifts` | 04.9d | Shift definitions |
| `downtime_records` | 04.9b | Downtime log |
| `downtime_reasons` | 04.9b | Reason codes |
| `oee_records` | 04.9a | OEE metrics |
| `machine_counters` | 04.9c | Counter readings |

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
- [ ] Mobile responsive (scanner stories)
- [ ] PROJECT-STATE.md updated

---

## Handoff Instructions for Orchestrator

```yaml
epic: "04-production"
base_path: "docs/2-MANAGEMENT/epics/current/04-production/"
context_path: "context/{story_id}/"
story_md_pattern: "{story_id}.{slug}.md"

execution_order:
  phase_0_sprint_1: ["04.5", "04.1", "04.2a"]  # Parallel (3 tracks)
  phase_0_sprint_2: ["04.2b", "04.3", "04.4"]  # Parallel after 04.2a
  phase_0_sprint_3: ["04.2c"]                   # After 04.2a, 04.2b, 04.3
  # BLOCKER: Wait for Epic 05
  phase_1_sprint_4: ["04.6a", "04.7a", "04.8"]  # Parallel after Epic 05
  phase_1_sprint_5: ["04.6b", "04.6c", "04.6d", "04.6e"]  # After 04.6a
  phase_1_sprint_6: ["04.7b", "04.7c", "04.7d"]  # After 04.7a
  phase_2_sprint_7: ["04.9d", "04.9b"]          # OEE foundation
  phase_2_sprint_8: ["04.9a", "04.9c"]          # OEE core
  phase_2_sprint_9: ["04.10a", "04.10b", "04.10c", "04.10d", "04.10e", "04.10f", "04.10g"]

max_parallel_agents: 3
phase_1_blocker: "Epic 05 (License Plates)"
deferred_until_epic_05: ["04.6a", "04.6b", "04.6c", "04.6d", "04.6e", "04.7a", "04.7b", "04.7c", "04.7d", "04.8"]

agent_context_template: |
  Read the following files before implementing:
  1. {context_path}/_index.yaml - dependencies, deliverables
  2. {context_path}/database.yaml - tables, RLS
  3. {context_path}/api.yaml - endpoints, validation
  4. {context_path}/frontend.yaml - components, pages
  5. {context_path}/tests.yaml - acceptance criteria

special_notes:
  - "Phase 0 stories have NO LP dependency - can proceed immediately"
  - "Phase 1 stories REQUIRE Epic 05 license_plates table"
  - "Scanner stories (04.6b, 04.7b) need mobile-first UX with 48px+ touch targets"
  - "OEE formula: Availability x Performance x Quality"
  - "All stories must follow ADR-013 RLS pattern"
```

---

## Phase 2: OEE & Analytics (NEW - 2026-01-14)

**Status:** Stories Defined | Implementation Pending
**Stories:** 11 (4 OEE Core + 7 Analytics Reports)
**Estimated Effort:** 33 days

### Phase 2 Dependency Graph

```
LEVEL 1: Foundation (no dependencies)
└── 04.9d - Shift Management [M, 3d]

LEVEL 2: Data Collection (parallel possible)
├── 04.9b - Downtime Tracking [L, 4d] ← 01.10 (Machines)
└── Continue Phase 1 stories if needed

LEVEL 3: OEE Calculation
└── 04.9a - OEE Calculation [L, 5d] ← 04.9d (Shifts), 04.9b (Downtime), 04.4 (Yield)

LEVEL 4: Advanced Integration (optional)
└── 04.9c - Machine Integration [L, 5d] ← 01.10 (Machines), 04.9b (Downtime)

LEVEL 5: Analytics Reports (parallel - can run all 7 simultaneously)
├── 04.10a - OEE Summary Report [M, 3d] ← 04.9a
├── 04.10b - Downtime Analysis Report [M, 3d] ← 04.9b
├── 04.10c - Yield Analysis Report [M, 2d] ← 04.4
├── 04.10d - Production Output Report [M, 2d] ← 04.7a
├── 04.10e - Material Consumption Report [M, 2d] ← 04.6a
├── 04.10f - Quality Rate Report [M, 2d] ← 04.7a, Epic 06 (soft)
└── 04.10g - WO Completion Report [S, 2d] ← 04.2c
```

### Phase 2 Stories Quick Reference

**OEE Core:**

| ID | Name | Size | Days | Key Dependencies |
|----|------|------|------|------------------|
| 04.9a | OEE Calculation | L | 5 | 04.9d, 04.9b, 04.4 |
| 04.9b | Downtime Tracking | L | 4 | 01.10 |
| 04.9c | Machine Integration | L | 5 | 01.10, 04.9b |
| 04.9d | Shift Management | M | 3 | 01.1 |

**Analytics Reports:**

| ID | Name | Size | Days | Key Dependencies |
|----|------|------|------|------------------|
| 04.10a | OEE Summary Report | M | 3 | 04.9a |
| 04.10b | Downtime Analysis Report | M | 3 | 04.9b |
| 04.10c | Yield Analysis Report | M | 2 | 04.4 |
| 04.10d | Production Output Report | M | 2 | 04.7a |
| 04.10e | Material Consumption Report | M | 2 | 04.6a |
| 04.10f | Quality Rate Report | M | 2 | 04.7a |
| 04.10g | WO Completion Report | S | 2 | 04.2c |

**Critical Path (Phase 2):** 04.9d [3d] → 04.9b [4d] → 04.9a [5d] → 04.10a [3d] = ~15 days sequential

**With Parallel Execution:** Reports (04.10a-g) can all run simultaneously → **~25 days total**

---

## Updated Timeline Estimate

| Phase | Stories | Sequential Days | Parallel Days | Status |
|-------|---------|----------------|---------------|--------|
| Phase 0 (MVP Core) | 7 | - | - | 100% DONE ✅ |
| Phase 1 (Full Production) | 10 | 27-31 | 27-31 | 0% (stories ready) |
| Phase 2 (OEE & Analytics) | 11 | 33 | 25 | 0% (stories ready) |
| **TOTAL** | **18** | **60-64** | **52-56** | **39% complete** |

**Note:** Phase 2 should start after Phase 1 completes to ensure production data availability.

---

**Generated:** 2026-01-04 (Updated: 2026-01-14)
**Author:** Claude Code (AI Agent) + ORCHESTRATOR
**Epic Owner:** Production Module
**Last Update:** Added Phase 1-2 markdown stories (21 files, ~440KB documentation)
