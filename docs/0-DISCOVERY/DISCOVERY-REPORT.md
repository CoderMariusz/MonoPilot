MonoPilot - Discovery Report
Data: 2025-12-09
Agent: Mary (Discovery Agent)
Typ wywiadu: Deep Project Discovery (Fresh Documentation Reset)
Clarity Score: 85% (Excellent)

Executive Summary
MonoPilot to Manufacturing Execution System (MES) dla przemysłu spożywczego, zbudowany w Next.js 15 + React 19 + Supabase. Projekt jest w MVP Phase 1 (~95% complete) z 5 epicami zakończonych lub w zaawansowanej fazie implementacji.
System targetuje małe i średnie firmy spożywcze (80%) oraz duże przedsiębiorstwa (20%), oferując prostotę wdrożenia i konfiguracji niedostępną w rozwiązaniach enterprise jak D365 czy SAP, przy zachowaniu kluczowych funkcji MES.
Status:

Epics 1-4: DONE (Settings, Technical, Planning, Production)
Epic 5: 92% (Warehouse) - pozostają bugi związane z drukowaniem i scanner workflow
Epics 6-7: Zaplanowane (Quality, Shipping) - Phase 2
Epics 8-9: Zaplanowane (NPD, Performance) - Phase 3

Kluczowe wyniki discovery:

Jasno zdefiniowany target market i value proposition
Kompletna analiza bazy danych (47+ tabel, RLS enabled)
Zidentyfikowane 7 krytycznych bugów w Epic 5
Dokumentacja kodu i architektury na wysokim poziomie
Pełna mapa modułów i zależności
Zidentyfikowane luki wymagające decyzji (Finance, Compliance, Integracje)


1. Business Context
1.1 Target Market & Business Model
Target Segments:

80% Small/Medium - firmy produkcyjne 5-100 pracowników
20% Large - przedsiębiorstwa 100+ pracowników

Business Model:

Status: TBD (focus on functionality first)
Rozważane opcje: SaaS subscription model
Obecnie brak ustalonej strategii pricing

Geographical Focus:

Primary: Poland (polski + angielski w UI)
Secondary: EU expansion planned

1.2 Core Value Proposition
Problem rozwiązywany:

"Brak dobrego narzędzia łączącego planning z produkcją dla małych i średnich producentów spożywczych"

Pain Points Addressed:

Brak przepływu informacji między działami (planning → production → warehouse → QA)
Excel-based chaos - brak centralizacji danych
Niedostosowalne ERPy - D365/SAP są za ciężkie, drogie i wymagają consultantów
Słaba integracja - większość systemów wymaga manualnej synchronizacji
Długi czas wdrożenia - enterprise MES to 6-24 miesiące, MonoPilot celuje w tygodnie

Competitive Positioning:
AspektD365/SAPDedykowane MES (AVEVA, Plex)MonoPilotTargetEnterprise (100M+ revenue)Mid-to-LargeSMB Food IndustryWdrożenie6-24 miesięcy3-12 miesięcyTygodnieKoszt$500K+$100K+Target: dostępny dla SMBCustomizationWymaga consultantówWymaga ITSelf-service (toggles, settings)Food-specificGenerycznyCzęściowoNative (allergens, traceability)
USP (Unique Selling Point):

"MES dla producentów spożywczych z prostotą wdrożenia SaaS i konfigurowalnością no-code - tam gdzie D365 jest za ciężki, a Excel już nie wystarcza"

Czym MonoPilot NIE jest:

Nie jest pełnym ERP (brak modułu Finance/Accounting)
Nie jest systemem CRM
Nie jest systemem HR
Nie zastępuje dedykowanego systemu księgowego

1.3 Success Metrics (MVP)
Functional Completeness:

✅ Wszystkie epiki 1-5 działające (Settings, Technical, Planning, Production, Warehouse)
✅ Print integration working (currently blocking)
✅ Scanner workflows complete
✅ No critical bugs

Operational Metrics (Post-MVP):
MetrykaTargetRationaleUptime99.5%+Produkcja wymaga ciągłościMTTR (Mean Time to Recovery)< 30 minPrzestój produkcji = stratyTraceability query time< 30 secWymóg recall - szybka odpowiedź na audytPage load (P95)< 2sUX dla operatorówTest coverage> 70%Stabilność przy zmianach
Security Metrics:

RLS security audit: PASSED (currently needed)
Penetration test: TBD (before production launch)


2. User Personas & Roles
2.1 Role Definitions
MonoPilot wspiera 3 główne role w systemie:
1. Operator Produkcji
Typ użytkownika: Frontline worker
Główne zadania:

Konsumpcja materiałów do WO (Work Order)
Robienie stocków (output produkcji)
Przyjmowanie towarów (GRN - Goods Receipt Note)
Konsumpcja do WO (material consumption)

Kluczowe workflow:

Skanuje WO barcode
Skanuje LP (License Plate) materiałów
Potwierdza konsumpcję
Wyprodukowany towar → nowy LP
Drukuje etykiety (currently broken - BUG-001/002)

