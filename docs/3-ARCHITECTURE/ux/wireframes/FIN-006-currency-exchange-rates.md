# FIN-006: Currency & Exchange Rates Page

**Module**: Finance (Cost Management)
**Feature**: Currency Management (PRD Section FR-9.8.1-5)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Settings > Currencies & Exchange Rates                             [+ Add Currency]   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Base Currency                                                                              |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | [PLN]  Polish Zloty (zl)                                                   [Change Base]  |   |
|  |                                                                                            |   |
|  | All costs are converted to and stored in the base currency.                               |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Active Currencies                                                                          |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Code | Name                | Symbol | Exchange Rate | Last Updated    | Status   | Actions |  |
|  | ---- | ------------------- | ------ | ------------- | --------------- | -------- | ------- |  |
|  | PLN  | Polish Zloty        | zl     | 1.000000      | -               | [Base]   | [Edit]  |  |
|  | EUR  | Euro                | EUR    | 4.350000      | 2026-01-15 09:00| [Active] | [Edit]  |  |
|  | USD  | US Dollar           | $      | 4.120000      | 2026-01-15 09:00| [Active] | [Edit]  |  |
|  | GBP  | British Pound       | GBP    | 5.180000      | 2026-01-14 15:30| [Active] | [Edit]  |  |
|  | CZK  | Czech Koruna        | Kc     | 0.178000      | 2026-01-10 10:00| [Inactive] [Deact.] |  |
|  |                                                                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +----------------------------------------------+  +------------------------------------------+   |
|  | Update Exchange Rate                         |  | Exchange Rate History - EUR              |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|  |                                              |  |                                          |   |
|  |  Currency: [EUR - Euro               v]      |  |  +--------------------------------------+ |   |
|  |                                              |  |  | Date       | Rate    | Source       | |   |
|  |  Current Rate:  4.350000 PLN                 |  |  | ---------- | ------- | ------------ | |   |
|  |                                              |  |  | 2026-01-15 | 4.3500  | manual       | |   |
|  |  New Rate:  [4.3800            ]             |  |  | 2026-01-14 | 4.3400  | manual       | |   |
|  |                                              |  |  | 2026-01-10 | 4.3200  | manual       | |   |
|  |  Effective Date: [2026-01-16    ]            |  |  | 2026-01-05 | 4.3000  | manual       | |   |
|  |                                              |  |  | 2026-01-02 | 4.2800  | manual       | |   |
|  |  Source: (x) Manual  ( ) API                 |  |  | 2025-12-28 | 4.2500  | manual       | |   |
|  |                                              |  |  +--------------------------------------+ |   |
|  |  [Cancel]            [Update Rate]           |  |                                          |   |
|  |                                              |  |  [View Full History]  [Export]           |   |
|  +----------------------------------------------+  +------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Rate Trend (30 Days)                                                                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  |     ^                                                                                      |   |
|  |  4.5|                               +--+                                                   |   |
|  |     |          +----+              /    \                                                  |   |
|  |  4.4|    +----/      \            /      \                                                 |   |
|  |     |   /              \    +----/        +----+                                           |   |
|  |  4.3|  /                \--/                    \----                                      |   |
|  |     +--                                                                                    |   |
|  |  4.2|                                                                                      |   |
|  |     +----+----+----+----+----+----+----+----+----+----+----+----+                         |   |
|  |       Dec 16  Dec 23  Dec 30  Jan 6   Jan 13                                              |   |
|  |                                                                                            |   |
|  |     --- EUR  --- USD  --- GBP                                                             |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Add/Edit Currency Modal

```
+------------------------------------------------------------------+
|  Add Currency                                              [X]    |
+------------------------------------------------------------------+
|                                                                    |
|  Currency Code *                                                   |
|  +--------------------------------------------------------------+ |
|  | EUR                                                          | |
|  +--------------------------------------------------------------+ |
|  Format: 3-letter ISO 4217 code (e.g., EUR, USD, GBP)            |
|                                                                    |
|  Currency Name *                                                   |
|  +--------------------------------------------------------------+ |
|  | Euro                                                          | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Symbol *                                                          |
|  +--------------------------------------------------------------+ |
|  | EUR                                                              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Exchange Rate Settings                                        | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  Initial Exchange Rate *                                       | |
|  |  +----------------------------------------------------+       | |
|  |  | 4.350000                                  PLN/EUR  |       | |
|  |  +----------------------------------------------------+       | |
|  |                                                                | |
|  |  [ ] Set as base currency                                     | |
|  |      Warning: This will convert all existing costs             | |
|  |                                                                | |
|  |  [x] Active (available for selection)                         | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|  [Cancel]                                        [Save Currency]  |
+------------------------------------------------------------------+
```

### Update Exchange Rate Modal

