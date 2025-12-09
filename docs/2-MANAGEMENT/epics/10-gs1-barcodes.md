# Epic 10: GS1 & Barcodes - Phase 2

**Status:** PLANNED
**Priority:** P1 - Critical dla luk konkurencyjnych (4/4 konkurentow ma)
**Stories:** 24
**Estimated Effort:** 6-8 tygodni
**Dependencies:** Epic 1 (Settings), Epic 2 (Technical), Epic 5 (Warehouse), Epic 7 (Shipping)

---

## 1. Overview

### 1.1 Cel Epica
Implementacja standardow GS1 dla identyfikacji produktow i przesylek:
- **GTIN-13/14** - identyfikacja produktow
- **GS1-128** - etykiety wysylkowe z Application Identifiers
- **GS1 DataMatrix** - 2D barcodes z lot, expiry, serial
- **SSCC** - Serial Shipping Container Code dla palet/kontenerow
- Walidacja kodow kreskowych
- Template'y etykiet

### 1.2 Luki Konkurencyjne Zamykane
| Luka | Konkurenci | Wymaganie | Status MonoPilot |
|------|-----------|-----------|------------------|
| GS1 Barcode Standards | 4/4 maja | Sieci handlowe wymagaja | Implementowane |
| GTIN-13/14 | 4/4 maja | Identyfikacja produktow | Implementowane |
| GS1-128 (SSCC) | 4/4 maja | Shipping labels | Implementowane |
| GS1 DataMatrix | 3/4 maja | Traceability | Implementowane |

### 1.3 Business Value
- **Dostep do sieci handlowych:** Tesco, Biedronka, Carrefour wymagaja GS1
- **Export readiness:** Miedzynarodowe standardy
- **Automatyczna identyfikacja:** Skanery w calym lancuchu dostaw
- **Zgodnosc regulacyjna:** EU traceability requirements

### 1.4 GS1 Poland Context
- Organizacja: GS1 Poland (www.gs1pl.org)
- Company Prefix: 590 (Poland)
- Wymaga rejestracji i oplaty rocznej
- MonoPilot wspiera klientow posiadajacych GS1 prefix

---

## 2. Key Concepts

### 2.1 GS1 Identifiers

| Identifier | Length | Use Case | Format |
|------------|--------|----------|--------|
| **GTIN-13** | 13 digits | Consumer units (EAN-13) | 590XXXX XXXXX C |
| **GTIN-14** | 14 digits | Trade units (cases, pallets) | I 590XXXX XXXXX C |
| **SSCC** | 18 digits | Shipping containers | E CCCC PPPPPP SSSSSSS C |
| **GLN** | 13 digits | Locations | 590XXXX XXXXX C |

### 2.2 Application Identifiers (AI)

| AI | Name | Format | Example |
|----|------|--------|---------|
| (01) | GTIN | 14 digits | (01)05901234567894 |
| (10) | Batch/Lot | variable | (10)ABC123 |
| (17) | Expiry Date | YYMMDD | (17)251231 |
| (21) | Serial Number | variable | (21)12345 |
| (37) | Quantity | variable | (37)100 |
| (00) | SSCC | 18 digits | (00)359012345000000015 |
| (02) | GTIN of contained items | 14 digits | (02)05901234567894 |
| (310n) | Net Weight (kg) | 6 digits | (3103)001500 |

### 2.3 GS1-128 Barcode Structure
```
(01)05901234567894(10)LOT123(17)251231
     GTIN-14         Lot      Expiry
```

---

## 3. User Stories

### 3.1 GTIN Support

#### Story 10.1: GTIN-13 Product Field
**Jako** Technical Officer
**Chce** wprowadzac GTIN-13 dla produktow
**Aby** identyfikowac produkty zgodnie z GS1

**Acceptance Criteria:**
- [ ] Pole gtin na produkcie (VARCHAR 14)
- [ ] Walidacja: 13 digits + check digit
- [ ] Auto-calculate check digit (opcja)
- [ ] Unikalnosc w organizacji (warning, nie block)
- [ ] Import z CSV

