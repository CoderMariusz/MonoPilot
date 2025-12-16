# Epic 06 - Specifications & Test Parameters Analysis

**Date:** 2025-12-16
**Agent Role:** Specs-Test-Analyzer
**Status:** COMPLETE
**Analysis Scope:** FR-QA-003 (Product Specifications) + FR-QA-004 (Test Templates & Recording)

---

## Executive Summary

Product specifications and test parameters form the **foundation** for all inspection activities in the Quality Module. This analysis covers:

1. **Specification Management** - Version control, approval workflow, product linkage
2. **Test Parameters** - Configuration, parameter types, acceptance criteria
3. **Test Result Recording** - Data capture, validation, pass/fail determination
4. **Business Rules** - Specification versioning, active spec resolution, critical parameters

**Key Finding:** Specifications can and should exist **before** inspections are created. They act as templates that define what to test and what acceptance criteria to apply. This enables a clean separation between specification authoring (QA Manager) and inspection execution (QA Inspector).

**Recommendation:** Create Stories 06.3 (Specifications) and 06.4 (Test Parameters) as standalone MVP stories that can be developed independently of the inspection workflow (Story 06.5).

---

## 1. Specification Management (FR-QA-003)

### 1.1 Specification Lifecycle

```
Draft --> Active --> Expired/Superseded
  |         |           |
  |         |           +---> Archive (read-only)
  |         |
  |         +---> Next version (revision)
  |
  +---> Delete (only if never approved)
```

**State Definitions:**

| Status | Description | Can Edit? | Can Use in Inspection? | Can Approve? |
|--------|-------------|-----------|------------------------|--------------|
| `draft` | Initial creation, not approved | Yes | No | Yes |
| `active` | Approved and effective | No | Yes | No |
| `expired` | Past expiry_date | No | No (legacy only) | No |
| `superseded` | Replaced by newer version | No | No (legacy only) | No |

### 1.2 Version Control

**Business Rules:**

1. **Versioning:**
   - Each product can have multiple specifications
   - Specifications are versioned (integer increments: 1, 2, 3...)
   - Unique constraint: `(org_id, spec_number, version)`
   - Example: `SPEC-001` with versions 1, 2, 3

2. **Effective Dating:**
   - `effective_date` (required): When spec becomes active
   - `expiry_date` (optional): When spec expires
   - Can have future-effective specs (scheduled activation)

3. **Active Spec Resolution:**
   - For a given product and date, find active spec:
     ```sql
     SELECT * FROM quality_specifications
     WHERE product_id = :productId
       AND status = 'active'
       AND effective_date <= CURRENT_DATE
       AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
     ORDER BY effective_date DESC, version DESC
     LIMIT 1;
     ```

4. **Review Frequency:**
   - `review_frequency_days` (default: 365)
   - `next_review_date` auto-calculated
   - Alert QA Manager before review date

### 1.3 Approval Workflow

**Simple Approval (MVP):**

```
Draft --> Submit for Approval --> Review --> Approve/Reject
  ^                                            |
  |                                            |
  +-------- Reject (return to Draft) <---------+
                                                |
                                                v
                                            Active
```

**Approval Process:**

1. QA Manager creates spec in `draft` status
2. Adds test parameters
3. Clicks "Submit for Approval"
4. QA Manager or Quality Director reviews
5. On approval:
   - Set `status = 'active'`
   - Set `approved_by = user_id`
   - Set `approved_at = NOW()`
   - If replacing older spec, set old spec to `superseded`

**Advanced Approval (Phase 3 - Document Control):**
- Multi-step approval (Technical + QA + Director)
- Change reason required
- E-signature support (FDA 21 CFR Part 11)

### 1.4 Product Linkage

**One-to-Many Relationship:**
- One product → Many specifications (different versions, different purposes)
- Example:
  - Product: "Organic Tomato Sauce 500ml"
  - Spec 1: "Incoming Raw Material Spec" (tomatoes)
  - Spec 2: "Final Product Spec" (finished sauce)
  - Spec 3: "In-Process Spec" (pH during cooking)

