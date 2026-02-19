# PRD M08-Quality — MonoPilot MES
**Wersja**: 2.0 | **Data**: 2026-02-17 | **Status**: Draft

---

## 1. Executive Summary

Moduł Quality (M08) zapewnia kompleksowe zarządzanie jakością i bezpieczeństwem żywności: śledzenie statusów QA, inspekcje wieloetapowe (incoming/in-process/final), zarządzanie HACCP/CCP, specyfikacje produktowe z parametrami testowymi, NCR lifecycle, CAPA, generowanie CoA, jakość dostawców oraz pełny audit trail zgodny z FDA 21 CFR Part 11.

**Pozycja w systemie**: M08 jest downstream od M03 Warehouse (LP, QA status), M06 Production (WO, operacje) i M02 Technical (produkty, routing). Upstream dla M07 Shipping (QA gating na LP), M15 Reporting (QC holds dashboard).

**Kluczowe wyróżniki**:
- QA status na LP (ADR-001) — only 'passed' LP mogą być alokowane/shipped
- 7 statusów jakości: PENDING, PASSED, FAILED, HOLD, RELEASED, QUARANTINED, COND_APPROVED
- HACCP/CCP monitoring z real-time alertami na deviations
- Operation quality checkpoints w routing (FR-QA-026)
- NCR → CAPA lifecycle z root cause analysis
- Scanner-first QA workflows (ADR-006)
- Multi-tenancy RLS z `org_id` na każdej tabeli (ADR-003/013)

---

## 2. Objectives

### Cel główny
Zapewnienie zgodności z regulacjami bezpieczeństwa żywności (HACCP, FSMA, EU 178/2002) oraz zarządzanie jakością na każdym etapie produkcji — od przyjęcia surowców po zwolnienie partii.

### Cele szczegółowe
1. **Regulatory compliance**: HACCP/CCP monitoring, audit trail, e-signatures (FDA 21 CFR Part 11)
2. **Defect prevention**: NCR/CAPA lifecycle, root cause analysis, corrective actions
3. **Traceability**: Pełna trasowalność jakości LP → batch → shipment < 30 s
4. **Operational efficiency**: Scanner QA workflows, auto-hold on failure, sampling plans AQL
5. **Supplier quality**: Rating, audits, supplier NCR tracking (Phase 2)

---

## 3. Personas

| Persona | Rola w Quality | Kluczowe workflow |
|---------|---------------|-------------------|
| **Inspektor QA** | Inspekcje incoming/in-process/final, test results | Desktop + Scanner: inspection → record results → pass/fail |
| **Kierownik jakości (QA Manager)** | Zatwierdzanie specyfikacji, batch release, NCR management, HACCP | Desktop: spec approval, hold release, NCR workflow, CCP review |
| **Operator produkcji** | CCP monitoring, operation checkpoints | Scanner: record CCP values, checkpoint pass/fail |
| **Kierownik produkcji** | Przegląd NCR, yield issues, QC holds | Desktop: NCR review, hold status, production quality KPIs |
| **Dyrektor jakości** | Dashboard, analytics, supplier audits, CAPA oversight | Desktop: quality dashboard, audit trail, supplier scorecards |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP)

| Obszar | Zakres |
|--------|--------|
| **QA Status** | 7 statusów (PENDING→PASSED/FAILED/HOLD/RELEASED/QUARANTINED/COND_APPROVED), status transitions z walidacją |
| **Quality Holds** | Hold creation/release na LP/batch, reason codes, disposition, priority |
| **Specyfikacje** | Product specifications CRUD, versioning, approval workflow, test parameters |
| **Incoming Inspection** | Inspekcja przy GRN (PO receipt), auto-create, test results recording |
| **Test Results** | Recording, pass/fail/conditional, linked to inspection + spec parameters |
| **Basic NCR** | NCR creation, severity levels (critical/major/minor) |
| **Scanner QA** | Pass/fail na LP, quick inspection, 44px touch targets |
| **Basic HACCP** | HACCP checklisty (CCP monitoring points) — basic |
| **Sampling Plans** | AQL-based sampling (ISO 2859 / ANSI Z1.4) |
| **PRD-UPDATE-LIST** | [6.1] QC Hold tracking linked to production batch |

### 4.2 Out of Scope — Phase 2

