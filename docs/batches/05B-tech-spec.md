# Epic 5 Batch B: Warehouse - Stock Movement & Pallets
## Technical Specification

**Date:** 2025-11-27
**Author:** Claude Code
**Epic ID:** 5
**Batch ID:** 5B (Core Features)
**Status:** Draft

---

## Overview

Epic 5 Batch B (Warehouse Core) implementuje zarządzanie ruchem inventaryzacji i grupowaniem LPs na paletach:

1. **Stock Movement** - Przesuwanie LPs między lokacjami z historią audytu
2. **Pallet Management** - Grupowanie LPs na paletach dla organizacji i transportu
3. **Movement Tracking** - Kategoryzacja ruchów (putaway, pick, transfer, adjustment)

Batch obejmuje 9 stories (5.14-5.22) i realizuje FR-WH-14 do FR-WH-22.

### Key Features
- ✅ LP Location Move z audit trail
- ✅ Movement Types (Receiving, Putaway, Pick, Transfer, Adjustment)
- ✅ Partial Move z auto-split
- ✅ Destination Validation (location type, warehouse, active status)
- ✅ Pallet Creation & Management
- ✅ Pallet LP Assignment (add/remove)
- ✅ Pallet Move (bulk LP relocation)
- ✅ Pallet Status Lifecycle (open, closed, shipped)

---

## Objectives and Scope

### In Scope
- ✅ **LP Location Move**: Update LP location, create stock_move record, audit trail
- ✅ **Stock Move History**: Audit trail (from_location, to_location, user, reason, timestamp)
- ✅ **Movement Types**: Receiving, Putaway, Pick, Transfer, Adjustment (categorization)
- ✅ **Partial Move**: Split LP on move to different qty than original
- ✅ **Location Validation**: Active status, type compatibility, warehouse consistency
- ✅ **Pallet Creation**: CRUD pallet with status lifecycle
- ✅ **Pallet LP Management**: Add/remove LPs from pallets
- ✅ **Pallet Move**: Bulk move all LPs in pallet together
- ✅ **Pallet Status**: open → closed → shipped states
- ✅ **RLS Policies**: org_id isolation na stock_moves, pallets, pallet_items

### Out of Scope
- ❌ Advanced Location Queries (3D coordinates, putaway algorithms) → P2
- ❌ Putaway Robot Integration (future)
- ❌ Pick List Optimization (future)
- ❌ Cycle Counting (Story 5.35) → Batch 5C
- ❌ Scanner Operations (Story 5.23-5.27) → Batch 5C

---

## System Architecture Alignment

### Database Constraints
1. **Multi-tenancy**: `org_id UUID FK` + RLS on all tables
2. **Unique Constraints**:
   - `stock_moves` - no unique, just audit trail
   - `pallets(org_id, pallet_number)` - unique pallet number per org
   - `pallet_items(pallet_id, license_plate_id)` - prevent duplicate LP in same pallet
3. **Foreign Keys**:
   - `stock_moves.lp_id` → license_plates(id)
   - `stock_moves.from_location_id, to_location_id` → locations(id)
   - `pallets.location_id` → locations(id)
   - `pallet_items.pallet_id` → pallets(id)
   - `pallet_items.license_plate_id` → license_plates(id)

---

## Detailed Design

### Services & API Endpoints

#### StockMovementService
| Operation | Endpoint | Method | Auth | Notes |
|-----------|----------|--------|------|-------|
| List Moves | `/api/warehouse/stock-moves` | GET | authenticated | Filter by LP, location, date, user, type |
| Create Move | `/api/warehouse/stock-moves` | POST | authenticated | Create move record, update LP location |
| Move History | `/api/warehouse/stock-moves?lp_id=X` | GET | authenticated | All moves for LP |

#### PalletService
| Operation | Endpoint | Method | Auth | Notes |
|-----------|----------|--------|------|-------|
| List Pallets | `/api/warehouse/pallets` | GET | authenticated | Filter by status, location |
| Get Pallet | `/api/warehouse/pallets/:id` | GET | authenticated | Include items, location, status |
| Create Pallet | `/api/warehouse/pallets` | POST | authenticated | Auto-generate pallet_number |
| Update Pallet Status | `/api/warehouse/pallets/:id/status` | PATCH | authenticated | open→closed→shipped |
| Add LP to Pallet | `/api/warehouse/pallets/:id/items` | POST | authenticated | Assign LP to pallet |
| Remove LP from Pallet | `/api/warehouse/pallets/:id/items/:lpId` | DELETE | authenticated | Unassign LP |
| Move Pallet | `/api/warehouse/pallets/:id/move` | POST | authenticated | Move all LPs to new location |

