# Quality Module - Agent Brief

**Epic 06 - Quality Management System**
**Date:** 2025-12-16
**Orchestrator:** Multi-wave analysis with architect review

---

## Mission

Analyze Epic 06 (Quality Module) and create production-ready stories following the Epic 02 MVP dependency analysis pattern. The goal is to:

1. Define MVP scope (Phase 1, 2, 3)
2. Identify all dependencies (Settings, Technical, Planning, Production, Warehouse)
3. Break down 27 functional requirements into implementable stories
4. Ensure food safety compliance (HACCP, FDA 21 CFR Part 11)
5. Create detailed story specifications with context YAML files

---

## Module Overview

**Purpose:** Food safety and quality management supporting:
- Multi-stage inspections (Incoming/In-Process/Final)
- HACCP/CCP critical control point management
- NCR (Non-Conformance Report) and CAPA workflows
- Certificate of Analysis (CoA) generation
- Supplier quality tracking
- Complete audit trail for regulatory compliance

**Complexity:** HIGH - Regulatory compliance, multi-stage workflows, real-time monitoring

---

## PRD Analysis

**Total Functional Requirements:** 27 (FR-QA-001 to FR-QA-026)

### Phase Breakdown (from PRD)

**Phase 1: Core Quality (Weeks 1-4)**
- FR-QA-001: Quality Status Management
- FR-QA-002: Quality Hold Management
- FR-QA-003: Product Specifications
- FR-QA-004: Test Templates & Recording
- FR-QA-005: Incoming Inspection
- FR-QA-006: In-Process Inspection (Basic)
- FR-QA-007: Final Inspection (Basic)

**Phase 2: In-Process & Final (Weeks 5-8)**
- FR-QA-006: In-Process Inspection (Full)
- FR-QA-007: Final Inspection (Full)
- FR-QA-008: Sampling Plans (AQL)
- FR-QA-009: NCR Creation & Workflow
- FR-QA-010: Batch Release Approval
- FR-QA-025: Scanner Integration
- FR-QA-026: Operation Quality Checkpoints

**Phase 3: HACCP & Advanced (Weeks 9-12)**
- FR-QA-011: CoA Generation
- FR-QA-012: CoA Templates
- FR-QA-013: HACCP Plan Setup
- FR-QA-014: CCP Monitoring
- FR-QA-015: CCP Deviation Alerts
- FR-QA-016: CAPA Creation
- FR-QA-017: CAPA Workflow & Effectiveness
- FR-QA-024: Document Control & Versioning

**Phase 4: Supplier & Analytics (Weeks 13-16)**
- FR-QA-018: Supplier Quality Rating
- FR-QA-019: Supplier Audits
- FR-QA-020: Quality Dashboard
- FR-QA-021: Audit Trail Reports
- FR-QA-022: Quality Analytics
- FR-QA-023: Retention Sample Management

---

## Architecture Summary

**Database Tables:** 28 tables across 7 categories
1. Core Quality: specifications, inspections, test results, holds
2. NCR & CAPA: reports, workflow, actions, effectiveness
3. CoA: templates, documents, parameters
4. Sampling: plans, records
5. HACCP: plans, CCPs, monitoring, deviations
6. Supplier: ratings, audits, findings
7. Audit: trail, document versions, retention samples

**API Endpoints:** ~70 endpoints across 10 categories

**Key Patterns:**
- Multi-stage inspections (incoming → in-process → final)
- NCR workflow state machine
- HACCP CCP real-time monitoring with alerts
- Immutable audit trail (FDA 21 CFR Part 11)
- RLS on all tables

---

## Dependency Map

### Hard Dependencies (REQUIRED)

| From Epic | Feature | Why Required |
|-----------|---------|--------------|
| Epic 01.1 | Org + RLS | Multi-tenancy foundation |
| Epic 01.5 | Users | Inspectors, QA Manager assignments |
| Epic 01.6 | Roles | QA Inspector, QA Manager, Quality Director |
| Epic 02.1 | Products | Specifications linked to products |
| Epic 03 (Planning) | PO | Incoming inspection trigger |
| Epic 04 (Production) | WO | In-process/final inspection, CCP monitoring |
| Epic 05 (Warehouse) | License Plates | Quality holds apply to LPs |

### Soft Dependencies (OPTIONAL)

| From Epic | Feature | Usage |
|-----------|---------|-------|
| Epic 01.8 | Warehouses | Supplier delivery location |
| Epic 01.9 | Locations | Retention sample storage |
| Epic 01.10 | Machines | Equipment calibration tracking |
| Epic 02.7 | Routings | Operation checkpoints (FR-QA-026) |
| Epic 03 (Planning) | Suppliers | Supplier quality rating |

