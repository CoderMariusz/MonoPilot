# Epic 8: NPD (New Product Development) - Phase 3

**Status:** PLANNED
**Priority:** P2 - Roznicowanie konkurencyjne
**Stories:** 28
**Estimated Effort:** 8-10 tygodni
**Dependencies:** Epic 2 (Technical), Epic 4 (Production), Epic 6 (Quality)

---

## 1. Overview

### 1.1 Cel Epica

Modul NPD (New Product Development) zarzadza procesem wprowadzania nowych produktow do produkcji, wlaczajac:
- **Stage-Gate Process** - kontrolowane przejscia miedzy fazami rozwoju
- **Trial BOMs & Routings** - testowe receptury i procesy
- **Costing Analysis** - analiza kosztow i marz przed wdrozeniem
- **Launch to Production** - formalne wprowadzenie do produkcji seryjnej

### 1.2 Luki Konkurencyjne Zamykane

| Luka | Konkurenci | Status MonoPilot |
|------|-----------|------------------|
| Product Lifecycle Management (PLM) | 2/4 maja (Aptean, AVEVA partial) | Implementowane w tym epicu |
| Stage-Gate Process | 2/4 maja | Implementowane w tym epicu |
| Trial Production Management | 3/4 maja | Implementowane w tym epicu |
| New Product Costing | 4/4 maja | Implementowane w tym epicu |

### 1.3 Business Value

- **Time-to-market:** Redukcja o 30% dzieki strukturyzowanemu procesowi
- **Sukces produktow:** Wyzszy wskaznik sukcesu nowych produktow dzieki gate reviews
- **Koszt rozwoju:** Lepsze oszacowanie kosztow przed pelnym wdrozeniem
- **Compliance:** Dokumentacja procesu rozwoju dla auditow (BRC/IFS)

---

## 2. User Stories

### 2.1 Stage-Gate Configuration

#### Story 8.1: Definicja Stage-Gate Template

**Jako** Technical Manager
**Chce** definiowac template procesu Stage-Gate
**Aby** miec ustandaryzowany proces NPD

**Acceptance Criteria:**
- [ ] CRUD dla stage-gate templates
- [ ] Kazdy template ma liste stages (faz)
- [ ] Kazdy stage ma: nazwa, opis, gate criteria
- [ ] Mozliwosc wielu templateow (np. dla roznych typow produktow)
- [ ] Default template per organizacja

**Technical Notes:**
```sql
CREATE TABLE npd_stage_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE npd_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES npd_stage_templates(id),
    stage_order INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    gate_criteria TEXT,
    required_approvers TEXT[], -- role names
    estimated_duration_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 8.2: Customizable Gate Criteria

**Jako** Technical Manager
**Chce** definiowac wymagania dla kazdego gate
**Aby** zapewnic kompletnosc przed przejsciem

**Acceptance Criteria:**
- [ ] Lista checklist items per gate
- [ ] Kazdy item: nazwa, typ (required/optional), opis
- [ ] Przyklad: "BOM finalized", "Cost analysis done", "QA approval"
- [ ] UI do zarzadzania checklist
- [ ] Kopiowanie checklist miedzy stages

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

### 2.2 NPD Project Management

#### Story 8.3: Utworzenie Projektu NPD

**Jako** R&D Manager
**Chce** utworzyc nowy projekt NPD
**Aby** rozpoczac rozwoj produktu

**Acceptance Criteria:**
- [ ] Formularz: nazwa projektu, opis, target launch date
- [ ] Wybor Stage-Gate template
- [ ] Przypisanie project lead
- [ ] Automatyczny numer NPD-YYYY-NNNN
- [ ] Status: draft
- [ ] Powiazanie z produktem (nowy lub istniejacy draft)

**Technical Notes:**
```sql
CREATE TABLE npd_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    project_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    product_id UUID REFERENCES products(id),
    template_id UUID REFERENCES npd_stage_templates(id),
    current_stage_id UUID REFERENCES npd_stages(id),
    project_lead UUID REFERENCES auth.users(id),
    target_launch_date DATE,
    actual_launch_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft, active, on_hold, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.4: NPD Project Dashboard

**Jako** R&D Manager
**Chce** widziec dashboard projektow NPD
**Aby** monitorowac postep

**Acceptance Criteria:**
- [ ] Lista wszystkich projektow NPD
- [ ] Filtrowanie po statusie, stage, project lead
- [ ] Widok Kanban po stages (opcjonalnie)
- [ ] Timeline view z target dates
- [ ] KPIs: liczba projektow per stage, overdue projects

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 8.5: NPD Project Detail View