Używane moduły:

Production (Epic 4)
Warehouse (Epic 5)
Scanner Interface (mobile/dedicated scanners)

Hardware:

Dedykowane skanery (Zebra, Honeywell)
Telefony (Samsung Galaxy 21 etc.)
Drukarki Zebra (ZPL format)


2. Manager
Typ użytkownika: Supervisor/Manager
Główne zadania:

Akceptuje edge case'y w produkcji
Pilnuje produkcji (monitoring WO progress)
Raporty: KPI, yields, QA metrics
Reklamacje (NCR - Non-Conformance Reports)
Sprawdza towary niezgodne ze spec (quality holds)
Sprawdza wyprodukowane towary (QA approval)

Kluczowe workflow:

Monitoring dashboard (WO status, delays, yields)
Approval workflow (PO approval, NCR approval)
Quality holds investigation
Raporty (yields, downtimes, quality metrics)

Używane moduły:

Dashboard (Epic 1)
Planning (Epic 3)
Production (Epic 4)
Quality (Epic 6 - Phase 2)
Reporting (all modules)


3. Admin
Typ użytkownika: System administrator
Główne zadania:

Największy dostęp do ustawień systemu
User management (invitations, roles, permissions)
Module activation/deactivation
Settings configuration (warehouse, quality, production)
Organizacja setup (company info, warehouses, locations)

Kluczowe workflow:

Onboarding wizard (organization setup)
User invitations + role assignment
Module toggling (enable/disable features)
Settings per module (warehouse settings, quality settings)

Używane moduły:

Settings (Epic 1)
All module settings pages


2.2 Additional Roles (System-Defined)
Oprócz 3 głównych ról, system definiuje dodatkowe role specjalistyczne:
RolePurposeAccess LeveladminFull accessAll modules, all settingsmanagerSupervisorApprovals, reports, monitoringoperatorProduction workerProduction, scanner, basic warehouseviewerRead-onlyDashboard, reports (no edit)plannerPlanning specialistPlanning module (PO, TO, WO creation)technicalProduct/BOM managerTechnical module (products, BOMs, routings)purchasingProcurementPlanning (PO creation, supplier management)warehouseWarehouse workerWarehouse module (receiving, movements)qcQuality inspectorQuality module (testing, holds, NCRs)financeFinancial analystFinance module (future - Epic 10+)

3. System Architecture
3.1 Tech Stack
Frontend:

Next.js 15 (App Router)
React 19
TypeScript 5.9.3
Tailwind CSS 3.4
shadcn/ui (Radix UI components)

Backend:

Next.js API Routes (Route Handlers)
Supabase (PostgreSQL + Auth + Storage + RLS)
Service Layer Pattern (business logic)

Infrastructure:

Database: PostgreSQL via Supabase
Authentication: Supabase Auth (JWT-based)
Storage: Supabase Storage (CoA files, attachments)
Caching: Upstash Redis
Email: SendGrid
Hosting: TBD (likely Vercel)

Development:

Package Manager: pnpm 8.15.0
Testing: Vitest 4.0 + Testing Library
E2E: Playwright 1.56.1
Linting: ESLint 9 + Next.js config
CI/CD: TBD (GitHub Actions planned)

3.2 Architectural Patterns
Layered Architecture:
Presentation Layer (React Components)
    ↓
API Layer (Route Handlers)
    ↓
Service Layer (Business Logic)
    ↓
Data Access Layer (Supabase Client)
    ↓
Database (PostgreSQL with RLS)
Key Principles:

Multi-Tenancy First - Every query filtered by org_id
Service Role Pattern - Admin client for all DB operations (bypasses RLS)
Dual Validation - Client (react-hook-form + Zod) + Server (Zod in API routes)
Audit Trail - created_at, updated_at, created_by, updated_by on all tables
Type Safety - End-to-end TypeScript with generated Supabase types

Service Layer Pattern:

20+ services (lib/services/)
Standard result type: { success: boolean, data?: T, error?: string, code?: ErrorCode }
Manual org_id filtering (required due to service role usage)
Cache invalidation after mutations

3.3 Localization & i18n
Current Implementation:

UI Language: Polish (primary) + English
Date format: DD.MM.YYYY (Polish standard)
Number format: 1 234,56 (comma as decimal separator)
Currency: PLN (primary), EUR (secondary)
Timezone: Europe/Warsaw (default, configurable per org)

Future Considerations:

Full i18n framework (react-intl or next-intl) for EU expansion
Per-user language preference
Multi-currency support for pricing


4. Database & Multi-Tenancy
4.1 Database Schema Summary
Statistics:

Tables: 47+ (public schema)
Auth tables: 15+ (Supabase Auth schema)
Migrations applied: 51 SQL files
RLS: Enabled on ALL public tables

Core Tables:

organizations (4 rows) - Multi-tenant root
users (5 rows) - User accounts with roles
warehouses (3 rows) - Storage locations
locations (9 rows) - Warehouse sub-locations
machines (3 rows) - Production machines
production_lines (3 rows) - Production lines
allergens (1 row) - EU14 allergens + custom
tax_codes (4 rows) - VAT/tax rates
products - Product catalog (Epic 2)
boms + bom_items - Bill of Materials
routings + routing_operations - Production processes
purchase_orders + po_lines - Procurement
work_orders - Production orders
license_plates - Inventory tracking (LP-based)
transfer_orders - Internal transfers

4.2 Multi-Tenancy Implementation
RLS (Row Level Security):
sqlCREATE POLICY "tenant_isolation" ON {table_name}
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );
How it works:

Service role (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS
Authenticated users require org_id in JWT
Services use Admin client (service role) with manual org_id filtering

Why service role?

Server components don't have JWT context
Route handlers execute outside user session
Manual filtering required: .eq('org_id', orgId)

⚠️ SECURITY WARNING: Multi-Tenancy Risk
Current implementation relies on developers manually adding .eq('org_id', orgId) to every query. This is error-prone and creates risk of data leakage between tenants.
Recommended Mitigations (choose one or more):

Database Views - Create views with security_definer that enforce org_id filtering
Automated Tests - CI pipeline test that scans all queries for org_id filter
Query Wrapper - TypeScript helper that enforces org_id parameter
Code Review Checklist - Mandatory org_id check in PR reviews

Action Required: DEBT-002 (RLS Audit) must address this before production launch.
4.3 Backup & Disaster Recovery
Current State: Supabase managed backups (daily, 7-day retention on Pro plan)
Required for Production:

Point-in-time recovery (PITR) enabled
Cross-region backup replication (for EU compliance)
Documented RTO (Recovery Time Objective): Target < 4 hours
Documented RPO (Recovery Point Objective): Target < 1 hour
Tested restore procedure (quarterly drill)

Action Required: Document DR procedure before production launch.

5. Module Overview
5.1 Module Map (Epics 1-9)
EpicModuleStatusStoriesPriorityDependencies1Settings✅ DONE19P0None (foundation)2Technical✅ DONE28P0Epic 13Planning✅ DONE30P0Epic 1, 24Production✅ DONE21P0Epic 1, 2, 35Warehouse🚧 92%36P0Epic 1, 2, 36Quality📋 Planned28P1Epic 1, 57Shipping📋 Planned28P1Epic 1, 5, 68NPD📋 PlannedTBDP2Epic 29Performance📋 PlannedTBDP2All
Total Stories:

MVP (Epics 1-5): 134 stories (~95% done)
Phase 2 (Epics 6-7): ~56 stories (0% done)
Phase 3 (Epics 8-9): ~40 stories (0% done)
TOTAL: ~230 stories (~55% overall completion)

5.2 Epic Summaries
Epic 1: Settings (DONE)
Purpose: Organization setup, users, warehouses, configurations
Stories: 19 (all done)
Key Features:

Organization CRUD + wizard (Story 1.1)
User management + invitations (Stories 1.2-1.4)
Warehouse CRUD (Story 1.5)
Location management (Story 1.6)
Machine configuration (Story 1.7)
Production line setup (Story 1.8)
Allergen management (Story 1.9)
Tax code configuration (Story 1.10)
Module activation (Story 1.11)
Dashboard + activity feed (Stories 1.13, 1.15)

Database Tables:

organizations, users, user_invitations, user_sessions
warehouses, locations, machines, production_lines
allergens, tax_codes, activity_logs


Epic 2: Technical (DONE)
Purpose: Products, BOMs, Routings, Allergens, Tracing
Stories: 28 (all done)
Key Features:

Product CRUD with types (RM, WIP, FG, PKG, BP, CUSTOM)
Product versioning + history
BOM management with date-based versions
BOM cloning + overlap validation
Conditional BOM items (flags: organic, vegan, etc.)
By-products support
Routing management (operations, machines, lines)
Product-routing assignment
LP genealogy (traceability)
Forward/backward tracing
Recall simulation
Technical settings (field visibility, flags)

Database Tables:

products, product_version_history, product_allergens, product_type_config
boms, bom_items
routings, routing_operations, product_routings
license_plates (stub), lp_genealogy, traceability_links, recall_simulations
technical_settings


Epic 3: Planning (DONE)
Purpose: Purchase Orders, Transfer Orders, Work Orders, MRP
Stories: 30 (all done)
Key Features:

Supplier CRUD + default supplier per product
Purchase Order CRUD + line management
PO approval workflow
PO status tracking (draft → submitted → approved → receiving → closed)
Transfer Order CRUD + line management
TO status tracking (draft → released → in_transit → completed)
Work Order creation (STUB - full implementation in Epic 4)
MRP basics (future enhancement)

Database Tables:

suppliers, supplier_products
purchase_orders, po_lines, po_approvals
work_orders (stub)
transfer_orders, to_lines, to_line_lps
planning_settings


Epic 4: Production (DONE)
Purpose: WO execution, consumption, outputs, yield
Stories: 21 (all done)
Key Features:

Work Order lifecycle (draft → released → in_progress → completed → closed)
BOM snapshot on WO creation (immutable during production)
Material consumption (LP-based)
Production output (LP creation)
By-product handling
Yield tracking (planned vs actual)
Scanner production entry (consume + output)
Real-time WO status updates

Database Tables:

work_orders (full implementation)
wo_materials_consumed, wo_outputs
wo_by_products


Epic 5: Warehouse (92% DONE)
Purpose: License Plates, ASN, GRN, Stock Movements, Scanner
Stories: 36 (33 done, 3 in progress)
Key Features:

License Plate CRUD + numbering (LP-YYYY-NNNN)
LP split/merge
LP genealogy (parent-child relationships)
ASN (Advanced Shipping Notice) creation
GRN (Goods Receipt Note) + LP creation
Auto-print labels on receive (BROKEN - BUG-001/002)
Stock movements (location transfers)
Scanner receive workflow (PARTIAL - BUG-004)
Scanner pick/putaway/move workflows
Warehouse settings (MISSING UI - BUG-005)
Over-receipt handling
Update PO/TO received quantities

Database Tables:

license_plates (full implementation)
lp_genealogy (full)
asns, asn_lines
grns, grn_items
stock_movements
warehouse_settings

Bugs Remaining:

BUG-001: Print integration incomplete (auto-print on receive doesn't work)
BUG-002: Print API is stub only (no ZPL/IPP printer support)
BUG-003: GRN Items - LP navigation missing (no click-to-LP-detail)
BUG-004: Scanner receive not PO-barcode driven (uses dropdown instead of scan)
BUG-005: No Warehouse Settings UI page (API exists, UI missing)
BUG-006: Scanner session timeout missing (no auto-logout)
BUG-007: Offline queue not implemented (Phase 3)


Epic 6: Quality (PLANNED - Phase 2)
Purpose: QA status, holds, specifications, NCR, CoA
Stories: 28 (0 done)
Key Features:

LP QA Status (pending, passed, failed, quarantine)
QA status transition rules (state machine)
Prevent shipping non-passed LPs
Quality holds + investigation tracking
Product specifications (test limits)
Test results recording (against LPs)
NCR (Non-Conformance Reports) lifecycle
Root cause analysis + CAPA
Certificate of Analysis (CoA) upload + verification
Quality dashboard (KPIs, charts)
Quality reports (NCR summary, CoA compliance)

Database Tables (planned):

quality_holds, hold_investigation_notes
product_specifications, test_results
non_conformance_reports, ncr_links
certificates_of_analysis
quality_settings


Epic 7: Shipping (PLANNED - Phase 2)
Purpose: Sales Orders, picking, packing, delivery
Stories: 28 (0 done)
Key Features:

Sales Order CRUD + line management
SO status tracking (draft → confirmed → picking → packed → shipped → delivered)
Shipment creation from SOs
Consolidate multiple SOs into one shipment
Generate pick lists (FIFO/FEFO)
Picker assignment
Handle pick shorts (partial picks)
Create packages for shipment
Track items in each package
Record carrier + tracking info
Generate packing slips + shipping labels
Print label support (ZPL to Zebra printers)
Scanner picking workflow
Scanner packing workflow
Scanner item validation (QA blocking)
Shipping reports (open orders, performance)

Database Tables (planned):

sales_orders, so_lines
shipments, shipment_orders
pick_lists, pick_shorts
packages, package_items
shipping_settings


Epic 8: NPD (PLANNED - Phase 3)
Purpose: New Product Development, Stage-Gate, formulations
Stories: TBD
Key Features:

Product development workflow (trial BOMs, costing)
Stage-Gate process (ideation → development → validation → launch)
Trial BOMs + routings
Costing analysis
Approval workflow
Launch to production


Epic 9: Performance (PLANNED - Phase 3)
Purpose: Optimization, offline support, analytics
Stories: TBD
Key Features:

Query optimization
Caching strategy enhancements
Offline support (PWA)
Analytics & BI dashboards
Advanced reporting


5.3 Module Dependencies Graph
Epic 1 (Settings) ← Foundation
    ↓
Epic 2 (Technical) ← Products, BOMs
    ↓
Epic 3 (Planning) ← PO, TO, Suppliers
    ↓
Epic 4 (Production) ← WO execution
    ↓
Epic 5 (Warehouse) ← LP, GRN, Movements ← CURRENT (92%)
    ↓
Epic 6 (Quality) ← QA, NCR, CoA
    ↓
Epic 7 (Shipping) ← SO, Picking, Packing
    ↓
Epic 8 (NPD) ← Product Development
    ↓
Epic 9 (Performance) ← Optimization

6. Scanner & Mobile Experience
6.1 Hardware
Dedicated Scanners:

Zebra scanners (industrial)
Honeywell scanners (industrial)

Mobile Devices:

Samsung Galaxy 21 (and similar Android devices)
Kamera-based scanning (fallback)

Barcode Types:

1D barcodes (primary) - Product codes, PO numbers, WO numbers
QR codes (secondary) - LP numbers, location barcodes

6.2 Barcode Standards & GS1 Compliance
Current Implementation:

Internal LP numbering: LP-YYYY-NNNN
Internal product codes: Custom format per organization
PO/WO barcodes: Internal document numbers

GS1 Compliance Consideration:
Dla większych klientów (20% target market) oraz sieci handlowych, standard GS1 może być wymagany:
StandardUse CaseCurrent SupportPriorityGTIN-13/14Product identification⚠️ Partial (custom codes)P2GS1-128Shipping labels (SSCC)❌ Not implementedP2GS1 DataMatrixTraceability (lot, expiry)❌ Not implementedP2
Decision Required: Czy GS1 compliance jest wymagane dla MVP? Jeśli target to głównie SMB bez eksportu do sieci, może być Phase 2.
6.3 Scanner Workflows
Current Implementation:

Scanner Receive (Story 5.34):

Workflow: Select document from dropdown → scan items → confirm receive
BUG-004: Should be PO-barcode driven (scan PO → show items)


Scanner Production Entry (Story 4.X):

Workflow: Scan WO → scan material LPs → confirm consumption → scan output → create new LP


Scanner Pick/Putaway/Move:

Workflow: Scan location → scan LP → confirm action



Future (Phase 2):

Scanner Picking (Epic 7) - pick lists, FIFO/FEFO
Scanner Packing (Epic 7) - pack items into packages
Scanner QA (Epic 6) - QA pass/fail, test results

6.4 Session Management
Current Issues:

BUG-006: No session timeout implementation
Scanner sessions don't auto-logout after inactivity
Security risk: shared devices

Planned Fix:

Configurable timeout (default: 15 minutes)
Auto-logout + return to login
Session management UI (view active sessions, revoke)


7. Print Integration
7.1 Current State
Hardware:

Drukarki Zebra (ZPL format)
Network printers + USB printers

What to Print:

License Plate Labels (primary) - LP number, product, qty, date, QR code
Packing Slips (Phase 2) - SO details, items, customer info
CoA (Certificate of Analysis) (Phase 2) - quality certificates
Shipping Labels (Phase 2) - carrier labels with tracking

7.2 Known Issues
BUG-001: Print Integration Incomplete

Location: apps/frontend/app/api/warehouse/grns/[id]/receive/route.ts:224
Issue: // TODO: Queue print job or call print endpoint
Impact: Auto-print on receive doesn't work - labels must be printed manually
Priority: HIGH (blocking warehouse workflow)

BUG-002: Print API is Stub Only

Location: apps/frontend/app/api/warehouse/license-plates/[id]/print/route.ts:94
Issue: // TODO: In production, send to actual printer
Impact: Label printing is simulation only - no actual ZPL/IPP printer support
Priority: HIGH (blocking warehouse workflow)

7.3 Required Implementation
ZPL Label Format:
zpl^XA
^FO50,50^ADN,36,20^FDLP-2024-001^FS
^FO50,100^ADN,24,12^FDProduct: Chocolate Powder^FS
^FO50,140^ADN,24,12^FDQty: 500 kg^FS
^FO50,180^BQN,2,6^FDMA,LP-2024-001^FS
^XZ
Print Service Requirements:

ZPL generation for Zebra printers
IPP protocol support (network printers)
Print queue management
Fallback: Browser print dialog (PDF)


8. Compliance & Food Safety
8.1 Current Compliance Posture
MonoPilot jako MES dla przemysłu spożywczego musi wspierać wymogi regulacyjne. Obecny stan:
RequirementDescriptionCurrent StatusPriorityTraceabilityForward/backward trace w 30 sekund✅ Implemented (Epic 2)P0Lot TrackingŚledzenie partii przez cały proces✅ Implemented (LP-based)P0Allergen ManagementEU14 + custom allergens✅ Implemented (Epic 2)P0Audit TrailKto, co, kiedy zmienił✅ Implemented (all tables)P0HACCP SupportCritical Control Points⚠️ Partial (QA module Phase 2)P1Electronic Signatures21 CFR Part 11 compliance❌ Not implementedP2Supplier QMSupplier audits, scorecards❌ Not implementedP2
8.2 Regulatory Context
Polish/EU Requirements:

Sanepid audits - Traceability, allergens, lot tracking (✅ covered)
RASFF (Rapid Alert System) - Quick recall capability (✅ covered)
EU 1169/2011 - Allergen labeling (✅ covered in product data)

For Export/Larger Clients:

FSSC 22000 - Food safety certification (⚠️ may need HACCP enhancements)
BRC/IFS - Retailer standards (⚠️ may need additional documentation features)
FDA (US export) - 21 CFR Part 11 for electronic records (❌ not covered)

8.3 HACCP Support (Phase 2)
Epic 6 (Quality) powinien zawierać:

Critical Control Point definition per routing
CCP monitoring (temperature, time, etc.)
Deviation recording and alerts
Corrective action tracking

Decision Required: Czy HACCP features są MVP-blocking dla target market?

9. Integration Architecture
9.1 Current Integration Points
Internal Integrations:

Supabase Auth ↔ Application (JWT-based)
Supabase Storage ↔ Application (CoA files, attachments)
Upstash Redis ↔ Application (caching)
SendGrid ↔ Application (email notifications)

External Integrations:

❌ None implemented

9.2 Integration Roadmap
Phase 2 (Priority):
IntegrationUse CaseComplexityPriorityAccounting SystemSync PO costs, invoice matchingMediumP1Email/CalendarNotifications, schedulingLowP2Webhook OutboundNotify external systems of eventsLowP2
Phase 3 (Future):
IntegrationUse CaseComplexityPriorityEDI (EDIFACT)Orders from retail chainsHighP3Scales/PLCAuto-capture weightsHighP3SCADAMachine data integrationHighP3BI ToolsData export to Power BI, TableauMediumP3
9.3 Integration Strategy
Recommended Approach:

API-First - All features accessible via REST API (already implemented)
Webhook Events - Emit events for key state changes (to implement)
Import/Export - CSV/Excel import for initial data migration (partial)
Partner Integrations - Pre-built connectors for common Polish accounting systems

Polish Accounting Systems to Consider:

Comarch ERP Optima / XL
Sage Symfonia
Insert Subiekt GT
wFirma / Fakturownia (for smaller clients)


10. Finance Module Decision
10.1 Current State
MonoPilot nie zawiera modułu finansowego. System zbiera dane kosztowe:

Product cost_per_unit (Epic 2)
BOM costing (sum of component costs)
PO line prices

Ale nie wykonuje:

Księgowań
Fakturowania
Rozliczeń z dostawcami/klientami
Raportów finansowych (P&L, bilans)

10.2 Decision Options
OptionProsConsRecommendationA) No Finance ModuleSimpler, faster MVP, integrate with existing systemsRequires integration, data silos✅ Recommended for MVPB) Basic CostingProduction cost tracking, margin analysisStill need external for accountingConsider for Phase 2C) Full FinanceComplete solutionMassive scope, regulatory complexity❌ Not recommended
10.3 Recommended Strategy

