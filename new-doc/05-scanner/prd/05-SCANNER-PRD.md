# PRD 05-Scanner — MonoPilot MES
**Wersja**: 1.2 | **Data**: 2026-02-18 | **Status**: Draft

---

## 1. Executive Summary

Scanner (M05) to dedykowany moduł mobilny MonoPilot, zaprojektowany jako osobny interfejs użytkownika dla operatorów hali produkcyjnej i magazynu. Scanner NIE jest responsywną wersją desktopu — to odrębne, zoptymalizowane doświadczenie (ADR-006), dostępne pod `/scanner/*`, z liniowymi workflow'ami opartymi o skanowanie kodów kreskowych jako główną metodę wprowadzania danych.

**Kluczowa decyzja**: Scanner = osobny UX, nie responsywny desktop. Dedykowane strony, duże touch targety (48dp+), scan-first input, offline queue, ciemny motyw, minimalna liczba decyzji na ekranie.

**Model budowy**: Inkrementalny — moduł rośnie etapami w miarę budowy kolejnych modułów (M03 Warehouse → M04 Planning → M06 Production → M07 Shipping → M08 Quality). Każdy etap odblokowuje nowe workflow'y skanera.

**Cel użytkownika**: Wykonanie operacji magazynowo-produkcyjnej w < 30 sekund na scan, bez konieczności używania klawiatury, w warunkach hali (hałas, rękawice, słabe oświetlenie, niestabilna sieć).

---

## 2. Objectives

### Cel główny
Dostarczyć operatorom hali produkcyjnej i magazynu narzędzie mobilne umożliwiające realizację kluczowych operacji (receive, move, pick, consume, output, QA) poprzez skanowanie kodów kreskowych, z czasem operacji < 30 s i wsparciem offline.

### Cele drugorzędne
1. **Eliminacja papieru** — zastąpienie papierowych list pickingowych, GRN i checklist QA
2. **Trasowalność real-time** — każdy scan aktualizuje LP genealogy natychmiast (lub po sync)
3. **Adopcja operatorów** — intuicyjny UX, szkolenie < 1 godzina
4. **Wsparcie sprzętowe** — kompatybilność z Zebra TC52/MC3300, Honeywell CT60/CK65, ring scannery, iPhone, Android

### Metryki sukcesu (moduł)

| Metryka | Cel | Pomiar |
|---------|-----|--------|
| Czas operacji skanera | < 30 s per scan | APM / user sessions |
| % scan success (1st attempt) | > 95% | Logi skanera |
| Offline queue success rate | > 99% | Sync logs |
| Avg scan latency (lookup) | < 500 ms | APM |
| Error rate (invalid scan) | < 5% | Logi skanera |
| % manual entry (fallback) | < 10% | Analytics |
| Adopcja operatorów | > 80% w ciągu 2 tyg. | User tracking |

---

## 3. Personas

### Persony główne (Scanner)

**1. Operator magazynu** — GRN receiving, stock moves, picking. Używa Zebra TC52 lub ring scanner RS6000. Rękawice, stojąca praca. Kryterium: operacja < 30 s, zero manual entry.

**2. Operator produkcji** — material consumption (scan LP → confirm qty), output registration (scan WO → enter qty → create LP). Tablet na stanowisku lub handheld. Kryterium: consume + output w < 45 s.

**3. Inspektor QA** — QA pass/fail/hold na LP lub CCP monitoring. Scan LP → wynik → notes. Kryterium: inspekcja < 60 s, offline support (chłodnia).

### Persony drugorzędne

| Rola | Workflow Scanner |
|------|------------------|
| Kierownik zmiany | Podgląd postępu (dashboard scanner — read-only) |
| Supervisor | Override (np. force-complete, FIFO skip z audit trail) |
| Picker (wysyłka) | Pick → pack workflow (M07) |

---

## 4. Scope

### 4.1 In Scope — Phase 1 (MVP)

| Epik | Odblokowany po | Workflow'y |
|------|----------------|------------|
| M05-E1: Scanner Shell & Core | M01 Settings | Layout, auth, scan input component, settings, feedback system |
| M05-E2: Warehouse Workflows | M03 Warehouse | Receive (GRN), Putaway (LP → suggested location), Move (LP → location) |
| M05-E3: Production Pick | M04 Planning, M06 Production | Pick for WO (FIFO/FEFO → LP → confirm). SO pick rozszerzenie po M07. |
| M05-E4: Production Workflows | M06 Production | Consume (WO → scan LP → qty), Output (WO → qty → create LP) |
| M05-E5: QA Workflows | M08 Quality | QA Pass/Fail/Hold (scan LP → result → notes) |

### 4.2 Out of Scope — Phase 2

| Epik | Uzasadnienie |
|------|-------------|
| M05-E6: Offline Mode (IndexedDB) | Wymaga stabilnych workflow'ów online |
| M05-E7: Advanced Barcode & Hardware | Camera scanning (quagga2/zxing), ring scanner pairing, SSCC-18 palet |
| M05-E8: Stock Audit / Cycle Count | Po M03 Warehouse advanced |
| M05-E9: Split/Merge LP | Po M03 Warehouse advanced |
| M05-E10: Pack & Ship | Po M07 Shipping |
| M05-E11: PWA (installable) | Po stabilizacji Phase 1 |
| M05-E12: CCP Monitoring | Po M08 Quality advanced (HACCP full) |

### 4.3 Exclusions (Nigdy)

- **Native mobile app** — wyłącznie PWA / web
- **Dashboard/raporty** na skanerze — widok tylko na desktop
- **Konfiguracja systemu** — Settings wyłącznie na desktop
- **CRUD master data** — produkty, BOM, routingi edytowane na desktop
- **Drukowanie** — etykiety ZPL przez desktop, nie przez skaner (Phase 2: print trigger z scanner)

---

## 5. Constraints

