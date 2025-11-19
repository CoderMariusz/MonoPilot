# Quality Module - Epic Breakdown

**Modul:** Quality (QA Status, Holds, Specs, Tests, NCR, CoA)
**Priorytet:** P0 - Core Module
**FRs:** 26 (Must + Should)
**Szacowany czas:** 3-4 tygodnie

---

## Podsumowanie Epikow

| Epic | Nazwa | FRs | Stories | Priorytet | Effort |
|------|-------|-----|---------|-----------|--------|
| QC-1 | QA Status Management | 5 | 6 | P0 | 3d |
| QC-2 | Quality Holds | 5 | 7 | P0 | 4d |
| QC-3 | Specifications & Testing | 6 | 8 | P1 | 4d |
| QC-4 | Non-Conformance Reports | 4 | 6 | P0 | 3d |
| QC-5 | Certificates & Supplier Quality | 3 | 4 | P1 | 2d |
| QC-6 | Dashboard & Reports | 3 | 5 | P0 | 2d |
| **Total** | | **26** | **36** | | **18d** |

---

## Epic QC-1: QA Status Management

**Cel:** Zarzadzanie statusem QA na LP z walidacja i audytem
**FRs:** QC-FR-01, QC-FR-02, QC-FR-03, QC-FR-04, QC-FR-05
**Priorytet:** P0 MVP
**Effort:** 3 dni

### Stories

#### QC-1-1: QA Status Values
**Jako** QC Manager **chce** statusy QA na LP **aby** sledzic jakosc

**Acceptance Criteria:**
- [ ] Status values: pending, passed, failed, quarantine
- [ ] Each LP has qa_status field
- [ ] pending: awaiting inspection
- [ ] passed: can ship and consume
- [ ] failed: cannot ship or consume
- [ ] quarantine: under investigation

**Technical Tasks:**
- qa_status field on license_plates
- QA status enum
- Default status from settings

---

#### QC-1-2: QA Status Transitions
**Jako** System **chce** wymuszac transitions **aby** zapewnic flow

**Acceptance Criteria:**
- [ ] pending -> passed, failed, quarantine
- [ ] passed -> quarantine (issue discovered)
- [ ] failed -> quarantine, disposed
- [ ] quarantine -> passed, failed, disposed
- [ ] Invalid transitions blocked
- [ ] Reason required for fail/quarantine

**Technical Tasks:**
- Transition validation logic
- API: PUT `/api/license-plates/:id/qa-status`
- Status flow diagram

---

#### QC-1-3: QA Status Change UI
**Jako** QC Officer **chce** zmieniac status **aby** aktualizowac QA

**Acceptance Criteria:**
- [ ] Available from LP detail view
- [ ] Select new status from allowed
- [ ] Notes/reason required for fail/hold
- [ ] Attach documents optional
- [ ] Creates audit record
- [ ] Confirmation dialog

**Technical Tasks:**
- UI: QAStatusChangeModal
- Document upload
- Audit logging

---

#### QC-1-4: Bulk QA Status Change
**Jako** QC Manager **chce** bulk update **aby** szybko aktualizowac

**Acceptance Criteria:**
- [ ] Select multiple LPs
- [ ] Apply same status to all
- [ ] Common notes
- [ ] Creates audit for each LP
- [ ] Filter: same product recommended

**Technical Tasks:**
- API: POST `/api/license-plates/bulk-qa-status`
- UI: BulkQAStatusModal

---

#### QC-1-5: Shipping/Consumption Control
**Jako** System **chce** blokowac uzycie **aby** zapobiec problemom

**Acceptance Criteria:**
- [ ] Cannot ship LP if qa_status != passed
- [ ] Cannot consume if qa_status = failed/quarantine
- [ ] Settings toggle: allow_pending_consumption
- [ ] Clear error messages

**Technical Tasks:**
- Validation in shipping/consumption APIs
- Settings check

---

#### QC-1-6: QA Audit Trail
**Jako** Manager **chce** audit trail **aby** sledzic zmiany

**Acceptance Criteria:**
- [ ] Record every QA status change
- [ ] Fields: old_value, new_value, notes, user, timestamp
- [ ] View audit history per LP
- [ ] quality_audit table

