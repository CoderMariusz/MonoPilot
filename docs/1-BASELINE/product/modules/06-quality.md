# Quality Module PRD

**Status:** PLANNED (Epic 6 - Phase 2)
**Priority:** P1 - Important Module
**Epic:** 6
**Stories:** 28 (estimated)
**Phase:** MVP Phase 2

---

## 1. Overview

### 1.1 Cel Modulu
Modul Quality odpowiada za kontrole jakosci w produkcji spozywczej - zarzadzanie QA statusem na LP, quality holds, specyfikacje produktow, testy laboratoryjne oraz NCR (Non-Conformance Reports).

### 1.2 Value Proposition
- **Problem:** Brak zintegrowanego systemu kontroli jakosci z pelna traceability
- **Rozwiazanie:** QA workflow LP-based z holdami, specyfikacjami i NCR
- **Korzysc:** Zgodnosc z FDA/HACCP, pelna dokumentacja jakosciowa

### 1.3 Key Concepts
- **QA Status:** Status jakosciowy na kazdym LP (pending, passed, failed, quarantine)
- **Quality Hold:** Blokada LP do momentu zakonczenia dochodzenia
- **Specification:** Dopuszczalne zakresy dla atrybutow produktu
- **CoA (Certificate of Analysis):** Certyfikat jakosci od dostawcy
- **NCR (Non-Conformance Report):** Raport niezgodnosci

### 1.4 Dependencies
- **Wymaga:** Settings (users, QC role), Technical (products), Warehouse (LP, QA status)
- **Wymagany przez:** Production (QA on output), Shipping (QA validation)

---

## 2. User Roles & Permissions

| Rola | Uprawnienia |
|------|-------------|
| **QC Inspector** | Change QA status (Pass/Fail/Hold), Record tests, View dashboard |
| **QC Supervisor** | + Release holds, Close NCR, Verify CoA |
| **Technical Officer** | + Create specs, Manage NCR, Close NCR |
| **Admin** | + Configure quality settings |

---

## 3. Settings Configuration

**Route:** `/settings/quality`

### 3.1 QA Settings

| Setting | Type | Default | Opis |
|---------|------|---------|------|
| `enable_quality_module` | toggle | On | Wlacz modul jakosci |
| `allow_pending_consumption` | toggle | Off | Pozwol konsumowac LP z pending QA |
| `auto_pass_receipt` | toggle | Off | Auto-pass QA na przyjciu |
| `require_coa_on_receipt` | toggle | Off | Wymagaj CoA przy przyjciu (per-product) |
| `enable_specifications` | toggle | On | Wlacz specyfikacje produktow |
| `enable_lab_testing` | toggle | Off | Wlacz zarzadzanie testami lab |
| `enable_ncr` | toggle | On | Wlacz NCR |
| `enable_quality_holds` | toggle | On | Wlacz quality holds |
| `hold_notification_email` | toggle | On | Email przy quality hold |
| `release_requires_approval` | toggle | On | Zatwierdzenie managera dla release |
| `quarantine_location_id` | FK | null | Domyslna lokalizacja kwarantanny |
| `enable_supplier_quality` | toggle | On | Sledzenie jakosci dostawcow |
| `enable_custom_spec_attributes` | toggle | On | Pozwol na custom atrybuty specyfikacji |

---

## 4. Core Entities

### 4.1 LP QA Status (rozszerzenie Warehouse)

| Status | Opis | Can Ship | Can Consume |
|--------|------|----------|-------------|
| `pending` | Oczekuje na inspekcje | No | Settings toggle |
| `passed` | QA zatwierdzone | Yes | Yes |
| `failed` | QA odrzucone | No | No |
| `quarantine` | W dochodzeniu | No | No |

### 4.2 QA Status Transitions

```
pending --> passed (inspekcja ok)
        --> failed (inspekcja nie ok)
        --> quarantine (wymaga dochodzenia)

passed --> quarantine (odkryty problem)

failed --> quarantine (badanie przyczyny)
       --> disposed (nie do odzyskania)

quarantine --> passed (dochodzenie wyjasnione)
           --> failed (potwierdzony problem)
           --> disposed (nie do odzyskania)
```

