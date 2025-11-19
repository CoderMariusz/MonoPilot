# Story 0-20: Refaktoryzacja Inline Types w Komponentach WorkOrder

## Kontekst

Po wykonaniu stories 0-13 do 0-19 (DB/API alignment), pozostało **119 błędów TypeScript** wynikających z inline type definitions w komponentach, które używają starych nazw pól WorkOrder.

## Problem

Komponenty definiują **lokalne typy** zamiast używać wspólnego typu `WorkOrder` z `lib/types.ts`:

```typescript
// Przykład z WorkOrderDetailsModal.tsx
type WOData = {
  quantity: number;           // ❌ powinno być planned_qty
  due_date: string;           // ❌ powinno być scheduled_date
  scheduled_start?: string;   // ❌ powinno być start_date
  scheduled_end?: string;     // ❌ powinno być end_date
  line_number?: number;       // ❌ powinno być production_line_id
}
```

## Pliki do refaktoryzacji

| Plik | Błędy | Priorytet |
|------|-------|-----------|
| `app/scanner/process/page.tsx` | 26 | WYSOKI |
| `components/WorkOrderDetailsModal.tsx` | 25 | WYSOKI |
| `components/CreateWorkOrderModal.tsx` | 16 | WYSOKI |
| `lib/clientState.ts` | 14 | WYSOKI |
| `components/WorkOrdersTable.tsx` | 9 | ŚREDNI |
| `components/LPOperationsTable.tsx` | 3 | NISKI |
| `components/CreateGRNModal.tsx` | 3 | NISKI |
| `components/CompositeProductModal.tsx` | 3 | NISKI |
| Inne (6 plików) | 20 | NISKI |

**Total: 119 błędów w 14 plikach**

## Akceptacja

1. ✅ `pnpm type-check` przechodzi bez błędów
2. ✅ Wszystkie komponenty używają typu `WorkOrder` z `lib/types.ts`
3. ✅ Usunięte duplikowane inline type definitions
4. ✅ Testy E2E dla WorkOrder przechodzą

## Zadania

### 1. Analiza inline types (1h)
- [ ] Zidentyfikuj wszystkie inline type definitions
- [ ] Zmapuj stare nazwy pól → nowe nazwy

### 2. Refaktoryzacja komponentów (3h)
- [ ] `scanner/process/page.tsx` - usuń inline type, użyj WorkOrder
- [ ] `WorkOrderDetailsModal.tsx` - usuń inline type, użyj WorkOrder
- [ ] `CreateWorkOrderModal.tsx` - usuń inline type, użyj WorkOrder
- [ ] `clientState.ts` - napraw ID types (number vs string)
- [ ] `WorkOrdersTable.tsx` - usuń inline type, użyj WorkOrder

### 3. Pozostałe pliki (1h)
- [ ] `LPOperationsTable.tsx`
- [ ] `CreateGRNModal.tsx`
- [ ] `CompositeProductModal.tsx`
- [ ] Inne 6 plików

### 4. Testy i weryfikacja (1h)
- [ ] Uruchom `pnpm type-check`
- [ ] Uruchom `pnpm test:e2e:critical`
- [ ] Przetestuj manualnie WorkOrder flows

## Mapowanie pól

| Stara nazwa | Nowa nazwa | Typ |
|-------------|------------|-----|
| `quantity` | `planned_qty` | number |
| `due_date` | `scheduled_date` | string \| null |
| `scheduled_start` | `start_date` | string \| null |
| `scheduled_end` | `end_date` | string \| null |
| `actual_start` | `start_date` | string \| null |
| `actual_end` | `end_date` | string \| null |
| `line_number` | `production_line_id` | number \| null |
| `id` (string) | `id` (number) | number |

## Szacowany czas

**6 godzin** pracy developerskiej

## Zależności

- Wymaga ukończenia stories 0-13 do 0-19 (DB/API alignment) ✅
- Przed merge: uruchomić pełne testy E2E

## Notatki

Story powstało w wyniku analizy zgodności DB/API/Types wykonanej przez BMAD Analyst.
Commity naprawiające część problemów:
- `f7ed393` - Partial DB/API alignment
- `f147320` - Extensive alignment (61 files)
- `70ac7ea` - Type definitions
- `fd20d4d` - Component field updates
