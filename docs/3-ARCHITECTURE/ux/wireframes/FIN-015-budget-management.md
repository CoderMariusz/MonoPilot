# FIN-015: Budget Management

**Module**: Finance
**Feature**: Budget Approval Workflow & Forecasting (PRD Section 9.13)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Budget Management                   Fiscal Year: [2026 v]  [+ New Budget Request]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  [Overview] [Pending Approvals (4)] [Active Budgets] [Forecast] [History]                       |
|  ^^^^^^^^^^                                                                                      |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | 2026 Fiscal Year Budget Overview                                                          |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Total Approved     |  | Pending Approval   |  | YTD Utilized       |  | Forecast      | |   |
|  |  | $2,450,000         |  | $125,000           |  | $825,300           |  | Accuracy      | |   |
|  |  | (15 cost centers)  |  | (3 requests)       |  | 33.7% (Q1 done)    |  | 94.2%         | |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Budget by Department (Approved)                                                            |   |
|  |                                                                                            |   |
|  | Department             Budget        YTD Actual   Variance      Forecast EOY   Status     |   |
|  | ---------------------------------------------------------------------------------         |   |
|  | Manufacturing          $1,200,000    $405,200     $794,800 ✓   $1,185,000      On Track  |   |
|  | Warehouse Operations   $485,000      $162,800     $322,200 ✓   $478,000        On Track  |   |
|  | Quality Control        $285,000      $94,500      $190,500 ✓   $282,000        On Track  |   |
|  | Admin & Overhead       $320,000      $108,400     $211,600 ✓   $325,000        Warning   |   |
|  | Sales & Marketing      $160,000      $54,400      $105,600 ✓   $158,000        On Track  |   |
|  | ---------------------------------------------------------------------------------         |   |
|  | Total                  $2,450,000    $825,300     $1,624,700   $2,428,000      ✓         |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +--------------------------------------------+  +-------------------------------------------+   |
|  | Pending Approval Requests (4)              |  | Budget Forecast (Next 6 Months)           |   |
|  |                                            |  |                                           |   |
|  | Request ID    Dept         Amount    Age  |  | $500K |                                  |   |
|  | ------------------------------------------ |  |       |                      * Forecast  |   |
|  | BR-2026-048   Warehouse    $25,000   3d   |  | $450K |                 *   /            |   |
|  | [URGENT]                          [Review] |  |       |            *   /                 |   |
|  |                                            |  | $400K |       *   /                      |   |
|  | BR-2026-047   Mfg Dept     $75,000   5d   |  |       |  *   /                           |   |
|  | New equipment purchase            [Review] |  | $350K | /                                |   |
|  |                                            |  |       +-------------------------------->  |   |
|  | BR-2026-046   Quality      $15,000   7d   |  |        Feb  Mar  Apr  May  Jun  Jul      |   |
|  | Testing equipment upgrade         [Review] |  |        2026                               |   |
|  |                                            |  |                                           |   |
|  | BR-2026-045   Admin        $10,000   12d  |  |  Legend: * Monthly Projected Spend       |   |
|  | Office renovations                [Review] |  |                                           |   |
|  |                                            |  | [View Detailed Forecast]                 |   |
|  | [View All Requests (4)]                    |  +-------------------------------------------+   |
|  +--------------------------------------------+                                                  |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Recent Activity                                                                            |   |
|  |                                                                                            |   |
|  |  Jan 15, 10:30 AM  •  Budget request BR-2026-048 submitted by John Smith (Warehouse)     |   |
|  |  Jan 14, 3:45 PM   •  Budget BR-2026-042 approved by Sarah Johnson ($45,000)             |   |
|  |  Jan 14, 2:15 PM   •  Budget forecast updated: Q1 accuracy 94.2%                         |   |
|  |  Jan 13, 9:00 AM   •  Q1 budget review completed - all departments on track              |   |
|  |  Jan 12, 4:30 PM   •  Budget transfer approved: Manufacturing → Quality ($8,000)         |   |
|  |                                                                                            |   |
|  |  [View All Activity]                                                                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-----------------------------+  +----------------------------+  +---------------------------+   |
|  | Quick Actions               |  | Budget Alerts (2)          |  | Reports                   |   |
|  |                             |  |                            |  |                           |   |
|  | [Submit Budget Request]     |  | ⚠️ Admin dept projected    |  | [Annual Budget Report]    |   |
|  | [Approve Pending]           |  |    to exceed by $5K        |  | [Quarterly Review]        |   |
|  | [Budget Transfer]           |  |                            |  | [Forecast Accuracy]       |   |
|  | [Upload Forecast]           |  | ⚠️ 4 requests awaiting     |  | [Variance Analysis]       |   |
|  | [Export Budget Book]        |  |    approval (3+ days)      |  | [Department Breakdown]    |   |
|  |                             |  |                            |  |                           |   |
|  |                             |  | [View All Alerts]          |  |                           |   |
|  +-----------------------------+  +----------------------------+  +---------------------------+   |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Pending Approvals Tab (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Budget Management                   Fiscal Year: [2026 v]  [+ New Budget Request]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  [Overview] [Pending Approvals (4)] [Active Budgets] [Forecast] [History]                       |
|            ^^^^^^^^^^^^^^^^^^^^^^^^                                                              |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Pending Budget Approval Requests                                            [Approve All]  |   |
|  |                                                                                            |   |
|  | Filters: [All Departments v] [All Amounts v] [Sort: Oldest First v]                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | BR-2026-048  [URGENT]                                               Submitted: 3 days ago  |   |
|  +-------------------------------------------------------------------------------------------+   |
|  | Department: Warehouse Operations                                                           |   |
|  | Requested by: John Smith (Warehouse Manager)                                               |   |
|  | Amount: $25,000                                                                            |   |
|  | Category: Equipment Purchase                                                               |   |
|  |                                                                                            |   |
|  | Justification:                                                                             |   |
|  | New forklift required to handle increased pallet volume from new customers.               |   |
|  | Current fleet at capacity, causing bottlenecks in receiving/shipping.                     |   |
|  | ROI: Estimated 15% throughput increase, payback period 18 months.                         |   |
|  |                                                                                            |   |
|  | Budget Impact:                                                                             |   |
|  | Current Warehouse Budget: $485,000 | YTD Utilized: $162,800 | Remaining: $322,200        |   |
|  | If approved, new remaining: $297,200 (61.3% of annual budget)                             |   |
|  |                                                                                            |   |
|  | Supporting Documents: [Forklift_Quote.pdf] [ROI_Analysis.xlsx]                            |   |
|  |                                                                                            |   |
|  | Approval Chain:                                                                            |   |
|  | 1. Warehouse Manager (John Smith) - Submitted ✓                                           |   |
|  | 2. Operations Director (Sarah Miller) - Pending review                                    |   |
|  | 3. Finance Manager (Mike Johnson) - Pending approval                                      |   |
|  |                                                                                            |   |
|  | [Approve] [Reject] [Request More Info]                             Comments: [________]   |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | BR-2026-047                                                         Submitted: 5 days ago  |   |
|  +-------------------------------------------------------------------------------------------+   |
|  | Department: Manufacturing                                                                  |   |
|  | Requested by: Emily Davis (Production Manager)                                             |   |
|  | Amount: $75,000                                                                            |   |
|  | Category: Equipment Purchase                                                               |   |
|  |                                                                                            |   |
|  | Justification:                                                                             |   |
|  | Purchase new dough mixer to replace 10-year-old unit showing reliability issues...        |   |
|  |                                                                                            |   |
|  | [Expand] [Approve] [Reject] [Request More Info]                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Showing 2 of 4 requests] [Load More]                                                           |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Budget Management             |
|  [2026 v]                        |
+----------------------------------+
|                                  |
|  [Overview] [Pending (4)]        |
|  ^^^^^^^^^^                      |
|                                  |
|  2026 Budget Summary             |
|  +----------------------------+  |
|  | Approved       $2,450,000  |  |
|  | Pending        $125,000    |  |
|  | YTD Utilized   $825,300    |  |
|  |                33.7%       |  |
|  +----------------------------+  |
|                                  |
|  By Department                   |
|  +----------------------------+  |
|  | Manufacturing              |  |
|  | Budget:  $1,200,000        |  |
|  | Actual:  $405,200          |  |
|  | Status:  On Track ✓        |  |
|  +----------------------------+  |
|  | Warehouse Operations       |  |
|  | Budget:  $485,000          |  |
|  | Actual:  $162,800          |  |
|  | Status:  On Track ✓        |  |
|  +----------------------------+  |
|  | Quality Control            |  |
|  | Budget:  $285,000          |  |
|  | Actual:  $94,500           |  |
|  | Status:  On Track ✓        |  |
|  +----------------------------+  |
|  | [View All (5)]             |  |
|                                  |
|  Pending Approval (4)            |
|  +----------------------------+  |
|  | BR-2026-048   [URGENT]     |  |
|  | Warehouse     $25,000      |  |
|  | 3 days ago                 |  |
|  | [Review]                   |  |
|  +----------------------------+  |
|  | BR-2026-047                |  |
|  | Manufacturing $75,000      |  |
|  | 5 days ago                 |  |
|  | [Review]                   |  |
|  +----------------------------+  |
|                                  |
|  [+ New Request]                 |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Budget Management                   Fiscal Year: [2026 v]  [+ New Budget Request]    |
+--------------------------------------------------------------------------------------------------+
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
|  Loading budget data...                                                                          |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Budget Management                   Fiscal Year: [2026 v]  [+ New Budget Request]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Calendar Icon]                                          |
|                                                                                                  |
|                                  No Budget Data for 2026                                         |
|                                                                                                  |
|                     No budgets have been configured for the 2026 fiscal year.                    |
|                     Start by creating cost center budgets for your departments                   |
|                     and operational areas.                                                       |
|                                                                                                  |
|                                                                                                  |
|                                    [Set Up 2026 Budget]                                          |
|                                                                                                  |
|                                                                                                  |
|                     Next Steps:                                                                  |
|                     1. Define cost centers (departments, lines, functions)                       |
|                     2. Allocate annual budgets per cost center                                   |
|                     3. Set up approval workflow                                                  |
|                     4. Configure forecast parameters                                             |
|                                                                                                  |
|                              [Import Budget Template]                                            |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Finance > Budget Management                   Fiscal Year: [2026 v]  [+ New Budget Request]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load Budget Data                                         |
|                                                                                                  |
|                     Unable to retrieve budget management information.                            |
|                     Please check your connection and try again.                                  |
|                                                                                                  |
|                                Error: BUDGET_MANAGEMENT_FETCH_FAILED                             |
|                                                                                                  |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Summary Metrics Cards

