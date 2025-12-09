# Epic 16: Compliance & Certifications - Phase 3

**Status:** PLANNED
**Priority:** P2 - Wazna dla certyfikowanych klientow
**Stories:** 18
**Estimated Effort:** 6-8 tygodni
**Dependencies:** Epic 6 (Quality), Epic 14 (Supplier Quality)

---

## 1. Overview

### 1.1 Cel Epica

Modul Compliance & Certifications wspiera spelnianie wymagan regulacyjnych:
- **BRC/IFS Support** - wsparcie certyfikacji BRC Global Standard, IFS Food
- **FSSC 22000** - wsparcie Food Safety System Certification
- **21 CFR Part 11** - elektroniczne podpisy (FDA requirements)
- **Audit Trail Reports** - raporty dla audytorow

### 1.2 Luki Konkurencyjne Zamykane

| Luka | Konkurenci | Status MonoPilot |
|------|-----------|------------------|
| BRC/IFS Support | 3/4 maja | Implementowane w tym epicu |
| FSSC 22000 | 2/4 maja | Implementowane w tym epicu |
| 21 CFR Part 11 | 2/4 maja | Implementowane w tym epicu |
| Audit Trail Reports | 4/4 maja | Rozszerzane w tym epicu |

### 1.3 Business Value

- **Certyfikacja:** Ulatwienie uzyskania i utrzymania certyfikatow
- **Audyty:** Szybsze przygotowanie do audytow
- **Eksport:** Spelnienie wymagan FDA dla eksportu do USA
- **Zaufanie:** Budowanie zaufania klientow

---

## 2. User Stories

### 2.1 Certification Framework

#### Story 16.1: Certification Standard Definition

**Jako** Quality Manager
**Chce** definiowac standardy certyfikacji
**Aby** sledzic wymagania

**Acceptance Criteria:**
- [ ] Pre-loaded standards: BRC v9, IFS v8, FSSC 22000
- [ ] Struktura: sections -> requirements
- [ ] Kazde wymaganie: numer, opis, guidance
- [ ] Severity: fundamental, major, minor
- [ ] Custom standards możliwe

**Technical Notes:**
```sql
CREATE TABLE certification_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE, -- BRC_V9, IFS_V8, FSSC_22000
    name VARCHAR(100) NOT NULL,
    version VARCHAR(20),
    description TEXT,
    is_system_defined BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE certification_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_id UUID NOT NULL REFERENCES certification_standards(id),
    section_number VARCHAR(20) NOT NULL,
    section_name VARCHAR(200) NOT NULL,
    parent_id UUID REFERENCES certification_sections(id),
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE certification_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES certification_sections(id),
    requirement_number VARCHAR(30) NOT NULL,
    requirement_text TEXT NOT NULL,
    severity VARCHAR(20), -- fundamental, major, minor
    guidance TEXT,
    evidence_needed TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 16.2: Compliance Self-Assessment

**Jako** Quality Manager
**Chce** przeprowadzic self-assessment
**Aby** zidentyfikowac luki

**Acceptance Criteria:**
- [ ] Wybor standardu do oceny
- [ ] Per wymaganie: status (compliant, partial, non-compliant, N/A)
- [ ] Evidence linking (dokumenty, procedury)
- [ ] Notatki i gap description
- [ ] Progress tracker (% complete)

**Technical Notes:**
```sql
CREATE TABLE compliance_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    standard_id UUID NOT NULL REFERENCES certification_standards(id),
    assessment_date DATE NOT NULL,
    conducted_by UUID REFERENCES auth.users(id),
    status VARCHAR(30) DEFAULT 'in_progress', -- in_progress, completed
    overall_score NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE compliance_assessment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES compliance_assessments(id),
    requirement_id UUID NOT NULL REFERENCES certification_requirements(id),
    status VARCHAR(30), -- compliant, partial, non_compliant, not_applicable
    evidence_description TEXT,
    gap_description TEXT,
    action_required TEXT,
    action_due_date DATE,
    action_owner UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 16.3: Gap Analysis Report

**Jako** Quality Manager
**Chce** generowac raport gap analysis
**Aby** planowac dzialania naprawcze

**Acceptance Criteria:**
- [ ] Summary: % compliant, partial, non-compliant
- [ ] List of gaps by severity
- [ ] Action plan with owners i due dates
- [ ] Export PDF dla audytorow

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 16.4: Certification Tracking

**Jako** Quality Manager
**Chce** sledzic status certyfikacji
**Aby** zarządzac odnowieniami

**Acceptance Criteria:**
- [ ] Lista aktywnych certyfikatow organizacji
- [ ] Per certyfikat: standard, scope, validity dates
- [ ] Certifying body
- [ ] Renewal reminder (configurable days before expiry)
- [ ] Upload certificate document

