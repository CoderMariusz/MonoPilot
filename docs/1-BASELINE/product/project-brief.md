# Project Brief: MonoPilot MES

| Field | Value |
|-------|-------|
| Document Version | 1.0 |
| Created | 2025-12-10 |
| Last Updated | 2025-12-10 |
| Status | Draft - Pending Sign-off |
| Author | PM-AGENT (based on Discovery Report v2) |

---

## Executive Summary

MonoPilot is a cloud-native Manufacturing Execution System (MES) purpose-built for small-to-medium food manufacturers (5-100 employees). The system addresses a critical market gap: food producers who have outgrown Excel-based tracking but cannot justify the cost, complexity, and 6-24 month implementation timelines of enterprise solutions like SAP or Dynamics 365.

**Value Proposition:** MonoPilot provides the essential MES functionality - production planning, traceability, inventory management, and quality control - with deployment measured in weeks rather than months, at a fraction of enterprise pricing. The system is designed for self-service configuration, eliminating the need for external consultants.

**Market Positioning:** Cloud-native, easy-deploy MES positioned between manual spreadsheet chaos and heavyweight enterprise ERP systems. Purpose-built for food industry compliance (traceability, allergens, lot tracking) while maintaining the simplicity SMBs require.

---

## Business Objectives

### Primary Objective
Capture the underserved Polish SMB food manufacturing market by providing an affordable, rapidly deployable MES solution that meets regulatory requirements without enterprise complexity.

### Secondary Objectives
1. **EU Expansion** - Extend to DACH region (Germany, Austria, Switzerland) and broader EU market post-Polish market validation
2. **Vertical Depth** - Become the recognized MES leader for food manufacturing SMBs through purpose-built features (allergens, traceability, HACCP support)
3. **Platform Revenue** - Build recurring SaaS revenue model with high customer retention through integration stickiness

### Success Metrics (12-Month Targets)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Paying Customers | 100 | CRM tracking |
| Monthly Recurring Revenue (MRR) | $25,000 | Stripe dashboard |
| Customer Acquisition Cost (CAC) | < $500 | Marketing spend / new customers |
| Net Promoter Score (NPS) | > 40 | Quarterly surveys |
| Uptime | 99.5%+ | Monitoring tools |
| Traceability Query Time | < 30 seconds | Performance monitoring |
| Onboarding Time | < 2 weeks | Customer success tracking |
| Churn Rate | < 5% monthly | Subscription analytics |

---

## Target Users

### Primary Personas

#### 1. Production Operator (Frontline Worker)
- **Profile:** Shop floor worker operating production lines
- **Key Tasks:** Material consumption, production output recording, label printing, stock movements
- **Tools Used:** Dedicated scanners (Zebra, Honeywell), mobile devices, Zebra label printers
- **Pain Points:** Paper-based tracking errors, manual data entry, unclear production status
- **Success Criteria:** Complete production tasks with scanner in < 30 seconds per operation

#### 2. Production Manager (Supervisor)
- **Profile:** Mid-level manager overseeing daily production operations
- **Key Tasks:** Work order monitoring, yield tracking, quality approvals, shift reporting
- **Tools Used:** Desktop dashboard, tablet for floor walks
- **Pain Points:** No real-time visibility, Excel report consolidation, delayed issue detection
- **Success Criteria:** Real-time dashboard showing all WO status, automated alerts for deviations

#### 3. Quality Manager (QA Specialist)
- **Profile:** Responsible for food safety compliance, audits, and quality control
- **Key Tasks:** QA holds, NCR management, specification testing, CoA verification, traceability
- **Tools Used:** Desktop application, quality testing equipment integration
- **Pain Points:** Manual traceability (hours during audits), paper-based quality records
- **Success Criteria:** Trace any product through entire supply chain in < 30 seconds

#### 4. Warehouse Operator
- **Profile:** Handles receiving, putaway, picking, and shipping
- **Key Tasks:** GRN processing, stock movements, FIFO/FEFO picking, shipping preparation
- **Tools Used:** Mobile scanner, forklift-mounted terminal
- **Pain Points:** Manual inventory counts, FIFO violations, lost materials
- **Success Criteria:** 100% inventory accuracy through LP-based tracking

### Secondary Personas

| Role | Description | Primary Modules |
|------|-------------|-----------------|
| Plant Manager | Small operation owner/GM, needs KPI dashboards | All modules (read-only) |
| Planner | Creates POs, WOs, schedules production | Planning |
| Purchaser | Manages supplier orders and receipts | Planning, Warehouse |
| Admin | System configuration, user management | Settings |

