# Epic 11: Catch Weight - Phase 2

**Status:** PLANNED
**Priority:** P1 - Critical dla luk konkurencyjnych (4/4 konkurentow ma)
**Stories:** 22
**Estimated Effort:** 6 tygodni
**Dependencies:** Epic 1 (Settings), Epic 2 (Technical), Epic 5 (Warehouse), Epic 4 (Production), Epic 7 (Shipping)

---

## 1. Overview

### 1.1 Cel Epica
Implementacja obslugi produktow o zmiennej wadze (catch weight):
- Produkty sprzedawane na wage (mieso, ryby, sery, warzywa)
- Roznica miedzy waga nominalna a rzeczywista
- Wycena per kg vs per sztuka
- Rejestracja wagi na kazdym etapie (receive, produce, ship)

### 1.2 Luki Konkurencyjne Zamykane
| Luka | Konkurenci | Wymaganie | Status MonoPilot |
|------|-----------|-----------|------------------|
| Catch Weight Support | 4/4 maja (CSB deep) | Meat/fish processors | Implementowane |
| Variable Weight Products | 4/4 maja | Food manufacturing | Implementowane |
| Pricing by Actual Weight | 4/4 maja | Billing accuracy | Implementowane |

### 1.3 Business Value
- **Rozliczenia:** Fakturowanie wedlug rzeczywistej wagi
- **Inventory accuracy:** Prawdziwe stany magazynowe
- **Yield tracking:** Rzeczywisty uzysk produkcji
- **Customer trust:** Dokumentacja wagi przy wysylce

### 1.4 Catch Weight Scenarios

| Scenario | Example | Pricing | Inventory |
|----------|---------|---------|-----------|
| **Fixed weight** | Puszka 400g | Per unit | Per unit |
| **Catch weight** | Polec wolowy ~2.5kg | Per kg | Per kg |
| **Average weight** | Kurczak ~1.5kg | Per unit, adjust | Per unit |

---

## 2. Key Concepts

### 2.1 Catch Weight Product
Produkt z wlaczonym catch weight ma:
- **Nominal weight:** oczekiwana waga jednostki (np. 2.5 kg)
- **Actual weight:** rzeczywista waga zarejestrowana na LP
- **Weight tolerance:** akceptowalna roznica (np. +/- 10%)
- **Pricing UoM:** kg vs szt

### 2.2 Weight Recording Points
1. **Receive (GRN):** Wazone przy przyjmowaniu
2. **Production Output:** Wazone przy wyprodukowaniu
3. **Pick/Pack:** Wazone przy pakowaniu (opcjonalnie)
4. **Ship:** Finalna waga na dokumentach

### 2.3 Dual UoM Tracking
| Field | Unit 1 (Count) | Unit 2 (Weight) |
|-------|----------------|-----------------|
| LP Quantity | 10 szt | 25.5 kg |
| PO Line | 100 szt | ~250 kg |
| SO Line | 50 szt | 127.3 kg |

---

## 3. User Stories

### 3.1 Product Configuration

#### Story 11.1: Enable Catch Weight on Product
**Jako** Technical Officer
**Chce** oznaczyc produkt jako catch weight
**Aby** sledzic rzeczywista wage

**Acceptance Criteria:**
- [ ] Checkbox: is_catch_weight na produkcie
- [ ] Jezeli true: pokaz dodatkowe pola
- [ ] nominal_weight: oczekiwana waga jednostki
- [ ] weight_uom: kg, g, lb
- [ ] weight_tolerance_percent: dozwolona roznica

**Technical Notes:**
```sql
ALTER TABLE products ADD COLUMN is_catch_weight BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN nominal_weight NUMERIC(15,4);
ALTER TABLE products ADD COLUMN weight_uom VARCHAR(10) DEFAULT 'kg';
ALTER TABLE products ADD COLUMN weight_tolerance_percent NUMERIC(5,2) DEFAULT 10;
```

**Priority:** Must Have
**Estimate:** M

---

#### Story 11.2: Catch Weight Pricing Configuration
**Jako** Technical Officer
**Chce** konfigurowac wycene catch weight
**Aby** fakturowac poprawnie

**Acceptance Criteria:**
- [ ] pricing_by: 'unit' lub 'weight'
- [ ] cost_per_unit vs cost_per_kg
- [ ] Jezeli weight: cena * actual_weight
- [ ] Jezeli unit: cena * quantity

**Technical Notes:**
- Dodac pricing_by enum do products
- Logika w PO/SO line calculations

**Priority:** Must Have
**Estimate:** S

---

