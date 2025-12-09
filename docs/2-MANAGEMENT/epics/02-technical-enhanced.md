# Epic 2 Technical - Enhanced

**Status:** DONE (Core) + PLANNED (Enhancements)
**Module:** Technical
**PRD Reference:** `docs/1-BASELINE/product/modules/02-technical.md`
**Ostatnia aktualizacja:** 2025-12-09

---

## 1. Epic Summary

### Core (DONE - 28 stories)
Podstawowa funkcjonalnosc Technical Module:
- Products CRUD z 6 typami
- BOM z date-based versioning
- Routings jako reusable templates
- Allergen management (14 EU + custom)
- LP Genealogy i Traceability
- Recall Simulation

### Enhancements (PLANNED - 34+ stories)
Rozszerzenia bazujace na analizie konkurencji:
- Phase 2A: Products (6 stories)
- Phase 2B: BOMs (6 stories)
- Phase 2C: Routings (5 stories)
- Phase 2D: Allergens (4 stories)
- Phase 2E: Traceability (5 stories)
- Phase 2F: Settings & Reports (8 stories)

---

## 2. Completed Stories (Core - 28)

### Batch 1: Products (Stories 2.1-2.5)

| Story | Tytul | Status | Key Features |
|-------|-------|--------|--------------|
| 2.1 | Product list view | DONE | Filtering, sorting, pagination |
| 2.2 | Product CRUD | DONE | Create, update, archive |
| 2.3 | Product versioning | DONE | Auto-increment on edit |
| 2.4 | Product allergens | DONE | Contains/may_contain |
| 2.5 | Product type config | DONE | Custom types |

### Batch 2: BOMs (Stories 2.6-2.14)

| Story | Tytul | Status | Key Features |
|-------|-------|--------|--------------|
| 2.6 | BOM CRUD | DONE | Create, update, delete |
| 2.7 | BOM items management | DONE | Add/edit/remove items |
| 2.8 | BOM date-based versioning | DONE | X.Y format, auto-increment |
| 2.9 | BOM status workflow | DONE | Draft -> Active -> Phased Out |
| 2.10 | BOM cloning | DONE | Clone with new version |
| 2.11 | BOM overlap validation | DONE | Date overlap check |
| 2.12 | Conditional BOM items | DONE | Flags (organic, vegan...) |
| 2.13 | By-products in BOM | DONE | yield_percent |
| 2.14 | BOM costing calculation | DONE | Material cost sum |

### Batch 3: Routings (Stories 2.15-2.17)

| Story | Tytul | Status | Key Features |
|-------|-------|--------|--------------|
| 2.15 | Routing CRUD | DONE | Reusable templates |
| 2.16 | Routing operations | DONE | Sequence, duration, cost |
| 2.17 | Product-routing assignment | DONE | Via BOM.routing_id |

### Batch 4: Traceability (Stories 2.18-2.21)

| Story | Tytul | Status | Key Features |
|-------|-------|--------|--------------|
| 2.18 | LP genealogy structure | DONE | Parent-child links |
| 2.19 | Forward trace | DONE | Recursive CTE |
| 2.20 | Backward trace | DONE | Recursive CTE |
| 2.21 | Recall simulation | DONE | Impact analysis |

### Batch 5: Settings & Polish (Stories 2.22-2.28)

| Story | Tytul | Status | Key Features |
|-------|-------|--------|--------------|
| 2.22 | Technical settings | DONE | Module configuration |
| 2.23 | Field visibility config | DONE | Per-field settings |
| 2.24 | Routing restructure | DONE | Independent templates |
| 2.25 | BOM-production line assignment | DONE | Multi-line support |
| 2.26 | Allergen inheritance | DONE | From BOM to product |
| 2.27 | Product search/filter | DONE | Advanced filtering |
| 2.28 | BOM search/filter | DONE | Advanced filtering |

---

## 3. Enhancement Stories (Phase 2)

### Phase 2A: Products Enhancements

| Story | Tytul | Priority | Est. | Description |
|-------|-------|----------|------|-------------|
| 2.29 | Nutritional Information Schema | HIGH | 5d | New `product_nutritional` table with EU 1169/2011 fields |
| 2.30 | Nutritional Info UI | HIGH | 3d | Form for entering nutritional facts |
| 2.31 | Product Lifecycle States | HIGH | 2d | Add obsolete, discontinued, pending_approval statuses |
| 2.32 | Product Images Upload | LOW | 3d | Image upload (S3), thumbnails |
| 2.33 | Product Documents | MEDIUM | 4d | Document versioning, spec sheets |
| 2.34 | Product Categories Tree | MEDIUM | 3d | Hierarchical categories |

**Total Phase 2A:** 6 stories, ~20 days

### Phase 2B: BOM Enhancements