### 4.3 Quality Hold

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `hold_number` | string | Yes | Nr referencyjny holdu |
| `lp_ids` | FK[] | Yes | Dotkniete LP |
| `reason` | text | Yes | Powod holdu |
| `hold_type` | enum | Yes | supplier, process, complaint, recall |
| `status` | enum | Yes | active, released, disposed |
| `priority` | enum | No | low, medium, high, critical |
| `held_by` | FK | Yes | Kto zalozy hold |
| `held_at` | datetime | Yes | Kiedy zalozono |
| `assigned_to` | FK | No | Prowadzacy dochodzenie |
| `investigation_notes` | text | No | Wyniki dochodzenia |
| `released_by` | FK | No | Kto zwolnil |
| `released_at` | datetime | No | Kiedy zwolniono |
| `release_notes` | text | No | Uzasadnienie zwolnienia |

### 4.4 Specification

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `product_id` | FK | Yes | Referencja produktu |
| `attribute_name` | string | Yes | Nazwa atrybutu (user-defined) |
| `attribute_type` | enum | Yes | numeric, text, boolean |
| `unit` | string | No | Jednostka miary |
| `min_value` | decimal | Conditional | Minimum |
| `max_value` | decimal | Conditional | Maximum |
| `target_value` | decimal | No | Wartosc docelowa |
| `text_value` | string | Conditional | Dla text attributes |
| `is_critical` | boolean | No | Krytyczny dla jakosci |
| `test_method` | string | No | Metoda testowa |
| `test_frequency` | string | No | Czestotliwosc testowania |

**Przyklady Custom Specifications:**

| Atrybut | Type | Wartosc | Jednostka |
|---------|------|---------|-----------|
| Moisture | numeric | 5-8 | % |
| pH | numeric | 4.0-4.5 | - |
| Temperature | numeric | 2-4 | C |
| Color | text | "Red", "Golden" | - |
| Allergen Free | boolean | true/false | - |
| Brix | numeric | 10-12 | Bx |
| Viscosity | numeric | 100-150 | cP |

### 4.5 Quality Test

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `test_number` | string | Yes | Nr referencyjny testu |
| `lp_id` | FK | Yes | Testowane LP |
| `specification_id` | FK | No | Referencja specyfikacji |
| `test_date` | datetime | Yes | Kiedy testowano |
| `tested_by` | FK | Yes | Kto testowal |
| `attribute_name` | string | Yes | Co testowano |
| `result_value` | decimal | Conditional | Wynik liczbowy |
| `result_text` | string | Conditional | Wynik tekstowy |
| `result_pass` | boolean | Yes | Pass/Fail |
| `notes` | text | No | Notatki |
| `equipment_id` | string | No | Uzyte urzadzenie |

### 4.6 NCR (Non-Conformance Report)

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `ncr_number` | string | Yes | Nr referencyjny NCR |
| `lp_id` | FK | No | Powiazane LP |
| `wo_id` | FK | No | Powiazane WO |
| `po_id` | FK | No | Powiazane PO |
| `product_id` | FK | No | Powiazany produkt |
| `ncr_type` | enum | Yes | material, process, product, supplier |
| `description` | text | Yes | Opis problemu |
| `detected_by` | FK | Yes | Kto wykryl |
| `detected_at` | datetime | Yes | Kiedy wykryto |
| `severity` | enum | Yes | minor, major, critical |
| `status` | enum | Yes | open, investigating, corrective_action, closed |
| `root_cause` | text | No | Analiza przyczyny zrodlowej |
| `corrective_action` | text | No | Plan dzialania naprawczego |
| `preventive_action` | text | No | Srodki zapobiegawcze |
| `assigned_to` | FK | No | Osoba odpowiedzialna |
| `due_date` | date | No | Termin rozwiazania |
| `closed_by` | FK | No | Kto zamknal |
| `closed_at` | datetime | No | Kiedy zamknieto |
| `resolution_notes` | text | No | Jak rozwiazano |

