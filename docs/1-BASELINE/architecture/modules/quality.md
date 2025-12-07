# Quality Module Architecture

## Overview

Quality control with specifications, NCR management, supplier quality tracking, SPC, and document control.

## Dependencies

- **Settings**: Suppliers
- **Technical**: Products, Specifications
- **Warehouse**: License Plates for QA status
- **Production**: Output QA checks

## Consumed By

- **Shipping**: QA release required

## Database Schema

### Core Tables

```sql
-- Quality Checks
CREATE TABLE quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- What's being checked
  check_type TEXT NOT NULL, -- 'receiving', 'in_process', 'final', 'periodic'
  lp_id UUID REFERENCES license_plates(id),
  wo_id UUID REFERENCES work_orders(id),
  product_id UUID NOT NULL REFERENCES products(id),

  -- Spec reference
  spec_id UUID REFERENCES product_specs(id),

  -- Result
  result TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'pass', 'fail', 'conditional'
  checked_by UUID,
  checked_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Check Results (per attribute)
CREATE TABLE check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id UUID NOT NULL REFERENCES quality_checks(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES spec_attributes(id),

  -- Result
  actual_value TEXT NOT NULL,
  is_pass BOOLEAN NOT NULL,
  notes TEXT
);

-- NCR (Non-Conformance Report)
CREATE TABLE ncrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  ncr_number TEXT NOT NULL,

  -- Source
  source_type TEXT NOT NULL, -- 'receiving', 'production', 'customer', 'audit'
  lp_id UUID REFERENCES license_plates(id),
  wo_id UUID REFERENCES work_orders(id),
  product_id UUID REFERENCES products(id),
  supplier_id UUID REFERENCES suppliers(id),

  -- Description
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'minor', -- 'minor', 'major', 'critical'
  category TEXT, -- 'dimensional', 'visual', 'functional', 'documentation'

  -- Status
  status ncr_status NOT NULL DEFAULT 'open',
  disposition TEXT, -- 'use_as_is', 'rework', 'scrap', 'return_to_supplier'
  disposition_notes TEXT,

  -- Quantities
  affected_qty DECIMAL(15,4),
  scrapped_qty DECIMAL(15,4),
  reworked_qty DECIMAL(15,4),

  -- Closure
  closed_by UUID,
  closed_at TIMESTAMPTZ,
  root_cause TEXT,
  corrective_action TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,

  UNIQUE (org_id, ncr_number)
);

CREATE TYPE ncr_status AS ENUM ('open', 'under_review', 'disposition_set', 'closed');

-- NCR Attachments
CREATE TABLE ncr_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ncr_id UUID NOT NULL REFERENCES ncrs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID
);

-- CoA (Certificate of Analysis)
CREATE TABLE coas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Reference
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  grn_id UUID REFERENCES grns(id),
  supplier_id UUID REFERENCES suppliers(id),

  -- Document
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  received_date DATE DEFAULT CURRENT_DATE,

  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier Quality Records
CREATE TABLE supplier_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Metrics
  total_receipts INTEGER DEFAULT 0,
  accepted_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  ncr_count INTEGER DEFAULT 0,

  -- Calculated
  acceptance_rate DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (org_id, supplier_id, period_start)
);

-- SPC Data Points
CREATE TABLE spc_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- What
  product_id UUID NOT NULL REFERENCES products(id),
  attribute_name TEXT NOT NULL,
  wo_id UUID REFERENCES work_orders(id),

  -- Value
  value DECIMAL(15,4) NOT NULL,
  sample_number INTEGER,

  -- Limits (at time of measurement)
  ucl DECIMAL(15,4), -- Upper control limit
  lcl DECIMAL(15,4), -- Lower control limit
  target DECIMAL(15,4),

  -- Result
  is_in_control BOOLEAN,

  measured_at TIMESTAMPTZ DEFAULT now(),
  measured_by UUID
);

-- Documents (SOPs, Work Instructions)
CREATE TABLE quality_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Document info
  doc_number TEXT NOT NULL,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL, -- 'sop', 'work_instruction', 'form', 'policy'
  version TEXT NOT NULL,

  -- File
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,

  -- Associations
  product_id UUID REFERENCES products(id),
  process_name TEXT,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'obsolete'
  effective_date DATE,
  review_date DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,

  UNIQUE (org_id, doc_number, version)
);
```

### Indexes