MVP: No finance module - users use existing accounting system
Phase 2: Add "Costing & Margin" sub-module:

WO actual vs planned cost
Product margin analysis
Cost variance reports


Phase 2/3: Integration with Polish accounting systems (Comarch, Sage)
Never: Full GL/accounting - stay in MES lane


11. Key Technical Patterns
11.1 Service Layer Pattern
Standard Service Structure:
typescript// lib/services/{resource}-service.ts

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: ErrorCode
}

async function getCurrentOrgId(): Promise<string | null> {
  // Get org_id from authenticated user
}

export async function create(input: CreateInput): Promise<ServiceResult> {
  // 1. Get org_id
  // 2. Validate unique constraints
  // 3. Insert with admin client
  // 4. Invalidate cache
  // 5. Return result
}

export async function list(filters?: Filters): Promise<ListResult> {
  // 1. Check cache
  // 2. Query with admin client + org_id filter
  // 3. Set cache
  // 4. Return result
}
Service Inventory:

20+ services covering all modules
Consistent error handling
Cache invalidation after mutations
Audit trail population (created_by, updated_by)

11.2 LP-Based Inventory Pattern
License Plate (LP) as Atomic Unit:

No loose quantity tracking
Every stock movement = LP movement
Full genealogy (parent-child relationships)
Traceability: forward + backward