#### Story 11.3: Catch Weight Product List View
**Jako** Technical Officer
**Chce** filtrowac produkty catch weight
**Aby** zarzadzac konfiguracja

**Acceptance Criteria:**
- [ ] Filtr: is_catch_weight = true
- [ ] Kolumna: Nominal Weight
- [ ] Kolumna: Pricing By
- [ ] Badge "CW" przy produkcie

**Technical Notes:**
- Extend product list filters

**Priority:** Should Have
**Estimate:** S

---

### 3.2 Receive (GRN) with Catch Weight

#### Story 11.4: Record Actual Weight on Receive
**Jako** Warehouse Operator
**Chce** zapisac rzeczywista wage przy przyjmowaniu
**Aby** miec dokladny stan

**Acceptance Criteria:**
- [ ] Jezeli produkt is_catch_weight: pole actual_weight na LP
- [ ] Pole quantity (szt) + pole actual_weight (kg)
- [ ] Walidacja tolerance: warning jezeli poza zakresem
- [ ] LP przechowuje oba: quantity i actual_weight

**Technical Notes:**
- Dodac actual_weight do license_plates
- Walidacja: abs(actual_weight - (quantity * nominal_weight)) / (quantity * nominal_weight) <= tolerance

**Priority:** Must Have
**Estimate:** M

---

#### Story 11.5: Catch Weight on Scanner Receive
**Jako** Warehouse Operator
**Chce** wprowadzac wage na scannerze
**Aby** rejestrowac przy przyjmowaniu

**Acceptance Criteria:**
- [ ] Po scan LP: pokaz pole wagi (jezeli catch weight)
- [ ] Numeric keyboard dla wagi
- [ ] UoM widoczny (kg)
- [ ] Tolerance warning (nie block)

**Technical Notes:**
- Extend scanner receive workflow
- Input type: decimal

**Priority:** Must Have
**Estimate:** M

---

#### Story 11.6: PO Line Catch Weight Tracking
**Jako** Purchasing
**Chce** sledzic zamowiona vs przyjeta wage
**Aby** weryfikowac dostawy

**Acceptance Criteria:**
- [ ] PO line: ordered_qty (szt), estimated_weight (kg)
- [ ] GRN: received_qty (szt), actual_weight (kg)
- [ ] Porownanie: variance w kg i %
- [ ] Report: weight variance per PO

**Technical Notes:**
- Dodac estimated_weight do po_lines
- Agregacja actual_weight z GRN items

**Priority:** Should Have
**Estimate:** M

---

### 3.3 Production with Catch Weight

#### Story 11.7: Catch Weight in BOM
**Jako** Technical Officer
**Chce** definiowac BOM z wagami
**Aby** planowac zuzycie

**Acceptance Criteria:**
- [ ] BOM item: quantity + weight (dla catch weight items)
- [ ] Obliczenie: expected_weight = quantity * nominal_weight
- [ ] WO: expected_weight per material
- [ ] Variance tracking: expected vs actual

**Technical Notes:**
- BOM item ma quantity, weight kalkulowane z product
- WO materials consumed ma actual_weight

**Priority:** Should Have
**Estimate:** M

---

#### Story 11.8: Record Actual Weight on Production Output
**Jako** Operator Produkcji
**Chce** zapisac rzeczywista wage produkcji
**Aby** sledzic yield

**Acceptance Criteria:**
- [ ] WO output: quantity (szt) + actual_weight (kg)
- [ ] LP created z actual_weight
- [ ] Yield: actual_weight / expected_weight
- [ ] Variance report

**Technical Notes:**
- wo_outputs ma actual_weight
- Transfer do LP przy output

**Priority:** Must Have
**Estimate:** M

---

#### Story 11.9: Catch Weight on Scanner Production
**Jako** Operator Produkcji
**Chce** wprowadzac wage na scannerze produkcyjnym
**Aby** rejestrowac output

**Acceptance Criteria:**
- [ ] Scanner output: quantity + weight input
- [ ] Weight required dla catch weight products
- [ ] Tolerance validation
- [ ] Print label z waga

**Technical Notes:**
- Extend scanner production output
- Weight on LP label

**Priority:** Must Have
**Estimate:** M

---

#### Story 11.10: Catch Weight Yield Report
**Jako** Production Manager
**Chce** analizowac yield wagowy
**Aby** optymalizowac produkcje

**Acceptance Criteria:**
- [ ] Input weight (materialy) vs Output weight (produkt)
- [ ] Loss/gain analysis
- [ ] By product, by WO, by period
- [ ] Charts + tables

**Technical Notes:**
- Agregacja z wo_materials_consumed i wo_outputs
- actual_weight fields

**Priority:** Should Have
**Estimate:** L

