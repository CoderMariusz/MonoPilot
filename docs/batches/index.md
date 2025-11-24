# Batches Index

**Organizacja:** Batches według epiców z prefiksem `0XB-nazwa`
- **0X**: Numer epicu (01-09)
- **B**: Batch identifier
- **nazwa**: Krótka nazwa batcha

## Co to jest Batch?

Batch to logiczne grupowanie stories w ramach epicu dla:
- **Oszczędności tokenów** - implementujemy powiązane stories razem
- **Minimalizacji blokerów** - grupujemy według zależności
- **2-track development** - MVP + P1/P2 features równolegle

## Batch Structure

Każdy batch powinien zawierać:
- **MVP stories**: Minimalna funkcjonalność wymagana do działania
- **P1 stories**: Priorytet 1 - ważne usprawnienia
- **P2 stories**: Priorytet 2 - nice-to-have features
- **Tech spec**: Wspólna specyfikacja techniczna
- **Dependencies**: Lista blokerów i zależności
- **Implementation plan**: Plan wykonania (kolejność stories)

## Epic 01: Settings Module
- [01B-settings-mvp](01B-settings-mvp.md) - Batch 1: Authentication + Core Settings

## Epic 02: Technical Module
- [02B-products-crud](02B-products-crud.md) - Batch 2A: Products CRUD & Versioning
- [02C-bom-management](02C-bom-management.md) - Batch 2B: BOM Management
- [02D-routing](02D-routing.md) - Batch 2C: Routing Management
- [02E-traceability](02E-traceability.md) - Batch 2D: Traceability & Genealogy

## Epic 03: Planning Module
- [03B-orders-mvp](03B-orders-mvp.md) - Batch 3A: PO & TO Core CRUD
- [03C-wo-management](03C-wo-management.md) - Batch 3B: Work Order Management

## Epic 04: Production Module
(Batches TBD)

## Epic 05: Warehouse Module
(Batches TBD)

## Epic 06: Quality Module
(Batches TBD)

## Epic 07: Shipping Module
(Batches TBD)

## Epic 08: NPD Module
(Batches TBD)

## Epic 09: Performance Optimization
(Batches TBD)

---

**Implementation Strategy:**
1. Batch implementowany jako całość (nie story-by-story)
2. Wspólny tech spec dla całego batcha
3. Stories w batchu mają podział na MVP/P1/P2
4. Batch może mieć 2 traki: MVP track + Enhancement track
5. Batch uważany za ukończony gdy wszystkie MVP stories są DONE