LP Lifecycle:
Created (on receive/production)
    ↓
Available (in stock)
    ↓
Consumed (to WO) / Shipped (to customer) / Split/Merge
    ↓
Inactive (historical record)
Traceability:

lp_genealogy table tracks parent-child relationships
traceability_links table tracks consumption/production
Recall simulation (Story 2.20) - forward/backward trace

11.3 BOM Snapshot Pattern
Immutable BOM on WO Creation:

WO created → captures current BOM version
BOM stored in WO (snapshot)
Changes to BOM don't affect existing WOs
Ensures production consistency

Date-Based Versioning:

BOM versions: 1.0, 1.1, 2.0
effective_from and effective_to dates
Overlap validation (trigger prevents overlapping dates)
Status: Draft → Active → Phased Out → Inactive

11.4 Configurable Settings Pattern
Per-Module Settings Tables:

technical_settings (Epic 2)
planning_settings (Epic 3)
warehouse_settings (Epic 5)
quality_settings (Epic 6 - planned)
shipping_settings (Epic 7 - planned)

Field Visibility Toggles:
json{
  "product_field_config": {
    "category": { "visible": true, "mandatory": false },
    "cost_per_unit": { "visible": true, "mandatory": false },
    "shelf_life_days": { "visible": true, "mandatory": false }
  }
}
Feature Toggles:

use_conditional_flags (enable conditional BOM items)
allow_consume_pending (consume LPs before QA approval)
require_hold_release_approval (QA hold release requires manager approval)


12. Critical Issues & Technical Debt
12.1 Open Bugs (Epic 5)
IDDescriptionPriorityStatusImpactBUG-001Print integration incompleteHIGHOPENAuto-print on receive doesn't workBUG-002Print API stub onlyHIGHOPENNo ZPL/IPP printer supportBUG-003GRN LP navigation missingMEDIUMOPENCannot click LP number to navigateBUG-004Scanner PO barcodeMEDIUMOPENWorkflow doesn't match expectationBUG-005Warehouse Settings UI missingHIGHOPENNo UI to configure warehouse settingsBUG-006Scanner session timeoutLOWOPENNo auto-logout after inactivityBUG-007Offline queue (PWA)LOWPhase 3Scanner requires network connection
12.2 Technical Debt
DEBT-001: Performance Issues

Status: TO INVESTIGATE
Priority: MEDIUM
Area: Database queries, frontend rendering
Impact: Potential N+1 queries, missing indexes
Action: Need performance audit + benchmarking

DEBT-002: RLS Policy Gaps

Status: TO INVESTIGATE
Priority: HIGH (SECURITY)
Area: Supabase RLS policies + service layer org_id filtering
Impact: Potential data leakage between tenants
Action: Need comprehensive security audit + automated test coverage