### Techniczne
- **Web-only** — brak native app; PWA w Phase 2
- **Hardware scanner input** — keyboard wedge mode (HID), Enter jako terminator
- **Camera scanning** — Phase 2 (wymaga quagga2 lub @nickersoft/barcode-detector)
- **Offline** — Phase 2 (IndexedDB queue, max 100 operacji, Background Sync API)
- **Dark theme** — obowiązkowy (slate-900 bg, white text, high contrast) dla czytelności w magazynie
- **Touch targets** — minimum 48dp (przyciski), 64dp (elementy listy), 72dp (primary actions)
- **Barcode formats Phase 1** — Code 128, GS1-128 (AI: 01 GTIN, 10 Batch, 17 Expiry, 21 Serial, 310x Weight)
- **Barcode formats Phase 2** — QR Code, SSCC-18, Data Matrix
- **Max payload offline** — 100 operacji × ~5 KB = ~500 KB (w limitach IndexedDB)
- **Supabase RLS** — org_id na każdym zapytaniu, identycznie jak desktop

### Biznesowe
- **Inkrementalna budowa** — Scanner rośnie z modułami; nie można budować M05-E4 (Production) przed M06
- **Shared services** — Scanner używa tych samych serwisów (`lib/services/*`) co desktop; różni się tylko UI
- **Szkolenie** — operator musi być produktywny po < 1 h szkolenia
- **Urządzenia docelowe** — Zebra TC52/TC57, MC3300, Honeywell CT60/CK65, iPhone 12+, Samsung A-series

### Regulacyjne
- **Audit trail** — każdy scan logowany (user, timestamp, barcode, result, device_type)
- **Trasowalność** — scan LP → genealogy update w < 30 s
- **GS1 compliance** — parsowanie AI zgodne ze standardem GS1, walidacja GTIN check digit

---

## 6. Decisions

### D1. Scanner-First UX (ADR-006) — OBOWIĄZKOWE

Scanner to **osobny interfejs**, nie responsywny desktop. Zasady:

| Reguła | Wartość | Uzasadnienie |
|--------|---------|-------------|
| Routing | `/scanner/*` (osobne od desktop) | Odrębny UX, osobny layout |
| Layout | Bez sidebar, ciemny motyw, fixed bottom action bar | Maksymalna powierzchnia robocza |
| Input | Scan-first (keyboard wedge), manual entry jako fallback | Hardware scanner = primary |
| Flow | Liniowy (step-by-step), max 3-5 kroków | Minimalizacja decyzji |
| Touch targets | Min 48dp (przyciski), 64dp (list items), 72dp (primary) | Rękawice, precyzja |
| Text | Primary 24px, secondary 18px | Czytelność z dystansu |
| Contrast | Ciemne tło (slate-900), biały tekst | Warunki magazynowe |
| Auto-advance | Po udanym scanie → następny krok automatycznie | Szybkość |
| Soft keyboard | `inputMode="none"` domyślnie (hardware scanner) | Nie zasłania ekranu |

### D2. Feedback Patterns — STANDARD

| Zdarzenie | Audio | Haptic | Visual |
|-----------|-------|--------|--------|
| Scan success | 1 × długi beep (500ms) | Krótka wibracja (100ms) | Zielony flash + checkmark |
| Scan error | 2 × krótkie beep (200ms) | Podwójna wibracja (100ms×2) | Czerwony flash + error message |
| Warning | 1 × średni ton | Długa wibracja (300ms) | Żółty banner |
| Critical | 3 × krótkie beep | Silna wibracja (500ms) | Full-screen error |

### D3. Offline Queue (Phase 2) — SPECYFIKACJA

- **Storage**: IndexedDB (`scanner-queue` database)
- **Max operacji**: 100 (ustandaryzowane — dotyczy WH, PROD i QA)
- **Max payload**: ~500 KB
- **Sync trigger**: Auto on `navigator.onLine` event + manual retry button
- **Retry**: 3 próby z exponential backoff (1s, 5s, 15s)
- **Conflict resolution**: Server-side validation; jeśli fail → oznacz jako `failed` z error message, user decyduje
- **Queue order**: FIFO (chronologicznie)
- **TTL**: 72h (po przekroczeniu → oznacz jako expired, user musi powtórzyć)
- **State machine**: `queued → syncing → synced | failed | expired`

### D4. Barcode Formats & GS1 Parsing

**Phase 1 — obowiązkowe formaty**:

| Format | Użycie | Parsowanie |
|--------|--------|------------|
| Code 128 | LP barcode, lokalizacja | Direct match (lookup by barcode) |
| GS1-128 | Produkty, partie, daty | AI parsing: 01=GTIN-14, 10=Batch/Lot, 17=Expiry (YYMMDD), 21=Serial |
| Manual input | Fallback | Free-text, walidacja server-side |

**Phase 2**:

| Format | Użycie |
|--------|--------|
| QR Code | CCP checkpoints, operation codes |
| SSCC-18 | Palety (AI 00) |
| Data Matrix | Małe etykiety, specjalne produkty |
| GS1-128 extended | AI 13=Pack date, AI 15=Best before, AI 310x=Net weight |

**GS1 Parsing Rules**:
- GTIN-14 check digit validation (modulo 10)
- Date format: YYMMDD → ISO 8601 conversion
- Variable-length AI: Group Separator (GS, ASCII 29) jako delimiter
- Unknown AI → log warning + pass raw value

### D5. Hardware Integration

| Typ urządzenia | Metoda wejścia | Wykrywanie |
|----------------|----------------|------------|
| Zebra TC52/MC3300 | Keyboard wedge (HID), Enter terminator | User-Agent: `/Zebra/i` |
| Honeywell CT60/CK65 | Keyboard wedge (HID), Enter terminator | User-Agent: `/Honeywell/i` |
| Ring scanner (Bluetooth) | Keyboard wedge (BT HID) | BT paired, input events |
| iPhone/Android | Camera (Phase 2) | `navigator.mediaDevices` check |
| Manual | Soft keyboard | Fallback — always available |

**Detection flow**: `detectScannerType()` → `'hardware'` | `'camera'` | `'manual'` — automatyczne przełączanie UI mode.

### D6. Scanner API Routes — KONSOLIDACJA

Wszystkie Scanner API endpoints pod `/api/scanner/*` lub reuse istniejących `/api/{module}/*`:

| Zasada | Decyzja |
|--------|---------|
| Shared endpoints | `/api/scanner/lookup/{type}/{barcode}` — LP, product, location, PO |
| Module-specific | Reuse: `/api/warehouse/scanner/*`, `/api/production/scanner/*`, `/api/quality/scanner/*` |
| Response format | Ustandaryzowany: `{ success: boolean, data?: T, error?: { code: string, message: string } }` |
| Error codes | Prefixowane: `SC_PRODUCT_NOT_FOUND`, `SC_LP_NOT_AVAILABLE`, `SC_QTY_EXCEEDS_AVAILABLE`, etc. |

### Decyzje biznesowe (bez ADR)
- Scanner NIE zastępuje desktop — obie wersje współistnieją, wspólne serwisy
- Scanner Phase 1 = online-only; offline dopiero w Phase 2 po stabilizacji workflow'ów
- Camera scanning (bez hardware) = Phase 2 (wymaga biblioteki barcode detection)
- Print trigger z scanner = Phase 2 (etykiety ZPL do drukowania na desktop)
- Test data seeding (`npm run seed:scanner`) wymagany dla development/QA — brak test data = brak możliwości testowania (ref: BUG-SC-002)
- **Putaway = osobny workflow** (nie duplikat Receive ani Move): Receive tworzy LP w receiving dock → Putaway przenosi LP do optymalnej lokalizacji (FIFO/FEFO suggestion) → Move = ręczne przeniesienie bez sugestii. Putaway Phase 1 = uproszczony (bez capacity check, bez zone restrictions — te w Phase 2)
- **scanner_audit_log = osobna tabela** (nie główny `audit_log` z ADR-008): wysoki wolumen scanów, prostsza struktura, osobna retencja 30 dni
- **Pick Phase 1 = WO-only** (production picking). SO pick (shipping) → rozszerzenie po M07 Shipping jako M05-E3b

**Wyjątek od ADR-008 (Audit Trail)**: M05 Scanner używa osobnej tabeli `scanner_audit_log` zamiast głównej `audit_log`. Uzasadnienie: wysoki wolumen skanów (setki/godzinę vs dziesiątki operacji CRUD), prostsza struktura danych (brak old_data/new_data — scan to zdarzenie jednorazowe bez stanu poprzedniego), osobna polityka retencji (30 dni vs 1 rok dla `audit_log`). Struktura kolumn jest identyczna z `audit_log` w zakresie wspólnych pól (user_id, org_id, timestamp, ip_address), z dodatkowymi polami specyficznymi dla skanera: `device_type`, `scan_method`, `barcode`, `scan_type`, `result`, `site_id`.

---

## 7. Module Map

### Scanner sub-areas

```
M05 Scanner
├── M05-E1: Scanner Shell & Core
│   ├── Layout (dark theme, no sidebar)
│   ├── ScanInput component (keyboard wedge + manual)
│   ├── Feedback system (audio/haptic/visual)
│   ├── Scanner settings (local storage)
│   ├── GS1 barcode parser
│   └── Auth & permission check
│
├── M05-E2: Warehouse Workflows (po M03)
│   ├── Receive (GRN): Scan PO → Scan Product → Qty → Confirm → LP create
│   ├── Putaway: Scan LP → System suggests location (FIFO/FEFO) → Scan location → Confirm
│   └── Move: Scan LP → Scan Destination → Confirm → Update location
│
├── M05-E3: Production Pick (po M04 + M06)
│   └── Pick for WO: Select WO → FIFO/FEFO suggest → Scan LP → Confirm → Allocate
│       (SO pick → rozszerzenie po M07 Shipping)
│
├── M05-E4: Production Workflows (po M06)
│   ├── Consume: Scan WO → Scan Material LP → Qty → Confirm → Update LP
│   └── Output: Scan WO → Enter Qty → Create LP → Genealogy link
│
├── M05-E5: QA Workflows (po M08)
│   └── QA Check: Scan LP → Pass/Fail/Hold → Notes → Update LP status
│
Phase 2:
├── M05-E6: Offline Mode (IndexedDB queue, sync, conflict resolution)
├── M05-E7: Advanced Barcode (camera, QR, SSCC-18, Data Matrix)
├── M05-E8: Stock Audit / Cycle Count
├── M05-E9: Split/Merge LP
├── M05-E10: Pack & Ship (po M07)
├── M05-E11: PWA (installable, manifest, service worker)
└── M05-E12: CCP Monitoring (po M08 advanced)
```

### Zależności budowy

```
M01 Settings ───────────────────────────────────┐
M03 Warehouse ─── M05-E2 (Receive, Putaway, Move) │
M04 Planning ──┐                                   ├── M05-E1 (Shell) = fundament
M06 Production ┴─ M05-E3 (Pick for WO)            │
M06 Production ── M05-E4 (Consume, Output)         │
M08 Quality ───── M05-E5 (QA)                      │
M07 Shipping ──── M05-E3b (Pick for SO) [rozszerzenie] │
                                                    │
M05-E1 musi być zbudowany PIERWSZY ────────────────┘
```

---

## 8. Requirements

### M05-E1: Scanner Shell & Core (Phase 1, MVP)

**Zależności**: M01 Settings (auth, roles, org_id)