---

## Scope Definition

### In Scope (MVP - Phase 1)

| Module | Epic | Description | Priority |
|--------|------|-------------|----------|
| **Settings** | 1 | Organization setup, users, warehouses, machines, production lines, allergens, tax codes | Must Have |
| **Technical** | 2 | Products, BOMs, routings, allergen management, traceability foundation | Must Have |
| **Planning** | 3 | Purchase orders, transfer orders, work orders, supplier management | Must Have |
| **Production** | 4 | WO execution, material consumption, outputs, yield tracking, scanner workflows | Must Have |
| **Warehouse** | 5 | License plates, GRN, stock movements, FIFO/FEFO, scanner receive/pick/move | Must Have |
| **Quality** | 6 | QA status, holds, specifications, NCR, CoA management | Should Have |
| **Shipping** | 7 | Sales orders, picking, packing, shipments, carrier integration | Should Have |

### Out of Scope (Phase 2+)

| Module | Epic | Description | Planned Phase | Rationale |
|--------|------|-------------|---------------|-----------|
| **NPD** | 8 | New Product Development, stage-gate, trial BOMs | Phase 2 | Enterprise feature, not MVP-critical |
| **Finance** | 9 | Cost variance, margins, accounting export (NOT full GL/AR/AP) | Phase 2 | Integrate with existing accounting systems |
| **OEE** | 10 | Overall Equipment Effectiveness, machine performance | Phase 3 | Requires shop floor data integration |
| **Integrations** | 11 | Comarch Optima, EDI, customer/supplier portals | Phase 3 | Post-MVP enhancement |
| **Multi-Site** | - | Multiple warehouse/plant locations under one org | Phase 3 | SMB focus is single-site |
| **AI/ML Features** | - | Demand forecasting, anomaly detection | Phase 4+ | Avoid "me too" AI |
| **Full ERP** | - | General ledger, accounts receivable/payable, HR | Never | Not core MES, integrate externally |

### Exclusions (Never)
- **On-premise deployment** - Cloud-only SaaS model
- **Full accounting module** - Integrate with Comarch, Sage, wFirma
- **HR/Payroll** - Out of scope, separate domain
- **CRM** - Integrate with existing CRM systems
- **Custom development per customer** - Product-led, not project-led

---

## Key Constraints

### Technical Constraints

| Constraint | Description | Impact |
|------------|-------------|--------|
| **Cloud-Only** | No on-premise deployment option | Excludes customers requiring local data |
| **Multi-Tenant Architecture** | All customers share infrastructure (isolated by RLS) | Security audit required before launch |
| **Supabase Dependency** | PostgreSQL + Auth + Storage on Supabase | Vendor lock-in, migration complexity |
| **Service Role Pattern** | All DB queries via service role with manual org_id filtering | Security risk if filtering missed |

### Business Constraints

| Constraint | Description | Impact |
|------------|-------------|--------|
| **Pricing Ceiling** | Freemium + $50/user/month target | Must compete on value vs enterprise |
| **Language Support** | Polish + English only for MVP | Limits EU expansion until Phase 2 |
| **Team Size** | Small development team (assumed 3-5) | Feature velocity limited |
| **No External Funding** | Bootstrapped/self-funded (assumed) | Growth pace constrained |

### Regulatory Constraints

| Requirement | Description | Current Status |
|-------------|-------------|----------------|
| **Traceability** | Forward/backward trace in < 30 seconds | Implemented (LP genealogy) |
| **Lot Tracking** | Track batches through entire process | Implemented (LP-based) |
| **Allergen Management** | EU14 + custom allergens | Implemented |
| **Audit Trail** | Who/what/when for all changes | Implemented (all tables) |
| **HACCP/CCP** | Critical Control Point monitoring | Phase 2 (Quality module) |
| **GS1 Compliance** | GTIN, GS1-128 barcode standards | Phase 2 (partial now) |

---

## Competitive Positioning

### Market Analysis Summary

| Competitor | Target Market | Deployment | Pricing | MonoPilot Advantage |
|------------|--------------|------------|---------|---------------------|
| **AVEVA MES** | Enterprise (100M+ revenue) | 6-18 months | $500K+ | 10x faster deployment |
| **Plex** | Mid-to-Large | 3-12 months | $3K+/month | 6x cheaper |
| **Aptean Food ERP** | Mid-market | 3-12 months | $100K+ | Modern UX, self-service |
| **CSB-System** | Food industry | 6-18 months | $100K+ | Cloud-native, affordable |
| **Excel/Manual** | All sizes | Immediate | Free | Integration, traceability |

