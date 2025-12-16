# Epic 01 Settings - MVP Dependency Analysis

**Date:** 2025-12-16
**Status:** REQUIRES SCOPE EXPANSION
**Conclusion:** Current Phase 1A scope is TOO SMALL for functional MVP

---

## Executive Summary

Analysis of ALL core modules (Technical → Shipping) reveals that the current Settings Phase 1A scope creates a **non-functional demo**. Users can configure org/users but **cannot use any operational module**.

**Recommendation:** Expand Phase 1A to include full infrastructure (warehouses, locations, machines, production lines) + complete onboarding wizard.

---

## Module Dependency Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SETTINGS DEPENDENCIES BY MODULE                          │
├─────────────┬───────────┬──────────┬────────────┬───────────┬──────────────┤
│ Settings    │ Technical │ Planning │ Production │ Warehouse │ Quality/Ship │
│ Feature     │ Epic 02   │ Epic 03  │ Epic 04    │ Epic 05   │ Epic 06/07   │
├─────────────┼───────────┼──────────┼────────────┼───────────┼──────────────┤
│ Org + RLS   │ HARD      │ HARD     │ HARD       │ HARD      │ HARD         │
│ Users       │ HARD      │ HARD     │ HARD       │ HARD      │ HARD         │
│ Roles (10)  │ HARD      │ HARD     │ HARD       │ HARD      │ HARD         │
├─────────────┼───────────┼──────────┼────────────┼───────────┼──────────────┤
│ Warehouses  │ -         │ HARD(PO) │ SOFT       │ HARD      │ SOFT/SOFT    │
│ Locations   │ -         │ SOFT     │ SOFT       │ HARD      │ SOFT/HARD    │
│ Machines    │ SOFT      │ SOFT     │ SOFT       │ -         │ SOFT/-       │
│ Prod Lines  │ SOFT      │ SOFT     │ HARD       │ -         │ -/-          │
├─────────────┼───────────┼──────────┼────────────┼───────────┼──────────────┤
│ Allergens   │ CREATES   │ -        │ -          │ -         │ -/FOOD-SAFE  │
│ Tax Codes   │ -         │ HARD(sup)│ -          │ -         │ -/SOFT       │
└─────────────┴───────────┴──────────┴────────────┴───────────┴──────────────┘

Legend:
- HARD = System breaks without it
- SOFT = Works but limited functionality
- CREATES = Module creates its own (allergens in Epic 02)
- FOOD-SAFE = Not hard requirement but critical for compliance
```

---

## Dependency Graph (Visual)

```
                           ┌──────────────────┐
                           │ SETTINGS MODULE  │
                           │   (Epic 01)      │
                           └────────┬─────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  FOUNDATION     │      │ INFRASTRUCTURE  │      │  MASTER DATA    │
