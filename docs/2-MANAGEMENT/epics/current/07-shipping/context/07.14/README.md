# Story 07.14 - Shipment Manifest & Ship + Tracking

**Status**: Ready for Implementation
**Complexity**: Medium (M)
**Estimate**: 3 days
**Phase**: 1C
**Priority**: P0 (MVP Core)

## Overview

This story implements the final shipment workflow steps: manifest generation (SSCC validation), ship confirmation (irreversible LP consumption and SO updates), delivery marking, and tracking display. Handles status transitions from packed through shipped to delivered, with full transactional integrity and permission enforcement.

## Context Files

This directory contains the complete specification for Story 07.14 broken into focused YAML files:

### 1. **07.14.context.yaml** - Main Story Context
- Story metadata (ID, phase, complexity, estimate)
- Dependencies (07.11, 07.13, Epic 01.1, 05.1)
- Files to create (API routes, services, components, database)
- Database schema changes
- API endpoint definitions
- UX wireframe references
- Validation rules
- Business logic rules
- Acceptance criteria checklist
- Definition of done

**Purpose**: Central reference for all story information. Load this first.

### 2. **07.14-database-schema.yaml** - Database Specification
- Table modifications (shipments, license_plates, sales_orders, sales_order_lines)
- Column additions (manifested_at, shipped_at, shipped_by, delivered_at, delivered_by)
- Foreign key constraints
- Indexes for performance (shipped_at, delivered_at filtering)
- RLS policies for multi-tenant isolation
- RPC function: `ship_shipment()` with full transaction logic
- Migration SQL scripts
- Data query examples

**Purpose**: Complete database schema reference. Use when creating migrations and RLS policies.

### 3. **07.14-api-endpoints.yaml** - API Specification
- POST /api/shipping/shipments/:id/manifest (SSCC validation)
- POST /api/shipping/shipments/:id/ship (irreversible ship action)
- POST /api/shipping/shipments/:id/mark-delivered (Manager+ only)
- GET /api/shipping/shipments/:id/tracking (tracking info & timeline)
- Request/response schemas with examples
- Error codes and HTTP status codes
- Error handling patterns
- Example curl requests and responses

**Purpose**: Detailed API reference for backend development. Use when implementing routes.

### 4. **07.14-components.yaml** - Frontend Components
- ShipmentActions.tsx (action buttons with status-based disabling)
- ShipConfirmDialog.tsx (irreversible action confirmation)
- TrackingDialog.tsx (modal with tracking info)
- TrackingTimeline.tsx (status timeline visualization)
- Props, state, rendering details
- Accessibility requirements
- Error handling patterns
- Integration flow with shipment detail page

**Purpose**: Complete component specification. Use when implementing frontend components.

### 5. **README.md** (this file) - Navigation Guide
- Overview and file structure
- Quick reference for developers
- Key facts and implementation order
- Links to source materials

## Quick Reference

### Key Facts

- **Status Workflow**: pending → packing → packed → manifested → shipped → delivered
- **Irreversible Actions**: Ship endpoint (requires explicit confirmation)
- **Permissions**:
  - Manifest/Ship: Warehouse, Manager, Admin
  - Mark Delivered: Manager, Admin only
  - View Tracking: Any authenticated user
- **Transactional**: Ship endpoint wraps all updates in PostgreSQL transaction
- **LP Consumption**: All license_plates in shipment_box_contents marked as 'shipped'
- **SO Cascade**: sales_order and all sales_order_lines updated with shipped_at and quantity_shipped

### Implementation Order

1. **Database (Day 1)**
   - Create migration: add manifested_at, shipped_at, shipped_by, delivered_at, delivered_by
   - Create migration: add indexes on shipped_at, delivered_at
   - Create RPC function: ship_shipment()
   - Update RLS policies