**Technical Notes:**
- Check digit algorithm: GS1 modulo-10
- Rozszerzyc products o pole gtin

**Priority:** Must Have
**Estimate:** M

---

#### Story 10.2: GTIN-14 Trade Unit
**Jako** Technical Officer
**Chce** generowac GTIN-14 dla jednostek handlowych
**Aby** identyfikowac kartony i palety

**Acceptance Criteria:**
- [ ] GTIN-14 = Indicator (1-8) + GTIN-13 (bez check) + check digit
- [ ] Indicator: 1 = case, 2 = pallet, etc.
- [ ] Auto-generate z GTIN-13
- [ ] Walidacja check digit

**Technical Notes:**
- GTIN-14 = {indicator}{gtin13[0:12]}{check_digit}
- Check digit recalculated

**Priority:** Must Have
**Estimate:** S

---

#### Story 10.3: GTIN Validation
**Jako** System
**Chce** walidowac wszystkie GTIN
**Aby** zapobiec bledom w kodach

**Acceptance Criteria:**
- [ ] Check digit validation przy wprowadzaniu
- [ ] Format validation (tylko cyfry)
- [ ] Length validation (13 lub 14)
- [ ] Clear error messages

**Technical Notes:**
- Validation function: validateGTIN(code) -> {valid, error}
- GS1 check digit: modulo-10

**Priority:** Must Have
**Estimate:** S

---

#### Story 10.4: GTIN Barcode Generation
**Jako** Warehouse Operator
**Chce** drukowac etykiety z kodem GTIN
**Aby** identyfikowac produkty

**Acceptance Criteria:**
- [ ] EAN-13 barcode dla GTIN-13
- [ ] ITF-14 barcode dla GTIN-14 (opcjonalnie)
- [ ] Human-readable number pod kodem
- [ ] Label template z GTIN

**Technical Notes:**
- Barcode library: bwip-js lub jsbarcode
- ZPL: ^BC (Code 128) lub ^BE (EAN-13)

**Priority:** Must Have
**Estimate:** M

---

### 3.2 GS1-128 Shipping Labels

#### Story 10.5: SSCC Generation
**Jako** System
**Chce** generowac SSCC dla wysylek
**Aby** identyfikowac kontenery wysylkowe

**Acceptance Criteria:**
- [ ] SSCC = Extension (1) + Company Prefix (7-10) + Serial (7-10) + Check digit
- [ ] Auto-increment serial number
- [ ] Company prefix z settings
- [ ] Check digit auto-calculated

**Technical Notes:**
```
SSCC format: E + CCCCCCCC + SSSSSSSSS + C
- E = Extension digit (0-9)
- C = Company prefix (7-10 digits)
- S = Serial reference (assigned by company)
- C = Check digit (modulo-10)
```

```sql
CREATE TABLE sscc_sequences (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL,
    company_prefix VARCHAR(10) NOT NULL,
    last_serial BIGINT DEFAULT 0
);
```

**Priority:** Must Have
**Estimate:** M

---

#### Story 10.6: GS1-128 Barcode Generation
**Jako** Packer
**Chce** drukowac etykiety GS1-128
**Aby** spelniac wymagania sieci handlowych

**Acceptance Criteria:**
- [ ] Barcode zawiera: (00) SSCC
- [ ] Opcjonalnie: (01) GTIN, (10) LOT, (17) EXPIRY
- [ ] Application Identifiers w nawiasach
- [ ] Human-readable pod kodem
- [ ] Code 128 symbology

**Technical Notes:**
- GS1-128 = Code 128 z FNC1 start character
- ZPL: ^BC for Code 128

**Priority:** Must Have
**Estimate:** L

---

#### Story 10.7: GS1 Shipping Label Template
**Jako** Admin
**Chce** konfigurowac template etykiety GS1
**Aby** dostosowac do wymagan klienta

