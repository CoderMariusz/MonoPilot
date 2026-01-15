# FIN-006: Currency Management

**Module**: Finance
**Feature**: Currency & Exchange Rate Management (PRD Section 9.8, FR-9.8.1 to FR-9.8.6)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Settings > Currencies                                     [+ Add Currency]  [Import] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  Active Currencies (4)                                                       [Show Inactive: ☐] |
|  +-------------------------------------------------------------------------------------------+  |
|  | Code | Name              | Symbol | Base | Exchange Rate | Last Updated   | Status   | ▾ |  |
|  |------|-------------------|--------|------|---------------|----------------|----------|---|  |
|  | PLN  | Polish Zloty      | zł     | ✓    | 1.0000        | -              | Active   | ⋮ |  |
|  | EUR  | Euro              | €      |      | 0.2150        | 2025-01-15     | Active   | ⋮ |  |
|  | USD  | US Dollar         | $      |      | 0.2350        | 2025-01-15     | Active   | ⋮ |  |
|  | GBP  | British Pound     | £      |      | 0.1850        | 2025-01-14     | Active   | ⋮ |  |
|  +-------------------------------------------------------------------------------------------+  |
|                                                                                                  |
|  Exchange Rate History: EUR (Euro)                                          [View All History]  |
|  +-------------------------------------------------------------------------------------------+  |
|  | Effective Date | Rate to PLN | Source  | Updated By      | Updated At      | Notes      |  |
|  |----------------|-------------|---------|-----------------|-----------------|------------|  |
|  | 2025-01-15     | 0.2150      | Manual  | John Doe        | 2025-01-15 09:00| Jan update |  |
|  | 2025-01-01     | 0.2180      | Manual  | John Doe        | 2025-01-01 08:30| -          |  |
|  | 2024-12-01     | 0.2200      | Manual  | Jane Smith      | 2024-12-01 10:15| Dec rate   |  |
|  | 2024-11-01     | 0.2190      | Manual  | Jane Smith      | 2024-11-01 09:45| -          |  |
|  +-------------------------------------------------------------------------------------------+  |
|                                                                                                  |
|  Exchange Rate Trend (EUR - Last 6 Months)                                                      |
|  +-------------------------------------------------------------------------------------------+  |
|  |  0.2300 |                                                                                |  |
|  |  0.2250 |                                                                                |  |
|  |  0.2200 |     *             *                                                        |  |
|  |  0.2150 | *       *                   *       *       *                              |  |
|  |  0.2100 |                                                                                |  |
|  |         +-------+-------+-------+-------+-------+-------+                                |  |
|  |            Jul     Aug     Sep     Oct     Nov     Dec                                   |  |
|  +-------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+