2. **Backend Services (Day 1-2)**
   - Create shipment-service.ts with 4 methods:
     - `manifestShipment(shipmentId): Promise<Shipment>`
     - `shipShipment(shipmentId): Promise<Shipment>`
     - `markDelivered(shipmentId): Promise<Shipment>`
     - `getTrackingInfo(shipmentId): Promise<TrackingInfo>`
   - Create Zod validation schemas
   - Create API routes (4 endpoints)

3. **Frontend Components (Day 2-3)**
   - Create ShipmentActions.tsx with 4 buttons
   - Create ShipConfirmDialog.tsx with confirmation logic
   - Create TrackingDialog.tsx and TrackingTimeline.tsx
   - Update shipment detail page to integrate components
   - Add permission checks (hide buttons for unauthorized users)

4. **Testing (Day 3)**
   - Unit tests for ShipmentService (>80% coverage)
   - Integration tests for API endpoints
   - E2E test: Full workflow (pack → manifest → ship → deliver)
   - Permission tests (Manager-only delivered)
   - Status workflow validation tests

### Source Materials

- **Story MD**: [docs/2-MANAGEMENT/epics/current/07-shipping/07.14.shipment-manifest-ship.md](../07.14.shipment-manifest-ship.md)
- **PRD Module**: [docs/1-BASELINE/product/modules/shipping.md](../../../../1-BASELINE/product/modules/shipping.md) (FR-7.41 BOL, FR-7.15 Partial Fulfillment)
- **Architecture**: [docs/1-BASELINE/architecture/modules/shipping.md](../../../../1-BASELINE/architecture/modules/shipping.md)
- **Wireframes**:
  - [SHIP-007: Sales Order Detail](../../../../3-ARCHITECTURE/ux/wireframes/SHIP-007-sales-order-detail.md)
  - [SHIP-021: Bill of Lading](../../../../3-ARCHITECTURE/ux/wireframes/SHIP-021-bill-of-lading.md)

### Dependency Reference

**Must Complete First**:
- Story 07.11 (Packing Station + Shipment Creation) - provides `shipments`, `shipment_boxes`
- Story 07.13 (SSCC + Labels + BOL) - provides SSCC generation and `boxes.sscc` validation

**Epic Dependencies**:
- Epic 01.1 (Organizations, RLS, users, roles)
- Epic 05.1 (License Plates)
- Epic 02.1 (Products)
- Epic 01.8 (Warehouses)

## Acceptance Criteria

### Core Manifest Flow
- [ ] Manifest endpoint validates SSCC on all boxes
- [ ] Manifest updates status → 'manifested'
- [ ] Manifest error shows specific count of missing SSCC boxes

### Ship Flow (Irreversible)
- [ ] Requires shipment status 'manifested' or 'packed'
- [ ] Requires confirm=true parameter
- [ ] Updates shipment status → 'shipped', shipped_at = NOW(), shipped_by = current_user
- [ ] Consumes all LPs: UPDATE license_plates SET status='shipped'
- [ ] Updates SO: status='shipped', shipped_at=NOW()
- [ ] Updates all SO lines: quantity_shipped = quantity_packed
- [ ] Entire operation wrapped in database transaction
- [ ] On error: transaction rolls back

### Delivered Flow
- [ ] Restricted to Manager+ only (403 for Warehouse users)
- [ ] Requires shipment status 'shipped'
- [ ] Updates shipment status → 'delivered', delivered_at=NOW()
- [ ] Updates related SO status → 'delivered'

### Tracking Flow
- [ ] Returns carrier, tracking_number, status, timeline, external_url
- [ ] Timeline includes packed_at, manifested_at, shipped_at, delivered_at with user names
- [ ] Generates carrier URLs (DHL, UPS, DPD, FedEx)

### UI/UX
- [ ] Action buttons disabled/enabled based on shipment status
- [ ] Ship button shows confirmation dialog with irreversible warning
- [ ] Manifest button enabled only for 'packed' status
- [ ] Mark Delivered button hidden for non-managers
- [ ] View Tracking button enabled for 'shipped' or 'delivered'