```
+------------------------------------------------------------------+
|  Update Exchange Rate - EUR (Euro)                         [X]    |
+------------------------------------------------------------------+
|                                                                    |
|  Current Rate                                                      |
|  +--------------------------------------------------------------+ |
|  |  1 EUR = 4.350000 PLN                                        | |
|  |  Last Updated: 2026-01-15 09:00                              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  New Exchange Rate *                                               |
|  +--------------------------------------------------------------+ |
|  | 4.3800                                                PLN    | |
|  +--------------------------------------------------------------+ |
|  Rate shows how many PLN equal 1 EUR                              |
|                                                                    |
|  Effective Date *                                                  |
|  +--------------------------------------------------------------+ |
|  | 2026-01-16                                             [C]   | |
|  +--------------------------------------------------------------+ |
|  Future dates create scheduled rate changes                        |
|                                                                    |
|  Source                                                            |
|  +--------------------------------------------------------------+ |
|  | (x) Manual Entry                                              | |
|  | ( ) API Import (NBP rate)                                     | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Change Summary                                                    |
|  +--------------------------------------------------------------+ |
|  | Rate Change:  +0.030000 (+0.69%)                             | |
|  | Impact: All future transactions in EUR will use new rate     | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|  [Cancel]                                    [Update Rate]        |
+------------------------------------------------------------------+
```

### Exchange Rate History Modal

```
+------------------------------------------------------------------+
|  Exchange Rate History - EUR (Euro)                        [X]    |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Date Range                                                    | |
|  | [From: 2025-01-01]  [To: 2026-01-15]        [Apply]          | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Rate History                                                  | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Effective Date | Rate (PLN/EUR) | Change   | Source | User   | |
|  | -------------- | -------------- | -------- | ------ | ------ | |
|  | 2026-01-15     | 4.350000       | +0.0100  | manual | JSmith | |
|  | 2026-01-14     | 4.340000       | +0.0200  | manual | JSmith | |
|  | 2026-01-10     | 4.320000       | +0.0200  | manual | AKowal | |
|  | 2026-01-05     | 4.300000       | +0.0200  | manual | JSmith | |
|  | 2026-01-02     | 4.280000       | +0.0300  | manual | JSmith | |
|  | 2025-12-28     | 4.250000       | -0.0100  | manual | AKowal | |
|  | 2025-12-20     | 4.260000       | +0.0100  | manual | JSmith | |
|  | ...            | ...            | ...      | ...    | ...    | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Statistics (Selected Period)                                  | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Average Rate:  4.315000    High: 4.350000    Low: 4.250000   | |
|  | Total Change:  +0.100000 (+2.35%)                            | |
|  | Updates:       12                                             | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|  [Export to CSV]                                         [Close]  |
+------------------------------------------------------------------+
```

### Mobile View (< 768px)

```
+----------------------------------+
|  < Currencies                    |
|  [+ Add]                         |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Base Currency              |  |
|  |                            |  |
|  | [PLN] Polish Zloty (zl)    |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Active Currencies          |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | PLN - Polish Zloty         |  |
|  | Rate: 1.000000 [Base]      |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | EUR - Euro            [>]  |  |
|  | Rate: 4.350000             |  |
|  | Updated: 2026-01-15        |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | USD - US Dollar       [>]  |  |
|  | Rate: 4.120000             |  |
|  | Updated: 2026-01-15        |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | GBP - British Pound   [>]  |  |
|  | Rate: 5.180000             |  |
|  | Updated: 2026-01-14        |  |
|  +----------------------------+  |
|                                  |
|  [Update Rate]                   |
|                                  |
+----------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Settings > Currencies & Exchange Rates                             [+ Add Currency]   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                       [Currency Icon]                                            |
|                                                                                                  |
|                                   No Currencies Configured                                       |
|                                                                                                  |
|                     Set up your base currency and any foreign currencies                         |
|                     you use for purchasing or selling.                                           |
|                                                                                                  |
|                                                                                                  |
|                                   [+ Set Up Base Currency (PLN)]                                 |
|                                                                                                  |
|                                                                                                  |
|                     Common currencies for Poland:                                                |
|                     - PLN (Polish Zloty) - Recommended as base                                   |
|                     - EUR (Euro) - EU purchases                                                  |
|                     - USD (US Dollar) - International trade                                      |
|                     - GBP (British Pound) - UK trade                                             |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Base Currency Card

Displays and manages the organization's base currency.

| Field | Description |
|-------|-------------|
| Currency Code | 3-letter ISO code (e.g., PLN) |
| Currency Name | Full name (e.g., Polish Zloty) |
| Symbol | Currency symbol (e.g., zl) |
| Change Base | Button to change base currency (requires confirmation) |

### 2. Active Currencies Table

List of all configured currencies.

| Column | Description |
|--------|-------------|
| Code | ISO currency code |
| Name | Full currency name |
| Symbol | Currency symbol |
| Exchange Rate | Current rate to base currency |
| Last Updated | Timestamp of last rate update |
| Status | Base/Active/Inactive badge |
| Actions | Edit, Deactivate |

### 3. Update Exchange Rate Form

Form for updating current exchange rate.

| Field | Required | Validation |
|-------|----------|------------|
| Currency | Yes | Dropdown of non-base currencies |
| New Rate | Yes | Positive number, 6 decimal precision |
| Effective Date | Yes | Today or future date |
| Source | Yes | Manual or API |

### 4. Exchange Rate History Table

Historical rate data for selected currency.

| Column | Description |
|--------|-------------|
| Effective Date | When rate became active |
| Rate | Exchange rate value |
| Change | Delta from previous rate |
| Source | Manual or API |
| User | Who entered the rate |

### 5. Rate Trend Chart

30-day trend visualization for exchange rates.

| Feature | Description |
|---------|-------------|
| Chart Type | Multi-line chart |
| Series | EUR, USD, GBP (configurable) |
| X-Axis | Date |
| Y-Axis | Exchange rate (PLN per unit) |
| Tooltip | Date and rate on hover |

---

## Main Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Add Currency | Header button | Opens add currency modal |
| Edit Currency | Row action | Opens edit modal |
| Deactivate | Row action | Deactivates currency (confirmation required) |
| Update Rate | Form or row action | Opens rate update modal |
| View History | History panel | Opens full history modal |
| Export History | History modal | Downloads CSV |
| Change Base | Base currency card | Changes base currency (major action, confirmation) |

---

## States

### Loading State
- Skeleton for base currency card
- Skeleton table rows
- "Loading currencies..." text

### Empty State
- Currency illustration
- "No Currencies Configured" headline
- Quick setup for PLN as base
- Common currency suggestions

### Populated State
- Base currency displayed
- Currencies table with rates
- Rate update form
- History panel
- Trend chart

### Error State
- Warning icon
- "Failed to Load Currencies" headline
- [Retry] button

---

## API Endpoints

### List Currencies

```
GET /api/finance/currencies