**Foreign Key:**
```sql
product_id UUID NOT NULL REFERENCES products(id)
```

---

## 2. Test Parameters (FR-QA-004)

### 2.1 Parameter Configuration

**quality_spec_parameters Table:**

```sql
CREATE TABLE quality_spec_parameters (
  id UUID PRIMARY KEY,
  spec_id UUID NOT NULL REFERENCES quality_specifications(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,              -- Display order
  parameter_name TEXT NOT NULL,           -- "pH", "Temperature", "Weight"
  parameter_type TEXT NOT NULL,           -- numeric, text, boolean, range
  target_value TEXT,                      -- Optional target
  min_value DECIMAL(15,6),                -- Minimum acceptable
  max_value DECIMAL(15,6),                -- Maximum acceptable
  unit TEXT,                              -- "g", "C", "pH", "%"
  test_method TEXT,                       -- "AOAC 942.15", "ISO 22000", "Visual"
  instrument_required BOOLEAN DEFAULT false,
  is_critical BOOLEAN DEFAULT false,      -- Critical parameter flag
  acceptance_criteria TEXT,               -- Additional text criteria
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(spec_id, sequence)
);
```

### 2.2 Parameter Types

**MVP Parameter Types (Phase 1):**

| Type | Description | Validation | Example |
|------|-------------|------------|---------|
| `numeric` | Numeric value with min/max | `min_value <= measured <= max_value` | Temperature: 72-75°C |
| `text` | Free text | No automatic validation | Color: "Red", "Green" |
| `boolean` | Pass/Fail | Value = "pass" or "fail" | Visual inspection |
| `range` | Range with target | Target +/- tolerance | Weight: 500g ± 5g |

**Future Parameter Types (Phase 3+):**
- `percentage` - Percentage with limits
- `datetime` - Timestamp validation
- `option_set` - Dropdown selection (predefined options)
- `multi_select` - Multiple options allowed

### 2.3 Critical Parameter Flagging

**Business Rules:**

1. **Critical Parameters:**
   - Flagged with `is_critical = true`
   - Must pass for overall inspection to pass
   - Deviation triggers immediate alert
   - Examples:
     - Cooking temperature (food safety)
     - Metal detection (physical hazard)
     - pH in acidified foods (biological hazard)

2. **Pass/Fail Logic:**
   ```typescript
   // All critical parameters must pass
   function calculateInspectionResult(testResults: TestResult[]): 'pass' | 'fail' {
     const criticalParams = testResults.filter(r => r.parameter.is_critical);

     // If ANY critical param fails, inspection fails
     if (criticalParams.some(r => r.result_status === 'fail')) {
       return 'fail';
     }

     // If all critical pass, but ANY non-critical fails, still fail
     if (testResults.some(r => r.result_status === 'fail')) {
       return 'fail';
     }

     return 'pass';
   }
   ```

### 2.4 Test Methods

**Test Method Reference:**

| Method Type | Example | Notes |
|-------------|---------|-------|
| AOAC | AOAC 942.15 | Official Methods of Analysis |
| ISO | ISO 22000:2018 | International standards |
| FDA | FDA BAM Ch. 4 | Bacteriological Analytical Manual |
| Internal | SOP-QA-001 | Company SOPs |
| Visual | Visual Inspection | Sensory evaluation |
| Equipment | Metal Detector MD-500 | Equipment-based |

**Configuration:**
- Stored as free text in `test_method` field
- QA Manager can select from dropdown (pre-configured list)
- Or enter custom method

---

## 3. Test Result Recording

### 3.1 Test Results Table

**quality_test_results Table:**