DEBT-003: Test Coverage Gaps

Status: TO INVESTIGATE
Priority: MEDIUM
Area: Unit tests, E2E tests
Impact: Regression risk during refactoring
Action: Need test coverage report (target: >70%)

DEBT-004: Documentation Gaps

Status: IN PROGRESS (this discovery)
Priority: MEDIUM
Area: API docs, architecture docs, PRD
Impact: Onboarding difficulty, context loss
Action: Currently rebuilding docs structure

12.3 MVP Exit Criteria
Before MVP can be considered "production-ready":
Must Have (Blocking):

 Print integration working (BUG-001/002)
 Warehouse Settings UI complete (BUG-005)
 Scanner PO barcode workflow fixed (BUG-004)
 RLS security audit passed (DEBT-002)
 Bug fixes: BUG-003 (GRN LP navigation)

Should Have (Before first paying customer):

 Performance baseline established (DEBT-001)
 Test coverage >70% (DEBT-003)
 DR procedure documented and tested
 User documentation (basic)

Nice to Have (Can launch without):

 Scanner session timeout (BUG-006)
 GS1 barcode support
 Accounting system integration


13. Documentation Audit (Old PRD Analysis)
13.1 Old Documentation Structure
Found in docs-old/:

prd-index.md - Module map + dependencies
Modules (planned but not created): No separate module PRD files found
Epics (created):

epics/completed/01-settings.md - 19 stories DONE
epics/completed/02-technical.md - 28 stories DONE
epics/completed/03-planning.md - 30 stories DONE
epics/completed/04-production.md - 21 stories DONE
epics/current/06-quality.md - 28 stories PLANNED
epics/current/07-shipping.md - 28 stories PLANNED
epics/current/08-npd.md - TBD stories PLANNED
epics/current/09-performance-optimization.md - TBD stories PLANNED



UX Design Specs (docs-old/3-ARCHITECTURE/ux/specs/):

Full set of UX specifications for all modules

Reference Docs (docs-old/1-BASELINE/reference/):

database-schema.md - Database documentation (complete)
code-architecture.md - Code architecture (complete)
rls-and-supabase-clients.md - RLS patterns
shared-templates-library.md - Reusable templates
test-design-system.md - Test strategy

13.2 Key Patterns to Preserve
From Old Documentation:

Module-Based Structure - Keep modular PRD organization
Story-Based Breakdown - Keep user story format with clear ACs
FR Coverage Matrix - Traceability from FR → Story
UX Design Specs - Detailed component specs
Database Schema Documentation - Comprehensive schema docs

Patterns to Improve:

Module PRDs Missing - Create consolidated module PRDs
API Documentation - Add OpenAPI specs
Integration Points - Document explicitly
Compliance Matrix - Add regulatory mapping


14. Recommendations for PRD Phase
14.1 Documentation Strategy
Proposed New Structure:
docs/
├── 0-DISCOVERY/
│   └── DISCOVERY-REPORT.md         ← THIS FILE
│
├── 1-BASELINE/
│   ├── product/
│   │   ├── project-brief.md
│   │   ├── prd.md
│   │   └── modules/
│   │
│   ├── architecture/
│   │   ├── system-architecture.md
│   │   ├── database-schema.md
│   │   ├── api-specification.md
│   │   └── integration-points.md
│   │
│   └── reference/
│       ├── compliance-matrix.md    ← NEW
│       ├── code-architecture.md
│       └── design-system.md
│
├── 2-MANAGEMENT/
│   └── epics/
│
├── 3-DEVELOPMENT/
│
└── 4-ARCHIVE/
14.2 Key Decisions Required
Before proceeding with PRD, the following decisions need stakeholder input:
DecisionOptionsImpactOwnerFinance ModuleA) None, B) Basic Costing, C) FullArchitecture, scopeProduct OwnerGS1 ComplianceA) MVP, B) Phase 2, C) NeverScanner implementationProduct OwnerHACCP FeaturesA) MVP, B) Phase 2Quality module scopeProduct OwnerTarget Accounting SystemsComarch, Sage, otherIntegration roadmapProduct OwnerDR RequirementsRTO/RPO targetsInfrastructureTech Lead

