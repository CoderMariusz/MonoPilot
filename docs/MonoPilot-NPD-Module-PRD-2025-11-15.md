# MonoPilot NPD Module - Product Requirements Document

**Author:** Mariusz
**Date:** 2025-11-15
**Version:** 1.0
**Status:** DRAFT - Ready for Architecture Phase
**Module Type:** Premium Add-on (Growth/Enterprise tiers)

---

## Executive Summary

### Vision Alignment

MonoPilot NPD (New Product Development) Module to **premium rozszerzenie** systemu MonoPilot, zaprojektowane dla firm spożywczych, które potrzebują **strukturalnego procesu innowacji produktowej** przed uruchomieniem produkcji komercyjnej. Moduł implementuje **Stage-Gate methodology** (standardy przemysłowe) dostosowaną do specyfiki food manufacturing, z pełną integracją z istniejącymi modułami MonoPilot (Products, BOM, Production, Warehouse).

**Problem do rozwiązania:**

Firmy spożywcze (20-250 pracowników) borykają się z:
- **Chaotycznym R&D:** Brak struktury, pomysły gubią się, nie ma audytu decyzji
- **Długim time-to-market:** Średnio 12-18 miesięcy od pomysłu do półki (industy average)
- **Kosztownymi błędami:** Launch produktu bez shelf-life testing → recall ($500K-$2M loss)
- **Brakiem traceability:** Nie wiedzą, dlaczego receptura się zmieniła (compliance risk)
- **Wysokimi kosztami PLM:** Systemy PLM dla enterprise ($200K-$500K) są poza zasięgiem SME

**Rozwiązanie - MonoPilot NPD Module:**

Lekki, ale strukturalny system NPD z:
- **Stage-Gate flow** (G0: Idea → G1: Feasibility → G2: Business Case → G3: Development → G4: Testing → Launch)
- **Formulation versioning** z datami efektywności i audit trail
- **Guided handoff wizard:** Automatyczny transfer receptury → BOM → Pilot Work Order
- **Compliance built-in:** Allergens tracking, regulatory checklists, document management
- **Bounded context architecture:** NPD działa standalone (R&D bez produkcji) LUB z integracją (pełny flow)
- **Transparentny pricing:** $1,500-$2,500/miesiąc add-on (vs $200K PLM systems)

### What Makes This Special

**1. Dual-Mode Architecture (NPD-only OR NPD+Production)**

Unikalność: Większość systemów PLM wymaga pełnej infrastruktury produkcyjnej. MonoPilot NPD może działać:
- **Standalone:** R&D firma projektuje produkty dla klientów → eksport do Excel/PDF
- **Integrated:** Firma produkująca → handoff wizard tworzy Product + BOM + Pilot WO

**Korzyść biznesowa:** Rozszerza target market na R&D consultancies (nowy segment klientów).

**2. Event Sourcing + Immutability (Compliance-Ready)**

Unikalność: Pełny audit trail iteracji formulation (v1 → v2 → v3 → final BOM):
- Każda zmiana receptury zapisana w `npd_formulation_lineage`
- Event log (`npd_events`) dla wszystkich handoffs i approvals
- Immutable snapshot: Formulation approval = lock (no mid-flight changes)

**Korzyść compliance:** FDA 21 CFR Part 11 ready (electronic records), recall readiness (pokazuje ewolucję produktu).

**3. Financial Gate-Keeper (Standard Cost Approval)**

Unikalność: Handoff to production **wymaga financial approval** dla standard cost:
- Finance role musi zaaprobować costing przed transfer
- Automatic variance alerts (actual cost > target cost by 20%)
- Simple MVP costing (target vs estimated vs actual) bez dependency na Finance Module

**Korzyść biznesowa:** Zapobiega costly launches (products with negative margin).

**4. Pilot Simplifications (Speed over Sophistication)**

Unikalność: Pilot Work Orders używają **uproszczonego routingu i costingu**:
- Pilot routing: 1-2 operacje (Mix & Pack) vs production 10+ operacji
- Flat cost per operation ($500) vs multi-level BOM rollup
- Small batches (kg) vs production (tons)

**Korzyść R&D:** Szybsze trial setup (15 minut vs 2 godziny dla full production routing).

**5. Progressive Web App (Zero Hardware for Trials)**