Fiscal year-level budget overview.

| Metric | Calculation | Display |
|--------|-------------|---------|
| Total Approved | SUM(approved budgets) | "$2,450,000 (15 cost centers)" |
| Pending Approval | SUM(pending requests) | "$125,000 (3 requests)" |
| YTD Utilized | SUM(actual spend) YTD | "$825,300 (33.7% Q1 done)" |
| Forecast Accuracy | Forecast vs Actual variance | "94.2%" |

### 2. Budget by Department Table

Department-level budget performance.

| Column | Source | Display |
|--------|--------|---------|
| Department | cost_centers.department | "Manufacturing" |
| Budget | SUM(approved amounts) | "$1,200,000" |
| YTD Actual | SUM(transactions) | "$405,200" |
| Variance | Budget - Actual | "$794,800 ✓" |
| Forecast EOY | Projected year-end total | "$1,185,000" |
| Status | Based on variance & forecast | "On Track" / "Warning" / "Over Budget" |

**Status Indicators:**
- On Track (green): Forecast ≤ Budget
- Warning (orange): Forecast 100-110% of budget
- Over Budget (red): Forecast > 110% of budget

### 3. Pending Approval Requests

Budget requests awaiting approval.

| Field | Source | Display |
|-------|--------|---------|
| Request ID | budget_requests.id | "BR-2026-048" |
| Department | cost_centers.name | "Warehouse Operations" |
| Requested By | users.name | "John Smith (Warehouse Manager)" |
| Amount | budget_requests.amount | "$25,000" |
| Category | budget_requests.category | "Equipment Purchase" |
| Age | Days since submission | "3 days ago" |
| Urgency | budget_requests.urgency | [URGENT] badge |
| Justification | budget_requests.justification | Full text |
| Budget Impact | Calculated | Current/utilized/remaining |
| Supporting Docs | File attachments | Links to PDFs/Excel |
| Approval Chain | Workflow steps | Step 1 ✓, Step 2 Pending, etc. |