| Obszar | Zakres |
|--------|--------|
| **In-Process Inspection** | Inspekcje przy WO operations, tied to routing |
| **Final Inspection** | Finished goods QA before batch release |
| **Batch Release** | Approval gate after final inspection |
| **NCR Workflow** | Full lifecycle: investigation → root cause → corrective action → verification → close |
| **Operation Checkpoints** | Quality gates w routing operations (FR-QA-026) |
| **Quality Alerts** | Notifications na CCP deviations, hold aging, NCR overdue |
| **Test Result Trending** | Analytics i trending charts |
| **HACCP Full** | HACCP plan setup, CCP definition, monitoring (desktop + scanner), deviation handling, alerts, verification |
| **CoA** | Certificate of Analysis templates, generation, PDF export |
| **CAPA** | Corrective/Preventive Actions creation, workflow, effectiveness checks |
| **Supplier Quality** | Rating, audits, findings, supplier NCRs |
| **Dashboard & Analytics** | Quality KPI dashboard, audit trail reports, defect Pareto |
| **Document Control** | Versioning, retention sample management |
| **PRD-UPDATE-LIST** | [6.2] Yield issue tracking, [6.3] Accident/near miss reporting |

### 4.3 Exclusions (Nigdy w M08)

- LIMS integration (→ M13 Integrations, Phase 2+)
- Calibration management system (osobny moduł lub integracja)
- Customer-specific CoA portals (→ M13 Integrations)
- Multi-language quality forms (Phase 3+)
- Video/photo attachments for inspections (Phase 3+)

---

## 5. Constraints

### Techniczne
- **LP-level QA**: QA status jest per LP (ADR-001). Hold/release operuje na LP, nie na luźnych ilościach
- **Multi-tenant RLS**: `org_id UUID NOT NULL` na WSZYSTKICH tabelach; RLS enforced (ADR-003/013)
- **Service layer**: Logika w `lib/services/*-service.ts`, walidacja Zod (ADR-015/016/018)
- **site_id NULL**: Kolumna `site_id` na tabelach od początku (przygotowanie M11)
- **Immutable audit trail**: Rekordy jakości nie mogą być modyfikowane po podpisaniu

### Biznesowe
- Inspekcje incoming obowiązkowe (konfigurowalny per produkt)
- Final inspection obowiązkowa przed batch release
- CCP monitoring records muszą być dostępne w < 30 s (regulatory)

### Regulacyjne
- **FDA 21 CFR Part 11**: Electronic records and signatures (P1, Phase 2)
- **FSMA**: Food Safety Modernization Act — traceability
- **HACCP**: Codex Alimentarius — 7 principles
- **ISO 22000**: Food Safety Management System
- **Data retention**: Inspection records 7 lat, HACCP 5 lat, NCR/CAPA/CoA 10 lat

---

## 6. Decisions

### D1. QA Status na LP (ADR-001)
**Obowiązkowe**: Każde LP ma `qa_status` (PENDING/PASSED/FAILED/HOLD/RELEASED/QUARANTINED/COND_APPROVED). Tylko LP z `qa_status = 'passed'` lub `'released'` mogą być alokowane do SO (M07) lub konsumowane w produkcji (M06). Hold blokuje wszelkie operacje na LP.

### D2. LP Status po Produkcji (DECYZJA)
**LP po produkcji wychodzą jako AVAILABLE, NIE jako PENDING**. Palety po produkcji są domyślnie dostępne. QA zmienia status z AVAILABLE na HOLD/BLOCKED tylko gdy inspekcja wykryje problem. Uzasadnienie: przy 40 paletach na zmianę, sprawdzana jest co 10-ta — nie można blokować wszystkich.

### D3. 7 Quality Statuses (DECYZJA)
| Status | Allows Shipment | Allows Consumption | Opis |
|--------|----------------|-------------------|------|
| PENDING | No | No | Oczekuje na inspekcję (incoming only) |
| PASSED | Yes | Yes | Przeszło inspekcję |
| FAILED | No | No | Nie spełnia specyfikacji |
| HOLD | No | No | QA hold — investigation required |
| RELEASED | Yes | Yes | Zwolnione po hold |
| QUARANTINED | No | No | Izolowane pending review |
| COND_APPROVED | Restricted | Restricted | Ograniczone użycie |

