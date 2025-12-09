# Technical Gaps Analysis

**Data analizy:** 2025-12-09
**Analizowane katalogi:**
- `apps/frontend/lib/services/`
- `apps/frontend/app/api/`
- `apps/frontend/lib/supabase/migrations/`

---

## 1. Service Layer Status

### Pelna implementacja (Full Implementation)

| Service | LOC | Pattern | Missing Features |
|---------|-----|---------|------------------|
| `warehouse-service.ts` | 640 | CRUD + Cache | - |
| `work-order-service.ts` | 841 | CRUD + Status | - |
| `purchase-order-service.ts` | 520 | CRUD + Status | - |
| `license-plate-service.ts` | 633 | CRUD + Status + FEFO | - |
| `transfer-order-service.ts` | 1427 | CRUD + Lines + Ship | - |
| `bom-service.ts` | 700 | CRUD + Version + Lines | - |
| `grn-service.ts` | 213 | CRUD + LP Creation | - |
| `receiving-service.ts` | 966 | PO/TO/Manual Receive | - |
| `inventory-count-service.ts` | 776 | Count + Variance + Reconcile | - |
| `genealogy-service.ts` | ~400 | Trace Forward/Backward | - |
| `traceability-service.ts` | ~300 | Links + Recall | - |

### Czesciowa implementacja (Partial)

| Service | Issue | TODO/FIXME |
|---------|-------|------------|
| `tax-code-service.ts` | Brak sprawdzenia uzycia w PO Lines | 4x TODO Epic 3 |
| `allergen-service.ts` | Brak JOIN z product_allergens | 4x TODO Epic 2 |
| `machine-service.ts` | Brak JOIN z production_lines | 3x TODO Story 1.8 |
| `production-line-service.ts` | Brak sprawdzenia aktywnych WO | 4x TODO Epic 3 |
| `location-service.ts` | Brak cache invalidation events | 3x TODO AC-005.8 |
| `module-service.ts` | Brak query affected entities | 1x TODO Epic 2-8 |
| `session-service.ts` | Brak Realtime event dla logout | 1x TODO Task 8 |

### Brak testow jednostkowych

| Service | Test File | Status |
|---------|-----------|--------|
| `warehouse-service.ts` | NIE | BRAK |
| `work-order-service.ts` | NIE | BRAK |
| `purchase-order-service.ts` | NIE | BRAK |
| `license-plate-service.ts` | NIE | BRAK |
| `transfer-order-service.ts` | NIE | BRAK |
| `bom-service.ts` | NIE | BRAK |
| `barcode-generator-service.ts` | TAK | OK |
| `user-validation.ts` | TAK | OK |
| `dashboard-service.ts` | TAK | OK |
| `genealogy-service.ts` | TAK | OK |
| `recall-service.ts` | TAK | OK |

---

## 2. API Endpoints Status

### Settings Module (`/api/settings/`)

| Endpoint | GET | POST | PUT | DELETE | Notes |
|----------|-----|------|-----|--------|-------|
| `/users` | OK | OK | OK | OK | Pelna implementacja |
| `/warehouses` | OK | OK | OK | OK | Pelna implementacja |
| `/locations` | OK | OK | OK | OK | Pelna implementacja |
| `/machines` | OK | OK | OK | OK | Pelna implementacja |
| `/lines` | OK | OK | OK | OK | Pelna implementacja |
| `/allergens` | OK | OK | OK | OK | Pelna implementacja |
| `/tax-codes` | OK | OK | OK | OK | Pelna implementacja |
| `/invitations` | OK | OK | - | OK | Resend endpoint OK |
| `/organization` | OK | - | OK | - | Logo upload OK |
| `/modules` | OK | - | OK | - | Toggle modules |
| `/wizard` | OK | - | OK | - | Setup wizard |

### Planning Module (`/api/planning/`)

| Endpoint | GET | POST | PUT | DELETE | Notes |
|----------|-----|------|-----|--------|-------|
| `/suppliers` | OK | OK | OK | OK | + products subresource |
| `/purchase-orders` | OK | OK | OK | OK | + lines, status, approvals |
| `/work-orders` | OK | OK | OK | OK | + operations |
| `/transfer-orders` | OK | OK | OK | OK | + lines, ship, LPs |

### Technical Module (`/api/technical/`)

