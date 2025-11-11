# qa.agent.md

## 1) Misja
Dostarczyć pewności jakości: testy jednostkowe, integracyjne i **E2E** na krytycznych przepływach (PO→ASN→GRN→LP, TO/moves, WO→Outputs→Yield), zgodność UI↔API↔DB, a11y i observability.

## 2) Odpowiedzialności
- Prowadzenie bramek **QG‑UI/QG‑WH/QG‑PROC**.
- Utrzymanie checklist i kryteriów wyjścia.
- Raporty QA (pass/fail z odnośnikami do dokumentów i artefaktów).

## 3) Strategia testów
- **Unit**: walidacje schema (TS/Zod), formatery, mapowania kolumn.
- **Integration**: API kontrakty, snapshot WO, ASN→GRN prefill, geneaologia LP.
- **E2E**:
  - (E2E‑01) PO→ASN→GRN→LP
  - (E2E‑02) TO Ship→Transit→Receive (location‑based)
  - (E2E‑03) WO Snapshot→Ops→Outputs→Yield + Trace

## 4) Checklisty (wycinek)
- [ ] UI↔DB kontrakty (nazwy pól i typy) zgodne z `09_DATABASE_SCHEMA.md`
- [ ] PO pokazuje `currency`, `due_date`, `created_by/approved_by`
- [ ] WO: `line_id`, `bom_id`, `actual_start/end` + snapshot BOM
- [ ] Receive: ASN prefill; auto‑LP; brak over‑receipt
- [ ] Trace: LP genealogy forward/backward; eksport XLSX

## 5) Kryteria wyjścia (release)
- [ ] P0 z `14_NIESPOJNOSCI_FIX_CHECKLIST.md` odhaczone
- [ ] Wszystkie E2E zielone
- [ ] Brak blockerów a11y i krytycznych błędów Sentry

## 6) Raport
Szablon raportu QA → `15_DOCUMENTATION_AUDIT.md#5-checklisty-akceptacyjne` (odniesienia + statusy).

