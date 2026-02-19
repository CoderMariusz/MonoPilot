# FIN-014: Cost Center Budget Page

**Module**: Finance
**Feature**: Cost Center Budget Management (PRD Section 9.12)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Cost Centers > Manufacturing Department       Period: [2026 Q1 v]  [+ New Cost Center]|
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Cost Center: Manufacturing Department                                    [Edit] [Delete]  |   |
|  | Code: MFGFEAST01 | Manager: John Smith | Category: Production                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Q1 2026 Summary                                                                            |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Total Budget       |  | Actual Spend       |  | Variance           |  | % Utilized    | |   |
|  |  | $125,000           |  | $98,450            |  | $26,550 Under ✓    |  | 78.8%         | |   |
|  |  |                    |  | (as of Jan 15)     |  | 21.2% remaining    |  |               | |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Budget vs Actual (Monthly Breakdown)                                                       |   |
|  |                                                                                            |   |
|  |  Month      Budget      Actual      Variance      % Util   Status                         |   |
|  |  ---------------------------------------------------------------------------------         |   |
|  |  Jan 2026   $42,000     $32,150     $9,850 ✓      76.5%    [On Track]                     |   |
|  |  Feb 2026   $41,500     $28,900     $12,600 ✓     69.6%    [Forecast]                     |   |
|  |  Mar 2026   $41,500     $37,400     $4,100 ✓      90.1%    [Forecast]                     |   |
|  |  ---------------------------------------------------------------------------------         |   |
|  |  Total Q1   $125,000    $98,450     $26,550 ✓     78.8%                                   |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +--------------------------------------------+  +-------------------------------------------+   |
|  | Spend by Category                          |  | Trend Chart (Last 12 Months)              |   |
|  |                                            |  |                                           |   |
|  | Category            Budget    Actual  %    |  | $50K |                                    |   |
|  | ------------------------------------------ |  |      |                        *          |   |
|  | Direct Labor        $48,000   $37,200  77% |  | $40K |                   *   / \         |   |
|  | Materials           $35,000   $28,500  81% |  |      |              *   /   *   \   *    |   |
|  | Equipment Maint     $18,000   $14,200  79% |  | $30K |         *   / \ /         \ /     |   |
|  | Utilities           $12,000    $9,850  82% |  |      |    *   /   *                       |   |
|  | Supplies            $8,000     $6,200  78% |  | $20K |   / \ /                            |   |
|  | Training            $4,000     $2,500  63% |  |      |  *                                 |   |
|  |                                            |  | $10K +-------------------------------->  |   |
|  | Total               $125,000  $98,450  79% |  |       Feb Mar Apr May Jun Jul Aug Sep... |   |
|  |                                            |  |                                           |   |
|  | [View Details]                             |  |  Legend: * Monthly Actual                |   |
|  +--------------------------------------------+  +-------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Variance Alerts                                                                            |   |
|  |                                                                                            |   |
|  |  ⚠️  Equipment Maintenance projected to exceed budget by $2,500 in March                  |   |
|  |  ⚠️  Training spend 37% below target - action needed                                      |   |
|  |  ✓  Overall spend tracking 21% under budget                                               |   |
|  |                                                                                            |   |
|  |  [View All Alerts (3)]                                                                     |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-----------------------------+  +----------------------------+  +---------------------------+   |
|  | Recent Transactions (Top 10)|  | Budget History             |  | Quick Actions             |   |
|  |                             |  |                            |  |                           |   |
|  | Jan 15: Direct Labor        |  | Q4 2025: $118,500          |  | [Upload Actuals]          |   |
|  |         $4,250              |  | Q3 2025: $122,000          |  | [Adjust Budget]           |   |
|  |                             |  | Q2 2025: $119,800          |  | [Export Report]           |   |
|  | Jan 14: Materials           |  | Q1 2025: $115,000          |  | [Request Transfer]        |   |
|  |         $1,850              |  |                            |  | [View Forecast]           |   |
|  |                             |  | YoY Growth: +8.7%          |  |                           |   |
|  | Jan 13: Equipment           |  |                            |  |                           |   |
|  |         $3,200              |  | [View Full History]        |  |                           |   |
|  |                             |  |                            |  |                           |   |
|  | [View All Transactions]     |  |                            |  |                           |   |
|  +-----------------------------+  +----------------------------+  +---------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Tablet: 768-1024px)