### MonoPilot Differentiators

1. **Deployment Speed** - Weeks vs months (self-service onboarding wizard)
2. **Modern UX** - Next.js 15 + React 19 vs legacy systems
3. **Affordable Pricing** - Freemium + $50/user/mo vs $100K+ implementations
4. **Food-Specific** - Purpose-built allergens, traceability, lot tracking
5. **No Consultants Required** - Toggle-based configuration vs IT dependency
6. **Polish Market Focus** - Native language, local compliance knowledge

### Feature Coverage (vs Competitors)

| Category | MonoPilot | Industry Average |
|----------|-----------|------------------|
| Core MES | 90% | 97% |
| Food-Specific | 75% | 88% |
| Ease of Use | 95% | 61% |
| Deployment Speed | 100% | 48% |
| SMB Affordability | 100% | 40% |
| **Overall** | **82%** | **67%** |

---

## Technical Summary

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript | Modern SSR, excellent DX |
| **UI Components** | TailwindCSS, ShadCN UI (Radix) | Rapid development, accessibility |
| **Backend** | Next.js API Routes + Service Layer | Unified codebase, type safety |
| **Database** | PostgreSQL via Supabase | Managed service, RLS support |
| **Auth** | Supabase Auth (JWT) | Integrated with DB, multi-tenant |
| **Storage** | Supabase Storage | CoA files, attachments |
| **Cache** | Upstash Redis | Session, frequent queries |
| **Email** | SendGrid | Transactional emails, invitations |
| **Testing** | Vitest (unit), Playwright (e2e) | Modern test frameworks |

### Database Summary

- **43 tables** across 7 implemented modules
- **~100 RLS policies** for multi-tenant isolation
- **42 migrations** applied
- **Key patterns:** LP-based inventory, BOM snapshots, audit trails

### Integration Points

| Integration | Status | Phase |
|-------------|--------|-------|
| Zebra Printers (ZPL) | In Progress | MVP |
| Supabase Auth | Complete | MVP |
| SendGrid Email | Complete | MVP |
| Comarch Optima | Planned | Phase 3 |
| EDI (EDIFACT) | Planned | Phase 3 |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **RLS Security Gap** | Medium | High | Automated tests for org_id filtering, security audit before launch |
| **Print Integration Delays** | Medium | High | ZPL library selection, hardware testing lab |
| **SMB Market Unwilling to Pay** | Medium | Medium | Freemium tier, ROI calculator, pilot programs |
| **Competitor SMB Tier Launch** | Low | High | First-mover advantage, lock-in via integrations |
| **Single-Person Dev Risk** | Medium | High | Documentation, code reviews, architecture decisions |
| **Supabase Vendor Lock-in** | Low | Medium | Standard PostgreSQL, migration path documented |

---

## Success Criteria for MVP Launch

### Functional Criteria
- [ ] All Epic 1-5 features working (Settings, Technical, Planning, Production, Warehouse)
- [ ] Print integration functional (ZPL to Zebra printers)
- [ ] Scanner workflows complete (receive, pick, move, consume, output)
- [ ] Traceability query < 30 seconds end-to-end
- [ ] No critical/high severity bugs open

### Non-Functional Criteria
- [ ] Uptime > 99.5% over 30-day period
- [ ] Page load P95 < 2 seconds
- [ ] Mobile scanner UX validated with 3+ test users
- [ ] Security audit passed (RLS, auth, data isolation)
- [ ] DR procedure documented and tested

### Business Criteria
- [ ] 3+ pilot customers deployed
- [ ] Onboarding completed in < 2 weeks per customer
- [ ] Pricing page live with self-service signup
- [ ] Basic documentation/help center available

---

## Stakeholder Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | _________________ | [ ] Approved | __________ |
| Technical Lead | _________________ | [ ] Approved | __________ |
| QA Lead | _________________ | [ ] Approved | __________ |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-10 | PM-AGENT | Initial version based on Discovery Report v2 |

---

## References

| Document | Location |
|----------|----------|
| Discovery Report | `docs/0-DISCOVERY/DISCOVERY-REPORT.md` |
| Feature Gap Analysis | `docs/0-DISCOVERY/FEATURE-GAP-ANALYSIS.md` |
| PRD Index | `docs/1-BASELINE/product/prd.md` |
| Database Schema | `.claude/TABLES.md` |
| Code Patterns | `.claude/PATTERNS.md` |
