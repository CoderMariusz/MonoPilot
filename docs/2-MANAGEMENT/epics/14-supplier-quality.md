# Epic 14: Supplier Quality Management - Phase 3

**Status:** PLANNED
**Priority:** P2 - Wazna dla wiekszych klientow i compliance
**Stories:** 18
**Estimated Effort:** 5-6 tygodni
**Dependencies:** Epic 3 (Planning - Suppliers), Epic 6 (Quality)

---

## 1. Overview

### 1.1 Cel Epica

Modul Supplier Quality Management (SQM) zarzadza jakoscia dostaw od dostawcow:
- **Supplier Audits** - audyty dostawcow
- **Supplier Scorecards** - ocena dostawcow
- **Supplier Portal** - portal dla dostawcow (podstawy)
- **CoA Verification Workflow** - weryfikacja certyfikatow

### 1.2 Luki Konkurencyjne Zamykane

| Luka | Konkurenci | Status MonoPilot |
|------|-----------|------------------|
| Supplier Quality Management | 4/4 maja | Implementowane w tym epicu |
| Supplier Audits | 3/4 maja | Implementowane w tym epicu |
| Supplier Scorecards | 3/4 maja | Implementowane w tym epicu |
| Supplier Portal | 2/4 maja | Podstawy w tym epicu |

### 1.3 Business Value

- **Jakosc dostaw:** Lepsza kontrola jakosci od dostawcow
- **Compliance:** Spełnienie wymagan BRC/IFS dot. dostawcow
- **Decyzje:** Dane do wyboru i oceny dostawcow
- **Efektywnosc:** Automatyzacja procesu weryfikacji

---

## 2. User Stories

### 2.1 Supplier Audits

#### Story 14.1: Audit Template Definition

**Jako** Quality Manager
**Chce** definiowac szablony audytow dostawcow
**Aby** ustandaryzowac proces audytu

**Acceptance Criteria:**
- [ ] CRUD dla audit templates
- [ ] Template ma sekcje/kategorie
- [ ] Kazda sekcja ma pytania/kryteria
- [ ] Scoring: points lub pass/fail per kryterium
- [ ] Overall score calculation formula

**Technical Notes:**
```sql
CREATE TABLE supplier_audit_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    audit_type VARCHAR(50), -- initial, periodic, unannounced
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE supplier_audit_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES supplier_audit_templates(id),
    name VARCHAR(100) NOT NULL,
    weight_pct NUMERIC(5,2) DEFAULT 100,
    section_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE supplier_audit_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES supplier_audit_sections(id),
    criterion_text TEXT NOT NULL,
    max_score INTEGER DEFAULT 10,
    is_critical BOOLEAN DEFAULT false,
    guidance_notes TEXT,
    criteria_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 14.2: Schedule Supplier Audit

**Jako** Quality Manager
**Chce** zaplanowac audyt dostawcy
**Aby** regularnie weryfikowac jakosc

**Acceptance Criteria:**
- [ ] Wybor dostawcy, template, data
- [ ] Przypisanie auditora/zespolu
- [ ] Status: scheduled
- [ ] Notyfikacja do auditorow
- [ ] Calendar view audytow

**Technical Notes:**
```sql
CREATE TABLE supplier_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    template_id UUID NOT NULL REFERENCES supplier_audit_templates(id),
    audit_number VARCHAR(20) NOT NULL,
    scheduled_date DATE,
    actual_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
    lead_auditor UUID REFERENCES auth.users(id),
    team_members UUID[],
    overall_score NUMERIC(5,2),
    result VARCHAR(20), -- approved, conditional, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 14.3: Conduct Audit (Record Results)

**Jako** Auditor
**Chce** rejestrowac wyniki audytu
**Aby** dokumentowac ocenę dostawcy

**Acceptance Criteria:**
- [ ] Formularz per kryterium z template
- [ ] Score lub pass/fail per kryterium
- [ ] Observations/findings per kryterium
- [ ] Attachments (zdjecia, dokumenty)
- [ ] Auto-calculate overall score

