# Implementation Roadmap: Phase 3-4 (6-18 Months)

**Date:** 2025-11-13
**Project:** MonoPilot MES
**Roadmap Type:** Long-Term Implementation (IoT & Advanced Features)
**Prepared by:** Business Analyst (BMAD Method)

---

## Executive Summary

This roadmap details months 6-18 of MonoPilot development, focusing on:

- **Phase 3 (6-12 months):** IoT & Integration - SCADA connectivity, ERP integrations, advanced reporting
- **Phase 4 (12-18 months):** Advanced Features - AI/ML, predictive analytics, marketplace

**Goals:**

1. Achieve **Level 2 (SCADA) connectivity** via IoT gateway
2. Integrate with **ERP systems** (SAP, QuickBooks connectors)
3. Build **advanced reporting/BI** engine
4. Implement **AI-powered features** (yield prediction, recall simulation)
5. Create **MonoPilot Marketplace** (ecosystem of integrations and templates)

**Success Metrics:**

- IoT connectivity: 0% → 80% (OPC UA + MQTT support)
- ERP integrations: 0% → 60% (2-3 pre-built connectors)
- Advanced analytics: 0% → 70% (BI dashboards, predictive models)
- Marketplace: Launch with 10+ integrations/templates

---

## Phase 3: IoT & Integration (6-12 Months)

### Timeline: Weeks 25-48 (Months 7-12)

**Objective:** Connect to shop floor equipment (Level 2) and enterprise systems (ERP, WMS)

**Priority:** P1-P2 (High-to-Medium - Competitive Differentiation)

---

### 3.1 IoT Gateway & OPC UA Integration

**Goal:** Connect MonoPilot to industrial equipment (PLCs, SCADA systems)

**Requirements:**

- OPC UA client for PLC connectivity
- MQTT broker for IoT sensors (scales, label printers, temperature sensors)
- Equipment data collection (production counts, cycle times, alarms)
- Real-time equipment dashboard

**Architecture:** IoT Gateway Pattern (see Technical Research report, Section 3.3)

```
Equipment (OPC UA Server) → IoT Gateway (Node-RED) → MQTT → MonoPilot → Supabase
```

**Implementation Steps:**

1. **IoT Gateway PoC (Weeks 25-26)**
   - Set up Node-RED on VPS or edge device (Raspberry Pi)
   - Install OPC UA node (`node-red-contrib-opcua`)
   - Connect to demo OPC UA server (test connectivity)

2. **MonoPilot Webhook Endpoint (Week 27)**

   ```typescript
   // app/api/iot/equipment-data/route.ts
   export async function POST(request: Request) {
     const { machine_id, data_point, value, timestamp } = await request.json();

     // Validate request (API key authentication)
     // Insert into equipment_data table
     await supabase.from('equipment_data').insert({
       machine_id,
       data_point,
       value,
       timestamp,
     });

     // Trigger real-time update (Supabase Realtime)
     // Trigger alerts (if threshold exceeded)
   }
   ```

3. **Node-RED Flow (Week 27)**

   ```
   [OPC UA Read] → [Parse Data] → [HTTP Request (POST /api/iot/equipment-data)] → [Debug]
   ```

4. **Equipment Data Dashboard (Weeks 28-30)**
   - `/production/equipment` page
   - KPI widgets: Machine status (running/stopped), production count (live), cycle time avg
   - Real-time chart (production count over last hour)
   - Alerts (machine stopped > 5 min, cycle time > threshold)

5. **Database Schema (Week 28)**

   ```sql
   CREATE TABLE equipment_data (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     org_id UUID NOT NULL REFERENCES organizations(id),
     machine_id UUID NOT NULL REFERENCES machines(id),
     wo_id UUID REFERENCES work_orders(id),
     timestamp TIMESTAMPTZ NOT NULL,
     data_point VARCHAR(100) NOT NULL, -- 'production_count', 'cycle_time', 'temperature', etc.
     value NUMERIC(18,4),
     unit VARCHAR(20),
     quality VARCHAR(20) DEFAULT 'good', -- OPC UA quality
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Partition by month (for large datasets)
   CREATE TABLE equipment_data_2025_01 PARTITION OF equipment_data
     FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
   ```

