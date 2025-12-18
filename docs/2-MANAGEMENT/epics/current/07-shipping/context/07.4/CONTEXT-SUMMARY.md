# Story 07.4 Context - Summary

**Created:** 2025-12-18
**Story:** 07.4 - SO Line Pricing + Totals Calculation
**Epic:** 07-shipping
**Complexity:** S (2 days)
**Phase:** 1A

## Context Files Overview

This directory contains 5 YAML context files that provide complete AI agent instructions for implementing Story 07.4:

### 1. _index.yaml (Entry Point)
- **Purpose:** Story metadata, dependencies, file references
- **Audience:** All agents (read first)
- **Key Info:**
  - Dependencies: 07.2 (Sales Orders CRUD), 02.1 (Products)
  - Blocks: 07.5 (SO Confirmation)
  - Phase 1A, Complexity S
  - 2-day estimate

### 2. database.yaml
- **Purpose:** Database migration specifications
- **Audience:** BACKEND-DEV
- **Contents:**
  - Migration: Add `discount` JSONB field to `sales_order_lines`
  - Discount format: `{type: 'percent'|'fixed', value: decimal}`
  - Query patterns for pricing calculations
  - Validation rules for discount field
  - Index optimization notes

### 3. api.yaml
- **Purpose:** Backend API endpoint specifications
- **Audience:** BACKEND-DEV
- **Contents:**
  - POST `/api/shipping/sales-orders/:id/lines` - Add line with auto-price
  - PUT `/api/shipping/sales-orders/:id/lines/:lineId` - Update line with recalculation
  - DELETE `/api/shipping/sales-orders/:id/lines/:lineId` - Delete and recalculate total
  - PricingService methods: `getProductPrice`, `calculateLineTotal`, `calculateOrderTotal`
  - Validation schema with Zod examples
  - Error handling patterns
  - Integration notes

### 4. frontend.yaml
- **Purpose:** Frontend component specifications
- **Audience:** FRONTEND-DEV (primary)
- **Contents:**
  - `SOLineForm` - Form to add/edit SO lines with pricing
  - `DiscountInput` - Composite input for discount type and value
  - `SOLineTable` - Table displaying lines with pricing columns
  - `SOTotalDisplay` - Prominent SO total display
  - Custom hooks for pricing calculations
  - Service layer integrations
  - TypeScript type definitions
  - Wireframe references from SHIP-007
  - Accessibility and performance notes

### 5. tests.yaml
- **Purpose:** Comprehensive test specifications
- **Audience:** BACKEND-DEV, FRONTEND-DEV (QA)
- **Contents:**
  - 12 Acceptance Criteria (mapped to test cases)
  - Unit Tests (pricing-service): 9 test cases
  - Integration Tests (API): 10 test cases
  - Frontend Component Tests: 6 test cases
  - E2E Tests (Playwright): Happy path + discount scenarios + validation
  - Test fixtures with sample data
  - Coverage targets (80%+ services, 60%+ components)

## Key Implementation Details

### Pricing Calculation
- **Line Total:** `quantity * unit_price - discount`
- **SO Total:** `SUM(all line_total)`
- **Rounding:** Line totals to 2 decimals (currency precision)
- **Decimal Precision:** qty/price as DECIMAL(15,4), totals as DECIMAL(15,2)

### Discount Types
1. **Percentage:** `{type: 'percent', value: 10}` = 10% off
2. **Fixed Amount:** `{type: 'fixed', value: 50}` = 50 units off
3. **None:** `null` = no discount

### Auto-Pricing
- Product price auto-populates from `products.std_price`
- Manual override allowed before SO confirmation
- Warning shown if product has no std_price (user must enter manually)

### Recalculation Triggers
- Line add → Calculate line_total, update SO total
- Line edit (qty/price/discount) → Recalculate line_total, update SO total
- Line delete → Update SO total
- Real-time display in form (no page refresh needed)

### Validation Rules
- Quantity must be > 0
- Unit price must be > 0
- Discount must be >= 0
- Percentage discount must be <= 100%
- Price override only allowed when SO status = 'draft'

