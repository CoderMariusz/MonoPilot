# Acceptance Criteria Template Checklist

**Version:** 1.0
**Created:** 2025-11-20
**Purpose:** Ensure comprehensive AC coverage for all MonoPilot user stories
**Owner:** Product Manager
**Usage:** Apply this checklist when drafting or reviewing story acceptance criteria

---

## Overview

This checklist ensures that every user story includes complete acceptance criteria covering happy paths, edge cases, error handling, and technical constraints. Use this template to avoid common gaps identified in the Solutioning Gate Check (Gap 7: Error Handling Pattern Missing).

**Target AC Completeness:** 95%+ (current average: 77.5%)

---

## Mandatory Checklist

Every story MUST address these categories:

### ✅ 1. Happy Path (Given/When/Then)

**Required:** Yes
**Format:** BDD (Behavior-Driven Development)

```markdown
**Given** [initial context/preconditions]
**When** [user action or system trigger]
**Then** [expected outcome with measurable criteria]
```

**Example (Story 5.11: GRN + LP Creation):**
```markdown
**Given** ASN #12345 exists with status "Received"
**When** User scans pallet barcode and confirms GRN
**Then** System creates:
  - GRN record with auto-incremented GRN#
  - License Plate with unique LP# linked to GRN
  - Updates ASN status to "Completed"
  - Displays success message: "GRN #67890 created with LP #LP-001234"
```

---

### ✅ 2. Required Field Validations

**Required:** Yes (if story has user input)
**Coverage:** All mandatory fields

**Checklist:**
- [ ] Required fields clearly identified in UI
- [ ] Validation triggers on form submission
- [ ] Field-specific error messages (not generic "Invalid input")
- [ ] Multi-field dependencies (e.g., "End date must be after Start date")

**Example (Story 1.1: Organization Configuration):**
```markdown
**AC:** System validates:
  - Organization Name: Required, max 100 chars
  - Primary Contact Email: Required, valid email format
  - Timezone: Required, selected from dropdown
  - Error display: Inline below each field, red text
  - Submit button disabled until all required fields valid
```

---

### ✅ 3. Duplicate/Conflict Handling

**Required:** Yes (if story creates/updates unique records)
**Coverage:** Unique constraints (DB + business logic)

**Checklist:**
- [ ] Duplicate detection before save (database unique constraints)
- [ ] Conflict resolution strategy (e.g., "Update existing" vs "Create new version")
- [ ] User-friendly error message with suggested action
- [ ] Concurrent update handling (optimistic locking if applicable)

**Example (Story 2.1: Product CRUD):**
```markdown
**AC:** If user creates product with duplicate SKU:
  - System checks products table: sku + org_id unique constraint
  - Error message: "Product SKU 'ABC123' already exists. Use Edit to update existing product or choose a different SKU."
  - Focus returns to SKU field
  - Existing product link shown in error (if user has view permission)
```

---

### ✅ 4. Foreign Key Constraint Violations

**Required:** Yes (if story references parent records)
**Coverage:** All FK relationships (org_id, user_id, parent IDs)

**Checklist:**
- [ ] Parent record existence validated before save
- [ ] Cascade delete behavior defined (if applicable)
- [ ] Orphan prevention for critical relationships (e.g., genealogy)
- [ ] User-friendly error message (not raw SQL error)

**Example (Story 3.8: WO CRUD):**
```markdown
**AC:** FK validations on WO creation:
  - product_id: Must reference existing product in same org
  - bom_id: Must reference existing BOM for selected product
  - routing_id: Optional, but if provided must exist and match product
  - Error if FK fails: "Selected Product no longer exists. Please refresh and try again."
  - Transaction rollback: No partial WO record created
```

---

### ✅ 5. External Service Failures

**Required:** Yes (if story integrates external services)
**Coverage:** SendGrid, Stripe, Upstash Redis, external APIs

**Checklist:**
- [ ] Timeout handling (default: 10s for API calls)
- [ ] Retry strategy (exponential backoff for transient failures)
- [ ] Fallback behavior (e.g., queue for later, cache response)
- [ ] User notification (clear, actionable message)
- [ ] Logging for debugging (include request ID, timestamp)

**Example (Story 1.3: User Invitation Email):**
```markdown
**AC:** If SendGrid email fails:
  - System retries 3 times (2s, 4s, 8s intervals)
  - If all retries fail:
    - User creation succeeds (email failure is non-blocking)
    - Admin sees warning: "User created, but invitation email failed. Copy invitation link manually."
    - Invitation link displayed in UI for manual sharing
    - Event logged: "sendgrid_failure" with error details
```

---

### ✅ 6. Transaction Atomicity (Multi-Record Operations)

