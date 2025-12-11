# MonoPilot Architecture Documentation

## Version
- **Date**: 2025-12-10
- **Status**: Phase 3 Complete
- **Coverage**: 11 Modules, 43 Tables, 99 API Endpoints

---

## Overview

Architecture documentation for MonoPilot MES system - a cloud-native Manufacturing Execution System for food manufacturing. This repository contains system architecture, technical decisions, module specifications, and integration patterns.

**Target Audience**: Developers, architects, technical stakeholders

---

## Document Structure

### Core Architecture Documents

| Document | Purpose | Last Updated | Status |
|----------|---------|--------------|--------|
| [system-overview.md](./system-overview.md) | High-level architecture, tech stack, patterns | 2025-12-10 | Complete |
| [tech-debt.md](./tech-debt.md) | Technical debt inventory and remediation plan | 2025-12-10 | Complete |
| [integration-map.md](./integration-map.md) | External integrations and data flows | 2025-12-10 | Complete |

### Module Architecture

Detailed architecture for each of the 11 modules:

| Module | Epic | Document | PRD Lines | Code Status |
|--------|------|----------|-----------|-------------|
| Settings | 1 | [modules/settings.md](./modules/settings.md) | 703 | Needs Documentation |
| Technical | 2 | [modules/technical.md](./modules/technical.md) | 772 | Needs Documentation |
| Planning | 3 | [modules/planning.md](./modules/planning.md) | 2,793 | Needs Documentation |
| Production | 4 | [modules/production.md](./modules/production.md) | 1,328 | Needs Documentation |
| Warehouse | 5 | [modules/warehouse.md](./modules/warehouse.md) | 1,147 | Needs Documentation |
| Quality | 6 | [modules/quality.md](./modules/quality.md) | 731 | Needs Documentation |
| Shipping | 7 | [modules/shipping.md](./modules/shipping.md) | 1,345 | Needs Documentation |
| NPD | 8 | [modules/npd.md](./modules/npd.md) | 1,004 | Needs Documentation |
| Finance | 9 | [modules/finance.md](./modules/finance.md) | 892 | Needs Documentation |
| OEE | 10 | [modules/oee.md](./modules/oee.md) | 914 | Needs Documentation |
| Integrations | 11 | [modules/integrations.md](./modules/integrations.md) | 1,647 | Needs Documentation |

See [modules/README.md](./modules/README.md) for module architecture overview.

### Architecture Decision Records (ADRs)

Key architectural decisions with rationale and implementation:

| ADR | Title | Date | Status |
|-----|-------|------|--------|
| [ADR-001](./decisions/ADR-001-license-plate-inventory.md) | License Plate Inventory Model | 2025-12-10 | Accepted |
| [ADR-002](./decisions/ADR-002-bom-snapshot-pattern.md) | BOM Snapshot Pattern | 2025-12-10 | Accepted |
| [ADR-003](./decisions/ADR-003-multi-tenancy-rls.md) | Multi-Tenancy RLS | 2025-12-10 | Accepted |
| ADR-004 | GS1 Barcode Compliance | TBD | Proposed |
| ADR-005 | FIFO/FEFO Picking Strategy | TBD | Proposed |
| ADR-006 | Scanner-First Mobile UX | TBD | Proposed |
| ADR-007 | Work Order State Machine | TBD | Proposed |
| ADR-008 | Audit Trail Strategy | TBD | Proposed |
| ADR-009 | API Versioning Strategy | TBD | Proposed |
| ADR-010 | Caching Strategy (Redis) | TBD | Proposed |

---

## Quick Reference

### Tech Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15.5 + React 19 | App framework, SSR |
| UI | ShadCN UI + TailwindCSS | Component library |
| Backend | Supabase | PostgreSQL + Auth + RLS |
| Validation | Zod | Runtime validation |
| Testing | Vitest + Playwright | Unit + E2E tests |
| Hosting | Vercel | Edge deployment |

### Key Architectural Patterns

1. **Multi-Tenancy**: RLS-enforced org_id isolation
2. **License Plate (LP)**: Atomic inventory tracking
3. **BOM Snapshot**: Immutable work order recipes
4. **API Routes**: `/api/{module}/{resource}/{id}/{action}`
5. **Service Layer**: Business logic in `lib/services/*-service.ts`