6. **MQTT Support (Week 30)**
   - Add MQTT broker (Mosquitto or AWS IoT Core)
   - Node-RED MQTT subscriber → MonoPilot webhook

**Deliverables:**

- Node-RED IoT gateway (OPC UA + MQTT)
- Equipment data collection (production counts, cycle times)
- Real-time equipment dashboard

**Effort:** 6 weeks (1 IoT specialist + 1 developer)

**Dependencies:** None

**Success Criteria:**

- ✅ OPC UA connection to PLC (demo or customer site)
- ✅ Equipment data flowing to MonoPilot
- ✅ Real-time dashboard shows machine status

---

### 3.2 Advanced Reporting & BI Engine

**Goal:** Build custom report builder and BI dashboards (beyond basic XLSX exports)

**Requirements:**

- Drag-and-drop report builder (business users)
- Pre-built report templates (traceability, yield, production summary)
- BI dashboards (executive KPIs, trend analysis)
- Export formats: XLSX, CSV, PDF

**Technology Options:**

- **Option A:** Custom report builder (React-based, query builder UI)
- **Option B:** Embed existing tool (Metabase open-source, self-hosted)
- **Option C:** Build API + use external BI (Tableau, Power BI)

**Recommended:** Option A (Custom report builder) for Phase 3, Option B (Metabase) for advanced users (Phase 4)

**Implementation Steps:**

1. **Report Builder UI (Weeks 31-34)**
   - `/reports/builder` page
   - Drag-and-drop interface:
     - Select data source (work_orders, license_plates, production_outputs)
     - Select columns (product_code, quantity, yield, batch_number)
     - Add filters (date range, status, line)
     - Group by (product, line, date)
     - Sort order
   - Preview results (first 100 rows)
   - Save report definition (reusable)

2. **Report Execution Engine (Week 34)**

   ```typescript
   // lib/services/ReportEngine.ts
   class ReportEngine {
     static async execute(reportDef: ReportDefinition): Promise<ReportResult> {
       // Build SQL query from report definition
       const query = buildQuery(reportDef);

       // Execute query (with pagination)
       const results = await supabase.rpc('execute_report', { query });

       return results;
     }

     static async export(
       reportDef: ReportDefinition,
       format: 'xlsx' | 'csv' | 'pdf'
     ): Promise<Blob> {
       // Execute report
       // Generate file (XLSX using exceljs, PDF using pdfmake)
       // Upload to Supabase Storage
       // Return download URL
     }
   }
   ```

3. **Pre-Built Report Templates (Week 35)**
   - Traceability Report (forward/backward genealogy)
   - Yield Summary (by product, by line, by date)
   - Production Summary (WOs completed, qty produced)
   - Inventory Report (LP snapshot by product, location)
   - Quality Report (inspections, NCRs by product)

4. **BI Dashboard (Weeks 36-38)**
   - `/reports/dashboards` page
   - Executive dashboard:
     - Production trend (last 30 days)
     - Yield trend (last 30 days)
     - Top 10 products by volume
     - Top 10 products by yield
     - NCR count by severity
     - OEE trend (if downtime tracking enabled)

**Deliverables:**

- Custom report builder
- 5+ pre-built templates
- Executive BI dashboard

**Effort:** 8 weeks (1 developer)

**Dependencies:** None

**Success Criteria:**

- ✅ Business user can build custom report (no SQL knowledge)
- ✅ Reports export to XLSX, CSV, PDF
- ✅ Executive dashboard loads < 3 seconds

---

### 3.3 ERP Integration Connectors

**Goal:** Pre-built connectors for common ERP systems (SAP, QuickBooks, Xero)

**Requirements:**

- Bi-directional sync (MonoPilot ↔ ERP)
- Sync: POs, TOs, WO completion, inventory levels
- Scheduler: Sync every 15 minutes or on-demand

**Architecture:**

```
MonoPilot API ↔ Integration Service (Node.js worker) ↔ ERP API
```

**Implementation Steps:**