**Uwaga**: PENDING dotyczy głównie incoming (GRN). LP z produkcji → AVAILABLE (nie PENDING).

### D4. Inspection Types (DECYZJA)
- **Incoming** (Phase 1): Trigger = PO receipt / GRN. Scope = raw materials, packaging
- **In-Process** (Phase 2): Trigger = WO operation completion. Scope = WIP, semi-finished
- **Final** (Phase 2): Trigger = WO completion. Scope = finished goods before release

### D5. HACCP Approach (DECYZJA)
**Phase 1**: Basic HACCP checklisty — CCP monitoring points z manual data entry, pass/fail. **Phase 2**: Full HACCP plan setup, CCP definition z critical limits (min/max), real-time monitoring (desktop + scanner), deviation handling z auto-NCR, verification records.

### D6. NCR Severity & Response (DECYZJA)
- **Critical**: Food safety risk → response 24h, stop production, quarantine batch
- **Major**: Quality impact → response 48h, immediate corrective action
- **Minor**: Process deviation → response 7d, document and monitor

### D7. Operation Quality Checkpoints (FR-QA-026, DECYZJA)
Quality checkpoints w routing operations (z M02 Technical). Typy: visual, measurement, equipment, attribute. `auto_hold_on_failure` flag — jeśli true, fail = halt production + QA notification. Operator sign-off required. Distinct from HACCP CCPs (strategic) — checkpoints are tactical per-operation checks.

### D8. Scanner-First QA (ADR-006)
Dedykowane strony `/scanner/qa/`. Quick inspection: scan LP → pass/fail → done. CCP monitoring: scan WO → record value → auto-validate. 44px touch targets, high contrast, audio/visual feedback.

### D9. E-Signature (DECYZJA)
**Wewnętrzny e-signature** (user_id + timestamp + hash). Nie używamy zewnętrznych vendorów (DocuSign/Adobe Sign). Implementacja w Phase 2 dla: batch release approval, CoA signing, NCR closure, CAPA effectiveness verification. Zgodność FDA 21 CFR Part 11.

### D10. RLS / org_id (ADR-003/013)
`org_id UUID NOT NULL` na WSZYSTKICH tabelach Quality (30 tabel). RLS enforced. Audit trail immutable — no UPDATE/DELETE on signed records.

### D11. QC Hold Linked to Production Batch (PRD-UPDATE-LIST 6.1, DECYZJA)
**Obowiązkowe**: Quality holds muszą być linkowane do production batch (WO). `quality_holds` ma `reference_type = 'wo'` + `reference_id = work_order_id`. Dashboard pokazuje holds per batch z boxes held/rejected count.

### D12. Yield Issues = rozszerzenie NCR (DECYZJA)
Yield issue tracking [6.2] realizowane jako rozszerzenie tabeli `ncr_reports` z `ncr_type = 'yield_issue'` + dodatkowe pola: `target_yield`, `actual_yield`, `claim_pct`, `claim_value`. NCR dotyczy produkcji i jakości.

### D13. Accidents/Near Misses = osobna tabela (DECYZJA)
Accident/near miss reporting [6.3] to **osobna tabela `quality_incidents`** (NIE rozszerzenie NCR). Wypadki przy pracy to inna domena niż NCR (produkcja/jakość). Pola: `type` (accident/near_miss), `severity`, `location`, `description`, `corrective_action`, `reported_by`, `incident_date`.

### D14. Audit Trail (ADR-008)
Hybrydowy: PG triggery + app context. Tabela `quality_audit_log` z old_data/new_data, user_id, change_reason. Immutable po podpisaniu. Retencja per record type (7-10 lat). Zgodność FDA 21 CFR Part 11.

---

## 7. Module Map

### Quality sub-areas

```
M08 Quality
├── QA Status Management (7 statuses, transitions, LP-level)
├── Quality Holds (hold/release, reason codes, disposition)
├── Product Specifications (versioned, approval workflow, test parameters)
├── Inspections
│   ├── Incoming (GRN/PO receipt)
│   ├── In-Process (WO operations) [Phase 2]
│   └── Final (batch release gate) [Phase 2]
├── Test Results (recording, pass/fail, linked to specs)
├── Sampling Plans (AQL, ISO 2859)
├── NCR (creation, workflow, root cause, corrective action)
├── HACCP/CCP
│   ├── HACCP Plans (product-level)
│   ├── CCP Definition (critical limits)
│   ├── CCP Monitoring (desktop + scanner)
│   ├── CCP Deviations (alerts, corrective action)
│   └── Verification Records
├── Operation Quality Checkpoints (FR-QA-026, routing-level)
├── CAPA (corrective/preventive actions) [Phase 2]
├── CoA (Certificate of Analysis) [Phase 2]
├── Supplier Quality (ratings, audits) [Phase 2]
├── Scanner QA Workflows
└── Dashboard & Analytics [Phase 2]
```

