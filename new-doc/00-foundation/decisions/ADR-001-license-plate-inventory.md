# ADR-001: License Plate (LP) Based Inventory Model

## Status: ACCEPTED

**Date**: 2025-12-10
**Decision Makers**: Architecture Team
**Related PRDs**: Warehouse (Epic 5), Production (Epic 4), Quality (Epic 6)

---

## Context

MonoPilot requires an inventory management approach that supports:
1. Full batch traceability for food safety regulations (FSMA, EU Reg 178/2002)
2. FIFO/FEFO picking for perishable goods
3. Lot-level quality holds and recalls
4. GS1 compliance for supply chain integration
5. Production genealogy (which inputs created which outputs)

Traditional inventory approaches:
- **Quantity-based**: Simple but no traceability
- **Lot-based**: Good traceability but complex split/merge
- **License Plate (LP)**: Atomic units with full genealogy

---

## Decision

**Adopt License Plate (LP) as the atomic unit of inventory.**

Every inventory movement operates on LPs:
- Receiving creates LPs
- Storage tracks LPs by location
- Production consumes/produces LPs
- Shipping picks LPs
- Quality holds LPs

No "loose quantity" tracking - all inventory is LP-based.

---

## Implementation

### LP Structure

```typescript
interface LicensePlate {
  id: string
  lp_number: string         // GS1-128 compliant
  product_id: string
  quantity: number          // Initial quantity (immutable)
  current_qty: number       // Current quantity (decrements on partial use)
  uom: string
  status: LPStatus          // available|reserved|consumed|shipped|merged|quarantine
  warehouse_id: string
  location_id: string
  supplier_batch_number: string
  manufacturing_date: string
  expiry_date: string
  received_date: string
}

type LPStatus = 'available' | 'reserved' | 'consumed' | 'shipped' | 'merged' | 'quarantine' | 'deleted'
```

### LP Lifecycle

```
CREATE (GRN)
    |
    v
AVAILABLE --> RESERVED (WO allocation)
    |              |
    v              v
QUARANTINE    CONSUMED (production)
    |              |
    v              v
RELEASED      MERGED (consolidation)
    |
    v
SHIPPED (sales order)
```

### Genealogy Tracking

```sql
CREATE TABLE lp_genealogy (
  id UUID PRIMARY KEY,
  parent_lp_id UUID REFERENCES license_plates(id),
  child_lp_id UUID REFERENCES license_plates(id),
  relationship_type TEXT,  -- 'production', 'split', 'merge'
  work_order_id UUID,
  quantity_from_parent NUMERIC,
  uom TEXT,
  created_at TIMESTAMPTZ
);
```

---

## Alternatives

| Option | Pros | Cons |
|--------|------|------|
| **Quantity-based** | Simple implementation; familiar to users | No traceability; impossible recalls; no FIFO |
| **Lot-based** | Good traceability; industry standard | Complex split/merge; partial quantities messy |
| **LP-based (chosen)** | Full genealogy; atomic operations; GS1 native | More records; user training needed; slight overhead |

---

## Consequences

### Positive

1. **Complete Traceability**: Forward and backward trace from any LP
2. **Regulatory Compliance**: FSMA, EU 178/2002 traceability requirements met
3. **Recall Precision**: Identify exact affected inventory, not entire lots
4. **FIFO/FEFO Enforcement**: Pick by LP received/expiry date
5. **GS1 Native**: LP numbers map directly to SSCC-18, GS1-128
6. **Quality Control**: Hold/release at LP level, not warehouse level

### Negative

1. **Record Volume**: More database records than quantity-based
2. **User Training**: Operators must scan/select LPs, not enter quantities
3. **UI Complexity**: LP selection dialogs needed for all operations
4. **Partial Handling**: Must track `current_qty` for partial consumption
5. **Merge Complexity**: LP consolidation requires genealogy maintenance

### Mitigation

| Challenge | Mitigation |
|-----------|------------|
| Record volume | Database indexing; archival strategy |
| User training | Scanner-first UI; auto-suggestions |
| UI complexity | Smart defaults; FIFO/FEFO suggestions |
| Partial handling | `consume_whole_lp` flag for bulk materials |
| Merge complexity | Stored procedure for atomic merge |

---

## Validation

This decision was validated against:
- [x] FSMA Section 204 traceability requirements
- [x] EU Regulation 178/2002 food traceability
- [x] GS1 Global Traceability Standard
- [x] Competitor analysis (Plex, AVEVA, CSB-System all use LP)

---

## References

- PRD Warehouse Module: `docs/1-BASELINE/product/modules/warehouse.md`
- PRD Production Module: `docs/1-BASELINE/product/modules/production.md`
- LP Service: `apps/frontend/lib/services/lp-service.ts`
- Genealogy Service: `apps/frontend/lib/services/genealogy-service.ts`