1. **Integration Framework (Weeks 39-40)**
   - Build integration service (separate Node.js app)
   - BullMQ job queue for scheduled sync
   - Database schema:

     ```sql
     CREATE TABLE integration_connections (
       id UUID PRIMARY KEY,
       org_id UUID NOT NULL,
       integration_type VARCHAR(50), -- 'sap', 'quickbooks', 'xero'
       credentials_encrypted TEXT, -- OAuth tokens, API keys (encrypted)
       sync_frequency VARCHAR(20), -- '15min', '1hour', 'manual'
       last_sync_at TIMESTAMPTZ,
       status VARCHAR(20) -- 'active', 'error', 'disabled'
     );

     CREATE TABLE integration_sync_logs (
       id UUID PRIMARY KEY,
       connection_id UUID REFERENCES integration_connections(id),
       sync_type VARCHAR(50), -- 'po_import', 'wo_export', 'inventory_sync'
       started_at TIMESTAMPTZ,
       completed_at TIMESTAMPTZ,
       records_processed INTEGER,
       errors INTEGER,
       error_log TEXT
     );
     ```

2. **QuickBooks Connector (Weeks 40-42)**
   - OAuth 2.0 authentication
   - Sync POs from QuickBooks → MonoPilot
   - Sync WO completions → QuickBooks (as production entries)
   - Sync inventory levels (MonoPilot → QuickBooks)

3. **SAP Connector (Weeks 42-44) [Optional, if customer demand]**
   - SAP OData API (or BAPI)
   - Sync POs, WOs, inventory

4. **Integration UI (Week 44)**
   - `/settings/integrations` page
   - Connect to ERP (OAuth flow)
   - Configure sync frequency
   - View sync logs (last 100 syncs)

**Deliverables:**

- QuickBooks connector (full bi-directional sync)
- Optional: SAP connector (if customer demand)

**Effort:** 6 weeks (1 developer)

**Dependencies:** None

**Success Criteria:**

- ✅ QuickBooks connector works (PO import, WO export, inventory sync)
- ✅ Sync runs automatically every 15 minutes
- ✅ Error handling and retry logic

---

### 3.4 Warehouse Task Queue & Cycle Counting

**Goal:** Improve warehouse efficiency with task management and cycle counting

**Implementation:**

1. **Warehouse Task Queue (Weeks 45-46)**
   - Database schema:

     ```sql
     CREATE TABLE warehouse_tasks (
       id UUID PRIMARY KEY,
       org_id UUID NOT NULL,
       task_type VARCHAR(50), -- 'pick', 'putaway', 'move', 'count'
       priority INTEGER DEFAULT 5, -- 1 (high) to 10 (low)
       assigned_to UUID REFERENCES users(id),
       status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
       so_id UUID REFERENCES shipping_orders(id),
       lp_number VARCHAR(50),
       from_location_id UUID,
       to_location_id UUID,
       created_at TIMESTAMPTZ DEFAULT NOW()
     );
     ```

   - UI: `/warehouse/tasks` (list of tasks, sorted by priority)
   - Scanner workflow: Scan LP → see assigned task

2. **Cycle Counting (Weeks 46-48)**
   - Database schema:

     ```sql
     CREATE TABLE cycle_counts (
       id UUID PRIMARY KEY,
       org_id UUID NOT NULL,
       count_number VARCHAR(50) UNIQUE,
       location_id UUID REFERENCES locations(id),
       count_date DATE,
       counted_by UUID REFERENCES users(id),
       status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'variance_review'
       created_at TIMESTAMPTZ DEFAULT NOW()
     );

     CREATE TABLE cycle_count_items (
       id UUID PRIMARY KEY,
       cycle_count_id UUID REFERENCES cycle_counts(id),
       product_id UUID REFERENCES products(id),
       system_qty NUMERIC(18,4),
       counted_qty NUMERIC(18,4),
       variance NUMERIC(18,4), -- counted_qty - system_qty
       variance_pct NUMERIC(5,2),
       notes TEXT
     );
     ```

   - UI: `/warehouse/cycle-counts` (create, execute, review variances)
   - Scanner workflow: Scan location → count LPs → submit