### Zależności modułowe

| Upstream | Dane wymagane |
|----------|---------------|
| M01 Settings | organizations, users, roles, allergens |
| M02 Technical | products (specs linked), routings (operation checkpoints) |
| M03 Warehouse | license_plates (QA status), locations (quarantine zones) |
| M06 Production | work_orders (in-process inspection, CCP monitoring, batch link) |

| Downstream | Dane dostarczane |
|------------|------------------|
| M07 Shipping | LP qa_status gating (only 'passed' for allocation), QA hold on returns |
| M06 Production | Operation checkpoint results, batch release gate |
| M15 Reporting | QC holds dashboard, yield issues |
| M04 Planning | Batch release controls MRP availability |

---

## 8. Requirements

### Epiki wewnątrz modułu (logiczny porządek)

---

### EPIC 8A — QA Status & Holds [Phase 1 / MVP]

**Stories**: 06.0, 06.1, 06.2 | **Effort**: ~8-10 dni

#### Backend
- **DB**: Tabele `quality_holds`, `quality_hold_items` z `org_id`, `site_id NULL`
- **QA Status types**: 7 statusów seeded w tabeli `quality_status_types`
- **API**: `GET /api/quality/status/types`, `POST /api/quality/status/change`, `GET /api/quality/status/transitions`, `POST /api/quality/status/validate-transition`, `GET /api/quality/status/history/:entityType/:entityId`
- **Holds API**: `POST /api/quality/holds`, `GET /api/quality/holds`, `GET /api/quality/holds/:id`, `PATCH /api/quality/holds/:id/release`, `GET /api/quality/holds/active`, `GET /api/quality/holds/stats`, `GET /api/quality/holds/filters`
- **Zod**: `holdSchema`, `statusChangeSchema` z walidacją transition rules
- **Service**: `quality-status-service.ts`, `quality-hold-service.ts`
- **[6.1] PRD-UPDATE-LIST**: QC Hold tracking linked to production batch — `quality_holds.reference_type = 'wo'`, `reference_id = work_order_id`. Dashboard: holds per batch, boxes held/rejected
- **RLS**: org_id isolation, immutable audit trail
- **FR**: FR-QA-001 (Status Management), FR-QA-002 (Hold Management)

#### Frontend/UX
- Quality holds list z filtrami (status, priority, reason, date range)
- Hold creation modal: select LP/batch, reason, priority, disposition
- Hold release workflow: release notes, approval
- Status transition history timeline
- Quality settings page (org-level configuration)

---

### EPIC 8B — Specifications & Test Parameters [Phase 1 / MVP]

**Stories**: 06.3, 06.4 | **Effort**: ~6-8 dni

#### Backend
- **DB**: Tabele `quality_specifications`, `quality_spec_parameters` z `org_id`
- **API**: CRUD `/api/quality/specifications`, `GET /specifications/product/:productId`, `POST /specifications/:id/approve`, `POST /specifications/:id/clone`, `POST /specifications/:id/complete-review`, parameters CRUD
- **Zod**: `specificationSchema`, `parameterSchema` z walidacją min < max, version increment
- **Service**: `specification-service.ts` — CRUD, versioning, approval workflow (draft → active → expired/superseded)
- **FR**: FR-QA-003 (Specifications), FR-QA-004 (Test Templates)

#### Frontend/UX
- Specifications list z filtrami (product, status, version)
- Specification create/edit wizard (3-step: header → parameters → review)
- Parameter table z inline editing (name, type, target, min/max, unit, method, is_critical)
- Approval workflow UI (approve/reject z notes)

---

### EPIC 8C — Incoming Inspection & Test Results [Phase 1 / MVP]

**Stories**: 06.5, 06.6, 06.7, 06.8 | **Effort**: ~12-16 dni