#### Backend

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-BE-001 | `GET /api/scanner/lookup/{type}/{barcode}` — unified barcode lookup (type: `lp`, `product`, `location`, `po`). Zwraca obiekt + metadata. RLS: org_id. | HIGH |
| SC-BE-002 | GS1-128 parser utility (`lib/utils/gs1-parser.ts`): parsowanie AI codes (01, 10, 17, 21, 310x), GTIN check digit validation, date conversion YYMMDD→ISO. | HIGH |
| SC-BE-003 | Scanner error codes — ustandaryzowane: `SC_INVALID_BARCODE`, `SC_PRODUCT_NOT_FOUND`, `SC_LP_NOT_AVAILABLE`, `SC_LP_CONSUMED`, `SC_LP_QA_HOLD`, `SC_QTY_EXCEEDS`, `SC_PO_NOT_FOUND`, `SC_PO_FULLY_RECEIVED`, `SC_LOCATION_NOT_FOUND`, `SC_UNAUTHORIZED`, `SC_WO_NOT_IN_PROGRESS`. | HIGH |
| SC-BE-004 | Audit log entry na każdy scan: `{ user_id, org_id, site_id, barcode, scan_type, result, device_type, scan_method, timestamp, ip_address }`. **Osobna tabela `scanner_audit_log`** (NIE główny `audit_log` z ADR-008) — uzasadnienie: wysoki wolumen (setki scanów/h vs dziesiątki CRUD ops), prostsza struktura (brak old_data/new_data), osobna retencja (30 dni vs 1 rok). Kolumny: `site_id UUID NULL` (przygotowanie na M11 Multi-Site), `device_type TEXT` (zebra/honeywell/iphone/android/manual), `scan_method TEXT` (hardware_wedge/camera/manual). RLS: org_id. Indeksy: (org_id, timestamp), (org_id, barcode). | HIGH |
| SC-BE-005 | Test data seed script (`scripts/seed-scanner-test-data.ts`) — PO, products, suppliers, warehouses, WO, LP z poprawnymi statusami. Komendy: `npm run seed:scanner`, `npm run verify:scanner`. | HIGH |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-FE-001 | Scanner Layout (`/scanner/layout.tsx`): dark theme (slate-900), no sidebar, header 56px (BackButton + UserBadge + SyncStatus), full-height content, fixed bottom action bar. | HIGH |
| SC-FE-002 | ScanInput component: auto-focus, `inputMode="none"` (domyślnie), Enter jako terminator, manual entry toggle, clear after scan. Min height 64px, font 24px. | HIGH |
| SC-FE-003 | Scanner Home (`/scanner/page.tsx`): task selection grid (Receive, Move, Pick, Consume, Output, QA). Ikony 72×72dp, labels 18px. Widoczność wg roli użytkownika. | HIGH |
| SC-FE-004 | Feedback system: audio (Web Audio API), haptic (Vibration API), visual (color flash + icon). Konfigurowalny w Settings (on/off per typ). LocalStorage persistence. | HIGH |
| SC-FE-005 | Scanner Settings page (`/scanner/settings`): camera selection, beep toggle, vibration toggle, auto-advance toggle, scan timeout (s), session timeout (min). Persist: localStorage. | MEDIUM |
| SC-FE-006 | Device detection: `detectScannerType()` → `'hardware'` / `'camera'` / `'manual'`. Auto-adjust: hardware → hide soft keyboard; camera → show viewfinder (Phase 2); manual → show keyboard. | HIGH |
| SC-FE-007 | Permission guard: Scanner dostępny tylko dla ról z uprawnieniem `scanner.access`. Poszczególne workflow'y chronione per-role (np. `warehouse.receive`, `production.consume`). | HIGH |
| SC-FE-008 | Error states: full-screen error z retry button (scan errors), field-level validation (qty), network error → banner z retry. Wzorce z D2 (feedback patterns). | HIGH |

#### Integracje / Dependencies

- Auth context (M01): `useAuth()` → user, org_id, roles
- Permission check (M01): role-based access per workflow
- Audit service (`lib/services/audit-service.ts`): log scanner events

---

### M05-E2: Warehouse Workflows (Phase 1, MVP)

**Zależności**: M03 Warehouse (LP, GRN, locations, stock moves), M05-E1

#### Backend

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-BE-010 | `GET /api/warehouse/scanner/pending-receipts` — lista PO ze statusem `confirmed`/`approved`/`partial`. Include: lines count, received count, supplier name. RLS: org_id. | HIGH |
| SC-BE-011 | `GET /api/warehouse/scanner/lookup/po/{barcode}` — PO z liniami (products, qty ordered, qty received, remaining). | HIGH |
| SC-BE-012 | `POST /api/warehouse/scanner/receive` — accept receipt line: `{ po_id, po_line_id, product_id, qty_received, lot_number?, expiry_date?, location_id }`. Tworzy LP + GRN entry. Walidacja: qty ≤ remaining + tolerance (ADR over/under delivery). | HIGH |
| SC-BE-013 | `POST /api/warehouse/scanner/move` — move LP: `{ lp_id, destination_location_id }`. Walidacja: LP exists, LP available (nie consumed/shipped/hold), location exists, location ≠ current. Update `license_plates.location_id`. Audit log. | HIGH |
| SC-BE-014 | GRN validation rules: qty vs PO line (tolerance configurable), GS1-128 product matching (GTIN → product lookup), stock status auto-set (Available lub QC Pending wg konfiguracji). | HIGH |
| SC-BE-015 | `GET /api/warehouse/scanner/putaway/suggest/{lpId}` — sugestia optymalnej lokalizacji: FIFO zone (oldest stock) / FEFO zone (soonest expiry) / product preferred zone / default zone. Zwraca: suggested_location, reason, reason_code, alternatives[], strategy_used, lp_details. RLS: org_id. Response < 300ms. | HIGH |
| SC-BE-016 | `POST /api/warehouse/scanner/putaway` — execute putaway: `{ lp_id, location_id, suggested_location_id?, override: boolean, override_reason? }`. Tworzy stock_move (move_type='putaway'). Update LP.location_id. Override → audit log z suggested vs selected. | HIGH |
| SC-BE-017 | Putaway suggestion algorithm: 1) FEFO precedence jeśli enable_fefo=true (zone of soonest expiry LP), 2) FIFO jeśli enable_fifo=true (zone of oldest LP), 3) product.preferred_zone_id fallback, 4) default storage zone. Reuse FIFO/FEFO engine z M03. | HIGH |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-FE-010 | **Receive Workflow** (5 kroków): 1) Select PO (lista lub scan PO barcode) → 2) Review lines (progress bar per line: received/ordered) → 3) Scan product (GS1 match → auto-fill lot/expiry) → 4) Enter qty (number pad, domyślnie: remaining) → 5) Confirm → Success + "Scan Next". | HIGH |
| SC-FE-011 | Receive: PO selection — lista pending PO z: PO number, supplier, lines count, expected delivery. Alternatywa: scan PO barcode. | HIGH |
| SC-FE-012 | Receive: Line item display — product name, SKU, ordered qty, received qty, remaining, progress bar %. Color: green (complete), amber (partial), grey (not started). | HIGH |
| SC-FE-013 | **Move Workflow** (3 kroki): 1) Scan LP barcode → show LP details (product, qty, current location, status) → 2) Scan destination location barcode → show location name → 3) Confirm → Success + "Scan Next LP". | HIGH |
| SC-FE-014 | Move: LP validation display — jeśli LP na hold: show warning "LP is on QA Hold, cannot move" + block. Jeśli LP consumed: "LP already consumed". | HIGH |
| SC-FE-015 | **Putaway Workflow** (4 kroki): 1) Scan LP barcode → show LP details (product, qty, expiry, current location) → 2) View suggested location (code, zone, reason: "FIFO: near oldest stock" / "FEFO: similar expiry" / "Product zone") + alternatives list → 3) Scan destination location: jeśli match → green checkmark + auto-advance; jeśli override → yellow warning "Different from suggested" + "Use Anyway" / "Scan Suggested" → 4) Confirm summary → Success + "Putaway Another". | HIGH |
| SC-FE-016 | Putaway: Override display — yellow warning banner z: suggested location, scanned location, optional reason field. Override logowany w audit. Green confirm button (match) vs amber confirm button (override). | HIGH |
| SC-FE-017 | Putaway: Suggestion card — prominentne wyświetlenie: location code (duży, bold), zone path, reason text, strategy badge (FIFO/FEFO/Default). Alternatives jako lista poniżej. | HIGH |

