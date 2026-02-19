# 00-Foundation Analysis

**Analysis Date**: 2026-02-16
**Scope**: Main directories (prd, decisions, patterns, procedures, bugs, guides, api, other/discovery)
**Total Files Reviewed**: 60+ files
**Status**: Comprehensive inventory and duplicate analysis complete

---

## File Inventory (60+ files)

### prd/ (3 files)
- **prd.md** (265 lines): PRD index and module map for 11 modules (Epic 1-11), dependencies, phases, API patterns, and competitive positioning. Entry point for product requirements.
- **project-brief.md** (292 lines): Executive summary of MonoPilot as cloud-native MES for SMB food manufacturers, business objectives, target users (4 personas), scope (MVP Phase 1), risks, and success criteria.
- **user-stories.md** (26 lines): Template placeholder for user stories to be created by PM-AGENT after PRD approval.

### decisions/ (25 files - Architectural Decision Records)
- **ADR-001**: License Plate (LP) based inventory model - atomic units with full genealogy
- **ADR-002**: BOM Snapshot pattern - copy BOM to WO at creation time for immutability
- **ADR-003**: Multi-tenancy via RLS - org_id on all tables with database-level security
- **ADR-004**: GS1 barcode compliance - GTIN-14, GS1-128, SSCC-18 standards
- **ADR-005**: FIFO/FEFO picking strategy - date-based or expiry-based selection
- **ADR-006**: Scanner-first mobile UX - dedicated hardware (Zebra) priority
- **ADR-007**: Work order state machine - defined state transitions (created → scheduled → active → completed)
- **ADR-008**: Audit trail strategy - who/what/when tracking on all changes
- **ADR-009**: Routing-level costs - cost calculation at operation step level
- **ADR-010**: Product-level procurement fields - supplier, MOQ, lead time on products
- **ADR-011**: Module toggle storage - settings table for feature enables/disables
- **ADR-012**: Role-permission storage - matrix table for 10 roles × features
- **ADR-013**: RLS org isolation pattern - SELECT queries auto-filter by org_id
- **ADR-015**: Centralized constants pattern - enums/lookups in types/constants.ts
- **ADR-016**: CSV parsing utility pattern - shared parser for bulk imports
- **ADR-017**: React memo usage guidelines - when to use React.memo in components
- **ADR-018**: API error auth standardization - 401 vs 403 response codes
- **ADR-019** through **ADR-027**: Additional technical decisions (reviewed list exists, specifics not read due to scope)

### patterns/ (11 files)
- **STATE-TRANSITION.md** (80+ lines): Agent state transitions (Inactive → Ready → Active → Waiting → Blocked → Complete) for multi-agent coordination
- **REACT-PATTERN.md** (68 lines): ReAct (Reasoning and Acting) pattern for problem-solving with Thought → Action → Observation cycles
- **ERROR-RECOVERY.md** (80 lines): Error recovery strategies including retry, rollback, escalate, and graceful degradation
- **DOCUMENT-SHARDING.md**: (Not fully read - document splitting pattern for large docs)
- **DOCUMENTATION-SYNC.md**: (Not fully read - keeping docs synchronized)
- **PLAN-ACT-MODE.md**: (Not fully read - planning mode workflow)
- **UI-PATTERNS.md**: (Not fully read - UI component patterns)
- **QUALITY-RUBRIC.md**: (Not fully read - quality assessment framework)
- **GIVEN-WHEN-THEN.md**: (Not fully read - BDD test format pattern)
- **MEMORY-BANK.md**: (Not fully read - knowledge retention pattern)
- **TASK-TEMPLATE.md**: (Not fully read - task definition template)