```sql
CREATE TABLE quality_test_results (
  id UUID PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
  parameter_id UUID NOT NULL REFERENCES quality_spec_parameters(id),
  measured_value TEXT,                    -- String to support various types
  numeric_value DECIMAL(15,6),            -- For numeric parameters (indexed)
  result_status TEXT NOT NULL,            -- pass, fail, marginal
  tested_by UUID NOT NULL REFERENCES users(id),
  tested_at TIMESTAMPTZ DEFAULT now(),
  equipment_id UUID REFERENCES machines(id),
  calibration_date DATE,                  -- Equipment calibration date
  notes TEXT,
  attachment_url TEXT,                    -- Photo/document evidence
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 Result Validation Logic

**Validation by Parameter Type:**

```typescript
function validateTestResult(parameter: SpecParameter, measuredValue: string): ResultStatus {
  switch (parameter.parameter_type) {
    case 'numeric':
      const numValue = parseFloat(measuredValue);
      if (isNaN(numValue)) return 'fail';

      if (parameter.min_value !== null && numValue < parameter.min_value) {
        return 'fail';
      }
      if (parameter.max_value !== null && numValue > parameter.max_value) {
        return 'fail';
      }

      // Marginal: within 5% of limit (configurable)
      const marginPercent = 0.05;
      if (parameter.min_value !== null) {
        const lowerMargin = parameter.min_value * (1 + marginPercent);
        if (numValue >= parameter.min_value && numValue < lowerMargin) {
          return 'marginal';
        }
      }
      if (parameter.max_value !== null) {
        const upperMargin = parameter.max_value * (1 - marginPercent);
        if (numValue > upperMargin && numValue <= parameter.max_value) {
          return 'marginal';
        }
      }

      return 'pass';

    case 'boolean':
      return measuredValue === 'pass' ? 'pass' : 'fail';

    case 'text':
      // Text parameters require manual validation
      // Inspector selects pass/fail manually
      return 'pass'; // Default, user must select

    case 'range':
      const rangeValue = parseFloat(measuredValue);
      const target = parseFloat(parameter.target_value || '0');
      const tolerance = parameter.max_value - target; // Tolerance = max - target

      if (Math.abs(rangeValue - target) <= tolerance) {
        return 'pass';
      }
      return 'fail';
  }
}
```

### 3.3 Pass/Fail Determination

**Inspection-Level Result:**

```typescript
interface InspectionResult {
  result: 'pass' | 'fail' | 'conditional';
  defects_found: number;
  major_defects: number;
  minor_defects: number;
  critical_failures: string[]; // List of critical params that failed
}

function calculateInspectionResult(
  testResults: TestResult[],
  specification: Specification
): InspectionResult {
  const criticalFailures = testResults.filter(r =>
    r.parameter.is_critical && r.result_status === 'fail'
  );

  const nonCriticalFailures = testResults.filter(r =>
    !r.parameter.is_critical && r.result_status === 'fail'
  );

  // Critical failure = automatic fail
  if (criticalFailures.length > 0) {
    return {
      result: 'fail',
      defects_found: criticalFailures.length + nonCriticalFailures.length,
      major_defects: criticalFailures.length,
      minor_defects: nonCriticalFailures.length,
      critical_failures: criticalFailures.map(r => r.parameter.parameter_name)
    };
  }

  // All critical pass, but some non-critical fail
  if (nonCriticalFailures.length > 0) {
    return {
      result: 'conditional',
      defects_found: nonCriticalFailures.length,
      major_defects: 0,
      minor_defects: nonCriticalFailures.length,
      critical_failures: []
    };
  }

  // All pass
  return {
    result: 'pass',
    defects_found: 0,
    major_defects: 0,
    minor_defects: 0,
    critical_failures: []
  };
}
```

### 3.4 Equipment Calibration Tracking

**Optional Equipment Reference:**

- `equipment_id` links to `machines` table (Epic 01.10)
- `calibration_date` stores last calibration date
- **Validation:**
  - If parameter requires instrument (`instrument_required = true`)
  - Validate equipment is calibrated (within calibration cycle)
  - Alert if calibration expired

**Example:**
```typescript
function validateEquipmentCalibration(
  equipmentId: string,
  testDate: Date
): { valid: boolean; message?: string } {
  const equipment = await getMachine(equipmentId);

  if (!equipment.last_calibration_date) {
    return { valid: false, message: 'Equipment not calibrated' };
  }

  const calibrationCycleDays = equipment.calibration_cycle_days || 365;
  const expiryDate = addDays(equipment.last_calibration_date, calibrationCycleDays);

  if (testDate > expiryDate) {
    return {
      valid: false,
      message: `Calibration expired on ${formatDate(expiryDate)}`
    };
  }

  return { valid: true };
}
```

### 3.5 Attachment Support

**Photo/Document Evidence:**

- `attachment_url` field stores file path or S3 URL
- Use cases:
  - Visual inspection photos
  - Lab test reports (PDF)
  - Certificate of Analysis from supplier
  - Defect documentation

**File Upload Flow:**
1. Inspector captures photo (mobile scanner or desktop)
2. Upload to Supabase Storage: `quality-attachments/{org_id}/{inspection_id}/{filename}`
3. Store URL in `attachment_url`
4. Display in inspection detail view

---

## 4. Business Rules Summary

### 4.1 Specification Versioning

**Rule 1: Version Increments**
- New versions are auto-incremented: `MAX(version) + 1`
- Cannot skip versions (1, 2, 3... sequential)

**Rule 2: Superseding**
- When new spec is approved with same `spec_number`:
  - Old active spec → `status = 'superseded'`
  - New spec → `status = 'active'`
- Superseded specs remain in database (audit trail)

**Rule 3: Deletion**
- Can only delete specs with `status = 'draft'`
- Cannot delete approved specs (set to `expired` instead)

### 4.2 Active Spec Resolution

**Rule 4: Which Spec Applies?**

For a given inspection, resolve active spec:

```sql
-- Inspection occurs on 2024-06-15
-- Product has 3 specs:
--   Spec v1: effective 2024-01-01, expiry 2024-06-30, status=active
--   Spec v2: effective 2024-07-01, expiry NULL, status=draft
--   Spec v3: effective 2024-06-01, expiry NULL, status=active

