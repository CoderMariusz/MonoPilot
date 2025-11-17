# Story 1.2: Electronic Signatures Workflow

Status: ready-for-dev

## Story

As a **Quality Manager / Production Supervisor**,
I want **electronic signatures for critical operations (WO release, BOM approval, QC approval)**,
so that **regulatory compliance is maintained per FDA 21 CFR Part 11 requirements**.

## Acceptance Criteria

### AC-1: Signature Infrastructure
- Create `electronic_signatures` table with columns: id, user_id, org_id, operation_type, entity_type, entity_id, signature_hash, timestamp, reason_for_change
- Implement JWT-based signature generation (sign with user's credentials + timestamp + operation context)
- Store signature hash (SHA-256) for verification
- RLS policy: users can view signatures for their org_id only

### AC-2: Signature Required Operations
- WO Release: Require signature when changing work_orders.status from 'planned' → 'released'
- BOM Approval: Require signature when changing boms.status from 'draft' → 'active'
- QC Approval: Require signature when changing license_plates.qa_status to 'approved'
- Deviation Approval: Require signature when creating/approving deviations (future)

### AC-3: Signature Modal UI Component
- Create `<ElectronicSignatureModal>` component
- Modal prompts: username, password, reason for change (text area)
- Re-authenticate user (verify password against Supabase Auth)
- Generate signature JWT with: {user_id, operation, entity, timestamp, reason}
- Store signature record in database
- Show success/error feedback

### AC-4: Signature Verification
- Create `ElectronicSignaturesAPI.verify(signature_id)` method
- Verify JWT signature hash matches stored hash
- Verify user credentials were valid at time of signing
- Verify operation context (entity_type, entity_id) matches
- Return verification result: {valid: true/false, signed_by, signed_at, reason}

### AC-5: Signature History UI
- Add "Signatures" tab to entity detail pages (WO, BOM, LP)
- Show signature history table: timestamp, user, operation, reason
- Verification badge: ✅ Valid or ⚠️ Invalid
- Export signatures to PDF (compliance report)

### AC-6: Audit Integration
- Link electronic signatures to pgAudit logs (Story 1.1 dependency)
- Audit log entry references signature_id when operation requires signature
- Cross-reference audit logs ↔ signatures for compliance reporting

### AC-7: Documentation
- Update `docs/architecture.md` with e-signature workflow
- Document signature schema and verification algorithm
- Update `docs/API_REFERENCE.md` with ElectronicSignaturesAPI
- Add compliance note: FDA 21 CFR Part 11 e-signature requirement (meaning and intent)

## Tasks / Subtasks

### Task 1: Signature Infrastructure (AC-1) - 4 hours
- [ ] 1.1: Create migration `XXX_create_electronic_signatures_table.sql`
- [ ] 1.2: Define table schema (id, user_id, org_id, operation_type, entity_type, entity_id, signature_hash, reason, timestamp)
- [ ] 1.3: Add RLS policy for org_id isolation
- [ ] 1.4: Create indexes: (org_id, entity_type, entity_id), (user_id, timestamp)
- [ ] 1.5: Run `pnpm gen-types` to regenerate TypeScript types

### Task 2: Signature Generation Logic (AC-1) - 3 hours
- [ ] 2.1: Create `ElectronicSignaturesAPI` class
- [ ] 2.2: Implement `generateSignature(operation, entity, reason)` method
- [ ] 2.3: Generate JWT with payload: {user_id, operation, entity, timestamp, reason}
- [ ] 2.4: Sign JWT with secret key (from environment variable)
- [ ] 2.5: Hash JWT using SHA-256, store hash in database
- [ ] 2.6: Add unit tests for signature generation

### Task 3: Signature Modal Component (AC-3) - 5 hours
- [ ] 3.1: Create `<ElectronicSignatureModal>` component
- [ ] 3.2: Add form fields: username (read-only, pre-filled), password (input), reason (textarea)
- [ ] 3.3: Implement re-authentication via Supabase Auth (verify password)
- [ ] 3.4: On success: call ElectronicSignaturesAPI.generateSignature()
- [ ] 3.5: On error: show error message ("Invalid credentials")
- [ ] 3.6: Add loading state and success feedback
- [ ] 3.7: Accessibility: keyboard navigation, ARIA labels

### Task 4: Integrate Signatures into Operations (AC-2) - 6 hours
- [ ] 4.1: WO Release: Intercept work_orders.status update → show signature modal
- [ ] 4.2: BOM Approval: Intercept boms.status update → show signature modal
- [ ] 4.3: QC Approval: Intercept license_plates.qa_status update → show signature modal
- [ ] 4.4: API validation: reject status change if signature not provided
- [ ] 4.5: Transaction: update entity + create signature record atomically
- [ ] 4.6: Add unit tests for signature-required operations

### Task 5: Signature Verification (AC-4) - 3 hours
- [ ] 5.1: Implement `ElectronicSignaturesAPI.verify(signature_id)` method
- [ ] 5.2: Load signature record from database
- [ ] 5.3: Verify JWT hash matches stored hash
- [ ] 5.4: Verify user_id exists and was active at signing time
- [ ] 5.5: Return verification result object
- [ ] 5.6: Add unit tests for verification (valid/invalid scenarios)

### Task 6: Signature History UI (AC-5) - 4 hours
- [ ] 6.1: Add "Signatures" tab to WO detail page
- [ ] 6.2: Add "Signatures" tab to BOM detail page
- [ ] 6.3: Add "Signatures" tab to LP detail page
- [ ] 6.4: Create `<SignatureHistoryTable>` component
- [ ] 6.5: Display columns: timestamp, user, operation, reason, verification status
- [ ] 6.6: Implement PDF export for signature history (compliance report)

### Task 7: Audit Integration (AC-6) - 2 hours
- [ ] 7.1: Update pgAudit view to include signature_id column
- [ ] 7.2: Link audit log entries to signature records (foreign key)
- [ ] 7.3: Update Audit Log UI to show signature reference
- [ ] 7.4: Cross-reference query: "Show all operations with/without signatures"

### Task 8: E2E Tests (4 hours)
- [ ] 8.1: E2E test: Release WO → signature modal appears
- [ ] 8.2: E2E test: Enter invalid password → error shown
- [ ] 8.3: E2E test: Enter valid credentials → WO released + signature created
- [ ] 8.4: E2E test: Signature history shows on WO detail page
- [ ] 8.5: E2E test: Signature verification badge shows ✅ Valid
- [ ] 8.6: E2E test: PDF export downloads signature report

### Task 9: Documentation (AC-7) - 2 hours
- [ ] 9.1: Run `pnpm docs:update` to regenerate API docs
- [ ] 9.2: Update `docs/architecture.md` with e-signature workflow diagram
- [ ] 9.3: Document signature schema and JWT structure
- [ ] 9.4: Add compliance section: FDA 21 CFR Part 11 e-signature (meaning + intent)

**Total Estimated Effort:** 33 hours (~4-5 days)

## Dev Notes

### Requirements Source
[Source: docs/MonoPilot-PRD-2025-11-13.md#G4-Audit-Trail-Electronic-Signatures, lines 1178-1183]

**Electronic Signature Requirements:**
- Custom JWT-based signature system
- Signature required for critical operations: WO release, BOM approval, QC approval
- Signature verification capability
- Signature history tracking
- Compliance: FDA 21 CFR Part 11 Part 11 (meaning and intent of signature)

### Architecture Constraints

**FDA 21 CFR Part 11 Requirements:**
- **Meaning**: Signature must clearly indicate who signed, when, and why
- **Intent**: User must authenticate (re-enter password) to prove intent
- **Uniqueness**: Each signature must be unique and non-reusable
- **Link**: Signature must be permanently linked to the signed record

**JWT Signature Structure:**
```json
{
  "user_id": "uuid",
  "org_id": "uuid",
  "operation": "wo_release",
  "entity_type": "work_order",
  "entity_id": 123,
  "timestamp": "2025-11-16T12:00:00Z",
  "reason": "Approved for production per QC inspection results"
}
```

**Signature Hash:**
- JWT signed with HS256 algorithm
- Secret key from environment variable (SIGNATURE_SECRET_KEY)
- SHA-256 hash of signed JWT stored in database

### Testing Strategy

**Risk-Based E2E Coverage:**
- HIGH RISK: Password re-authentication (security) = E2E required
- HIGH RISK: Signature required validation (bypass prevention) = E2E required
- COMPLEX: Modal workflow (multi-step interaction) = E2E required
- Simple: Signature history display = unit test sufficient

**E2E Test Scenarios:**
1. Release WO without signature → blocked (validation error)
2. Release WO with invalid password → error shown
3. Release WO with valid signature → success + signature created
4. Signature history shows all signatures for entity
5. PDF export generates compliance report

### Project Structure Notes

**Files to Create/Modify:**
- `apps/frontend/lib/supabase/migrations/XXX_create_electronic_signatures_table.sql` - New table
- `apps/frontend/lib/api/electronicSignatures.ts` - New ElectronicSignaturesAPI class
- `apps/frontend/components/ElectronicSignatureModal.tsx` - Signature modal
- `apps/frontend/components/SignatureHistoryTable.tsx` - History table
- `apps/frontend/lib/api/workOrders.ts` - Update release() to require signature
- `apps/frontend/lib/api/boms.ts` - Update approve() to require signature
- `apps/frontend/lib/api/licensePlates.ts` - Update qaApprove() to require signature
- `apps/frontend/__tests__/electronicSignatures.test.ts` - Unit tests
- `apps/frontend/e2e/electronic-signatures.spec.ts` - E2E tests
- `docs/architecture.md` - E-signature documentation

### MVP Scope

✅ **MVP Features** (ship this):
- Signature for 3 critical operations: WO release, BOM approval, QC approval
- Basic signature modal (username, password, reason)
- Signature history table
- Verification badge (valid/invalid)

❌ **Growth Phase** (defer):
- Signature for additional operations (deviation approval, recipe change)
- Advanced signature analytics (most frequent signers, signature trends)
- Multi-factor authentication for signatures
- Biometric signatures (fingerprint, face ID)

### Dependencies

**Prerequisites:**
- Story 1.1 (pgAudit Extension) - for audit trail integration
- Supabase Auth (already implemented)
- RBAC system (already implemented)

**Blocks:**
- None (Story 1.3 FSMA 204 is independent)

### References

- [FDA 21 CFR Part 11 - Electronic Signatures](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/part-11-electronic-records-electronic-signatures-scope-and-application)
- [JWT.io - JSON Web Tokens](https://jwt.io/)
- [Supabase Auth - Re-authentication](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

### Learnings from Previous Story

**From Story 1.1 (pgAudit Extension):**
- Audit log infrastructure established
- RLS policies pattern for org_id isolation
- API class pattern: ElectronicSignaturesAPI follows same structure as AuditLogsAPI
- Testing: HIGH RISK operations require E2E tests

**Reuse from Story 1.1:**
- Audit log RLS policy pattern → apply to electronic_signatures table
- API pagination pattern → apply to signature history
- CSV export pattern → extend to PDF export for signatures

## Dev Agent Record

### Context Reference

- **Story Context File**: `docs/sprint-artifacts/1-2-electronic-signatures-workflow.context.xml`
- Generated: 2025-11-16
- Includes: PRD G4 E-Signatures, FDA 21 CFR Part 11 compliance requirements, JWT signature structure, API patterns, testing strategy
- Dependencies: Story 1.1 (pgAudit) for audit integration

### Agent Model Used

<!-- Will be filled during dev-story execution -->

### Debug Log References

### Completion Notes List

### File List