Unikalność: Lab trials używają **mobile PWA** (tablet) zamiast industrial scanners:
- Scan ingredients, log trial parameters, photo results
- Offline-capable (lab may not have WiFi)
- Camera API for barcodes (no dedicated hardware)

**Korzyść:** $0 hardware cost dla lab trials (vs $1,500-$3,000 for dedicated scanners).

---

## Project Classification

**Technical Type:** SaaS B2B Module (Premium Add-on)
**Domain:** Food Manufacturing (Regulated Industry)
**Complexity:** Complex (Multi-entity workflows, compliance, versioning, event sourcing)

**Relationship to MonoPilot Core:**
- **Bounded Context Pattern:** NPD = separate domain (`npd_*` tables) with optional integration
- **Feature Flag Enabled:** Per-organization activation (`org_settings.enabled_modules: ['npd']`)
- **Event-Based Integration:** NPD events → Production module (loose coupling)
- **Deployment:** Same codebase, same Supabase project, separate API classes

**Target Customers:**
- **Primary:** Food manufacturers (Growth/Enterprise tiers, 50-250 employees)
- **Secondary:** R&D consultancies (NPD-only mode, no production)
- **Characteristics:** Companies launching 3-12 new products per year, need compliance documentation

**Competitive Position:**
- **vs Enterprise PLM** (Arena, Sciforma): MonoPilot NPD = **1/10th the cost** ($18K/year vs $200K)
- **vs Generic Tools** (Trello, Asana): MonoPilot NPD = **food-specific** (allergens, shelf-life, compliance)
- **vs Spreadsheets:** MonoPilot NPD = **structured** (Stage-Gate, versioning, traceability)

### Domain Context

**Food Manufacturing NPD Specifics:**

**Regulatory Compliance:**
- **Allergen Declaration:** Must track all 14 major allergens (EU) / 9 major allergens (US FDA)
- **HACCP Plans:** Hazard Analysis for new processes (critical control points)
- **Shelf-Life Testing:** Accelerated + stability tests (mikrobiological, sensory)
- **Label Claims:** Nutritional info, organic/non-GMO certifications, compliance review
- **FDA Pre-Market Notification:** Form 2541a for certain food categories

**Traceability Requirements:**
- **FSMA 204 (2028 deadline):** Full forward/backward traceability from raw materials to finished goods
- **Lot/Batch Tracking:** Every ingredient must have supplier batch number
- **Recall Readiness:** Ability to identify all affected products within 24 hours
- **Genealogy:** Track which raw materials went into which finished goods

**Cross-Functional Collaboration:**
- **R&D:** Formulation development, trials, DoE (Design of Experiments)
- **Regulatory:** Compliance checklists, label review, allergen validation
- **Finance:** Target cost approval, standard cost setting, margin analysis
- **Production:** Pilot feasibility, routing selection, equipment validation
- **QA:** Shelf-life testing, mikrobiological specs, sensory evaluation
- **Packaging:** Artwork proofing, GS1 barcode setup, migration testing

**Industry Benchmarks:**
- **Time-to-Market:** 12-18 months (industry average), MonoPilot target: 9-12 months
- **First-Time-Right:** 30-40% (industry average), MonoPilot target: 50-60%
- **Stage-Gate Adoption:** 70% of CPG companies use Stage-Gate (Stage-Gate International data)

---

## Success Criteria

**MVP Success (4-6 weeks after launch):**

1. **Adoption Metrics:**
   - ≥3 pilot customers (existing MonoPilot Growth/Enterprise) activate NPD Module
   - ≥10 NPD projects created within first month
   - ≥5 handoffs to production executed successfully

2. **Workflow Completion:**
   - ≥80% of projects complete G0 → G1 (idea → feasibility) within 2 weeks
   - ≥60% of projects complete G1 → G3 (feasibility → development) within 8 weeks
   - ≥1 project completes full cycle (G0 → G4 → Launch) within 12 weeks

3. **User Satisfaction:**
   - ≥4.0/5.0 CSAT for handoff wizard (ease of use)
   - ≥70% of R&D users report "NPD Module saves time vs spreadsheets"
   - Zero critical bugs in handoff flow (no data loss, no corruption)

4. **Technical Metrics:**
   - ≥99% uptime for NPD Module APIs
   - <500ms p95 latency for NPD dashboard load
   - Zero event failures (100% handoff events processed successfully)

### Business Metrics

**Revenue Impact (12 months post-launch):**