**Deliverables:**

- Warehouse task queue
- Cycle counting workflow

**Effort:** 4 weeks (1 developer)

**Success Criteria:**

- ✅ Tasks assigned and tracked
- ✅ Cycle counts executed, variances identified

---

## Phase 3 Summary

**Total Duration:** 24 weeks (6 months, weeks 25-48)

**Deliverables:**

1. ✅ IoT gateway (OPC UA + MQTT)
2. ✅ Equipment data collection + real-time dashboard
3. ✅ Advanced reporting (custom report builder)
4. ✅ BI dashboards (executive KPIs)
5. ✅ ERP connector (QuickBooks)
6. ✅ Warehouse task queue + cycle counting

**Team Effort:**

- 1 Full-Stack Developer × 20 weeks = **20 person-weeks**
- 1 IoT Specialist × 6 weeks = **6 person-weeks**
- 0.5 QA Engineer × 6 weeks = **3 person-weeks**
- **Total: 29 person-weeks (7.25 person-months)**

**Success Metrics:**

- ISA-95 compliance: 75% → 85%
- IoT connectivity: 0% → 80%
- ERP integrations: 0% → 60%
- Reporting: Basic → Advanced

---

## Phase 4: Advanced Features (12-18 Months)

### Timeline: Weeks 49-72 (Months 13-18)

**Objective:** Differentiate with AI/ML, predictive analytics, and ecosystem (marketplace)

**Priority:** P2-P3 (Medium-to-Low - Future Differentiation)

---

### 4.1 AI-Powered Recall Simulation

**Goal:** Simulate recall in 30 seconds (vs. 4-8 hours manual process)

**Requirements:**

- Input: TLC or LP number or batch number or supplier batch
- Output: Full traceability graph (forward + backward)
- Visualize: Affected products, customers, WOs, suppliers

**Implementation Steps:**

1. **Graph Database Model (Week 49-50)**
   - Use PostgreSQL recursive CTE or add graph database (Neo4j)
   - Build traceability graph from `lp_genealogy` table

2. **Recall Algorithm (Week 50)**

   ```typescript
   // lib/services/RecallSimulator.ts
   class RecallSimulator {
     static async simulate(input: {
       tlc?: string;
       lp_number?: string;
       batch_number?: string;
       supplier_batch?: string;
     }): Promise<RecallGraph> {
       // Find all LPs matching input
       // Traverse forward (consumed by which WOs → output LPs → shipped to which customers)
       // Traverse backward (sourced from which suppliers → POs → GRNs)

       return {
         affected_lps: [...],
         affected_wos: [...],
         affected_customers: [...],
         affected_suppliers: [...],
         graph_visualization: {...}, // D3.js compatible format
       };
     }
   }
   ```

3. **Recall Simulation UI (Week 51-52)**
   - `/quality/recall-simulation` page
   - Input: TLC or LP or batch
   - Output: Graph visualization (D3.js force-directed graph)
   - Export: PDF report (affected products, customers, suppliers)

**Deliverables:**

- Recall simulation algorithm (< 30 seconds)
- Graph visualization UI

**Effort:** 4 weeks (1 developer)

**Success Criteria:**

- ✅ Recall simulation completes in < 30 seconds
- ✅ Graph shows full forward/backward traceability

---

### 4.2 AI Yield Prediction Model

**Goal:** Predict yield for upcoming WOs based on historical data

**Requirements:**

- Input: Product, line, operator, time of day, raw material batch
- Output: Predicted yield (e.g., 92.5%)
- Model: Regression (XGBoost, Random Forest, or simple linear regression)

**Implementation Steps:**

1. **Data Preparation (Week 53)**
   - Export historical WO data (product, line, operator, yield)
   - Feature engineering (time of day, day of week, operator experience, raw material supplier)

2. **Model Training (Week 54)**
   - Use Python (scikit-learn or XGBoost)
   - Train regression model (yield as target variable)
   - Evaluate model (R² score, MAE)

3. **Model Deployment (Week 55)**
   - Deploy model as REST API (FastAPI or Flask)
   - MonoPilot calls API to get prediction

