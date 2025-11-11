---
id: 001
title: Dodanie kolumn „Made / Progress” w tabeli Work Orders
module: PLAN
priority: P0
owner: @mariusz
status: draft
created: 2025-11-08
updated: 2025-11-08
tags: [plan, wo, progress, filament-style]
---

## Brief (≤5 zdań)
Celem jest pokazanie w tabeli **Work Orders** dwóch nowych kolumn – *Made* i *Progress* – które obliczają aktualny postęp z danych `production_outputs`.  
Użytkownicy zobaczą na liście WO wizualny postęp wykonania pracy.  
Plan obejmuje aktualizację modelu, endpointu API i logiki w UI.  

## Impact Analysis
- UI: tabela Work Orders (nowe kolumny i procentowy pasek).  
- API: dodanie agregacji produkcji po WO.  
- DB: brak zmian w strukturze, tylko query.  
- Testy: E2E dla kalkulacji postępu.

## File Plan
- `/app/(planning)/work-orders/page.tsx` — dodaj kolumny Made i Progress  
- `/lib/api/workOrders.ts` — agregacja `production_outputs`  
- `/tests/planning/workOrders.test.ts` — testy kalkulacji

## DB & RLS
Bez nowej tabeli; tylko SELECT z `production_outputs`.  
RLS: tylko rekordy powiązane z WO użytkownika.

## Contracts
```ts
type WorkOrderProgress = {
  wo_id: string
  made_qty: number
  progress_pct: number
}