**Actions per Request:**
- [Approve]: Approve request
- [Reject]: Reject with reason
- [Request More Info]: Send back to requester

### 4. Budget Forecast Chart

6-month rolling forecast line chart.

**Chart Type:** Line chart
**X-Axis:** Month (next 6 months)
**Y-Axis:** Dollar amount ($350K - $500K)
**Line:** Projected monthly spend

**Forecast Calculation:**
```
Monthly Forecast = (YTD Actual / Months Elapsed) × Seasonality Factor

Seasonality factors based on historical patterns
```

### 5. Recent Activity Feed

Timeline of budget-related activities.

| Field | Display |
|-------|---------|
| Timestamp | "Jan 15, 10:30 AM" |
| Event Type | Icon + description |
| Event | "Budget request BR-2026-048 submitted..." |

**Event Types:**
- Request submitted
- Request approved/rejected
- Forecast updated
- Budget transferred
- Review completed

### 6. Budget Alerts

Automated alerts for budget issues.

| Alert Type | Condition | Display |
|------------|-----------|---------|
| Projected Over Budget | Forecast > Budget | "⚠️ Admin dept projected to exceed by $5K" |
| Pending Overdue | Request age > 3 days | "⚠️ 4 requests awaiting approval (3+ days)" |
| Underspend | YTD < 50% at 75% through year | "⚠️ Quality dept underspending by 30%" |

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| New Budget Request | Header [+ New Budget Request] | Opens BudgetRequestModal |
| Approve Request | Pending approval card | Opens ApprovalModal, updates status |
| Reject Request | Pending approval card | Opens RejectionModal with reason |
| Request More Info | Pending approval card | Send back to requester with comments |
| Approve All | Pending approvals header | Bulk approve all pending (with confirmation) |

