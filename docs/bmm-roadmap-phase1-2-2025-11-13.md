# Implementation Roadmap: Phase 1-2 (0-6 Months)

**Date:** 2025-11-13
**Project:** MonoPilot MES
**Roadmap Type:** Short-Term Implementation (Compliance & Operational Excellence)
**Prepared by:** Business Analyst (BMAD Method)

---

## Executive Summary

This roadmap details the first 6 months of MonoPilot development, focusing on:

- **Phase 1 (0-3 months):** Compliance & Audit Foundation - FDA 21 CFR Part 11, FSMA 204
- **Phase 2 (3-6 months):** Operational Excellence - Production dashboards, quality module, shipping

**Goals:**

1. Achieve **21 CFR Part 11 baseline compliance** (audit trail + e-signatures)
2. Implement **production dashboard** (real-time KPIs)
3. Build **quality module** (inspections, CoA)
4. Add **shipping module** (complete inbound→outbound flow)
5. Improve **user experience** (notifications, real-time updates)

**Success Metrics:**

- 21 CFR Part 11 compliance: 3/6 → 6/6 (100%)
- ISA-95 compliance: 60% → 75%
- Customer-ready beta: 3-5 pilot customers by Month 6

---

## Phase 1: Compliance & Audit Foundation (0-3 Months)

### Timeline: Weeks 1-12

**Objective:** Establish FDA 21 CFR Part 11 baseline compliance and fix critical UI/data gaps

**Priority:** P0 (Critical - Market Entry Blockers)

---

### 1.1 Enable pgAudit Extension (Audit Trail)

**Goal:** Implement tamper-proof audit trail for FDA 21 CFR Part 11 compliance

**Requirements:**

- Log all INSERT, UPDATE, DELETE operations on critical tables
- Capture: user_id, timestamp, SQL statement, old/new values
- Tamper-proof (users cannot modify audit logs)
- 2-year retention policy

**Implementation Steps:**

1. **Enable pgAudit Extension (Week 1)**

   ```sql
   CREATE EXTENSION pgaudit;

   -- Configure audit settings
   ALTER SYSTEM SET pgaudit.log = 'write, ddl';
   ALTER SYSTEM SET pgaudit.log_catalog = off;
   ALTER SYSTEM SET pgaudit.log_parameter = on;
   ALTER SYSTEM SET pgaudit.log_relation = on;
   ```

2. **Configure Table-Level Auditing (Week 1)**

   ```sql
   -- Audit critical tables
   ALTER TABLE work_orders SET (pgaudit.log = 'write');
   ALTER TABLE license_plates SET (pgaudit.log = 'write');
   ALTER TABLE production_outputs SET (pgaudit.log = 'write');
   ALTER TABLE po_header SET (pgaudit.log = 'write');
   ALTER TABLE grns SET (pgaudit.log = 'write');
   ALTER TABLE boms SET (pgaudit.log = 'write');
   ALTER TABLE electronic_signatures SET (pgaudit.log = 'write');
   ```

3. **Create Audit Log View (Week 2)**

   ```sql
   CREATE VIEW v_audit_trail AS
   SELECT
     session_user as user_id,
     statement_timestamp as audit_timestamp,
     command_tag as action_type,
     object_name as table_name,
     substring(audit_tag, 1, 500) as statement_preview
   FROM pg_log_audit
   WHERE object_schema = 'public'
   ORDER BY statement_timestamp DESC;
   ```

4. **Build Audit Trail UI (Week 2-3)**
   - `/settings/audit-log` page
   - Filters: date range, user, table, action type
   - Export to CSV (for auditors)
   - No edit/delete actions (read-only)

**Database Changes:**

- Migration: `096_enable_pgaudit.sql`
- Views: `v_audit_trail`

**API Changes:**

- New: `AuditAPI.getAll(filters)` - read-only, admin-only
- Security: RBAC check (admin role required)

**UI Components:**

- `apps/frontend/app/settings/audit-log/page.tsx` - Audit log viewer
- `apps/frontend/components/tables/AuditLogTable.tsx` - Table component

**Testing:**

- Verify pgAudit logs all changes to critical tables
- Test retention policy (archive logs > 6 months to S3 Glacier)
- Simulate FDA audit (export last 30 days of changes)

**Effort:** 3 weeks (1 developer)

**Dependencies:** None

**Success Criteria:**

- ✅ All critical tables audited
- ✅ Audit log searchable in UI
- ✅ 2-year retention policy automated
- ✅ Logs are tamper-proof (verified by DBA)

---

### 1.2 Electronic Signatures Workflow

**Goal:** Implement e-signature capability for critical operations (FDA 21 CFR Part 11)

**Requirements:**

- User re-enters password (or 2FA) to sign
- Captures: user_id, timestamp, signature meaning, document type/ID, comment
- Cryptographic hash to detect tampering
- Applies to: PO approval, WO approval, BOM activation, Deviation resolution

**Implementation Steps:**