### RLS & Security
- All tables use org_id filter (multi-tenant isolation)
- Role-based access: sales, manager, admin can create/edit lines
- Admin-only: view pricing agreements (Phase 2)

## Wireframe Integration

**Reference:** `docs/3-ARCHITECTURE/ux/wireframes/SHIP-007-sales-order-detail.md`

**Pricing Sections:**
- **Line Items Table:** Columns include unit_price, discount, line_total
- **SO Total Display:** Prominent at bottom showing order total
- **Mobile Responsive:** Compact view shows subset of columns

## Dependencies

**Required (must complete first):**
- Story 07.2 - Sales Orders CRUD (provides SO and SO line tables)
- Story 02.1 - Products module (provides products.std_price)

**Blocks:**
- Story 07.5 - SO Confirmation workflow (needs validated pricing)

## File Locations (for implementation)

### Database
- Migration: `supabase/migrations/061_add_discount_to_so_lines.sql`

### Backend
- Service: `apps/frontend/lib/services/pricing-service.ts`
- API: `apps/frontend/app/api/shipping/sales-orders/[id]/lines/route.ts`
- Validation: `apps/frontend/lib/validation/sales-order-line-schema.ts`

### Frontend
- Components: `apps/frontend/app/(authenticated)/shipping/sales-orders/[id]/components/`
  - `SOLineForm.tsx`
  - `DiscountInput.tsx`
  - `SOLineTable.tsx`
  - `SOTotalDisplay.tsx`
- Hooks: `apps/frontend/lib/hooks/usePricingCalculation.ts`
- Services: `apps/frontend/lib/services/shipping-service.ts`

### Tests
- Unit: `apps/frontend/lib/services/__tests__/pricing-service.test.ts`
- Integration: `apps/frontend/app/api/shipping/__tests__/sales-order-lines.test.ts`
- Component: `apps/frontend/app/(authenticated)/shipping/__tests__/SOLineForm.test.tsx`
- E2E: `apps/frontend/e2e/shipping/sales-order-pricing.spec.ts`

## Testing Checklist

### Unit Tests (80%+)
- [ ] calculateLineTotal with quantity and price
- [ ] calculateLineTotal with percentage discount
- [ ] calculateLineTotal with fixed discount
- [ ] calculateLineTotal rounding to 2 decimals
- [ ] calculateOrderTotal sums all lines
- [ ] getProductPrice returns std_price

### Integration Tests (80%+)
- [ ] POST new line auto-populates price
- [ ] POST with manual price override
- [ ] POST with discount applied
- [ ] PUT updates line and recalculates
- [ ] DELETE removes line and updates total
- [ ] Product without std_price handled

### Frontend Tests (70%+)
- [ ] Auto-populate price on product select
- [ ] Show warning if product has no price
- [ ] Real-time line total calculation
- [ ] Real-time calculation with discount
- [ ] Discount input validation
- [ ] SOTotalDisplay shows correct sum

### E2E Tests
- [ ] Happy path: create SO, add lines, verify totals
- [ ] Discount scenarios: percent and fixed
- [ ] Validation prevents invalid data
- [ ] Pricing locked after SO confirmation

## Notes

- This story focuses on MVP pricing only (Phase 1)
- Phase 2 additions: customer-specific pricing, payment terms, credit limits
- Phase 3 additions: multi-currency, bulk pricing tiers, historical tracking, tax calculation
- All calculations are client-side (no expensive queries) for performance
- Precision critical: DECIMAL(15,4) for quantities/prices, DECIMAL(15,2) for totals

## Next Steps

1. **Backend Dev:** Create migration, implement PricingService, update API endpoints
2. **Frontend Dev:** Build SOLineForm, DiscountInput, SOTotalDisplay components
3. **Testing:** Run unit/integration tests, then E2E flow validation
4. **Review:** Code review before merging to main
5. **PR:** Create PR from newDoc branch to main

---

**Context Generated:** 2025-12-18
**Last Updated:** 2025-12-18
**Version:** 1.0