### 4.7 CoA (Certificate of Analysis)

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `grn_id` | FK | Yes | Powiazany GRN |
| `supplier_id` | FK | Yes | Dostawca |
| `certificate_number` | string | Yes | Nr certyfikatu dostawcy |
| `issue_date` | date | Yes | Data wystawienia |
| `expiry_date` | date | No | Data waznosci certyfikatu |
| `product_id` | FK | Yes | Certyfikowany produkt |
| `batch_number` | string | No | Certyfikowana partia |
| `document_url` | string | Yes | URL dokumentu |
| `verified_by` | FK | No | Kto zweryfikowal |
| `verified_at` | datetime | No | Kiedy zweryfikowano |
| `status` | enum | Yes | pending, verified, rejected |

---

## 5. Workflows

### 5.1 QA Status Change Workflow

```
1. Select LP (from LP detail or QA Dashboard)
2. Choose action: Pass, Fail, Hold
3. Enter notes (required for Fail/Hold)
4. Optionally attach documents
5. Confirm --> QA status updated
6. If Fail/Hold --> LP moved to quarantine location
7. Audit record created
```

### 5.2 Quality Hold Workflow

```
1. Create Hold
   - Select LPs (or product batch)
   - Enter reason and type
   - Set priority
   - LPs --> quarantine status
   - Notification sent (if enabled)

2. Investigate
   - Assign investigator
   - Add investigation notes
   - Attach test results/documents

3. Release or Dispose
   - Release: LPs --> passed (requires approval if enabled)
   - Dispose: LPs --> disposed (cannot be recovered)
```

### 5.3 NCR Workflow

```
1. Create NCR
   - Describe issue
   - Link to LP/WO/PO
   - Set severity
   - Assign owner

2. Investigate
   - Document root cause
   - Attach evidence

3. Corrective Action
   - Define corrective action
   - Define preventive action
   - Set due date

4. Close (Technical Officer / QC Supervisor only)
   - Verify actions completed
   - Document resolution
   - Close NCR
```

### 5.4 CoA Workflow

```
1. During GRN Receipt (for products with require_coa = true)
   - Upload CoA document (PDF/image)
   - Enter certificate number
   - Issue date

2. Verify (QC Supervisor)
   - Review document
   - Mark as verified/rejected

3. Link to GRN items
```

---

## 6. Database Tables

### 6.1 quality_holds
```sql
CREATE TABLE quality_holds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    hold_number VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    hold_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    priority VARCHAR(20),
    held_by UUID REFERENCES auth.users(id),
    held_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_to UUID REFERENCES auth.users(id),
    investigation_notes TEXT,
    released_by UUID REFERENCES auth.users(id),
    released_at TIMESTAMPTZ,
    release_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, hold_number)
);
```

### 6.2 quality_hold_lps
```sql
CREATE TABLE quality_hold_lps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hold_id UUID NOT NULL REFERENCES quality_holds(id),
    lp_id UUID NOT NULL REFERENCES license_plates(id),
    UNIQUE(hold_id, lp_id)
);
```