1. **Database Schema (Week 3)**

   ```sql
   CREATE TABLE electronic_signatures (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID NOT NULL REFERENCES organizations(id),
     user_id UUID NOT NULL REFERENCES users(id),
     document_type VARCHAR(50) NOT NULL, -- 'wo', 'po', 'bom_change', 'deviation'
     document_id UUID NOT NULL,
     signature_meaning VARCHAR(50) NOT NULL, -- 'approved', 'reviewed', 'executed', 'witnessed'
     signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     ip_address INET,
     user_agent TEXT,
     comment TEXT,
     requires_2fa BOOLEAN DEFAULT false,
     two_factor_verified BOOLEAN DEFAULT false,
     signature_hash VARCHAR(64) NOT NULL, -- SHA-256(user_id + document_id + timestamp + secret)
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- RLS policy
   ALTER TABLE electronic_signatures ENABLE ROW LEVEL SECURITY;
   CREATE POLICY electronic_signatures_isolation ON electronic_signatures
     USING (org_id = current_setting('app.org_id')::uuid);

   -- Index for lookups
   CREATE INDEX idx_electronic_signatures_document ON electronic_signatures(document_type, document_id);
   ```

2. **API Implementation (Week 3-4)**

   ```typescript
   // lib/api/ElectronicSignaturesAPI.ts
   class ElectronicSignaturesAPI {
     static async requestSignature(data: {
       document_type: string;
       document_id: string;
       signature_meaning: string;
       requires_2fa?: boolean;
     }): Promise<{ signature_request_id: string }> {
       // Return signature request (UI displays modal)
     }

     static async sign(data: {
       signature_request_id: string;
       password: string;
       twofa_code?: string;
       comment?: string;
     }): Promise<ElectronicSignature> {
       // Verify password (re-auth)
       // Generate signature hash
       // Insert signature record
       // Update document status (e.g., wo.status = 'approved')
     }

     static async getSignatures(
       documentType: string,
       documentId: string
     ): Promise<ElectronicSignature[]> {
       // Get all signatures for a document
     }
   }
   ```

3. **UI Components (Week 4-5)**
   - `components/modals/SignatureModal.tsx` - Signature capture modal
     - Password field (re-enter password)
     - Optional 2FA code field
     - Comment field (reason for signature)
     - "Sign" button
   - `components/SignatureHistory.tsx` - Show signature history for document
     - Who signed, when, meaning, comment
     - Display below document (e.g., WO details page)

4. **Integration with Workflows (Week 5)**
   - **PO Approval:**
     - Add "Approve PO" button (if status = 'draft' and user = manager)
     - Click → SignatureModal → sign → PO status = 'approved'
   - **WO Approval:**
     - Add "Release WO" button (if status = 'planned')
     - Click → SignatureModal → sign → WO status = 'released'
   - **BOM Activation:**
     - Add "Activate BOM" button (if bom_status = 'draft')
     - Click → SignatureModal → sign → bom_status = 'active'
   - **Deviation Resolution:**
     - Add "Close Deviation" button (Phase 2 feature)

**Database Changes:**

- Migration: `097_electronic_signatures.sql`

**API Changes:**

- New: `ElectronicSignaturesAPI` (request, sign, getSignatures)

**UI Components:**

- `components/modals/SignatureModal.tsx`
- `components/SignatureHistory.tsx`
- Update: PO, WO, BOM pages (add "Approve" button)

**Testing:**

- Test password verification (incorrect password rejected)
- Test 2FA (if enabled for organization)
- Test signature hash (detect tampering)
- Test signature history display

**Effort:** 2.5 weeks (1 developer)

**Dependencies:** Week 3 (after pgAudit)

**Success Criteria:**

- ✅ E-signatures work for PO, WO, BOM
- ✅ Signature hash prevents tampering
- ✅ Signature history visible on documents
- ✅ 21 CFR Part 11 compliant (verified by consultant)

---

### 1.3 FSMA 204 Compliance Enhancements

**Goal:** Add Traceability Lot Code (TLC) generator and improve FSMA 204 compliance

**Requirements:**

- Generate TLC (Traceability Lot Code) per FSMA 204 format
- TLC format: `[Location]-[Date]-[Product]-[Lot]` (example: `WAR1-20250113-BEEF001-0001`)
- Attach TLC to License Plates (LPs) on receive and production output
- Add "Shipping" critical tracking event (Phase 2 shipping module)

**Implementation Steps:**