| Endpoint | GET | POST | PUT | DELETE | Notes |
|----------|-----|------|-----|--------|-------|
| `/products` | OK | OK | OK | OK | + history, allergens |
| `/product-types` | OK | OK | OK | OK | OK |
| `/boms` | OK | OK | OK | OK | + items, alternatives, allergens |
| `/routings` | OK | OK | OK | OK | + operations |
| `/tracing` | OK | - | - | - | forward, backward, recall |

### Production Module (`/api/production/`)

| Endpoint | GET | POST | PUT | DELETE | Notes |
|----------|-----|------|-----|--------|-------|
| `/work-orders/[id]/start` | - | OK | - | - | OK |
| `/work-orders/[id]/pause` | - | OK | - | - | OK |
| `/work-orders/[id]/resume` | - | OK | - | - | OK |
| `/work-orders/[id]/complete` | - | OK | - | - | OK |
| `/work-orders/[id]/materials` | OK | - | - | - | + reserve, reservations |
| `/work-orders/[id]/operations` | OK | - | - | - | + start, complete |
| `/work-orders/[id]/outputs` | OK | OK | - | - | + preview |
| `/dashboard/kpis` | OK | - | - | - | OK |
| `/dashboard/active-wos` | OK | - | - | - | OK |
| `/dashboard/alerts` | OK | - | - | - | OK |

### Warehouse Module (`/api/warehouse/`)

| Endpoint | GET | POST | PUT | DELETE | Notes |
|----------|-----|------|-----|--------|-------|
| `/license-plates` | OK | OK | OK | - | + status, move, split, merge |
| `/license-plates/[id]/print` | - | OK | - | - | **STUB ONLY** |
| `/license-plates/[id]/trace` | OK | - | - | - | forward, backward |
| `/license-plates/[id]/genealogy` | OK | - | - | - | OK |
| `/grns` | OK | OK | - | - | + receive, complete |
| `/asns` | OK | OK | OK | - | + items |
| `/pallets` | OK | OK | OK | - | + LPs |
| `/inventory-counts` | OK | OK | - | - | + scan, complete, reconcile |
| `/receiving/from-po` | - | OK | - | - | OK |
| `/receiving/from-to` | - | OK | - | - | OK |
| `/receiving/manual` | - | OK | - | - | OK |
| `/settings` | OK | - | OK | - | OK |

### Scanner Module (`/api/scanner/`)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `/validate-barcode` | OK | **TODO: pallet, PO lookup** |
| `/operations` | OK | **TODO: warehouse-level permissions** |
| `/workflows/start` | OK | OK |
| `/workflows/[id]/scan` | OK | OK |
| `/work-orders` | OK | + requirements, scan-component |
| `/lookup` | OK | OK |
| `/sync-offline-queue` | OK | **NOT IMPLEMENTED** |
| `/session/refresh` | OK | OK |

### Brakujace Endpoints (Missing)

| Endpoint | Module | Priority | Reason |
|----------|--------|----------|--------|
| `/api/settings/warehouse` (UI) | Settings | HIGH | No UI page for warehouse settings |
| `/api/quality/*` | Quality | Phase 2 | Epic 6 |
| `/api/shipping/*` | Shipping | Phase 2 | Epic 7 |

---

## 3. Database Gaps

### Tabele istniejace (57 migrations)

| Category | Tables | Status |
|----------|--------|--------|
| Core | organizations, users, user_sessions, user_invitations | OK |
| Settings | warehouses, locations, machines, production_lines, allergens, tax_codes | OK |
| Technical | products, product_types, boms, bom_items, routings, routing_operations | OK |
| Planning | suppliers, supplier_products, purchase_orders, po_lines, work_orders, transfer_orders, to_lines | OK |
| Production | wo_materials, wo_operations, wo_pause_events, wo_material_reservations, wo_consumptions, production_outputs | OK |
| Warehouse | license_plates, lp_movements, lp_genealogy, grn, grn_items, asns, asn_items, pallets, inventory_counts, inventory_count_items | OK |
| Traceability | traceability_links, recall_simulations | OK |

### Brakujace tabele (dla Phase 2)

| Table | Epic | Purpose |
|-------|------|---------|
| `sales_orders` | 7 | Shipping - Sales Order header |
| `so_lines` | 7 | Shipping - SO line items |
| `shipments` | 7 | Shipping - Shipment tracking |
| `pick_lists` | 7 | Shipping - Pick list header |
| `pick_list_items` | 7 | Shipping - Pick list items |
| `packages` | 7 | Shipping - Package tracking |
| `qa_results` | 6 | Quality - Test results |
| `qa_specifications` | 6 | Quality - Product specs |
| `quality_holds` | 6 | Quality - Hold records |
| `ncr` | 6 | Quality - Non-conformance reports |
| `certificates_of_analysis` | 6 | Quality - CoA documents |