#### Integracje

- LP service (`lib/services/lp-service.ts`): create, move, status check
- GRN service: create GRN entry
- PO service: fetch PO + lines, update received qty
- Location service: validate destination
- GS1 parser (SC-BE-002): parse scanned barcode → extract GTIN, lot, expiry

---

### M05-E3: Production Pick (Phase 1, MVP)

**Zależności**: M04 Planning (WO, pick lists), M06 Production (WO in IN_PROGRESS), M03 Warehouse (LP, FIFO/FEFO), M05-E1

**Uwaga**: Phase 1 = pick TYLKO dla WO (produkcja). SO pick (shipping) → rozszerzenie po M07 Shipping (M05-E3b).

#### Backend

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-BE-020 | `GET /api/production/scanner/pick-lists` — lista aktywnych WO pick lists z: WO number, product, items count, picked count, priority. RLS: org_id. Filtr: WO status IN_PROGRESS lub RELEASED. | HIGH |
| SC-BE-021 | `GET /api/production/scanner/pick-list/{woId}/suggestions` — FIFO/FEFO sugestie per BOM line: suggested LP (z najwcześniejszym receipt_date lub expiry_date), location, qty available. Enforcement: suggest (domyślnie) / warn / block. | HIGH |
| SC-BE-022 | `POST /api/production/scanner/pick` — pick confirmation: `{ wo_id, bom_line_id, lp_id, qty_picked }`. Walidacja: LP available, qty ≤ available, FIFO/FEFO enforcement level, material in BOM. Update LP qty (reserve/allocate), create pick record. | HIGH |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-FE-020 | **WO Pick Workflow** (5 kroków): 1) Select WO (lista active WOs) → 2) View pick list (BOM materials, sorted by location, FIFO/FEFO) → 3) Navigate to location (scan location barcode to confirm) → 4) Scan LP barcode (validate vs suggestion) → 5) Confirm qty → Success + "Next Item". | HIGH |
| SC-FE-021 | Pick: FIFO/FEFO suggestion display — suggested LP highlighted (green border), alternatywny LP z warning ("Not FIFO/FEFO order — override?"). Override wymaga potwierdzenia + audit log. | HIGH |
| SC-FE-022 | Pick: Progress tracker — items picked / total, current location indicator, kolejka pozostałych lokalizacji. | HIGH |

#### Integracje

- WO service (M06): WO details, BOM snapshot materials
- FIFO/FEFO engine (M03, ADR-005)
- LP service (M03)
- Location service (M03)

#### Rozszerzenie: M05-E3b — SO Pick (po M07 Shipping) — **Phase 1 (po dostarczeniu M07 Shipping)**

| ID | Wymaganie | Priorytet | Phase |
|----|-----------|-----------|-------|
| SC-BE-023 | `GET /api/shipping/scanner/pick-lists` — SO pick lists (po M07). | HIGH | Phase 1 (po M07) |
| SC-BE-024 | `POST /api/shipping/scanner/pick` — SO pick confirmation z container/LP assignment. | HIGH | Phase 1 (po M07) |
| SC-FE-023 | SO Pick Workflow: Select SO → pick list → scan LP → qty → container → confirm. Analogiczny do WO Pick. | HIGH | Phase 1 (po M07) |

**Uwaga do fazy**: M05-E3b wchodzi w zakres Phase 1 — rozszerzenie po dostarczeniu M07 Shipping. Nie jest to Phase 2. Blokuje wyłącznie dostępność M07 (moduł Shipping musi być aktywny), nie wymagania techniczne ani architekturę.

---

### M05-E4: Production Workflows (Phase 1, MVP)

**Zależności**: M06 Production (WO execution, material consumption, output), M03 Warehouse (LP), M05-E1