4. **UI Integration (Week 56)**
   - Add "Predicted Yield" field on WO create page
   - Show confidence interval (e.g., 92.5% ± 2%)

**Deliverables:**

- Yield prediction model (deployed as API)
- UI integration (show prediction on WO create)

**Effort:** 4 weeks (1 ML engineer)

**Success Criteria:**

- ✅ Model R² score > 0.7 (explains 70% of variance)
- ✅ Prediction shown on WO create page

---

### 4.3 Predictive Maintenance (Equipment Failure Prediction)

**Goal:** Predict equipment failures before they happen (reduce downtime)

**Requirements:**

- Input: Equipment sensor data (vibration, temperature, cycle times)
- Output: Probability of failure in next 7 days
- Model: Time-series anomaly detection (LSTM or Isolation Forest)

**Implementation Steps:**

1. **Data Collection (Weeks 57-58)**
   - Ensure IoT gateway collects equipment sensor data (vibration, temperature)
   - Store in `equipment_data` table

2. **Model Training (Week 59)**
   - Use LSTM (time-series) or Isolation Forest (anomaly detection)
   - Train on historical failure data (if available)

3. **Model Deployment (Week 60)**
   - Deploy as API
   - MonoPilot calls API hourly to get failure predictions

4. **UI Integration (Week 61)**
   - Add "Equipment Health" widget on equipment dashboard
   - Show: Healthy / Warning / Critical
   - Alert: "Machine XYZ has 80% probability of failure in next 7 days"

**Deliverables:**

- Predictive maintenance model
- Equipment health dashboard

**Effort:** 5 weeks (1 ML engineer + 1 developer)

**Success Criteria:**

- ✅ Model predicts failure 7 days in advance (70% accuracy)
- ✅ Alerts sent for high-risk equipment

---

### 4.4 BOM Costing & Cost Rollup

**Goal:** Calculate BOM cost (material + labor + overhead)

**Requirements:**

- Material cost (from supplier pricing)
- Labor cost (routing operation time × hourly rate)
- Overhead allocation (% of labor cost or machine hour rate)

**Implementation Steps:**

