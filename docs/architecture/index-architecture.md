# MonoPilot Architecture

## Overview

MonoPilot is a modular Manufacturing Execution System (MES) designed for **all manufacturers**, with food manufacturing as the initial focus. The architecture prioritizes:

- **Multi-tenancy** with strong data isolation
- **Configurability** via settings toggles for industry-specific features
- **Modularity** for focused epic development
- **Scalability** from SMB to Enterprise

## Architecture Documents

### Core Architecture
| Document | Description |
|----------|-------------|
| [Infrastructure](./patterns/infrastructure.md) | Hosting, deployment, caching |
| [Database](./patterns/database.md) | Multi-tenancy, versioning, indexing |
| [API](./patterns/api.md) | REST patterns, validation, integrations |
| [Frontend](./patterns/frontend.md) | Next.js, state management, components |
| [Security](./patterns/security.md) | Auth, authorization, data protection |
| [Scanner](./patterns/scanner.md) | PWA, offline, mobile UX |

### Module Architecture
| Module | Description | Dependencies |
|--------|-------------|--------------|
| [Settings](./modules/settings.md) | Organization config, feature flags | None |
| [Technical](./modules/technical.md) | Products, BOMs, Routings, Specs | Settings |
| [Planning](./modules/planning.md) | PO, TO, WO, scheduling | Technical |
| [Production](./modules/production.md) | Execution, yield, OEE | Planning |
| [Warehouse](./modules/warehouse.md) | LP, ASN, stock moves | Production |
| [Quality](./modules/quality.md) | Specs, NCR, CoA, SPC | Warehouse |
| [Shipping](./modules/shipping.md) | Picking, packing, carriers | Quality |

## Key Architecture Decisions (ADR Summary)

### ADR-001: Multi-Tenant Strategy
**Decision**: Single Supabase project for standard tenants, dedicated database for Enterprise customers.
**Rationale**: Cost-effective for SMB while providing isolation guarantees for enterprise compliance needs.

### ADR-002: Industry Abstraction
**Decision**: All industry-specific features (allergens, CoA, hazmat) controlled via settings toggles.
**Rationale**: Enables same codebase for food, pharma, electronics, etc. by enabling/disabling relevant features per organization.

### ADR-003: REST API with Future GraphQL Option
**Decision**: Continue REST pattern, structure code for easy GraphQL migration later.
**Rationale**: REST is simpler for MVP, team familiar with pattern. GraphQL benefits (reduced over-fetching) more valuable at scale.

### ADR-004: PWA Scanner with Native Roadmap
**Decision**: Web-based scanner for MVP, React Native in Phase 3.
**Rationale**: Faster MVP delivery, single codebase. Native apps add offline reliability and hardware integration.

### ADR-005: Module-Level Permissions
**Decision**: RBAC at module level (not entity or field level).
**Rationale**: Balance between flexibility and complexity. Custom roles supported for organization-specific needs.

### ADR-006: Optimistic Updates for Key Operations
**Decision**: LP moves, WO status, PO status, receiving, delivery use optimistic updates.
**Rationale**: Immediate UI feedback critical for warehouse/production floor efficiency.

### ADR-007: Soft Delete Per Table
**Decision**: Soft delete (`deleted_at`) configured per table based on audit requirements.
**Rationale**: Some tables need full history (WO, LP), others can hard delete (temp data).

### ADR-008: 12-Month Data Archival
**Decision**: Archive data older than 12 months (configurable per tenant).
**Rationale**: Balance between query performance and historical access. Archived data queryable via separate endpoint.

## Technology Stack

### Core Stack
| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Frontend | Next.js | 15 | App Router, Server Components |
| UI Framework | React | 19 | Concurrent features |
| Styling | Tailwind CSS | 3.4 | With Shadcn/UI components |
| Language | TypeScript | 5.7 | Strict mode |
| Database | PostgreSQL | 15 | Via Supabase |
| Auth | Supabase Auth | - | JWT sessions |
| State | SWR | - | Data fetching, caching |
| Forms | React Hook Form | - | With Zod validation |
| Testing | Playwright, Vitest | - | E2E + Unit |

