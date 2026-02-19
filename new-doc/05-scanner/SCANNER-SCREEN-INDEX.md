# Scanner Prototype — Screen Index

**Plik**: `new-doc/05-scanner/SCANNER-PROTOTYPE.html`
**Rozmiar**: ~1900 linii | **Screens**: 34 | **Workflows**: 11

> **Dla agentów**: NIE czytaj całego pliku. Czytaj tylko sekcję relevant do twojego zadania.
> Użyj `Read` z parametrami `offset` i `limit` żeby załadować konkretny zakres linii.

---

## Jak czytać sekcje

```
Read file_path="...SCANNER-PROTOTYPE.html" offset=LINE limit=100
```

---

## Mapa screens i linii

### LOGIN FLOW (3 screens)

| Screen ID | Funkcja JS | Linie (approx) | Opis |
|-----------|-----------|----------------|------|
| `login` | `renderLogin` | 270–320 | Scan karty pracownika + email/hasło + przycisk PIN |
| `login-pin` | `renderLoginPin` | 321–360 | 6-cyfrowy PIN, numpad 3×4, auto-advance po wpisaniu |
| `site-select` | `renderSiteSelect` | 361–430 | Wybór zakładu (FORZ/KOBE), linii produkcyjnej, zmiany (ranna/popołudniowa/nocna) |

**Elementy**: logo 72px, scan input, email/password fields, PIN dots + numpad, site cards, line grid, shift buttons, "Rozpocznij zmianę"

---

### HOME (1 screen)

| Screen ID | Funkcja JS | Linie | Opis |
|-----------|-----------|-------|------|
| `home` | `renderHome` | 431–465 | Menu główne skanera. Sekcje: Produkcja, Magazyn, Jakość |

**Menu items**: Work Order (badge "3"), Pick dla WO, Przyjęcie PO, Przyjęcie TO, Putaway, Przesuń LP, Part Movement, Inspekcja QC (badge "5"), Inwentaryzacja

---

### WORK ORDER — Consume + Output (6 screens)

| Screen ID | Funkcja JS | Linie | Opis |
|-----------|-----------|-------|------|
| `wo-list` | `renderWoList` | 466–490 | Lista WO z search, pills filter, status badges |
| `wo-detail` | `renderWoDetail` | 491–540 | Karta WO: status, meta 2×2, progress bar 36%, BOM summary, Start button |
| `wo-execute` | `renderWoExecute` | 541–600 | **Główny ekran WO**: progress strip, warning baner, next-item suggestion, tabs (Komponenty / Zeskanowane), 3 akcje: Skanuj komponent / Wyrób gotowy / Co-product / Odpad |
| `wo-scan` | `renderWoScan` | 601–650 | Skanuj LP składnika: scan input, LP details card (produkt/partia/dostępne/data), qty, batch mandatory |
| `wo-output` | `renderWoOutput` | 651–710 | Rejestruj wyrób gotowy: qty + batch* + expiry* + lokalizacja, info o osobnej rejestracji odpadów, tworzy nowy LP |
| `wo-output-done` | `renderWoOutputDone` | 711–750 | Success: nowy LP card, side-by-side "2 LP z tym samym produktem" |

**Reguły biznesowe**:
- Batch (LP) **obowiązkowe** (oznaczone `*`)
- Output **zawsze tworzy nowy LP**
- Niepełna konsumpcja → warning baner + logowanie
- "Następny do zeskanowania" — proponuje kolejny składnik

---

### WORK ORDER — Co-product + Waste (4 screens)

| Screen ID | Funkcja JS | Linie | Opis |
|-----------|-----------|-------|------|
| `wo-coproduct` | `renderWoCoproduct` | 751–800 | Rejestruj produkt uboczny: wybór co-productu, qty, batch*, expiry, lokalizacja, tworzy nowy LP |
| `wo-coproduct-done` | `renderWoCoproductDone` | 801–830 | Success: LP co-productu (fioletowy card), genealogia z WO |
| `wo-waste` | `renderWoWaste` | 831–890 | Rejestruj odpad: 5 kategorii (fat/floor/giveaway/rework/other), qty, faza produkcji, notatki, **brak LP** |
| `wo-waste-done` | `renderWoWasteDone` | 891–925 | Success: summary 4-cell grid, "Brak LP — odpad nie trafia do magazynu" |