### Brakujace indeksy (Performance)

| Table | Missing Index | Impact |
|-------|---------------|--------|
| `license_plates` | `(org_id, expiry_date)` | FEFO queries slow |
| `wo_materials` | `(wo_id, is_by_product)` | Byproduct filtering |
| `lp_movements` | `(lp_id, created_at)` | Movement history |
| `grn_items` | `(grn_id, product_id)` | GRN item lookup |

### RLS Status

| Table | RLS Enabled | Policy Type | Notes |
|-------|-------------|-------------|-------|
| Most tables | YES | org_id based | OK |
| `inventory_counts` | YES | org_id + service_role | OK |
| `inventory_count_items` | YES | Via count.org_id | OK |

**Risk:** RLS policies need audit - nie wszystkie tabele mogly byc sprawdzone.

---

## 4. Cross-Module Issues

### Duplikacja kodu - getCurrentOrgId()

15 serwisow implementuje wlasna kopie `getCurrentOrgId()` lub `getCurrentUserOrgId()`:

```
purchase-order-service.ts
work-order-service.ts
bom-service.ts
transfer-order-service.ts
routing-service.ts
bom-item-alternative-service.ts
bom-item-service.ts
po-line-service.ts
machine-service.ts
wizard-service.ts
module-service.ts
tax-code-service.ts
production-line-service.ts
allergen-service.ts
warehouse-service.ts
```

**Rekomendacja:** Extract do `lib/auth/get-user-context.ts`

### Niespojne nazewnictwo klientow Supabase

| Pattern | Services Count | Files |
|---------|---------------|-------|
| `createServerSupabaseAdmin()` | 15+ | Older services |
| `createAdminClient()` | 10+ | Newer services |

**Rekomendacja:** Ustandaryzowac na jednym - `createAdminClient()` (nowszy pattern)

### Niespojne typy ServiceResult

| Pattern | Example |
|---------|---------|
| `ServiceResult<T>` | work-order-service, transfer-order-service |
| `WarehouseServiceResult<T>` | warehouse-service |
| `{ success, data?, error? }` | grn-service (no type) |
| Throws Error | license-plate-service |

**Rekomendacja:** Ustandaryzowac na `ServiceResult<T>` z common types.

### Brakujace integracje

| From | To | Missing |
|------|-----|---------|
| WO Complete | LP Create | OUTPUT_REGISTRATION - brakuje auto-LP dla output |
| PO Receive | Supplier Performance | Brak metryk dostawcy |
| GRN | Quality | Brak QA status assignment (Phase 2) |
| LP Move | Audit Log | Brak pelnego audit trail |

---

## 5. Technical Debt

### TODO/FIXME w kodzie

