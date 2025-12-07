# Quality Module PRD

## Overview

The Quality module manages quality control and assurance processes for food manufacturing. It handles QA status management on License Plates, quality holds/releases, specifications, testing, and non-conformance tracking.

### Dependencies
- **Settings Module**: Users (QC role), basic configurations
- **Technical Module**: Products (for specifications)
- **Warehouse Module**: License Plates (QA status)
- **Planning Module**: PO (supplier quality)

### Key Concepts
- **QA Status**: Quality status on each LP (pending, passed, failed, quarantine)
- **Quality Hold**: Block LP from use until investigation complete
- **Specification**: Acceptable ranges for product attributes
- **CoA**: Certificate of Analysis from supplier
- **NCR**: Non-Conformance Report

---

## 1. Quality Settings

All Quality features are controlled via Settings toggles.

### 1.1 Configuration Table

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_quality_module` | boolean | true | Enable quality management |
| `allow_pending_consumption` | boolean | false | Allow consuming LPs with pending QA |
| `auto_pass_receipt` | boolean | false | Auto-pass QA on receipt |
| `require_coa_on_receipt` | boolean | false | Require CoA attachment on receipt |
| `enable_specifications` | boolean | true | Enable product specifications |
| `enable_lab_testing` | boolean | false | Enable lab test management |
| `enable_ncr` | boolean | true | Enable non-conformance reports |
| `enable_quality_holds` | boolean | true | Enable quality hold functionality |
| `hold_notification_email` | boolean | true | Email on quality hold |
| `release_requires_approval` | boolean | true | Manager approval for release |
| `quarantine_location_id` | FK | null | Default quarantine location |
| `enable_supplier_quality` | boolean | true | Track supplier quality metrics (accept/reject rate) |
| `enable_certificates` | boolean | false | Manage quality certificates |
| `enable_lab_testing` | boolean | false | Enable lab test with equipment tracking |
| `enable_custom_spec_attributes` | boolean | true | Allow custom specification attributes |

---

## 2. QA Status Management

### 2.1 QA Status Values

| Status | Description | Can Ship | Can Consume | Actions |
|--------|-------------|----------|-------------|---------|
| pending | Awaiting inspection | No | Settings toggle | Pass, Fail, Hold |
| passed | QA approved | Yes | Yes | Hold |
| failed | QA rejected | No | No | Quarantine, Dispose |
| quarantine | Under investigation | No | No | Pass, Fail, Dispose |

### 2.2 Status Transitions

```
pending → passed (inspection complete)
        → failed (inspection failed)
        → quarantine (needs investigation)

passed → quarantine (issue discovered)

failed → quarantine (investigate cause)
       → disposed (cannot use)

quarantine → passed (investigation cleared)
           → failed (confirmed issue)
           → disposed (cannot recover)