**Reguły biznesowe**:
- Odpad, co-product i wyrób gotowy rejestruje się **oddzielnie** — osobne przyciski
- Można rejestrować wielokrotnie (np. 2× wyrób + 1× co-product + 3× odpad w ramach jednego WO)
- Odpad nie tworzy LP

---

### WO PICK — Kompletacja materiałów (4 screens)

| Screen ID | Funkcja JS | Linie | Opis |
|-----------|-----------|-------|------|
| `pick-wo-list` | `renderPickWoList` | 926–960 | Lista WO wymagających kompletacji, postęp (0/4 skomp.) |
| `pick-list` | `renderPickList` | 961–1010 | Lista BOM posortowana wg lokalizacji, FIFO highlight (niebieski border), progress bar |
| `pick-scan` | `renderPickScan` | 1011–1070 | Skanuj lokalizację → ✓ → Skanuj LP → walidacja FIFO/FEFO → qty |
| `pick-done` | `renderPickDone` | 1071–1095 | Success: postęp N/4, "Następna: X w lokalizacji Y", przycisk Następna pozycja |

---

### RECEIVE PO (4 screens)

| Screen ID | Funkcja JS | Linie | Opis |
|-----------|-----------|-------|------|
| `po-list` | `renderPoList` | 1096–1120 | Skanuj PO lub wybierz z listy (🟡🔵🔴 urgency dots) |
| `po-lines` | `renderPoLines` | 1121–1150 | Linie PO: nr, nazwa, zamówiono vs odebrano, progress circle |
| `po-item` | `renderPoItem` | 1151–1200 | Skanuj GS1/LP dostawcy → nr partii* → data ważności* → qty → lokalizacja |
| `po-done` | `renderPoDone` | 1201–1220 | Success: nowy LP (zielony card), "Kolejna pozycja PO" |

---

### RECEIVE TO (3 screens)

| Screen ID | Funkcja JS | Linie | Opis |
|-----------|-----------|-------|------|
| `to-list` | `renderToList` | 1221–1245 | Skanuj TO lub lista pending transferów |
| `to-scan` | `renderToScan` | 1246–1280 | Lista LP do potwierdzenia (checklist ✓/○), scan input, partial accept |
| `to-done` | `renderToDone` | 1281–1305 | Success: przyjęte LP z listą, warning o niezeskanowanych |

---

### PUTAWAY — FIFO/FEFO suggestion (3 screens)

| Screen ID | Funkcja JS | Linie | Opis |
|-----------|-----------|-------|------|
| `putaway-scan` | `renderPutawayScan` | 1306–1350 | Skanuj LP z doku przyjęć → szczegóły (produkt, qty, expiry, aktualna lok.) |
| `putaway-suggest` | `renderPutawaySuggest` | 1351–1420 | Karta sugestii (duża, 28px monospace), strategia FEFO/FIFO badge, alternatywy, scan docelowej → zielony MATCH lub override flow |
| `putaway-done` | `renderPutawayDone` | 1421–1450 | Success: from/to tabela, strategia, override tak/nie |

**Override flow**: inline (bez osobnego ekranu) — wybór powodu + amber "Potwierdź override"

---

### MOVE LP (2 screens)

| Screen ID | Funkcja JS | Linie | Opis |
|-----------|-----------|-------|------|
| `move-lp` | `renderMoveLp` | 1451–1495 | Skanuj LP → details mini-grid → skanuj/kliknij lokalizację (4 quick buttons) |
| `move-done` | `renderMoveDone` | 1496–1520 | Success: from/to pomarańczowy→zielony |

---

### SPLIT LP / PART MOVEMENT (2 screens)

| Screen ID | Funkcja JS | Linie | Opis |
|-----------|-----------|-------|------|
| `split-lp` | `renderSplitLp` | 1521–1570 | Skanuj LP → qty do wydzielenia → live preview "Oryginał: 30 kg / Nowy: 20 kg" |
| `split-done` | `renderSplitDone` | 1571–1600 | Success: 2 karty side-by-side (oryginalny szary / nowy zielony) z dziedziczoną partią |