-- Query returns: Spec v3 (most recent active spec on inspection date)
SELECT * FROM quality_specifications
WHERE product_id = 'product-uuid'
  AND status = 'active'
  AND effective_date <= '2024-06-15'
  AND (expiry_date IS NULL OR expiry_date >= '2024-06-15')
ORDER BY effective_date DESC, version DESC
LIMIT 1;
```

### 4.3 Critical Parameters

**Rule 5: All Critical Must Pass**
- If ANY critical parameter fails → Inspection fails
- Critical failure triggers:
  - Automatic quality hold (if configured)
  - NCR creation (if configured)
  - Email alert to QA Manager

**Rule 6: Marginal Results**
- Marginal = within tolerance but close to limit
- Marginal results do not fail inspection
- But trigger trending analysis alert

### 4.4 Test Method Enforcement

**Rule 7: Method Documentation**
- All test results must reference test method (from parameter)
- If method requires equipment, equipment must be specified
- If equipment specified, calibration must be current

---

## 5. Story Breakdown Recommendations

### Story 06.3 - Product Specifications

**Scope:** Specification CRUD and approval workflow

**Creates:**
- `quality_specifications` table
- `GET /api/quality/specifications` - List specs
- `POST /api/quality/specifications` - Create spec
- `GET /api/quality/specifications/:id` - Detail
- `PUT /api/quality/specifications/:id` - Update (draft only)
- `POST /api/quality/specifications/:id/approve` - Approve spec
- `GET /api/quality/specifications/product/:productId` - Active spec for product

**Business Logic:**
- Version auto-increment
- Effective/expiry date validation
- Superseding workflow
- Active spec resolution

**UI Components:**
- `/quality/specifications` page (list)
- `/quality/specifications/[id]` page (detail)
- Specification form (create/edit)
- Approval modal
- Version history viewer

**Complexity:** M (Medium)
**Estimate:** 2-3 days

**Acceptance Criteria:**
- [ ] Create draft specification
- [ ] Add basic metadata (name, effective date)
- [ ] Link to product
- [ ] Approve specification (status → active)
- [ ] View active spec for product
- [ ] Version increment on revision
- [ ] Supersede old spec when new approved
- [ ] Cannot edit approved spec
- [ ] RLS on specifications table

**Can Exist Before Inspections?** **YES** - Specifications are templates that define what to test.

---

### Story 06.4 - Test Parameters

**Scope:** Parameter configuration within specifications

**Creates:**
- `quality_spec_parameters` table
- `POST /api/quality/specifications/:id/parameters` - Add parameter
- `PUT /api/quality/specifications/:id/parameters/:paramId` - Update parameter
- `DELETE /api/quality/specifications/:id/parameters/:paramId` - Delete parameter
- `GET /api/quality/specifications/:id/parameters` - List parameters

**Business Logic:**
- Parameter type validation (numeric, text, boolean, range)
- Min/max value validation
- Critical parameter flagging
- Sequence/ordering management
- Test method dropdown

**UI Components:**
- Parameter editor (within spec detail page)
- Parameter form modal
- Parameter list table
- Drag-to-reorder sequence

**Complexity:** M (Medium)
**Estimate:** 2-3 days

**Acceptance Criteria:**
- [ ] Add numeric parameter with min/max
- [ ] Add text parameter
- [ ] Add boolean parameter
- [ ] Set critical flag
- [ ] Specify test method
- [ ] Reorder parameters (sequence)
- [ ] Delete parameter (draft spec only)
- [ ] Cannot edit parameters in active spec
- [ ] RLS on spec_parameters table

**Dependency:** Story 06.3 (Specifications must exist first)

---

### Story 06.6 - Test Results Recording

**Scope:** Capture test results during inspection

**Creates:**
- `quality_test_results` table
- `POST /api/quality/test-results` - Record result
- `GET /api/quality/test-results/inspection/:inspectionId` - List results
- `PUT /api/quality/test-results/:id` - Update result

**Business Logic:**
- Result validation by parameter type
- Pass/fail determination
- Marginal result detection
- Equipment calibration validation
- Attachment upload
- Inspection result calculation

**UI Components:**
- Test results form (within inspection detail)
- Parameter row (input + validation)
- Result status indicator (pass/fail/marginal)
- Photo upload widget
- Equipment selector
- Inspection result summary

**Complexity:** M (Medium)
**Estimate:** 2-3 days

**Acceptance Criteria:**
- [ ] Record numeric result with auto-validation
- [ ] Record text result (manual pass/fail)
- [ ] Record boolean result (pass/fail)
- [ ] Upload photo attachment
- [ ] Select equipment (optional)
- [ ] Validate equipment calibration
- [ ] Calculate inspection result (pass/fail)
- [ ] Mark critical failures
- [ ] Cannot edit result after inspection complete
- [ ] RLS on test_results table

**Dependency:**
- Story 06.3 (Specifications)
- Story 06.4 (Parameters)
- Story 06.5 (Inspections - to have inspection context)

---

## 6. MVP Scope Analysis

### Phase 1 MVP Parameter Types

**INCLUDE (All 4 Types):**

| Type | Why MVP? | Complexity |
|------|----------|------------|
| `numeric` | Most common (temp, weight, pH) | LOW |
| `text` | Visual inspection, color, odor | LOW |
| `boolean` | Simple pass/fail checks | LOW |
| `range` | Target +/- tolerance (weight) | MEDIUM |

**Recommendation:** Include all 4 parameter types in Phase 1. The additional complexity is minimal, and it enables real-world specification authoring without workarounds.

**DEFER to Phase 3:**
- `percentage` type
- `datetime` type
- `option_set` (dropdown)
- `multi_select`

### Phase 1 Validation Logic

**MVP Validation:**
- Numeric: min/max comparison
- Text: manual pass/fail (no auto-validation)
- Boolean: pass = pass, fail = fail
- Range: target +/- tolerance

**DEFER:**
- Statistical process control (SPC)
- Trend analysis
- Control charts
- Pareto analysis

---

## 7. Technical Specifications

### 7.1 Database Migrations

**Migration 1: quality_specifications**
```sql
CREATE TABLE quality_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  spec_number TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'draft',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  review_frequency_days INTEGER DEFAULT 365,
  next_review_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),

  UNIQUE(org_id, spec_number, version)
);