---

### 3.4 Shipping with Catch Weight

#### Story 11.11: SO Line Catch Weight
**Jako** Sales
**Chce** sprzedawac catch weight produkty
**Aby** fakturowac poprawnie

**Acceptance Criteria:**
- [ ] SO line: quantity (szt), estimated_weight (kg)
- [ ] Estimated = quantity * nominal_weight
- [ ] Shipped: actual_weight z LP
- [ ] Invoice: based on actual_weight (jezeli pricing_by = weight)

**Technical Notes:**
- Dodac estimated_weight, shipped_weight do so_lines

**Priority:** Must Have
**Estimate:** M

---

#### Story 11.12: Pick List Catch Weight Display
**Jako** Picker
**Chce** widziec wage na pick list
**Aby** wybierac odpowiednie LP

**Acceptance Criteria:**
- [ ] Pick item: required qty + estimated weight
- [ ] Suggested LP: actual_weight visible
- [ ] Total shipment weight calculated
- [ ] Warning jezeli weight differs significantly

**Technical Notes:**
- Display LP.actual_weight na pick list
- Sum dla total

**Priority:** Should Have
**Estimate:** S

---

#### Story 11.13: Weigh at Pack Station
**Jako** Packer
**Chce** wazyc paczki podczas pakowania
**Aby** potwierdzic wage wysylki

**Acceptance Criteria:**
- [ ] Pack station: weigh button
- [ ] Record package weight
- [ ] Compare vs expected (sum of LP weights)
- [ ] Variance alert

**Technical Notes:**
- packages.weight_kg juz istnieje
- Comparison logic

**Priority:** Should Have
**Estimate:** S

---

#### Story 11.14: Shipping Documents with Actual Weight
**Jako** Shipping Manager
**Chce** miec rzeczywista wage na dokumentach
**Aby** spelniac wymagania klientow

**Acceptance Criteria:**
- [ ] Packing slip: actual weight per item
- [ ] Shipping label: total weight
- [ ] BOL: weight per product
- [ ] Weight matches shipped LP weights

**Technical Notes:**
- Include actual_weight in document generation

**Priority:** Must Have
**Estimate:** M

---

### 3.5 Inventory & Reporting

#### Story 11.15: Inventory by Weight
**Jako** Warehouse Manager
**Chce** widziec stany magazynowe w kg
**Aby** planowac logistyke

**Acceptance Criteria:**
- [ ] Inventory report: quantity (szt) + total_weight (kg)
- [ ] Per product, per location, per warehouse
- [ ] Filter: catch weight products only
- [ ] Export

**Technical Notes:**
- Agregacja: SUM(actual_weight) WHERE product_id GROUP BY

**Priority:** Should Have
**Estimate:** M

---

#### Story 11.16: Weight Variance Report
**Jako** Operations Manager
**Chce** analizowac odchylenia wagowe
**Aby** identyfikowac problemy

**Acceptance Criteria:**
- [ ] Variance: nominal vs actual at receive
- [ ] Variance: expected vs actual at production
- [ ] Variance: ordered vs shipped
- [ ] By supplier, by product, by period

**Technical Notes:**
- Cross-module agregacja
- Dashboard widget

**Priority:** Should Have
**Estimate:** L

---

### 3.6 Integration & Validation

#### Story 11.17: Weight Tolerance Validation
**Jako** System
**Chce** walidowac tolerancje wagowe
**Aby** wykrywac anomalie

**Acceptance Criteria:**
- [ ] At receive: warning jezeli > tolerance
- [ ] At production: warning jezeli > tolerance
- [ ] Setting: enforce tolerance (block vs warn)
- [ ] Log tolerance violations

**Technical Notes:**
- Validation w service layer
- Settings: enforce_weight_tolerance (boolean)

**Priority:** Must Have
**Estimate:** M

---

#### Story 11.18: Scale Integration (Future Ready)
**Jako** System
**Chce** byc gotowy na integracje z wagami
**Aby** automatyzowac waznie

**Acceptance Criteria:**
- [ ] API endpoint: POST /api/scales/reading
- [ ] Accept: device_id, weight, unit, timestamp
- [ ] Context: link to LP, WO, package
- [ ] Log all readings

**Technical Notes:**
- Placeholder API dla przyszlej integracji
- scales_readings table

```sql
CREATE TABLE scales_readings (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL,
    device_id VARCHAR(50),
    weight NUMERIC(15,4) NOT NULL,
    weight_unit VARCHAR(10) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    context_type VARCHAR(50), -- 'lp', 'wo_output', 'package'
    context_id UUID
);
```