```

### 2.3 QA Status UI

#### LP QA Status Change
- Available from LP detail view
- Select new status
- Add notes/reason (required for hold/fail)
- Attach documents (optional)
- Creates audit record

#### Bulk QA Status Change
- Select multiple LPs (same product recommended)
- Apply same status to all
- Common notes
- Creates audit for each

### 2.4 QA Dashboard

#### Pending Inspection Widget
- LPs with status = pending
- Sorted by receipt date (oldest first)
- Quick actions: Pass, Fail, View

#### On Hold Widget
- LPs in quarantine
- Days on hold
- Assigned investigator (if any)

#### Quality Metrics
- Pass rate % (this week/month)
- Average inspection time
- Open NCRs count

---

## 3. Quality Holds

### 3.1 Hold Concept
Quality hold blocks LP from being shipped or consumed. Used when quality issue is suspected but not yet confirmed.

### 3.2 Hold Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | PK | Yes | Unique hold ID |
| `hold_number` | string | Yes | Hold reference number |
| `lp_ids` | FK[] | Yes | Affected License Plates |
| `reason` | text | Yes | Reason for hold |
| `hold_type` | enum | Yes | supplier, process, complaint, recall |
| `status` | enum | Yes | active, released, disposed |
| `priority` | enum | No | low, medium, high, critical |
| `held_by` | FK | Yes | User who created hold |
| `held_at` | datetime | Yes | When hold was created |
| `assigned_to` | FK | No | Investigator |
| `investigation_notes` | text | No | Investigation findings |
| `released_by` | FK | No | User who released |
| `released_at` | datetime | No | When released |
| `release_notes` | text | No | Release justification |

### 3.3 Hold Workflow

1. **Create Hold**
   - Select LPs (or product batch)
   - Enter reason and type
   - Set priority
   - LPs move to quarantine status
   - Notification sent (if enabled)

2. **Investigate**
   - Assign investigator
   - Add investigation notes
   - Attach test results/documents
   - Update findings

3. **Release or Dispose**
   - **Release**: LPs return to passed status
     - Requires approval if enabled
     - Release notes required
   - **Dispose**: LPs marked as disposed
     - Cannot be recovered
     - Disposal notes required

### 3.4 Hold UI

#### Create Hold Modal
- Select LPs (filter by product, batch, location)
- Reason (text area)
- Hold type (dropdown)
- Priority (dropdown)
- Create button

#### Hold List View
- Filter by: Status, Type, Priority, Date range
- Columns: Hold #, Reason, LPs count, Type, Priority, Status, Age
- Actions: View, Edit, Release, Dispose

#### Hold Detail View
- Hold information
- Affected LPs list
- Investigation timeline
- Documents/attachments
- Actions: Assign, Add Notes, Release, Dispose

---

## 4. Specifications

### 4.1 Specification Concept
Specifications define acceptable ranges for product attributes. Used for incoming inspection and production quality checks.

### 4.2 Specification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | PK | Yes | Unique spec ID |
| `product_id` | FK | Yes | Product reference |
| `attribute_name` | string | Yes | Custom title (user-defined) |
| `attribute_type` | enum | Yes | numeric, text, boolean |
| `unit` | string | No | Unit of measure |
| `min_value` | decimal | Conditional | Minimum acceptable |
| `max_value` | decimal | Conditional | Maximum acceptable |
| `target_value` | decimal | No | Ideal value |
| `text_value` | string | Conditional | For text attributes |
| `is_critical` | boolean | No | Critical to quality |
| `test_method` | string | No | How to test |
| `test_frequency` | string | No | When to test |

### 4.3 Custom Specification Attributes

Users can create custom attributes with:
- **Title**: Attribute name (e.g., "Moisture", "pH", "Viscosity")
- **Value**: Expected value or range

Examples of custom specifications:

| Attribute (Title) | Type | Value | Unit |
|-------------------|------|-------|------|
| Moisture | numeric | 5-8 | % |
| pH | numeric | 4.0-4.5 | - |
| Temperature | numeric | 2-4 | °C |
| Color | text | "Red", "Golden" | - |
| Allergen Free | boolean | true/false | - |
| Brix | numeric | 10-12 | °Bx |
| Viscosity | numeric | 100-150 | cP |
| *Custom...* | *any* | *user-defined* | *user-defined* |

**Note**: Toggle `enable_custom_spec_attributes` allows organizations to add their own attributes beyond defaults.

### 4.4 Specification UI

#### Specification List (per Product)
- Accessible from Product detail
- Columns: Attribute, Type, Min, Max, Target, Unit, Critical
- Actions: Add, Edit, Delete

#### Add/Edit Specification Modal
- Attribute name
- Type selection
- Value fields based on type
- Test method (optional)
- Critical flag

---

## 5. Quality Testing

### 5.1 Test Concept
Record quality tests performed on LPs with results compared to specifications.

### 5.2 Test Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | PK | Yes | Unique test ID |
| `test_number` | string | Yes | Test reference |
| `lp_id` | FK | Yes | Tested LP |
| `specification_id` | FK | No | Specification reference |
| `test_date` | datetime | Yes | When tested |
| `tested_by` | FK | Yes | User who tested |
| `attribute_name` | string | Yes | What was tested |
| `result_value` | decimal | Conditional | Numeric result |
| `result_text` | string | Conditional | Text result |
| `result_pass` | boolean | Yes | Pass/Fail |
| `notes` | text | No | Test notes |
| `equipment_id` | string | No | Equipment used |

### 5.3 Test Workflow

1. **Select LP** to test
2. **Choose specification** (or ad-hoc)
3. **Enter result**
   - Numeric: Auto-calculate pass/fail vs spec
   - Text/Boolean: Manual pass/fail
4. **Save test**
5. **Update QA status** based on results

### 5.4 Test UI

#### Record Test (from LP Detail)
- Select specification or enter custom
- Enter result value
- Pass/Fail indicator
- Notes
- Save

#### Test History (per LP)
- All tests for this LP
- Columns: Date, Attribute, Result, Pass/Fail, Tester
- Trend chart for numeric attributes

---

## 6. Non-Conformance Reports (NCR)

### 6.1 NCR Concept
Document quality issues that deviate from specifications or standards. Track root cause and corrective actions.

### 6.2 NCR Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | PK | Yes | Unique NCR ID |
| `ncr_number` | string | Yes | NCR reference |
| `lp_id` | FK | No | Related LP (if applicable) |
| `wo_id` | FK | No | Related WO (if applicable) |
| `po_id` | FK | No | Related PO (if applicable) |
| `product_id` | FK | No | Related product |
| `ncr_type` | enum | Yes | material, process, product, supplier |
| `description` | text | Yes | Issue description |
| `detected_by` | FK | Yes | Who found issue |
| `detected_at` | datetime | Yes | When found |
| `severity` | enum | Yes | minor, major, critical |
| `status` | enum | Yes | open, investigating, corrective_action, closed |
| `root_cause` | text | No | Root cause analysis |
| `corrective_action` | text | No | Corrective action plan |
| `preventive_action` | text | No | Preventive measures |
| `assigned_to` | FK | No | Responsible person |
| `due_date` | date | No | Resolution due date |
| `closed_by` | FK | No | Who closed |
| `closed_at` | datetime | No | When closed |
| `resolution_notes` | text | No | How resolved |

### 6.3 NCR Workflow

1. **Create NCR**
   - Describe issue
   - Link to LP/WO/PO
   - Set severity
   - Assign owner

2. **Investigate**
   - Document root cause
   - Attach evidence

3. **Corrective Action**
   - Define corrective action
   - Define preventive action
   - Set due date

4. **Close**
   - Verify actions completed
   - Document resolution
   - Close NCR
   - **Authorized roles**: Technical Officer, Supervisor QA only

### 6.4 NCR UI

#### Create NCR Modal
- Type selection
- Description (required)
- Link to LP/WO/PO (search)
- Severity
- Assignee

#### NCR List View
- Filter by: Status, Type, Severity, Date, Assignee
- Columns: NCR #, Description, Type, Severity, Status, Age, Due Date
- Actions: View, Edit

#### NCR Detail View
- Full NCR information
- Linked documents
- Timeline (created → investigating → action → closed)
- Root cause and actions
- Actions: Edit, Close

---

## 7. Certificate of Analysis (CoA)

### 7.1 CoA Concept
Document from supplier certifying quality of delivered materials. CoA requirement is **per-product** - some products require CoA on receipt, others don't.

**Product-level setting**: `require_coa` flag on product determines if CoA is mandatory during GRN receipt.

### 7.2 CoA Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | PK | Yes | Unique CoA ID |
| `grn_id` | FK | Yes | Related GRN |
| `supplier_id` | FK | Yes | Supplier |
| `certificate_number` | string | Yes | Supplier's cert number |
| `issue_date` | date | Yes | When issued |
| `expiry_date` | date | No | Cert expiry |
| `product_id` | FK | Yes | Product certified |
| `batch_number` | string | No | Batch certified |
| `document_url` | string | Yes | Uploaded document |
| `verified_by` | FK | No | Who verified |
| `verified_at` | datetime | No | When verified |
| `status` | enum | Yes | pending, verified, rejected |

### 7.3 CoA UI

#### CoA Upload (during Receipt)
- Upload document (PDF/image)
- Enter certificate number
- Issue date
- Link to GRN items

#### CoA List View
- Filter by: Status, Supplier, Date range
- Columns: Cert #, Supplier, Product, GRN, Date, Status
- Actions: View, Verify, Download

---

## 8. Supplier Quality

### 8.1 Supplier Quality Metrics

Track quality performance by supplier:

| Metric | Description |
|--------|-------------|
| Accept Rate | % of deliveries passing QA |
| Reject Rate | % of deliveries rejected |
| NCR Count | Non-conformances from this supplier |
| On-Time CoA | % of deliveries with CoA |
| Response Time | Average time to resolve issues |

### 8.2 Supplier Quality UI

#### Supplier Quality Dashboard (per Supplier)
- Quality metrics summary
- Trend charts
- Recent NCRs
- Recent test results

#### Supplier Quality Report
- Filter by date range
- Accept/reject breakdown
- Issue categories
- Export to PDF/Excel

---

## 9. Quality Reports

### 9.1 Available Reports

| Report | Description | Filters |
|--------|-------------|---------|
| QA Status Summary | LPs by QA status | Date, Warehouse, Product |
| Inspection Aging | Pending LPs by age | Warehouse |
| Hold Summary | Active holds | Status, Type, Priority |
| NCR Summary | NCRs by type/severity | Date, Status, Type |
| Test Results | Test pass/fail rates | Date, Product, Attribute |
| Supplier Quality | Quality by supplier | Date, Supplier |
| Specification Compliance | Results vs specs | Date, Product |

### 9.2 Report Export
- PDF: Formatted report
- Excel: Data for analysis
- Scheduled: Email daily/weekly

---

## 10. Scanner Quality Workflows

### 10.1 Scanner QA Pass/Fail

```
Step 1: Scan LP
├── Display: Product, Qty, Current QA Status
└── Validate: LP exists