CREATE INDEX idx_specs_org_status ON quality_specifications(org_id, status);
CREATE INDEX idx_specs_product ON quality_specifications(product_id);
CREATE INDEX idx_specs_effective ON quality_specifications(org_id, effective_date);
```

**Migration 2: quality_spec_parameters**
```sql
CREATE TABLE quality_spec_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spec_id UUID NOT NULL REFERENCES quality_specifications(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  parameter_name TEXT NOT NULL,
  parameter_type TEXT NOT NULL,
  target_value TEXT,
  min_value DECIMAL(15,6),
  max_value DECIMAL(15,6),
  unit TEXT,
  test_method TEXT,
  instrument_required BOOLEAN DEFAULT false,
  is_critical BOOLEAN DEFAULT false,
  acceptance_criteria TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(spec_id, sequence),
  CHECK (parameter_type IN ('numeric', 'text', 'boolean', 'range'))
);

CREATE INDEX idx_params_spec ON quality_spec_parameters(spec_id);
```

**Migration 3: quality_test_results**
```sql
CREATE TABLE quality_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
  parameter_id UUID NOT NULL REFERENCES quality_spec_parameters(id),
  measured_value TEXT,
  numeric_value DECIMAL(15,6),
  result_status TEXT NOT NULL,
  tested_by UUID NOT NULL REFERENCES users(id),
  tested_at TIMESTAMPTZ DEFAULT now(),
  equipment_id UUID REFERENCES machines(id),
  calibration_date DATE,
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  CHECK (result_status IN ('pass', 'fail', 'marginal'))
);