**Jako** Project Lead
**Chce** widziec szczegoly projektu NPD
**Aby** zarzadzac pracami

**Acceptance Criteria:**
- [ ] Header: nazwa, numer, status, stage
- [ ] Timeline z wszystkimi stages i progress
- [ ] Gate checklist dla current stage
- [ ] Historia zmian stages
- [ ] Linked documents, trials, BOMs
- [ ] Team members
- [ ] Notatki i komentarze

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

### 2.3 Stage Transitions (Gate Reviews)

#### Story 8.6: Gate Review Request

**Jako** Project Lead
**Chce** zglosic gotowsc do gate review
**Aby** przejsc do nastepnej fazy

**Acceptance Criteria:**
- [ ] Przycisk "Request Gate Review" na projekcie
- [ ] Wymagane: wszystkie required checklist items zaznaczone
- [ ] Status projektu: pending_gate_review
- [ ] Notyfikacja do approvers
- [ ] Mozliwosc dodania notatek

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.7: Gate Approval Workflow

**Jako** Technical Manager
**Chce** zatwierdzic lub odrzucic gate review
**Aby** kontrolowac przejscia miedzy fazami

**Acceptance Criteria:**
- [ ] Lista projektow pending gate review
- [ ] Widok gate checklist z statusami
- [ ] Przyciski: Approve, Reject, Request Changes
- [ ] Approve: przejscie do nastepnej fazy
- [ ] Reject: powrot do pracy, komentarz wymagany
- [ ] Audit log decyzji

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.8: Gate Review History

**Jako** Project Lead
**Chce** widziec historie gate reviews
**Aby** sledzic decyzje i feedback

**Acceptance Criteria:**
- [ ] Timeline wszystkich gate reviews
- [ ] Per review: status, decyzja, komentarze, data
- [ ] Osoby zatwierdzajace
- [ ] Czas trwania w kazdej fazie

**Priority:** Should Have
**Estimate:** S
**Phase:** 3

---

### 2.4 Trial BOMs & Routings

#### Story 8.9: Trial BOM Creation

**Jako** R&D Engineer
**Chce** utworzyc trial BOM
**Aby** testowac nowa recepture

**Acceptance Criteria:**
- [ ] BOM z flag: is_trial = true
- [ ] Powiazanie z projektem NPD
- [ ] Struktura identyczna jak production BOM
- [ ] Mozliwosc wielu trial BOMs per projekt
- [ ] Wersjonowanie trial BOMs
- [ ] Status: draft, testing, approved, rejected

**Technical Notes:**
- Rozszerzyc tabele boms o: is_trial, npd_project_id, trial_status

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.10: Trial Routing Creation

**Jako** R&D Engineer
**Chce** utworzyc trial routing
**Aby** testowac nowy proces

**Acceptance Criteria:**
- [ ] Routing z flag: is_trial = true
- [ ] Powiazanie z projektem NPD
- [ ] Mozliwosc wariantow routing
- [ ] Czasy setup/run jako estimates
- [ ] Parametry procesu do weryfikacji

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.11: Trial BOM/Routing Comparison

**Jako** R&D Engineer
**Chce** porownywac trial BOMs/routings
**Aby** wybrac najlepszy wariant

**Acceptance Criteria:**
- [ ] Side-by-side comparison (max 3)
- [ ] Roznice podswietlone
- [ ] Porownanie kosztow materialowych
- [ ] Porownanie czasow produkcji
- [ ] Export do PDF/Excel

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.5 Trial Production

#### Story 8.12: Trial Work Order

**Jako** R&D Engineer
**Chce** utworzyc trial WO
**Aby** przetestowac recepture w produkcji

**Acceptance Criteria:**
- [ ] WO z flag: is_trial = true
- [ ] Powiazanie z projektem NPD
- [ ] Wybor trial BOM i trial routing
- [ ] Mniejsza ilosc niz produkcja seryjna
- [ ] Osobna numeracja: TRL-YYYY-NNNN

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.13: Trial Execution Tracking

**Jako** R&D Engineer
**Chce** sledzic wykonanie trial WO
**Aby** dokumentowac wyniki testu

**Acceptance Criteria:**
- [ ] Standardowy workflow WO (start, consume, output, complete)
- [ ] Dodatkowe pola: trial_notes, observations
- [ ] Zapisanie rzeczywistych parametrow procesu
- [ ] Porownanie actual vs expected yield
- [ ] Mozliwosc zdjec/dokumentow

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.14: Trial Results Summary