│  (Phase 1A)     │      │ (Phase 1B→1A)   │      │  (Phase 2→1A)   │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ • Organization  │      │ • Warehouses    │      │ • Allergens     │
│ • Users         │      │ • Locations     │      │ • Tax Codes     │
│ • Roles (10)    │      │ • Machines      │      │                 │
│ • Module Toggle │      │ • Prod Lines    │      │                 │
│ • Wizard Launch │      │ • Wizard 2-3    │      │                 │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         OPERATIONAL MODULES                          │
├─────────────────┬─────────────────┬─────────────────┬───────────────┤
│   TECHNICAL     │    PLANNING     │   PRODUCTION    │   WAREHOUSE   │
│   (Epic 02)     │    (Epic 03)    │   (Epic 04)     │   (Epic 05)   │
├─────────────────┼─────────────────┼─────────────────┼───────────────┤
│ Needs:          │ Needs:          │ Needs:          │ Needs:        │
│ • Org+Users+RLS │ • Org+Users+RLS │ • Org+Users+RLS │ • Org+Users   │
│ • (machines opt)│ • Warehouses    │ • Prod Lines    │ • Warehouses  │
│ • (lines opt)   │ • Tax Codes     │ • (Machines opt)│ • Locations   │
│                 │ • (lines opt)   │ • (Warehouse)   │               │
└─────────────────┴─────────────────┴─────────────────┴───────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DOWNSTREAM MODULES                              │
├───────────────────────────────┬─────────────────────────────────────┤
│         QUALITY (Epic 06)     │         SHIPPING (Epic 07)          │
├───────────────────────────────┼─────────────────────────────────────┤
│ Needs:                        │ Needs:                              │
│ • Org+Users+RLS               │ • Org+Users+RLS                     │
│ • Quality Mgr/Inspector roles │ • Warehouse Mgr/Operator roles      │
│ • (Locations for samples)     │ • Locations (HARD - pick lists)     │
│ • (Machines for equipment)    │ • Allergens (food safety)           │
└───────────────────────────────┴─────────────────────────────────────┘
```

---

## Current vs Required MVP Scope

### Current Phase 1A (INSUFFICIENT)

| Story | Feature | What It Enables |
|-------|---------|-----------------|
| 01.1 | Org + RLS | Multi-tenancy foundation |
| 01.2 | Settings Shell | Navigation |
| 01.3 | Wizard Launcher | Shows wizard modal (framework only) |
| 01.4 | Org Profile Step | Step 1 of wizard |
| 01.5a | Users CRUD | User management |
| 01.6 | Role Permissions | 10-role RBAC |
| 01.7 | Module Toggles | Enable/disable modules |

**Result:** User toggles modules ON but cannot USE them.

### Required MVP Scope (FUNCTIONAL SYSTEM)

| Story | Feature | Enables Module |
|-------|---------|----------------|
| 01.1 | Org + RLS | ALL |
| 01.2 | Settings Shell | ALL |
| 01.3 | Wizard Launcher | Onboarding |
| 01.4 | Org Profile (Step 1) | Onboarding |
| 01.5 | Users CRUD | ALL |
| 01.6 | Role Permissions | ALL |
| 01.7 | Module Toggles | ALL |
| **01.8** | **Warehouses CRUD** | Planning, Production, Warehouse, Shipping |
| **01.9** | **Locations CRUD** | Warehouse, Shipping, Quality |
| **01.10** | **Machines CRUD** | Production, Technical (routing) |
| **01.11** | **Production Lines CRUD** | Production |
| **01.12** | **Allergens (14 EU)** | Technical, Shipping (food safety) |
| **01.13** | **Tax Codes** | Planning (suppliers) |
| **01.14** | **Wizard Steps 2-6** | Complete onboarding flow |

---

## Onboarding Wizard Analysis

### PRD Says (P0 Phase 1A):

| Step | FR | Creates | Status |
|------|-------|---------|--------|
| 1 | FR-SET-181 | Org profile update | In 01.4 |
| 2 | FR-SET-182 | First warehouse | **MISSING** |
| 3 | FR-SET-183 | First location(s) | **MISSING** |
| 4 | FR-SET-184 | First product | **MISSING** (Technical module) |
| 5 | FR-SET-185 | First work order (optional) | **MISSING** (Planning module) |
| 6 | FR-SET-188 | Completion celebration | **MISSING** |

**ALL wizard steps are P0 Phase 1A in PRD but only Step 1 is implemented!**

### "15-Minute Onboarding" Promise

PRD competitive differentiator:
> "MonoPilot targets **15-minute onboarding** from signup to first work order."

Current implementation: 2-minute org profile form. No warehouse, no product, no work order.

---

## Recommended New Story Index

| Story | Name | PRD FRs | Complexity | Priority |
|------:|------|---------|------------|----------|
| 01.1 | Org Context + RLS | FR-SET-002 | M | P0 |
| 01.2 | Settings Shell | FR-SET-030/031 | S | P0 |
| 01.3 | Wizard Framework | FR-SET-180/186/187 | M | P0 |
| 01.4 | Org Profile (Wizard Step 1) | FR-SET-001/003/004/181 | M | P0 |
| 01.5 | Users CRUD | FR-SET-010/012/017 | L | P0 |
| 01.6 | Role Permissions | FR-SET-011/020-031 | M | P0 |
| 01.7 | Module Toggles | FR-SET-090-097 | M | P0 |
| **01.8** | **Warehouses CRUD** | **FR-SET-040-046** | **M** | **P0** |
| **01.9** | **Locations CRUD** | **FR-SET-042-044** | **M** | **P0** |
| **01.10** | **Machines CRUD** | **FR-SET-050-055** | **M** | **P0** |
| **01.11** | **Production Lines CRUD** | **FR-SET-060-065** | **M** | **P0** |
| **01.12** | **Allergens Management** | **FR-SET-070-073** | **S** | **P0** |
| **01.13** | **Tax Codes CRUD** | **FR-SET-080-084** | **S** | **P0** |
| **01.14** | **Wizard Steps 2-6** | **FR-SET-182-185/188** | **M** | **P0** |

**Phase 1B (Polish):**

| Story | Name | PRD FRs |
|------:|------|---------|
| 01.15 | User Warehouse Access | FR-SET-018 |
| 01.16 | Audit Trail | FR-SET-140-146 |
| 01.17 | Security Policies | FR-SET-171-173 |
| 01.18 | Multi-language | FR-SET-110-116 |

**Phase 2 (Integrations):**

| Story | Name | PRD FRs |
|------:|------|---------|
| 01.19 | API Keys | FR-SET-120-125 |
| 01.20 | Webhooks | FR-SET-130-135 |
| 01.21 | Notifications | FR-SET-160-163 |

**Phase 3 (Enterprise):**

| Story | Name | PRD FRs |
|------:|------|---------|
| 01.22 | Billing | FR-SET-100-106 |
| 01.23 | Import/Export | FR-SET-150-155 |
| 01.24 | IP Whitelist + GDPR | FR-SET-170/174 |

---

## Effort Estimation

### Current Phase 1A: 5-7 days (7 stories)

### New MVP Phase 1A: 15-18 days (14 stories)

| New Stories | Days |
|-------------|------|
| 01.8 Warehouses | 2-3 |
| 01.9 Locations | 2 |
| 01.10 Machines | 2 |
| 01.11 Production Lines | 2-3 |
| 01.12 Allergens | 1 |
| 01.13 Tax Codes | 1 |
| 01.14 Wizard Steps 2-6 | 2-3 |
| **TOTAL ADDED** | **+10-12 days** |

**Total MVP: ~15-18 days** (vs original 5-7 days)

---

## Risk Assessment

| Risk | If NOT Expanded | If Expanded |
|------|-----------------|-------------|
| Demo quality | "Dashboard only" - cannot show operations | Full E2E flow |
| Customer perception | "Incomplete product" | "Ready to use" |
| Onboarding promise | "15-min wizard" = 2-min form | Actual 15-min wizard |
| Cross-module deps | Epic 03-07 blocked | Unblocked |
| Food safety | No allergen validation | Compliant |

---

## Conclusion

**The current Phase 1A is a foundation, not an MVP.**

To deliver a **working system** (not just settings configuration):
1. Move infrastructure (01.8-01.11) into Phase 1A
2. Move allergens + tax codes (01.12-01.13) into Phase 1A
3. Complete the onboarding wizard (01.14)

**Phase 1B/2/3 become "polish and integrations" as originally intended.**

---

## Next Steps

1. Rewrite Epic 01 overview with new story index
2. Create stories 01.8 through 01.14 in `01-settings/` folder
3. Update story numbering to match Epic 02 pattern (01.1, 01.2... 01.14)
4. Update dependency graph in main PRD

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Initial analysis | Claude + Agents |