1. **Database Schema (Week 62)**

   ```sql
   ALTER TABLE products ADD COLUMN standard_cost NUMERIC(18,4);
   ALTER TABLE products ADD COLUMN last_cost NUMERIC(18,4);

   ALTER TABLE bom_items ADD COLUMN unit_cost NUMERIC(18,4); -- Cost of this material
   ALTER TABLE bom_items ADD COLUMN total_cost NUMERIC(18,4); -- quantity × unit_cost

   ALTER TABLE routing_operations ADD COLUMN labor_cost NUMERIC(18,4);
   ALTER TABLE routing_operations ADD COLUMN overhead_cost NUMERIC(18,4);

   CREATE TABLE cost_rollups (
     id UUID PRIMARY KEY,
     product_id UUID REFERENCES products(id),
     bom_id UUID REFERENCES boms(id),
     total_material_cost NUMERIC(18,4),
     total_labor_cost NUMERIC(18,4),
     total_overhead_cost NUMERIC(18,4),
     total_cost NUMERIC(18,4),
     calculated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Cost Rollup Algorithm (Week 63)**

   ```typescript
   // lib/services/CostRollup.ts
   class CostRollup {
     static async calculate(bomId: string): Promise<CostRollupResult> {
       // Get BOM items (materials)
       // Calculate material cost (qty × unit cost)

       // Get routing operations
       // Calculate labor cost (time × hourly rate)
       // Calculate overhead (% of labor or machine hour rate)

       const totalCost = materialCost + laborCost + overheadCost;

       // Save to cost_rollups table
       return { totalCost, materialCost, laborCost, overheadCost };
     }
   }
   ```

3. **UI Integration (Week 64)**
   - Add "Calculate Cost" button on BOM details page
   - Show cost breakdown (material, labor, overhead)
   - Compare standard cost vs. actual cost (from WO actuals)

**Deliverables:**

- BOM cost rollup calculator
- Cost variance reporting

**Effort:** 3 weeks (1 developer)

**Success Criteria:**

- ✅ BOM cost calculated (material + labor + overhead)
- ✅ Cost variance report (standard vs. actual)

---

### 4.5 MonoPilot Marketplace

**Goal:** Create ecosystem of integrations, templates, and extensions

**Requirements:**

- Marketplace UI (browse integrations, templates)
- Integration types: ERP connectors, label printers, IoT gateways, reporting templates
- Template types: BOM templates (industry-specific), workflow templates
- One-click install (for SaaS customers)

**Implementation Steps:**

1. **Marketplace Database (Week 65)**

   ```sql
   CREATE TABLE marketplace_items (
     id UUID PRIMARY KEY,
     item_type VARCHAR(50), -- 'integration', 'template', 'extension'
     name VARCHAR(200),
     description TEXT,
     category VARCHAR(50), -- 'erp', 'iot', 'reporting', 'bom_templates'
     author VARCHAR(100), -- 'MonoPilot' or '3rd-party developer'
     price NUMERIC(18,2), -- 0 for free
     icon_url TEXT,
     install_url TEXT, -- For one-click install
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Marketplace UI (Weeks 66-68)**
   - `/marketplace` page
   - Browse by category (ERP, IoT, Reporting, Templates)
   - Search
   - Item details page (description, screenshots, pricing, reviews)

3. **One-Click Install (Week 68)**
   - For integrations: OAuth flow, save credentials
   - For templates: Copy template files to org's workspace

4. **Launch with 10+ Items (Week 69-72)**
   - **Integrations:**
     1. QuickBooks connector (already built in Phase 3)
     2. Zebra label printer integration
     3. AWS IoT Core connector
     4. Slack notifications integration
   - **BOM Templates:** 5. Meat processing BOM template 6. Dairy BOM template 7. Bakery BOM template
   - **Reporting Templates:** 8. FDA-compliant traceability report 9. Yield variance report 10. OEE report

**Deliverables:**

- Marketplace UI
- 10+ integrations/templates available

**Effort:** 8 weeks (1 developer + partnerships team)

**Success Criteria:**

- ✅ Marketplace live with 10+ items
- ✅ One-click install works
- ✅ 3+ customer installs in first month

---

### 4.6 Carbon Footprint Tracking (ESG Compliance)

**Goal:** Track carbon footprint of products for ESG reporting

**Requirements:**

- Carbon intensity per material (kg CO2e per kg)
- Energy consumption per operation (kWh × grid carbon intensity)
- Calculate total carbon footprint per product

**Implementation Steps:**

1. **Database Schema (Week 70)**

   ```sql
   ALTER TABLE products ADD COLUMN carbon_intensity NUMERIC(18,6); -- kg CO2e per unit
   ALTER TABLE routing_operations ADD COLUMN energy_kwh NUMERIC(18,4);

   CREATE TABLE carbon_footprints (
     id UUID PRIMARY KEY,
     product_id UUID REFERENCES products(id),
     wo_id UUID REFERENCES work_orders(id),
     material_carbon NUMERIC(18,6),
     energy_carbon NUMERIC(18,6),
     total_carbon NUMERIC(18,6),
     calculated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Carbon Calculation (Week 71)**
   - Material carbon: BOM items × carbon intensity
   - Energy carbon: Routing operations × kWh × grid carbon intensity (regional)

3. **UI Integration (Week 72)**
   - Show carbon footprint on WO details page
   - Carbon footprint report (by product, by date)

**Deliverables:**

- Carbon footprint calculator
- ESG report template

**Effort:** 3 weeks (1 developer)

**Success Criteria:**

- ✅ Carbon footprint calculated per WO
- ✅ ESG report exportable

---

## Phase 4 Summary

**Total Duration:** 24 weeks (6 months, weeks 49-72)

**Deliverables:**

1. ✅ AI recall simulation (< 30 seconds)
2. ✅ AI yield prediction model
3. ✅ Predictive maintenance (equipment failure prediction)
4. ✅ BOM costing & cost rollup
5. ✅ MonoPilot Marketplace (10+ items)
6. ✅ Carbon footprint tracking (ESG)

**Team Effort:**

- 1 Full-Stack Developer × 18 weeks = **18 person-weeks**
- 1 ML Engineer × 10 weeks = **10 person-weeks**
- 0.5 QA Engineer × 6 weeks = **3 person-weeks**
- 0.5 Partnerships (Marketplace) × 8 weeks = **4 person-weeks**
- **Total: 35 person-weeks (8.75 person-months)**

**Success Metrics:**

- AI/ML features: 0% → 80%
- Marketplace: Launch with 10+ items
- ESG compliance: 0% → 70%

---

## Phase 3-4 Combined Summary

**Total Duration:** 48 weeks (12 months)

**Total Team Effort:**

- Full-Stack Developers: **38 person-weeks**
- ML Engineer: **10 person-weeks**
- IoT Specialist: **6 person-weeks**
- QA Engineer: **6 person-weeks**
- Partnerships: **4 person-weeks**
- **Total: 64 person-weeks (16 person-months)**

**Budget Estimate (Rough):**

- Full-Stack Developer: $80-120/hour × 1,520 hours = **$122,000 - $182,000**
- ML Engineer: $100-150/hour × 400 hours = **$40,000 - $60,000**
- IoT Specialist: $90-130/hour × 240 hours = **$22,000 - $31,000**
- QA Engineer: $60-80/hour × 240 hours = **$14,000 - $19,000**
- Partnerships: $80-120/hour × 160 hours = **$13,000 - $19,000**
- **Total: $211,000 - $311,000**

**Key Milestones:**

- **Month 7:** IoT gateway PoC complete
- **Month 9:** Equipment data dashboard live
- **Month 10:** ERP connector (QuickBooks) complete
- **Month 12:** Phase 3 complete (IoT & Integration)
- **Month 15:** AI yield prediction live
- **Month 17:** MonoPilot Marketplace launch
- **Month 18:** Phase 4 complete (Advanced Features)

**Success Criteria (Phase 3-4 Complete):**

- ✅ ISA-95 compliance (85%)
- ✅ IoT connectivity (OPC UA + MQTT)
- ✅ ERP integrations (QuickBooks + 1 more)
- ✅ Advanced reporting & BI
- ✅ AI/ML features (yield prediction, recall simulation, predictive maintenance)
- ✅ MonoPilot Marketplace live (10+ items)
- ✅ Carbon footprint tracking (ESG compliance)

---

## Long-Term Vision (18+ Months)

**Future Enhancements (Beyond Phase 4):**

1. **Blockchain Traceability** (if customer demand)
   - Immutable traceability records on blockchain
   - QR code verification for end consumers

2. **Computer Vision QA** (automated quality inspection)
   - Camera integration
   - Defect detection via AI

3. **Open-Source Core Modules** (community edition)
   - Release core MES modules as open-source
   - Build community, drive adoption

4. **Global Deployment** (multi-region, multi-language)
   - Localization (Spanish, German, Polish, Mandarin)
   - Regional compliance modules (FDA for US, EFSA for EU, CFDA for China)

5. **AGV/AMR Integration** (automated warehouse)
   - Integrate with autonomous mobile robots
   - Task assignment to robots

---

## References

**Related Reports:**

- Domain & Industry Research (bmm-research-domain-industry-2025-11-13.md)
- Technical Research & Stack Validation (bmm-research-technical-stack-2025-11-13.md)
- Current Features & Gap Analysis (bmm-research-feature-gaps-2025-11-13.md)
- Roadmap Phase 1-2 (bmm-roadmap-phase1-2-2025-11-13.md)
- Unique Differentiators & Strategy (bmm-strategy-differentiators-2025-11-13.md)

---

## Document Information

**Workflow:** BMad Method - Business Analyst Research
**Roadmap Type:** Long-Term Implementation (Phase 3-4)
**Generated:** 2025-11-13
**Next Review:** 2025-04-13 (Quarterly)

---

_This roadmap was generated using the BMad Method Research Workflow, outlining advanced features and competitive differentiation strategies for MonoPilot MES._