---

## Data Models

### Stock Moves Table
```sql
CREATE TABLE stock_moves (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  license_plate_id UUID NOT NULL REFERENCES license_plates(id),
  from_location_id UUID NOT NULL REFERENCES locations(id),
  to_location_id UUID NOT NULL REFERENCES locations(id),
  movement_type VARCHAR(20) NOT NULL, -- receiving, putaway, pick, transfer, adjustment
  quantity DECIMAL(15, 4) NOT NULL,
  uom VARCHAR(10) NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  created_by_user_id UUID REFERENCES users(id),
  INDEX(org_id, license_plate_id),
  INDEX(org_id, from_location_id),
  INDEX(org_id, to_location_id),
  INDEX(org_id, created_at),
  INDEX(org_id, movement_type)
);
```

### Pallets Table
```sql
CREATE TABLE pallets (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  pallet_number VARCHAR(50) NOT NULL UNIQUE,
  location_id UUID NOT NULL REFERENCES locations(id),
  status VARCHAR(20) DEFAULT 'open', -- open, closed, shipped
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  created_by_user_id UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(org_id, pallet_number),
  INDEX(org_id, status),
  INDEX(org_id, location_id)
);

CREATE TABLE pallet_items (
  id UUID PRIMARY KEY,
  pallet_id UUID NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
  license_plate_id UUID NOT NULL REFERENCES license_plates(id),
  added_at TIMESTAMP DEFAULT now(),
  UNIQUE(pallet_id, license_plate_id),
  INDEX(pallet_id),
  INDEX(license_plate_id)
);
```

---

## Implementation Dependencies

### Required from Previous Batches
- ✅ Batch 5A: License Plates (license_plates table)
- ✅ Epic 1: Locations (locations table with type, active status)
- ✅ Epic 1: Users (created_by_user_id tracking)

### Dependencies Within Batch 5B
1. **Story 5.14** (LP Move) → Base entity
2. **Story 5.15** (Movement Audit) → Depends on 5.14
3. **Story 5.16** (Partial Move) → Depends on 5.5 (split), 5.14
4. **Story 5.17** (Location Validation) → Depends on 5.14
5. **Story 5.18** (Movement Types) → Depends on 5.14
6. **Story 5.19** (Pallet Creation) → Independent
7. **Story 5.20** (Pallet LP Mgmt) → Depends on 5.19
8. **Story 5.21** (Pallet Move) → Depends on 5.19, 5.20, 5.14
9. **Story 5.22** (Pallet Status) → Depends on 5.19

### Parallel Implementation Tracks
- **Track 1**: Stock Moves (5.14-5.18) - ~30-40 hours
- **Track 2**: Pallet Mgmt (5.19-5.22) - ~25-30 hours

---

## Error Handling

### Stock Move Errors
| Scenario | HTTP | Error Message |
|----------|------|---------------|
| LP not found | 404 | "License Plate LP-001234 not found" |
| Location not found | 404 | "Location WH-A-01 not found or inactive" |
| Same location | 400 | "Source and destination locations are the same" |
| Invalid location type | 400 | "Cannot move from Receiving to Production directly. Use putaway first." |
| Cross-warehouse without TO | 400 | "Cross-warehouse moves require Transfer Order. Use TO for inter-warehouse transfer." |

### Pallet Errors
| Scenario | HTTP | Error Message |
|----------|------|---------------|
| Pallet not found | 404 | "Pallet PALLET-001 not found" |
| Cannot add to closed pallet | 400 | "Cannot add LP to closed pallet. Open new pallet or reopen this one." |
| LP already in pallet | 409 | "LP-001234 is already assigned to another pallet PALLET-002" |
| Invalid status transition | 400 | "Cannot close pallet with 0 items. Add LPs first." |

---

## Testing Strategy

### Unit Tests
- Stock move creation and validation
- Location validation logic
- Pallet status transitions
- Movement type categorization

### Integration Tests
- Move LP between locations (stock_move created)
- Partial move (split + move)
- Pallet lifecycle (create → add LPs → close → move → ship)
- Multi-move audit trail

### E2E Tests
- Full movement flow: receiving location → putaway to storage → pick for WO → move to shipping
- Pallet operations: create → add 5 LPs → move pallet → close → verify all LPs moved

---

## References
- Epic 5 Definition: [docs/epics/05-warehouse.md]
- Batch 5A (Prerequisite): [docs/batches/05A-tech-spec.md]