**Jako** R&D Manager
**Chce** widziec podsumowanie trial
**Aby** podejmowac decyzje o wdrozeniu

**Acceptance Criteria:**
- [ ] Summary per trial WO
- [ ] Yield analysis (actual vs BOM theoretical)
- [ ] Quality test results
- [ ] Cost analysis (actual vs estimated)
- [ ] Observations i wnioski
- [ ] Recommendation: approve / reject / retry

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

### 2.6 Costing Analysis

#### Story 8.15: Trial Costing Estimation

**Jako** R&D Engineer
**Chce** oszacowac koszt nowego produktu
**Aby** ocenic oplacalnosc

**Acceptance Criteria:**
- [ ] Kalkulacja na podstawie trial BOM
- [ ] Material cost (suma skladnikow * ceny)
- [ ] Labor cost (routing * stawki)
- [ ] Overhead allocation (configurable %)
- [ ] Total unit cost estimate
- [ ] Comparison z target price

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 8.16: Costing Scenarios

**Jako** R&D Manager
**Chce** tworzyc scenariusze kosztowe
**Aby** analizowac wrazliwosc

**Acceptance Criteria:**
- [ ] Multiple scenarios per projekt
- [ ] Zmienne: ceny materialow, wolumen, overhead
- [ ] What-if analysis
- [ ] Porownanie scenariuszy
- [ ] Break-even calculation

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.17: Margin Analysis

**Jako** Commercial Manager
**Chce** widziec analize marzy
**Aby** ustalac ceny produktu

**Acceptance Criteria:**
- [ ] Target price input
- [ ] Gross margin % calculation
- [ ] Contribution margin
- [ ] Porownanie z istniejacymi produktami
- [ ] Price sensitivity chart

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.7 Launch to Production

#### Story 8.18: Production Launch Checklist

**Jako** Technical Manager
**Chce** miec checklist wdrozenia
**Aby** niczego nie pominac

**Acceptance Criteria:**
- [ ] Configurable launch checklist
- [ ] Przykady: "Production BOM approved", "Quality specs set", "Training done"
- [ ] Tracking completion per item
- [ ] Due dates i owners per item
- [ ] Status: ready / not ready for launch

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.19: Convert Trial BOM to Production

**Jako** Technical Manager
**Chce** przeksztalcic trial BOM w production BOM
**Aby** formalnie wdrozyc recepture

**Acceptance Criteria:**
- [ ] Przycisk "Convert to Production"
- [ ] Kopiuje trial BOM jako aktywna wersja production
- [ ] is_trial = false, status = active
- [ ] effective_from = today
- [ ] Powiazanie z NPD project zachowane
- [ ] Audit log konwersji

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.20: Convert Trial Routing to Production

**Jako** Technical Manager
**Chce** przeksztalcic trial routing w production
**Aby** formalnie wdrozyc proces

**Acceptance Criteria:**
- [ ] Podobnie jak BOM conversion
- [ ] Aktualizacja czasow z trial results
- [ ] is_trial = false
- [ ] Powiazanie z produktem

**Priority:** Must Have
**Estimate:** S
**Phase:** 3

---

#### Story 8.21: Product Launch

**Jako** Technical Manager
**Chce** formalnie wdrozyc produkt
**Aby** ukonczyc projekt NPD

**Acceptance Criteria:**
- [ ] Przycisk "Launch Product"
- [ ] Wymagane: launch checklist complete
- [ ] Product status: draft -> active
- [ ] NPD project status: completed
- [ ] actual_launch_date = today
- [ ] Notyfikacja do zespolu

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

### 2.8 NPD Reports & Analytics

#### Story 8.22: NPD Pipeline Report

**Jako** R&D Director
**Chce** widziec pipeline projektow NPD
**Aby** planowac zasoby

**Acceptance Criteria:**
- [ ] Liczba projektow per stage
- [ ] Funnel visualization
- [ ] Target vs actual launch dates
- [ ] Resource allocation overview
- [ ] Historical launch rate

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.23: Time-to-Market Analysis

**Jako** R&D Director
**Chce** analizowac czas rozwoju produktow
**Aby** optymalizowac proces NPD

**Acceptance Criteria:**
- [ ] Average time per stage
- [ ] Total time from idea to launch
- [ ] Bottleneck identification
- [ ] Trend over time
- [ ] Benchmark per product category

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.24: NPD Success Metrics