### Permissions & Security
- [ ] All API endpoints check user role
- [ ] RLS policies enforced (org isolation)
- [ ] Permission errors return 403
- [ ] UI hides actions user cannot perform

## Testing Checklist

- [ ] Unit: ShipmentService methods (>80% coverage)
- [ ] Unit: Zod schemas validate request/response
- [ ] Unit: Carrier URL generation (DHL, UPS, DPD, FedEx)
- [ ] Integration: Manifest API endpoint (success, SSCC validation error)
- [ ] Integration: Ship API endpoint (success, transaction, RLS)
- [ ] Integration: Mark Delivered API endpoint (Manager allowed, Warehouse denied)
- [ ] Integration: Tracking API endpoint (returns timeline, carrier URL)
- [ ] E2E: Full workflow (pack → manifest → ship → deliver)
- [ ] E2E: Permission tests (Picker cannot see delivered button)
- [ ] E2E: Error handling (manifest fails, retry works)
- [ ] E2E: Partial fulfillment (quantity_shipped < quantity_ordered)

## Common Tasks

### Adding New Carrier URL
1. Edit `getCarrierTrackingUrl()` in shipment-service.ts
2. Add carrier to URL template map
3. Test with carrier name and tracking number
4. Update tracking API response

### Permission Check
1. In API route: `const role = auth.jwt().role`
2. Check `role IN ARRAY['Manager', 'Admin']`
3. Return 403 if unauthorized
4. In UI: `canMarkDelivered = userRole IN ['Manager', 'Admin']`

### Partial Fulfillment
1. When shipping: DO NOT validate `quantity_packed === quantity_ordered`
2. Set `quantity_shipped = quantity_packed` (may be less)
3. Backorder creation deferred to Phase 2 (Story 07.29)

### Error Handling
1. If manifest fails: Show error toast with count of missing SSCC
2. If ship fails: Show error in dialog, allow retry
3. If permission denied: Show error toast, hide button in UI
4. Transaction rollback: Return 409 with `rollback_successful: true`

## Deliverables Summary

**Database**:
- Migration: Add manifest/ship/deliver timestamps
- Migration: Add indexes for reporting
- RPC function: ship_shipment() with transaction logic
- RLS policies for permission enforcement

**Backend**:
- 4 API endpoints (manifest, ship, mark-delivered, tracking)
- ShipmentService with 4 static methods
- Zod validation schemas
- Permission and status validation logic
- Carrier tracking URL generation

**Frontend**:
- 4 React components (ShipmentActions, ShipConfirmDialog, TrackingDialog, TrackingTimeline)
- Integration with shipment detail page
- Status-based button enabling/disabling
- Permission checks (hide unauthorized actions)
- Error handling and retry logic

**Tests**:
- >80% unit test coverage for ShipmentService
- E2E test: Full pack → manifest → ship → deliver workflow
- Permission tests (role-based actions)
- Status workflow validation

## Notes

- Ship action is **irreversible** (confirmation dialog required)
- Mark Delivered is **Manager-only** (403 if non-manager attempts)
- Status workflow **enforced** (cannot skip states, cannot revert)
- Partial fulfillment **supported** (quantity_shipped can be < quantity_ordered)
- Transaction **atomic** (all updates succeed or all rollback)
- RLS **enforced** (cross-org access returns 403)
- Audit **logged** (status changes with user_id and timestamp)

## Phase 2 Deferrals

- **Story 07.25**: Carrier API integration (automatic tracking number)
- **Story 07.27**: Tracking webhooks (automatic delivery confirmation)
- **Story 07.24**: POD upload (Proof of Delivery)
- **Story 07.29**: Backorder management (when quantity_shipped < quantity_ordered)

---

**Last Updated**: 2025-12-18
**Author**: TECH-WRITER
**Status**: Ready for BACKEND-DEV and FRONTEND-DEV