CREATE INDEX idx_results_inspection ON quality_test_results(inspection_id);
CREATE INDEX idx_results_param ON quality_test_results(parameter_id);
CREATE INDEX idx_results_status ON quality_test_results(result_status);
```

### 7.2 RLS Policies

**Specifications:**
```sql
CREATE POLICY "Specs org isolation"
ON quality_specifications FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Parameters:**
```sql
CREATE POLICY "Params org isolation"
ON quality_spec_parameters FOR ALL
USING (
  spec_id IN (
    SELECT id FROM quality_specifications
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);
```

**Test Results:**
```sql
CREATE POLICY "Results org isolation"
ON quality_test_results FOR ALL
USING (
  inspection_id IN (
    SELECT id FROM quality_inspections
    WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  )
);
```

### 7.3 Service Layer

**specification-service.ts:**
```typescript
export class SpecificationService {
  static async createSpecification(data: CreateSpecInput): Promise<Specification>
  static async getActiveSpecForProduct(productId: string, date?: Date): Promise<Specification | null>
  static async approveSpecification(specId: string, userId: string): Promise<Specification>
  static async supersedePreviousSpec(specNumber: string, productId: string): Promise<void>
  static async getVersionHistory(specNumber: string): Promise<Specification[]>
}
```

**test-parameter-service.ts:**
```typescript
export class TestParameterService {
  static async addParameter(specId: string, data: ParameterInput): Promise<SpecParameter>
  static async updateParameter(paramId: string, data: Partial<ParameterInput>): Promise<SpecParameter>
  static async reorderParameters(specId: string, sequence: string[]): Promise<void>
  static async deleteParameter(paramId: string): Promise<void>
}
```

**test-result-service.ts:**
```typescript
export class TestResultService {
  static async recordTestResult(data: TestResultInput): Promise<TestResult>
  static async validateResult(parameter: SpecParameter, value: string): Promise<ResultStatus>
  static async calculateInspectionResult(inspectionId: string): Promise<InspectionResult>
  static async uploadAttachment(file: File, inspectionId: string): Promise<string>
}
```

### 7.4 Validation Schemas

**Specification:**
```typescript
const specificationSchema = z.object({
  product_id: z.string().uuid(),
  spec_number: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  effective_date: z.date(),
  expiry_date: z.date().optional(),
  review_frequency_days: z.number().int().min(30).max(1825).default(365),
  notes: z.string().optional()
});
```