Step 2: Select Action
├── Pass
├── Fail
└── Hold

Step 3: Enter Details
├── Notes (required for Fail/Hold)
└── Photo (optional)

Step 4: Confirm
├── Update QA status
├── Create audit record
├── Move to quarantine (if fail/hold)
└── Sound feedback
```

### 10.2 Scanner Quick Test

```
Step 1: Scan LP
├── Display: Product, Specs

Step 2: Select Test
├── Show product specifications
└── Select which to test

Step 3: Enter Result
├── Numeric: Enter value
├── Auto-calculate pass/fail

Step 4: Confirm
├── Save test record
├── Show result
└── Option to test another
```

---

## 11. Database Tables

```sql
-- Quality Holds
CREATE TABLE quality_holds (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    hold_number VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    hold_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    priority VARCHAR(20),
    held_by UUID REFERENCES auth.users(id),
    held_at TIMESTAMP NOT NULL DEFAULT NOW(),
    assigned_to UUID REFERENCES auth.users(id),
    investigation_notes TEXT,
    released_by UUID REFERENCES auth.users(id),
    released_at TIMESTAMP,
    release_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(org_id, hold_number)
);

-- Hold LPs (many-to-many)
CREATE TABLE quality_hold_lps (
    id SERIAL PRIMARY KEY,
    hold_id INTEGER NOT NULL REFERENCES quality_holds(id),
    lp_id INTEGER NOT NULL REFERENCES license_plates(id),
    UNIQUE(hold_id, lp_id)
);