#### Backend
- **DB**: Tabele `quality_inspections`, `quality_test_results`, `sampling_plans`, `sampling_records` z `org_id`
- **API**: Inspections CRUD, `POST /inspections/:id/start`, `POST /inspections/:id/complete`, `POST /inspections/:id/cancel`, `POST /inspections/:id/assign`, `GET /inspections/pending`, `GET /inspections/incoming`
- **Sampling API**: `GET/POST /api/quality/sampling-plans`, `POST /api/quality/sampling-records`
- **Scanner API**: Quick inspection (scan LP → pass/fail), test result capture
- **Service**: `inspection-service.ts`, `test-result-service.ts`, `sampling-service.ts`
- **Auto-create**: Inspection auto-created on GRN receipt (konfigurowalny per product)
- **AQL**: ISO 2859 / ANSI Z1.4 sampling tables (lot size → sample size → accept/reject numbers)
- **FR**: FR-QA-005 (Incoming Inspection), FR-QA-004 (Test Recording), FR-QA-008 (Sampling Plans), FR-QA-025 (Scanner)

#### Frontend/UX
- Inspection list z filtrami (type, status, date, inspector)
- Inspection detail: header, test results table, pass/fail summary
- Test result recording form (per parameter: measured value, result, notes)
- Scanner QA: scan LP → quick pass/fail → done (< 1s capture target)
- Sampling plan configuration (AQL tables, lot size ranges)

---

### EPIC 8D — Basic NCR [Phase 1 / MVP]

**Stories**: 06.9 | **Effort**: ~4-5 dni

#### Backend
- **DB**: Tabela `ncr_reports` z `org_id`
- **API**: `GET/POST /api/quality/ncrs`, `GET /ncrs/:id`, `PUT /ncrs/:id`, `POST /ncrs/:id/assign`, `POST /ncrs/:id/submit`, `POST /ncrs/:id/close`
- **Zod**: `ncrSchema` z walidacją severity (critical/major/minor), reference_type
- **Service**: `ncr-service.ts` — creation, basic status tracking
- **Status**: Draft → Open (basic w Phase 1, full workflow w Phase 2)
- **FR**: FR-QA-009 (NCR Creation — basic)

#### Frontend/UX
- NCR list z filtrami (severity, status, date)
- NCR creation form: title, description, severity, detected_by, reference (LP/WO/PO)
- NCR detail view z status badge

---

### EPIC 8E — Basic HACCP Checklisty [Phase 1 / MVP]

**Stories**: Subset of 06.21-06.24 (basic only) | **Effort**: ~4-6 dni

#### Backend
- **DB**: Tabele `haccp_plans`, `haccp_ccps`, `haccp_monitoring_records` (basic) z `org_id`
- **API**: Basic HACCP plan CRUD, CCP definition, monitoring record creation
- **Service**: `haccp-service.ts` — basic plan setup, CCP monitoring (manual data entry, pass/fail)
- **FR**: FR-QA-013 (HACCP Plan Setup — basic), FR-QA-014 (CCP Monitoring — basic)

#### Frontend/UX
- HACCP plan list per product
- CCP definition: step name, hazard type, critical limits (min/max), monitoring frequency
- CCP monitoring: record value, auto-validate against limits, pass/fail

---

### EPIC 8F — In-Process & Final Inspection [Phase 2]

**Stories**: 06.10, 06.11, 06.12 | **Effort**: ~10-14 dni

#### Backend
- **DB**: Reuse `quality_inspections` z `inspection_type = 'in_process'` / `'final'`
- **API**: `GET /inspections/in-process`, `GET /inspections/final`, `POST /batch/:batchId/release-check`, `POST /batch/:batchId/release`
- **Service**: `batch-release-service.ts` — release gate (all inspections passed, all CCPs within limits, no open holds)
- **FR**: FR-QA-006 (In-Process), FR-QA-007 (Final), FR-QA-010 (Batch Release)

---

### EPIC 8G — NCR Full Workflow & CAPA [Phase 2]

**Stories**: 06.13-06.16, 06.31-06.33 | **Effort**: ~14-20 dni