---

### QA INSPECTION (4 screens)

| Screen ID | Funkcja JS | Linie | Opis |
|-----------|-----------|-------|------|
| `qa-list` | `renderQaList` | 1601–1640 | Pending list z kolorowymi dotami urgencji, scan input |
| `qa-inspect` | `renderQaInspect` | 1641–1690 | Karta LP (6 pól meta), 3 duże przyciski 80px: ✓ PASS / ✗ FAIL / ⏸ HOLD + notatki |
| `qa-fail-reason` | `renderQaFailReason` | 1691–1730 | Lista przyczyn z ikonami (contamination/label/temp/visual/weight/date/other), notatki, "Utwórz NCR" |
| `qa-done` | `renderQaDone` | 1731–1760 | Success dynamiczny (kolor/ikona zależne od PASS/FAIL/HOLD), NCR info, counter inspekcji |

---

## Dla agentów — szybki lookup

### "Implementuję ekran X — pokaż mi UX"
```
Read file="SCANNER-PROTOTYPE.html" offset=[LINIA Z TABELI] limit=80
```

### "Implementuję cały workflow X"
| Workflow | Zakres linii |
|---------|-------------|
| Login Flow | 270–430 |
| Work Order (full) | 466–925 |
| WO Pick | 926–1095 |
| Receive PO | 1096–1220 |
| Receive TO | 1221–1305 |
| Putaway | 1306–1450 |
| Move + Split | 1451–1600 |
| QA Inspection | 1601–1760 |

### "Jakie są reguły biznesowe dla WO?"
Przeczytaj sekcję `## WORK ORDER` w tym pliku (powyżej). **Nie musisz czytać HTML.**

---

## Wzorce UX (bez czytania HTML)

| Wzorzec | Opis |
|---------|------|
| **scan-first** | Każdy ekran zaczyna od `sinput` (duże pole skanowania, 16px font, border #3b82f6) |
| **mini-grid** | 2×2 lub 2×3 karta z detalami LP po skanowaniu |
| **next-suggestion** | Niebieski chip "Następny do zeskanowania" z nazwą i brakiem |
| **warn-banner** | Pomarańczowy baner dla ostrzeżeń (niekompletna konsumpcja, missing) |
| **info-banner** | Niebieski baner dla informacji kontekstowych |
| **success screen** | Emoji 64px + tytuł + subtitle + LP card (zielony) + 2 przyciski |
| **steps indicator** | `<div class="steps">` — 3 divki: done=zielony, active=niebieski, pending=szary |
| **big 3 buttons** | QA: 80px height, kolory semantyczne (green/red/amber) |
| **batch mandatory** | Zawsze `<span class="req">*</span>` + fhint "Obowiązkowe" |

---

## Prompty dla agentów — gotowe szablony

### Implementacja ekranu
```
Implementuję ekran [SCREEN_ID] w scannerze MonoPilot.
Wzorzec UX: new-doc/05-scanner/SCANNER-SCREEN-INDEX.md (sekcja [WORKFLOW])
HTML reference: Read SCANNER-PROTOTYPE.html offset=[LINE] limit=80
Zasady: scan-first input, dark theme (slate-900), touch targets 48dp+, batch mandatory.
```

### Implementacja workflow
```
Implementuję workflow [WORKFLOW] w scannerze MonoPilot.
Ekrany: [lista screen IDs z tabeli]
UX reference: new-doc/05-scanner/SCANNER-SCREEN-INDEX.md
PRD: new-doc/05-scanner/prd/05-SCANNER-PRD.md (sekcja M05-[EPIC])
Pattern: new-doc/05-scanner/SCANNER-PROTOTYPE.html offset=[START] limit=[LINES]
```

### Review UX
```
Zreviewuj implementację ekranu [X].
Expected UX: SCANNER-SCREEN-INDEX.md → tabela [WORKFLOW]
Reguły biznesowe: sekcja "Reguły biznesowe" w tym indeksie.
```
