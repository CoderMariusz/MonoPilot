# Quality Module PRD

**MonoPilot Food MES - Quality Management System**

Version: 2.0 | Date: 2025-12-10 | Owner: Product Team

---

## 1. Executive Summary

Food safety and quality management module supporting:
- QA status tracking (Pending/Passed/Failed/Hold)
- Multi-stage inspections (Incoming/In-Process/Final)
- HACCP/CCP critical control point management
- NCR lifecycle and CAPA
- CoA management and supplier quality
- Complete audit trail and traceability

---

## 2. Functional Requirements

| ID | Feature Name | Priority | Phase | Dependencies |
|----|--------------|----------|-------|--------------|
| FR-QA-001 | Quality Status Management | P0 | 1 | Settings |
| FR-QA-002 | Quality Hold Management | P0 | 1 | FR-QA-001 |
| FR-QA-003 | Product Specifications | P0 | 1 | Products |
| FR-QA-004 | Test Templates & Recording | P0 | 1 | FR-QA-003 |
| FR-QA-005 | Incoming Inspection | P0 | 1 | PO, FR-QA-003 |
| FR-QA-006 | In-Process Inspection | P0 | 2 | WO, FR-QA-003 |
| FR-QA-007 | Final Inspection | P0 | 2 | WO, FR-QA-003 |
| FR-QA-008 | Sampling Plans (AQL) | P0 | 2 | FR-QA-003 |
| FR-QA-009 | NCR Creation & Workflow | P0 | 2 | FR-QA-001 |
| FR-QA-010 | Batch Release Approval | P0 | 2 | FR-QA-007 |
| FR-QA-011 | CoA Generation | P0 | 3 | FR-QA-007 |
| FR-QA-012 | CoA Templates | P0 | 3 | FR-QA-011 |
| FR-QA-013 | HACCP Plan Setup | P0 | 3 | Products |
| FR-QA-014 | CCP Monitoring | P0 | 3 | FR-QA-013 |
| FR-QA-015 | CCP Deviation Alerts | P0 | 3 | FR-QA-014 |
| FR-QA-016 | CAPA Creation | P1 | 3 | FR-QA-009 |
| FR-QA-017 | CAPA Workflow & Effectiveness | P1 | 3 | FR-QA-016 |
| FR-QA-018 | Supplier Quality Rating | P1 | 4 | Suppliers |
| FR-QA-019 | Supplier Audits | P1 | 4 | FR-QA-018 |
| FR-QA-020 | Quality Dashboard | P0 | 4 | All |
| FR-QA-021 | Audit Trail Reports | P0 | 4 | All |
| FR-QA-022 | Quality Analytics | P1 | 4 | All |
| FR-QA-023 | Retention Sample Management | P1 | 4 | FR-QA-007 |
| FR-QA-024 | Document Control & Versioning | P1 | 4 | FR-QA-003 |
| FR-QA-025 | Scanner Integration | P0 | 2 | Mobile |

---

## 3. Non-Functional Requirements