**Acceptance Criteria:**
- [ ] Wybor AI do wydruku (checkboxy)
- [ ] Uklad elementow (basic)
- [ ] Ship-from, Ship-to sections
- [ ] Company logo (opcjonalnie)
- [ ] Preview przed drukiem

**Technical Notes:**
- Label template w settings (JSON)
- ZPL template generator

**Priority:** Should Have
**Estimate:** L

---

### 3.3 GS1 DataMatrix

#### Story 10.8: DataMatrix Generation
**Jako** Warehouse Operator
**Chce** drukowac DataMatrix z danymi traceability
**Aby** umiescic wiecej informacji na malej etykiecie

**Acceptance Criteria:**
- [ ] 2D DataMatrix barcode
- [ ] Zawiera: GTIN + Lot + Expiry + Serial
- [ ] GS1 format z FNC1
- [ ] Skalowalne rozmiary

**Technical Notes:**
- DataMatrix encoding: GS1 mode
- Format: ]d2{FNC1}01{gtin}10{lot}17{expiry}21{serial}
- Library: bwip-js supports DataMatrix

**Priority:** Should Have
**Estimate:** M

---

#### Story 10.9: DataMatrix on LP Label
**Jako** Warehouse Operator
**Chce** miec DataMatrix na etykiecie LP
**Aby** skanowac jeden kod dla wszystkich danych

**Acceptance Criteria:**
- [ ] LP label zawiera DataMatrix
- [ ] DataMatrix zawiera: LP number, product GTIN, lot, expiry
- [ ] Skanery moga odczytac wszystkie pola
- [ ] Fallback: QR code z danymi

**Technical Notes:**
- Rozszerzyc LP label template
- Parser dla skanowanych danych

**Priority:** Should Have
**Estimate:** M

---

### 3.4 Barcode Scanning & Parsing

#### Story 10.10: GS1 Barcode Parser
**Jako** System
**Chce** parsowac zeskanowane kody GS1
**Aby** automatycznie wyodrebniac dane

**Acceptance Criteria:**
- [ ] Parse GS1-128: extract AI values
- [ ] Parse DataMatrix: extract GTIN, lot, expiry, serial
- [ ] Support FNC1 separator
- [ ] Return structured data: {gtin, lot, expiry, serial, sscc}

**Technical Notes:**
```javascript
parseGS1Barcode("01059012345678941012345617251231")
-> {
    gtin: "05901234567894",
    lot: "123456",
    expiry: "2025-12-31",
    sscc: null
}
```

**Priority:** Must Have
**Estimate:** M

---

#### Story 10.11: Scanner GS1 Auto-Detect
**Jako** Operator
**Chce** skanowac kody GS1 i miec auto-fill
**Aby** przyspieszyc wprowadzanie danych

**Acceptance Criteria:**
- [ ] Scan GS1-128 -> auto-fill: product (by GTIN), lot, expiry
- [ ] Scan DataMatrix -> auto-fill: product, lot, expiry, serial
- [ ] Scan SSCC -> find shipment/package
- [ ] Fallback: manual entry

**Technical Notes:**
- Integration z scanner receive/pick workflows
- Lookup product by GTIN

**Priority:** Must Have
**Estimate:** M

---

### 3.5 Company GS1 Configuration

#### Story 10.12: GS1 Company Prefix
**Jako** Admin
**Chce** konfigurowac prefix GS1 firmy
**Aby** generowac poprawne kody

**Acceptance Criteria:**
- [ ] Pole company_prefix w org settings
- [ ] Validation: 7-10 digits starting with country code
- [ ] Poland: starts with 590
- [ ] Used in SSCC generation

**Technical Notes:**
- Pole w organizations lub gs1_settings

**Priority:** Must Have
**Estimate:** S

---

#### Story 10.13: GS1 Settings Page
**Jako** Admin
**Chce** konfigurowac ustawienia GS1
**Aby** zarzadzac kodami kreskowymi

**Acceptance Criteria:**
- [ ] Company prefix
- [ ] Extension digit (dla SSCC)
- [ ] Default label template
- [ ] Enable/disable GS1 features