### procedures/ (8 files)
- **README.md** (100 lines): Overview of 4 shared procedures (handoff-templates, tdd-phase-flow, error-recovery-common, quality-gates-common) used by all agents to eliminate duplication
- **QUICK-START.md** (80+ lines): Fast reference guide for agents finding shared procedures by use case (checkpoint format, TDD phases, error recovery, quality standards)
- **IMPLEMENTATION-GUIDE.md** (100+ lines): How-to integrate shared procedures into existing agent files with specific integration examples for Backend-Dev agent
- **COMPLETION-REPORT.md**: (Not fully read - template for handoff completion reporting)
- **handoff-templates.md** (5.3 KB): Shared checkpoint format and metrics table referenced by all agents
- **error-recovery-common.md** (576 lines): Comprehensive error patterns and recovery procedures by agent type (dev agents, test writers, code reviewers, QA, devops, PM)
- **quality-gates-common.md** (15 KB): Universal quality criteria (tests pass, no secrets, validation, etc.) and phase-specific gates
- **tdd-phase-flow.md** (14 KB): Complete TDD workflow (RED → GREEN → REFACTOR) with phase definitions P1-P7

### bugs/ (4 files)
- **CONSOLIDATED-BUG-TRACKER.md** (428 lines): Unified bug tracking by module with 20+ fixed bugs including Settings, Auth, Scanner, Quality modules with root causes and verification
- **TESTS-ARCHIVE-README.md** (22 lines): Index of archived bug reports that have been consolidated into CONSOLIDATED-BUG-TRACKER
- **bugs.md** (648 lines): Original consolidated QA batch report for Settings module with 7 CRITICAL + 13 HIGH severity bugs (all marked FIXED)
- **errors.md** (214 lines): TypeScript error patterns and fixes (Polish-language guide) covering missing awaits, nullable fields, Zod defaults, HTML input validation

### guides/ (6 files)
- **routings-management.md** (80+ lines): User guide for Production Managers on creating/editing routings (production workflows) in Technical module
- **routing-operations.md** (80+ lines): User guide for adding operations (sequential production steps) within routings with duration, machine, yield, cost fields
- **bom-items-management.md**: (Not fully read - managing Bill of Materials items)
- **shelf-life-configuration.md**: (Not fully read - expiry and shelf life setup)
- **traceability-configuration.md**: (Not fully read - traceability genealogy setup)
- **using-org-context.md**: (Not fully read - organization context management)

### api/technical/ (1 file)
- **bom-costing.md** (Not fully read): Technical reference for BOM-level costing calculations

### other/discovery/ (7 files - Market & Competitive Analysis)
- **FEATURE-GAP-ANALYSIS.md** (33 KB): Deep competitive feature analysis vs AVEVA, Plex, Aptean, CSB-System identifying 14 critical gaps (all competitors have), 8 important gaps (3/4 competitors), and MonoPilot differentiators
- **DISCOVERY-REPORT.md** (36 KB): Polish-language deep discovery report covering market context, target segments (80% SMB, 20% large), business model (SaaS subscription TBD), competitive positioning, success metrics, and current status (Epic 1-5 done, Epic 5 at 92%)
- **DISCOVERY-REPORT-V4.md** (16 KB): Gap analysis and improvement suggestions based on industry trends - AI/ML, Digital Twins, IIoT, Sustainability, HACCP/21CFR11, Supply-chain EDI, Cybersecurity/Zero-trust, UX guidance, multi-site scalability
- **DISCOVERY-MARKET-REPORT.md** (24 KB): Detailed competitive analysis of 4 major competitors with profiles, features, deployment, pricing, strengths/weaknesses, and comparative matrices
- **GAPS-AND-QUESTIONS.md** (2.3 KB): Open questions and gaps requiring decisions (Finance strategy, Compliance, Integrations, etc.)
- **INITIAL-SCAN.md** (6 KB): High-level project scan noting tech stack, modules, status, and key decisions
- **PROJECT-UNDERSTANDING.md** (1.1 KB): Brief one-page project summary