### 6.3 specifications
```sql
CREATE TABLE specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    product_id UUID NOT NULL REFERENCES products(id),
    attribute_name VARCHAR(100) NOT NULL,
    attribute_type VARCHAR(20) NOT NULL,
    unit VARCHAR(20),
    min_value NUMERIC(15,4),
    max_value NUMERIC(15,4),
    target_value NUMERIC(15,4),
    text_value VARCHAR(255),
    is_critical BOOLEAN DEFAULT false,
    test_method VARCHAR(255),
    test_frequency VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.4 quality_tests
```sql
CREATE TABLE quality_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    test_number VARCHAR(50) NOT NULL,
    lp_id UUID NOT NULL REFERENCES license_plates(id),
    specification_id UUID REFERENCES specifications(id),
    test_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tested_by UUID REFERENCES auth.users(id),
    attribute_name VARCHAR(100) NOT NULL,
    result_value NUMERIC(15,4),
    result_text VARCHAR(255),
    result_pass BOOLEAN NOT NULL,
    notes TEXT,
    equipment_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, test_number)
);
```

### 6.5 ncrs
```sql
CREATE TABLE ncrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    ncr_number VARCHAR(50) NOT NULL,
    lp_id UUID REFERENCES license_plates(id),
    wo_id UUID REFERENCES work_orders(id),
    po_id UUID REFERENCES purchase_orders(id),
    product_id UUID REFERENCES products(id),
    ncr_type VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    detected_by UUID REFERENCES auth.users(id),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    due_date DATE,
    closed_by UUID REFERENCES auth.users(id),
    closed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, ncr_number)
);
```

### 6.6 coas
```sql
CREATE TABLE coas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    grn_id UUID NOT NULL REFERENCES grns(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    certificate_number VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    product_id UUID NOT NULL REFERENCES products(id),
    batch_number VARCHAR(100),
    document_url VARCHAR(500) NOT NULL,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.7 quality_settings
```sql
CREATE TABLE quality_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
    enable_quality_module BOOLEAN DEFAULT true,
    allow_pending_consumption BOOLEAN DEFAULT false,
    auto_pass_receipt BOOLEAN DEFAULT false,
    enable_specifications BOOLEAN DEFAULT true,
    enable_lab_testing BOOLEAN DEFAULT false,
    enable_ncr BOOLEAN DEFAULT true,
    enable_quality_holds BOOLEAN DEFAULT true,
    hold_notification_email BOOLEAN DEFAULT true,
    release_requires_approval BOOLEAN DEFAULT true,
    quarantine_location_id UUID REFERENCES locations(id),
    enable_supplier_quality BOOLEAN DEFAULT true,
    enable_custom_spec_attributes BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.8 quality_audit
```sql
CREATE TABLE quality_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    lp_id UUID REFERENCES license_plates(id),
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 7. API Endpoints

### 7.1 QA Status
| Method | Endpoint | Opis |
|--------|----------|------|
| PUT | `/api/quality/license-plates/:id/qa-status` | Aktualizuj QA status LP |
| POST | `/api/quality/license-plates/bulk-qa-status` | Bulk update QA status |

### 7.2 Quality Holds
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/quality/holds` | Lista holdow z filtrami |
| GET | `/api/quality/holds/:id` | Szczegoly holdu |
| POST | `/api/quality/holds` | Utworz hold |
| PUT | `/api/quality/holds/:id` | Aktualizuj hold |
| POST | `/api/quality/holds/:id/release` | Zwolnij hold |
| POST | `/api/quality/holds/:id/dispose` | Utylizuj hold items |

### 7.3 Specifications
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/quality/products/:id/specifications` | Specyfikacje produktu |
| POST | `/api/quality/specifications` | Utworz specyfikacje |
| PUT | `/api/quality/specifications/:id` | Aktualizuj specyfikacje |
| DELETE | `/api/quality/specifications/:id` | Usun specyfikacje |

### 7.4 Quality Tests
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/quality/tests` | Lista testow z filtrami |
| GET | `/api/quality/license-plates/:id/tests` | Historia testow LP |
| POST | `/api/quality/tests` | Zarejestruj wynik testu |

### 7.5 NCRs
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/quality/ncrs` | Lista NCR z filtrami |
| GET | `/api/quality/ncrs/:id` | Szczegoly NCR |
| POST | `/api/quality/ncrs` | Utworz NCR |
| PUT | `/api/quality/ncrs/:id` | Aktualizuj NCR |
| POST | `/api/quality/ncrs/:id/close` | Zamknij NCR |

### 7.6 CoAs
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/quality/coas` | Lista CoA z filtrami |
| GET | `/api/quality/coas/:id` | Szczegoly CoA |
| POST | `/api/quality/coas` | Upload CoA |
| PUT | `/api/quality/coas/:id/verify` | Zweryfikuj CoA |

### 7.7 Dashboard & Reports
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/quality/dashboard` | Dane dashboard |
| GET | `/api/quality/reports/:type` | Generuj raport |

### 7.8 Settings
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/quality/settings` | Pobierz ustawienia |
| PUT | `/api/quality/settings` | Aktualizuj ustawienia |

---

## 8. Functional Requirements

### 8.1 QA Status Management
| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-01 | Track QA status on every LP | Must |
| QC-FR-02 | Enforce status transitions | Must |
| QC-FR-03 | Prevent shipping non-passed LPs | Must |
| QC-FR-04 | Control consumption of pending LPs via settings | Must |
| QC-FR-05 | Record audit trail for QA changes | Must |

### 8.2 Quality Holds
| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-06 | Create quality holds for LPs | Must |
| QC-FR-07 | Move held LPs to quarantine status | Must |
| QC-FR-08 | Notify on hold creation (email) | Should |
| QC-FR-09 | Require approval for hold release | Should |
| QC-FR-10 | Track hold investigation and resolution | Must |

### 8.3 Specifications
| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-11 | Define specifications per product | Should |
| QC-FR-12 | Support numeric, text, boolean specs | Should |
| QC-FR-13 | Auto-calculate pass/fail for numeric tests | Should |
| QC-FR-14 | Support custom attributes (user-defined titles) | Should |

### 8.4 Quality Testing
| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-15 | Record test results against LPs | Should |
| QC-FR-16 | Show test history per LP | Should |
| QC-FR-17 | Compare results to specifications | Should |

### 8.5 Non-Conformance
| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-18 | Create NCRs for quality issues | Must |
| QC-FR-19 | Track NCR lifecycle (open --> close) | Must |
| QC-FR-20 | Link NCRs to LPs, WOs, POs | Must |
| QC-FR-21 | Capture root cause and corrective actions | Must |
| QC-FR-22 | Restrict NCR close to authorized roles | Must |

### 8.6 Certificates (CoA)
| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-23 | Upload and store CoAs | Should |
| QC-FR-24 | Require CoA on receipt per-product | Should |
| QC-FR-25 | Track CoA verification status | Should |

### 8.7 Dashboard & Reports
| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-26 | Quality dashboard with KPIs | Must |
| QC-FR-27 | Generate quality reports | Should |
| QC-FR-28 | Export reports to PDF/Excel | Should |

---

## 9. Integration Points

### 9.1 Z Warehouse Module
- QA status is field on LP
- Quarantine moves LP to quarantine location
- Receipt triggers initial QA status assignment

### 9.2 Z Production Module
- Cannot consume LP if QA = failed/quarantine
- Pending consumption controlled by settings
- NCR can link to WO

### 9.3 Z Planning Module
- NCR can link to PO
- Supplier quality metrics from PO receipts

### 9.4 Z Technical Module
- Specifications defined per product
- Product.require_coa flag

---

## 10. Story Map

| Story | Tytul | Priority | Status |
|-------|-------|----------|--------|
| 6.1 | QA Status on LP | Must | PLANNED |
| 6.2 | QA Status Transitions | Must | PLANNED |
| 6.3 | QA Dashboard | Must | PLANNED |
| 6.4 | Pending Inspection Widget | Should | PLANNED |
| 6.5 | Quality Hold Creation | Must | PLANNED |
| 6.6 | Hold Investigation Workflow | Must | PLANNED |
| 6.7 | Hold Release/Dispose | Must | PLANNED |
| 6.8 | Hold Notifications | Should | PLANNED |
| 6.9 | Product Specifications | Should | PLANNED |
| 6.10 | Custom Spec Attributes | Should | PLANNED |
| 6.11 | Specification UI | Should | PLANNED |
| 6.12 | Quality Test Recording | Should | PLANNED |
| 6.13 | Test History per LP | Should | PLANNED |
| 6.14 | Test Auto-Pass/Fail | Should | PLANNED |
| 6.15 | NCR Creation | Must | PLANNED |
| 6.16 | NCR Lifecycle Tracking | Must | PLANNED |
| 6.17 | NCR Link to LP/WO/PO | Must | PLANNED |
| 6.18 | NCR Root Cause Analysis | Must | PLANNED |
| 6.19 | NCR Close (authorized) | Must | PLANNED |
| 6.20 | CoA Upload | Should | PLANNED |
| 6.21 | CoA Verification | Should | PLANNED |
| 6.22 | CoA per-product requirement | Should | PLANNED |
| 6.23 | Quality Settings Page | Must | PLANNED |
| 6.24 | Scanner QA Pass/Fail | Should | PLANNED |
| 6.25 | Scanner Quick Test | Should | PLANNED |
| 6.26 | Supplier Quality Metrics | Should | PLANNED |
| 6.27 | Quality Reports | Should | PLANNED |
| 6.28 | Quality Audit Log | Must | PLANNED |

**Summary:** 28 stories, 0% complete (Phase 2)

---

## 11. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial PRD for Phase 2 planning |