| Story | Tytul | Priority | Est. | Description |
|-------|-------|----------|------|-------------|
| 2.35 | BOM Comparison API | HIGH | 3d | Compare two BOM versions, return diff |
| 2.36 | BOM Comparison UI | HIGH | 3d | Visual diff component |
| 2.37 | BOM Costing Summary | HIGH | 3d | Total cost breakdown (material, labor, overhead) |
| 2.38 | Phantom BOMs | MEDIUM | 5d | Sub-assemblies without inventory |
| 2.39 | BOM Import/Export | MEDIUM | 4d | CSV/Excel import, export |
| 2.40 | BOM Where-Used Report | MEDIUM | 2d | Component usage report |

**Total Phase 2B:** 6 stories, ~20 days

### Phase 2C: Routing Enhancements

| Story | Tytul | Priority | Est. | Description |
|-------|-------|----------|------|-------------|
| 2.41 | Setup vs Run Time | MEDIUM | 2d | Separate setup_minutes and run_minutes_per_unit |
| 2.42 | Labor Requirements | MEDIUM | 3d | Crew size, skill level per operation |
| 2.43 | Tool Requirements | LOW | 2d | Tool assignment per operation |
| 2.44 | Machine Capability Matching | MEDIUM | 3d | Filter machines by product type |
| 2.45 | Operation Dependencies | LOW | 3d | Parallel vs sequential operations |

**Total Phase 2C:** 5 stories, ~13 days

### Phase 2D: Allergen Enhancements

| Story | Tytul | Priority | Est. | Description |
|-------|-------|----------|------|-------------|
| 2.46 | Cross-Contamination Levels | MEDIUM | 3d | Risk levels per allergen pair |
| 2.47 | Cleaning Validation Rules | MEDIUM | 3d | Required cleaning between changeovers |
| 2.48 | Allergen Matrix Report | MEDIUM | 2d | Product x Allergen matrix view |
| 2.49 | Allergen Declaration Generator | LOW | 2d | Print-ready allergen statements |

**Total Phase 2D:** 4 stories, ~10 days

### Phase 2E: Traceability Enhancements

| Story | Tytul | Priority | Est. | Description |
|-------|-------|----------|------|-------------|
| 2.50 | Batch Genealogy Visualization | HIGH | 5d | Interactive D3.js/React Flow tree |
| 2.51 | Recall Drill Timer | MEDIUM | 2d | Timed drill with metrics |
| 2.52 | Traceability Export | MEDIUM | 3d | XML/JSON export for auditors |
| 2.53 | Mock Recall Scheduling | LOW | 2d | Scheduled recall drills |
| 2.54 | Customer Notification Templates | LOW | 2d | Email templates for recall notices |

**Total Phase 2E:** 5 stories, ~14 days

### Phase 2F: Settings & Reports

| Story | Tytul | Priority | Est. | Description |
|-------|-------|----------|------|-------------|
| 2.55 | Enhanced Technical Settings | MEDIUM | 2d | New toggles for Phase 2 features |
| 2.56 | Product Master Report | MEDIUM | 2d | Export all products with details |
| 2.57 | BOM Structure Report | MEDIUM | 2d | Multi-level BOM explosion |
| 2.58 | Cost Roll-Up Report | HIGH | 3d | Full cost calculation per product |
| 2.59 | Allergen Summary Report | MEDIUM | 2d | All products with allergens |
| 2.60 | Traceability Audit Report | MEDIUM | 2d | LP movement history |
| 2.61 | Product Lifecycle Report | LOW | 2d | Products by lifecycle state |
| 2.62 | BOM Version History Report | LOW | 2d | All BOM changes over time |

**Total Phase 2F:** 8 stories, ~17 days

---

## 4. Story Details (Selected High Priority)

### Story 2.29: Nutritional Information Schema

**As a** Technical Manager
**I want to** store nutritional information for products
**So that** we can comply with EU 1169/2011 labeling requirements

**Acceptance Criteria:**

| ID | Criteria | Priority |
|----|----------|----------|
| AC-2.29.1 | New table `product_nutritional` with fields: energy_kj, energy_kcal, fat, saturates, carbohydrates, sugars, protein, salt, fibre | Must |
| AC-2.29.2 | Fields per 100g and per serving | Must |
| AC-2.29.3 | Reference Intake % calculation | Should |
| AC-2.29.4 | RLS by org_id | Must |
| AC-2.29.5 | API endpoints: GET/PUT /api/technical/products/:id/nutritional | Must |