**Technical Notes:**
```sql
CREATE TABLE gs1_settings (
    id UUID PRIMARY KEY,
    org_id UUID NOT NULL UNIQUE,
    company_prefix VARCHAR(10),
    extension_digit CHAR(1) DEFAULT '0',
    enable_gtin BOOLEAN DEFAULT true,
    enable_sscc BOOLEAN DEFAULT true,
    enable_datamatrix BOOLEAN DEFAULT false,
    label_template JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Priority:** Must Have
**Estimate:** M

---

### 3.6 Label Templates

#### Story 10.14: LP Label with GS1
**Jako** Admin
**Chce** konfigurowac etykiety LP z kodami GS1
**Aby** spelniac rozne wymagania

**Acceptance Criteria:**
- [ ] Template: internal (QR) vs GS1 (DataMatrix/GS1-128)
- [ ] Wybor elementow: LP#, product, GTIN, lot, expiry, qty
- [ ] Preview template
- [ ] Save per organization

**Technical Notes:**
- JSON template storage
- ZPL generator from template

**Priority:** Should Have
**Estimate:** M

---

#### Story 10.15: Shipping Label with GS1-128
**Jako** Admin
**Chce** konfigurowac etykiety wysylkowe GS1
**Aby** spelniac wymagania sieci

**Acceptance Criteria:**
- [ ] SSCC barcode (GS1-128)
- [ ] Ship-from, Ship-to addresses
- [ ] Content: GTIN, qty, lot (opcjonalnie)
- [ ] Customer-specific templates

**Technical Notes:**
- Template per customer (opcjonalnie)
- Standard GS1 logistic label layout

**Priority:** Should Have
**Estimate:** L

---

### 3.7 Validation & Quality

#### Story 10.16: GTIN Check Digit Calculator
**Jako** User
**Chce** miec kalkulator check digit
**Aby** weryfikowac kody

**Acceptance Criteria:**
- [ ] Input: 12 lub 13 digits
- [ ] Output: complete GTIN with check digit
- [ ] Validation result for existing codes
- [ ] UI tool (modal lub page)

**Technical Notes:**
- GS1 modulo-10 algorithm

**Priority:** Should Have
**Estimate:** S

---

#### Story 10.17: Barcode Print Preview
**Jako** User
**Chce** widziec podglad etykiety przed drukiem
**Aby** uniknac bledow

**Acceptance Criteria:**
- [ ] Preview w przegladarce (PNG/SVG)
- [ ] Actual size option
- [ ] Confirm before print

**Technical Notes:**
- Generate barcode image w przegladarce
- bwip-js lub jsbarcode

**Priority:** Should Have
**Estimate:** M

---

### 3.8 Integration

#### Story 10.18: Product Import with GTIN
**Jako** Technical Officer
**Chce** importowac produkty z GTIN
**Aby** szybko uzupelnic dane

**Acceptance Criteria:**
- [ ] CSV column: gtin
- [ ] Validation podczas importu
- [ ] Skip/update existing by GTIN
- [ ] Error report

**Technical Notes:**
- Rozszerzyc product import o GTIN

**Priority:** Should Have
**Estimate:** S

---

#### Story 10.19: Product Lookup by GTIN
**Jako** Operator
**Chce** wyszukac produkt skanujac GTIN
**Aby** szybko znalezc produkt

**Acceptance Criteria:**
- [ ] Scan GTIN -> show product
- [ ] Search field accepts GTIN
- [ ] Works in receive, consume, pick workflows

**Technical Notes:**
- Query: products WHERE gtin = :gtin OR gtin14 = :gtin

**Priority:** Must Have
**Estimate:** S

---

### 3.9 Reports

#### Story 10.20: GTIN Coverage Report
**Jako** Technical Officer
**Chce** widziec ktore produkty nie maja GTIN
**Aby** uzupelnic brakujace dane

**Acceptance Criteria:**
- [ ] Lista produktow bez GTIN
- [ ] % coverage
- [ ] Filter by product type
- [ ] Export

**Technical Notes:**
- Query: products WHERE gtin IS NULL

**Priority:** Could Have
**Estimate:** S

---

#### Story 10.21: SSCC Usage Report
**Jako** Shipping Manager
**Chce** widziec uzyte SSCC
**Aby** sledzic wykorzystanie

**Acceptance Criteria:**
- [ ] Lista wygenerowanych SSCC
- [ ] Link do shipment
- [ ] Date range filter
- [ ] Export

**Technical Notes:**
- Query: packages WHERE sscc IS NOT NULL

**Priority:** Could Have
**Estimate:** S

---

### 3.10 Advanced Features

#### Story 10.22: GLN (Location) Support
**Jako** Admin
**Chce** przypisac GLN do lokalizacji
**Aby** identyfikowac lokalizacje zgodnie z GS1

**Acceptance Criteria:**
- [ ] Pole gln na warehouse i location
- [ ] Validation: 13 digits
- [ ] Use in shipping documents

**Technical Notes:**
- GLN = GTIN-13 format
- Dodac pole gln do warehouses, locations

**Priority:** Could Have
**Estimate:** S

---

#### Story 10.23: GS1 Digital Link (Future)
**Jako** System
**Chce** wspierac GS1 Digital Link
**Aby** laczyc fizyczne produkty z informacjami online

**Acceptance Criteria:**
- [ ] Generate QR z Digital Link URL
- [ ] Format: https://id.gs1.org/01/{gtin}
- [ ] Redirect do product page lub traceability

**Technical Notes:**
- GS1 Digital Link standard
- URL resolver (future)

**Priority:** Could Have (Phase 3+)
**Estimate:** L

---

#### Story 10.24: Barcode Quality Check
**Jako** QC Inspector
**Chce** weryfikowac jakosc wydruku barcode
**Aby** zapewnic skanowalnosc

**Acceptance Criteria:**
- [ ] Scan printed barcode
- [ ] Verify content matches expected
- [ ] Log verification result
- [ ] Alert if mismatch

**Technical Notes:**
- Compare scanned data vs generated
- Quality grading (future: with verifier)

**Priority:** Could Have
**Estimate:** M

---

## 4. Story Summary

| ID | Story | Priority | Estimate | Status |
|----|-------|----------|----------|--------|
| 10.1 | GTIN-13 Product Field | Must | M | PLANNED |
| 10.2 | GTIN-14 Trade Unit | Must | S | PLANNED |
| 10.3 | GTIN Validation | Must | S | PLANNED |
| 10.4 | GTIN Barcode Generation | Must | M | PLANNED |
| 10.5 | SSCC Generation | Must | M | PLANNED |
| 10.6 | GS1-128 Barcode Generation | Must | L | PLANNED |
| 10.7 | GS1 Shipping Label Template | Should | L | PLANNED |
| 10.8 | DataMatrix Generation | Should | M | PLANNED |
| 10.9 | DataMatrix on LP Label | Should | M | PLANNED |
| 10.10 | GS1 Barcode Parser | Must | M | PLANNED |
| 10.11 | Scanner GS1 Auto-Detect | Must | M | PLANNED |
| 10.12 | GS1 Company Prefix | Must | S | PLANNED |
| 10.13 | GS1 Settings Page | Must | M | PLANNED |
| 10.14 | LP Label with GS1 | Should | M | PLANNED |
| 10.15 | Shipping Label with GS1-128 | Should | L | PLANNED |
| 10.16 | Check Digit Calculator | Should | S | PLANNED |
| 10.17 | Barcode Print Preview | Should | M | PLANNED |
| 10.18 | Product Import with GTIN | Should | S | PLANNED |
| 10.19 | Product Lookup by GTIN | Must | S | PLANNED |
| 10.20 | GTIN Coverage Report | Could | S | PLANNED |
| 10.21 | SSCC Usage Report | Could | S | PLANNED |
| 10.22 | GLN Support | Could | S | PLANNED |
| 10.23 | GS1 Digital Link | Could | L | PLANNED |
| 10.24 | Barcode Quality Check | Could | M | PLANNED |

**Totals:**
- Must Have: 10 stories
- Should Have: 8 stories
- Could Have: 6 stories
- **Total:** 24 stories

---

## 5. Database Schema

### 5.1 Product extension
```sql
ALTER TABLE products ADD COLUMN gtin VARCHAR(14);
ALTER TABLE products ADD COLUMN gtin_type VARCHAR(10); -- gtin13, gtin14
```

### 5.2 gs1_settings
```sql
CREATE TABLE gs1_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
    company_prefix VARCHAR(10),
    extension_digit CHAR(1) DEFAULT '0',
    enable_gtin BOOLEAN DEFAULT true,
    enable_sscc BOOLEAN DEFAULT true,
    enable_datamatrix BOOLEAN DEFAULT false,
    default_lp_label_template JSONB,
    default_shipping_label_template JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 sscc_sequences