- **Upsell revenue:** $150K ARR from NPD Module add-on (10 customers × $15K/year)
- **Customer retention:** +10% for customers with NPD Module (stickiness)
- **New customer acquisition:** ≥5 R&D consultancies (NPD-only customers) = $75K ARR

**Cost Savings for Customers:**

- **vs Arena PLM:** MonoPilot NPD ($18K/year) vs Arena ($200K) = **$182K savings**
- **vs Manual Process:** Time-to-market reduction (12 → 9 months) = **25% faster** = $50K-$100K in opportunity cost
- **vs Recall Risk:** Compliance documentation reduces recall probability (1% → 0.5%) = **$250K-$1M risk reduction**

**Market Validation:**

- ≥20% of MonoPilot Growth/Enterprise customers express interest (survey)
- ≥3 customer testimonials highlighting NPD Module value
- ≥1 case study: "How XYZ reduced time-to-market from 14 to 9 months with MonoPilot NPD"

---

## Product Scope

### MVP - Minimum Viable Product (4-6 weeks, 7 core tables)

**P0 Features (Must-Have for MVP):**

**1. NPD Project Management:**
- Create/edit/delete NPD projects (project_number, project_name, description)
- Stage-Gate workflow (G0 → G1 → G2 → G3 → G4 → Launched)
- Project status tracking (idea, feasibility, business_case, development, testing, launched, cancelled)
- Current gate display (visual progress indicator)
- Project owner assignment (NPD Lead role)
- Target launch date + priority (high/medium/low)
- Portfolio category (e.g., "Premium Burgers", "Vegan Line")

**2. Formulation Versioning:**
- Create formulation (draft) linked to NPD project
- Formulation versioning (v1.0, v1.1, v2.0) with effective dates
- Formulation items (ingredients: product_id, qty, UoM, notes)
- Automatic allergen aggregation (from ingredient products)
- Version locking on approval (immutable snapshot)
- Formulation lineage tracking (v1 → v2 → v3 evolution)

**3. Gate Review Checklists:**
- Gate-specific checklists (G0: Idea, G1: Feasibility, G2: Business Case, etc.)
- Checklist items (description, required: yes/no, completed: yes/no, notes)
- Approvals integration (generic `approvals` table reused)
- Approval workflow (submit → approve/reject → next gate)
- Entry/exit criteria enforcement (cannot advance without approval)

**4. Simple Costing (No Finance Module Dependency):**
- Target cost (manual input by R&D Lead)
- Estimated cost (calculated from formulation items: Σ(qty × unit_price))
- Actual cost (from pilot WO after trial)
- Variance calculation: (actual - target) / target × 100
- Variance alerts (>20% → warning, >50% → blocker)
- Cost history (track costing changes over formulation versions)

**5. Compliance Tracking:**
- Allergen declaration (auto-populated from formulation)
- Regulatory checklist (HACCP, label review, shelf-life plan)
- Compliance document upload (Supabase Storage)
- Document metadata (file_type: formulation/trial/compliance/label, version)
- Missing compliance detection (handoff blocker if docs incomplete)

**6. Handoff Wizard (NPD → Production):**
- **Step 1: Validation** (gate approved? formulation locked? allergens mapped? docs uploaded? costing approved?)
- **Step 2: Product Decision** (create new product OR update existing product)
- **Step 3: BOM Transfer** (formulation → BOM inheritance, auto-populate bom_items)
- **Step 4: Pilot WO (Optional)** (create pilot WO: small batch, pilot routing, type='pilot')
- **Step 5: Confirm & Execute** (transactional handoff, event logging)
- **Dual Paths:** Path A (Production active) = transfer, Path B (NPD-only) = export to Excel/PDF

**7. Event Sourcing:**
- `npd_events` table (type, payload, status, retry_count)
- Event types: NPD.HandoffRequested, NPD.ProjectApproved, NPD.FormulationLocked
- Retry mechanism (if event fails, retry up to 3 times)
- Event log UI (admin view: see all events, filter by status=failed)

**8. NPD Dashboard (Kanban View):**
- Pipeline visualization (columns: G0 → G1 → G2 → G3 → G4 → Launched)
- Drag-and-drop project cards (change gate status)
- Filter by portfolio_category, priority, owner
- Timeline view (horizontal bars: created_at → target_launch_date)
- CSV export for external planning tools

**MVP Database Schema (7 Tables):**

