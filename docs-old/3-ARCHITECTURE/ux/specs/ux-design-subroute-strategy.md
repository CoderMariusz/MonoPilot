# Subroute Strategy - Minimal, Modal-Based Navigation

**Principle:** Minimize subroutes by using modals for CRUD operations. Keep only essential pages (list + detail).

---

## Navigation Strategy

### ESSENTIAL ROUTES (Keep)
**Every module needs:**
```
GET  /[module]                    → Dashboard
GET  /[module]/[entity]           → List page (table + filters)
GET  /[module]/[entity]/[id]      → Detail page (tabs/accordions)
```

### MODAL-BASED ROUTES (Don't create separate pages!)
**All handled via modals from list or detail:**
```
POST /api/[module]/[entity]       → Create (modal form)
PUT  /api/[module]/[entity]/[id]  → Update (modal form)
DELETE /api/[module]/[entity]/[id] → Delete (confirmation modal)
```

**NO separate routes for:**
- ❌ /[entity]/[id]/edit
- ❌ /[entity]/create
- ❌ /[entity]/[id]/delete

---

## Example: Planning Module Structure

### BEFORE (Too many routes)
```
GET  /planning                           → Dashboard
GET  /planning/purchase-orders           → PO List
GET  /planning/purchase-orders/new       → Create PO form (separate page!)
GET  /planning/purchase-orders/[id]      → PO Detail
GET  /planning/purchase-orders/[id]/edit → Edit PO form (separate page!)

GET  /planning/work-orders               → WO List
GET  /planning/work-orders/new           → Create WO (separate page!)
GET  /planning/work-orders/[id]          → WO Detail
GET  /planning/work-orders/[id]/edit     → Edit WO (separate page!)
```

**Problem:** 10 routes, lots of navigation, slower UX

### AFTER (Modal-based)
```
GET  /planning                           → Dashboard
GET  /planning/purchase-orders           → PO List (+ Create/Edit modals)
GET  /planning/purchase-orders/[id]      → PO Detail (+ Edit/Delete modals)

GET  /planning/work-orders               → WO List (+ Create/Edit modals)
GET  /planning/work-orders/[id]          → WO Detail (+ Edit/Delete modals)
```

**Benefit:** 5 routes, fast modal-based UX, no page reload

---

## Per-Module Route Map

### PLANNING (Epic 3)
```
Essential:
GET  /planning                      → Dashboard + Stats
GET  /planning/purchase-orders      → PO List + Spreadsheet mode (toggle)
GET  /planning/purchase-orders/[id] → PO Detail (Overview | Items | History)
GET  /planning/transfer-orders      → TO List
GET  /planning/transfer-orders/[id] → TO Detail
GET  /planning/work-orders          → WO List
GET  /planning/work-orders/[id]     → WO Detail (Overview | Operations | Materials | History)

Modal-based (in list or detail):
- Create PO (modal)
- Edit PO (modal)
- Delete PO (confirmation)
- Bulk Create PO from Excel (modal)
- Create TO (modal)
- Edit TO (modal)
- Create WO (modal)
- Edit WO (modal)
- Start WO (modal)
- Pause WO (modal)
```

### PRODUCTION (Epic 4)
```
Essential:
GET  /production              → Dashboard + KPI Cards
GET  /production/active-wos   → Active WO List
GET  /production/active-wos/[id] → WO Detail (Overview | Operations | Materials | Outputs | History)

Modal-based:
- Start WO (modal)
- Pause WO (modal)
- Resume WO (modal)
- Start Operation (modal)
- Complete Operation (modal)
- Log Material Consumption (modal)
- Register Output (modal)
```

### WAREHOUSE (Epic 5)
```
Essential:
GET  /warehouse              → Dashboard + Stats
GET  /warehouse/license-plates   → LP List
GET  /warehouse/license-plates/[id] → LP Detail (Overview | Movements | QA | Expiry | History)
GET  /warehouse/asn          → ASN List
GET  /warehouse/asn/[id]     → ASN Detail
GET  /warehouse/grn          → GRN List
GET  /warehouse/grn/[id]     → GRN Detail

Modal-based:
- Create LP (modal)
- Edit LP (modal)
- Update LP Status (modal)
- Create/Receive ASN (modal)
- Create GRN (modal)
- Update QA Status (modal)
- Create Movement (modal)
```

### QUALITY (Epic 6)
```
Essential:
GET  /quality               → Dashboard + Stats
GET  /quality/qa-status    → LP QA List
GET  /quality/qa-status/[id] → LP QA Detail
GET  /quality/testing      → Test Results List
GET  /quality/ncrs         → NCR List
GET  /quality/ncrs/[id]    → NCR Detail (Overview | Investigation | History)
GET  /quality/coas         → CoA List

Modal-based:
- Update QA Status (modal)
- Log Test Result (modal)
- Create NCR (modal)
- Update NCR Status (modal)
- Generate CoA (modal)
```

