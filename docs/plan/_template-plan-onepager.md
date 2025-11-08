
---

## 🧩 2️⃣ `docs/plans/_template-plan-onepager.md`

```md
---
id: 000
title: TEMPLATE PLAN
module: PLAN
priority: P0
owner: @mariusz
status: draft
created: 2025-11-08
updated: 2025-11-08
tags: [template, plan, filament-style]
---

## Brief (≤5 zdań)
Opis zadania, jego celu i korzyści.

## Impact Analysis
Jakie moduły/UI/API/DB/RLS dotyczy zmiana i dlaczego.

## File Plan
- /app/(module)/component.tsx — nowy formularz
- /lib/api/module.ts — endpoint POST
- /supabase/migrations/xxx_new_table.sql — migracja
- /tests/module.test.ts — testy jednostkowe

## DB & RLS
Tabela, kolumny, indeksy, reguły RLS (read/write, owner-based).

## Contracts
Zdefiniuj typy Zod, DTO, endpointy, statusy (enumy).

## Algorithm / Flow
Pseudokod przepływu danych i akcji użytkownika.

## Tests First
Scenariusze testowe i przypadki brzegowe.

## DoD
- testy zielone  
- `tsc` clean  
- RLS aktywny  
- UX zgodny z Filament-style  
- commity poprawne  

## Risks & Notes
Ryzyka, ograniczenia, zależności.

## Links
Źródła, referencje, dokumentacja.