```sql
-- Quality checks
CREATE INDEX idx_checks_lp ON quality_checks(lp_id);
CREATE INDEX idx_checks_wo ON quality_checks(wo_id);
CREATE INDEX idx_checks_result ON quality_checks(org_id, result);

-- NCR
CREATE INDEX idx_ncr_org_status ON ncrs(org_id, status);
CREATE INDEX idx_ncr_product ON ncrs(product_id);
CREATE INDEX idx_ncr_supplier ON ncrs(supplier_id);

-- CoA
CREATE INDEX idx_coa_lp ON coas(lp_id);
CREATE INDEX idx_coa_supplier ON coas(supplier_id);

-- Supplier quality
CREATE INDEX idx_supplier_quality ON supplier_quality(supplier_id, period_start);

-- SPC
CREATE INDEX idx_spc_product ON spc_data(product_id, attribute_name, measured_at);

-- Documents
CREATE INDEX idx_docs_type ON quality_documents(org_id, doc_type, status);
```

## API Layer

### Quality Checks API
```typescript
export class QualityChecksAPI {
  // CRUD
  static async getAll(filters?: CheckFilters): Promise<QualityCheck[]>
  static async getById(id: string): Promise<QualityCheck>
  static async create(data: CreateCheckInput): Promise<QualityCheck>

  // For LP/WO
  static async getForLP(lpId: string): Promise<QualityCheck[]>
  static async getForWO(woId: string): Promise<QualityCheck[]>

  // Results
  static async recordResults(checkId: string, results: CheckResultInput[]): Promise<QualityCheck>
  static async pass(checkId: string, notes?: string): Promise<QualityCheck>
  static async fail(checkId: string, notes: string): Promise<QualityCheck>
  static async conditionalPass(checkId: string, conditions: string): Promise<QualityCheck>

  // Auto-create from spec
  static async createFromSpec(lpId: string, specId: string): Promise<QualityCheck>
}
```

### NCR API
```typescript
export class NCRsAPI {
  // CRUD
  static async getAll(filters?: NCRFilters): Promise<NCR[]>
  static async getById(id: string): Promise<NCR>
  static async create(data: CreateNCRInput): Promise<NCR>
  static async update(id: string, data: UpdateNCRInput): Promise<NCR>

  // Workflow
  static async startReview(id: string): Promise<NCR>
  static async setDisposition(id: string, data: DispositionInput): Promise<NCR>
  static async close(id: string, data: CloseNCRInput): Promise<NCR>
  static async reopen(id: string, reason: string): Promise<NCR>

  // Attachments
  static async addAttachment(id: string, file: File): Promise<NCRAttachment>
  static async removeAttachment(attachmentId: string): Promise<void>

  // Reports
  static async getBySupplier(supplierId: string): Promise<NCR[]>
  static async getByProduct(productId: string): Promise<NCR[]>
  static async getParetoAnalysis(dateRange: DateRange): Promise<ParetoData>
}
```

### CoA API
```typescript
export class CoAsAPI {
  // CRUD
  static async getAll(filters?: CoAFilters): Promise<CoA[]>
  static async getById(id: string): Promise<CoA>
  static async create(data: CreateCoAInput): Promise<CoA>

  // For LP
  static async getForLP(lpId: string): Promise<CoA | null>

  // Verification
  static async verify(id: string, notes?: string): Promise<CoA>

  // Upload
  static async upload(lpId: string, file: File, metadata: CoAMetadata): Promise<CoA>
}
```

### Supplier Quality API
```typescript
export class SupplierQualityAPI {
  // Records
  static async getForSupplier(supplierId: string, dateRange: DateRange): Promise<SupplierQualityRecord[]>

  // Dashboard
  static async getDashboard(): Promise<SupplierQualityDashboard>
  static async getScorecard(supplierId: string): Promise<SupplierScorecard>

  // Calculate (called periodically)
  static async calculatePeriod(supplierId: string, periodStart: Date): Promise<SupplierQualityRecord>
}
```

### SPC API
```typescript
export class SPCAPI {
  // Data
  static async recordDataPoint(data: SPCDataInput): Promise<SPCData>
  static async getDataPoints(productId: string, attribute: string, dateRange: DateRange): Promise<SPCData[]>

  // Charts
  static async getControlChart(productId: string, attribute: string): Promise<ControlChartData>
  static async getHistogram(productId: string, attribute: string): Promise<HistogramData>

  // Analysis
  static async checkControlLimits(productId: string, attribute: string): Promise<ControlStatus>
  static async calculateCpk(productId: string, attribute: string): Promise<number>
}
```