```
+----------------------------------------------------------------------+
|  Finance > Cost Centers > Manufacturing       [2026 Q1 v]  [+ New]  |
+----------------------------------------------------------------------+
|                                                                      |
|  Manufacturing Department (MFGFEAST01)           [Edit] [Delete]    |
|  Manager: John Smith | Category: Production                          |
|                                                                      |
|  +------------------------------------------------------------------+ |
|  | Budget: $125K | Actual: $98.5K | Variance: $26.5K ✓ | 78.8%    | |
|  +------------------------------------------------------------------+ |
|                                                                      |
|  Monthly Breakdown                                                   |
|  +------------------------------------------------------------------+ |
|  | Jan 2026    Budget: $42K    Actual: $32.1K    76.5% ✓           | |
|  | Feb 2026    Budget: $41.5K  Actual: $28.9K    69.6% ✓           | |
|  | Mar 2026    Budget: $41.5K  Actual: $37.4K    90.1% ✓           | |
|  +------------------------------------------------------------------+ |
|                                                                      |
|  Spend by Category                                                   |
|  +------------------------------------------------------------------+ |
|  | Direct Labor         $48K → $37.2K    77% ▆▆▆▆▆▆▆               | |
|  | Materials            $35K → $28.5K    81% ▆▆▆▆▆▆▆▆              | |
|  | Equipment Maint      $18K → $14.2K    79% ▆▆▆▆▆▆▆               | |
|  | Utilities            $12K → $9.9K     82% ▆▆▆▆▆▆▆▆              | |
|  | [View All (6)]                                                   | |
|  +------------------------------------------------------------------+ |
|                                                                      |
|  Alerts (3)                                                          |
|  ⚠️ Equipment Maint projected to exceed by $2.5K in March           |
|  ⚠️ Training spend 37% below target                                 |
|  [View All Alerts]                                                   |
|                                                                      |
+----------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Manufacturing Dept            |
|  [2026 Q1 v]                     |
+----------------------------------+
|                                  |
|  MFGFEAST01                      |
|  Manager: John Smith             |
|                                  |
|  +----------------------------+  |
|  | Budget        $125,000     |  |
|  | Actual        $98,450      |  |
|  | Variance      $26,550 ✓    |  |
|  | % Utilized    78.8%        |  |
|  +----------------------------+  |
|                                  |
|  [Overview] [Monthly] [Category] |
|  ^^^^^^^^^^                      |
|                                  |
|  Monthly Breakdown               |
|  +----------------------------+  |
|  | January 2026               |  |
|  | Budget:   $42,000          |  |
|  | Actual:   $32,150          |  |
|  | Variance: $9,850 ✓         |  |
|  | Status: On Track           |  |
|  +----------------------------+  |
|  | February 2026              |  |
|  | Budget:   $41,500          |  |
|  | Actual:   $28,900          |  |
|  | Variance: $12,600 ✓        |  |
|  | Status: Forecast           |  |
|  +----------------------------+  |
|  | March 2026                 |  |
|  | Budget:   $41,500          |  |
|  | Actual:   $37,400          |  |
|  | Variance: $4,100 ✓         |  |
|  | Status: Forecast           |  |
|  +----------------------------+  |
|                                  |
|  Alerts (3)                      |
|  ⚠️ Equip Maint over by $2.5K    |
|  ⚠️ Training 37% under target    |
|  [View All]                      |
|                                  |
|  [Edit Budget] [Export]          |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Cost Centers > Manufacturing Department       Period: [2026 Q1 v]  [+ New Cost Center]|
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Cost Center: [░░░░░░░░░░░░░░░░░░░░░░]                                                     |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | [░░░░░░░░░░░]  [░░░░░░░░░░░]  [░░░░░░░░░░░]  [░░░░░░░░░░░]                              |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        |   |
|  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  Loading cost center budget data...                                                              |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Cost Centers                                  Period: [2026 Q1 v]  [+ New Cost Center]|
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Wallet Icon]                                            |
|                                                                                                  |
|                                  No Cost Centers Configured                                      |
|                                                                                                  |
|                     Cost centers help you track budgets and spending across                      |
|                     departments, production lines, or functional areas.                          |
|                                                                                                  |
|                                                                                                  |
|                                    [+ Create First Cost Center]                                  |
|                                                                                                  |
|                                                                                                  |
|                     Common Cost Centers:                                                         |
|                     - Production (Manufacturing, Packaging, Quality Control)                     |
|                     - Operations (Warehouse, Logistics, Maintenance)                             |
|                     - Overhead (Admin, Sales, Marketing)                                         |
|                                                                                                  |
|                              [View Cost Center Setup Guide]                                      |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Cost Centers > Manufacturing Department       Period: [2026 Q1 v]  [+ New Cost Center]|
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load Budget Data                                         |
|                                                                                                  |
|                     Unable to retrieve cost center budget information.                           |
|                     Please check your connection and try again.                                  |
|                                                                                                  |
|                                Error: COST_CENTER_BUDGET_FETCH_FAILED                            |
|                                                                                                  |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
|                                                                                                  |
|  Quick Actions (still available):                                                                |
|  [Go to Cost Centers List] - View all cost centers                                              |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Cost Center Header

Displays cost center identity and key metadata.

| Field | Source | Display |
|-------|--------|---------|
| Name | cost_centers.name | "Manufacturing Department" |
| Code | cost_centers.code | "MFGFEAST01" (unique identifier) |
| Manager | users.name | "John Smith" |
| Category | cost_centers.category | "Production" / "Operations" / "Overhead" |
| Actions | - | [Edit] [Delete] buttons |

### 2. Summary Metrics Cards

Quarter-level budget performance overview.

| Metric | Calculation | Display |
|--------|-------------|---------|
| Total Budget | SUM(monthly budgets) | "$125,000" |
| Actual Spend | SUM(actual transactions) | "$98,450 (as of Jan 15)" |
| Variance | Budget - Actual | "$26,550 Under ✓" or "$5,000 Over ⚠️" |
| % Utilized | (Actual / Budget) × 100 | "78.8%" |

**Variance Indicators:**
- Green ✓: Under budget
- Red ⚠️: Over budget
- Orange ⚠️: Projected to exceed (based on forecast)

### 3. Monthly Breakdown Table

Month-by-month budget vs actual comparison.

| Column | Source | Display |
|--------|--------|---------|
| Month | budget_periods.month | "Jan 2026" |
| Budget | budget_periods.budget_amount | "$42,000" |
| Actual | SUM(transactions.amount) | "$32,150" |
| Variance | Budget - Actual | "$9,850 ✓" |
| % Util | (Actual / Budget) × 100 | "76.5%" |
| Status | Current vs Forecast | [On Track] / [Forecast] / [Over Budget] |

**Status Badges:**
- On Track (green): Current month, under budget
- Forecast (blue): Future month, projected
- Over Budget (red): Actual > Budget

### 4. Spend by Category Table

Budget breakdown by expense category.

| Column | Source | Display |
|--------|--------|---------|
| Category | expense_categories.name | "Direct Labor" |
| Budget | category_budgets.amount | "$48,000" |
| Actual | SUM(transactions) | "$37,200" |
| % Util | (Actual / Budget) × 100 | "77%" with progress bar |

**Categories:**
- Direct Labor
- Materials
- Equipment Maintenance
- Utilities
- Supplies
- Training
- Other

### 5. Trend Chart

12-month historical spending trend.

**Chart Type:** Line chart
**X-Axis:** Month (last 12 months)
**Y-Axis:** Dollar amount ($10K - $50K)
**Line:** Monthly actual spend

**Interactions:**
- Hover tooltip: Month, Actual amount
- Click month: Drill down to month detail

### 6. Variance Alerts

Automated alerts for budget issues.

| Alert Type | Condition | Display |
|------------|-----------|---------|
| Over Budget | Actual > Budget | "⚠️ Equipment Maintenance projected to exceed budget by $2,500 in March" |
| Underspend | Actual < 50% of Budget | "⚠️ Training spend 37% below target - action needed" |
| On Track | Within tolerance | "✓ Overall spend tracking 21% under budget" |

**Alert Priority:**
- Critical (red ⚠️): Over budget or projected over
- Warning (orange ⚠️): Significant underspend
- Info (green ✓): Positive status

### 7. Recent Transactions

Last 10 transactions against this cost center.

| Field | Display |
|-------|---------|
| Date | "Jan 15" |
| Category | "Direct Labor" |
| Amount | "$4,250" |
| Action | Link to transaction detail |

### 8. Budget History

Historical budget amounts by quarter.

| Quarter | Amount | YoY Change |
|---------|--------|------------|
| Q4 2025 | $118,500 | +5.2% |
| Q3 2025 | $122,000 | +3.8% |
| Q2 2025 | $119,800 | +2.1% |
| Q1 2025 | $115,000 | Baseline |

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Create Cost Center | Header [+ New Cost Center] | Opens CreateCostCenterModal |
| Edit Cost Center | Header [Edit] | Opens EditCostCenterModal |
| Delete Cost Center | Header [Delete] | Confirmation modal, soft delete |
| Change Period | Period dropdown | Reload data for selected period |

### Quick Actions Panel

| Action | Trigger | Behavior |
|--------|---------|----------|
| Upload Actuals | Button | Opens UploadActualsModal (CSV/Excel) |
| Adjust Budget | Button | Opens AdjustBudgetModal |
| Export Report | Button | Generate PDF report |
| Request Transfer | Button | Opens BudgetTransferRequestModal |
| View Forecast | Button | Navigate to forecast page |

### Drill-Down Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| View Category Detail | Click category row | Show transactions for category |
| View Month Detail | Click month row | Navigate to month detail page |
| View Transaction | Click transaction | Opens TransactionDetailModal |
| View All Alerts | Click link | Navigate to alerts page |

---

## States

### Loading State
- Skeleton header
- Skeleton summary cards
- Skeleton tables
- "Loading cost center budget data..." text

### Empty State
- Wallet illustration
- "No Cost Centers Configured" headline
- Explanation of cost centers
- [+ Create First Cost Center] CTA
- Common cost center examples
- [View Cost Center Setup Guide] link

### Populated State (Success)
- All summary metrics visible
- Monthly breakdown table
- Category spend table
- Trend chart
- Variance alerts
- Recent transactions

### Error State
- Warning icon
- "Failed to Load Budget Data" headline
- Error explanation
- Error code: COST_CENTER_BUDGET_FETCH_FAILED
- [Retry] and [Contact Support] buttons
- [Go to Cost Centers List] fallback

---

## Data Fields

### Cost Center Response

| Field | Source | Display |
|-------|--------|---------|
| id | cost_centers.id | UUID |
| code | cost_centers.code | "MFGFEAST01" |
| name | cost_centers.name | "Manufacturing Department" |
| manager_id | cost_centers.manager_id | UUID |
| manager_name | users.name | "John Smith" |
| category | cost_centers.category | "Production" |
| period | budget_periods.period | "2026 Q1" |
| total_budget | SUM(budget_periods.amount) | "$125,000" |
| actual_spend | SUM(transactions.amount) | "$98,450" |
| variance | total_budget - actual_spend | "$26,550" |
| utilization_pct | (actual_spend / total_budget) × 100 | "78.8%" |

### Monthly Breakdown

```json
{
  "months": [
    {
      "month": "2026-01",
      "budget": 42000,
      "actual": 32150,
      "variance": 9850,
      "utilization_pct": 76.5,
      "status": "on_track"
    }
  ]
}
```

### Category Breakdown

```json
{
  "categories": [
    {
      "name": "Direct Labor",
      "budget": 48000,
      "actual": 37200,
      "utilization_pct": 77.5
    }
  ]
}
```

---

## API Endpoints

### Get Cost Center Budget

```
GET /api/finance/cost-centers/:id/budget
Query: ?period=2026-Q1