### Infrastructure
| Service | Provider | Phase | Notes |
|---------|----------|-------|-------|
| Hosting | Vercel | MVP | Docker self-host option later |
| Database | Supabase | MVP | Read replicas enabled |
| Caching | Upstash Redis | MVP | Product, BOM lookups |
| Email | SendGrid | MVP | Transactional emails |
| Logging | Vercel + External | MVP | Structured JSON |
| Error Tracking | Sentry | Phase 3 | With user feedback |
| APM | TBD | Phase 3 | Performance monitoring |
| Analytics | PostHog | Phase 4-5 | Product analytics |

### Phase Roadmap
| Phase | Key Additions |
|-------|---------------|
| MVP | Core modules, REST API, PWA scanner, Shadcn UI |
| Phase 2 | Edge Functions, ML features |
| Phase 3 | React Native, SSO/SAML, GDPR, Sentry |
| Phase 4 | Complex state (Zustand), custom workflows, white-label |
| Phase 5 | Advanced analytics, marketplace consideration |

## Module Dependencies

```
Settings (Foundation)
    │
    ├── Technical
    │       │
    │       ├── Planning
    │       │       │
    │       │       ├── Production
    │       │       │       │
    │       │       │       ├── Warehouse
    │       │       │       │       │
    │       │       │       │       ├── Quality
    │       │       │       │       │       │
    │       │       │       │       │       └── Shipping
    │       │       │       │       │
    │       │       │       │       └── Scanner (cross-cutting)
    │       │       │       │
    │       │       │       └── NPD (Premium, parallel to Production)
    │       │       │
    │       │       └── Finance (Premium, parallel to Planning)
```

## Cross-Cutting Concerns

### Implemented in All Modules
1. **Multi-tenancy**: `org_id` + RLS on all business tables
2. **Audit Trail**: `created_by`, `updated_by`, timestamps
3. **Validation**: Zod schemas (client + server)
4. **Error Handling**: RFC 7807 Problem Details format
5. **Rate Limiting**: Per organization
6. **i18n**: English + Polish, org-level setting

### Testing Requirements
| Type | Coverage Target | Scope |
|------|-----------------|-------|
| Unit | 95% | API classes, utilities, hooks |
| Integration | 70% | API endpoints |
| E2E | Comprehensive | All user flows |
| Visual | Yes | Chromatic regression |

### Environments
| Environment | Database | Purpose |
|-------------|----------|---------|
| Development | Dedicated | Local dev, feature branches |
| Staging | Dedicated | QA, integration testing |
| Production | Dedicated | Live system |

## Non-Functional Requirements

### Performance
- Dashboard load: <500ms (p95)
- API response: <200ms (p95) for reads
- Scanner operations: <100ms local, <300ms with sync
- Real-time updates: <1s propagation

### Scalability
- 1000+ concurrent users per tenant
- 100,000+ License Plates per tenant
- 10,000+ Work Orders per month
- 500 active NPD projects (premium)

### Availability
- 99.9% uptime SLA
- Graceful degradation for non-critical features
- Offline viewing for Scanner PWA

### Security
- WCAG AA accessibility
- RTL support for future markets
- Data encryption at rest (Supabase default)
- GDPR compliance (Phase 3)

## Getting Started

For developers working on specific modules:

1. Read the module's PRD: `docs/prd/modules/<module>.md`
2. Read the module's architecture: `docs/architecture/modules/<module>.md`
3. Review relevant patterns in `docs/architecture/patterns/`
4. Check existing implementation in `apps/frontend/`

## Document Maintenance

- Architecture documents updated when ADRs change
- Module architecture updated when PRD changes
- Pattern documents updated when cross-cutting concerns evolve
- Version controlled with main codebase