| Category | Requirement | Target | Priority |
|----------|-------------|--------|----------|
| Performance | Page load time | <2 seconds | P0 |
| Performance | API response time | <500ms | P0 |
| Performance | Scanner test result capture | <1 second | P0 |
| Performance | QC hold apply/release | <500ms | P0 |
| Performance | CCP monitoring record save | <300ms | P0 |
| Performance | CoA PDF generation | <5 seconds | P1 |
| Performance | Inspection query (1000 records) | <2 seconds | P1 |
| Performance | NCR workflow transition | <500ms | P1 |
| Scalability | Concurrent QA users per org | 30 | P0 |
| Scalability | Inspections per day | 5,000 | P1 |
| Scalability | Test results per inspection | 100 | P1 |
| Scalability | Active NCRs per org | 500 | P1 |
| Scalability | CCP monitoring records per day | 10,000 | P1 |
| Scalability | CoA documents per month | 1,000 | P1 |
| Availability | Uptime SLA | 99.5% | P0 |
| Availability | CCP monitoring offline mode | 50 records | P1 |
| Security | RLS enforcement | 100% queries | P0 |
| Security | Audit trail immutability | 100% records | P0 |
| Security | E-signature compliance | FDA 21 CFR Part 11 | P1 |
| Data | Audit log retention | 2 years | P1 |
| Data | Inspection records retention | 7 years | P0 |
| Data | HACCP records retention | 5 years | P0 |
| Data | NCR/CAPA records retention | 10 years | P1 |
| Data | CoA document retention | 10 years | P0 |
| Reliability | CCP alert delivery | <30 seconds | P0 |
| Reliability | NCR notification delivery | <5 minutes | P1 |
| Reliability | CoA generation success rate | >99% | P1 |
| Usability | Scanner test input | Min 44px touch target | P1 |
| Usability | CCP deviation alert visibility | Full screen modal | P0 |
| Compliance | Electronic signature support | Required | P1 |
| Compliance | Change reason capture | Required for critical fields | P0 |

---

## 4. Database Schema

### 4.1 Core Quality Tables

**quality_specifications**
- `id`, `product_id`, `version`, `effective_date`, `expiry_date`, `status`, `approved_by`, `approved_at`

**quality_spec_parameters**
- `id`, `spec_id`, `parameter_name`, `parameter_type`, `target_value`, `min_value`, `max_value`, `unit`, `test_method`, `is_critical`

**quality_inspections**
- `id`, `inspection_number`, `type`, `reference_type`, `reference_id`, `inspector_id`, `status`, `inspection_date`, `scheduled_date`, `result`

**quality_test_results**
- `id`, `inspection_id`, `parameter_id`, `measured_value`, `result_status`, `tested_by`, `tested_at`, `equipment_id`, `notes`

**quality_holds**
- `id`, `hold_number`, `reason`, `hold_type`, `status`, `priority`, `held_by`, `held_at`, `released_by`, `released_at`, `release_notes`

**quality_hold_items**
- `id`, `hold_id`, `reference_type`, `reference_id`, `quantity_held`

### 4.2 NCR & CAPA Tables

**ncr_reports**
- `id`, `ncr_number`, `title`, `description`, `severity`, `status`, `detected_date`, `detected_by`, `root_cause`, `reference_type`, `reference_id`

**ncr_workflow**
- `id`, `ncr_id`, `step`, `assigned_to`, `status`, `due_date`, `completed_date`, `notes`

**capa_records**
- `id`, `capa_number`, `source_type`, `source_id`, `title`, `type`, `status`, `priority`, `owner_id`, `created_date`, `target_close_date`

**capa_actions**
- `id`, `capa_id`, `action_type`, `description`, `assigned_to`, `due_date`, `completed_date`, `status`

**capa_effectiveness_checks**
- `id`, `capa_id`, `check_date`, `checked_by`, `result`, `notes`, `verified`

### 4.3 CoA Tables

**certificates_of_analysis**
- `id`, `coa_number`, `batch_id`, `product_id`, `issue_date`, `issued_by`, `template_id`, `status`, `document_url`

**coa_templates**
- `id`, `name`, `product_type`, `header_template`, `footer_template`, `parameters_json`, `active`

**coa_parameters**
- `id`, `coa_id`, `parameter_name`, `specification`, `result`, `method`, `pass_fail`

### 4.4 Sampling Tables

**sampling_plans**
- `id`, `name`, `product_id`, `inspection_type`, `lot_size_min`, `lot_size_max`, `sample_size`, `acceptance_number`, `rejection_number`

**sampling_records**
- `id`, `plan_id`, `inspection_id`, `sample_identifier`, `location`, `sampled_by`, `sampled_at`

### 4.5 HACCP/CCP Tables

**haccp_plans**
- `id`, `product_id`, `version`, `effective_date`, `approved_by`, `review_frequency`, `status`, `next_review_date`