### Quick Actions Panel

| Action | Trigger | Behavior |
|--------|---------|----------|
| Submit Budget Request | Button | Opens BudgetRequestModal |
| Approve Pending | Button | Navigate to Pending Approvals tab |
| Budget Transfer | Button | Opens TransferModal |
| Upload Forecast | Button | Upload CSV/Excel forecast data |
| Export Budget Book | Button | Generate PDF budget book (all depts) |

### Tab Navigation

| Tab | Content |
|-----|---------|
| Overview | Summary metrics, department table, forecast chart |
| Pending Approvals | List of requests awaiting approval |
| Active Budgets | All approved budgets by department/cost center |
| Forecast | Detailed forecast vs actual analysis |
| History | Historical budget data, approvals, transfers |

---

## States

### Loading State
- Skeleton summary cards
- Skeleton tables
- "Loading budget data..." text

### Empty State
- Calendar illustration
- "No Budget Data for 2026" headline
- Explanation and next steps
- [Set Up 2026 Budget] CTA
- [Import Budget Template] option

### Populated State (Success)
- All summary metrics visible
- Department budget table
- Pending approval requests
- Forecast chart
- Recent activity feed
- Alerts if applicable

### Error State
- Warning icon
- "Failed to Load Budget Data" headline
- Error code: BUDGET_MANAGEMENT_FETCH_FAILED
- [Retry] and [Contact Support] buttons

---

## Data Fields

### Budget Overview Response

```json
{
  "summary": {
    "fiscal_year": 2026,
    "total_approved": 2450000,
    "total_cost_centers": 15,
    "pending_approval": 125000,
    "pending_requests": 3,
    "ytd_utilized": 825300,
    "ytd_percentage": 33.7,
    "forecast_accuracy": 94.2
  },
  "departments": [
    {
      "name": "Manufacturing",
      "budget": 1200000,
      "ytd_actual": 405200,
      "variance": 794800,
      "forecast_eoy": 1185000,
      "status": "on_track"
    }
  ],
  "pending_requests": [
    {
      "id": "BR-2026-048",
      "department": "Warehouse Operations",
      "requested_by": "John Smith",
      "amount": 25000,
      "category": "Equipment Purchase",
      "submitted_at": "2026-01-12",
      "age_days": 3,
      "urgency": "high",
      "justification": "New forklift required...",
      "supporting_docs": ["forklift_quote.pdf"],
      "approval_chain": [...]
    }
  ],
  "forecast": [
    { "month": "2026-02", "projected": 385000 }
  ],
  "activity": [...],
  "alerts": [...]
}
```

---

## API Endpoints

### Get Budget Overview

```
GET /api/finance/budgets/overview
Query: ?fiscal_year=2026

Response: { ... } (see Data Fields above)
```

### Submit Budget Request

```
POST /api/finance/budgets/requests
Content-Type: application/json

Request:
{
  "cost_center_id": "uuid",
  "amount": 25000,
  "category": "Equipment Purchase",
  "justification": "New forklift required...",
  "urgency": "high",
  "supporting_docs": ["doc_id_1", "doc_id_2"]
}

Response:
{
  "request": {
    "id": "BR-2026-048",
    "status": "pending",
    "submitted_at": "2026-01-15T10:30:00Z"
  }
}
```

### Approve/Reject Request

```
POST /api/finance/budgets/requests/:id/approve
Content-Type: application/json

Request:
{
  "decision": "approved",  // or "rejected"
  "comments": "Approved based on ROI analysis"
}

Response:
{
  "request": {
    "id": "BR-2026-048",
    "status": "approved",
    "approved_by": "uuid",
    "approved_at": "2026-01-15T14:00:00Z"
  }
}
```