**Technical Notes:**
```sql
CREATE TABLE supplier_audit_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES supplier_audits(id),
    criterion_id UUID NOT NULL REFERENCES supplier_audit_criteria(id),
    score INTEGER,
    is_pass BOOLEAN,
    finding_type VARCHAR(30), -- none, observation, minor_nc, major_nc
    finding_description TEXT,
    corrective_action_required BOOLEAN DEFAULT false,
    recorded_by UUID REFERENCES auth.users(id),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 14.4: Audit Findings & CAPA

**Jako** Quality Manager
**Chce** sledzic findings i corrective actions
**Aby** zapewnic poprawe u dostawcy

**Acceptance Criteria:**
- [ ] Lista findings per audit
- [ ] NCR-like workflow dla major findings
- [ ] Corrective action request do dostawcy
- [ ] Due date dla actions
- [ ] Verification of closure

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 14.5: Audit Report Generation

**Jako** Quality Manager
**Chce** generowac raport z audytu
**Aby** dokumentowac i komunikowac wyniki

**Acceptance Criteria:**
- [ ] PDF report z summary
- [ ] All criteria scores
- [ ] Findings list
- [ ] Overall result i rekomendacja
- [ ] Sign-off section
- [ ] Export/email

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.2 Supplier Scorecards

#### Story 14.6: Scorecard Configuration

**Jako** Procurement Manager
**Chce** definiowac kryteria scorecard
**Aby** mierzyc performance dostawcow

**Acceptance Criteria:**
- [ ] Lista KPIs z wagami
- [ ] Typowe KPIs:
  - On-time delivery %
  - Quality acceptance rate %
  - Price competitiveness
  - Responsiveness
  - Audit score
- [ ] Weight per KPI (suma = 100%)
- [ ] Target values per KPI

**Technical Notes:**
```sql
CREATE TABLE supplier_scorecard_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    kpi_name VARCHAR(100) NOT NULL,
    kpi_code VARCHAR(30) NOT NULL,
    weight_pct NUMERIC(5,2) NOT NULL,
    target_value NUMERIC(10,2),
    calculation_method VARCHAR(50), -- automatic, manual
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 14.7: Automatic KPI Calculation

**Jako** System
**Chce** obliczac KPI automatycznie
**Aby** miec aktualne dane

**Acceptance Criteria:**
- [ ] On-time delivery = (PO delivered on time / total PO) * 100
- [ ] Quality rate = (LP accepted / LP received) * 100
- [ ] NCR rate = NCR count / PO count
- [ ] Calculation per period (monthly, quarterly)
- [ ] Trend tracking