### Documents API
```typescript
export class QualityDocumentsAPI {
  // CRUD
  static async getAll(filters?: DocFilters): Promise<QualityDocument[]>
  static async getById(id: string): Promise<QualityDocument>
  static async create(data: CreateDocInput): Promise<QualityDocument>
  static async createVersion(docId: string, file: File): Promise<QualityDocument>

  // Status
  static async activate(id: string): Promise<QualityDocument>
  static async obsolete(id: string): Promise<QualityDocument>

  // Associations
  static async getForProduct(productId: string): Promise<QualityDocument[]>
}
```

### API Routes

```
# Quality Checks
GET    /api/quality-checks
POST   /api/quality-checks
GET    /api/quality-checks/:id
POST   /api/quality-checks/:id/results
POST   /api/quality-checks/:id/pass
POST   /api/quality-checks/:id/fail
GET    /api/license-plates/:lpId/quality-checks
GET    /api/work-orders/:woId/quality-checks

# NCR
GET    /api/ncrs
POST   /api/ncrs
GET    /api/ncrs/:id
PATCH  /api/ncrs/:id
POST   /api/ncrs/:id/review
POST   /api/ncrs/:id/disposition
POST   /api/ncrs/:id/close
POST   /api/ncrs/:id/attachments
DELETE /api/ncrs/:id/attachments/:attachmentId
GET    /api/ncrs/analysis/pareto

# CoA
GET    /api/coas
POST   /api/coas
GET    /api/coas/:id
POST   /api/coas/:id/verify
GET    /api/license-plates/:lpId/coa

# Supplier Quality
GET    /api/supplier-quality
GET    /api/supplier-quality/:supplierId
GET    /api/supplier-quality/dashboard

# SPC
POST   /api/spc/data
GET    /api/spc/:productId/:attribute
GET    /api/spc/:productId/:attribute/control-chart
GET    /api/spc/:productId/:attribute/cpk

# Documents
GET    /api/quality-documents
POST   /api/quality-documents
GET    /api/quality-documents/:id
POST   /api/quality-documents/:id/version
POST   /api/quality-documents/:id/activate
```

## Frontend Components

### Pages

```
app/(dashboard)/quality/
├── page.tsx                    # Quality dashboard
├── checks/
│   ├── page.tsx               # Pending checks
│   └── [id]/page.tsx          # Check execution
├── ncr/
│   ├── page.tsx               # NCR list
│   ├── new/page.tsx           # Create NCR
│   └── [id]/page.tsx          # NCR detail
├── coa/
│   └── page.tsx               # CoA management
├── supplier-quality/
│   └── page.tsx               # Supplier scorecards
├── spc/
│   └── page.tsx               # SPC charts
└── documents/
    └── page.tsx               # Document control
```

### Key Components

```typescript
components/quality/
├── QualityCheckForm.tsx        # Execute check
├── CheckResultsGrid.tsx        # Pass/fail per attribute
├── NCRForm.tsx                 # Create/edit NCR
├── NCRTimeline.tsx             # Status history
├── DispositionSelector.tsx     # Disposition options
├── CoAUploader.tsx             # Upload CoA
├── CoAViewer.tsx               # View PDF
├── SupplierScorecard.tsx       # Quality metrics
├── ControlChart.tsx            # X-bar, R chart
├── SPCDashboard.tsx            # SPC overview
├── DocumentViewer.tsx          # View SOP/WI
└── ParetoChart.tsx             # NCR analysis
```

## Business Rules

### NCR Closing
```typescript
// Only Technical Officer and Supervisor QA can close NCR
async function closeNCR(ncrId: string, data: CloseNCRInput) {
  const user = await getCurrentUser()

  if (!['technical_officer', 'supervisor_qa', 'admin'].includes(user.role)) {
    throw new APIError(403, 'forbidden', 'Only Technical Officer or Supervisor QA can close NCR')
  }

  const ncr = await NCRsAPI.getById(ncrId)

  if (ncr.status !== 'disposition_set') {
    throw new APIError(400, 'invalid_status', 'NCR must have disposition set before closing')
  }

  return db.from('ncrs').update({
    status: 'closed',
    root_cause: data.root_cause,
    corrective_action: data.corrective_action,
    closed_by: user.id,
    closed_at: new Date().toISOString(),
  }).eq('id', ncrId)
}
```