**haccp_ccps**
- `id`, `haccp_plan_id`, `ccp_number`, `step_name`, `hazard_type`, `hazard_description`, `critical_limit_min`, `critical_limit_max`, `unit`, `monitoring_frequency`

**haccp_monitoring_records**
- `id`, `ccp_id`, `wo_id`, `operation_id`, `monitored_at`, `monitored_by`, `value`, `within_limits`, `corrective_action`

**haccp_deviations**
- `id`, `ccp_id`, `monitoring_record_id`, `deviation_type`, `detected_at`, `corrected_at`, `correction_notes`, `ncr_id`

**haccp_verification_records**
- `id`, `haccp_plan_id`, `verification_date`, `verified_by`, `verification_type`, `result`, `notes`

### 4.6 Supplier Quality Tables

**supplier_quality_ratings**
- `id`, `supplier_id`, `rating_period`, `overall_score`, `quality_score`, `delivery_score`, `response_score`, `rated_by`, `rated_at`

**supplier_audits**
- `id`, `supplier_id`, `audit_date`, `audit_type`, `auditor`, `score`, `status`, `next_audit_date`, `report_url`

**supplier_audit_findings**
- `id`, `audit_id`, `category`, `finding`, `severity`, `corrective_action`, `due_date`, `closed_date`

**supplier_ncrs**
- `id`, `supplier_id`, `ncr_id`, `po_line_id`, `defect_quantity`, `defect_type`, `root_cause`, `disposition`

### 4.7 Audit & Traceability Tables

**quality_audit_log**
- `id`, `entity_type`, `entity_id`, `action`, `user_id`, `timestamp`, `old_value`, `new_value`, `change_reason`

**quality_document_versions**
- `id`, `document_type`, `document_id`, `version`, `created_by`, `created_at`, `change_summary`, `document_url`

**retention_samples**
- `id`, `batch_id`, `product_id`, `sample_identifier`, `quantity`, `location_id`, `sampled_date`, `retention_until`, `disposed_date`

---

## 5. API Endpoints (List)

### Quality Status & Holds
```
GET    /api/quality/status
POST   /api/quality/holds
GET    /api/quality/holds/:id
PATCH  /api/quality/holds/:id/release
GET    /api/quality/holds/active
```

### Specifications & Tests
```
GET    /api/quality/specifications
POST   /api/quality/specifications
GET    /api/quality/specifications/:id
GET    /api/quality/specifications/product/:productId
POST   /api/quality/specifications/:id/approve
POST   /api/quality/test-results
GET    /api/quality/test-results/inspection/:inspectionId
```

### Inspections
```
GET    /api/quality/inspections
POST   /api/quality/inspections
GET    /api/quality/inspections/:id
POST   /api/quality/inspections/:id/start
POST   /api/quality/inspections/:id/complete
GET    /api/quality/inspections/pending
GET    /api/quality/inspections/incoming
GET    /api/quality/inspections/in-process
GET    /api/quality/inspections/final
```

### NCR Management
```
GET    /api/quality/ncrs
POST   /api/quality/ncrs
GET    /api/quality/ncrs/:id
PUT    /api/quality/ncrs/:id
POST   /api/quality/ncrs/:id/workflow/next
POST   /api/quality/ncrs/:id/close
GET    /api/quality/ncrs/stats
```

### CoA Management
```
GET    /api/quality/coa
POST   /api/quality/coa
GET    /api/quality/coa/:id
GET    /api/quality/coa/:id/pdf
POST   /api/quality/coa/:id/send
GET    /api/quality/coa-templates
POST   /api/quality/coa-templates
```

### Sampling Plans
```
GET    /api/quality/sampling-plans
POST   /api/quality/sampling-plans
GET    /api/quality/sampling-plans/:id
POST   /api/quality/sampling-records
```