**Technical Notes:**
```sql
CREATE TABLE supplier_scorecards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    kpi_id UUID REFERENCES supplier_scorecard_config(id),
    kpi_value NUMERIC(10,2),
    weighted_score NUMERIC(10,2),
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE supplier_scorecard_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    overall_score NUMERIC(5,2),
    rating VARCHAR(20), -- A, B, C, D
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, supplier_id, period_start, period_end)
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 14.8: Supplier Ranking Dashboard

**Jako** Procurement Manager
**Chce** widziec ranking dostawcow
**Aby** podejmowac decyzje zakupowe

**Acceptance Criteria:**
- [ ] Tabela/grid dostawcow z overall score
- [ ] Ranking (1, 2, 3...)
- [ ] Rating (A/B/C/D)
- [ ] Sparkline trend
- [ ] Filter by category, status
- [ ] Drill-down to scorecard detail

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 14.9: Supplier Performance Trend

**Jako** Quality Manager
**Chce** analizowac trend performance dostawcy
**Aby** identyfikowac poprawę lub pogorszenie

**Acceptance Criteria:**
- [ ] Chart: overall score over time
- [ ] Per-KPI trend lines
- [ ] Events overlay (audity, NCR)
- [ ] Period selection

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.3 Supplier Portal (Basic)

#### Story 14.10: Supplier Portal Access

**Jako** Supplier
**Chce** mieć dostep do portalu
**Aby** widziec swoje PO i dokumenty

**Acceptance Criteria:**
- [ ] Osobny login dla dostawcow
- [ ] Limited access (tylko swoje dane)
- [ ] Read-only dla PO
- [ ] Upload dla dokumentow

**Technical Notes:**
- Odrebna rola: supplier_user
- RLS: tylko dane powiazane z supplier_id

**Priority:** Should Have
**Estimate:** L
**Phase:** 3

---

#### Story 14.11: Supplier PO Confirmation

**Jako** Supplier
**Chce** potwierdzać zamówienia
**Aby** informowac kupującego o akceptacji

**Acceptance Criteria:**
- [ ] Lista PO assigned to supplier
- [ ] Buttons: Confirm, Request Change
- [ ] Proposed delivery date input
- [ ] Notification do buyer

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 14.12: Document Upload (CoA, CoC)

**Jako** Supplier
**Chce** zaladowac dokumenty jakosciowe
**Aby** spelnic wymagania klienta

**Acceptance Criteria:**
- [ ] Upload per PO/delivery
- [ ] Document types: CoA, CoC, MSDS
- [ ] Validation: required documents per product
- [ ] Status: pending verification

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

### 2.4 CoA Verification Workflow

#### Story 14.13: CoA Requirement Rules

**Jako** Quality Manager
**Chce** definiowac wymagania CoA per produkt/dostawca
**Aby** kontrolować dokumentacje

**Acceptance Criteria:**
- [ ] require_coa flag per product
- [ ] require_coa flag per supplier
- [ ] specific_tests required (lista parametrow)
- [ ] Expiry: CoA valid for X days

**Priority:** Must Have
**Estimate:** S
**Phase:** 3

---

#### Story 14.14: CoA Verification Queue

**Jako** QC Inspector
**Chce** widziec kolejke CoA do weryfikacji
**Aby** efektywnie pracowac

**Acceptance Criteria:**
- [ ] Lista CoA status=pending
- [ ] Per document: supplier, product, GRN link
- [ ] PDF viewer inline
- [ ] Actions: Approve, Reject
- [ ] Reject reason required

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 14.15: CoA Auto-Verification (Basic)

**Jako** System
**Chce** automatycznie weryfikowac podstawowe CoA
**Aby** przyspieszyc proces

**Acceptance Criteria:**
- [ ] Check: document uploaded = yes
- [ ] Check: expiry date valid
- [ ] Check: supplier match
- [ ] Auto-approve if all pass
- [ ] Manual queue if fails

**Priority:** Could Have
**Estimate:** M
**Phase:** 3

---

### 2.5 Reports & Settings

#### Story 14.16: Supplier Quality Report

**Jako** Quality Manager
**Chce** raport jakosci dostawcow
**Aby** analizowac i raportowac

**Acceptance Criteria:**
- [ ] Summary per supplier: score, audits, NCRs, CoAs
- [ ] Period comparison
- [ ] Benchmark vs average
- [ ] Export PDF/Excel

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 14.17: Approved Supplier List (ASL)

**Jako** Quality Manager
**Chce** zarzadzac lista zatwierdzonych dostawcow
**Aby** spelnic wymagania BRC/IFS

**Acceptance Criteria:**
- [ ] is_approved flag na supplier
- [ ] Approval expiry date
- [ ] Approval scope (which products/categories)
- [ ] Re-approval workflow
- [ ] ASL report

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 14.18: SQM Settings Page

**Jako** Admin
**Chce** konfigurowac modul SQM
**Aby** dostosowac do procesow

**Acceptance Criteria:**
- [ ] Audit frequency defaults
- [ ] Scorecard KPI weights
- [ ] CoA requirements defaults
- [ ] Notification settings
- [ ] Portal access settings

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

## 3. Story Summary

| ID | Story | Priority | Estimate | Status |
|----|-------|----------|----------|--------|
| 14.1 | Audit Template Definition | Must | L | PLANNED |
| 14.2 | Schedule Supplier Audit | Must | M | PLANNED |
| 14.3 | Conduct Audit | Must | L | PLANNED |
| 14.4 | Audit Findings & CAPA | Must | M | PLANNED |
| 14.5 | Audit Report Generation | Should | M | PLANNED |
| 14.6 | Scorecard Configuration | Must | M | PLANNED |
| 14.7 | Automatic KPI Calculation | Must | L | PLANNED |
| 14.8 | Supplier Ranking Dashboard | Must | M | PLANNED |
| 14.9 | Supplier Performance Trend | Should | M | PLANNED |
| 14.10 | Supplier Portal Access | Should | L | PLANNED |
| 14.11 | Supplier PO Confirmation | Should | M | PLANNED |
| 14.12 | Document Upload (CoA, CoC) | Must | M | PLANNED |
| 14.13 | CoA Requirement Rules | Must | S | PLANNED |
| 14.14 | CoA Verification Queue | Must | M | PLANNED |
| 14.15 | CoA Auto-Verification | Could | M | PLANNED |
| 14.16 | Supplier Quality Report | Should | M | PLANNED |
| 14.17 | Approved Supplier List | Must | M | PLANNED |
| 14.18 | SQM Settings Page | Must | M | PLANNED |

**Totals:**
- Must Have: 12 stories
- Should Have: 5 stories
- Could Have: 1 story
- **Total:** 18 stories

---

## 4. Traceability Matrix

| Requirement | Stories | Goal |
|-------------|---------|------|
| SQM-FR-01: Audits | 14.1, 14.2, 14.3, 14.4, 14.5 | Audyty dostawcow |
| SQM-FR-02: Scorecards | 14.6, 14.7, 14.8, 14.9 | Ocena dostawcow |
| SQM-FR-03: Portal | 14.10, 14.11, 14.12 | Wspolpraca |
| SQM-FR-04: CoA workflow | 14.13, 14.14, 14.15 | Weryfikacja dokumentow |
| SQM-FR-05: ASL | 14.17 | Compliance |
| SQM-FR-06: Reports | 14.16 | Analiza |

---

## 5. Dependencies

### 5.1 From Other Modules
- **Epic 1 (Settings):** Organizations, users
- **Epic 3 (Planning):** Suppliers, PO
- **Epic 5 (Warehouse):** GRN, LP for quality data
- **Epic 6 (Quality):** NCR, CoA tables

### 5.2 To Other Modules
- **Epic 6 (Quality):** Supplier quality data for metrics
- **Epic 3 (Planning):** Supplier status affects PO

---

## 6. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supplier portal adoption | High | Medium | Simple UI, clear value |
| Audit template complexity | Medium | Medium | Pre-built templates |
| Data accuracy for KPIs | Medium | High | Clear definitions, validation |

---

## 7. BRC/IFS Requirements

This epic helps meet following BRC/IFS requirements:
- **3.5.1:** Approved Supplier List maintenance
- **3.5.2:** Supplier performance monitoring
- **3.5.3:** Risk-based supplier audits
- **3.5.4:** Incoming goods inspection / CoA verification

---

## 8. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Supplier Quality Epic |