1. `npd_projects` - Project management (gates, status, dates, owner)
2. `npd_formulations` - Formulation versioning (effective_from/to, status, lineage)
3. `npd_formulation_items` - Ingredients (product_id, qty, UoM)
4. `npd_costing` - Simple costing (target vs estimated vs actual)
5. `npd_risks` - Simple risk list (likelihood × impact, mitigation)
6. `npd_documents` - Storage metadata (Supabase Storage paths)
7. `npd_events` - Event sourcing (handoff, approvals, retry)

**Existing Table Modifications (4 Tables):**

1. `work_orders` - Add `type: 'pilot'`, `npd_project_id`
2. `products` - Add `npd_project_id`, `source: 'npd_handoff'`
3. `boms` - Add `npd_formulation_id`, `source: 'npd_handoff'`
4. `production_outputs` - Add `type: 'trial'`, `npd_trial_id`

**Excluded from MVP (Deferred to Phase 2-3):**

- ❌ Trials tracking (reużyć `production_outputs` later, MVP = simple notes)
- ❌ DoE (Design of Experiments) automation (MVP = free-form notes)
- ❌ Advanced FMEA (Severity × Occurrence × Detection, MVP = simple risk list)
- ❌ LP Reservations (auto-reserve for trials, MVP = manual)
- ❌ Migration Wizard (NPD-only → +Production, MVP assumes customers start with full stack)
- ❌ Advanced DMS (check-in/check-out, e-signatures, approval workflows)

### Growth Features (Post-MVP - Phase 2, 4-6 weeks)

**P1 Features (Important but MVP works without):**

**1. Trials Tracking (Reuse production_outputs):**
- Trial creation linked to NPD project
- Trial results (yield, by-products, observations, photos)
- Trial → formulation feedback loop (iteration based on trial results)
- Trial history (compare v1 trial vs v2 trial)

**2. Migration Wizard (NPD-only → +Production):**
- Detect: Organization has NPD Module but no Production modules
- Wizard: "Enable Production Module" → migrate accepted projects to BOM
- Filter: Only "approved" projects (gate G3+) eligible for migration
- Validation: Check dostawcy, allergens, compliance docs
- Dry-run: Preview migration (user reviews before execute)
- Execute: Transfer formulations → boms + backup + rollback support

**3. Shared VersioningService:**
- Centralized versioning logic (effective_from/to, overlap detection, snapshot)
- Reused by: `npd_formulations` + `boms` (DRY principle)
- Version comparison UI (show diff between v1 vs v2)
- Automatic version bumping (major vs minor vs patch)

**4. Finance Module Integration:**
- Standard cost calculation (overhead, labor rates from Finance Module)
- Budget tracking (project spend vs budget per gate)
- Approval workflow (Finance role approves costing via Finance Module)

**5. Planning Module Integration:**
- Resource allocation (R&D capacity planning)
- Portfolio balancing (high/medium/low priority projects)
- Release planning (quarter-based roadmaps, dependencies)

**6. Pilot Routing Templates:**
- Pre-configured pilot routings (Mix & Pack, Test & Pack)
- 1-2 operacje vs production 10+ operacji
- Flat cost per operation (simplified costing)

**7. Advanced Costing:**
- Multi-level BOM rollup (if Finance Module exists)
- Cost breakdown by category (materials, labor, overhead)
- Cost scenarios ("What-if" analysis for ingredient substitutions)

### Vision (Future - Phase 3-4, 8-12 weeks)

**P2-P3 Features (Nice-to-Have, Future Differentiation):**

**1. Advanced DMS (Document Management):**
- Check-in/check-out (document locking to prevent concurrent edits)
- Approval workflows (review → approve → publish states)
- E-signatures (FDA 21 CFR Part 11 compliance)
- Full audit trail (who viewed, when, what changed)
- Document templates (auto-generate CoA, specs, labels from formulation)
- Advanced search (full-text search, metadata filters, tag-based)

**2. LP Reservations (Auto-Reserve for Trials):**
- Automatic reservation of ingredients when trial is scheduled
- FIFO/FEFO logic for trial material selection
- Reservation expiry (if trial not executed within X days)
- Manual override (user can pick specific LPs)

**3. Full FMEA (Failure Mode & Effects Analysis):**
- FMEA template (Severity, Occurrence, Detection scoring)
- RPN calculation (Risk Priority Number = S × O × D)
- Mitigation tracking (actions to reduce RPN)
- FMEA comparison (before vs after mitigation)