Response:
{
  "cost_center": {
    "id": "uuid",
    "code": "MFGFEAST01",
    "name": "Manufacturing Department",
    "manager_id": "uuid",
    "manager_name": "John Smith",
    "category": "Production"
  },
  "summary": {
    "period": "2026-Q1",
    "total_budget": 125000,
    "actual_spend": 98450,
    "variance": 26550,
    "utilization_pct": 78.8,
    "status": "under_budget"
  },
  "monthly": [
    {
      "month": "2026-01",
      "budget": 42000,
      "actual": 32150,
      "variance": 9850,
      "utilization_pct": 76.5,
      "status": "on_track"
    }
  ],
  "categories": [
    {
      "name": "Direct Labor",
      "budget": 48000,
      "actual": 37200,
      "utilization_pct": 77.5
    }
  ],
  "trend": [
    { "month": "2025-02", "actual": 38500 }
  ],
  "alerts": [
    {
      "type": "over_budget_projected",
      "category": "Equipment Maintenance",
      "amount": 2500,
      "month": "2026-03"
    }
  ],
  "transactions": [
    {
      "date": "2026-01-15",
      "category": "Direct Labor",
      "amount": 4250,
      "description": "Weekly payroll"
    }
  ]
}
```

### Update Budget

```
PUT /api/finance/cost-centers/:id/budget
Content-Type: application/json

