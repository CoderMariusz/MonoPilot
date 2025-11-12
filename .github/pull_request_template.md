# Podsumowanie

- Krótki opis celu i kontekstu zmian.

## Typ zmiany

- [ ] feat
- [ ] fix
- [ ] chore
- [ ] docs
- [ ] test

## Powiązane zagadnienia

- Closes #
- Relates to #

## Zakres i wpływ

- Co zostało zmienione (moduły, endpointy, komponenty).
- Potencjalny wpływ na istniejące funkcje i dane.

## Zmiany (skrót)

-
-

## Zrzuty ekranu / wideo (UI)

- Jeśli dotyczy, dołącz materiały poglądowe.

## Jak testować (lokalnie)

```bash
pnpm install
pnpm type-check
pnpm test
# opcjonalnie
pnpm test:e2e:critical
```

## BMAD Quality Gates — Minimal Pass

- QG‑AUDIT (docs/12_NIESPOJNOSCI_FIX_CHECKLIST.md)
  - [ ] P0 zidentyfikowane i rozwiązane lub N/A z uzasadnieniem
- QG‑DB (docs/09_DATABASE_SCHEMA.md)
  - [ ] Migracje dodane i przetestowane
  - [ ] Dokumentacja schematu zaktualizowana
  - [ ] PK/FK/indeksy oraz RLS zgodne z ustaleniami
- QG‑UI (docs/03_APP_GUIDE.md)
  - [ ] Lint i type‑check bez ostrzeżeń
  - [ ] Brak błędów w konsoli przeglądarki
  - [ ] Krytyczne E2E zielone (apps/frontend/e2e/…)
  - [ ] Kontrakt typów API↔UI zgodny
- QG‑PROC (docs/02_BUSINESS_PROCESS_FLOWS.md)
  - [ ] `pnpm test:e2e:critical` zielone
  - [ ] Seed danych aktualny (jeśli dotyczy)
- QG‑TECH (docs/06_TECHNICAL_MODULE.md)
  - [ ] Pola/relacje, routing, UoM zgodne z dokumentacją
  - [ ] Kluczowe ścieżki zweryfikowane (E2E lub opis ręcznej weryfikacji)
- QG‑WH (docs/07_WAREHOUSE_AND_SCANNER.md)
  - [ ] Receive/Moves/Split/Merge/Pack zweryfikowane (E2E lub ręcznie)

## Wykonane sprawdzenia

- [ ] `pnpm type-check`
- [ ] `pnpm lint` i `pnpm format:check`
- [ ] `pnpm test:unit`
- [ ] `pnpm test:e2e:critical` (jeśli dotyczy)
- [ ] `pnpm docs:update` (jeśli dotyczy)
- [ ] `pnpm gen-types` (jeśli dotyczy; wymaga Supabase CLI)

## Środowisko i migracje

- Zmiany `.env` (jeśli są):
- Kroki migracji/rollback:

## Ryzyka i wdrożenie

- Ryzyka/regresje:
- Flagi funkcji/feature toggles:
- Monitoring/rollout plan:

---

Uwaga: Niniejszy szablon ma charakter pomocniczy i nie zmienia konfiguracji BMAD. Trzymaj się kroków i bramek z `docs/master_bmad.md`.