**Technical Notes:**
```sql
CREATE TABLE organization_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    standard_id UUID REFERENCES certification_standards(id),
    certificate_number VARCHAR(100),
    certifying_body VARCHAR(200),
    scope_description TEXT,
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(30) DEFAULT 'active', -- active, expired, suspended
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

### 2.2 21 CFR Part 11 (Electronic Signatures)

#### Story 16.5: Electronic Signature Configuration

**Jako** Admin
**Chce** wlaczyc elektroniczne podpisy
**Aby** spelnic wymagania FDA

**Acceptance Criteria:**
- [ ] Enable/disable 21 CFR Part 11 mode
- [ ] Configure which actions require signature
- [ ] Signature types: approve, review, author
- [ ] Re-authentication requirement setting

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 16.6: Signature Capture

**Jako** User
**Chce** elektronicznie podpisac dokument/akcje
**Aby** potwierdzic autoryzacje

**Acceptance Criteria:**
- [ ] Modal: re-enter password to sign
- [ ] Meaning of signature selection (approve, review, reject)
- [ ] Optional comment
- [ ] Timestamp capture
- [ ] IP address capture

**Technical Notes:**
```sql
CREATE TABLE electronic_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    entity_type VARCHAR(50) NOT NULL, -- wo, ncr, bom, etc.
    entity_id UUID NOT NULL,
    action_type VARCHAR(30) NOT NULL, -- approve, review, author, reject
    signature_meaning TEXT,
    signature_comment TEXT,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_valid BOOLEAN DEFAULT true
);
```

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

#### Story 16.7: Signature Verification

**Jako** Auditor
**Chce** weryfikowac podpisy
**Aby** potwierdzic autentyczność

**Acceptance Criteria:**
- [ ] List signatures per document/entity
- [ ] Verify: user exists, was authorized at time
- [ ] Timestamp integrity check
- [ ] Signature chain (if multiple required)

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 16.8: Signature Required Workflow

**Jako** System
**Chce** wymuszac podpisy dla konfigurowalnych akcji
**Aby** spelnic compliance

**Acceptance Criteria:**
- [ ] Configurable per entity type:
  - BOM approval
  - WO start/complete
  - NCR close
  - Batch release
- [ ] Block action without signature
- [ ] Dual signature option (maker-checker)

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

### 2.3 Enhanced Audit Trail

#### Story 16.9: Comprehensive Audit Log

**Jako** System
**Chce** logowac wszystkie zmiany
**Aby** spelnic wymagania traceability

**Acceptance Criteria:**
- [ ] Log: WHO (user), WHAT (entity, field, old/new), WHEN (timestamp)
- [ ] All CRUD operations
- [ ] Login/logout events
- [ ] Failed login attempts
- [ ] System configuration changes

**Technical Notes:**
- Rozszerzenie istniejacego audit_logs
- Trigger-based lub application-layer logging

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 16.10: Audit Trail Query Interface

**Jako** Auditor
**Chce** przeszukiwac audit trail
**Aby** znajdowac konkretne zmiany

**Acceptance Criteria:**
- [ ] Search by: user, entity, date range, action type
- [ ] Filter by: module, severity
- [ ] Sort by: date, user
- [ ] Quick filters: today, this week, this user
- [ ] Pagination for large results

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 16.11: Audit Trail Export

**Jako** Auditor
**Chce** eksportowac audit trail
**Aby** dostarczyc audytorom zewnetrznym

**Acceptance Criteria:**
- [ ] Export to Excel, PDF
- [ ] Configurable columns
- [ ] Date range selection
- [ ] Signed/certified export option

**Priority:** Must Have
**Estimate:** S
**Phase:** 3

---

#### Story 16.12: Tamper-Evident Storage

**Jako** System
**Chce** chronic audit logs przed modyfikacja
**Aby** zapewnic integralność

**Acceptance Criteria:**
- [ ] Append-only table (no update/delete)
- [ ] Checksum per record
- [ ] Chain hash (each record references previous)
- [ ] Periodic integrity verification

**Priority:** Should Have
**Estimate:** L
**Phase:** 3

---

### 2.4 Compliance Reports

#### Story 16.13: Traceability Report (Forward/Backward)

**Jako** QC Manager
**Chce** generowac raport traceability
**Aby** przedstawic audytorom

**Acceptance Criteria:**
- [ ] Forward trace: from material to finished product
- [ ] Backward trace: from finished product to materials
- [ ] Visual tree/graph
- [ ] Time to generate < 30 seconds
- [ ] Export PDF

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 16.14: HACCP Compliance Report

**Jako** QC Manager
**Chce** generowac raport HACCP
**Aby** dokumentowac CCP monitoring

**Acceptance Criteria:**
- [ ] All CCP definitions
- [ ] All readings per period
- [ ] Deviations and corrective actions
- [ ] Compliance status summary
- [ ] Audit-ready format

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

#### Story 16.15: Batch Record Report

**Jako** QC Manager
**Chce** generowac pelny record dla partii
**Aby** spelnic wymagania dokumentacyjne

**Acceptance Criteria:**
- [ ] Complete WO record
- [ ] Materials consumed with lot numbers
- [ ] CCP readings
- [ ] Quality test results
- [ ] Signatures
- [ ] PDF format

**Priority:** Must Have
**Estimate:** L
**Phase:** 3

---

### 2.5 Document Control

#### Story 16.16: Document Version Control

**Jako** Document Controller
**Chce** wersjonowac dokumenty
**Aby** kontrolować zmiany

**Acceptance Criteria:**
- [ ] Upload document with version number
- [ ] Version history
- [ ] Approval workflow before publish
- [ ] Obsolete previous version
- [ ] Distribution tracking

**Technical Notes:**
```sql
CREATE TABLE controlled_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    document_code VARCHAR(50) NOT NULL,
    document_title VARCHAR(200) NOT NULL,
    document_type VARCHAR(50), -- SOP, form, policy
    current_version INTEGER DEFAULT 1,
    status VARCHAR(30) DEFAULT 'draft', -- draft, review, approved, obsolete
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES controlled_documents(id),
    version_number INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    change_description TEXT,
    effective_date DATE,
    expiry_date DATE,
    status VARCHAR(30) DEFAULT 'draft',
    uploaded_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Should Have