Row Actions Menu (⋮):
+------------------+
| Edit             |
| Add Exchange Rate|
| View History     |
| Set as Base (non-base only) |
| Deactivate       |
+------------------+
```

### Add/Edit Currency Modal

```
+----------------------------------------------------------------------+
|  Add Currency                                                 [x]    |
+----------------------------------------------------------------------+
|                                                                      |
|  Currency Details                                                    |
|  +----------------------------------------------------------------+  |
|  | Currency Code: [EUR                    ]  (ISO 4217)          |  |
|  | Name:          [Euro                                       ]  |  |
|  | Symbol:        [€                      ]                      |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Settings                                                            |
|  +----------------------------------------------------------------+  |
|  | ◉ Active  ◯ Inactive                                          |  |
|  |                                                                |  |
|  | ☑ Set as base currency (PLN will no longer be base)           |  |
|  |   ⚠️  Warning: Changing base currency will require            |  |
|  |       recalculating all exchange rates.                        |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Initial Exchange Rate (optional)                                    |
|  +----------------------------------------------------------------+  |
|  | Effective Date: [2025-01-15                    ]  [📅]        |  |
|  | Rate to PLN:    [0.2150                        ]              |  |
|  |                                                                |  |
|  | Inverse Rate:   1 PLN = 4.6512 EUR (calculated)               |  |
|  |                                                                |  |
|  | Source:  ◉ Manual  ◯ API Import                               |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Notes (optional)                                                    |
|  +----------------------------------------------------------------+  |
|  | [January 2025 exchange rate                                ]  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|                                                  [Cancel]  [Save]    |
+----------------------------------------------------------------------+
```

### Add Exchange Rate Modal

```
+----------------------------------------------------------------------+
|  Add Exchange Rate: EUR (Euro)                                [x]    |
+----------------------------------------------------------------------+
|                                                                      |
|  Current Rate: 0.2150 (Effective 2025-01-15)                         |
|                                                                      |
|  New Exchange Rate                                                   |
|  +----------------------------------------------------------------+  |
|  | Effective Date: [2025-02-01                    ]  [📅]        |  |
|  |                                                                |  |
|  | Rate to PLN:    [0.2180                        ]              |  |
|  |                                                                |  |
|  | Inverse Rate:   1 PLN = 4.5872 EUR (calculated)               |  |
|  |                                                                |  |
|  | Change:         +0.0030 PLN (+1.4%)                           |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Source                                                              |
|  +----------------------------------------------------------------+  |
|  | ◉ Manual Entry                                                |  |
|  | ◯ Import from API (European Central Bank)                    |  |
|  |   [Fetch Current Rate]  (Updates rate field automatically)    |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Notes (optional)                                                    |
|  +----------------------------------------------------------------+  |
|  | [February rate adjustment per ECB                          ]  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  ⚠️  Note: This rate will be used for all transactions dated on or   |
|            after the effective date.                                 |
|                                                                      |
|                                                  [Cancel]  [Save]    |
+----------------------------------------------------------------------+
```

### Exchange Rate API Import Modal

```
+----------------------------------------------------------------------+
|  Import Exchange Rates from API                               [x]    |
+----------------------------------------------------------------------+
|                                                                      |
|  API Source                                                          |
|  +----------------------------------------------------------------+  |
|  | Provider: [European Central Bank (ECB)              v]        |  |
|  | API Key:  [Not required for ECB                      ]        |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Import Settings                                                     |
|  +----------------------------------------------------------------+  |
|  | Import Date: [2025-01-15                       ]  [📅]        |  |
|  |                                                                |  |
|  | Currencies to Import:                                         |  |
|  | ☑ EUR - Euro                                                  |  |
|  | ☑ USD - US Dollar                                             |  |
|  | ☑ GBP - British Pound                                         |  |
|  | ☐ CHF - Swiss Franc                                           |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  [Test Connection]                                                   |
|                                                                      |
|  Preview (3 rates found)                                             |
|  +----------------------------------------------------------------+  |
|  | Code | Current Rate | New Rate | Change    | Action          ||
|  |------|--------------|----------|-----------|---------------||
|  | EUR  | 0.2150       | 0.2148   | -0.0002   | ☑ Import      ||
|  | USD  | 0.2350       | 0.2355   | +0.0005   | ☑ Import      ||
|  | GBP  | 0.1850       | 0.1848   | -0.0002   | ☑ Import      ||
|  +----------------------------------------------------------------+  |
|                                                                      |
|  ☑ Update effective date to today (2025-01-15)                       |
|  ☑ Add note: "Imported from ECB API on 2025-01-15"                   |
|                                                                      |
|                                          [Cancel]  [Import Selected] |
+----------------------------------------------------------------------+
```

### Mobile State

```
+----------------------------------+
|  < Finance > Currencies          |
|  [+ Add]  [Import]               |
+----------------------------------+
|                                  |
|  Active Currencies (4)           |
|                                  |
|  +----------------------------+  |
|  | PLN - Polish Zloty         |  |
|  | zł | Base Currency         |  |
|  | Rate: 1.0000               |  |
|  | [⋮]                        |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | EUR - Euro                 |  |
|  | € | Rate: 0.2150           |  |
|  | Last Updated: 2025-01-15   |  |
|  | [Edit] [History] [⋮]       |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | USD - US Dollar            |  |
|  | $ | Rate: 0.2350           |  |
|  | Last Updated: 2025-01-15   |  |
|  | [Edit] [History] [⋮]       |  |
|  +----------------------------+  |
|                                  |
|  [View Exchange Rate History]    |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Settings > Currencies                                     [+ Add Currency]  [Import] |
+--------------------------------------------------------------------------------------------------+
|  Active Currencies                                                                               |
|  +-------------------------------------------------------------------------------------------+  |
|  | [░░░░] | [░░░░░░░░░░░░]  | [░]  | [░]  | [░░░░░░]      | [░░░░░░]       | [░░░░]   | [░]|  |
|  | [░░░░] | [░░░░░░░░░░░░]  | [░]  | [░]  | [░░░░░░]      | [░░░░░░]       | [░░░░]   | [░]|  |
|  +-------------------------------------------------------------------------------------------+  |
|  Loading currencies...                                                                          |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Settings > Currencies                                     [+ Add Currency]  [Import] |
+--------------------------------------------------------------------------------------------------+
|                                         [Currency Icon]                                          |
|                                   No Currencies Configured                                       |
|                     Set up currencies to support multi-currency transactions.                    |
|                     PLN (Polish Zloty) is the default base currency.                             |
|                                                                                                  |
|                                    [+ Add First Currency]                                        |
|                                    [Import from ECB API]                                         |
|                                                                                                  |
|                     Quick Setup:                                                                 |
|                     1. Add currencies you transact in (EUR, USD, etc.)                           |
|                     2. Set initial exchange rates                                                |
|                     3. Update rates regularly (manual or API import)                             |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Settings > Currencies                                     [+ Add Currency]  [Import] |
+--------------------------------------------------------------------------------------------------+
|                                         [Warning Icon]                                           |
|                               Failed to Load Currencies                                          |
|                                Error: CURRENCIES_FETCH_FAILED                                    |
|                                  [Retry]    [Contact Support]                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Components