#### Backend

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-BE-030 | `GET /api/production/scanner/active-wos` — lista WO w statusie `IN_PROGRESS`. Include: WO number, product name, planned qty, actual qty, materials count, consumed count. RLS: org_id. | HIGH |
| SC-BE-031 | `GET /api/production/scanner/wo/{woId}/materials` — expected materials (z BOM snapshot): product, required qty, consumed qty, remaining. LP suggestions (FIFO/FEFO). | HIGH |
| SC-BE-032 | `POST /api/production/scanner/consume` — material consumption: `{ wo_id, lp_id, qty_consumed }`. Walidacja: WO in IN_PROGRESS, LP available (nie consumed/hold), qty ≤ lp.current_qty, material in BOM. Update: LP qty (partial → reduce, full → status CONSUMED), create `wo_material_consumption` record, update `lp_genealogy`. | HIGH |
| SC-BE-033 | `POST /api/production/scanner/output` — output registration: `{ wo_id, qty_produced, lot_number?, expiry_date?, waste_qty?, waste_category_id? }`. Tworzy output LP (status: AVAILABLE lub QC_PENDING wg config). Update: WO actual_qty. Create `lp_genealogy` links (consumed LPs → output LP). | HIGH |
| SC-BE-034 | Waste tracking na output: `waste_qty` + `waste_category_id` (z customizable waste categories per org). Kategorie: fat, floor, giveaway, rework, other. | HIGH |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-FE-030 | **Consume Workflow** (4 kroki): 1) Select WO (lista active WOs lub scan WO barcode) → 2) View expected materials (BOM snapshot, remaining) → 3) Scan material LP barcode → show LP details (product match?, qty available) → 4) Confirm qty (domyślnie: full LP qty lub remaining BOM qty, mniejsza z dwóch) → Success + "Scan Next Material". | HIGH |
| SC-FE-031 | Consume: Material matching — po scan LP, system sprawdza czy product z LP jest w BOM. Jeśli nie → error "Material not in BOM for this WO". Jeśli tak → auto-highlight matching BOM line. | HIGH |
| SC-FE-032 | **Output Workflow** (4 kroki): 1) Select WO → 2) Enter output qty (number pad, domyślnie: remaining planned qty) → 3) Optional: waste qty + waste category → 4) Confirm → Create LP + Success. | HIGH |
| SC-FE-033 | Output: Yield indicator — actual vs planned qty, yield %, color-coded (green ≥ target, amber close, red below target). | HIGH |
| SC-FE-034 | Consume: Catch weight support — jeśli produkt `is_catch_weight`, pokaż pole wagi obok qty. Walidacja: weight ≤ LP actual weight. | MEDIUM |

#### Integracje

- WO service (M06): fetch WO details, update actual_qty
- BOM snapshot (ADR-002): materials list
- LP service (M03): consume, create output LP
- LP genealogy: link consumed → output
- Waste categories (M06): customizable per org

---

### M05-E5: QA Workflows (Phase 1, MVP)

**Zależności**: M08 Quality (QA holds, NCR, inspections), M03 Warehouse (LP status), M05-E1

#### Backend

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-BE-040 | `GET /api/quality/scanner/pending-inspections` — lista LP z status `QC_PENDING` lub WO z wymaganą inspekcją. Include: LP/WO ref, product, qty, age (days since creation). RLS: org_id. | HIGH |
| SC-BE-041 | `POST /api/quality/scanner/inspect` — QA result: `{ lp_id, result: 'pass' | 'fail' | 'hold', failure_reason_id?, notes?, inspector_id }`. Update LP status: pass → AVAILABLE, fail → BLOCKED (+ create NCR basic), hold → QA_HOLD. Audit log. | HIGH |
| SC-BE-042 | `GET /api/quality/scanner/failure-reasons` — lista przyczyn odrzucenia (configurable per org): contamination, wrong label, temperature, visual defect, weight variance, other. | HIGH |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-FE-040 | **QA Workflow** (4 kroki): 1) Scan LP barcode (lub select z pending list) → 2) View LP details (product, qty, lot, age, WO ref) → 3) Result: big buttons PASS (green) / FAIL (red) / HOLD (amber) → 4a) Pass: confirm → LP → Available → Success. 4b) Fail: select reason → optional notes → confirm → LP → Blocked + NCR created → Success. 4c) Hold: optional notes → confirm → LP → QA Hold → Success. | HIGH |
| SC-FE-041 | QA: Batch inspection mode — po 1 LP, przycisk "Inspect Next" → auto-reset do scan. Counter: inspected/total. | HIGH |
| SC-FE-042 | QA: Visual indicators — LP card z color-coded status badge (Available=green, QC Pending=amber, Hold=yellow, Blocked=red). | HIGH |

#### Integracje

- LP service (M03): status update
- NCR service (M08): create basic NCR on fail
- Failure reasons (M08): configurable list
- Audit log: QA inspection entry

---

### M05-E6: Offline Mode (Phase 2)