Request:
{
  "period": "2026-Q1",
  "monthly_budgets": [
    { "month": "2026-01", "amount": 45000 },
    { "month": "2026-02", "amount": 42000 },
    { "month": "2026-03", "amount": 43000 }
  ],
  "category_budgets": [
    { "category": "Direct Labor", "amount": 50000 },
    { "category": "Materials", "amount": 35000 }
  ]
}

Response:
{
  "cost_center": { ... },
  "summary": { ... },
  "updated_at": "2026-01-15T10:30:00Z"
}
```

---

## Permissions

| Role | View Budget | Edit Budget | Delete Cost Center | Upload Actuals |
|------|-------------|-------------|-------------------|----------------|
| Finance Manager | Yes | Yes | Yes | Yes |
| Cost Center Manager | Yes (own only) | Request only | No | Yes (own only) |
| Operations Manager | Yes | No | No | No |
| Admin | Yes | Yes | Yes | Yes |

---

## Validation

### Budget Amount

| Rule | Error Message |
|------|---------------|
| Amount > 0 | "Budget must be greater than zero" |
| Monthly total = Quarter total | "Monthly budgets must sum to quarter total" |
| No future period > 1 year | "Cannot set budget more than 1 year in advance" |

### Cost Center Code

| Rule | Error Message |
|------|---------------|
| Unique per org | "Cost center code already exists" |
| 3-20 alphanumeric chars | "Code must be 3-20 alphanumeric characters" |
| Uppercase | Auto-convert to uppercase |

---

## Business Rules

### Budget Allocation

**Quarter Budget:**
```
Quarter Budget = SUM(Monthly Budgets)