**Required:** Yes (if story creates/updates multiple related records)
**Coverage:** Genealogy, GRN+LP, Consumption+Genealogy, WO+Materials

**Checklist:**
- [ ] All-or-nothing guarantee (transaction rollback if any step fails)
- [ ] FK validation before commit
- [ ] Concurrency handling (row-level locks if needed)
- [ ] Error recovery (clear error message, no partial data)

**Example (Story 5.11: GRN + LP Creation):**
```markdown
**AC:** GRN + LP creation is atomic:
  - Transaction START
  - INSERT grn record → validate FK (asn_id, supplier_id, org_id)
  - INSERT license_plate → validate FK (grn_id, location_id, org_id)
  - INSERT genealogy_tree → validate parent_lp_id (if consumption)
  - Transaction COMMIT
  - If ANY step fails:
    - Transaction ROLLBACK
    - No GRN, LP, or genealogy record created
    - Error: "GRN creation failed: [specific reason]. Please try again."
```

---

### ✅ 7. Edge Cases (Empty State, Max Capacity, Boundaries)

**Required:** Yes (story-specific edge cases)
**Coverage:** Zero results, pagination limits, max file size, date ranges

**Checklist:**
- [ ] Empty state UI/message (e.g., "No products found. Create your first product.")
- [ ] Pagination limits (max 100 results per page, infinite scroll if applicable)
- [ ] Max file upload size (images: 5MB, CSV: 10MB)
- [ ] Date range boundaries (e.g., "BOM effective date cannot be in the past")
- [ ] Numeric limits (e.g., "Max 999,999 units per WO")

**Example (Story 3.1: PO List View):**
```markdown
**AC:** Edge cases handled:
  - Empty state: "No Purchase Orders yet. Create your first PO to get started." + CTA button
  - Max results: 100 POs per page, pagination controls shown if >100
  - Date filter: Default to "Last 30 days", allow custom range (max 1 year)
  - Search: Min 2 characters, debounce 300ms, show "No results found" if zero matches
  - Concurrent PO creation: Optimistic UI update, refresh on conflict
```

---

### ✅ 8. User-Friendly Error Messages

**Required:** Yes (all error scenarios)
**Format:** Clear, actionable, no technical jargon

**Checklist:**
- [ ] Error message explains WHAT went wrong
- [ ] Error message suggests HOW to fix (actionable)
- [ ] No raw SQL errors, stack traces, or technical codes shown to user
- [ ] Consistent error UI pattern (toast notification, inline validation, modal)
- [ ] Support reference ID for debugging (if applicable)

**Example (Error Message Quality):**

❌ **Bad:**
```
Error: 23503 - insert or update on table "work_orders" violates foreign key constraint "fk_work_orders_product_id"
```

✅ **Good:**
```
Unable to create Work Order: The selected product no longer exists.
Please refresh the page and select a valid product, or contact support if this issue persists.
[Reference ID: WO-ERR-20251120-1234]
```

---

## Optional Enhancements

These are recommended but not required for all stories:

### 🔹 Performance Criteria

**When to include:** Stories with heavy data operations (reports, bulk imports, large lists)

**Example:**
```markdown
**AC:** Performance requirements:
  - PO list loads <2s for 1,000 records
  - Bulk PO creation: Max 100 POs per batch, completes <5s
  - CSV export: Max 10,000 rows, generates <10s
```

---

### 🔹 Accessibility (WCAG AAA)

**When to include:** All UI stories (UX Design mandates WCAG AAA)

**Example:**
```markdown
**AC:** Accessibility:
  - All form fields have aria-labels
  - Keyboard navigation: Tab order matches visual flow
  - Error messages announced by screen readers (aria-live="assertive")
  - Color contrast: 7:1 ratio for all text
```

---

### 🔹 Audit Trail

**When to include:** Stories modifying critical data (products, BOMs, WOs, genealogy)

**Example:**
```markdown
**AC:** Audit trail captured:
  - Event: "bom_updated"
  - User: current_user_id
  - Timestamp: UTC
  - Changes: JSON diff (old_version → new_version)
  - Queryable via Admin > Audit Log
```

---

### 🔹 Multi-Tenant Isolation (RLS)

**When to include:** All data access stories (CRITICAL for MonoPilot)

**Example:**
```markdown
**AC:** Multi-tenant RLS enforced:
  - Query filters by org_id automatically (RLS policy)
  - User A (Org 1) cannot see User B's data (Org 2)
  - Test: SQL injection attempt with org_id bypass fails
  - CI/CD: RLS policy test exists for all new tables
```

---

## Story Review Checklist