---

## Agent Wave Plan

### Wave 1: Foundation Analysis (4 agents)
1. **Dependency-Analyzer**: Map all dependencies (Settings, Technical, Planning, Production, Warehouse)
2. **Database-Schema-Analyzer**: Review 28 tables, identify RLS requirements
3. **Core-Workflow-Analyzer**: Inspections (incoming/in-process/final) + holds
4. **Specs-Test-Analyzer**: Specifications, test parameters, test results

### Wave 2: Advanced Workflows (4 agents)
5. **NCR-CAPA-Analyzer**: NCR lifecycle, workflow, CAPA integration
6. **HACCP-CCP-Analyzer**: HACCP plans, CCPs, monitoring, deviations
7. **CoA-Analyzer**: CoA generation, templates, PDF creation
8. **Sampling-Analyzer**: Sampling plans (AQL), records

### Wave 3: Integrations & Features (4 agents)
9. **Supplier-Quality-Analyzer**: Ratings, audits, findings
10. **Operation-Checkpoints-Analyzer**: FR-QA-026 (new from Technical)
11. **Dashboard-Analytics-Analyzer**: KPIs, reports, audit trail
12. **Compliance-Analyzer**: FDA 21 CFR Part 11, e-signatures, retention

### Wave 4: Architect Review & Consolidation (1 agent)
13. **Architect-Agent**: Review all findings, validate MVP scope, identify gaps

---

## Expected Outputs (Per Agent)

Each agent should produce:

1. **Dependency Analysis**
   - Hard dependencies (system breaks without)
   - Soft dependencies (works with limitations)
   - Deferred dependencies (future phases)

2. **Story Breakdown**
   - Recommended stories (name, complexity, priority)
   - Story grouping (which stories form a complete feature)
   - MVP vs enhancement split

3. **Technical Specifications**
   - Database tables/migrations needed
   - API endpoints required
   - Service layer requirements
   - Validation rules

4. **Risk Assessment**
   - Regulatory compliance risks
   - Performance bottlenecks
   - Integration risks
   - Data migration concerns

5. **Recommendations**
   - MVP scope suggestions
   - Phase assignments (1, 2, 3)
   - Story sequencing
   - Testing requirements

---

## Story Template

Use this structure for story recommendations:

```
## Story 06.X - [Feature Name]

**Priority:** P0/P1/P2
**Phase:** 1/2/3
**Complexity:** S/M/L/XL
**Estimate:** X-Y days
**PRD FRs:** FR-QA-XXX, FR-QA-YYY

### Dependencies
- **Required:** Epic 01.1 (Org+RLS), Epic 02.1 (Products)
- **Optional:** Epic 01.10 (Machines for equipment tracking)
- **Deferred:** None

### Creates
- **Tables:** quality_xxx, quality_yyy
- **API:** 5 endpoints (GET/POST/PUT)
- **Services:** quality-xxx-service.ts
- **Pages:** /quality/xxx/*

### User Stories
- As a QA Inspector, I can...
- As a QA Manager, I can...

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Technical Notes
- RLS policy on all tables
- Audit trail required
- Real-time alerts on failures
```

---

## Success Criteria

**For Wave Analysis:**
- All 27 FRs analyzed
- Dependencies mapped (hard/soft/deferred)
- Stories recommended (15-25 stories expected)
- MVP scope validated

**For Final Report:**
- Production-ready story files created
- Context YAML files for each story
- MVP dependency analysis document (like Epic 02)
- Architect sign-off

---

## Key Questions to Answer

1. **MVP Scope:** Can Quality MVP launch with just Phase 1 (Core Quality)?
2. **Dependencies:** Can inspections work without full WO completion workflow?
3. **HACCP Timing:** Is HACCP Phase 3 or can basics be in Phase 2?
4. **Compliance:** What's minimum for FDA 21 CFR Part 11 in MVP?
5. **Scanner:** Is mobile scanner Phase 1 or Phase 2?
6. **Operation Checkpoints:** FR-QA-026 - Phase 1 or Phase 2?

---

## References

- **PRD:** `/docs/1-BASELINE/product/modules/quality.md` (850 lines)
- **Architecture:** `/docs/1-BASELINE/architecture/modules/quality.md` (1138 lines)
- **Epic 02 Template:** `/docs/2-MANAGEMENT/epics/current/02-technical/MVP-DEPENDENCY-ANALYSIS.md`
- **Epic 01 Template:** `/docs/2-MANAGEMENT/epics/current/01-settings/MVP-DEPENDENCY-ANALYSIS.md`

---

**Brief Status:** READY FOR WAVE 1
**Next:** Launch 4 agents (Dependency, Database, Core-Workflow, Specs-Test)