**Parameter:**
```typescript
const parameterSchema = z.object({
  spec_id: z.string().uuid(),
  parameter_name: z.string().min(1).max(100),
  parameter_type: z.enum(['numeric', 'text', 'boolean', 'range']),
  target_value: z.string().optional(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  unit: z.string().optional(),
  test_method: z.string().optional(),
  is_critical: z.boolean().default(false),
  acceptance_criteria: z.string().optional()
}).refine(
  data => {
    if (data.parameter_type === 'numeric' || data.parameter_type === 'range') {
      return data.min_value !== undefined || data.max_value !== undefined;
    }
    return true;
  },
  { message: 'Numeric parameters require min or max value' }
);
```

**Test Result:**
```typescript
const testResultSchema = z.object({
  inspection_id: z.string().uuid(),
  parameter_id: z.string().uuid(),
  measured_value: z.string(),
  tested_by: z.string().uuid(),
  equipment_id: z.string().uuid().optional(),
  calibration_date: z.date().optional(),
  notes: z.string().optional(),
  attachment_url: z.string().url().optional()
});
```

---

## 8. Complexity Estimation

### Story 06.3 - Product Specifications

**Complexity:** M (Medium)
**Effort:** 2-3 days

**Breakdown:**
- Database migration: 0.5 day
- Service layer: 0.5 day
- API endpoints (5): 0.5 day
- UI components (list, detail, form): 1 day
- Approval workflow: 0.5 day
- Testing: 0.5 day

**Risk:** LOW - Standard CRUD with approval step

---

### Story 06.4 - Test Parameters

**Complexity:** M (Medium)
**Effort:** 2-3 days

**Breakdown:**
- Database migration: 0.5 day
- Service layer: 0.5 day
- API endpoints (4): 0.5 day
- UI components (parameter editor, form): 1 day
- Sequence reordering: 0.5 day
- Testing: 0.5 day

**Risk:** MEDIUM - Reordering UX complexity

---

### Story 06.6 - Test Results Recording

**Complexity:** M (Medium)
**Effort:** 2-3 days

**Breakdown:**
- Database migration: 0.5 day
- Service layer (validation logic): 1 day
- API endpoints (3): 0.5 day
- UI components (result form, photo upload): 1 day
- Pass/fail calculation: 0.5 day
- Testing: 0.5 day

**Risk:** MEDIUM - Validation logic complexity

---

## 9. Key Questions Answered

### Q1: Can specs exist before inspections?

**Answer:** **YES**

Specifications are templates that define what to test. They should be created first by QA Manager, then referenced by inspections.

**Workflow:**
1. QA Manager creates spec for product
2. Adds test parameters
3. Approves spec
4. Inspector creates inspection, selects product
5. System auto-loads active spec for product
6. Inspector records test results against parameters

---

### Q2: Can test templates work standalone?

**Answer:** **YES**

Test parameters are part of specifications, which exist independently of inspections. A spec with parameters is a reusable template.

**Use Case:**
- Create "Raw Material Incoming Spec" template
- Use template for all incoming inspections of that material
- No need to recreate parameters each time

---

### Q3: MVP parameter types (all or subset)?

**Answer:** **ALL 4 TYPES in Phase 1**

**Justification:**
- Numeric, text, boolean are trivial to implement
- Range is slightly more complex but essential for weight specs
- Combined complexity is LOW
- Enables real-world spec authoring without workarounds

**Effort Impact:**
- All 4 types: 2-3 days
- 2 types only: 2 days
- **Recommendation:** Spend extra 1 day for complete feature

---

### Q4: Complexity estimation accurate?

**Answer:** **YES** - All 3 stories are Medium (M) complexity

**Combined Effort:**
- Story 06.3: 2-3 days
- Story 06.4: 2-3 days
- Story 06.6: 2-3 days
- **Total: 6-9 days** (within Phase 1 estimates)

---

## 10. Recommendations Summary

### Story Structure (No Changes Needed)

**Current Plan:**
- Story 06.3: Product Specifications (M)
- Story 06.4: Test Parameters (M)
- Story 06.6: Test Results Recording (M)

**Recommendation:** Keep as-is. Good separation of concerns.

**Story Sequence:**
1. **06.3** (Specifications) - Foundation
2. **06.4** (Parameters) - Depends on 06.3
3. **06.5** (Inspections) - Depends on 06.3, 06.4
4. **06.6** (Test Results) - Depends on 06.5