**Technical Tasks:**
- quality_audit table
- Audit logging on status change
- UI: QAAuditHistory

---

## Epic QC-2: Quality Holds

**Cel:** Blokowanie LP z powodu problemow jakosciowych
**FRs:** QC-FR-06, QC-FR-07, QC-FR-08, QC-FR-09, QC-FR-10
**Priorytet:** P0 MVP
**Effort:** 4 dni

### Stories

#### QC-2-1: Quality Hold CRUD
**Jako** QC Manager **chce** tworzyc holds **aby** blokowac LP

**Acceptance Criteria:**
- [ ] Hold fields: hold_number (auto), reason, hold_type, status, priority
- [ ] hold_type: supplier, process, complaint, recall
- [ ] Status: active, released, disposed
- [ ] Priority: low, medium, high, critical
- [ ] Link multiple LPs to one hold

**Technical Tasks:**
- quality_holds, quality_hold_lps tables
- API: CRUD `/api/quality-holds`
- UI: HoldsTable, CreateHoldModal

---

#### QC-2-2: Create Hold Flow
**Jako** QC Manager **chce** szybko tworzyc hold **aby** reagowac

**Acceptance Criteria:**
- [ ] Select LPs (filter by product, batch, location)
- [ ] Enter reason (required)
- [ ] Select type and priority
- [ ] LPs move to quarantine status
- [ ] Notification sent (if enabled)

**Technical Tasks:**
- LP selection UI
- Status update transaction
- Notification trigger

---

#### QC-2-3: Hold Investigation
**Jako** Investigator **chce** dokumentowac badanie **aby** sledzic postep

**Acceptance Criteria:**
- [ ] Assign investigator
- [ ] Add investigation notes
- [ ] Attach test results/documents
- [ ] Update findings
- [ ] Timeline view of investigation

**Technical Tasks:**
- Investigation fields on hold
- Document attachments
- UI: HoldDetailView with timeline

---

#### QC-2-4: Release Hold
**Jako** QC Manager **chce** releasowac hold **aby** zwolnic LP

**Acceptance Criteria:**
- [ ] Release: status -> released
- [ ] LPs return to passed status
- [ ] Release notes required
- [ ] Approval required if setting enabled
- [ ] released_by, released_at logged

**Technical Tasks:**
- API: POST `/api/quality-holds/:id/release`
- Approval workflow
- LP status restoration

---

#### QC-2-5: Dispose Hold Items
**Jako** QC Manager **chce** disposed items **aby** usunac wadliwe LP

**Acceptance Criteria:**
- [ ] Dispose: cannot recover
- [ ] LPs marked as disposed status
- [ ] Disposal notes required
- [ ] Disposal record created

**Technical Tasks:**
- API: POST `/api/quality-holds/:id/dispose`
- LP status: disposed
- Disposal audit

---

#### QC-2-6: Hold Notification
**Jako** Manager **chce** byc powiadomiony **aby** wiedziec o holdach

**Acceptance Criteria:**
- [ ] Toggle: hold_notification_email
- [ ] Email on hold creation
- [ ] Include: hold number, reason, LPs count, priority
- [ ] Email to QC managers

**Technical Tasks:**
- Email notification service
- Notification template
- Settings check

---

#### QC-2-7: Holds List & Detail UI
**Jako** QC Manager **chce** przegladac holds **aby** zarzadzac

**Acceptance Criteria:**
- [ ] Hold list with filters: Status, Type, Priority, Date
- [ ] Columns: Hold #, Reason, LPs count, Type, Priority, Status, Age
- [ ] Hold detail: info, LPs list, timeline, documents
- [ ] Actions: Edit, Release, Dispose

**Technical Tasks:**
- API: GET `/api/quality-holds`
- UI: HoldsList, HoldDetailView

---

## Epic QC-3: Specifications & Testing

**Cel:** Specyfikacje produktu i testy jakosciowe
**FRs:** QC-FR-11, QC-FR-12, QC-FR-13, QC-FR-14, QC-FR-15, QC-FR-16
**Priorytet:** P1 (Should)
**Effort:** 4 dni

### Stories

#### QC-3-1: Specification CRUD
**Jako** QC Manager **chce** definiowac specs **aby** miec standardy