**Jako** R&D Director
**Chce** sledzic wskazniki sukcesu NPD
**Aby** mierzyc efektywnosc

**Acceptance Criteria:**
- [ ] Projects launched vs cancelled
- [ ] First-pass trial success rate
- [ ] Cost estimate accuracy (actual vs projected)
- [ ] Time-to-market vs target
- [ ] YoY comparison

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.9 NPD Settings

#### Story 8.25: NPD Settings Page

**Jako** Admin
**Chce** konfigurowac modul NPD
**Aby** dostosowac do procesow firmy

**Acceptance Criteria:**
- [ ] Default stage-gate template
- [ ] Project number format
- [ ] Default approvers per stage
- [ ] Notification settings
- [ ] Costing defaults (overhead %)

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

### 2.10 Integration Points

#### Story 8.26: NPD - Quality Integration

**Jako** QC Manager
**Chce** definiowac specyfikacje podczas NPD
**Aby** byc gotowym na produkcje

**Acceptance Criteria:**
- [ ] Link z projektu NPD do product specs (Epic 6)
- [ ] Draft specs przypisane do trial product
- [ ] Finalizacja specs jako gate criterion
- [ ] Quality test results z trials widoczne w NPD

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.27: NPD - Supplier Integration

**Jako** Procurement Manager
**Chce** identyfikowac nowych dostawcow podczas NPD
**Aby** zapewnic dostepnosc materialow

**Acceptance Criteria:**
- [ ] Lista nowych materialow wymaganych
- [ ] Status dostepnosci materialow
- [ ] Linkowanie do supplier quotes
- [ ] Lead time impact na launch date

**Priority:** Could Have
**Estimate:** M
**Phase:** 3

---

#### Story 8.28: NPD Audit Trail

**Jako** Technical Manager
**Chce** pelna historie projektu NPD
**Aby** spelniac wymagania auditowe

**Acceptance Criteria:**
- [ ] Log wszystkich zmian projektu
- [ ] Log gate decisions
- [ ] Log BOM/routing changes
- [ ] Log trial results
- [ ] Export dla auditu

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

## 3. Story Summary

| ID | Story | Priority | Estimate | Status |
|----|-------|----------|----------|--------|
| 8.1 | Stage-Gate Template | Must | L | PLANNED |
| 8.2 | Customizable Gate Criteria | Must | M | PLANNED |
| 8.3 | Utworzenie Projektu NPD | Must | M | PLANNED |
| 8.4 | NPD Project Dashboard | Must | L | PLANNED |
| 8.5 | NPD Project Detail View | Must | L | PLANNED |
| 8.6 | Gate Review Request | Must | M | PLANNED |
| 8.7 | Gate Approval Workflow | Must | M | PLANNED |
| 8.8 | Gate Review History | Should | S | PLANNED |
| 8.9 | Trial BOM Creation | Must | M | PLANNED |
| 8.10 | Trial Routing Creation | Must | M | PLANNED |
| 8.11 | Trial BOM/Routing Comparison | Should | M | PLANNED |
| 8.12 | Trial Work Order | Must | M | PLANNED |
| 8.13 | Trial Execution Tracking | Must | M | PLANNED |
| 8.14 | Trial Results Summary | Must | L | PLANNED |
| 8.15 | Trial Costing Estimation | Must | L | PLANNED |
| 8.16 | Costing Scenarios | Should | M | PLANNED |
| 8.17 | Margin Analysis | Should | M | PLANNED |
| 8.18 | Production Launch Checklist | Must | M | PLANNED |
| 8.19 | Convert Trial BOM to Production | Must | M | PLANNED |
| 8.20 | Convert Trial Routing to Production | Must | S | PLANNED |
| 8.21 | Product Launch | Must | M | PLANNED |
| 8.22 | NPD Pipeline Report | Should | M | PLANNED |
| 8.23 | Time-to-Market Analysis | Should | M | PLANNED |
| 8.24 | NPD Success Metrics | Should | M | PLANNED |
| 8.25 | NPD Settings Page | Must | M | PLANNED |
| 8.26 | NPD - Quality Integration | Should | M | PLANNED |
| 8.27 | NPD - Supplier Integration | Could | M | PLANNED |
| 8.28 | NPD Audit Trail | Must | M | PLANNED |

**Totals:**
- Must Have: 17 stories
- Should Have: 9 stories
- Could Have: 2 stories
- **Total:** 28 stories

---

## 4. Database Schema