-- Specifications
CREATE TABLE specifications (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    attribute_name VARCHAR(100) NOT NULL,
    attribute_type VARCHAR(20) NOT NULL,
    unit VARCHAR(20),
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    target_value DECIMAL(15,4),
    text_value VARCHAR(255),
    is_critical BOOLEAN DEFAULT false,
    test_method VARCHAR(255),
    test_frequency VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quality Tests
CREATE TABLE quality_tests (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    test_number VARCHAR(50) NOT NULL,
    lp_id INTEGER NOT NULL REFERENCES license_plates(id),
    specification_id INTEGER REFERENCES specifications(id),
    test_date TIMESTAMP NOT NULL DEFAULT NOW(),
    tested_by UUID REFERENCES auth.users(id),
    attribute_name VARCHAR(100) NOT NULL,
    result_value DECIMAL(15,4),
    result_text VARCHAR(255),
    result_pass BOOLEAN NOT NULL,
    notes TEXT,
    equipment_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(org_id, test_number)
);

-- Non-Conformance Reports
CREATE TABLE ncrs (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    ncr_number VARCHAR(50) NOT NULL,
    lp_id INTEGER REFERENCES license_plates(id),
    wo_id INTEGER REFERENCES work_orders(id),
    po_id INTEGER REFERENCES po_header(id),
    product_id INTEGER REFERENCES products(id),
    ncr_type VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    detected_by UUID REFERENCES auth.users(id),
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    due_date DATE,
    closed_by UUID REFERENCES auth.users(id),
    closed_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(org_id, ncr_number)
);

-- Certificates of Analysis
CREATE TABLE coas (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    grn_id INTEGER NOT NULL REFERENCES grns(id),
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    certificate_number VARCHAR(100) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    batch_number VARCHAR(100),
    document_url VARCHAR(500) NOT NULL,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quality Settings
CREATE TABLE quality_settings (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) UNIQUE,
    enable_quality_module BOOLEAN DEFAULT true,
    allow_pending_consumption BOOLEAN DEFAULT false,
    auto_pass_receipt BOOLEAN DEFAULT false,
    require_coa_on_receipt BOOLEAN DEFAULT false,
    enable_specifications BOOLEAN DEFAULT true,
    enable_lab_testing BOOLEAN DEFAULT false,
    enable_ncr BOOLEAN DEFAULT true,
    enable_quality_holds BOOLEAN DEFAULT true,
    hold_notification_email BOOLEAN DEFAULT true,
    release_requires_approval BOOLEAN DEFAULT true,
    quarantine_location_id INTEGER REFERENCES locations(id),
    enable_supplier_quality BOOLEAN DEFAULT false,
    enable_certificates BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quality Audit Log
CREATE TABLE quality_audit (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    lp_id INTEGER REFERENCES license_plates(id),
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Indexes

```sql
-- Quality Holds
CREATE INDEX idx_holds_org_status ON quality_holds(org_id, status);

-- Specifications
CREATE INDEX idx_specs_product ON specifications(product_id);

-- Quality Tests
CREATE INDEX idx_tests_lp ON quality_tests(lp_id);
CREATE INDEX idx_tests_date ON quality_tests(org_id, test_date);

-- NCRs
CREATE INDEX idx_ncr_org_status ON ncrs(org_id, status);
CREATE INDEX idx_ncr_product ON ncrs(product_id);
CREATE INDEX idx_ncr_lp ON ncrs(lp_id);

-- CoAs
CREATE INDEX idx_coa_grn ON coas(grn_id);
CREATE INDEX idx_coa_supplier ON coas(supplier_id);

-- Quality Audit
CREATE INDEX idx_quality_audit_lp ON quality_audit(lp_id);
CREATE INDEX idx_quality_audit_date ON quality_audit(org_id, performed_at);
```

---

## 12. API Endpoints

### QA Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/license-plates/:id/qa-status` | Update LP QA status |
| POST | `/api/license-plates/bulk-qa-status` | Bulk update QA status |

### Quality Holds

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quality-holds` | List holds with filters |
| GET | `/api/quality-holds/:id` | Get hold details |
| POST | `/api/quality-holds` | Create hold |
| PUT | `/api/quality-holds/:id` | Update hold |
| POST | `/api/quality-holds/:id/release` | Release hold |
| POST | `/api/quality-holds/:id/dispose` | Dispose hold items |

### Specifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/:id/specifications` | Get product specs |
| POST | `/api/specifications` | Create specification |
| PUT | `/api/specifications/:id` | Update specification |
| DELETE | `/api/specifications/:id` | Delete specification |

### Quality Tests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quality-tests` | List tests with filters |
| GET | `/api/license-plates/:id/tests` | Get LP test history |
| POST | `/api/quality-tests` | Record test result |

### NCRs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ncrs` | List NCRs with filters |
| GET | `/api/ncrs/:id` | Get NCR details |
| POST | `/api/ncrs` | Create NCR |
| PUT | `/api/ncrs/:id` | Update NCR |
| POST | `/api/ncrs/:id/close` | Close NCR |

### CoAs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coas` | List CoAs with filters |
| GET | `/api/coas/:id` | Get CoA details |
| POST | `/api/coas` | Upload CoA |
| PUT | `/api/coas/:id/verify` | Verify CoA |

### Quality Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quality-settings` | Get settings |
| PUT | `/api/quality-settings` | Update settings |

### Quality Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quality/dashboard` | Get dashboard data |
| GET | `/api/quality/reports/:type` | Generate report |

---

## 13. Functional Requirements

### QA Status Management

| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-01 | System shall track QA status on every LP | Must |
| QC-FR-02 | System shall enforce status transitions | Must |
| QC-FR-03 | System shall prevent shipping non-passed LPs | Must |
| QC-FR-04 | System shall control consumption of pending LPs via settings | Must |
| QC-FR-05 | System shall record audit trail for QA changes | Must |

### Quality Holds

| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-06 | System shall create quality holds for LPs | Must |
| QC-FR-07 | System shall move held LPs to quarantine status | Must |
| QC-FR-08 | System shall notify on hold creation when enabled | Should |
| QC-FR-09 | System shall require approval for hold release when enabled | Should |
| QC-FR-10 | System shall track hold investigation and resolution | Must |

### Specifications

| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-11 | System shall define specifications per product | Should |
| QC-FR-12 | System shall support numeric, text, boolean specs | Should |
| QC-FR-13 | System shall auto-calculate pass/fail for numeric tests | Should |

### Quality Testing

| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-14 | System shall record test results against LPs | Should |
| QC-FR-15 | System shall show test history per LP | Should |
| QC-FR-16 | System shall compare results to specifications | Should |

### Non-Conformance

| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-17 | System shall create NCRs for quality issues | Must |
| QC-FR-18 | System shall track NCR lifecycle | Must |
| QC-FR-19 | System shall link NCRs to LPs, WOs, POs | Must |
| QC-FR-20 | System shall capture root cause and corrective actions | Must |

### Certificates

| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-21 | System shall upload and store CoAs | Should |
| QC-FR-22 | System shall require CoA on receipt when enabled | Should |
| QC-FR-23 | System shall track CoA verification status | Should |

### Reports

| ID | Requirement | Priority |
|----|-------------|----------|
| QC-FR-24 | System shall provide quality dashboard | Must |
| QC-FR-25 | System shall generate quality reports | Should |
| QC-FR-26 | System shall export reports to PDF/Excel | Should |

---

## 14. Integration Points

### With Warehouse Module
- QA status is field on LP
- Quarantine moves LP to quarantine location
- Receipt triggers initial QA status assignment

### With Production Module
- Cannot consume LP if QA = failed/quarantine
- Pending consumption controlled by settings
- NCR can link to WO

### With Planning Module
- NCR can link to PO
- Supplier quality metrics from PO receipts

### With Technical Module
- Specifications defined per product

---

## Status
- **Module Version**: 1.0
- **Last Updated**: 2025-11-19
- **Status**: Draft - Pending Review
- **Progress**: 0% (Clean Slate)