**Priority:** Could Have
**Estimate:** M

---

### 3.7 Settings

#### Story 11.19: Catch Weight Settings
**Jako** Admin
**Chce** konfigurowac catch weight globalnie
**Aby** dostosowac do procesow

**Acceptance Criteria:**
- [ ] Default tolerance %
- [ ] Enforce tolerance (block vs warn)
- [ ] Require weight at receive (catch weight products)
- [ ] Require weight at output (catch weight products)

**Technical Notes:**
```sql
CREATE TABLE catch_weight_settings (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL UNIQUE,
    default_tolerance_percent NUMERIC(5,2) DEFAULT 10,
    enforce_tolerance BOOLEAN DEFAULT false,
    require_weight_at_receive BOOLEAN DEFAULT true,
    require_weight_at_output BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M

---

#### Story 11.20: Catch Weight Settings Page
**Jako** Admin
**Chce** miec strone ustawien catch weight
**Aby** zarzadzac konfiguracja

**Acceptance Criteria:**
- [ ] Route: /settings/catch-weight
- [ ] All settings from catch_weight_settings
- [ ] Save with validation
- [ ] Reset to defaults

**Technical Notes:**
- Similar to other settings pages

**Priority:** Must Have
**Estimate:** S

---

### 3.8 LP & Label

#### Story 11.21: LP Label with Weight
**Jako** Warehouse Operator
**Chce** miec wage na etykiecie LP
**Aby** identyfikowac partie

**Acceptance Criteria:**
- [ ] LP label: quantity + actual_weight
- [ ] UoM displayed (szt, kg)
- [ ] Conditional: only for catch weight products
- [ ] Barcode contains weight (GS1 AI 310x)

**Technical Notes:**
- Extend LP label template
- GS1: (3103) for weight in kg with 3 decimals

**Priority:** Should Have
**Estimate:** M

---

#### Story 11.22: Catch Weight Product Badge
**Jako** User
**Chce** widziec oznaczenie catch weight
**Aby** wiedziec ze produkt wymaga wazenia

**Acceptance Criteria:**
- [ ] Badge "CW" lub ikona wagi przy produkcie
- [ ] Visible w listach, formularze, scanner
- [ ] Tooltip: "Catch Weight Product - requires actual weight"

**Technical Notes:**
- UI component: CatchWeightBadge

**Priority:** Should Have
**Estimate:** S

---

## 4. Story Summary

| ID | Story | Priority | Estimate | Status |
|----|-------|----------|----------|--------|
| 11.1 | Enable Catch Weight on Product | Must | M | PLANNED |
| 11.2 | Catch Weight Pricing | Must | S | PLANNED |
| 11.3 | Catch Weight Product List | Should | S | PLANNED |
| 11.4 | Record Actual Weight on Receive | Must | M | PLANNED |
| 11.5 | Scanner Receive Weight | Must | M | PLANNED |
| 11.6 | PO Line Catch Weight | Should | M | PLANNED |
| 11.7 | Catch Weight in BOM | Should | M | PLANNED |
| 11.8 | Record Weight on Production | Must | M | PLANNED |
| 11.9 | Scanner Production Weight | Must | M | PLANNED |
| 11.10 | Catch Weight Yield Report | Should | L | PLANNED |
| 11.11 | SO Line Catch Weight | Must | M | PLANNED |
| 11.12 | Pick List Catch Weight | Should | S | PLANNED |
| 11.13 | Weigh at Pack Station | Should | S | PLANNED |
| 11.14 | Shipping Docs with Weight | Must | M | PLANNED |
| 11.15 | Inventory by Weight | Should | M | PLANNED |
| 11.16 | Weight Variance Report | Should | L | PLANNED |
| 11.17 | Weight Tolerance Validation | Must | M | PLANNED |
| 11.18 | Scale Integration API | Could | M | PLANNED |
| 11.19 | Catch Weight Settings | Must | M | PLANNED |
| 11.20 | Settings Page | Must | S | PLANNED |
| 11.21 | LP Label with Weight | Should | M | PLANNED |
| 11.22 | Catch Weight Badge | Should | S | PLANNED |

**Totals:**
- Must Have: 11 stories
- Should Have: 10 stories
- Could Have: 1 story
- **Total:** 22 stories

---

## 5. Database Schema

### 5.1 Product extension
```sql
ALTER TABLE products ADD COLUMN is_catch_weight BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN nominal_weight NUMERIC(15,4);
ALTER TABLE products ADD COLUMN weight_uom VARCHAR(10) DEFAULT 'kg';
ALTER TABLE products ADD COLUMN weight_tolerance_percent NUMERIC(5,2) DEFAULT 10;
ALTER TABLE products ADD COLUMN pricing_by VARCHAR(10) DEFAULT 'unit'; -- 'unit' or 'weight'
ALTER TABLE products ADD COLUMN cost_per_weight NUMERIC(15,4); -- cost per kg
```

### 5.2 License Plate extension
```sql
ALTER TABLE license_plates ADD COLUMN actual_weight NUMERIC(15,4);
ALTER TABLE license_plates ADD COLUMN weight_uom VARCHAR(10);
```

### 5.3 PO/SO Line extensions
```sql
ALTER TABLE po_lines ADD COLUMN estimated_weight NUMERIC(15,4);
ALTER TABLE po_lines ADD COLUMN received_weight NUMERIC(15,4);