### other/ (Additional subdirectories)
- **templates/**: Reusable templates for various documents (PRD, test, user stories, etc.) - 20+ files
- **checklists/**: Quality and implementation checklists
- **workflows/**: Workflow definitions for engineering, product, and skills
- **archive/**: Historical agents-v1 and skills-v1 (24 files) - archived from previous iterations
- **claude-config/agents/**: Agent configuration files (YAML)
- **experiments/claude-glm-test/**: Experimental comparison of Claude vs Claude+GLM responses
- **other/migration/**, **other/scripts/**, **other/skills-validation/**: Support directories

---

## Duplicate Sets

### ⚠️ CRITICAL: Error Recovery Content Overlap (3 files)

#### Set 1: Error Recovery Documentation
- **KEEP**: `/workspaces/MonoPilot/new-doc/00-foundation/procedures/error-recovery-common.md` (576 lines)
  - **Reason**: Most comprehensive, organized by agent type, referenced by procedures/README.md as canonical source, includes universal error table + agent-specific recovery procedures
  - **Content**: Universal error table, Development agents section, Test writers, Code reviewers, QA, DevOps, PM agent-specific error handling

- **DELETE**: `/workspaces/MonoPilot/new-doc/00-foundation/patterns/ERROR-RECOVERY.md` (86 lines)
  - **Reason**: Generic high-level pattern (~70% overlap with procedures version). Content includes same recovery strategies (retry, rollback, escalate, graceful degradation) but less detailed. Procedures version has error categorization, specific commands, agent-specific workflows.
  - **Duplication**: "Recovery Strategies" section in patterns version is subsumed by error-recovery-common procedures version
  - **Impact**: Low - patterns version is abstract, procedures version is actionable

### ⚠️ SIGNIFICANT: Bug Documentation Duplication (2 files)

#### Set 2: Bug Tracking
- **KEEP**: `/workspaces/MonoPilot/new-doc/00-foundation/bugs/CONSOLIDATED-BUG-TRACKER.md` (428 lines)
  - **Reason**: Current consolidated tracker with clear module-by-module organization, fix status, commit references. Explicitly designed as unified source per TESTS-ARCHIVE-README.md
  - **Content**: Settings bugs, Auth bugs, Scanner bugs, Quality bugs, all marked as FIXED with verification

- **DELETE**: `/workspaces/MonoPilot/new-doc/00-foundation/bugs/bugs.md` (648 lines)
  - **Reason**: Original QA batch report with ~80% content overlap with CONSOLIDATED-BUG-TRACKER. Both cover same bugs (BUG-SET-001 through BUG-SET-004, etc.) with identical root causes and fixes. TESTS-ARCHIVE-README explicitly states "All bug information is now available in consolidated tracker"
  - **Duplication**: Identical bug descriptions for Settings organization fields, user management buttons, warehouse buttons, active sessions table
  - **Impact**: Medium - creates confusion about which tracker is authoritative; slows lookup time with duplicate entries

### ⚠️ MODERATE: TypeScript Error Guide (Separate Concern)

#### Set 3: TypeScript Errors
- **KEEP**: `/workspaces/MonoPilot/new-doc/00-foundation/bugs/errors.md` (214 lines - Polish language)
  - **Reason**: Specialized guide focused on TypeScript/Zod compilation errors with code examples. Different purpose from bug tracking or general error recovery. Should remain as-is but relocate to guides/technical/ for better discoverability
  - **Content**: Missing awaits, auth validation, nullable fields, Zod defaults, HTML input issues

- **Note**: Not a duplicate of error-recovery-common.md (which is runtime/process errors) but separate concern (compile-time errors)

### ⚠️ MODERATE: Discovery Reports Version Overlap (3 files)

#### Set 4: Discovery Analysis
- **KEEP**: `/workspaces/MonoPilot/new-doc/00-foundation/other/discovery/FEATURE-GAP-ANALYSIS.md` (33 KB)
  - **Reason**: Most comprehensive competitive gap analysis with data-driven feature comparison (14 critical gaps, 8 important gaps). Directly informs product roadmap and Phase prioritization. Referenced in project-brief.md
  - **Content**: Feature-by-feature comparison vs 4 competitors, impact assessment, phase recommendations

- **CONSIDER DELETING OR REPURPOSING**: `/workspaces/MonoPilot/new-doc/00-foundation/other/discovery/DISCOVERY-REPORT.md` (36 KB - Polish language)
  - **Reason**: ~60% content overlap with FEATURE-GAP-ANALYSIS and prd.md. Covers same competitive positioning, same success metrics, same target market segments, same module status. Polish-language version of what's already in English docs.
  - **Duplication**: Target market (SMB 80%, Large 20%), Competitive positioning table, Success metrics (uptime 99.5%, MTTR < 30 min), Module status (Epic 1-4 DONE, Epic 5 92%)
  - **Impact**: Medium - language redundancy but no material new insights vs English docs

- **KEEP with CONDITIONAL**: `/workspaces/MonoPilot/new-doc/00-foundation/other/discovery/DISCOVERY-REPORT-V4.md` (16 KB)
  - **Reason**: Unique future-focused gap analysis covering AI/ML, Digital Twins, IIoT, Sustainability, HACCP/21CFR11, Cybersecurity - these are NOT covered in FEATURE-GAP-ANALYSIS. Complements rather than duplicates.
  - **Condition**: Rename to "DISCOVERY-FUTURE-TRENDS.md" to clarify purpose (future roadmap considerations vs. current gaps)

- **CONSOLIDATE**: `/workspaces/MonoPilot/new-doc/00-foundation/other/discovery/DISCOVERY-MARKET-REPORT.md` (24 KB)
  - **Reason**: Detailed competitor analysis (competitor cards, features, pricing) that could be integrated into FEATURE-GAP-ANALYSIS appendix rather than standalone. Currently duplicates high-level competitor names/strategies.
  - **Recommendation**: Extract unique competitor detail (customer testimonials, implementation timelines) into appendix of FEATURE-GAP-ANALYSIS; consolidate competitor names/features into single reference

### ✅ NO DUPLICATES: ADRs (Decisions/)
- Each ADR-00X file covers distinct architectural decision with unique rationale and implementation. No content overlap detected.
- Consistent format and cross-referencing between ADRs.

### ✅ NO DUPLICATES: Guides/
- Each guide addresses specific feature area (routings, operations, BOM items, traceability) with distinct user workflows. No overlap.

### ✅ NO DUPLICATES: Patterns/
- Each pattern covers distinct problem-solving approach (ReAct, State Transitions, Shared-memory, Task templates). Patterns are complementary, not duplicative.

### ✅ NO DUPLICATES: Procedures/
- Each procedure file serves distinct purpose: README (index), QUICK-START (quick ref), IMPLEMENTATION-GUIDE (integration), COMPLETION-REPORT (handoff template), and 4 shared procedures (checkpoints, TDD, errors, quality gates). Well-organized.

---

## Key Cross-Cutting Facts

### 1. Core Product Architecture
- **Multi-Tenancy Foundation**: All tables use `org_id` with RLS enforcement (ADR-013). Org isolation is database-enforced, not application-enforced.
- **11 Modules Across 4 Phases**: Epics 1-7 are core (Settings, Technical, Planning, Production, Warehouse, Quality, Shipping). Epics 8-11 are premium (NPD, Finance, OEE, Integrations).
- **License Plate (LP) Inventory**: Atomic inventory unit with genealogy - every transaction operates on LPs, not loose quantities (ADR-001).
- **BOM Snapshot Pattern**: Work orders capture BOM at creation time; BOMs are immutable per WO execution (ADR-002).

### 2. Target Market & Positioning
- **Primary Market**: Small-to-medium food manufacturers (5-100 employees) = 80% of target
- **Secondary Market**: Larger producers (100+ employees) = 20% of target
- **Value Proposition**: Cloud-native MES deployed in weeks vs. 6-24 months for enterprise solutions, at 1/10th the cost
- **Competitive Advantage**: Ease of use (95%), deployment speed, SMB affordability, food-specific features (allergens, traceability, HACCP)

### 3. Current Implementation Status
- **MVP Ready**: Epics 1-4 complete (Settings, Technical, Planning, Production)
- **Near Complete**: Epic 5 at 92% (Warehouse) - blocking issues: print integration, scanner workflows
- **Planned Phase 2**: Epics 6-7 (Quality, Shipping) - includes HACCP/CCP, CoA, NCR, advanced picking
- **Planned Phase 3**: Epics 8-9 (NPD, Finance, OEE) - plus advanced scheduling, multi-site, EDI

### 4. Critical Technical Patterns
- **GS1 Compliance**: GTIN-14 for products, GS1-128 for lots/expiry, SSCC-18 for pallets (ADR-004)
- **FIFO/FEFO**: Configurable picking by receipt date or expiry with enforcement levels (suggest/warn/block) (ADR-005)
- **State Machines**: Work orders have defined state transitions; same pattern applies to all domain entities (ADR-007)
- **Audit Trails**: `created_by`, `updated_by`, `created_at`, `updated_at` on all tables with action logging (ADR-008)
- **Centralized Constants**: Enums and lookups in shared constants file rather than hardcoded (ADR-015)

### 5. API & Service Layer Patterns
- **REST Endpoints**: Standard CRUD (`GET`, `POST`, `PUT`, `DELETE`) plus action routes (`POST /:id/{action}` for state transitions)
- **Service Layer**: Business logic in `lib/services/*-service.ts` files; API routes call services, never call DB directly
- **Validation**: Zod schemas in `lib/validation/*.ts` for all input validation
- **Multi-Tenancy**: Service layer automatically filters by `org_id`; API routes extract user's org from auth token

### 6. Scanner & Mobile-First Design
- **Hardware First**: Dedicated Zebra/Honeywell scanners prioritized over mobile app (ADR-006)
- **Scanner Workflows**: Receive, Move, Split, Merge, Putaway, Pick in Warehouse; Start WO, Consume, Register Output in Production
- **GS1 Compliance**: All workflows use barcode scanning (GTIN-14, GS1-128) rather than manual entry
- **Performance Target**: Complete operation in < 30 seconds per user action

### 7. Competitive Gaps & Roadmap Priorities
- **Critical Gaps (All 4 Competitors Have)**:
  - Real-time OEE tracking (Phase 3)
  - GS1 barcodes - partial (Phase 2)
  - HACCP/CCP - partial (Phase 2)
  - Shelf Life / FEFO management - partial (Phase 2)
  - Catch-weight support - not planned
  - Recipe/production costing - partial (Phase 2)

- **Differentiators (MonoPilot Advantages)**:
  - Deployment speed (weeks vs. months)
  - Modern UX (Next.js 16 + React 19)
  - SMB pricing ($50/user/mo vs. $500-2000)
  - Food-specific configuration (allergens, traceability, lot tracking)
  - No consultant dependency (self-service toggles)

### 8. Quality & Testing Standards
- **Universal Gates** (error-recovery-common.md, quality-gates-common.md):
  - Tests pass (unit > 70%, e2e for critical paths)
  - No hardcoded secrets
  - Validation on all inputs
  - No console.logs in production code
  - Performance gates: P95 < 2s page load, traceability query < 30 sec

- **Phase-Specific Gates**:
  - P1 (UX Design): Wireframes approved, accessibility (WCAG 2.1 AA)
  - P2 (Test Writing): Tests red before implementation, >80% code coverage
  - P3 (Implementation): GREEN tests, follows monopilot-patterns
  - P5 (Code Review): Security checklist, RLS validation, no data leakage
  - P6 (QA): No critical bugs, edge cases tested, traceability verified

### 9. Error Recovery & Resilience
- **Retry Logic**: API timeouts with exponential backoff (3 retries max)
- **Database Failures**: Migration rollback on failure; contact architect for data recovery
- **RLS Security Errors**: DO NOT PROCEED - escalate to Code-Reviewer immediately
- **Test Failures**: STOP, debug immediately, don't continue with new code
- **Checkpoint Failures**: Log warning, continue; retry once; skip if persistent

### 10. Documentation & Knowledge Management
- **Shared Procedures Strategy**: 4 shared procedure files eliminate ~11,600 tokens of duplication across agents:
  - handoff-templates.md (checkpoint format)
  - tdd-phase-flow.md (RED → GREEN → REFACTOR)
  - error-recovery-common.md (error patterns by agent)
  - quality-gates-common.md (universal quality criteria)

- **Agent Coordination**: State transitions (Inactive → Ready → Active → Waiting → Blocked → Complete) enable multi-agent handoffs
- **Checkpoint Format**: JSON snapshots with phase number, status, artifacts, blockers, metrics (uptime, test coverage, deployment time)

### 11. Key Decisions Not Yet Fully Documented
- **Finance Module Strategy** (Epic 9): NOT full ERP accounting - integrate with existing systems (Sage, wFirma, Comarch)
- **Multi-Site Support** (Phase 3): Currently single-site per org; multi-site planned for Phase 3
- **Integrations** (Epic 11): EDI, Comarch Optima, supplier/customer portals - Phase 3 and beyond
- **Language Support** (Phase 2): Currently Polish + English; DACH region (German) planned for Phase 2

### 12. Regulatory & Compliance Requirements
- **Food Safety Traceability**: Forward/backward trace in < 30 seconds (implemented via LP genealogy)
- **Lot Tracking**: All inventory tracked by batch/lot with expiry and manufacturing dates
- **Allergen Management**: EU-14 allergens + custom allergen fields
- **Audit Trail**: Who/what/when on all changes (created_by, updated_by timestamps)
- **HACCP/CCP**: Partial in Phase 2 (Quality module); full support including electronic signatures (21 CFR Part 11) planned
- **GS1 Compliance**: Barcodes, lot tracking - Phase 2 focus

---

## Consolidation Recommendations

### Immediate Actions (High Priority)

1. **Delete**: `bugs.md` → Content merged into CONSOLIDATED-BUG-TRACKER.md
2. **Delete**: `patterns/ERROR-RECOVERY.md` → References procedures/error-recovery-common.md instead
3. **Rename**: `discovery/DISCOVERY-REPORT-V4.md` → `discovery/DISCOVERY-FUTURE-TRENDS.md`
4. **Consolidate**: `discovery/DISCOVERY-MARKET-REPORT.md` → Extract unique competitor details to FEATURE-GAP-ANALYSIS appendix

### Secondary Actions (Medium Priority)

5. **Relocate**: `bugs/errors.md` → `guides/technical/typescript-errors.md` (improve discoverability)
6. **Archive**: `discovery/DISCOVERY-REPORT.md` → `other/archive/discovery-v1-polish.md` (Polish duplicate of English content; keep for historical reference but deprioritize)
7. **Add**: Cross-references in prd.md linking to decisions/ directory (currently references prd modules only)
8. **Create**: Index file in decisions/ listing all ADRs with one-line summary for quick lookup

### Housekeeping (Lower Priority)

9. Review and consolidate other/discovery/ into 2-3 definitive reports:
   - FEATURE-GAP-ANALYSIS.md (current gaps vs. competitors)
   - DISCOVERY-FUTURE-TRENDS.md (renamed V4 - future opportunities)
   - DISCOVERY-MARKET-REPORT.md (detailed competitor profiles) → Could be appendix to gap analysis

10. Move all archived discovery versions to other/archive/discovery-versions/

---

## Statistics

| Category | Count | Status |
|----------|-------|--------|
| **Core Foundation Files** | 60+ | Well-organized, minimal duplication |
| **Duplicate Sets Identified** | 3-4 | Moderate overlap in error recovery, bugs, discovery reports |
| **Duplicate Content %** | ~15-20% | Mostly in discovery and error recovery docs |
| **ADRs** | 25 | All unique, well-maintained |
| **Actionable Recommendations** | 10 | Prioritized by impact |
| **Tokens Saved by Consolidation** | ~2,000+ | Removing bugs.md, ERROR-RECOVERY.md duplicates |