### CoA Requirement
```typescript
// Product-level setting
async function checkCoARequired(lpId: string): Promise<boolean> {
  const lp = await LicensePlatesAPI.getById(lpId)
  const product = await ProductsAPI.getById(lp.product_id)

  return product.require_coa
}

// During receiving
async function validateCoA(lpId: string) {
  const required = await checkCoARequired(lpId)

  if (required) {
    const coa = await CoAsAPI.getForLP(lpId)

    if (!coa) {
      // Put LP in QA hold
      await LicensePlatesAPI.updateQAStatus(lpId, 'hold')
      return { valid: false, reason: 'CoA required but not uploaded' }
    }

    if (!coa.verified) {
      await LicensePlatesAPI.updateQAStatus(lpId, 'pending')
      return { valid: false, reason: 'CoA not yet verified' }
    }
  }

  return { valid: true }
}
```

### Custom Spec Attributes
```typescript
// Create spec with custom attributes
async function createSpec(productId: string, attributes: AttributeInput[]) {
  const spec = await SpecsAPI.create({
    product_id: productId,
    version: 1,
    effective_from: new Date(),
    status: 'draft',
  })

  // Add custom attributes (Title/Value format)
  for (const attr of attributes) {
    await db.from('spec_attributes').insert({
      spec_id: spec.id,
      title: attr.title,
      expected_value: attr.expected_value,
      tolerance_min: attr.tolerance_min,
      tolerance_max: attr.tolerance_max,
      uom: attr.uom,
      sequence: attr.sequence,
    })
  }

  return spec
}
```

### Supplier Quality Calculation
```typescript
async function calculateSupplierQuality(supplierId: string, periodStart: Date) {
  const periodEnd = endOfMonth(periodStart)

  // Get all GRN items for supplier in period
  const grns = await GRNsAPI.getBySupplier(supplierId, periodStart, periodEnd)

  let totalReceipts = 0
  let acceptedCount = 0
  let rejectedCount = 0

  for (const grn of grns) {
    const items = await GRNsAPI.getItems(grn.id)
    for (const item of items) {
      totalReceipts++
      if (item.qa_status === 'passed') acceptedCount++
      if (item.qa_status === 'failed') rejectedCount++
    }
  }

  // Count NCRs
  const ncrCount = await NCRsAPI.countBySupplier(supplierId, periodStart, periodEnd)

  // Calculate rate
  const acceptanceRate = totalReceipts > 0
    ? (acceptedCount / totalReceipts) * 100
    : 100

  return db.from('supplier_quality').upsert({
    org_id: getCurrentOrgId(),
    supplier_id: supplierId,
    period_start: periodStart,
    period_end: periodEnd,
    total_receipts: totalReceipts,
    accepted_count: acceptedCount,
    rejected_count: rejectedCount,
    ncr_count: ncrCount,
    acceptance_rate: acceptanceRate,
  })
}
```

## Scanner Workflows

### QA Pass/Fail Workflow
```typescript
const qaWorkflowSteps = [
  { id: 'scan_lp', title: 'Scan LP', inputType: 'scan' },
  { id: 'view_spec', title: 'View Spec', inputType: 'display' },
  { id: 'enter_results', title: 'Enter Results', inputType: 'form' },
  { id: 'verdict', title: 'Pass/Fail', inputType: 'select' },
  { id: 'confirm', title: 'Confirm', inputType: 'confirm' },
]
```

## Integration Points

### Events Emitted
```typescript
type QualityEvent =
  | 'quality_check.completed'
  | 'ncr.created'
  | 'ncr.closed'
  | 'coa.verified'
  | 'lp.qa_status_changed'
```

## Testing

### Key Test Cases
```typescript
describe('NCRsAPI', () => {
  describe('close', () => {
    it('only allows authorized roles')
    it('requires disposition set')
    it('records closure details')
  })
})

describe('CoAsAPI', () => {
  describe('validation', () => {
    it('puts LP on hold if CoA required but missing')
    it('allows release after verification')
  })
})

describe('SupplierQualityAPI', () => {
  describe('calculate', () => {
    it('calculates acceptance rate correctly')
    it('counts NCRs for period')
  })
})
```