ALTER TABLE so_lines ADD COLUMN estimated_weight NUMERIC(15,4);
ALTER TABLE so_lines ADD COLUMN shipped_weight NUMERIC(15,4);
```

### 5.4 WO extensions
```sql
ALTER TABLE wo_materials_consumed ADD COLUMN actual_weight NUMERIC(15,4);
ALTER TABLE wo_outputs ADD COLUMN actual_weight NUMERIC(15,4);
```

### 5.5 catch_weight_settings
```sql
CREATE TABLE catch_weight_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
    default_tolerance_percent NUMERIC(5,2) DEFAULT 10,
    enforce_tolerance BOOLEAN DEFAULT false,
    require_weight_at_receive BOOLEAN DEFAULT true,
    require_weight_at_output BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.6 scales_readings (future)
```sql
CREATE TABLE scales_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    device_id VARCHAR(50),
    weight NUMERIC(15,4) NOT NULL,
    weight_unit VARCHAR(10) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    context_type VARCHAR(50), -- 'lp', 'wo_output', 'package', 'grn_item'
    context_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Catch Weight Calculation Examples

### 6.1 Receive Validation
```javascript
// Product: nominal_weight = 2.5 kg, tolerance = 10%
// LP: quantity = 10 szt, actual_weight = 24.0 kg

const expectedWeight = quantity * product.nominal_weight; // 10 * 2.5 = 25 kg
const varianceKg = actualWeight - expectedWeight; // 24 - 25 = -1 kg
const variancePercent = (varianceKg / expectedWeight) * 100; // -4%

if (Math.abs(variancePercent) > product.weight_tolerance_percent) {
  // Warning or block based on settings
}
```

### 6.2 Production Yield
```javascript
// BOM: 100 kg miesa surowego -> 80 kg miesa przetworzonego (expected yield 80%)
// WO: input_weight = 105 kg, output_weight = 82 kg

const expectedOutput = inputWeight * (expectedYield / 100); // 105 * 0.8 = 84 kg
const actualYield = (outputWeight / inputWeight) * 100; // 82 / 105 = 78.1%
const yieldVariance = actualYield - expectedYield; // -1.9%
```

### 6.3 Pricing Calculation
```javascript
// Product: pricing_by = 'weight', cost_per_weight = 25 PLN/kg
// SO Line: quantity = 20 szt, shipped_weight = 51.2 kg

const lineValue = product.pricing_by === 'weight'
  ? shippedWeight * product.cost_per_weight // 51.2 * 25 = 1280 PLN
  : quantity * product.cost_per_unit; // fallback
```

---

## 7. Dependencies

### 7.1 From Other Modules
- **Epic 2 (Technical):** Products table (extended)
- **Epic 3 (Planning):** PO lines
- **Epic 4 (Production):** WO, materials, outputs
- **Epic 5 (Warehouse):** LP, GRN
- **Epic 7 (Shipping):** SO, pick, pack

### 7.2 To Other Modules
- **Epic 10 (GS1):** Weight in barcode (AI 310x)

---

## 8. Industries Using Catch Weight

| Industry | Products | Use Case |
|----------|----------|----------|
| **Meat** | Beef cuts, pork, poultry | Variable cut sizes |
| **Seafood** | Fish, shrimp, shellfish | Variable sizes |
| **Dairy** | Cheese blocks, butter | Variable block sizes |
| **Produce** | Vegetables, fruits | Variable sizes |
| **Bakery** | Bread loaves, cakes | Slight variation |
| **Deli** | Cold cuts, prepared foods | Sliced to order |

---

## 9. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User forgets to weigh | Medium | High | Required field, scanner prompts |
| Scale inaccuracy | Low | Medium | Calibration reminders |
| Complex pricing logic | Medium | Medium | Clear documentation, testing |
| Performance (weight calculations) | Low | Low | Efficient queries |

---

## 10. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Catch Weight Epic |