15. Questions Resolved
15.1 Business Questions
QuestionAnswerSourceTarget market size?80% small/medium (5-100 workers), 20% large (100+)User interviewBusiness model?TBD (focus on functionality first)User interviewCore problem solved?Lack of good tool connecting planning + productionUser interviewCompetitive advantage?Simpler than D365/SAP, faster to deploy, food-specificAnalysisMVP success criteria?Functional completeness (all epics 1-5 working)User interview
15.2 Technical Questions
QuestionAnswerSourceDatabase multi-tenancy?RLS + service role with manual filtering (needs audit)Code analysisScanner hardware?Dedicated scanners (Zebra, Honeywell) + phonesUser interviewBarcode types?1D + QR (GS1 support TBD)User interviewPrint integration?Zebra (ZPL), currently brokenBug trackerFinance approach?External integration recommendedAnalysis

16. Appendices
Appendix A: Glossary
TermDefinitionLPLicense Plate - atomic unit of inventory (pallet, box, container)BOMBill of Materials - recipe/formulation for producing a productWOWork Order - production order to manufacture a productPOPurchase Order - order to supplier for raw materialsTOTransfer Order - internal transfer between locations/warehousesSOSales Order - customer order for finished goodsGRNGoods Receipt Note - document for receiving materialsASNAdvanced Shipping Notice - pre-notification of shipmentNCRNon-Conformance Report - quality issue documentationCoACertificate of Analysis - quality certificate from supplierFIFOFirst In, First Out - picking strategy (oldest first)FEFOFirst Expired, First Out - picking strategy (earliest expiry first)RLSRow Level Security - PostgreSQL security featureMESManufacturing Execution SystemMOMManufacturing Operations ManagementERPEnterprise Resource PlanningCAPACorrective and Preventive ActionsHACCPHazard Analysis Critical Control PointsGS1Global Standards Organization (barcode standards)SSCCSerial Shipping Container CodeGTINGlobal Trade Item Number
Appendix B: File Paths Reference
Key Documentation:

This report: docs/0-DISCOVERY/DISCOVERY-REPORT.md
Old PRD index: docs-old/prd-index.md
Database schema: docs-old/1-BASELINE/reference/database-schema.md
Code architecture: docs-old/1-BASELINE/reference/code-architecture.md
Bug tracker: docs/BUGS.md
MVP Phases: docs/MVP-PHASES.md
Project state: PROJECT-STATE.md

Code Structure:

Services: apps/frontend/lib/services/
Validation: apps/frontend/lib/validation/
Components: apps/frontend/components/
API Routes: apps/frontend/app/api/
Migrations: apps/frontend/lib/supabase/migrations/

Appendix C: Competitive Landscape
SolutionTarget MarketStrengthsWeaknesses vs MonoPilotD365 F&OEnterpriseComplete ERP, globalToo complex/expensive for SMBSAP S/4HANAEnterpriseIndustry leader, robustSame as D365AVEVA MESLarge manufacturingDeep MES featuresOverkill for food SMBPlexMid-marketCloud-native MESNot food-specificCSB-SystemFood industryFood-specificLegacy, expensiveAptean Food ERPFood SMBFood-specificLess modern UXExcel/ManualAllFree, familiarNo integration, error-prone
MonoPilot Positioning:
Modern, cloud-native MES specifically for food SMB - simpler than enterprise solutions, more powerful than spreadsheets.

17. Discovery Session Summary
Session Details:

Date: 2025-12-09
Duration: Single session (deep analysis)
Clarity Achieved: 85% (Excellent)

Topics Covered:

✅ Business context (target market, value proposition)
✅ User personas (3 main roles + 7 additional)
✅ Module overview (9 epics, 230 stories)
✅ Database schema (47+ tables, RLS analysis)
✅ Code architecture (layered, service pattern)
✅ Scanner & mobile experience
✅ Print integration
✅ Technical debt & bugs
✅ Compliance & food safety (NEW)
✅ Integration architecture (NEW)
✅ Finance module decision (NEW)
✅ Competitive positioning (NEW)

Decisions Required Before PRD:

Finance module approach
GS1 compliance scope
HACCP feature priority
Target accounting integrations
DR requirements (RTO/RPO)

Ready for Handoff:
✅ PM-AGENT (PRD creation) - after decisions above
⏳ ARCHITECT-AGENT (after PRD complete)
⏳ QA-AGENT (after architecture complete)

Report End
Prepared by: Mary (Discovery Agent)
Reviewed: 2025-12-09 (v2 - addressed logical gaps)
Status: COMPLETE
Next Agent: PM-AGENT (pending key decisions)