**Acceptance Criteria:**
- [ ] Toggle: enable_specifications
- [ ] Specs per product
- [ ] Fields: attribute_name, attribute_type, unit, min/max/target, is_critical
- [ ] Custom attribute names (user-defined titles)
- [ ] Examples: Moisture, pH, Temperature, Brix, Viscosity

**Technical Tasks:**
- specifications table
- API: CRUD `/api/specifications`
- UI: SpecificationsList (per product)

---

#### QC-3-2: Specification Types
**Jako** QC Manager **chce** rozne typy specs **aby** dopasowac do atrybutu

**Acceptance Criteria:**
- [ ] Types: numeric, text, boolean
- [ ] Numeric: min_value, max_value, target_value
- [ ] Text: text_value (expected)
- [ ] Boolean: true/false
- [ ] test_method, test_frequency optional

**Technical Tasks:**
- Type-specific validation
- Dynamic form fields

---

#### QC-3-3: Specification UI
**Jako** User **chce** UI dla specs **aby** zarzadzac

**Acceptance Criteria:**
- [ ] Access from Product detail
- [ ] Table: Attribute, Type, Range, Target, Unit, Critical
- [ ] Add/Edit specification modal
- [ ] Delete specification

**Technical Tasks:**
- UI: AddSpecificationModal
- Specification list on product page

---

#### QC-3-4: Record Quality Test
**Jako** QC Officer **chce** rejestrowac testy **aby** dokumentowac wyniki

**Acceptance Criteria:**
- [ ] Select LP to test
- [ ] Choose specification (or ad-hoc)
- [ ] Enter result value
- [ ] Auto-calculate pass/fail for numeric
- [ ] Manual pass/fail for text/boolean
- [ ] Notes optional

**Technical Tasks:**
- quality_tests table
- API: POST `/api/quality-tests`
- UI: RecordTestModal

---

#### QC-3-5: Test Pass/Fail Calculation
**Jako** System **chce** auto-calculate **aby** standardyzowac

**Acceptance Criteria:**
- [ ] Numeric: result within min-max = pass
- [ ] Text: result = expected = pass
- [ ] Boolean: result = expected = pass
- [ ] Display pass/fail indicator
- [ ] Override option for exceptions

**Technical Tasks:**
- Comparison logic
- Result evaluation

---

#### QC-3-6: Test History per LP
**Jako** QC Manager **chce** widziec historie testow **aby** analizowac

**Acceptance Criteria:**
- [ ] All tests for LP
- [ ] Columns: Date, Attribute, Result, Pass/Fail, Tester
- [ ] Trend chart for numeric attributes
- [ ] Export option

**Technical Tasks:**
- API: GET `/api/license-plates/:id/tests`
- UI: TestHistoryTab, TrendChart

---

#### QC-3-7: Scanner Quick Test
**Jako** Operator **chce** testowac na scanner **aby** szybko rejestrowac

**Acceptance Criteria:**
- [ ] Scan LP
- [ ] Show product specifications
- [ ] Select which to test
- [ ] Enter result value
- [ ] Auto pass/fail
- [ ] Save and continue

**Technical Tasks:**
- Scanner test flow
- UI: ScannerTestScreens

---

#### QC-3-8: Scanner QA Pass/Fail
**Jako** Operator **chce** zmieniac QA na scanner **aby** szybko aktualizowac

**Acceptance Criteria:**
- [ ] Scan LP
- [ ] Select action: Pass, Fail, Hold
- [ ] Notes for fail/hold
- [ ] Photo optional
- [ ] Update status, create audit
- [ ] Move to quarantine if fail/hold

**Technical Tasks:**
- Scanner QA flow
- UI: ScannerQAScreens

---

## Epic QC-4: Non-Conformance Reports

**Cel:** Dokumentowanie problemow jakosciowych z root cause
**FRs:** QC-FR-17, QC-FR-18, QC-FR-19, QC-FR-20
**Priorytet:** P0 MVP
**Effort:** 3 dni

### Stories

#### QC-4-1: NCR CRUD
**Jako** QC Manager **chce** tworzyc NCR **aby** dokumentowac problemy

**Acceptance Criteria:**
- [ ] Toggle: enable_ncr
- [ ] NCR fields: ncr_number (auto), ncr_type, description, severity, status
- [ ] Types: material, process, product, supplier
- [ ] Severity: minor, major, critical
- [ ] Status: open, investigating, corrective_action, closed