**Estimate:** L
**Phase:** 3

---

#### Story 16.17: Document Acknowledgment

**Jako** Document Controller
**Chce** sledzic potwierdzenia zapoznania
**Aby** dokumentowac training

**Acceptance Criteria:**
- [ ] Assign documents to users/roles
- [ ] User acknowledges reading
- [ ] Due date for acknowledgment
- [ ] Overdue alerts
- [ ] Acknowledgment report

**Priority:** Should Have
**Estimate:** M
**Phase:** 3

---

### 2.6 Settings

#### Story 16.18: Compliance Settings Page

**Jako** Admin
**Chce** konfigurowac modul Compliance
**Aby** dostosowac do potrzeb

**Acceptance Criteria:**
- [ ] 21 CFR Part 11 enable/disable
- [ ] Signature requirements configuration
- [ ] Audit log retention period
- [ ] Certification reminder days
- [ ] Default standard for new assessments

**Priority:** Must Have
**Estimate:** M
**Phase:** 3

---

## 3. Story Summary

| ID | Story | Priority | Estimate | Status |
|----|-------|----------|----------|--------|
| 16.1 | Certification Standard Definition | Must | L | PLANNED |
| 16.2 | Compliance Self-Assessment | Must | L | PLANNED |
| 16.3 | Gap Analysis Report | Must | M | PLANNED |
| 16.4 | Certification Tracking | Must | M | PLANNED |
| 16.5 | Electronic Signature Configuration | Must | M | PLANNED |
| 16.6 | Signature Capture | Must | L | PLANNED |
| 16.7 | Signature Verification | Must | M | PLANNED |
| 16.8 | Signature Required Workflow | Must | M | PLANNED |
| 16.9 | Comprehensive Audit Log | Must | M | PLANNED |
| 16.10 | Audit Trail Query Interface | Must | M | PLANNED |
| 16.11 | Audit Trail Export | Must | S | PLANNED |
| 16.12 | Tamper-Evident Storage | Should | L | PLANNED |
| 16.13 | Traceability Report | Must | M | PLANNED |
| 16.14 | HACCP Compliance Report | Must | M | PLANNED |
| 16.15 | Batch Record Report | Must | L | PLANNED |
| 16.16 | Document Version Control | Should | L | PLANNED |
| 16.17 | Document Acknowledgment | Should | M | PLANNED |
| 16.18 | Compliance Settings Page | Must | M | PLANNED |

**Totals:**
- Must Have: 15 stories
- Should Have: 3 stories
- **Total:** 18 stories

---

## 4. Certification Standards Covered

### 4.1 BRC Global Standard for Food Safety (v9)
Key clauses supported by MonoPilot:
- **1.1** Senior Management Commitment
- **2.0** The Food Safety Plan - HACCP (Epic 6 + 16)
- **3.4** Internal Audit (16.2)
- **3.5** Supplier Approval (Epic 14)
- **3.9** Traceability (16.13)
- **3.11** Management of Incidents (NCR - Epic 6)

### 4.2 IFS Food (v8)
Key clauses:
- **1.3** HACCP System
- **2.2** Documentation Management (16.16)
- **4.18** Traceability
- **4.19** Allergen Management (Epic 2)
- **5.6** Corrective Actions (NCR CAPA)

### 4.3 FSSC 22000
Additional requirements:
- Food fraud prevention
- Food defense
- Environmental monitoring

### 4.4 21 CFR Part 11
FDA Electronic Records requirements:
- 11.10 Controls for closed systems (16.5-16.8)
- 11.50 Signature manifestations
- 11.70 Signature/record linking

---

## 5. Dependencies

### 5.1 From Other Modules
- **Epic 6 (Quality):** NCR, HACCP, test results
- **Epic 14 (SQM):** Supplier audits, approvals
- **Epic 2 (Technical):** Allergens, BOMs

### 5.2 To Other Modules
- All modules: audit trail requirements
- Signature requirements affect workflow

---

## 6. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Standard version updates | Medium | Medium | Version management, regular updates |
| 21 CFR Part 11 complexity | High | High | Phased implementation, expert review |
| User resistance to signatures | Medium | Medium | Training, explain value |
| Audit trail performance | Medium | Medium | Archiving, indexing |

---

## 7. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Compliance Epic |