### Database Overview

- **43 tables** across 11 modules
- **~100 RLS policies** for tenant isolation
- **42 migrations** in supabase/migrations/
- Full schema reference: [../../.claude/TABLES.md](../../.claude/TABLES.md)

---

## Cross-References

### Related Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| PRD Index | [../product/prd.md](../product/prd.md) | Product requirements |
| Module PRDs | [../product/modules/](../product/modules/) | Detailed module specs |
| Database Schema | [../../.claude/TABLES.md](../../.claude/TABLES.md) | Table definitions |
| Code Patterns | [../../.claude/PATTERNS.md](../../.claude/PATTERNS.md) | Coding conventions |
| Project State | [../../.claude/PROJECT-STATE.md](../../.claude/PROJECT-STATE.md) | Current status |

### External References

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- GS1 Standards: https://www.gs1.org/standards
- FSMA Compliance: https://www.fda.gov/food/food-safety-modernization-act-fsma

---

## Module Dependencies

```
                    Settings (Epic 1)
                         |
                    Technical (Epic 2)
                         |
         +---------------+---------------+
         |                               |
    Planning (Epic 3)              Warehouse (Epic 5)
         |                               |
   Production (Epic 4)             Quality (Epic 6)
         |                               |
      OEE (Epic 10)               Shipping (Epic 7)
                                         |
                                   Finance (Epic 9)

  Integrations (Epic 11) - connects to all modules
  NPD (Epic 8) - connects to Technical
```

---

## Development Roadmap

### Current Phase: Implementation (Phase 3)

| Module | Status | Completion |
|--------|--------|------------|
| Settings | Code ~80% | 🟢 Active |
| Technical | Code ~80% | 🟢 Active |
| Planning | Code ~70% | 🟢 Active |
| Production | Code ~60% | 🟢 Active |
| Warehouse | Planned | 🔴 Not Started |
| Quality | Planned | 🔴 Not Started |
| Shipping | Planned | 🔴 Not Started |

### Next Milestones

1. **Week 1-2**: Complete Production module (Epic 4)
2. **Week 3-4**: Start Warehouse module (Epic 5)
3. **Week 5-8**: Quality module (Epic 6)
4. **Week 9-12**: Shipping module (Epic 7)

---

## How to Use This Documentation

### For New Developers

1. Start with [system-overview.md](./system-overview.md) - understand the high-level architecture
2. Review [ADR-001](./decisions/ADR-001-license-plate-inventory.md), [ADR-002](./decisions/ADR-002-bom-snapshot-pattern.md), [ADR-003](./decisions/ADR-003-multi-tenancy-rls.md) - core patterns
3. Read module architecture for your area (e.g., [modules/production.md](./modules/production.md))
4. Check [tech-debt.md](./tech-debt.md) for known issues

### For Architects

1. Review all ADRs in [decisions/](./decisions/)
2. Study [integration-map.md](./integration-map.md) for system boundaries
3. Check module dependencies and data flows
4. Review tech debt inventory for systemic issues

### For Product Managers

1. See [../product/prd.md](../product/prd.md) for feature roadmap
2. Use [system-overview.md](./system-overview.md) for technical context
3. Review module architecture for implementation feasibility

---

## Maintenance

### Update Schedule

- **ADRs**: When major architectural decisions are made
- **Module Docs**: When module implementation changes significantly
- **Tech Debt**: Weekly review (P0/P1), monthly full review
- **Integration Map**: When new integrations are added

### Contributors

- Architecture Team: Core architecture decisions
- Module Leads: Module-specific documentation
- Tech Writers: Documentation quality and consistency

---

## Document Status Legend

| Status | Meaning |
|--------|---------|
| Complete | Fully documented, up-to-date |
| Partial | Some documentation exists, needs updates |
| Needs Documentation | No documentation yet, needed |
| Proposed | Planned but not yet implemented |
| Deprecated | No longer in use |

---

## Questions or Suggestions?

For architecture questions or documentation improvements:
1. Check existing ADRs and module docs
2. Review related PRDs
3. Consult with Architecture Team

---

**Last Updated**: 2025-12-10
**Next Review**: 2025-12-17