```sql
CREATE TABLE sscc_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
    company_prefix VARCHAR(10) NOT NULL,
    last_serial BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.4 Package extension
```sql
ALTER TABLE packages ADD COLUMN sscc VARCHAR(18);
ALTER TABLE packages ADD COLUMN sscc_barcode_data TEXT; -- full GS1-128 string
```

---

## 6. Technical Implementation

### 6.1 Check Digit Algorithm (Modulo-10)
```javascript
function calculateGS1CheckDigit(digits) {
  // digits = string of 12 (GTIN-13) or 17 (SSCC) digits
  let sum = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    const digit = parseInt(digits[i], 10);
    const weight = (digits.length - i) % 2 === 0 ? 1 : 3;
    sum += digit * weight;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}
```

### 6.2 SSCC Generation
```javascript
function generateSSCC(companyPrefix, extensionDigit, serial) {
  // Pad serial to fill 18 digits total
  const serialLength = 16 - companyPrefix.length; // extension(1) + prefix + serial = 17
  const paddedSerial = serial.toString().padStart(serialLength, '0');
  const digits = extensionDigit + companyPrefix + paddedSerial;
  const checkDigit = calculateGS1CheckDigit(digits);
  return digits + checkDigit;
}
```

### 6.3 GS1-128 Encoding
```javascript
function encodeGS1128(sscc, gtin = null, lot = null, expiry = null) {
  let data = '';
  data += `(00)${sscc}`;
  if (gtin) data += `(01)${gtin}`;
  if (lot) data += `(10)${lot}`;
  if (expiry) data += `(17)${expiry.replace(/-/g, '').slice(2)}`; // YYMMDD
  return data;
}
```

---

## 7. Dependencies

### 7.1 From Other Modules
- **Epic 2 (Technical):** Products table
- **Epic 5 (Warehouse):** LP labels
- **Epic 7 (Shipping):** Package labels, SSCC

### 7.2 External Dependencies
- Barcode library: bwip-js lub jsbarcode
- ZPL knowledge dla printer integration (Epic 5 BUG-001/002)

---

## 8. GS1 Poland Compliance

### 8.1 Wymagania
- Firma musi byc zarejestrowana w GS1 Poland
- Company prefix przydzielany przez GS1
- Roczna oplata czlonkowska
- MonoPilot nie rejestruje firm - klient musi miec prefix

### 8.2 Wspierane Standardy
- GS1-128 (EAN/UCC-128)
- GS1 DataMatrix (ECC 200)
- GTIN-13 (EAN-13)
- GTIN-14 (ITF-14)
- SSCC-18

---

## 9. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Printer compatibility | Medium | Medium | Test with Zebra, Honeywell |
| Scanner compatibility | Low | Medium | Standard symbologies |
| Customer-specific requirements | Medium | Medium | Configurable templates |
| GS1 validation edge cases | Low | Low | Follow GS1 specifications |

---

## 10. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial GS1 Epic |