---

### MVP Scope (Include All Parameter Types)

**Recommendation:** Include all 4 parameter types in Phase 1

**Types:**
- `numeric` - Essential
- `text` - Essential
- `boolean` - Essential
- `range` - Essential (weight specs)

**Effort:** +1 day vs. minimal implementation

---

### Specification Versioning (Keep Simple in MVP)

**MVP Versioning:**
- Auto-increment version number
- Supersede old spec on approval
- No complex branching/merging

**Phase 3+ (Document Control):**
- Multi-step approval
- Change reason tracking
- E-signature compliance

---

### Critical Parameter Logic (MVP Essential)

**Recommendation:** Implement in Phase 1

**Why:**
- Core business rule for food safety
- Simple boolean flag on parameter
- Pass/fail logic straightforward

**Effort:** +0.5 day vs. no critical flagging

---

## 11. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Parameter validation complexity | MEDIUM | MEDIUM | Start with simple min/max, add SPC in Phase 3 |
| Equipment calibration tracking | LOW | LOW | Optional in MVP (Epic 01.10 dependency) |
| Photo upload performance | MEDIUM | LOW | Use Supabase Storage with CDN |
| Spec versioning confusion | MEDIUM | MEDIUM | Clear UI for version history |
| Test method dropdown too large | LOW | MEDIUM | Allow free text entry with autocomplete |

---

## 12. Success Metrics

**Story 06.3 (Specifications):**
- [ ] Create draft spec in <2 minutes
- [ ] Approve spec in <30 seconds
- [ ] View active spec for product in <1 second
- [ ] Version history loads in <1 second

**Story 06.4 (Parameters):**
- [ ] Add parameter in <30 seconds
- [ ] Reorder parameters (drag-drop) in <5 seconds
- [ ] Delete parameter in <5 seconds

**Story 06.6 (Test Results):**
- [ ] Record numeric result with auto-validation in <10 seconds
- [ ] Upload photo attachment in <30 seconds
- [ ] Calculate inspection result in <500ms

---

## Conclusion

Specifications and test parameters are the **foundation** of the Quality Module. The analysis confirms:

1. **Specifications exist standalone** - No dependency on inspections
2. **All 4 parameter types in MVP** - Low complexity, high value
3. **Critical parameter logic essential** - Food safety requirement
4. **Story structure solid** - 06.3 → 06.4 → 06.6 sequence correct
5. **Complexity estimates accurate** - 2-3 days each, 6-9 days total

**Status:** READY FOR IMPLEMENTATION

**Next Steps:**
1. Create Story 06.3 (Product Specifications)
2. Create Story 06.4 (Test Parameters)
3. Create Story 06.6 (Test Results Recording)
4. Create context YAML files for each story

---

## Appendix: Example Specification

**Product:** Organic Tomato Sauce 500ml
**Spec Number:** SPEC-TS-500-001
**Version:** 2
**Status:** Active
**Effective Date:** 2024-06-01
**Expiry Date:** 2025-05-31

**Test Parameters:**

| Seq | Parameter | Type | Target | Min | Max | Unit | Critical | Method |
|-----|-----------|------|--------|-----|-----|------|----------|--------|
| 1 | pH | numeric | - | 4.0 | 4.5 | pH | YES | AOAC 942.15 |
| 2 | Brix | numeric | 8.5 | 8.0 | 9.0 | °Bx | NO | Refractometer |
| 3 | Net Weight | range | 500 | 495 | 505 | g | YES | Scale |
| 4 | Color | text | Red | - | - | - | NO | Visual |
| 5 | Foreign Material | boolean | - | - | - | - | YES | Visual |
| 6 | Temperature | numeric | - | 2 | 6 | °C | YES | Thermometer |

**Critical Parameters:** pH, Net Weight, Foreign Material, Temperature
**Test Method References:** AOAC 942.15, ISO 2173, SOP-QA-001

---

**Document Status:** COMPLETE
**Next Review:** N/A
**Version:** 1.0
**Author:** SPECS-TEST-ANALYZER (AI Agent)
