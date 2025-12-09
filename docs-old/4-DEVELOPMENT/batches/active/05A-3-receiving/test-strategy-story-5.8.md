# Test Strategy: Story 5.8 - ASN Creation

**Story:** 5.8 ASN Creation
**Batch:** 05A-3 Receiving
**Date:** 2025-12-07
**Status:** RED (All tests failing - implementation pending)

---

## Test Strategy Overview

### Coverage Target: 90%
**Rationale:** ASN creation is critical for warehouse receiving workflow. High coverage ensures data quality and prevents receiving errors.

### Test Types

| Type | Count | Files | Purpose |
|------|-------|-------|---------|
| E2E | 19 tests | `story-5.8-asn-creation.spec.ts` | Full user workflow validation |
| Integration | 0 | N/A | Will add API tests after backend implementation |
| Unit | 0 | N/A | No complex logic requiring unit tests yet |

---

## Acceptance Criteria Coverage

### AC-5.8.1: ASN Creation Modal
**Tests:** 3 E2E tests
- ✅ Display "Create ASN" button on confirmed PO
- ✅ Open ASN modal when clicking button
- ✅ Show all required form fields (PO#, arrival date, carrier, tracking)

### AC-5.8.2: ASN Items Pre-filled
**Tests:** 3 E2E tests
- ✅ Pre-fill ASN items from PO lines
- ✅ Display product, qty, UoM for each item
- ✅ Allow editing supplier batch, manufacture date, expiry date

### AC-5.8.3: ASN Number Auto-generation
**Tests:** 3 E2E tests
- ✅ Create ASN with auto-generated number (ASN-YYYYMMDD-NNNN format)
- ✅ Validate expected_arrival_date is required
- ✅ Allow carrier and tracking to be optional

### AC-5.8.4: ASN Linked to PO
**Tests:** 2 E2E tests
- ✅ Link ASN to PO via po_id
- ✅ Show ASN in PO detail page

### AC-5.8.5: ASN Status Tracking
**Tests:** 1 E2E test
- ✅ Set ASN status to "pending" on creation

### Additional Coverage
**Tests:** 7 E2E tests
- ✅ ASN list page displays correctly
- ✅ ASN appears in list after creation
- ✅ Filter ASN list by status
- ✅ ASN detail page displays
- ✅ "Receive Goods" button visible (for Story 5.11)
- ⚠️ API validation (placeholder - needs backend)

---

## Test Scenarios

### Happy Path
1. User navigates to confirmed PO
2. Clicks "Create ASN"
3. Modal opens with PO number pre-filled
4. User enters expected arrival date (tomorrow)
5. Optionally enters carrier and tracking
6. Items pre-filled from PO lines
7. User edits supplier batch/dates
8. Saves ASN
9. ASN created with auto-number (ASN-YYYYMMDD-NNNN)
10. ASN visible in list with status "pending"

### Edge Cases
- **Empty carrier/tracking:** Should succeed (optional fields)
- **Missing expected_arrival_date:** Validation error shown
- **PO with no lines:** Should not show "Create ASN" button
- **PO status Draft:** Should not show "Create ASN" button

### Error Cases
- **Invalid PO ID:** API returns 404 (not implemented yet)
- **Duplicate ASN for PO:** API returns 409 conflict (not implemented yet)
- **PO not in Confirmed+ status:** API returns 400 validation error (not implemented yet)

---

## Test Data Requirements

### Prerequisites
- **Purchase Order:** Status = Confirmed, with 3+ PO lines
- **Supplier:** Active supplier linked to PO
- **Products:** 3+ products in catalog
- **User:** Authenticated warehouse user with ASN creation permission

### Test Fixtures
```typescript
// Example PO for ASN creation
{
  po_number: "PO-20250107-0001",
  supplier_id: "uuid-supplier-1",
  status: "confirmed",
  po_lines: [
    { product_id: "uuid-product-1", quantity: 100, uom: "kg" },
    { product_id: "uuid-product-2", quantity: 50, uom: "pcs" },
    { product_id: "uuid-product-3", quantity: 200, uom: "L" }
  ]
}

// Example ASN payload
{
  po_id: "uuid-po-1",
  expected_arrival_date: "2025-12-08",
  carrier: "DHL Express",
  tracking_number: "TRACK-12345",
  asn_items: [
    {
      po_line_id: "uuid-line-1",
      supplier_batch_number: "BATCH-001",
      manufacture_date: "2025-12-01",
      expiry_date: "2026-12-01"
    }
  ]
}
```

---

## Mocking Strategy

### External Dependencies
- **None** - ASN creation is fully internal (no external APIs)

### Database
- Use real Supabase database (seeded with test data)
- Reset data between test runs

### Authentication
- Use real auth flow (login with test user)

---

## Test Environment

### E2E Tests (Playwright)
- **Browser:** Chromium (headless)
- **Base URL:** `http://localhost:3000`
- **Test user:** `admin@test.com` / `TestPassword123!`

### Running Tests
```bash
# Run all E2E tests
pnpm test

# Run only Story 5.8 tests
pnpm test story-5.8-asn-creation.spec.ts

# Run in headed mode (see browser)
pnpm test --headed story-5.8-asn-creation.spec.ts

# Run in debug mode
pnpm test --debug story-5.8-asn-creation.spec.ts
```

---

## Current State: RED Phase

### All Tests Failing (Expected)
**Reason:** API endpoints and UI components not yet implemented

**Typical Failures:**
- ❌ `/warehouse/asns` route does not exist (404)
- ❌ `[data-testid="create-asn-button"]` not found
- ❌ `[data-testid="asn-form-modal"]` not found
- ❌ `POST /api/warehouse/asns` endpoint does not exist

**Next Step:** Hand off to DEV agent (BACKEND-DEV/FRONTEND-DEV/SENIOR-DEV) to implement:
1. Database tables: `asn`, `asn_items`, `asn_number_sequence`
2. API endpoints: `POST/GET /api/warehouse/asns`, `GET /api/warehouse/asns/:id`
3. UI components: `CreateASNModal`, ASN list/detail pages
4. Migrations + RLS policies

---

## Implementation Hints for DEV Agent

### Database Schema (needs migration)
```sql
-- ASN table
CREATE TABLE asn (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  asn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id UUID NOT NULL REFERENCES purchase_orders(id),
  expected_arrival_date DATE NOT NULL,
  carrier VARCHAR(100),
  tracking_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- pending/received/completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ASN items
CREATE TABLE asn_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asn_id UUID NOT NULL REFERENCES asn(id),
  po_line_id UUID NOT NULL REFERENCES po_lines(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,6),
  uom VARCHAR(20),
  supplier_batch_number VARCHAR(100),
  manufacture_date DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASN number sequence
CREATE TABLE asn_number_sequence (
  org_id UUID NOT NULL REFERENCES organizations(id),
  sequence_date DATE NOT NULL,
  next_sequence INTEGER DEFAULT 1,
  PRIMARY KEY (org_id, sequence_date)
);
```

### API Endpoints
- `POST /api/warehouse/asns` - Create ASN with auto-number generation
- `GET /api/warehouse/asns` - List ASNs (filter by status, date)
- `GET /api/warehouse/asns/:id` - Get ASN detail with items

### UI Components
- `CreateASNModal` - Form for ASN creation
- `ASNListPage` - Table with filters
- `ASNDetailPage` - Show ASN with items
- Add "Create ASN" button to PO detail page (only for Confirmed+ POs)

---

## Blockers

**None** - Tests are ready for implementation

---

## Handoff Checklist

- ✅ Test files created: `story-5.8-asn-creation.spec.ts`
- ✅ All tests FAIL correctly (RED state)
- ✅ Test strategy documented
- ✅ Coverage target defined (90%)
- ✅ Acceptance criteria mapped to tests
- ✅ Implementation hints provided
- ✅ No blockers

**Ready for handoff to DEV agent** 🚀