**Zależności**: M05-E1 through E5 (stabilne workflow'y online)

#### Backend

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-BE-050 | `POST /api/scanner/sync` — batch sync endpoint: accepts array of queued operations, processes FIFO, returns per-operation results `{ op_id, success, error? }`. | HIGH |
| SC-BE-051 | Conflict resolution rules: LP already consumed → reject + suggest re-scan, qty exceeds available → reject + return current qty, PO fully received → reject + message. | HIGH |
| SC-BE-052 | Idempotency: każda operacja z `client_operation_id` (UUID). Server sprawdza duplikaty → skip jeśli already processed. | HIGH |

#### Frontend / UX

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-FE-050 | Offline detection: `navigator.onLine` + ping check. Status indicator w header: green dot (online), amber (slow), red (offline). | HIGH |
| SC-FE-051 | Queue UI: badge z liczbą pending ops. Tap → view queue (operation type, timestamp, status: queued/syncing/synced/failed). | HIGH |
| SC-FE-052 | Auto-sync on reconnect + manual "Sync Now" button. Progress bar during sync. | HIGH |
| SC-FE-053 | Failed ops handling: show error per operation, "Retry" or "Discard" buttons. | HIGH |
| SC-FE-054 | Queue overflow warning: jeśli queue > 80 ops, show amber warning "Queue almost full (80/100)". Jeśli 100 → block new ops + red warning. | MEDIUM |

---

### M05-E7: Advanced Barcode & Hardware (Phase 2)

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-BE-060 | Camera barcode scanning via `quagga2` lub `@nickersoft/barcode-detector`. Support: Code 128, QR, EAN-13, Data Matrix. | HIGH |
| SC-FE-060 | Camera viewfinder UI: overlay z scan area marker, auto-detect + auto-close, switch front/rear camera. | HIGH |
| SC-FE-061 | SSCC-18 parsing (AI 00): paleta → multi-LP lookup. | MEDIUM |
| SC-FE-062 | Ring scanner pairing UI: Bluetooth HID connection flow, paired device indicator. | MEDIUM |

---

### M05-E11: PWA (Phase 2)

| ID | Wymaganie | Priorytet |
|----|-----------|-----------|
| SC-BE-070 | Service Worker: cache strategy (network-first for API, cache-first for static assets). | HIGH |
| SC-FE-070 | `manifest.json`: app name "MonoPilot Scanner", theme color (slate-900), start_url `/scanner`, display `standalone`, icons (192, 512px). | HIGH |
| SC-FE-071 | Install prompt: "Add to Home Screen" banner, auto-detect installability. | MEDIUM |
| SC-FE-072 | Capability detection: check camera, vibration, audio, notifications — graceful degradation. | MEDIUM |

---

### Wymagania wynikające z gap analysis (ANALYSIS.md)

| ID | Gap | Wymaganie | Priorytet | Phase |
|----|-----|-----------|-----------|-------|
| SC-GAP-001 | PWA Architecture | Opracować PWA strategy (service worker, manifest, cache, install flow) | HIGH | 2 |
| SC-GAP-002 | Mobile UX Patterns | Skonsolidować wzorce UX skanera z 5 wireframe'ów do jednego dokumentu referencyjnego | MEDIUM | 1 |
| SC-GAP-003 | Scanner Workflows | Udokumentować 4 główne workflow'y (receive, move, consume, QA) jako osobne diagramy przepływu | HIGH | 1 |
| SC-GAP-004 | Barcode Formats | Wyodrębnić specyfikację formatów barcode do centralnego dokumentu | MEDIUM | 1 |
| SC-GAP-005 | Hardware Integration | Udokumentować integrację sprzętową (device compatibility matrix, input handling, detection) | HIGH | 1 |
| SC-GAP-006 | Unified API Routes | Skonsolidować ~50 endpoint'ów scanner z 3 modułów do jednej mapy API | MEDIUM | 1 |
| SC-GAP-007 | Testing Strategy | Opracować strategię testów (E2E, device matrix, offline, security, accessibility) | HIGH | 1 |
| SC-GAP-008 | Offline Sync Protocol | Udokumentować protokół sync (queue structure, retry, conflict resolution, TTL) | HIGH | 2 |

---

## 9. KPIs

### Operacyjne (per scan)

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Czas operacji skanera | < 30 s (scan → confirm) | APM / timestamps |
| Scan success rate (1st attempt) | > 95% | Scanner audit log |
| Avg scan-to-response latency | < 500 ms (lookup API) | APM |
| Error rate (invalid/unrecognized scan) | < 5% | Scanner audit log |
| % manual entry (fallback) | < 10% | Analytics |

### Modułowe

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Offline queue sync success rate | > 99% (Phase 2) | Sync logs |
| Queue drain time (100 ops) | < 60 s (Phase 2) | Sync logs |
| GRN completion via scanner | > 80% (vs desktop) | Usage analytics |
| Material consumption via scanner | > 70% (vs desktop) | Usage analytics |
| QA inspections via scanner | > 60% (vs desktop) | Usage analytics |

### UX / Adopcja

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Operator adoption (within 2 weeks) | > 80% | User tracking |
| Training time to proficiency | < 1 h | Onboarding tracking |
| Session duration (avg) | < 10 min per session | Analytics |
| Task abandonment rate | < 5% | Workflow completion tracking |

### System

| KPI | Cel | Pomiar |
|-----|-----|--------|
| Scanner page load (P95) | < 2 s | APM |
| API response (P95) | < 500 ms | APM |
| Uptime | ≥ 99,5% | Monitoring |

---

## 10. Risks

### Phase 1

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| Brak test data blokuje development/QA | Wysokie | Wysoki | Seed scripts (`npm run seed:scanner`), fixtures (ref: BUG-SC-002) |
| Niespójne GS1 parsing między modułami | Średnie | Wysoki | Centralny parser (`lib/utils/gs1-parser.ts`), unit testy na każdy AI code |
| Hardware scanner compatibility issues | Średnie | Średni | Testowanie na 3+ modelach (Zebra TC52, Honeywell CT60, iPhone), keyboard wedge jako universal fallback |
| Latency skanera > 500 ms (lookup) | Niskie | Wysoki | Indeksy DB na barcode columns, cache warstwy, query optimization |
| Dual maintenance (scanner + desktop) | Średnie | Średni | Shared services/hooks — tylko UI się różni |
| Touch target issues z rękawicami | Niskie | Średni | 48dp minimum, user testing z rękawicami, 72dp primary actions |
| Missing React hooks/components blokują UI | Średnie | Średni | Component checklist per workflow, CI build check (ref: BUG-03-12-002) |
| Documentation scattered across modules | Wysokie | Średni | Konsolidacja do `/05-scanner/` (gap items SC-GAP-001 through SC-GAP-008) |

### Phase 2

| Ryzyko | Prawdop. | Wpływ | Mitygacja |
|--------|----------|-------|-----------|
| Offline sync conflicts (LP consumed during offline) | Wysokie | Wysoki | Server-side validation, idempotency keys, user-facing conflict resolution UI |
| IndexedDB storage limits | Niskie | Średni | Max 100 ops × 5 KB = 500 KB (well within limits), quota check |
| Camera scanning quality (różne urządzenia) | Średnie | Średni | Fallback na manual entry, testowanie na 5+ device types |
| PWA install issues (iOS Safari ograniczenia) | Średnie | Średni | Progressive enhancement, web-first fallback |
| Ring scanner Bluetooth pairing problems | Średnie | Średni | Manual entry fallback, pairing guide documentation |

---

## 11. Success Criteria

### MVP (Phase 1) — Scanner jest GOTOWY gdy:

#### Funkcjonalne
- [ ] Scanner Shell działa: dark theme layout, scan input, feedback (audio/haptic/visual)
- [ ] **Receive workflow** end-to-end: scan PO → scan product → qty → confirm → LP created + GRN entry
- [ ] **Putaway workflow** end-to-end: scan LP → view FIFO/FEFO suggestion → scan location → confirm → LP moved to storage
- [ ] **Move workflow** end-to-end: scan LP → scan destination → confirm → LP location updated
- [ ] **WO Pick workflow** end-to-end: select WO → FIFO/FEFO suggestion → scan LP → confirm → allocated (SO pick po M07)
- [ ] **Consume workflow** end-to-end: select WO → scan material LP → qty → confirm → LP consumed + genealogy
- [ ] **Output workflow** end-to-end: select WO → qty → waste (optional) → confirm → output LP created + genealogy
- [ ] **QA workflow** end-to-end: scan LP → pass/fail/hold → (fail: reason + notes) → LP status updated (+ NCR on fail)
- [ ] GS1-128 parsing: GTIN-14, Batch/Lot, Expiry date — poprawne parsowanie i walidacja
- [ ] Permission check: workflow'y widoczne wg roli użytkownika
- [ ] Audit trail: każdy scan zalogowany (user, barcode, result, device, timestamp)
- [ ] Test data seed: `npm run seed:scanner` tworzy kompletne dane testowe

#### Niefunkcjonalne
- [ ] Czas operacji < 30 s (scan → confirm) na Zebra TC52
- [ ] Touch targets ≥ 48dp (verified on 3+ urządzeń)
- [ ] Scanner page load P95 < 2 s
- [ ] API lookup P95 < 500 ms
- [ ] Scan success rate > 95% (hardware scanner)
- [ ] UX walidacja z 3+ operatorami magazynowymi
- [ ] Testy E2E (Playwright): receive, move, consume, output, QA — green

#### Hardware
- [ ] Zebra TC52 — keyboard wedge input działa
- [ ] Honeywell CT60 — keyboard wedge input działa
- [ ] iPhone Safari — manual input działa (camera: Phase 2)
- [ ] Android Chrome — manual input działa (camera: Phase 2)

### Phase 2 — dodatkowe kryteria
- [ ] Offline queue: 100 operacji sync < 60 s
- [ ] PWA installable na Android + iOS
- [ ] Camera scanning: Code 128 + QR Code na iPhone i Android
- [ ] Cycle count / stock audit workflow
- [ ] CCP monitoring via QR scan

---

## 12. References

### Dokumenty modułowe
- Analysis → `new-doc/05-scanner/ANALYSIS.md`
- ADR-006 (Scanner-First UX) → `new-doc/05-scanner/decisions/ADR-006-scanner-first-mobile-ux.md`
- ADR-006 (Foundation copy) → `new-doc/00-foundation/decisions/ADR-006-scanner-first-mobile-ux.md`
- Test Plan → `new-doc/05-scanner/qa/TEST_PLAN_SCANNER.md`

### Bugs (wpływające na wymagania)
- BUG-SC-002 (brak test data) → `new-doc/05-scanner/bugs/BUG-SC-002.md` — wymaganie SC-BE-005 (seed scripts)
- BUG-03-12-001 (description NULL) → `new-doc/05-scanner/bugs/BUG-03-12-001-DESCRIPTION-NULL.md` — kontekst: WO operations
- BUG-03-12-002 (missing hooks) → `new-doc/05-scanner/bugs/BUG-03-12-002-MISSING-HOOKS.md` — kontekst: component checklist

### Cross-module wireframes (szczegółowe UX)
- WH-010 Scanner Receive → `new-doc/03-warehouse/ux/WH-010-scanner-receive.md`
- WH-011 Scanner Move → `new-doc/03-warehouse/ux/WH-011-scanner-move.md`
- PROD-005 Scanner Consume → `new-doc/06-production/ux/PROD-005-scanner-consume-material.md`
- PROD-006 Scanner Output → `new-doc/06-production/ux/PROD-006-scanner-register-output.md`
- QA-025 Scanner QA → `new-doc/08-quality/ux/QA-025-scanner-qa.md`

### Foundation
- Foundation PRD → `new-doc/00-foundation/prd/00-FOUNDATION-PRD.md` (Section 7: Module Map — M05 Scanner)
- ADR-001 LP Inventory → `new-doc/00-foundation/decisions/ADR-001-*.md`
- ADR-002 BOM Snapshot → `new-doc/00-foundation/decisions/ADR-002-*.md`
- ADR-005 FIFO/FEFO → `new-doc/00-foundation/decisions/ADR-005-*.md`
- Design Guidelines → `new-doc/_meta/DESIGN-GUIDELINES.md`

### Existing code (current implementation)
- Scanner pages → `apps/frontend/app/(authenticated)/scanner/`
- Scanner components → `apps/frontend/components/scanner/`
- Scanner receive service → `apps/frontend/lib/services/scanner-receive-service.ts`
- Barcode service → `apps/frontend/lib/services/barcode-service.ts`

---

_PRD 05-Scanner v1.2 — 12 epików (5 Phase 1 + E3b rozszerzenie, 7 Phase 2), ~60 wymagań, 8 gap items._
_Changelog v1.2: REC-L12: Dodano site_id UUID NULL do scanner_audit_log (SC-BE-004) + pola device_type/scan_method. REC-L14: M05-E3b oznaczony jako "Phase 1 (po dostarczeniu M07 Shipping)" z wyjaśnieniem. REC-L16: Dodano blok "Wyjątek od ADR-008" w sekcji Decyzje biznesowe._
_Changelog v1.1: Dodano Putaway jako osobny workflow w M05-E2. Pick ograniczony do WO-only (M05-E3), SO pick jako M05-E3b po M07. scanner_audit_log = osobna tabela (nie audit_log). Dodano SC-BE-015/016/017 (putaway API + algorithm), SC-FE-015/016/017 (putaway UX), SC-BE-023/024 + SC-FE-023 (SO pick rozszerzenie)._
_Changelog v1.0: Initial version. Consolidated from ANALYSIS.md, ADR-006, TEST_PLAN_SCANNER.md, 4 bug reports, Foundation PRD M05 section._
_Data: 2026-02-18_