**Technical Tasks:**
- ncrs table
- API: CRUD `/api/ncrs`
- UI: NCRsTable, CreateNCRModal

---

#### QC-4-2: NCR Links to Entities
**Jako** QC Manager **chce** linkowac NCR **aby** miec context

**Acceptance Criteria:**
- [ ] Link to LP (optional)
- [ ] Link to WO (optional)
- [ ] Link to PO (optional)
- [ ] Link to Product (optional)
- [ ] Search/select entities
- [ ] Display links on NCR detail

**Technical Tasks:**
- Foreign keys on NCR
- Entity search/select UI

---

#### QC-4-3: NCR Lifecycle
**Jako** System **chce** sledzic lifecycle **aby** zapewnic rozwiazanie

**Acceptance Criteria:**
- [ ] Status flow: open -> investigating -> corrective_action -> closed
- [ ] Timeline view on detail
- [ ] Assigned owner
- [ ] Due date
- [ ] Cannot skip statuses

**Technical Tasks:**
- Status transition validation
- Timeline display

---

#### QC-4-4: Root Cause & Actions
**Jako** QC Manager **chce** dokumentowac root cause **aby** zapobiegac

**Acceptance Criteria:**
- [ ] Root cause field (text)
- [ ] Corrective action plan
- [ ] Preventive action plan
- [ ] Evidence attachments

**Technical Tasks:**
- Action fields on NCR
- Document attachments

---

#### QC-4-5: Close NCR
**Jako** QC Manager **chce** zamykac NCR **aby** konczyc proces

**Acceptance Criteria:**
- [ ] Verify actions completed
- [ ] Resolution notes required
- [ ] closed_by, closed_at logged
- [ ] Only authorized roles: Technical Officer, Supervisor QA
- [ ] Status -> closed

**Technical Tasks:**
- API: POST `/api/ncrs/:id/close`
- Role check
- Closure validation

---

#### QC-4-6: NCR List & Detail UI
**Jako** QC Manager **chce** przegladac NCR **aby** zarzadzac

**Acceptance Criteria:**
- [ ] NCR list with filters: Status, Type, Severity, Date, Assignee
- [ ] Columns: NCR #, Description, Type, Severity, Status, Age, Due
- [ ] Detail view: full info, links, timeline, actions
- [ ] Export to PDF

**Technical Tasks:**
- UI: NCRsList, NCRDetailView
- PDF export

---

## Epic QC-5: Certificates & Supplier Quality

**Cel:** Zarzadzanie CoA i metryki dostawcow
**FRs:** QC-FR-21, QC-FR-22, QC-FR-23
**Priorytet:** P1 (Should)
**Effort:** 2 dni

### Stories

#### QC-5-1: CoA Upload & Management
**Jako** Receiver **chce** uploadowac CoA **aby** dokumentowac jakosc dostawy

**Acceptance Criteria:**
- [ ] Toggle: require_coa_on_receipt
- [ ] Upload during GRN receipt
- [ ] Fields: certificate_number, issue_date, expiry_date, document_url
- [ ] Link to GRN, supplier, product, batch
- [ ] Status: pending, verified, rejected

**Technical Tasks:**
- coas table
- API: POST `/api/coas`
- Document upload storage

---

#### QC-5-2: CoA Verification
**Jako** QC Manager **chce** weryfikowac CoA **aby** potwierdzic

**Acceptance Criteria:**
- [ ] Verify button on CoA
- [ ] verified_by, verified_at logged
- [ ] Status -> verified
- [ ] Reject option with reason

**Technical Tasks:**
- API: PUT `/api/coas/:id/verify`
- Verification UI

---

#### QC-5-3: CoA List & UI
**Jako** QC Manager **chce** przegladac CoA **aby** zarzadzac

**Acceptance Criteria:**
- [ ] CoA list with filters: Status, Supplier, Date
- [ ] Columns: Cert #, Supplier, Product, GRN, Date, Status
- [ ] Download document
- [ ] View detail

**Technical Tasks:**
- API: GET `/api/coas`
- UI: CoAsList, CoADetailView

---

