# Track B: UI Audit Report

**Agent:** FRONTEND-DEV
**Date:** 2025-12-06
**Status:** Complete

---

## Executive Summary

Przeprowadzono audyt 25+ formularzy UI porównując z migracjami SQL. Formularze mają solidne podstawy (walidacja, error handling, API integration), ale brakuje ~10 pól w UI które są obsługiwane w backend.

---

## Missing Fields by Module

### Technical Module

#### BOMFormModal
**Brakuje:**
- `routing_id` Select
- `units_per_box` Input
- `boxes_per_pallet` Input
- Production lines badge/multi-select UI

**Linia:** 78-80 formData zawiera pola, ale brak FormField w JSX

#### BOMItemFormModal
**Brakuje:**
- `is_by_product` Checkbox + `yield_percent` Input
- `condition_flags` multi-select
- `condition_logic` Radio (AND/OR)
- `line_ids` assignment

**Linia:** Migracja 025: 29-38 definiuje pola, FormModal 57-68 nie obsługuje

#### ProductFormModal
**Brakuje:**
- Supplier selection UI (kod istnieje linie 112-115, UI brak)

### Planning Module

#### POLineFormModal
**Brakuje:**
- `tax_rate` Select
- `tax_amount` display (read-only)

**Linia:** Tylko quantity, unit_price, discount_percent (62-70)

#### WorkOrderFormModal
**Problem:**
- Niejasne: machines vs production_lines (naming confusion)
- `machines` array ale fetch z `/api/settings/machines`

#### TransferOrderFormModal
**Brakuje:**
- Location-level selection (tylko warehouse level)

### Settings Module

#### LocationDetailModal
**Brakuje (conditional):**
- `zone` field gdy zone_enabled = true
- `capacity` field gdy capacity_enabled = true

---

## Missing Logic Issues

| Component | Problem |
|-----------|---------|
| BOM Auto-versioning | UI nie pokazuje logic wersjonowania |
| Product Code | Brak indication że code jest immutable po creation |
| Machine Status | Brak warning przy status active→down |
| Tax Calculation | POLine nie pokazuje auto-calculation |

---

## Recommendations

### CRITICAL (Story 2.12, 2.13):
1. Dodaj UI dla BOMItemFormModal byproducts i conditional flags

### HIGH:
2. Dodaj missing BOMFormModal fields (routing_id, units_per_box, boxes_per_pallet)
3. Dodaj Production Lines selection do BOMItemFormModal

### MEDIUM:
4. Dodaj Supplier selection UI do ProductFormModal
5. Dodaj tax calculation display do POLineFormModal
6. Wyjaśnij production_lines vs machines w WorkOrderFormModal

### LOW:
7. Sprecyzować location vs warehouse level dla TransferOrders
8. Dodaj zone/capacity fields do LocationDetailModal

---

## Pattern to Follow

**Badge + Multi-select pattern:**
`MachineFormModal.tsx` (linie 356-427) - używaj dla line_ids, condition_flags

**React Hook Form + Zod:**
Konsekwentnie dla walidacji we wszystkich formach