#### Backend
- **DB**: Tabele `ncr_workflow`, `capa_records`, `capa_actions`, `capa_effectiveness_checks` z `org_id`
- **NCR workflow**: Draft → Open → Investigation → Root Cause → Corrective Action → Verification → Closed/Reopened
- **CAPA**: Creation from NCR, action items, effectiveness checks, closure
- **FR**: FR-QA-009 (NCR full), FR-QA-016 (CAPA Creation), FR-QA-017 (CAPA Workflow)

---

### EPIC 8H — Operation Quality Checkpoints [Phase 2]

**Stories**: 06.19, 06.20 (FR-QA-026) | **Effort**: ~6-8 dni

#### Backend
- **DB**: Tabele `operation_quality_checkpoints`, `operation_checkpoint_results` z `org_id`
- **API**: Checkpoints CRUD per routing/operation, results recording, sign-off
- **Service**: `operation-checkpoint-service.ts`
- **Business rules**: Checkpoints per operation in routing, auto-hold on failure, operator sign-off required
- **FR**: FR-QA-026 (Operation Quality Checkpoints)

---

### EPIC 8I — HACCP Full & CCP Advanced [Phase 2]

**Stories**: 06.21-06.26, 06.30 | **Effort**: ~14-18 dni

#### Backend
- **DB**: Tabele `haccp_deviations`, `haccp_verification_records` z `org_id`
- **CCP monitoring**: Desktop + scanner, real-time validation, deviation alerts (< 30s delivery)
- **Deviation handling**: Auto-create deviation record, link to NCR, corrective action capture
- **Verification**: Scheduled verification tasks, calibration tracking
- **FR**: FR-QA-013-015 (HACCP full)

---

### EPIC 8J — CoA Management [Phase 2]

**Stories**: 06.27, 06.28, 06.29 | **Effort**: ~8-10 dni

#### Backend
- **DB**: Tabele `certificates_of_analysis`, `coa_templates`, `coa_parameters` z `org_id`
- **CoA generation**: Auto from final inspection results, template-based, PDF/A export
- **E-signature**: QA approval with electronic signature
- **FR**: FR-QA-011 (CoA Generation), FR-QA-012 (CoA Templates)

---

### EPIC 8K — Supplier Quality [Phase 2]

**Stories**: 06.34-06.36 | **Effort**: ~8-10 dni

#### Backend
- **DB**: Tabele `supplier_quality_ratings`, `supplier_audits`, `supplier_audit_findings`, `supplier_ncrs` z `org_id`
- **Rating**: Scorecard (quality/delivery/response scores), weighted average
- **Audits**: Audit scheduling, findings tracking, corrective actions
- **FR**: FR-QA-018 (Supplier Rating), FR-QA-019 (Supplier Audits)

---

### EPIC 8L — Dashboard, Analytics & Audit Trail [Phase 2]

**Stories**: 06.17, 06.18, 06.37-06.40 | **Effort**: ~12-16 dni

#### Backend
- **API**: `GET /api/quality/dashboard`, reports (audit-trail, inspection-summary, ncr-trends, ccp-compliance, supplier-scorecard), analytics (defect-pareto)
- **[6.2] PRD-UPDATE-LIST**: Yield issue tracking — rozszerzenie `ncr_reports` z `ncr_type = 'yield_issue'` + pola: target_yield, actual_yield, claim_pct, claim_value
- **[6.3] PRD-UPDATE-LIST**: Accident/near miss reporting — osobna tabela `quality_incidents` (type: accident/near_miss, severity, location, description, corrective_action, reported_by, incident_date)
- **FR**: FR-QA-020 (Dashboard), FR-QA-021 (Audit Trail), FR-QA-022 (Analytics), FR-QA-023 (Retention Samples), FR-QA-024 (Document Control)

#### Zadania z PRD-UPDATE-LIST (OBOWIĄZKOWE)

| ID | Zadanie | Priorytet | Zmiana |
|----|---------|-----------|--------|
| **6.1** | QC Hold tracking linked to production batch ✅ MVP | HIGH | `quality_holds.reference_type = 'wo'`, dashboard: holds per batch |
| **6.2** | Yield issue tracking | HIGH | Rozszerzenie `ncr_reports` z `ncr_type = 'yield_issue'` + pola: target_yield, actual_yield, claim_pct, claim_value |
| **6.3** | Accident/near miss reporting | MEDIUM | Osobna tabela `quality_incidents` (type: accident/near_miss, severity, location, description, corrective_action, reported_by, incident_date) |