- ShadCN DataTable for currency list and exchange rate history
- ShadCN Dialog for add/edit currency modal
- ShadCN Dialog for add exchange rate modal
- ShadCN Sheet for API import modal (slide-out)
- ShadCN Input for currency details
- ShadCN DatePicker for effective dates
- ShadCN RadioGroup for source (Manual/API)
- ShadCN Checkbox for active/inactive, base currency
- ShadCN Chart (Recharts) for exchange rate trend
- ShadCN Badge for status (Active/Inactive/Base)
- ShadCN DropdownMenu for row actions

## Business Rules

1. **Currency Code Validation**:
   - Must be valid ISO 4217 code (3 uppercase letters)
   - Must be unique within organization
2. **Base Currency**:
   - Exactly one currency must be base (is_base = true)
   - Base currency always has exchange_rate = 1.0000
   - Cannot deactivate base currency
   - Changing base currency requires admin confirmation
3. **Exchange Rate Validation**:
   - Rate must be > 0
   - effective_date must be valid date
   - Cannot have multiple rates for same effective_date
   - Historical rates cannot be modified (only add new)
4. **Exchange Rate Usage**:
   - Use rate effective on transaction date
   - If no rate for transaction date, use most recent prior rate
   - If transaction date < earliest rate, error (no rate available)
5. **Inverse Rate Calculation**:
   - Inverse Rate = 1 / Rate to PLN
   - Display for user convenience (auto-calculated)
6. **API Import**:
   - Support European Central Bank (ECB) API (free, no key required)
   - Allow manual selection of currencies to import
   - Preview rates before import
   - Mark imported rates with source = 'API'
7. **Currency Conversion**:
   - Amount in Currency A to PLN = Amount x Rate_A_to_PLN
   - Amount in PLN to Currency B = Amount x Rate_B_to_PLN (inverse)
   - Cross-currency: Convert to PLN first, then to target currency

## States

- **Loading**: Skeleton table rows, "Loading currencies..."
- **Empty**: Currency icon, setup guide, CTAs for add/import
- **Error**: Warning icon, error message, retry button
- **Success**: Currency list with exchange rates, history, trend chart

---

**Status**: Ready for Implementation
**Estimated Effort**: 6-7 hours
**PRD Coverage**: 100% (Finance PRD FR-9.8.1 to FR-9.8.6)