| Location | Type | Description | Priority |
|----------|------|-------------|----------|
| `tax-code-service.ts:297` | TODO | Query po_lines for usage check | Medium |
| `tax-code-service.ts:417` | TODO | JOIN with po_lines for usage count | Medium |
| `tax-code-service.ts:468` | TODO | Check PO line usage before delete | Medium |
| `tax-code-service.ts:484` | TODO | Query po_lines count | Medium |
| `allergen-service.ts:385` | TODO | JOIN with product_allergens | Medium |
| `allergen-service.ts:479` | TODO | JOIN with product_allergens for counts | Medium |
| `allergen-service.ts:555` | TODO | Check allergen usage in products | Medium |
| `allergen-service.ts:571` | TODO | Query product_allergens count | Medium |
| `machine-service.ts:369` | TODO | Query work_orders for active WOs | Low |
| `machine-service.ts:482` | TODO | JOIN with production_lines | Low |
| `machine-service.ts:589` | TODO | JOIN with production_lines for codes | Low |
| `machine-service.ts:653` | TODO | Check active WOs before delete | Low |
| `production-line-service.ts:333` | TODO | Use generic error message | Low |
| `production-line-service.ts:480` | TODO | Query work_orders for active WOs | Low |
| `production-line-service.ts:747` | TODO | Add comment for LIKE escaping | Low |
| `production-line-service.ts:762` | TODO | Implement warehouse name sorting | Low |
| `production-line-service.ts:835` | TODO | Check active WOs before delete | Low |
| `production-line-service.ts:851` | TODO | Query work_orders count | Low |
| `location-service.ts:185` | TODO | Emit cache invalidation event | Medium |
| `location-service.ts:310` | TODO | Emit cache invalidation event | Medium |
| `location-service.ts:545` | TODO | Emit cache invalidation event | Medium |
| `module-service.ts:125` | TODO | Query affected entities count | Low |
| `session-service.ts:153` | TODO | Emit Realtime event for logout | Medium |
| `material-reservation-service.ts:206` | TODO | Get consume_whole_lp from bom_items | Low |
| `settings/lines/route.ts:22` | TODO | Add rate limiting | Medium |
| `scanner/operations/route.ts:61` | TODO | Implement warehouse permissions | Medium |
| `scanner/validate-barcode/route.ts:226` | TODO | Implement pallet lookup | Medium |
| `scanner/validate-barcode/route.ts:232` | TODO | Implement PO lookup | Medium |
| `warehouse/license-plates/[id]/print/route.ts:94` | TODO | Send to actual printer | **HIGH** |
| `warehouse/grns/[id]/receive/route.ts:224` | TODO | Queue print job | **HIGH** |
| `production/work-orders/[id]/outputs/route.ts:99` | TODO | Check for by-products | Medium |
| `WorkOrdersSpreadsheet.tsx:469` | TODO | Create work orders via API | Low |
| `settings/machines/page.tsx:177` | TODO | Show actual line codes | Low |

### Hardcoded Values

| Location | Value | Should Be |
|----------|-------|-----------|
| Various services | `limit: 50` | Config or param |
| LP service | `'LP-' + timestamp` | Configurable prefix |
| Number generators | Year format patterns | Config |

### Missing Error Handling

| Area | Issue |
|------|-------|
| Bulk operations | Brak partial success handling |
| External API calls | Brak retry logic |
| File uploads | Brak size/type validation w niektorych miejscach |

### Performance Issues

| Area | Issue | Impact |
|------|-------|--------|
| N+1 Queries | Some services fetch related data in loops | Slow list views |
| Missing pagination | Some list endpoints don't paginate | Memory issues |
| No query caching | Only warehouse-service has cache | DB load |

---

## 6. Recommendations

### Immediate (Phase 1 completion)

1. **HIGH: Fix Print Integration**
   - Implement ZPL label generation
   - Add IPP printer support
   - Connect auto-print to GRN receive flow

2. **HIGH: Add Warehouse Settings UI**
   - Create `/settings/warehouse` page
   - Connect to existing API

3. **MEDIUM: Fix Scanner PO Barcode**
   - Implement PO lookup in barcode scanner
   - Change receive flow to scan-first

4. **MEDIUM: GRN LP Navigation**
   - Add click handler to navigate to LP detail

### Short-term (Phase 2 prep)

5. **Extract Common Auth Functions**
   - Create `lib/auth/get-user-context.ts`
   - Refactor 15 services to use shared function

6. **Standardize Supabase Client Usage**
   - Migrate to `createAdminClient()` everywhere
   - Document when to use admin vs user client

7. **Add Missing Tests**
   - Priority: warehouse-service, work-order-service, transfer-order-service
   - Target: 70% coverage

8. **Add Missing Indexes**
   - `license_plates(org_id, expiry_date)`
   - `wo_materials(wo_id, is_by_product)`
   - `lp_movements(lp_id, created_at)`

9. **RLS Security Audit**
   - Verify all tables have proper policies
   - Test cross-org isolation

### Long-term (Phase 3+)

10. **Implement Rate Limiting**
    - Add to critical API endpoints

11. **Add Performance Monitoring**
    - Establish baseline metrics
    - Add query logging

12. **Complete TODO Items**
    - Address all TODO Epic 2/3 items
    - Implement cache invalidation events

13. **Standardize Error Handling**
    - Create common ServiceResult type
    - Implement consistent error codes

---

## Appendix: File Structure

```
apps/frontend/lib/services/
  44 files total
  ~15,000 LOC estimated

apps/frontend/app/api/
  ~100 route files
  Modules: dashboard, settings, planning, technical, production, warehouse, scanner, webhooks, cron

apps/frontend/lib/supabase/migrations/
  57 migration files
  ~50 tables created
```

---

**Document generated by SENIOR-DEV agent analysis**