---

## 9. KPIs

### Phase 1 (MVP)

| KPI | Target | Pomiar |
|-----|--------|--------|
| First Pass Yield | > 95% | Passed inspections / Total inspections × 100 |
| Hold Resolution Time | < 3 dni | Days from hold to release |
| Inspection Backlog | < 10 | Pending inspections count |
| Scanner QA Capture Time | < 1s | Time from scan to result recorded |
| CCP Compliance (basic) | > 99% | Within limits / Total readings × 100 |
| QC Hold Apply/Release | < 500ms | API response time |

### Phase 2

| KPI | Target | Pomiar |
|-----|--------|--------|
| NCR Rate | < 5 per 1000 batches | NCRs / batches × 1000 |
| NCR Response Time (Critical) | < 24h | Time from detection to corrective action |
| CAPA Closure Rate | > 90% | CAPAs closed on time / Total |
| CoA Turnaround | < 24h | Hours from batch close to CoA issue |
| Operation Checkpoint Pass Rate | > 98% | Checkpoint pass / Total × 100 |
| Supplier Quality Score | > 85 | Weighted average of deliveries |
| CCP Alert Delivery | < 30s | Time from deviation to alert |

---

## 10. Risks

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| **Złożoność HACCP/CCP** | Średnie | Wysoki | Phase 1 = basic checklisty, Phase 2 = full monitoring |
| **FDA 21 CFR Part 11 compliance** | Średnie | Wysoki | E-signature w Phase 2; audit trail immutable od Phase 1 |
| **NCR workflow complexity** | Średnie | Średni | Phase 1 = basic creation, Phase 2 = full lifecycle |
| **Data retention (7-10 lat)** | Niskie | Średni | Archival strategy; partitioned tables; retention policies |
| **Scanner offline CCP monitoring** | Średnie | Wysoki | Phase 2 offline (IndexedDB, max 50 records); online-first w Phase 1 |
| **Integration z Production (WO)** | Średnie | Średni | Clear API contracts; M06 must expose operation events |
| **Sampling plan complexity (AQL)** | Niskie | Niski | ISO 2859 tables seeded; configurable per product |
| **RLS bypass na quality records** | Niskie | Wysoki | Automated org_id testy; security audit |
| **CoA PDF generation performance** | Niskie | Średni | < 5s target; template caching; async generation |
| **Operation checkpoint adoption** | Średnie | Średni | Scanner-first UX; mandatory checkpoints configurable |

---

## 11. Success Criteria (MVP)

### Funkcjonalne
- [ ] QA status management: 7 statusów z valid transitions
- [ ] Quality holds: create/release na LP z audit trail
- [ ] QC Hold linked to production batch [6.1]
- [ ] Product specifications: CRUD z versioning i approval workflow
- [ ] Incoming inspection: auto-create on GRN, test results recording
- [ ] Sampling plans: AQL-based (ISO 2859 tables)
- [ ] Scanner QA: scan LP → pass/fail (< 1s capture)
- [ ] Basic NCR: creation z severity levels
- [ ] Basic HACCP: CCP monitoring points z pass/fail
- [ ] LP z qa_status = 'passed' only → allocation w M07 Shipping
- [ ] Audit trail na: status changes, hold/release, inspection results, NCR

### Niefunkcjonalne
- [ ] API response < 500ms (P95)
- [ ] QC hold apply/release < 500ms
- [ ] Scanner test capture < 1s
- [ ] RLS enforced na wszystkich 30 tabelach Quality
- [ ] Unit test coverage > 80% na services
- [ ] Inspection records retention: 7 lat (archival policy)

### Biznesowe
- [ ] 20+ produktów z configured specifications
- [ ] 10+ użytkowników trained na inspections
- [ ] 3+ HACCP plans configured (basic)
- [ ] Scanner QA deployed na Zebra TC52
- [ ] Zero data loss incidents (30 dni post-launch)

---

## 12. References

### Dokumenty źródłowe
- PRD Quality (oryginalny): `new-doc/08-quality/prd/quality.md`
- Quality Architecture: `new-doc/08-quality/decisions/quality-arch.md`
- Analysis: `new-doc/08-quality/ANALYSIS.md`
- PRD Update List: `new-doc/_meta/PRD-UPDATE-LIST.md`
- Foundation PRD: `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md`