**4. Advanced Analytics:**
- Time-to-gate dashboard (average time G0 → G1, G1 → G2, etc.)
- First-time-right rate (% of projects that don't require re-formulation)
- Iteration velocity (formulation versions per project)
- Cost variance trends (are we improving target vs actual?)
- Portfolio health (distribution by gate, priority, category)

**5. AI-Powered Features (Moonshots - Phase 4):**
- Formulation optimizer (AI suggests ingredient substitutions: cost ↓, nutrition ↑)
- Shelf-life predictor (ML model predicts shelf-life from formulation + trial data)
- Allergen risk scorer (auto-detect cross-contamination risks based on line history)
- Regulatory autopilot (auto-submit to FDA/EFSA with pre-filled forms)
- Label generator (AI writes label claims from formulation, FDA-compliant)

**6. Cross-Industry Adaptations:**
- Automotive APQP/PPAP → adapt for food (HACCP plan automation)
- Pharma IQ/OQ/PQ → adapt for food (CIP/SIP validation automation)
- Machinery Configurator → NPD templates (burger variants auto-generator)

---

## Domain-Specific Requirements

**Food Manufacturing NPD Must-Haves:**

**1. Allergen Management (CRITICAL for Food):**
- **Auto-aggregation:** Formulation inherits allergens from all ingredients
- **14 Major Allergens (EU):** Cereals (gluten), Crustaceans, Eggs, Fish, Peanuts, Soybeans, Milk, Nuts, Celery, Mustard, Sesame, Sulphites, Lupin, Molluscs
- **Cross-contamination warnings:** "This product contains peanuts. Line also processes milk."
- **Allergen-free validation:** Check if formulation is allergen-free (for claims like "Gluten-Free")
- **May Contain statements:** Automatic generation based on line allergen history

**2. Compliance Documentation (FDA/EFSA/HACCP):**
- **HACCP Plan template:** Auto-generate from formulation + process
- **Critical Control Points (CCPs):** Identify CCPs for new products (e.g., cooking temp, pH)
- **Label Review Checklist:** Nutritional info, allergens, claims (organic, non-GMO)
- **Shelf-Life Testing Plan:** Accelerated + stability tests, mikrobiological specs
- **Pre-Market Notification:** FDA Form 2541a (for certain categories)

**3. Traceability & Genealogy (FSMA 204):**
- **Supplier Batch Tracking:** Every formulation item must have supplier_batch_number
- **Forward Traceability:** From raw materials → formulation → trial → finished goods
- **Backward Traceability:** From finished goods → formulation → raw materials
- **Recall Simulation:** Identify all affected products within 30 seconds (LP genealogy)
- **Lot/Batch Audits:** Full history of which lots went into which products

**4. Pilot Constraints (Food-Specific):**
- **Small Batches:** Pilot qty typically kg (not tons) due to ingredient cost
- **Line Availability:** Lab trials may use different equipment than production
- **CIP/SIP Validation:** Cleaning validation if switching to new allergens
- **Sensory Evaluation:** Organoleptic tests (taste, smell, texture) mandatory
- **Shelf-Life Initiation:** Trial outputs enter shelf-life testing (weeks/months)

**5. Formulation Secrecy (IP Protection):**
- **Access Control:** Only NPD Lead + R&D roles can view formulations (RBAC)
- **Audit Log:** Track who viewed formulation (IP theft detection)
- **No External Export:** NPD-only mode exports to PDF (password-protected)
- **Version Locking:** Approved formulations are immutable (no backdoor edits)

This section shapes all functional and non-functional requirements below.

---

## Functional Requirements

### Core NPD Workflow

**FR1:** Users can create NPD projects with auto-generated project_number, project_name, description, target_launch_date, priority, portfolio_category, and owner assignment.

**FR2:** Users can advance NPD projects through Stage-Gate workflow (G0 → G1 → G2 → G3 → G4 → Launched) with status validation.

**FR3:** System enforces gate entry criteria (G0 checklist complete before advancing to G1, G1 approval before G2, etc.).

**FR4:** Users can view NPD pipeline as Kanban board (columns: G0, G1, G2, G3, G4, Launched) with drag-and-drop status changes.

**FR5:** Users can filter NPD dashboard by portfolio_category, priority, owner, status.

**FR6:** Users can view NPD projects as timeline (horizontal bars from created_at to target_launch_date).

**FR7:** Users can export NPD project list to CSV for external planning tools.

### Formulation Management

**FR8:** Users can create formulation (draft) linked to NPD project with version number (v1.0, v1.1, v2.0).

**FR9:** Users can add formulation items (ingredients: product_id, qty, UoM, notes) with auto-complete product search.

**FR10:** System automatically aggregates allergens from all formulation items and displays allergen declaration.

**FR11:** Users can set formulation effective dates (effective_from, effective_to) with overlap detection.

**FR12:** System prevents overlapping formulation versions for same NPD project (database trigger).

**FR13:** Users can lock formulation on approval (status: draft → approved → immutable).

**FR14:** System creates formulation lineage (v1 → v2 → v3) to track evolution of recipe.

**FR15:** Users can compare formulation versions (diff view: added/removed/changed items).

**FR16:** Users can clone formulation to create new version (inherit all items, increment version).

### Gate Reviews & Approvals

**FR17:** Users can view gate-specific checklists (G0: Idea, G1: Feasibility, G2: Business Case, G3: Development, G4: Testing).

**FR18:** Users can mark checklist items as completed with notes and attachments.

**FR19:** Users with approval authority can approve/reject gate reviews (submit → approve → advance to next gate).

**FR20:** System blocks gate advancement if required checklist items are incomplete.

**FR21:** System logs all approvals in `approvals` table (reuse generic approval workflow).

**FR22:** Users can view approval history for NPD project (who approved, when, gate stage).

### Costing Management

**FR23:** Users can enter target cost (manual input by R&D Lead or Finance).

**FR24:** System calculates estimated cost from formulation items: Σ(qty × unit_price).

**FR25:** System records actual cost from pilot WO after trial execution.

**FR26:** System calculates cost variance: (actual - target) / target × 100.

**FR27:** System displays variance alerts (>20% = warning, >50% = blocker for handoff).

**FR28:** Users can view cost history across formulation versions (track cost reduction efforts).

**FR29:** Users with Finance role can approve standard cost before handoff to production.

### Compliance & Documentation

**FR30:** System displays allergen declaration (auto-aggregated from ingredients) on formulation detail page.

**FR31:** Users can upload compliance documents (Supabase Storage: /npd/{org_id}/{project_id}/compliance/).

**FR32:** Users can categorize documents by file_type (formulation, trial, compliance, label, other).

**FR33:** System tracks document metadata (file_name, version, uploaded_by, uploaded_at, file_size, mime_type).

**FR34:** Users can view document history (all versions of a document with version numbers).

**FR35:** System validates compliance document completeness before handoff (HACCP plan, label proof, allergen declaration required).

**FR36:** Users can generate compliance checklist (regulatory requirements per gate).

### Handoff Wizard (NPD → Production)

**FR37:** Users can initiate handoff wizard from NPD project detail page (button: "Handoff to Production").

**FR38:** System validates handoff eligibility (gate G3 approved? formulation locked? allergens mapped? compliance docs uploaded? costing approved?).

**FR39:** System displays validation checklist with pass/fail indicators (✅/⚠️/❌).

**FR40:** Users can choose product creation strategy (create new product OR update existing product with new BOM version).

**FR41:** System transfers formulation items to BOM (automatic population of bom_items from npd_formulation_items).

**FR42:** Users can optionally create pilot WO (small batch, pilot routing, type='pilot').

**FR43:** System displays handoff summary (Product: X, BOM: v1.0, WO: Y) before execution.

**FR44:** System executes handoff transactionally (all-or-nothing: Product + BOM + WO created together).

**FR45:** System logs handoff event in `npd_events` table (type: NPD.HandoffRequested, payload: project_id, result).

**FR46:** System sets npd_project status to 'launched' after successful handoff.

**FR47:** Users in NPD-only mode can export project to Excel/PDF instead of handoff (alternative path).

### Risk Management

**FR48:** Users can add risks to NPD project (risk_description, likelihood: low/medium/high, impact: low/medium/high).

**FR49:** System calculates risk score (likelihood_val × impact_val: 1-9 scale).

**FR50:** Users can enter mitigation plan for each risk.

**FR51:** Users can update risk status (open, mitigated, accepted).

**FR52:** System displays risks sorted by risk_score DESC (highest risk first) on project detail page.

### Event Sourcing & Retry

**FR53:** System logs all critical events in `npd_events` table (NPD.HandoffRequested, NPD.ProjectApproved, NPD.FormulationLocked).

**FR54:** System retries failed events up to 3 times (status: pending → processing → completed/failed).

**FR55:** Users with Admin role can view event log (filter by status=failed).

**FR56:** Users with Admin role can manually replay failed events (force retry).

### Integration with MonoPilot Core

**FR57:** System modifies `work_orders` table to support pilot WOs (type='pilot', npd_project_id foreign key).

**FR58:** System modifies `products` table to track NPD origin (npd_project_id, source='npd_handoff').

**FR59:** System modifies `boms` table to track formulation origin (npd_formulation_id, source='npd_handoff').

**FR60:** System modifies `production_outputs` table to support trial outputs (type='trial', npd_trial_id).

**FR61:** System reuses `allergens` table for allergen aggregation (no duplication).

**FR62:** System reuses `approvals` table for gate reviews (entity_type='npd_project', gate_stage='G1').

### Access Control (RBAC)

**FR63:** Users with 'NPD Lead' role can create/edit/delete NPD projects.

**FR64:** Users with 'R&D' role can view NPD projects assigned to them and create/edit formulations.

**FR65:** Users with 'Regulatory' role can view compliance checklists and upload compliance documents.

**FR66:** Users with 'Finance' role can view/edit costing and approve standard cost.

**FR67:** Users with 'Production' role can view NPD projects in handoff stage (read-only).

**FR68:** System enforces RLS policies (org_id isolation for all npd_* tables).

**FR69:** System logs all access to formulations (audit trail for IP protection).

### Notifications & Alerts

**FR70:** System notifies project owner when gate approval is required.

**FR71:** System notifies Finance role when costing approval is required (before handoff).

**FR72:** System alerts R&D when cost variance exceeds 20% (estimated vs target).

**FR73:** System alerts NPD Lead when compliance documents are missing (handoff blocker).

**FR74:** System notifies Production when handoff is completed (new pilot WO created).

---

## Non-Functional Requirements

### Performance

**NFR1:** NPD Dashboard (Kanban view) must load in <500ms (p95 latency) for 50 projects.

**NFR2:** Formulation detail page must load in <300ms (p95 latency) including allergen aggregation.

**NFR3:** Handoff wizard validation must complete in <2 seconds (all checks: gate, formulation, allergens, docs, costing).

**NFR4:** Handoff execution (Product + BOM + WO creation) must complete in <5 seconds (transactional).

**NFR5:** CSV export of NPD project list must complete in <3 seconds for 200 projects.

**NFR6:** Document upload (Supabase Storage) must support files up to 50MB with progress indicator.

**NFR7:** Event retry mechanism must process failed events within 1 minute (background job).

### Security

**NFR8:** All NPD API endpoints must require authentication (Supabase Auth session).

**NFR9:** All NPD tables must enforce RLS policies (org_id isolation).

**NFR10:** Formulation access must be logged in audit_log table (IP protection).

**NFR11:** Compliance documents must be stored with encryption at rest (Supabase Storage default).

**NFR12:** Standard cost approval must require Finance role (RBAC enforcement).

**NFR13:** Handoff wizard must validate user has permission to create Product/BOM/WO.

**NFR14:** Event log (npd_events) must be read-only for non-Admin users.

### Scalability

**NFR15:** System must support 500 active NPD projects per organization without performance degradation.

**NFR16:** System must support 10 formulation versions per project (v1.0 → v10.0).

**NFR17:** System must support 50 formulation items per formulation (complex recipes).

**NFR18:** System must support 100 NPD projects per user (NPD Lead with large portfolio).

**NFR19:** Handoff wizard must handle concurrent handoffs (2+ projects handed off simultaneously).

**NFR20:** Event log must retain events for 90 days (compliance audit trail).

### Integration

**NFR21:** NPD Module must work standalone (without Production modules active) - NPD-only mode.

**NFR22:** NPD Module must integrate with Production modules (if active) via event sourcing.

**NFR23:** Handoff wizard must detect if Production modules are active and enable/disable transfer path accordingly.

**NFR24:** NPD Module must reuse shared services (VersioningService, RLSService, AuditLogService, ApprovalsService, StorageService).

**NFR25:** NPD Module must not modify production tables structure (only add optional foreign keys).

**NFR26:** NPD events must be idempotent (safe to replay without duplicating data).

### Accessibility

**NFR27:** NPD Dashboard must be keyboard-navigable (tab, arrow keys for Kanban board).

**NFR28:** Handoff wizard must support screen readers (ARIA labels for validation checklist).

**NFR29:** Document upload must support drag-and-drop AND file picker (accessibility).

**NFR30:** Color-coded risk scores must include text labels (not color-only: "High Risk", not just red).

---

## Implementation Planning

### Epic Breakdown Required

Requirements must be decomposed into epics and bite-sized stories (200k context limit).

**Recommended Epics:**

**Epic NPD-1: Core NPD Project Management** (3-4 weeks)
- Project CRUD, Stage-Gate workflow, Kanban dashboard, gate checklists

**Epic NPD-2: Formulation Versioning** (2-3 weeks)
- Formulation CRUD, versioning logic, allergen aggregation, lineage tracking

**Epic NPD-3: Handoff Wizard** (2-3 weeks)
- Validation checklist, Product/BOM transfer, pilot WO creation, event sourcing

**Epic NPD-4: Costing & Compliance** (1-2 weeks)
- Simple costing, document upload, compliance checklists

**Epic NPD-5: Risk Management & Approvals** (1 week)
- Risk CRUD, approval workflow integration

**Epic NPD-6: Database Schema & Migrations** (1 week)
- 7 npd_* tables, 4 table modifications, RLS policies, VersioningService

**Epic NPD-7: E2E Testing & Documentation** (1 week)
- Playwright tests for full NPD flow, API documentation, user guide

**Total MVP Timeline:** 4-6 weeks (7 epics executed in parallel where possible)

**Next Step:** Run `workflow create-epics-and-stories` to create the implementation breakdown.

---

## References

- Brainstorming Session: `docs/brainstorming-npd-module-2025-11-15.md` (1,615 lines, 50+ decisions)
- MonoPilot Architecture: `docs/architecture.md` (bounded context pattern, RLS, event sourcing)
- MonoPilot Core PRD: `docs/MonoPilot-PRD-2025-11-13.md` (existing product context)

**Benchmark Systems Analyzed:**
- Stage-Gate International (methodology standard)
- Arena PLM (Siemens competitor)
- Sciforma (enterprise PLM)
- aha.io (product roadmap tool)

**Industry Standards Referenced:**
- FDA 21 CFR Part 11 (electronic records)
- FSMA 204 (traceability requirements, 2028 deadline)
- HACCP (Hazard Analysis Critical Control Points)
- APQP (Automotive Advanced Product Quality Planning - adapted for food)

---

## Next Steps

1. **Architecture Document** - Run: `/bmad:bmm:workflows:architecture`
   - Define bounded context boundaries (npd_* schema)
   - Event sourcing architecture (npd_events, retry mechanism)
   - Integration points (handoff wizard → Products/BOM/WO APIs)
   - Shared services (VersioningService, RLSService, ApprovalsService)

2. **UX Design** - Run: `/bmad:bmm:workflows:create-ux-design`
   - NPD Dashboard wireframes (Kanban + Timeline views)
   - Handoff Wizard flow (5 steps with validation states)
   - Formulation detail page (items, allergens, costing, lineage)
   - Gate checklist UI (collapsible sections, progress indicators)

3. **Epic & Story Breakdown** - Run: `/bmad:bmm:workflows:create-epics-and-stories`
   - Decompose 74 FRs into bite-sized stories
   - Estimate story points (1-13 SP per story)
   - Prioritize P0/P1/P2 stories
   - Create sprint plan (7 epics over 4-6 weeks)

4. **Database Schema Design** - Create migrations:
   - 7 core tables: npd_projects, npd_formulations, npd_formulation_items, npd_costing, npd_risks, npd_documents, npd_events
   - 4 table modifications: work_orders, products, boms, production_outputs
   - RLS policies for all npd_* tables
   - VersioningService implementation

---

_This PRD captures the essence of MonoPilot NPD Module - a **premium add-on** that brings **structured innovation** to food manufacturing SMEs, with **bounded context architecture** enabling both **standalone operation** (R&D consultancies) and **seamless integration** (full production flow)._

_Created through collaborative brainstorming between Mariusz and Business Analyst Mary, incorporating deep research on Stage-Gate methodology, cross-industry PLM insights (Automotive APQP, Pharma GxP), and food manufacturing compliance requirements (FSMA 204, HACCP, FDA)._