### 4.1 npd_stage_templates
```sql
CREATE TABLE npd_stage_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 npd_stages
```sql
CREATE TABLE npd_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES npd_stage_templates(id),
    stage_order INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    gate_criteria TEXT,
    required_approvers TEXT[],
    estimated_duration_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 npd_stage_checklist_items
```sql
CREATE TABLE npd_stage_checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_id UUID NOT NULL REFERENCES npd_stages(id),
    item_name VARCHAR(200) NOT NULL,
    item_description TEXT,
    is_required BOOLEAN DEFAULT true,
    item_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 npd_projects
```sql
CREATE TABLE npd_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    project_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    product_id UUID REFERENCES products(id),
    template_id UUID REFERENCES npd_stage_templates(id),
    current_stage_id UUID REFERENCES npd_stages(id),
    project_lead UUID REFERENCES auth.users(id),
    target_launch_date DATE,
    actual_launch_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 npd_project_checklist
```sql
CREATE TABLE npd_project_checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES npd_projects(id),
    checklist_item_id UUID NOT NULL REFERENCES npd_stage_checklist_items(id),
    is_completed BOOLEAN DEFAULT false,
    completed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.6 npd_gate_reviews
```sql
CREATE TABLE npd_gate_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    project_id UUID NOT NULL REFERENCES npd_projects(id),
    from_stage_id UUID REFERENCES npd_stages(id),
    to_stage_id UUID REFERENCES npd_stages(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, changes_requested
    requested_by UUID REFERENCES auth.users(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    decided_by UUID REFERENCES auth.users(id),
    decided_at TIMESTAMPTZ,
    decision_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.7 npd_trials
```sql
CREATE TABLE npd_trials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    project_id UUID NOT NULL REFERENCES npd_projects(id),
    trial_number VARCHAR(20) NOT NULL,
    trial_bom_id UUID REFERENCES boms(id),
    trial_routing_id UUID REFERENCES routings(id),
    wo_id UUID REFERENCES work_orders(id),
    status VARCHAR(30) NOT NULL DEFAULT 'planned', -- planned, in_progress, completed, cancelled
    planned_qty NUMERIC(15,4),
    actual_qty NUMERIC(15,4),
    yield_percentage NUMERIC(5,2),
    trial_notes TEXT,
    observations TEXT,
    recommendation VARCHAR(30), -- approve, reject, retry
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.8 npd_costing_scenarios
```sql
CREATE TABLE npd_costing_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    project_id UUID NOT NULL REFERENCES npd_projects(id),
    scenario_name VARCHAR(100) NOT NULL,
    volume_assumption NUMERIC(15,4),
    material_cost NUMERIC(15,4),
    labor_cost NUMERIC(15,4),
    overhead_cost NUMERIC(15,4),
    total_unit_cost NUMERIC(15,4),
    target_price NUMERIC(15,4),
    gross_margin_pct NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Traceability Matrix

| Requirement | Stories | Goal |
|-------------|---------|------|
| NPD-FR-01: Stage-Gate process | 8.1, 8.2, 8.6, 8.7, 8.8 | Strukturyzowany proces rozwoju |
| NPD-FR-02: Project management | 8.3, 8.4, 8.5 | Zarzadzanie projektami |
| NPD-FR-03: Trial BOMs/Routings | 8.9, 8.10, 8.11 | Testowe receptury |
| NPD-FR-04: Trial production | 8.12, 8.13, 8.14 | Produkcja testowa |
| NPD-FR-05: Costing analysis | 8.15, 8.16, 8.17 | Analiza kosztow |
| NPD-FR-06: Launch to production | 8.18, 8.19, 8.20, 8.21 | Wdrozenie do produkcji |
| NPD-FR-07: Reporting | 8.22, 8.23, 8.24 | Raporty i analityka |
| NPD-FR-08: Audit trail | 8.28 | Compliance |

---

## 6. Dependencies

### 6.1 From Other Modules
- **Epic 2 (Technical):** Products, BOMs, Routings
- **Epic 4 (Production):** Work Orders
- **Epic 6 (Quality):** Product Specifications

### 6.2 To Other Modules
- **Epic 2:** Trial BOMs become production BOMs
- **Epic 4:** Trial WOs use production workflow
- **Finance:** Costing data flows to cost tracking

---

## 7. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Stage-Gate complexity | Medium | Medium | Start with simple 3-stage template |
| User adoption | Medium | High | Training, clear documentation |
| Costing accuracy | High | Medium | Iterate based on actual trials |
| Integration complexity | Medium | Medium | Clear API contracts |

---

## 8. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial NPD Epic |