Response:
{
  "currencies": [
    {
      "id": "uuid",
      "code": "PLN",
      "name": "Polish Zloty",
      "symbol": "zl",
      "is_base": true,
      "is_active": true,
      "exchange_rate": 1.000000,
      "updated_at": null
    },
    {
      "id": "uuid",
      "code": "EUR",
      "name": "Euro",
      "symbol": "EUR",
      "is_base": false,
      "is_active": true,
      "exchange_rate": 4.350000,
      "updated_at": "2026-01-15T09:00:00Z"
    }
  ],
  "base_currency": {
    "code": "PLN",
    "name": "Polish Zloty"
  }
}
```

### Create Currency

```
POST /api/finance/currencies

Request:
{
  "code": "EUR",
  "name": "Euro",
  "symbol": "EUR",
  "exchange_rate": 4.350000,
  "is_active": true
}
```

### Add Exchange Rate

```
POST /api/finance/currencies/:id/exchange-rates

Request:
{
  "effective_date": "2026-01-16",
  "rate": 4.380000,
  "source": "manual"
}
```

### Get Exchange Rate History

```
GET /api/finance/currencies/:id/exchange-rates
Query: ?from_date=2025-01-01&to_date=2026-01-15

Response:
{
  "rates": [
    {
      "id": "uuid",
      "effective_date": "2026-01-15",
      "rate": 4.350000,
      "source": "manual",
      "created_by": "uuid",
      "created_by_name": "John Smith"
    }
  ],
  "statistics": {
    "average": 4.315000,
    "high": 4.350000,
    "low": 4.250000,
    "total_change": 0.100000,
    "change_percent": 2.35
  }
}
```

---

## Business Rules

### Currency Rules

1. **One Base Currency**: Organization can have exactly one base currency
2. **Base Rate = 1**: Base currency always has exchange_rate = 1.000000
3. **Rate Direction**: Rate represents PLN per 1 unit of foreign currency
4. **Historical Lookup**: Use most recent rate <= transaction date
5. **Precision**: Exchange rates stored with 6 decimal precision
6. **Immutable History**: Historical rates cannot be deleted (audit trail)

### Permissions

| Role | View | Create | Update Rate | Delete | Change Base |
|------|------|--------|-------------|--------|-------------|
| Finance Manager | Yes | Yes | Yes | Yes (inactive only) | Yes |
| Admin | Yes | Yes | Yes | Yes | Yes |
| Cost Accountant | Yes | No | No | No | No |
| Viewer | Yes | No | No | No | No |

---

## Handoff to FRONTEND-DEV

```yaml
feature: Currency & Exchange Rates Page
story: FIN-006
prd_coverage: "Finance PRD FR-9.8.1-5"
  - "Multi-currency support"
  - "PLN default base currency"
  - "Currency CRUD"
  - "Exchange rate management"
  - "Historical rate tracking"
approval_status:
  mode: "auto_approve"
  user_approved: true
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/FIN-006-currency-exchange-rates.md
  api_endpoints:
    - GET /api/finance/currencies
    - POST /api/finance/currencies
    - PATCH /api/finance/currencies/:id
    - DELETE /api/finance/currencies/:id
    - GET /api/finance/currencies/:id/exchange-rates
    - POST /api/finance/currencies/:id/exchange-rates
states_per_screen: [loading, empty, populated, error]
components:
  - BaseCurrencyCard
  - CurrenciesTable
  - CurrencyFormModal
  - ExchangeRateUpdateForm
  - ExchangeRateHistoryModal
  - RateTrendChart
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 5-7 hours
**Wireframe Length**: ~400 lines