Must be allocated across 3 months
```

**Category Budget:**
```
Category Budget = Portion of total budget allocated to expense category

SUM(Category Budgets) should equal Total Budget
```

**Variance Calculation:**
```
Variance = Budget - Actual

Positive variance = Under budget (good)
Negative variance = Over budget (bad)
```

### Alert Thresholds

| Alert | Condition |
|-------|-----------|
| Critical Over Budget | Actual > Budget × 1.1 (110%) |
| Warning Over Budget | Actual > Budget × 1.05 (105%) |
| Projected Over Budget | Forecast > Budget |
| Critical Underspend | Actual < Budget × 0.5 (50%) at 75% through period |
| Warning Underspend | Actual < Budget × 0.7 (70%) at 75% through period |

### Period Options

| Option | Range |
|--------|-------|
| Current Quarter | Q1/Q2/Q3/Q4 2026 |
| Previous Quarter | Prior 3 months |
| Year-to-Date | Jan 1 - today |
| Custom | User-selected from/to |

---

## Accessibility

### Touch Targets
- Action buttons: 48x48dp
- Table rows: 48dp height
- Dropdown: 48x48dp
- Alert links: 48x48dp

### Contrast
- Summary metrics: 4.5:1
- Table text: 4.5:1
- Variance indicators: Green #16A34A, Red #DC2626 (AA compliant)
- Alert icons: 3:1 minimum

### Screen Reader
- **Page**: `role="main"` `aria-label="Cost Center Budget Page"`
- **Summary**: `aria-label="Budget summary: Total budget $125,000, Actual $98,450, Variance $26,550 under budget"`
- **Tables**: `role="table"` with proper headers
- **Alerts**: `role="alert"` for critical alerts

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Navigate sections, buttons, table rows |
| Enter | Activate button, open modal, drill down |
| Arrow keys | Navigate table rows |
| Escape | Close modal |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | 4-column metrics, side-by-side tables, full chart |
| **Tablet (768-1024px)** | 2-column metrics, stacked tables, simplified chart |
| **Mobile (<768px)** | 1-column metrics, tab navigation, card layout |

---

## Performance Notes

### Query Optimization

```sql
-- Index for cost center budgets
CREATE INDEX idx_cost_center_budgets
ON cost_center_budgets(org_id, cost_center_id, period);

-- Index for transactions
CREATE INDEX idx_cost_center_transactions
ON cost_center_transactions(org_id, cost_center_id, transaction_date);
```

### Caching

```typescript
'org:{orgId}:finance:cost-center:{id}:budget:{period}' // 10 min TTL
'org:{orgId}:finance:cost-center:{id}:transactions'   // 5 min TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial page load | < 1s |
| Period change | < 500ms |
| Export PDF | < 3s |

---

## Testing Requirements

### Unit Tests
```typescript
describe('Cost Center Budget Page', () => {
  it('calculates variance correctly', async () => {});
  it('shows over budget alerts', async () => {});
  it('calculates utilization percentage', async () => {});
});
```

### E2E Tests
```typescript
describe('Cost Center E2E', () => {
  it('loads budget data', async () => {});
  it('changes period and reloads', async () => {});
  it('edits budget', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] Budget calculations documented
- [x] Variance alerts defined

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 6-8 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (Finance PRD Section 9.12)
