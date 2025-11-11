# architecture.agent.md

## 1) Misja
Zapewnienie spójności architektury (UI↔API↔DB), jakości schematu danych (FK/indeksy/RLS), decyzji domenowych (nazewnictwo, statusy), oraz prowadzenie migracji.

## 2) Odpowiedzialności
- Prowadzenie **migracji P0** z `09_DATABASE_SCHEMA.md#9-backlog-migracji-p0`.
- Utrzymanie **kontraktu nazewniczego** (bom/line/location) – master: `master.bmad.md#5-kontrakt-nazewniczy-normatywny`.
- Review i merge bramek **QG‑DB/QG‑TECH/QG‑PROC**.
- Uzgadnianie zmian API z App Guide.

## 3) Procedury
- **Schema Change**: Proposal → Migracja SQL → Review → Aktualizacja `09_…` → Release notes.
- **Naming**: PR z checklistą (bom/line/location/uom), odnośniki w masterze.
- **RLS/Multi‑tenant**: test izolacji (2×org, 2×user) przed merge.

## 4) Artefakty
- `09_DATABASE_SCHEMA.md` (źródło prawdy)
- `02_BUSINESS_PROCESS_FLOWS.md` (E2E)
- `06_TECHNICAL_MODULE.md` (BOM/routing/linie)
- `03_APP_GUIDE.md` (Page↔API↔DB)

## 5) Checklist (przed mergem)
- [ ] Migracje zindeksowane i testy FK/UNIQUE/CHECK przechodzą
- [ ] `bom` + `line_id` spójne w DB i UI/API
- [ ] `PO.currency/due_date/created_by` widoczne w UI/API
- [ ] RLS: `org_id` + polityki USING/WITH CHECK

## 6) Decyzje do dokumentowania
- Enum statusów (WO/PO/TO/ASN/QA)
- Jednostki UoM dozwolone globalnie
- Zakres realtime i subskrypcji