### SHIPPING (Epic 7)
```
Essential:
GET  /shipping              → Dashboard + Stats
GET  /shipping/sales-orders → SO List
GET  /shipping/sales-orders/[id] → SO Detail (Overview | Lines | Picking | Packing | History)
GET  /shipping/picking      → Picking List
GET  /shipping/shipments    → Shipment List
GET  /shipping/shipments/[id] → Shipment Detail

Modal-based:
- Create SO (modal)
- Edit SO (modal)
- Add SO Line (modal)
- Start Picking (modal)
- Complete Picking (modal)
- Start Packing (modal)
- Complete Packing (modal)
- Create Shipment (modal)
- Download Shipping Label (modal)
```

### NPD (Epic 8)
```
Essential:
GET  /npd                   → Dashboard + Stats
GET  /npd/projects         → NPD Projects List
GET  /npd/projects/[id]    → NPD Project Detail (Overview | Formulations | Compliance | Costing | History)

Modal-based:
- Create Project (modal)
- Edit Project (modal)
- Advance Stage (modal + gate validation)
- Add Formulation (modal)
- Update Compliance Checklist (modal)
- Create NCR (modal)
- Handoff to Production (3-step wizard modal)
```

### TECHNICAL (Epic 2)
```
Essential:
GET  /technical             → Dashboard + Stats
GET  /technical/products   → Products List
GET  /technical/products/[id] → Product Detail
GET  /technical/boms       → BOMs List (+ Timeline toggle)
GET  /technical/boms/[id]  → BOM Detail (Overview | Items | Timeline | Allergens | History)
GET  /technical/routings   → Routings List
GET  /technical/routings/[id] → Routing Detail

Modal-based:
- Create Product (modal)
- Edit Product (modal)
- Create BOM (modal)
- Edit BOM (modal)
- Clone BOM (modal)
- Activate BOM Version (modal + overlap detection)
- Create Routing (modal)
- Edit Routing (modal)
```

### SETTINGS (Epic 1)
```
Essential:
GET  /settings              → Settings Dashboard (tabbed layout)
  ├─ /settings/organization → Organization form
  ├─ /settings/users       → Users list
  ├─ /settings/warehouses  → Warehouses list
  ├─ /settings/modules     → Module configuration (toggles)
  └─ /settings/appearance  → Dark mode + theme

Modal-based:
- Add User (modal)
- Edit User (modal)
- Create Warehouse (modal)
- Edit Warehouse (modal)
- Add Location (modal)
- Create Machine (modal)
- Configure Feature Toggles (modal)
```

---

## Lazy Loading Strategy (for fast initial load)

### Dashboard Load Priority
```
IMMEDIATE (render first):
- Header
- Stats Cards (skeleton)
- List table headers

BACKGROUND (load while user views):
- List table data (paginated, 20 items)
- Related data (detail counts, recent items)

ON DEMAND (lazy load):
- Detail tabs (load on tab click)
- Charts/visualizations (load after primary content)
- Historical data (load on scroll)
```

**Result:** Dashboard appears instantly, detailed info loads smoothly

### Detail Page Load Priority
```
IMMEDIATE:
- Header + Key Info
- Overview tab skeleton
- First table/section

BACKGROUND:
- Other tabs content (load on click)
- History tab (load on click)
- Audit trail (load on click)

ON DEMAND:
- Charts (if present)
- Related records
```

---

## Mobile Optimization Rules

✅ **Apply to ALL pages:**
- Tabs → Accordions (< 768px)
- Tables → Card view (< 768px)
- 2-column fields → 1-column (< 640px)
- Horizontal modals → Full viewport (< 640px)
- Buttons stack vertically (< 640px)
- No horizontal scroll anywhere

---

## Summary: Total Routes Needed

```
Planning:      5 essential routes
Production:    3 essential routes
Warehouse:     7 essential routes
Quality:       6 essential routes
Shipping:      6 essential routes
NPD:           3 essential routes
Technical:     7 essential routes
Settings:      6 essential routes (within settings)
───────────────────────────
TOTAL:        ~40 essential routes

MODALS (NOT routes):
~60+ modal-based actions (create, edit, delete, quick actions, wizards)
```

**Without modals:** Would need ~100+ routes
**With modals:** Only ~40 essential routes + modal APIs

---

## Implementation Guidelines

1. **Every list page includes:**
   - Create button (opens Create modal)
   - Filters & search
   - Inline actions (Edit, Delete buttons open modals)

2. **Every detail page includes:**
   - Edit button (opens Edit modal)
   - Delete button (opens Delete confirmation modal)
   - Tab/Accordion structure (no separate detail pages)

3. **Modal handling:**
   - Modal opens from list/detail (don't navigate)
   - Close modal = stay on same page
   - Success = update list/detail in place (if needed refresh specific row)

4. **Loading:**
   - Dashboard: load immediately, defer chart data
   - List: paginate, load first 20, load next page on scroll
   - Detail: load overview first, lazy-load other tabs
   - Don't load everything upfront

---

**Result: Fast, clean, modal-based UX with minimal subroutes!** 🚀