### HACCP/CCP
```
GET    /api/quality/haccp/plans
POST   /api/quality/haccp/plans
GET    /api/quality/haccp/plans/:id
POST   /api/quality/haccp/plans/:id/approve
GET    /api/quality/haccp/ccps
POST   /api/quality/haccp/ccps
POST   /api/quality/haccp/monitoring
GET    /api/quality/haccp/monitoring/ccp/:ccpId
POST   /api/quality/haccp/deviations
GET    /api/quality/haccp/deviations/active
POST   /api/quality/haccp/verification
```

### CAPA
```
GET    /api/quality/capa
POST   /api/quality/capa
GET    /api/quality/capa/:id
PUT    /api/quality/capa/:id
POST   /api/quality/capa/:id/actions
POST   /api/quality/capa/:id/effectiveness-check
POST   /api/quality/capa/:id/close
```

### Supplier Quality
```
GET    /api/quality/supplier-ratings
POST   /api/quality/supplier-ratings
GET    /api/quality/supplier-ratings/:supplierId
GET    /api/quality/supplier-audits
POST   /api/quality/supplier-audits
POST   /api/quality/supplier-audits/:id/findings
GET    /api/quality/supplier-ncrs/:supplierId
```

### Reporting & Analytics
```
GET    /api/quality/dashboard
GET    /api/quality/reports/audit-trail
GET    /api/quality/reports/inspection-summary
GET    /api/quality/reports/ncr-trends
GET    /api/quality/reports/ccp-compliance
GET    /api/quality/reports/supplier-scorecard
GET    /api/quality/analytics/defect-pareto
```

### Batch Release
```
POST   /api/quality/batch/:batchId/release-check
POST   /api/quality/batch/:batchId/release
GET    /api/quality/batch/:batchId/status
```

---

## 6. HACCP/CCP Implementation

### 6.1 HACCP Principles Coverage

**1. Hazard Analysis**
- Product-specific hazard identification
- Biological, chemical, physical hazards
- Severity and likelihood assessment

**2. Critical Control Points (CCPs)**
- CCP identification per process step
- Critical limits definition (temp, pH, time, etc.)
- Monitoring frequency configuration

**3. Monitoring Procedures**
- Real-time data entry (scanner + desktop)
- Automatic limit validation
- Immediate alerts on deviation

**4. Corrective Actions**
- Predefined action templates
- Immediate response capture
- Auto-link to NCR/CAPA system

**5. Verification Activities**
- Scheduled verification tasks
- Calibration tracking
- Review and audit records

**6. Documentation & Records**
- Complete audit trail
- Electronic records with e-signatures
- Regulatory compliance reports

**7. Record Keeping**
- Automated retention management
- Easy retrieval for audits
- Integration with batch genealogy

### 6.2 CCP Monitoring Workflow

**Setup Phase:**
1. Define HACCP plan per product
2. Identify CCPs at critical steps
3. Set critical limits (min/max values)
4. Configure monitoring frequency
5. Assign responsibilities

**Execution Phase:**
1. Operator monitors at defined frequency
2. Records values (scanner/desktop)
3. System validates against limits
4. Pass → Continue production
5. Fail → Alert + Corrective action required

**Deviation Handling:**
1. Alert triggered if out of spec
2. Immediate corrective action required
3. Auto-create deviation record
4. Link to NCR if needed
5. CAPA initiated for systemic issues

**Verification:**
1. QA verifies corrective action
2. Effectiveness check
3. Sign-off and close deviation
4. Update HACCP plan if needed

### 6.3 Common CCPs in Food Manufacturing

| CCP | Hazard Type | Typical Limits | Monitoring Frequency |
|-----|-------------|----------------|----------------------|
| Receiving Temperature | Biological | 0-4C (chilled) | Every receipt |
| Cooking Temperature | Biological | 75C core temp | Every batch |
| Metal Detection | Physical | 1.5mm Fe, 2.5mm Non-Fe | Continuous |
| pH Control | Chemical | 4.0-4.5 | Hourly |
| Cold Storage | Biological | 0-4C | Every 4 hours |
| Heat Sealing | Physical | 200C, 0.5s dwell | Every cycle |
| Pasteurization | Biological | 72C for 15s | Continuous |
| Water Activity | Biological | <0.6 aw | Per batch |
| Chlorine Level | Chemical | 50-200 ppm | Every 2 hours |