---

## Permissions

| Role | View Budgets | Submit Request | Approve | Reject | Forecast |
|------|--------------|----------------|---------|--------|----------|
| Finance Manager | Yes | Yes | Yes | Yes | Yes |
| Cost Center Manager | Yes (own) | Yes (own) | No | No | No |
| Finance Director | Yes | Yes | Yes | Yes | Yes |
| Operations Manager | Yes | Yes (own) | No | No | View only |
| Admin | Yes | Yes | Yes | Yes | Yes |

---

## Validation

### Budget Request

| Field | Rule | Error Message |
|-------|------|---------------|
| Amount | > 0, max $1M | "Amount must be between $1 and $1,000,000" |
| Justification | Min 50 chars | "Justification must be at least 50 characters" |
| Category | Required | "Category is required" |
| Supporting Docs | At least 1 for amounts > $10K | "Amounts over $10K require supporting documentation" |

### Approval

| Rule | Error Message |
|------|---------------|
| Must have approval permission | "You do not have permission to approve budget requests" |
| Cannot approve own request | "You cannot approve your own budget request" |
| Must follow approval chain | "Request must be approved by previous approver first" |

---

## Business Rules

### Approval Workflow

**Default Approval Chain:**
1. Cost Center Manager (submits)
2. Department Director (reviews)
3. Finance Manager (approves if < $50K)
4. Finance Director (approves if ≥ $50K)

**Urgency Levels:**
- High: Requires approval within 2 business days
- Medium: 5 business days
- Low: 10 business days

### Forecast Calculation

```
Monthly Forecast = (YTD Actual / Elapsed Months) × Remaining Months × Seasonality

Seasonality factors:
- Jan-Mar: 0.9 (slower)
- Apr-Jun: 1.0 (normal)
- Jul-Sep: 1.1 (peak)
- Oct-Dec: 1.0 (normal)

Forecast Accuracy = 1 - ABS(Forecast - Actual) / Actual
```

### Budget Transfer Rules

- Can transfer between cost centers in same department
- Max 10% of source budget per transfer
- Requires Finance Manager approval
- Cannot transfer if source budget is over-utilized

---

## Accessibility

### Touch Targets
- Action buttons: 48x48dp
- Request cards: 48dp height
- Approval buttons: 48x48dp
- Tab navigation: 48dp height

### Contrast
- Summary metrics: 4.5:1
- Table text: 4.5:1
- Status indicators: Green #16A34A, Orange #F97316, Red #DC2626 (AA)
- Urgency badges: Red background, white text (4.5:1)

### Screen Reader
- **Page**: `aria-label="Budget Management Dashboard"`
- **Pending requests**: `role="list"`, each request `role="listitem"`
- **Approval actions**: Clear `aria-label` for each button
- **Charts**: `aria-label` with data summary

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Navigate tabs, cards, buttons |
| Enter | Activate button, expand card |
| Arrow keys | Navigate table rows, tabs |
| Escape | Close modal |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | 4-column metrics, side-by-side panels, full approval cards |
| **Tablet (768-1024px)** | 2-column metrics, stacked panels, condensed cards |
| **Mobile (<768px)** | 1-column, tab navigation, simplified cards |

---

## Performance Notes

### Query Optimization

```sql
-- Index for budget requests
CREATE INDEX idx_budget_requests_status
ON budget_requests(org_id, fiscal_year, status, submitted_at);

-- Index for approval workflow
CREATE INDEX idx_budget_approvals
ON budget_approvals(org_id, request_id, approver_id, status);
```

### Caching

```typescript
'org:{orgId}:finance:budgets:overview:{year}'    // 10 min TTL
'org:{orgId}:finance:budgets:pending'            // 2 min TTL
'org:{orgId}:finance:budgets:forecast:{year}'    // 1 hour TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial load | < 1.5s |
| Tab switch | < 300ms |
| Approve request | < 500ms |
| Export budget book | < 5s |

---

## Testing Requirements

### Unit Tests
```typescript
describe('Budget Management', () => {
  it('calculates forecast correctly', async () => {});
  it('validates approval chain', async () => {});
  it('shows pending requests in order', async () => {});
});
```

### E2E Tests
```typescript
describe('Budget Management E2E', () => {
  it('loads overview with metrics', async () => {});
  it('submits budget request', async () => {});
  it('approves pending request', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] Approval workflow documented
- [x] Forecast calculations defined

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 8-10 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (Finance PRD Section 9.13)