1. **Database Schema (Week 6)**

   ```sql
   -- Add TLC field to license_plates
   ALTER TABLE license_plates ADD COLUMN traceability_lot_code VARCHAR(100);

   -- Add TLC generator sequence
   CREATE SEQUENCE tlc_sequence START 1;

   -- Function to generate TLC
   CREATE OR REPLACE FUNCTION generate_tlc(
     p_location_code VARCHAR,
     p_product_code VARCHAR
   ) RETURNS VARCHAR AS $$
   DECLARE
     v_date VARCHAR := TO_CHAR(NOW(), 'YYYYMMDD');
     v_seq VARCHAR := LPAD(NEXTVAL('tlc_sequence')::TEXT, 4, '0');
   BEGIN
     RETURN p_location_code || '-' || v_date || '-' || p_product_code || '-' || v_seq;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **API Changes (Week 6)**

   ```typescript
   // lib/api/LicensePlatesAPI.ts
   static async create(data: CreateLPInput): Promise<LicensePlate> {
     // Generate TLC
     const tlc = await generateTLC(data.location_code, data.product_code);

     const lp = await supabase.from('license_plates').insert({
       ...data,
       traceability_lot_code: tlc,
     });

     return lp;
   }
   ```

3. **UI Changes (Week 6)**
   - Display TLC on LP details page
   - Add TLC to LP labels (printer output)
   - Add TLC to traceability reports

4. **FSMA 204 Report (Week 7)**
   - Create FSMA 204 compliance report (lists all CTEs for a product)
   - Exports: CSV format (TLC, product, qty, location, date, event type)
   - `/reports/fsma-204` page

**Database Changes:**

- Migration: `098_fsma_204_tlc.sql`

**API Changes:**

- Update: `LicensePlatesAPI.create()` (auto-generate TLC)
- New: `ReportsAPI.getFSMA204Report()`

**UI Components:**

- `apps/frontend/app/reports/fsma-204/page.tsx`

**Testing:**

- Verify TLC uniqueness
- Test TLC format (compliant with FSMA 204)
- Simulate recall (trace product from TLC in 30 seconds)

**Effort:** 1 week (1 developer)

**Dependencies:** None

**Success Criteria:**

- ✅ TLC auto-generated on LP creation
- ✅ FSMA 204 report available
- ✅ Recall simulation < 30 seconds

---

### 1.4 Fix Planning Module UI/Data Gaps

**Goal:** Fix documented inconsistencies in PO and TO modules

**Issues (from `docs/04_PLANNING_MODULE.md`):**

1. PO UI missing fields: `currency`, `exchange_rate`, `due_date`, `created_by`, `approved_by`
2. TO UI uses `location_id` instead of `warehouse_id` (data model mismatch)
3. PO line partial receiving not shown in UI

**Implementation Steps:**

1. **PO Header UI Updates (Week 7)**
   - Add fields to PO create/edit form:
     - Currency dropdown (USD, EUR, GBP, PLN)
     - Exchange rate (numeric, auto-filled from supplier default, editable)
     - Due date (date picker, auto-calculated from order_date + lead_time)
     - Created by (auto-filled from session user, read-only)
     - Approved by (filled when signature applied, read-only)

2. **PO Line Receiving Status (Week 7)**
   - Update PO line table to show:
     - Ordered qty
     - Received qty
     - Outstanding qty (calculated: ordered - received)
     - Status: Not Received / Partially Received / Fully Received / Over Received

3. **TO Header UI Fix (Week 7)**
   - **Bug:** UI currently uses `from_location_id` and `to_location_id` in TO header
   - **Fix:** Change to `from_warehouse_id` and `to_warehouse_id`
   - **Policy:** Documented in `bmad.structure.yaml` - TOs are warehouse-based
   - Update form components:
     - From Warehouse (dropdown of warehouses)
     - To Warehouse (dropdown of warehouses)
     - Default location per warehouse (used for receiving)

**Database Changes:**

- None (schema already correct, UI was wrong)

**API Changes:**

- None (API already correct)

**UI Components:**

- Update: `apps/frontend/app/planning/purchase-orders/[id]/page.tsx`
- Update: `apps/frontend/app/planning/transfer-orders/[id]/page.tsx`
- Update: `components/forms/POHeaderForm.tsx`
- Update: `components/forms/TOHeaderForm.tsx`

**Testing:**

- Create PO with currency, exchange rate, due date (verify saved)
- Create TO from Warehouse A to Warehouse B (verify warehouse_id used, not location_id)
- Partially receive PO line (verify status shows "Partially Received")

**Effort:** 1 week (1 developer)

**Dependencies:** None

**Success Criteria:**

- ✅ PO UI shows all fields (currency, exchange_rate, due_date, approvers)
- ✅ TO UI uses warehouse_id (not location_id)
- ✅ PO line receiving status accurate

---

### 1.5 Production Dashboard (Real-Time KPIs)

**Goal:** Create production dashboard with real-time KPIs and charts

**Requirements:**

- Dashboard page: `/production/dashboard`
- KPI widgets: WOs Today, WOs Completed, Avg Yield, WIP Count, Alerts
- Charts: Daily production trend (last 7 days), Yield by product, Line utilization
- Real-time updates (Supabase Realtime)

**Implementation Steps:**

1. **Create Materialized Views (Week 8)**

   ```sql
   -- Daily production KPIs
   CREATE MATERIALIZED VIEW mv_production_kpis AS
   SELECT
     org_id,
     DATE(scheduled_date) as production_date,
     line_id,
     COUNT(*) as total_wos,
     SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_wos,
     SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as wip_count,
     AVG(yield_percentage) as avg_yield,
     SUM(quantity_planned) as total_planned,
     SUM(quantity_produced) as total_produced
   FROM work_orders
   WHERE scheduled_date >= CURRENT_DATE - INTERVAL '7 days'
   GROUP BY org_id, DATE(scheduled_date), line_id;

   -- Refresh every 15 minutes
   CREATE UNIQUE INDEX ON mv_production_kpis(org_id, production_date, line_id);
   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_production_kpis;
   ```

2. **API Implementation (Week 8)**

   ```typescript
   // lib/api/DashboardAPI.ts
   class DashboardAPI {
     static async getProductionKPIs(date?: Date): Promise<ProductionKPIs> {
       // Query mv_production_kpis
       // Return: total_wos, completed_wos, wip_count, avg_yield
     }

     static async getProductionTrend(
       days: number = 7
     ): Promise<ProductionTrend[]> {
       // Query mv_production_kpis for last N days
       // Return: array of { date, total_wos, completed_wos, avg_yield }
     }

     static async getYieldByProduct(): Promise<YieldByProduct[]> {
       // Query work_orders, group by product_id
       // Return: array of { product_code, product_name, avg_yield, total_qty }
     }

     static async getLineUtilization(): Promise<LineUtilization[]> {
       // Query work_orders, calculate line busy time vs. available time
       // Return: array of { line_code, utilization_pct, hours_busy, hours_available }
     }
   }
   ```

3. **UI Components (Week 9-10)**
   - KPI Widget Component:

     ```tsx
     // components/dashboard/KPIWidget.tsx
     function KPIWidget({ title, value, trend, icon }: KPIWidgetProps) {
       return (
         <div className="card">
           <div className="kpi-header">{title}</div>
           <div className="kpi-value">{value}</div>
           <div className="kpi-trend">{trend}</div>
         </div>
       );
     }
     ```

   - Dashboard Page:

     ```tsx
     // app/production/dashboard/page.tsx
     export default function ProductionDashboard() {
       const { data: kpis } = useSWR(
         '/api/dashboard/production-kpis',
         DashboardAPI.getProductionKPIs
       );
       const { data: trend } = useSWR(
         '/api/dashboard/production-trend',
         DashboardAPI.getProductionTrend
       );

       return (
         <div className="dashboard-grid">
           <KPIWidget title="WOs Today" value={kpis.total_wos} />
           <KPIWidget title="Completed" value={kpis.completed_wos} />
           <KPIWidget title="Avg Yield" value={`${kpis.avg_yield}%`} />
           <KPIWidget title="WIP" value={kpis.wip_count} />

           <LineChart
             data={trend}
             xKey="date"
             yKey="completed_wos"
             title="Daily Production"
           />
           <BarChart
             data={yieldByProduct}
             xKey="product_code"
             yKey="avg_yield"
             title="Yield by Product"
           />
         </div>
       );
     }
     ```

4. **Real-Time Updates (Week 10)**
   - Subscribe to Supabase Realtime for work_orders table changes
   - Update KPIs automatically when WO status changes

   ```tsx
   useEffect(() => {
     const subscription = supabase
       .channel('work_orders_changes')
       .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: 'work_orders' },
         payload => {
           // Refresh KPIs
           mutate('/api/dashboard/production-kpis');
         }
       )
       .subscribe();

     return () => subscription.unsubscribe();
   }, []);
   ```

5. **Add Chart Library (Week 9)**
   - Install `recharts` (React charting library)
   - Create reusable chart components:
     - `components/charts/LineChart.tsx`
     - `components/charts/BarChart.tsx`
     - `components/charts/PieChart.tsx`

**Database Changes:**

- Migration: `099_production_dashboard_views.sql`
- Views: `mv_production_kpis`, `mv_yield_by_product`, `mv_line_utilization`

**API Changes:**

- New: `DashboardAPI` (getProductionKPIs, getProductionTrend, getYieldByProduct, getLineUtilization)

**UI Components:**

- New page: `apps/frontend/app/production/dashboard/page.tsx`
- New: `components/dashboard/KPIWidget.tsx`
- New: `components/charts/LineChart.tsx`, `BarChart.tsx`

**Testing:**

- Verify KPIs update in real-time (complete WO → KPI increments)
- Test chart rendering (7 days of data)
- Test performance (dashboard load < 2 seconds)

**Effort:** 3 weeks (1 developer)

**Dependencies:** None

**Success Criteria:**

- ✅ Dashboard displays real-time KPIs
- ✅ Charts show 7-day trends
- ✅ Real-time updates (no F5 required)
- ✅ Dashboard loads < 2 seconds

---

### 1.6 Additional Phase 1 Tasks

**1.6.1 Add Security Headers (Week 11)**

- Update `next.config.js` with security headers (HSTS, CSP, X-Frame-Options)
- Test with Security Headers scanner
- **Effort:** 2 days

**1.6.2 Implement Rate Limiting (Week 11)**

- Add `@vercel/edge-rate-limit` to API routes
- Limit: 100 requests/minute per user
- **Effort:** 2 days

**1.6.3 Add Pagination to Large Tables (Week 11)**

- Add pagination to: WOs, POs, LPs, products tables
- Server-side pagination (limit/offset)
- **Effort:** 3 days

**1.6.4 Add Bulk Actions (Week 12)**

- Add checkbox selection to tables
- Bulk actions: Approve multiple POs, delete multiple draft WOs
- **Effort:** 3 days

**1.6.5 Wire Supabase Realtime to UI (Week 12)**

- Add Realtime subscriptions to:
  - LP status changes (warehouse page)
  - WO progress (production page)
  - New GRN created (warehouse page)
- **Effort:** 2 days

---

## Phase 1 Summary

**Total Duration:** 12 weeks (3 months)

**Deliverables:**

1. ✅ pgAudit enabled (audit trail)
2. ✅ E-signature workflow (PO, WO, BOM approval)
3. ✅ FSMA 204 TLC generator
4. ✅ PO/TO UI gaps fixed
5. ✅ Production dashboard (real-time KPIs)
6. ✅ Security enhancements (headers, rate limiting)
7. ✅ UX improvements (pagination, bulk actions, Realtime)

**Team Effort:**

- 1 Full-Stack Developer × 12 weeks = **12 person-weeks**
- Optional: 0.5 QA Engineer × 4 weeks = **2 person-weeks**
- **Total: 14 person-weeks**

**Success Metrics:**

- 21 CFR Part 11 compliance: 3/6 → 6/6 (100%)
- FSMA 204 compliance: 62% → 90%
- ISA-95 compliance: 60% → 65%
- Dashboard load time: < 2 seconds
- Audit trail coverage: 100% of critical tables

---

## Phase 2: Operational Excellence (3-6 Months)

### Timeline: Weeks 13-24

**Objective:** Build quality module, shipping module, and improve operational workflows

**Priority:** P1 (High - Competitive Parity)

---

### 2.1 Quality Module (QA/QC)

**Goal:** Build quality management module for inspections, non-conformances, CoA

**Requirements:**

- Quality inspections (receiving, in-process, final)
- Non-conformance recording (NCRs)
- Certificate of Analysis (CoA) upload and management
- Quality hold (quarantine LPs)
- Sampling plans (AQL, ISO 2859)

**Implementation Steps:**

1. **Database Schema (Week 13-14)**

   ```sql
   -- Quality inspections
   CREATE TABLE quality_inspections (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID NOT NULL REFERENCES organizations(id),
     inspection_type VARCHAR(50) NOT NULL, -- 'receiving', 'in_process', 'final', 'audit'
     inspection_number VARCHAR(50) UNIQUE NOT NULL,
     document_type VARCHAR(50), -- 'po', 'wo', 'lp', 'grn'
     document_id UUID,
     product_id UUID REFERENCES products(id),
     batch_number VARCHAR(100),
     lp_number VARCHAR(50),
     inspector_id UUID REFERENCES users(id),
     inspection_date DATE NOT NULL,
     status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'passed', 'failed', 'on_hold'
     sampling_plan VARCHAR(100), -- 'AQL 2.5', '100% inspection', etc.
     sample_size INTEGER,
     defects_found INTEGER DEFAULT 0,
     notes TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     completed_at TIMESTAMPTZ
   );

   -- Inspection line items (test results)
   CREATE TABLE inspection_items (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     inspection_id UUID NOT NULL REFERENCES quality_inspections(id),
     test_parameter VARCHAR(100) NOT NULL, -- 'weight', 'temperature', 'pH', 'color', etc.
     specification VARCHAR(200), -- 'Min: 500g, Max: 510g'
     measured_value VARCHAR(100), -- '505g'
     uom VARCHAR(20),
     result VARCHAR(20) NOT NULL, -- 'pass', 'fail', 'na'
     notes TEXT
   );

   -- Non-conformances (NCRs)
   CREATE TABLE non_conformances (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID NOT NULL REFERENCES organizations(id),
     ncr_number VARCHAR(50) UNIQUE NOT NULL,
     inspection_id UUID REFERENCES quality_inspections(id),
     document_type VARCHAR(50),
     document_id UUID,
     product_id UUID REFERENCES products(id),
     batch_number VARCHAR(100),
     lp_number VARCHAR(50),
     severity VARCHAR(20) NOT NULL, -- 'critical', 'major', 'minor'
     category VARCHAR(50), -- 'material_defect', 'process_deviation', 'packaging_error', etc.
     description TEXT NOT NULL,
     root_cause TEXT,
     corrective_action TEXT,
     reported_by UUID REFERENCES users(id),
     assigned_to UUID REFERENCES users(id),
     reported_date DATE NOT NULL,
     status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
     resolution_date DATE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Certificates of Analysis (CoA)
   CREATE TABLE certificates_of_analysis (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID NOT NULL REFERENCES organizations(id),
     coa_number VARCHAR(50) NOT NULL,
     supplier_id UUID REFERENCES suppliers(id),
     product_id UUID REFERENCES products(id),
     batch_number VARCHAR(100) NOT NULL,
     po_id UUID REFERENCES po_header(id),
     grn_id UUID REFERENCES grns(id),
     lp_number VARCHAR(50),
     test_date DATE,
     file_path TEXT, -- Supabase Storage path
     file_name TEXT,
     uploaded_by UUID REFERENCES users(id),
     uploaded_at TIMESTAMPTZ DEFAULT NOW(),
     verified BOOLEAN DEFAULT false,
     verified_by UUID REFERENCES users(id),
     verified_at TIMESTAMPTZ
   );
   ```

2. **API Implementation (Week 15-16)**

   ```typescript
   // lib/api/QualityInspectionsAPI.ts
   class QualityInspectionsAPI {
     static async getAll(filters): Promise<QualityInspection[]>;
     static async getById(id): Promise<QualityInspection>;
     static async create(data): Promise<QualityInspection>;
     static async update(id, data): Promise<QualityInspection>;
     static async recordTestResult(
       inspectionId,
       testData
     ): Promise<InspectionItem>;
     static async complete(id, result): Promise<QualityInspection>; // Pass or Fail
   }

   // lib/api/NonConformancesAPI.ts
   class NonConformancesAPI {
     static async getAll(filters): Promise<NonConformance[]>;
     static async getById(id): Promise<NonConformance>;
     static async create(data): Promise<NonConformance>;
     static async update(id, data): Promise<NonConformance>;
     static async resolve(id, resolution): Promise<NonConformance>;
   }

   // lib/api/CoAAPI.ts
   class CoAAPI {
     static async upload(file, metadata): Promise<CoA>;
     static async getForBatch(batchNumber): Promise<CoA[]>;
     static async verify(id): Promise<CoA>; // Verify CoA (QC manager approval)
   }
   ```

3. **UI Components (Week 17-19)**
   - `/quality/inspections` - List of inspections
   - `/quality/inspections/[id]` - Inspection details (record test results)
   - `/quality/non-conformances` - NCR list
   - `/quality/non-conformances/[id]` - NCR details
   - `/quality/certificates` - CoA list
   - `/quality/certificates/upload` - Upload CoA

4. **Quality Hold Integration (Week 19)**
   - Add "Hold LP" action (sets LP status to 'quarantine')
   - Quality inspection can release LP (status → 'available')

5. **Sampling Plans (Week 20)**
   - Add sampling plan lookup table (AQL 1.5, 2.5, 4.0 per ISO 2859)
   - Auto-calculate sample size based on lot size + AQL

**Database Changes:**

- Migration: `100_quality_module.sql`

**API Changes:**

- New: `QualityInspectionsAPI`, `NonConformancesAPI`, `CoAAPI`

**UI Components:**

- New module: `apps/frontend/app/quality/`

**Testing:**

- Create receiving inspection for PO (pass/fail test)
- Create NCR for failed inspection
- Upload CoA PDF, verify it
- Test quality hold (quarantine LP, release after inspection)

**Effort:** 8 weeks (1 developer)

**Dependencies:** Week 13 (after Phase 1 complete)

**Success Criteria:**

- ✅ Inspections, NCRs, CoA functional
- ✅ Quality hold works (LP quarantine)
- ✅ Sampling plans integrated

---

### 2.2 Shipping Module

**Goal:** Build outbound shipping workflow (pick, pack, ship)

**Requirements:**

- Shipping orders (customer orders)
- Pick list generation
- Packing slip
- Shipment creation (multiple LPs → shipment)
- Carrier integration (future: Phase 3)

**Implementation Steps:**

1. **Database Schema (Week 20-21)**

   ```sql
   -- Shipping orders (customer orders)
   CREATE TABLE shipping_orders (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID NOT NULL REFERENCES organizations(id),
     so_number VARCHAR(50) UNIQUE NOT NULL,
     customer_id UUID REFERENCES customers(id), -- New table
     order_date DATE NOT NULL,
     requested_ship_date DATE,
     ship_to_address TEXT,
     status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'picking', 'packing', 'shipped', 'delivered', 'cancelled'
     created_by UUID REFERENCES users(id),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE shipping_order_lines (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     so_id UUID NOT NULL REFERENCES shipping_orders(id),
     line_number INTEGER NOT NULL,
     product_id UUID NOT NULL REFERENCES products(id),
     quantity_ordered NUMERIC(18,4) NOT NULL,
     quantity_picked NUMERIC(18,4) DEFAULT 0,
     quantity_shipped NUMERIC(18,4) DEFAULT 0,
     uom VARCHAR(20) NOT NULL
   );

   -- Shipments (container for picked LPs)
   CREATE TABLE shipments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID NOT NULL REFERENCES organizations(id),
     shipment_number VARCHAR(50) UNIQUE NOT NULL,
     so_id UUID NOT NULL REFERENCES shipping_orders(id),
     shipment_date DATE NOT NULL,
     carrier VARCHAR(100), -- 'UPS', 'FedEx', 'DHL', 'Own Fleet'
     tracking_number VARCHAR(100),
     status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_transit', 'delivered'
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE shipment_items (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     shipment_id UUID NOT NULL REFERENCES shipments(id),
     lp_number VARCHAR(50) NOT NULL REFERENCES license_plates(lp_number),
     product_id UUID NOT NULL REFERENCES products(id),
     quantity NUMERIC(18,4) NOT NULL,
     uom VARCHAR(20)
   );

   -- Customers table
   CREATE TABLE customers (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID NOT NULL REFERENCES organizations(id),
     customer_code VARCHAR(50) UNIQUE NOT NULL,
     customer_name VARCHAR(200) NOT NULL,
     address TEXT,
     email VARCHAR(100),
     phone VARCHAR(50),
     payment_terms VARCHAR(50),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **API Implementation (Week 21-22)**

   ```typescript
   // lib/api/ShippingOrdersAPI.ts
   class ShippingOrdersAPI {
     static async getAll(filters): Promise<ShippingOrder[]>;
     static async create(data): Promise<ShippingOrder>;
     static async generatePickList(soId): Promise<PickList>; // Allocate LPs (FIFO/FEFO)
   }

   // lib/api/ShipmentsAPI.ts
   class ShipmentsAPI {
     static async create(soId, lpNumbers): Promise<Shipment>;
     static async addTracking(shipmentId, tracking): Promise<Shipment>;
     static async confirmShipment(shipmentId): Promise<Shipment>; // Mark SO as shipped, consume LPs
   }
   ```

3. **UI Components (Week 22-24)**
   - `/warehouse/shipping-orders` - SO list
   - `/warehouse/shipping-orders/[id]` - SO details, generate pick list
   - `/warehouse/shipments` - Shipment list
   - `/warehouse/shipments/create` - Create shipment (scan LPs)

4. **Pick List Logic (Week 23)**
   - Allocate LPs to SO lines (FIFO or FEFO)
   - Generate pick list (group by location, optimize route)
   - Scanner workflow: scan LPs for picking

5. **LP Consumption on Ship (Week 24)**
   - When shipment confirmed → set LP status = 'shipped'
   - Update LP location = 'SHIPPED' (virtual location)
   - Update SO status = 'shipped'

**Database Changes:**

- Migration: `101_shipping_module.sql`

**API Changes:**

- New: `ShippingOrdersAPI`, `ShipmentsAPI`, `CustomersAPI`

**UI Components:**

- New: `apps/frontend/app/warehouse/shipping-orders/`
- New: `apps/frontend/app/warehouse/shipments/`

**Testing:**

- Create SO, generate pick list (FIFO allocation)
- Create shipment, scan LPs
- Confirm shipment (LPs consumed, SO status = shipped)

**Effort:** 5 weeks (1 developer)

**Dependencies:** Week 20 (after quality module)

**Success Criteria:**

- ✅ Shipping orders functional
- ✅ Pick list generation (FIFO/FEFO)
- ✅ Shipments created, LPs consumed on ship

---

### 2.3 Deviation Management Workflow

**Goal:** Record and resolve production deviations (part of quality module)

**Requirements:**

- Record deviation (when process deviates from SOP)
- Assign corrective action
- Require manager approval for WO completion if deviation exists

**Implementation:** Included in 2.1 Quality Module (non_conformances table)

**Effort:** 1 week (included in quality module effort)

---

### 2.4 Downtime Tracking

**Goal:** Track machine downtime for OEE calculation

**Requirements:**

- Record downtime events (reason codes, duration)
- Downtime reasons: Breakdown, Changeover, Material Shortage, Maintenance, etc.
- Calculate OEE (Overall Equipment Effectiveness)

**Implementation Steps:**

1. **Database Schema (Week 24)**

   ```sql
   CREATE TABLE downtime_events (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID NOT NULL REFERENCES organizations(id),
     machine_id UUID NOT NULL REFERENCES machines(id),
     wo_id UUID REFERENCES work_orders(id),
     reason_code VARCHAR(50) NOT NULL, -- 'breakdown', 'changeover', 'material_shortage', 'maintenance'
     start_time TIMESTAMPTZ NOT NULL,
     end_time TIMESTAMPTZ,
     duration_minutes INTEGER, -- Auto-calculated
     notes TEXT,
     recorded_by UUID REFERENCES users(id),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **OEE Calculation (Week 24)**

   ```typescript
   // lib/utils/oee.ts
   function calculateOEE(machineId: string, date: Date): OEEMetrics {
     // OEE = Availability × Performance × Quality
     // Availability = (Planned Production Time - Downtime) / Planned Production Time
     // Performance = (Actual Output / Theoretical Output)
     // Quality = (Good Units / Total Units)

     const plannedTime = 480; // 8-hour shift (minutes)
     const downtime = getDowntime(machineId, date); // Query downtime_events
     const availability = (plannedTime - downtime) / plannedTime;

     // ... calculate performance and quality

     return {
       oee: availability * performance * quality,
       availability,
       performance,
       quality,
     };
   }
   ```

3. **UI Integration (Week 24)**
   - Add "Record Downtime" button on production page
   - Show OEE on production dashboard

**Effort:** 1 week (1 developer)

**Success Criteria:**

- ✅ Downtime events recorded
- ✅ OEE calculated and displayed

---

### 2.5 Background Job Queue (BullMQ)

**Goal:** Implement background job processing for reports, emails, batch tasks

**Requirements:**

- Report generation (XLSX export)
- Email notifications
- Batch data imports

**Implementation:** See Technical Research report (Section 3.4)

**Effort:** 1.5 weeks

---

### 2.6 Document Management (Supabase Storage)

**Goal:** Upload and manage documents (CoA, batch records, SOPs)

**Implementation:** See Technical Research report (Section 3.6)

**Effort:** 1 week

**Included in:** Quality Module (CoA upload)

---

### 2.7 Notification System

**Goal:** Email and in-app notifications for critical events

**Requirements:**

- Email notifications (low stock, WO overdue)
- In-app notifications (bell icon with unread count)
- Notification preferences (user can enable/disable)

**Implementation Steps:**

1. **Database Schema (Week 23)**

   ```sql
   CREATE TABLE notifications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID NOT NULL REFERENCES organizations(id),
     user_id UUID NOT NULL REFERENCES users(id),
     notification_type VARCHAR(50) NOT NULL, -- 'low_stock', 'wo_overdue', 'ncr_assigned', etc.
     title VARCHAR(200) NOT NULL,
     message TEXT,
     link VARCHAR(500), -- Deep link to relevant page
     read BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE TABLE notification_preferences (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id),
     notification_type VARCHAR(50) NOT NULL,
     email_enabled BOOLEAN DEFAULT true,
     in_app_enabled BOOLEAN DEFAULT true,
     UNIQUE(user_id, notification_type)
   );
   ```

2. **Notification Service (Week 23)**

   ```typescript
   // lib/services/NotificationService.ts
   class NotificationService {
     static async send(
       userId: string,
       notification: {
         type: string;
         title: string;
         message: string;
         link?: string;
       }
     ) {
       // Check user preferences
       const prefs = await getNotificationPreferences(userId);

       // Send in-app notification
       if (prefs.in_app_enabled) {
         await supabase
           .from('notifications')
           .insert({ user_id: userId, ...notification });
       }

       // Send email
       if (prefs.email_enabled) {
         await sendEmail(userId, notification);
       }
     }
   }
   ```

3. **UI Components (Week 24)**
   - Bell icon in header (unread count badge)
   - Notification dropdown (last 10 notifications)
   - `/settings/notifications` - Preferences page

**Effort:** 2 weeks (1 developer)

**Success Criteria:**

- ✅ Notifications sent for critical events
- ✅ Bell icon shows unread count
- ✅ User can enable/disable per notification type

---

## Phase 2 Summary

**Total Duration:** 12 weeks (3 months)

**Deliverables:**

1. ✅ Quality module (inspections, NCRs, CoA)
2. ✅ Shipping module (pick, pack, ship)
3. ✅ Deviation management
4. ✅ Downtime tracking (OEE calculation)
5. ✅ Background job queue (BullMQ)
6. ✅ Notification system

**Team Effort:**

- 1 Full-Stack Developer × 12 weeks = **12 person-weeks**
- Optional: 0.5 QA Engineer × 4 weeks = **2 person-weeks**
- **Total: 14 person-weeks**

**Success Metrics:**

- ISA-95 compliance: 65% → 75%
- Quality module coverage: 0% → 80%
- Shipping workflow: 0% → 100%
- OEE tracking: 0% → 100%

---

## Phase 1-2 Combined Summary

**Total Duration:** 24 weeks (6 months)

**Total Team Effort:**

- 1 Full-Stack Developer × 24 weeks = **24 person-weeks** (6 person-months)
- 0.5 QA Engineer × 8 weeks = **4 person-weeks** (1 person-month)
- **Total: 28 person-weeks (7 person-months)**

**Budget Estimate (Rough):**

- Developer: $80-120/hour × 960 hours = **$77,000 - $115,000**
- QA Engineer: $60-80/hour × 160 hours = **$9,600 - $12,800**
- **Total: $87,000 - $128,000**

**Key Milestones:**

- **Month 1:** Audit trail + e-signatures complete
- **Month 2:** Production dashboard live
- **Month 3:** Phase 1 complete (FDA compliance ready)
- **Month 4:** Quality module 50% complete
- **Month 5:** Shipping module complete
- **Month 6:** Phase 2 complete (operational excellence)

**Success Criteria (Phase 1-2 Complete):**

- ✅ 21 CFR Part 11 compliant (100%)
- ✅ FSMA 204 compliant (90%)
- ✅ ISA-95 compliance (75%)
- ✅ Production dashboard (real-time KPIs)
- ✅ Quality module (inspections, NCRs, CoA)
- ✅ Shipping module (complete inbound→outbound flow)
- ✅ Customer-ready for beta (3-5 pilot customers)

---

## References

**Related Reports:**

- Domain & Industry Research (bmm-research-domain-industry-2025-11-13.md)
- Technical Research & Stack Validation (bmm-research-technical-stack-2025-11-13.md)
- Current Features & Gap Analysis (bmm-research-feature-gaps-2025-11-13.md)
- Roadmap Phase 3-4 (bmm-roadmap-phase3-4-2025-11-13.md)
- Unique Differentiators & Strategy (bmm-strategy-differentiators-2025-11-13.md)

---

## Document Information

**Workflow:** BMad Method - Business Analyst Research
**Roadmap Type:** Short-Term Implementation (Phase 1-2)
**Generated:** 2025-11-13
**Next Review:** 2025-04-13 (Quarterly)

---

_This roadmap was generated using the BMad Method Research Workflow, combining gap analysis with industry best practices for MES implementation._