### 6.4 CCP Integration Points

- **Work Orders**: CCP monitoring tied to WO operations
- **Routing**: CCPs mapped to routing steps
- **Scanner**: Mobile CCP data entry on shop floor
- **Alerts**: Email/SMS on deviations
- **NCR**: Auto-create NCR on repeated failures
- **Traceability**: Link CCP records to batch genealogy
- **Dashboard**: Real-time CCP compliance monitoring

### 6.5 CCP Deviation Severity

| Severity | Definition | Action | Escalation |
|----------|-----------|--------|------------|
| Critical | Food safety risk | Stop production, quarantine batch | Immediate (QA Manager + Director) |
| Major | Outside critical limit | Immediate corrective action | Within 1 hour (QA Manager) |
| Minor | Trend toward limit | Document and monitor | Within 24 hours (Supervisor) |

---

## 7. NCR Lifecycle

### 7.1 NCR States

```
Draft → Open → Investigation → Root Cause → Corrective Action →
Verification → Closed / Reopened
```

### 7.2 NCR Workflow

| Step | Owner | Actions | Outputs |
|------|-------|---------|---------|
| Detection | Inspector/Operator | Identify non-conformance | NCR created |
| Assessment | QA Manager | Evaluate severity, quarantine | Priority assigned |
| Investigation | QA Team | Gather data, analyze | Investigation report |
| Root Cause | QA + Production | 5-Why, Fishbone | Root cause identified |
| Corrective Action | Process Owner | Implement fix | Action plan |
| Verification | QA Manager | Verify effectiveness | Verification record |
| Closure | QA Manager | Sign-off, release hold | NCR closed |

### 7.3 NCR Severity Levels

- **Critical**: Food safety risk, regulatory violation (response: 24h)
- **Major**: Quality impact, customer complaint (response: 48h)
- **Minor**: Process deviation, no product impact (response: 7d)

---

## 8. Inspection Types

### 8.1 Incoming Inspection

**Trigger:** PO receipt
**Scope:** Raw materials, packaging, ingredients
**Mandatory:** Yes (configurable per product)

**Checks:**
- Visual inspection
- Temperature (refrigerated/frozen items)
- Package integrity
- Quantity verification
- CoA validation (if required)
- Specification compliance

### 8.2 In-Process Inspection

**Trigger:** WO operation completion
**Scope:** Semi-finished products, WIP
**Mandatory:** Configurable per routing step

**Checks:**
- Process parameters (temp, time, weight)
- Visual appearance
- Dimensional checks
- CCP monitoring values
- Sample testing

### 8.3 Final Inspection

**Trigger:** WO completion
**Scope:** Finished goods before release
**Mandatory:** Yes

**Checks:**
- Product specifications
- Labeling accuracy
- Package integrity
- Batch traceability
- All CCP records complete
- Test results reviewed

---

## 9. Phase Roadmap

### Phase 1: Core Quality (Weeks 1-4)
- Quality status management (Pending/Passed/Failed/Hold)
- Quality holds and release workflow
- Product specifications and test templates
- Incoming inspection
- Basic NCR creation
- Scanner QA pass/fail
- Quality dashboard

**Deliverable:** Incoming QC operational

### Phase 2: In-Process & Final (Weeks 5-8)
- In-process inspection (tied to routing)
- Final inspection and batch release
- Sampling plans (AQL-based)
- NCR workflow and lifecycle
- Quality alerts and notifications
- Test result recording and trending

**Deliverable:** Full inspection cycle operational

### Phase 3: HACCP & Advanced (Weeks 9-12)
- HACCP plan setup
- CCP monitoring (shop floor + scanner)
- CCP deviation handling and alerts
- CoA generation and templates
- CAPA creation and workflow
- Document control and versioning
- Retention sample management