#### QC-5-4: Supplier Quality Metrics
**Jako** QC Manager **chce** metryki dostawcow **aby** monitorowac jakosc

**Acceptance Criteria:**
- [ ] Toggle: enable_supplier_quality
- [ ] Metrics: Accept Rate %, Reject Rate %, NCR Count, On-Time CoA
- [ ] Per supplier dashboard
- [ ] Trend charts
- [ ] Recent NCRs and test results

**Technical Tasks:**
- Metrics calculation queries
- UI: SupplierQualityDashboard

---

## Epic QC-6: Dashboard & Reports

**Cel:** Dashboard QA i raporty
**FRs:** QC-FR-24, QC-FR-25, QC-FR-26
**Priorytet:** P0 MVP
**Effort:** 2 dni

### Stories

#### QC-6-1: Quality Dashboard
**Jako** QC Manager **chce** dashboard **aby** widziec status

**Acceptance Criteria:**
- [ ] Pending inspection widget (LPs with pending, sorted oldest first)
- [ ] On hold widget (quarantine LPs, days on hold, investigator)
- [ ] Quality metrics: Pass rate %, avg inspection time, open NCRs
- [ ] Quick actions: Pass, Fail, View

**Technical Tasks:**
- API: GET `/api/quality/dashboard`
- UI: QualityDashboard with widgets

---

#### QC-6-2: Quality Reports
**Jako** QC Manager **chce** raporty **aby** analizowac

**Acceptance Criteria:**
- [ ] Reports: QA Status Summary, Inspection Aging, Hold Summary
- [ ] Reports: NCR Summary, Test Results, Supplier Quality, Spec Compliance
- [ ] Filters: Date, Warehouse, Product, Status
- [ ] Data tables and charts

**Technical Tasks:**
- API: GET `/api/quality/reports/:type`
- Report generation logic

---

#### QC-6-3: Report Export
**Jako** QC Manager **chce** exportowac raporty **aby** dzielic sie

**Acceptance Criteria:**
- [ ] Export to PDF (formatted)
- [ ] Export to Excel (data)
- [ ] Download or email
- [ ] Scheduled reports option (daily/weekly)

**Technical Tasks:**
- PDF/Excel generation
- Email scheduling

---

#### QC-6-4: Inspection Aging Report
**Jako** QC Manager **chce** aging report **aby** priorytetyzowac

**Acceptance Criteria:**
- [ ] Pending LPs by age (days since receipt)
- [ ] Buckets: 0-1 day, 2-3 days, 4-7 days, 7+ days
- [ ] Warehouse filter
- [ ] Click to view LPs

**Technical Tasks:**
- Aging calculation query
- UI: AgingReportView

---

#### QC-6-5: Quality Settings
**Jako** Admin **chce** konfigurowac Quality **aby** dostosowac

**Acceptance Criteria:**
- [ ] All toggles from settings table
- [ ] Default QA status
- [ ] Quarantine location selection
- [ ] Notification settings

**Technical Tasks:**
- quality_settings table
- API: GET/PUT `/api/quality-settings`
- UI: QualitySettingsForm

---

## Zaleznosci

```
QC-1 (QA Status) <- foundation, requires LP from Warehouse
QC-2 (Holds) <- requires QA Status
QC-3 (Specs/Tests) <- requires Products from Technical
QC-4 (NCR) <- requires LP, WO, PO links
QC-5 (CoA) <- requires GRN from Warehouse
QC-6 (Dashboard) <- requires all above
```

- Warehouse module complete (License Plates)
- Technical module (Products) for specifications
- Planning module (PO) for supplier NCRs

---

## Definition of Done

- [ ] Wszystkie AC spelnione
- [ ] QA status blocks shipping/consumption correctly
- [ ] Holds move LP to quarantine
- [ ] NCR lifecycle complete
- [ ] CoA upload and verification works
- [ ] Dashboard shows accurate metrics
- [ ] Unit tests (95% coverage)
- [ ] E2E tests for critical paths
- [ ] API documentation updated

---

## Status

- **Created:** 2025-11-19
- **Status:** Ready for Sprint Planning
- **Dependencies:** Settings, Technical, Warehouse, Planning complete

---

_Epic breakdown dla Quality Module - 26 FRs -> 6 epikow, 36 stories_