### ADR
- ADR-001 LP Inventory (QA status per LP) | ADR-003/013 RLS Multi-Tenancy | ADR-006 Scanner-First | ADR-008 Audit Trail | ADR-015/016/018 Service Layer + Zod

### Tabele DB (30 tabel)
**Core Quality**: `quality_specifications`, `quality_spec_parameters`, `quality_inspections`, `quality_test_results`, `quality_holds`, `quality_hold_items`
**Operation Quality**: `operation_quality_checkpoints`, `operation_checkpoint_results`
**NCR & CAPA**: `ncr_reports`, `ncr_workflow`, `capa_records`, `capa_actions`, `capa_effectiveness_checks`
**CoA**: `certificates_of_analysis`, `coa_templates`, `coa_parameters`
**Sampling**: `sampling_plans`, `sampling_records`
**HACCP/CCP**: `haccp_plans`, `haccp_ccps`, `haccp_monitoring_records`, `haccp_deviations`, `haccp_verification_records`
**Supplier Quality**: `supplier_quality_ratings`, `supplier_audits`, `supplier_audit_findings`, `supplier_ncrs`
**Audit & Traceability**: `quality_audit_log`, `quality_document_versions`, `retention_samples`

### Kluczowe reguły (checklist)
1. ✅ QA status per LP — only 'passed'/'released' → allocation/shipment
2. ✅ LP po produkcji = AVAILABLE (nie PENDING) — QA zmienia na HOLD tylko przy problemie
3. ✅ 7 quality statuses z valid transition rules
4. ✅ Quality holds linked to production batch (WO) [6.1]
5. ✅ Incoming inspection auto-create on GRN
6. ✅ AQL sampling plans (ISO 2859)
7. ✅ NCR severity: critical (24h), major (48h), minor (7d)
8. ✅ Yield issues = rozszerzenie NCR z ncr_type = 'yield_issue' [6.2]
9. ✅ Accidents/near misses = osobna tabela quality_incidents [6.3]
10. ✅ HACCP/CCP monitoring z auto-validation against limits
11. ✅ Operation quality checkpoints w routing (FR-QA-026)
12. ✅ E-signature wewnętrzny (user + timestamp + hash) — Phase 2
13. ✅ Audit trail immutable po podpisaniu
14. ✅ org_id/RLS na WSZYSTKICH tabelach
15. ✅ Scanner-first QA (44px targets, < 1s capture)
16. ✅ Data retention: inspections 7 lat, NCR/CAPA/CoA 10 lat, HACCP 5 lat
17. ✅ site_id NULL na tabelach (przygotowanie M11)

### Rozstrzygnięte pytania

1. ✅ **E-signature**: Wewnętrzny e-signature (user_id + timestamp + hash). Bez zewnętrznych vendorów. Phase 2.
2. ✅ **LP po produkcji**: Status AVAILABLE (nie PENDING). QA zmienia na HOLD/BLOCKED tylko gdy inspekcja wykryje problem. Przy 40 paletach/zmianę sprawdzana co 10-ta — nie blokujemy wszystkich.
3. ✅ **Retention samples (FR-QA-023)**: Dodane do Phase 2.
4. ✅ **Yield issues [6.2]**: Rozszerzenie tabeli NCR z `ncr_type = 'yield_issue'`.
5. ✅ **Accidents [6.3]**: Osobna tabela `quality_incidents` — wypadki przy pracy to inna domena niż NCR.

---

_PRD M08-Quality v2.1 — 12 epików (5 MVP + 7 Phase 2), 26 FR, 3 zadania PRD-UPDATE-LIST, 31 tabel DB._
_Changelog v2.1: Odpowiedzi na pytania doprecyzowujące. LP po produkcji = AVAILABLE (nie PENDING). E-signature wewnętrzny. Yield issues = rozszerzenie NCR. Accidents = osobna tabela quality_incidents. Retention samples → Phase 2. Decisions D1-D14._
_Changelog v2.0: Scalenie z ANALYSIS.md, quality-arch.md, PRD-UPDATE-LIST (6.1–6.3). Konsolidacja Phase 1/2/3/4 → Phase 1 (MVP) / Phase 2. Backend-first structure. FR-QA-026 operation checkpoints included._
_Data: 2026-02-17_