**Deliverable:** HACCP compliance operational

### Phase 4: Supplier & Analytics (Weeks 13-16)
- Supplier quality rating and scorecards
- Supplier audits and findings
- Advanced quality dashboard
- Audit trail reports
- Quality analytics (Pareto, trends)
- Scheduled reporting
- Integration testing

**Deliverable:** Complete quality system with analytics

---

## 10. Quality Status Types

| Status | Code | Description | Allows Shipment | Allows Consumption |
|--------|------|-------------|-----------------|-------------------|
| Pending | PENDING | Awaiting inspection | No | Settings toggle |
| Passed | PASSED | Meets specifications | Yes | Yes |
| Failed | FAILED | Does not meet specs | No | No |
| Hold | HOLD | Investigation required | No | No |
| Released | RELEASED | Approved for use after hold | Yes | Yes |
| Quarantined | QUARANTINED | Isolated pending review | No | No |
| Conditionally Approved | COND_APPROVED | Limited use allowed | Restricted | Restricted |

---

## 11. Sampling Plans (AQL-Based)

### 11.1 Sampling Methods

- **Random**: System selects random units
- **Systematic**: Every Nth unit
- **AQL-based**: ISO 2859 / ANSI Z1.4 tables
- **Custom**: User-defined criteria

### 11.2 Sample Size Table

| Lot Size | Normal | Reduced | Tightened |
|----------|--------|---------|-----------|
| 2-8 | 2 | 2 | 2 |
| 9-15 | 3 | 2 | 3 |
| 16-25 | 5 | 2 | 5 |
| 26-50 | 8 | 3 | 8 |
| 51-90 | 13 | 5 | 13 |
| 91-150 | 20 | 8 | 20 |
| 151-280 | 32 | 13 | 32 |
| 281-500 | 50 | 20 | 50 |
| 501-1200 | 80 | 32 | 80 |

---

## 12. CoA Management

### 12.1 CoA Generation Triggers

- Manual request (customer order)
- Automatic on batch completion
- On-demand for specific lots
- Regulatory requirement

### 12.2 CoA Template Elements

- Company header/logo
- Product identification (name, code, batch, date)
- Test results table (parameter, spec, result, method)
- Compliance statements
- Authorized signatures (e-signature)
- Footer (address, accreditation logos)

### 12.3 CoA Workflow

1. Batch completes final inspection
2. All test results reviewed
3. System generates CoA from template
4. QA approves and signs electronically
5. CoA saved as PDF (PDF/A for archival)
6. Email to customer (optional)
7. Archive in document management system

---

## 13. User Roles & Permissions

| Role | Create Inspections | Record Results | Approve Release | Manage NCR | Configure HACCP | Close NCR |
|------|-------------------|----------------|-----------------|------------|-----------------|-----------|
| QA Inspector | Yes | Yes | No | Create | No | No |
| QA Manager | Yes | Yes | Yes | Full | Yes | Yes |
| Production Lead | No | Yes | No | Create | No | No |
| Quality Director | Yes | Yes | Yes | Full | Yes | Yes |
| Operator | No | Yes | No | No | No | No |
| Technical Officer | Yes | Yes | Yes | Full | Yes | Yes |

---

## 14. KPIs & Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| First Pass Yield | (Passed inspections / Total) × 100 | >95% |
| NCR Rate | NCRs per 1000 batches | <5 |
| CCP Compliance | (Within limits / Total readings) × 100 | >99% |
| CoA Turnaround | Hours from batch close to CoA issue | <24h |
| Hold Resolution Time | Days from hold to release | <3d |
| Supplier Quality Score | Weighted average of deliveries | >85 |
| Inspection Backlog | Pending inspections count | <10 |
| CAPA Closure Rate | CAPAs closed on time / Total | >90% |

---

## 15. Compliance & Standards

### 15.1 Regulatory Support