Before marking story as "Ready for Development", Product Manager verifies:

- [ ] **Happy path** defined with Given/When/Then
- [ ] **Required fields** validated with specific error messages
- [ ] **Duplicates** handled with conflict resolution
- [ ] **FK violations** caught with user-friendly errors
- [ ] **External services** have timeout, retry, fallback logic
- [ ] **Transactions** are atomic (if multi-record operation)
- [ ] **Edge cases** addressed (empty state, max capacity, boundaries)
- [ ] **Error messages** are clear, actionable, no technical jargon
- [ ] **(Optional) Performance** criteria if applicable
- [ ] **(Optional) Accessibility** ACs if UI story
- [ ] **(Optional) Audit trail** if modifying critical data
- [ ] **(Required) RLS multi-tenant** isolation verified

---

## Examples by Story Type

### CRUD Story Example (Story 2.1: Product CRUD)

```markdown
### Acceptance Criteria

**AC 1: Happy Path - Create Product**
**Given** User is on Products > Create Product page
**When** User fills all required fields (Name, SKU, Type, Unit) and clicks Save
**Then** System creates product with auto-generated ID, displays success toast, redirects to Product Detail page

**AC 2: Required Field Validations**
- Name: Required, max 200 chars
- SKU: Required, alphanumeric + hyphens, max 50 chars
- Type: Required, dropdown selection
- Unit of Measure: Required, dropdown selection
- Error: Inline below field, red text, submit disabled until valid

**AC 3: Duplicate SKU Handling**
**Given** Product with SKU "ABC123" exists
**When** User creates new product with same SKU
**Then** Error: "Product SKU 'ABC123' already exists. Use Edit to update existing product or choose a different SKU." (link to existing product)

**AC 4: FK Validation - Product Type**
**Given** User selects Product Type from dropdown
**When** User saves product
**Then** System validates product_type_id exists in product_types table, else error: "Selected product type is invalid. Please refresh and try again."

**AC 5: Edge Cases**
- Empty name → "Product Name is required"
- SKU with special chars → "SKU must contain only letters, numbers, and hyphens"
- Product Type deleted during form fill → "Selected type no longer exists. Please refresh."

**AC 6: Success Message**
"Product 'Widget A' (SKU: ABC123) created successfully."

**AC 7: Audit Trail**
Event logged: product_created { user_id, org_id, product_id, timestamp }
```

---

### Integration Story Example (Story 0.1: PO → GRN → LP Integration Test)

```markdown
### Acceptance Criteria

**AC 1: Happy Path - Full Integration**
**Given** PO #1000 created for 100 units of Product A
**When** ASN received → GRN created → LP generated
**Then** System:
  - PO status → "Partially Received" (if partial GRN)
  - GRN links to ASN and PO
  - LP links to GRN with correct quantity
  - Genealogy tree created (LP as root if raw material)
  - Stock level updated: location_id inventory +100

**AC 2: Transaction Atomicity**
**Given** GRN + LP creation in progress
**When** LP creation fails (e.g., FK violation on location_id)
**Then** Transaction rollback:
  - No GRN record created
  - No LP record created
  - ASN status unchanged
  - Error: "Unable to create GRN: Invalid storage location. Please verify location exists."

**AC 3: External Service Failure - Email Notification**
**Given** GRN created successfully
**When** SendGrid email notification fails (timeout)
**Then** GRN creation succeeds (email is non-blocking), admin sees warning in UI, email queued for retry (3 attempts)

**AC 4: Edge Case - Concurrent GRN Creation**
**Given** Two users create GRN for same ASN simultaneously
**When** Both submit within 1 second
**Then** Only first GRN succeeds, second user sees error: "ASN already fully received. Refresh to see latest GRN."

**AC 5: FK Validations**
- asn_id must exist and belong to same org_id
- supplier_id must exist and be active
- location_id must exist and be active
- product_id must match ASN line items

**AC 6: User-Friendly Errors**
- FK violation: "Selected location 'Warehouse A' no longer exists. Please select a different location."
- Duplicate LP#: "License Plate LP-001234 already exists. System will auto-generate next available LP#."
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-20 | Initial checklist created (Sprint 0, Gap 7) | Mariusz |

---

## References

- **Source:** docs/readiness-assessment/3-gaps-and-risks.md (Gap 7)
- **Sprint 0 Task:** 0-7-ac-template-checklist
- **Related:** Sprint 0 Tasks 0-2 (Story 5.7 update), 0-6 (Transaction Atomicity)
- **Usage Context:** All 237 stories across Epic 1-8 should reference this template

---

_This template is a living document. Update as new edge cases or patterns emerge during Sprint 0 and Epic 1-8 implementation._