**Technical Notes:**
```sql
CREATE TABLE product_nutritional (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id) UNIQUE,
  serving_size NUMERIC,
  serving_unit VARCHAR(20),
  energy_kj_100g NUMERIC,
  energy_kcal_100g NUMERIC,
  fat_100g NUMERIC,
  saturates_100g NUMERIC,
  carbohydrates_100g NUMERIC,
  sugars_100g NUMERIC,
  protein_100g NUMERIC,
  salt_100g NUMERIC,
  fibre_100g NUMERIC,
  -- per serving (calculated)
  energy_kj_serving NUMERIC,
  energy_kcal_serving NUMERIC,
  -- ... other per serving fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Story 2.35: BOM Comparison API

**As a** Technical Manager
**I want to** compare two BOM versions
**So that** I can see what changed between versions

**Acceptance Criteria:**

| ID | Criteria | Priority |
|----|----------|----------|
| AC-2.35.1 | GET /api/technical/boms/compare?v1={id1}&v2={id2} | Must |
| AC-2.35.2 | Response includes: added[], removed[], changed[], unchanged[] | Must |
| AC-2.35.3 | Changed items show field-level diff | Must |
| AC-2.35.4 | Comparison includes header fields (output_qty, routing_id...) | Should |
| AC-2.35.5 | Handles cross-product comparison (warning only) | Should |

**Response Schema:**
```typescript
interface BOMComparison {
  bom_v1: {
    id: string
    version: string
    effective_from: string
  }
  bom_v2: {
    id: string
    version: string
    effective_from: string
  }
  header_changes: {
    field: string
    old_value: any
    new_value: any
  }[]
  items: {
    added: BOMItem[]
    removed: BOMItem[]
    changed: {
      item_v1: BOMItem
      item_v2: BOMItem
      changes: { field: string; old: any; new: any }[]
    }[]
    unchanged: BOMItem[]
  }
}
```

---

### Story 2.50: Batch Genealogy Visualization

**As a** QC Manager
**I want to** see an interactive visual tree of LP genealogy
**So that** I can quickly understand material flow

**Acceptance Criteria:**

| ID | Criteria | Priority |
|----|----------|----------|
| AC-2.50.1 | Interactive tree/graph visualization (React Flow or D3.js) | Must |
| AC-2.50.2 | Click node to see LP details | Must |
| AC-2.50.3 | Color coding by status (available=green, consumed=gray, shipped=blue) | Must |
| AC-2.50.4 | Zoom, pan, export to PNG | Should |
| AC-2.50.5 | Toggle forward/backward/both directions | Must |
| AC-2.50.6 | Search/highlight specific LP in tree | Should |

**Technical Approach:**
- Use `reactflow` library
- Custom node component with LP summary
- Edge labels showing quantity_consumed
- Layout algorithm: dagre for hierarchical

---

## 5. Dependencies

### Phase 2A Dependencies
- None (extends existing products)

### Phase 2B Dependencies
- 2.35 -> 2.36 (API before UI)
- 2.38 requires production module changes

### Phase 2C Dependencies
- 2.44 requires machine settings enhancement

### Phase 2D Dependencies
- None

### Phase 2E Dependencies
- 2.50 requires existing trace APIs

### Phase 2F Dependencies
- Reports depend on corresponding data being available

---

## 6. Prioritization Recommendation

### Sprint N+1 (Must Have / Quick Wins)

| Story | Est. | Reason |
|-------|------|--------|
| 2.31 | 2d | Product lifecycle - simple, high value |
| 2.35 | 3d | BOM comparison API - requested feature |
| 2.36 | 3d | BOM comparison UI |
| 2.41 | 2d | Setup/Run time - simple schema change |

**Total:** 10 days

### Sprint N+2 (High Priority)

| Story | Est. | Reason |
|-------|------|--------|
| 2.29 | 5d | Nutritional schema - regulatory requirement |
| 2.30 | 3d | Nutritional UI |
| 2.50 | 5d | Genealogy viz - high UX impact |
| 2.37 | 3d | BOM costing summary |

**Total:** 16 days

### Sprint N+3 (Medium Priority)

| Story | Est. | Reason |
|-------|------|--------|
| 2.46 | 3d | Cross-contamination |
| 2.48 | 2d | Allergen matrix |
| 2.52 | 3d | Traceability export |
| 2.40 | 2d | BOM where-used |
| 2.58 | 3d | Cost roll-up report |

**Total:** 13 days

### Backlog (Lower Priority)

- 2.32 Product images
- 2.33 Product documents
- 2.34 Categories tree
- 2.38 Phantom BOMs
- 2.39 BOM import/export
- 2.42-2.45 Routing enhancements
- 2.47, 2.49 Allergen extras
- 2.51, 2.53, 2.54 Traceability extras
- 2.55-2.62 Reports

---

## 7. Success Metrics

### Phase 2 Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Feature parity with CSB | 70% | Feature checklist |
| BOM comparison usage | 20+ comparisons/week | Analytics |
| Genealogy viz adoption | 50% of recall simulations use viz | Analytics |
| Nutritional data entry | 30% of FG products have nutritional | Database query |
| Allergen matrix export | 10+ exports/month | Analytics |

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Genealogy viz render time | < 2s for 100 nodes | Performance test |
| BOM comparison response | < 500ms | API metrics |
| Report generation | < 5s for 1000 products | Performance test |

---

## 8. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Nutritional calculation complexity | HIGH | MEDIUM | Start with simple EU format, add FDA later |
| Genealogy viz performance | HIGH | MEDIUM | Limit initial depth, lazy load children |
| Phantom BOM production impact | HIGH | LOW | Feature flag, extensive testing |
| Cross-contamination data entry burden | MEDIUM | MEDIUM | Optional feature, bulk import |

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-09 | Initial epic with core 28 stories |
| 2.0 | 2025-12-09 | Added 34 enhancement stories based on competitive analysis |