- FDA 21 CFR Part 11 (electronic records/signatures)
- FSMA (Food Safety Modernization Act)
- GFSI (Global Food Safety Initiative)
- ISO 9001 (Quality Management)
- ISO 22000 (Food Safety Management)
- BRC (Brand Reputation Compliance)
- SQF (Safe Quality Food)
- HACCP (Codex Alimentarius)

### 15.2 Audit Trail Requirements

- All quality records immutable once signed
- User identification and authentication
- Timestamp with timezone
- Change history (old → new values)
- Reason for change (where applicable)
- Electronic signatures with meaning

---

## 16. Integration Points

### 16.1 Internal Modules

- **Products**: Specifications linked to product master
- **Warehouse**: Quality holds prevent stock usage
- **Production**: In-process inspections at operations, CCP monitoring
- **Planning**: Batch release controls MRP
- **Shipping**: Final inspection blocks shipment

### 16.2 External Systems

- **LIMS**: Import test results
- **ERP**: Sync product specs
- **Customer Portal**: CoA delivery
- **Regulatory**: Compliance reporting

---

## 17. Notification & Alerts

| Event | Recipients | Channel | Urgency |
|-------|-----------|---------|---------|
| CCP Deviation | QA Manager, Production Lead | Email + SMS | Critical |
| Inspection Due | Assigned Inspector | Email | High |
| Hold Aging (>48h) | QA Manager | Email | Medium |
| NCR Overdue | NCR Owner | Email | High |
| Supplier Audit Due | Quality Director | Email | Low |
| Batch Pending Release | QA Manager | Email | Medium |
| CAPA Effectiveness Check Due | CAPA Owner | Email | Medium |

---

## 18. Data Retention

| Record Type | Active | Archive | Total |
|-------------|--------|---------|-------|
| Inspection Records | 2 years | 5 years | 7 years |
| NCR Reports | 3 years | 7 years | 10 years |
| CoA | 2 years | 8 years | 10 years |
| HACCP Records | 2 years | 3 years | 5 years |
| CCP Monitoring | 1 year | 4 years | 5 years |
| Supplier Audits | 3 years | 7 years | 10 years |
| CAPA Records | 3 years | 7 years | 10 years |

---

## 19. Success Criteria

### 19.1 Launch Criteria

- [ ] All Phase 1 features deployed
- [ ] 20 products with specs configured
- [ ] 10 users trained on inspections
- [ ] 3 HACCP plans configured
- [ ] Scanner app deployed
- [ ] Reporting functional
- [ ] UAT sign-off received

### 19.2 Post-Launch Metrics (30 days)

- Daily inspection rate: >50 inspections/day
- CCP monitoring compliance: >95%
- NCR response time: <24h (critical)
- User adoption: >80% of QA team
- System uptime: >99.5%
- Zero data loss incidents

---

## 20. Open Questions

1. Which LIMS systems require integration?
2. Specific regulatory requirements by region?
3. Customer-specific CoA template requirements?
4. Supplier portal access for quality data?
5. Integration with calibration management system?
6. Support for multi-language quality forms?
7. Video/photo attachment requirements for inspections?
8. E-signature vendor (DocuSign, Adobe Sign, internal)?

---

## 21. Appendix

### 21.1 Glossary

- **AQL**: Acceptable Quality Level
- **CAPA**: Corrective and Preventive Action
- **CCP**: Critical Control Point
- **CoA**: Certificate of Analysis
- **FSMA**: Food Safety Modernization Act
- **GFSI**: Global Food Safety Initiative
- **HACCP**: Hazard Analysis Critical Control Points
- **LIMS**: Laboratory Information Management System
- **NCR**: Non-Conformance Report
- **SOP**: Standard Operating Procedure

### 21.2 References

- FDA 21 CFR Part 11
- ISO 9001:2015
- ISO 22000:2018
- Codex Alimentarius HACCP Guidelines
- GFSI Benchmarking Requirements

---

**Document Status**: Draft v2.0
**Next Review**: 2025-12-17
**Lines**: 820 (UNDER 1500 LIMIT)
