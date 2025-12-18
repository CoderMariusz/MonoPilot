# Epic 9: Finance Module - Product Requirements Document

## Executive Summary

The Finance Module provides production costing, cost analysis, and financial reporting capabilities for food manufacturing operations. This is NOT a full accounting system - MonoPilot is MES-focused. The Finance module enables cost visibility and management for production operations, with integration points for external ERP systems (Comarch Optima).

**Scope**: Cost tracking, variance analysis, inventory valuation, margin reporting, and basic financial data management.

**Out of Scope**: General Ledger, Accounts Receivable, Accounts Payable, Invoicing, Full accounting workflows.

## Module Overview

### Purpose
Enable manufacturers to:
- Track actual production costs (material, labor, overhead)
- Analyze cost variances against standards
- Value inventory using industry-standard methods
- Calculate product margins and profitability
- Export financial data to external accounting systems
- Monitor budget performance by cost center

### Key Capabilities
1. Production cost tracking and allocation
2. Standard vs actual cost variance analysis
3. Recipe/BOM costing with ingredient and packaging costs
4. Inventory valuation (FIFO, weighted average)
5. Work order actual costing
6. Multi-dimensional cost reporting
7. Margin analysis and profitability tracking
8. Multi-currency support (PLN default)
9. Polish VAT tax code management
10. Cost center allocation
11. Budget vs actual variance reporting
12. Export integration to Comarch Optima
13. **Real-time variance analysis and alerting** (NEW)

## Functional Requirements

### FR-9.1: Cost Management

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.1.1 | Material Cost Tracking | P0 | 1 | Track actual material costs per consumption transaction |
| FR-9.1.2 | Labor Cost Tracking | P0 | 1 | Track labor costs per work order operation |
| FR-9.1.3 | Overhead Allocation | P0 | 2 | Allocate overhead costs using configurable drivers |
| FR-9.1.4 | Standard Cost Definition | P0 | 1 | Define standard costs for materials, labor, overhead |
| FR-9.1.5 | Cost Rollup Calculation | P0 | 2 | Calculate total product cost from BOM structure |
| FR-9.1.6 | Cost Update History | P1 | 2 | Track historical cost changes with effective dates |
| FR-9.1.7 | Multi-Level Cost Rollup | P1 | 2 | Calculate costs through multi-level BOM structures |
| FR-9.1.8 | Cost Approval Workflow | P2 | 3 | Require approval for standard cost changes |

### FR-9.2: Recipe/BOM Costing

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.2.1 | Ingredient Costing | P0 | 1 | Calculate ingredient costs from BOM quantities |
| FR-9.2.2 | Packaging Cost Calculation | P0 | 1 | Calculate packaging material costs |
| FR-9.2.3 | BOM Cost Simulation | P1 | 2 | Simulate cost impact of BOM changes |
| FR-9.2.4 | Recipe Cost Comparison | P1 | 2 | Compare costs across recipe versions |
| FR-9.2.5 | Yield Cost Adjustment | P1 | 2 | Adjust costs based on actual vs planned yield |
| FR-9.2.6 | Byproduct Cost Credit | P2 | 3 | Credit byproduct value against recipe cost |
| FR-9.2.7 | Cost by Batch Size | P2 | 3 | Calculate cost variations by batch size |

### FR-9.3: Work Order Costing

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.3.1 | WO Actual Material Cost | P0 | 1 | Calculate actual material cost per work order |
| FR-9.3.2 | WO Actual Labor Cost | P0 | 1 | Calculate actual labor cost per work order |
| FR-9.3.3 | WO Overhead Applied | P0 | 2 | Apply overhead costs to work orders |
| FR-9.3.4 | WO Total Cost Summary | P0 | 1 | Display total actual cost per work order |
| FR-9.3.5 | WO Cost Variance | P0 | 2 | Calculate variance vs standard cost |
| FR-9.3.6 | WO Unit Cost | P0 | 1 | Calculate cost per unit produced |
| FR-9.3.7 | WO Cost by Operation | P1 | 2 | Break down costs by routing operation |
| FR-9.3.8 | WO Scrap Cost Tracking | P1 | 2 | Track cost of scrapped materials |

### FR-9.4: Cost Variance Analysis

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.4.1 | Material Price Variance | P0 | 2 | Calculate variance due to material price changes |
| FR-9.4.2 | Material Usage Variance | P0 | 2 | Calculate variance due to usage differences |
| FR-9.4.3 | Labor Rate Variance | P0 | 2 | Calculate variance due to labor rate differences |
| FR-9.4.4 | Labor Efficiency Variance | P0 | 2 | Calculate variance due to efficiency differences |
| FR-9.4.5 | Overhead Variance | P1 | 3 | Calculate overhead spending and volume variance |
| FR-9.4.6 | Yield Variance | P1 | 2 | Calculate variance due to yield differences |
| FR-9.4.7 | Variance Root Cause | P2 | 3 | Link variances to root cause categories |
| FR-9.4.8 | Variance Approval | P2 | 3 | Approve/reject significant variances |

### FR-9.4-RT: Real-Time Cost Variance Analysis (Enhanced)

This section adds real-time variance reporting capabilities to address competitive gaps identified in the feature gap analysis. Competitors (3/4) offer real-time variance analysis; MonoPilot must match this capability.

#### FR-FIN-050: Real-Time Cost Variance Calculation

**Description**: Calculate and display planned vs actual cost variance per work order in real-time as production progresses, not just at work order completion.

**Priority**: P2 (Phase 2)

**Formula**:
```
Real-Time Variance = Actual Cost to Date - (Standard Cost per Unit x Units Completed to Date)
Projected Final Variance = Real-Time Variance + (Remaining Qty x Projected Unit Cost) - (Remaining Qty x Standard Unit Cost)
```

**Acceptance Criteria**:
- **Given** a work order is in progress with material consumption and labor time recorded
- **When** the user views the work order cost summary or variance dashboard
- **Then** the system displays:
  - Current actual cost accumulated
  - Standard cost for units completed
  - Current variance (amount and percentage)
  - Projected final variance based on current trend
  - Variance last updated timestamp (refreshed every 5 minutes or on transaction)

---

#### FR-FIN-051: Variance Threshold Alerts

**Description**: Generate automatic alerts when cost variance exceeds configurable percentage thresholds. Alerts notify relevant users (production supervisors, finance managers) to enable immediate corrective action.

**Priority**: P2 (Phase 2)

**Formula**:
```
Variance Percent = ((Actual Cost - Standard Cost) / Standard Cost) x 100
Alert Triggered = Variance Percent > Configured Threshold OR Variance Percent < -Configured Threshold
```

**Acceptance Criteria**:
- **Given** a variance threshold is configured per cost category (e.g., Material: 5%, Labor: 10%, Overhead: 15%)
- **When** the real-time variance for a work order exceeds any configured threshold
- **Then** the system:
  - Creates an alert notification for assigned users (configurable by role)
  - Displays alert on the finance dashboard and work order detail page
  - Sends email notification if email alerts are enabled for the user
  - Logs the alert with timestamp, work order ID, variance type, and variance amount
  - Allows users to acknowledge alerts with optional notes

- **Given** multiple thresholds are configured (warning at 5%, critical at 10%)
- **When** variance crosses each threshold
- **Then** appropriate severity level is assigned to the alert (warning, critical)

---

#### FR-FIN-052: Material Cost Variance Breakdown (Price vs Quantity)

**Description**: Decompose material cost variance into price variance and quantity (usage) variance components to identify whether variance is due to paying more for materials or using more materials than planned.

**Priority**: P2 (Phase 2)

**Formula**:
```
Material Price Variance (MPV) = (Actual Price - Standard Price) x Actual Quantity
Material Quantity Variance (MQV) = (Actual Quantity - Standard Quantity) x Standard Price
Total Material Variance = MPV + MQV

Where:
- Actual Price = Total Actual Material Cost / Actual Quantity Used
- Standard Price = Standard Cost per Unit from standard_costs table
- Actual Quantity = Sum of material_consumption_costs.quantity for the work order
- Standard Quantity = BOM quantity x Work Order planned quantity
```

**Acceptance Criteria**:
- **Given** a work order has consumed materials with recorded costs
- **When** the user views the material variance breakdown for that work order
- **Then** the system displays:
  - Material Price Variance: amount and percentage contribution
  - Material Quantity Variance: amount and percentage contribution
  - Total Material Variance: sum of both components
  - Breakdown per material item (each BOM component)
  - Visual indicator (favorable in green, unfavorable in red)

- **Given** the user drills down into a specific material variance
- **When** selecting a material item
- **Then** the system shows:
  - Standard price vs actual price paid
  - Standard quantity vs actual quantity used
  - Lot numbers consumed with individual costs

---

#### FR-FIN-053: Labor Cost Variance Breakdown (Rate vs Efficiency)

**Description**: Decompose labor cost variance into rate variance (paying more/less per hour) and efficiency variance (working more/fewer hours than standard) to identify root causes of labor cost deviations.

**Priority**: P2 (Phase 2)

**Formula**:
```
Labor Rate Variance (LRV) = (Actual Hourly Rate - Standard Hourly Rate) x Actual Hours
Labor Efficiency Variance (LEV) = (Actual Hours - Standard Hours) x Standard Hourly Rate
Total Labor Variance = LRV + LEV

Where:
- Actual Hourly Rate = Total Labor Cost / Total Actual Hours
- Standard Hourly Rate = Configured standard rate from standard_costs or cost_centers
- Actual Hours = Sum of labor_costs.hours_actual for the work order
- Standard Hours = Routing standard hours x Work Order planned quantity
```

**Acceptance Criteria**:
- **Given** a work order has recorded labor time and costs
- **When** the user views the labor variance breakdown for that work order
- **Then** the system displays:
  - Labor Rate Variance: amount, percentage, and direction (favorable/unfavorable)
  - Labor Efficiency Variance: amount, percentage, and direction
  - Total Labor Variance: sum of both components
  - Breakdown by operation (routing step)
  - Breakdown by worker (if tracked)

- **Given** the user analyzes labor efficiency variance
- **When** drilling down by operation
- **Then** the system shows:
  - Standard hours per operation vs actual hours
  - Variance per operation
  - Machine/line assignment for context

---

#### FR-FIN-054: Overhead Variance Allocation

**Description**: Calculate and allocate overhead variance showing spending variance (actual overhead vs budgeted) and volume variance (budgeted overhead vs applied overhead based on actual activity).

**Priority**: P2 (Phase 2)

**Formula**:
```
Overhead Spending Variance = Actual Overhead Incurred - Budgeted Overhead
Overhead Volume Variance = Budgeted Overhead - Applied Overhead
Total Overhead Variance = Spending Variance + Volume Variance

Applied Overhead = Overhead Rate x Actual Activity (labor hours, machine hours, or units)
Budgeted Overhead = Overhead Rate x Budgeted Activity
```

**Acceptance Criteria**:
- **Given** overhead rates are configured (by labor hours, machine hours, or units produced)
- **When** the user views overhead variance for a cost center or work order
- **Then** the system displays:
  - Actual overhead costs incurred
  - Budgeted overhead based on planned activity
  - Applied overhead based on actual activity
  - Spending variance (over/under budget)
  - Volume variance (activity level impact)
  - Total overhead variance

- **Given** multiple allocation bases exist (different cost centers use different bases)
- **When** calculating total overhead variance
- **Then** the system aggregates variances respecting each cost center's allocation method

---

#### FR-FIN-055: Variance Trend Dashboard

**Description**: Provide a dashboard view showing cost variance trends over configurable time periods (daily, weekly, monthly) to identify patterns and systemic issues.

**Priority**: P2 (Phase 2)

**Acceptance Criteria**:
- **Given** the user accesses the variance trend dashboard
- **When** selecting a time period (daily, weekly, monthly, custom date range)
- **Then** the system displays:
  - Line chart showing total variance trend over time
  - Stacked bar chart showing variance by category (material, labor, overhead)
  - Table of top 10 variance contributors (products, work orders, or cost centers)
  - Comparison to previous period (period-over-period change)
  - Moving average trend line (7-day or 4-week)

- **Given** variance data exists for the selected period
- **When** the user filters by:
  - Product or product family
  - Production line
  - Cost center
  - Variance type (material, labor, overhead)
- **Then** the dashboard updates to show filtered variance trends

- **Given** the user identifies a variance spike in the trend
- **When** clicking on a specific data point
- **Then** the system navigates to the detailed variance analysis for that period/entity

---

#### FR-FIN-056: Variance Drill-Down by Product/Line/Shift

**Description**: Enable multi-dimensional drill-down analysis of variances by product, production line, shift, and time period to identify specific sources of cost variances.

**Priority**: P2 (Phase 2)

**Acceptance Criteria**:
- **Given** the user is viewing variance summary data
- **When** drilling down by product
- **Then** the system shows:
  - Variance by product with ranking (highest to lowest)
  - Variance trend for selected product
  - Work orders contributing to product variance
  - BOM components contributing to material variance

- **Given** the user drills down by production line
- **When** selecting a specific line
- **Then** the system shows:
  - Variance by line with comparison to other lines
  - Line efficiency metrics affecting labor variance
  - Machine-specific overhead variances
  - Shift-level breakdown for selected line

- **Given** the user drills down by shift
- **When** selecting a specific shift (Day/Night/Weekend)
- **Then** the system shows:
  - Variance comparison across shifts
  - Labor rate variance by shift (overtime impact)
  - Efficiency variance by shift
  - Supervisor/team performance context

- **Given** any drill-down level
- **When** the user requests export
- **Then** the system exports the current view to CSV or Excel

---

#### FR-FIN-057: Margin Analysis per Product Family

**Description**: Calculate and display profit margin analysis grouped by product family/category, enabling strategic decisions about product mix profitability.

**Priority**: P2 (Phase 2)

**Formula**:
```
Gross Margin = Selling Price - Total Product Cost
Gross Margin % = (Gross Margin / Selling Price) x 100
Contribution Margin = Selling Price - Variable Costs
Contribution Margin % = (Contribution Margin / Selling Price) x 100

Family Margin = Sum of (Product Margin x Units Sold) for all products in family
Family Margin % = Family Margin / Family Revenue
```

**Acceptance Criteria**:
- **Given** products are assigned to product families/categories
- **When** the user views the margin analysis by product family
- **Then** the system displays:
  - Product family list with total revenue, total cost, and margin
  - Gross margin amount and percentage per family
  - Contribution margin per family (if variable/fixed cost split is configured)
  - Comparison to target margin per family
  - Trend of margin over selected period

- **Given** the user selects a product family
- **When** drilling down to individual products
- **Then** the system shows:
  - Product-level margin ranking within family
  - Products below target margin (highlighted)
  - Variance impact on margin (cost variance reducing margin)
  - Price vs cost contribution to margin change

- **Given** margin targets are defined per product family
- **When** actual margin falls below target
- **Then** the system:
  - Highlights the family/product in the report
  - Shows deviation from target (amount and percentage)
  - Links to variance analysis for cost investigation

---

#### FR-FIN-058: Cost Variance Export to Comarch

**Description**: Export cost variance data in Comarch Optima compatible format for integration with external accounting system, enabling variance tracking and GL posting in the ERP.

**Priority**: P2 (Phase 2)

**Acceptance Criteria**:
- **Given** variance data exists for a selected period
- **When** the user initiates a Comarch export for variances
- **Then** the system generates an export file containing:
  - Document type: "Variance Adjustment"
  - Document number: Auto-generated (VAR-YYYYMM-XXXX)
  - Document date: Export date
  - Work order reference
  - Variance type (MPV, MQV, LRV, LEV, OHV)
  - GL account code (from gl_account_mappings for variance accounts)
  - Debit amount (unfavorable variance)
  - Credit amount (favorable variance)
  - Cost center code
  - Description: "Variance - [Type] - WO [Number] - [Product]"
  - Currency code
  - Exchange rate (if applicable)

- **Given** GL account mappings exist for variance accounts:
  - Material Price Variance account
  - Material Usage Variance account
  - Labor Rate Variance account
  - Labor Efficiency Variance account
  - Overhead Variance account
- **When** variance export is generated
- **Then** variances are mapped to correct GL accounts

- **Given** the export is generated
- **When** export completes
- **Then** the system:
  - Creates export record in finance_exports table
  - Logs export details (record count, total amounts, user, timestamp)
  - Provides download link for the export file
  - Marks exported variances as "exported" to prevent duplicate exports

- **Given** the user needs to re-export variances
- **When** selecting previously exported variances
- **Then** the system warns about potential duplicates and requires confirmation

---

### Database Schema Additions for Real-Time Variance

#### variance_thresholds
- `id` (PK)
- `org_id` (FK)
- `cost_category` - Category (material, labor, overhead, total)
- `warning_threshold_percent` - Warning level (e.g., 5%)
- `critical_threshold_percent` - Critical level (e.g., 10%)
- `is_active` - Active status
- `notify_roles` - Array of roles to notify
- `notify_email` - Send email notifications flag
- `created_at`, `updated_at`

#### variance_alerts
- `id` (PK)
- `org_id` (FK)
- `work_order_id` (FK)
- `variance_type` - Type (material_price, material_usage, labor_rate, labor_efficiency, overhead)
- `severity` - Severity (warning, critical)
- `variance_amount` - Variance amount
- `variance_percent` - Variance percentage
- `threshold_id` (FK variance_thresholds)
- `status` - Status (active, acknowledged, resolved)
- `acknowledged_by` (FK users)
- `acknowledged_at` - Acknowledgment timestamp
- `acknowledged_notes` - Notes from acknowledgment
- `created_at`, `updated_at`

#### variance_exports
- `id` (PK)
- `org_id` (FK)
- `export_id` (FK finance_exports)
- `variance_id` (FK cost_variances)
- `gl_account_code` - GL account used
- `amount` - Amount exported
- `exported_at` - Export timestamp

---

### API Endpoints for Real-Time Variance

#### Variance Thresholds
- `GET /api/finance/variance-thresholds` - List variance thresholds
- `POST /api/finance/variance-thresholds` - Create threshold
- `PATCH /api/finance/variance-thresholds/:id` - Update threshold
- `DELETE /api/finance/variance-thresholds/:id` - Delete threshold

#### Variance Alerts
- `GET /api/finance/variance-alerts` - List active alerts
- `GET /api/finance/variance-alerts/:id` - Get alert details
- `POST /api/finance/variance-alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/finance/variance-alerts/:id/resolve` - Resolve alert
- `GET /api/finance/variance-alerts/summary` - Get alert summary counts

#### Real-Time Variance
- `GET /api/finance/work-order-costs/:workOrderId/realtime` - Get real-time variance
- `GET /api/finance/work-order-costs/:workOrderId/material-breakdown` - Material variance breakdown
- `GET /api/finance/work-order-costs/:workOrderId/labor-breakdown` - Labor variance breakdown
- `GET /api/finance/work-order-costs/:workOrderId/overhead-breakdown` - Overhead variance breakdown

#### Variance Trends
- `GET /api/finance/reports/variance-trends` - Get variance trend data
- `GET /api/finance/reports/variance-by-product` - Variance by product
- `GET /api/finance/reports/variance-by-line` - Variance by production line
- `GET /api/finance/reports/variance-by-shift` - Variance by shift

#### Margin Analysis
- `GET /api/finance/reports/margin-by-family` - Margin by product family
- `GET /api/finance/reports/margin-trends-by-family` - Margin trends by family

#### Comarch Export
- `POST /api/finance/exports/comarch/variances` - Export variances to Comarch format

---

### FR-9.5: Inventory Valuation

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.5.1 | FIFO Valuation | P0 | 1 | Value inventory using FIFO method |
| FR-9.5.2 | Weighted Average Valuation | P0 | 1 | Value inventory using weighted average |
| FR-9.5.3 | Standard Cost Valuation | P1 | 2 | Value inventory at standard cost |
| FR-9.5.4 | Inventory Value Report | P0 | 1 | Generate inventory valuation reports |
| FR-9.5.5 | Inventory Aging by Value | P1 | 2 | Show inventory value by age category |
| FR-9.5.6 | Revaluation Processing | P2 | 3 | Process inventory revaluations |
| FR-9.5.7 | Cost Layer Tracking | P1 | 2 | Track individual cost layers (FIFO) |

### FR-9.6: Cost Reporting

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.6.1 | Cost by Product Report | P0 | 1 | Report costs grouped by product |
| FR-9.6.2 | Cost by Period Report | P0 | 1 | Report costs by time period |
| FR-9.6.3 | Cost by Production Line | P0 | 2 | Report costs by production line |
| FR-9.6.4 | Cost by Cost Center | P1 | 2 | Report costs by cost center |
| FR-9.6.5 | Cost Trend Analysis | P1 | 2 | Visualize cost trends over time |
| FR-9.6.6 | Cost Breakdown Detail | P1 | 2 | Drill down to transaction detail |
| FR-9.6.7 | Cost Dashboard | P0 | 1 | Display key cost metrics and KPIs |
| FR-9.6.8 | Custom Cost Reports | P2 | 3 | Build custom cost reports |

### FR-9.7: Margin Analysis

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.7.1 | Product Margin Calculation | P0 | 2 | Calculate margin (selling price - cost) |
| FR-9.7.2 | Margin by Product Report | P0 | 2 | Report margins grouped by product |
| FR-9.7.3 | Margin by Customer | P1 | 3 | Report margins by customer segment |
| FR-9.7.4 | Margin Trend Analysis | P1 | 3 | Track margin trends over time |
| FR-9.7.5 | Target Margin Setting | P1 | 3 | Define target margins by product |
| FR-9.7.6 | Margin Alert Notifications | P2 | 3 | Alert when margins fall below targets |
| FR-9.7.7 | Contribution Margin | P2 | 3 | Calculate contribution margin (exclude fixed) |

### FR-9.8: Currency Management

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.8.1 | Multi-Currency Support | P0 | 1 | Support multiple currencies for costs |
| FR-9.8.2 | PLN Default Currency | P0 | 1 | Set PLN as default base currency |
| FR-9.8.3 | Currency CRUD | P0 | 1 | Create, read, update, delete currencies |
| FR-9.8.4 | Exchange Rate Management | P0 | 1 | Manage exchange rates with effective dates |
| FR-9.8.5 | Currency Conversion | P0 | 1 | Convert amounts between currencies |
| FR-9.8.6 | Historical Exchange Rates | P1 | 2 | Store and use historical exchange rates |
| FR-9.8.7 | Exchange Rate API | P2 | 3 | Import exchange rates from external API |

### FR-9.9: Tax Code Management

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.9.1 | Polish VAT Rates | P0 | 1 | Support Polish VAT rates (23%, 8%, 5%, 0%) |
| FR-9.9.2 | Tax Code CRUD | P0 | 1 | Create, read, update, delete tax codes |
| FR-9.9.3 | Tax Code Assignment | P0 | 1 | Assign tax codes to products/materials |
| FR-9.9.4 | Tax Rate History | P1 | 2 | Track historical tax rate changes |
| FR-9.9.5 | Tax Calculation | P1 | 2 | Calculate tax amounts on transactions |
| FR-9.9.6 | Tax Reporting | P1 | 3 | Generate tax summary reports |

### FR-9.10: Cost Center Management

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.10.1 | Cost Center CRUD | P0 | 1 | Create, read, update, delete cost centers |
| FR-9.10.2 | Cost Center Hierarchy | P1 | 2 | Define hierarchical cost center structure |
| FR-9.10.3 | Cost Center Assignment | P0 | 1 | Assign cost centers to resources |
| FR-9.10.4 | Cost Center Allocation | P1 | 2 | Allocate costs to cost centers |
| FR-9.10.5 | Cost Center Budget | P1 | 2 | Define budgets by cost center |
| FR-9.10.6 | Cost Center Reporting | P0 | 2 | Report actual costs by cost center |

### FR-9.11: Budget Management

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.11.1 | Budget Definition | P1 | 2 | Define budgets by cost center and period |
| FR-9.11.2 | Budget vs Actual Report | P1 | 2 | Compare actual costs to budget |
| FR-9.11.3 | Budget Variance Analysis | P1 | 3 | Analyze budget variance reasons |
| FR-9.11.4 | Budget Approval | P2 | 3 | Workflow for budget approval |
| FR-9.11.5 | Budget Forecasting | P2 | 3 | Forecast budget needs based on trends |
| FR-9.11.6 | Budget Alerts | P2 | 3 | Alert when approaching budget limits |

### FR-9.12: Accounting Integration

| FR ID | Requirement Name | Priority | Phase | Description |
|-------|------------------|----------|-------|-------------|
| FR-9.12.1 | Export to CSV | P0 | 1 | Export financial data to CSV format |
| FR-9.12.2 | Export to XML | P0 | 1 | Export financial data to XML format |
| FR-9.12.3 | Comarch Optima Format | P0 | 2 | Export in Comarch Optima import format |
| FR-9.12.4 | Export Configuration | P1 | 2 | Configure field mappings for export |
| FR-9.12.5 | Scheduled Exports | P1 | 3 | Schedule automatic exports |
| FR-9.12.6 | Export Audit Log | P1 | 2 | Log all export activities |
| FR-9.12.7 | GL Account Mapping | P1 | 2 | Map cost categories to GL accounts |

## Database Schema

### Core Tables

#### currencies
- `id` (PK)
- `org_id` (FK) - Multi-tenant isolation
- `code` - Currency code (PLN, EUR, USD)
- `name` - Currency name
- `symbol` - Currency symbol
- `is_base` - Is base currency flag
- `is_active` - Active status
- `exchange_rate` - Current exchange rate to base
- `created_at`, `updated_at`

#### exchange_rates
- `id` (PK)
- `org_id` (FK)
- `currency_id` (FK)
- `effective_date` - Rate effective date
- `rate` - Exchange rate to base currency
- `source` - Rate source (manual, API)
- `created_at`

#### tax_codes
- `id` (PK)
- `org_id` (FK)
- `code` - Tax code identifier
- `name` - Tax code name
- `rate_percent` - Tax rate percentage
- `country_code` - Country code (PL)
- `category` - Tax category (VAT, exempt)
- `effective_from` - Effective start date
- `effective_to` - Effective end date
- `is_active` - Active status
- `created_at`, `updated_at`

#### cost_centers
- `id` (PK)
- `org_id` (FK)
- `code` - Cost center code
- `name` - Cost center name
- `description` - Description
- `parent_id` (FK) - Parent cost center for hierarchy
- `type` - Type (production, overhead, admin)
- `production_line_id` (FK) - Link to production line
- `department` - Department name
- `is_active` - Active status
- `created_at`, `updated_at`

#### cost_center_budgets
- `id` (PK)
- `org_id` (FK)
- `cost_center_id` (FK)
- `period_start` - Budget period start
- `period_end` - Budget period end
- `budget_amount` - Budgeted amount
- `currency_id` (FK)
- `category` - Budget category (material, labor, overhead)
- `status` - Status (draft, approved, active)
- `approved_by` (FK users)
- `approved_at` - Approval timestamp
- `created_at`, `updated_at`

#### standard_costs
- `id` (PK)
- `org_id` (FK)
- `item_id` (FK products) - Product or material
- `item_type` - Type (product, material)
- `effective_from` - Effective start date
- `effective_to` - Effective end date
- `material_cost` - Standard material cost
- `labor_cost` - Standard labor cost
- `overhead_cost` - Standard overhead cost
- `total_cost` - Total standard cost
- `currency_id` (FK)
- `uom` - Unit of measure
- `cost_basis` - Cost basis (per unit, per batch)
- `status` - Status (draft, approved, active)
- `approved_by` (FK users)
- `approved_at` - Approval timestamp
- `created_at`, `updated_at`

#### cost_rollups
- `id` (PK)
- `org_id` (FK)
- `product_id` (FK)
- `bom_id` (FK)
- `effective_date` - Calculation effective date
- `level` - BOM level (0 = finished good)
- `material_cost` - Rolled up material cost
- `labor_cost` - Rolled up labor cost
- `overhead_cost` - Rolled up overhead cost
- `total_cost` - Total rolled up cost
- `currency_id` (FK)
- `calculation_method` - Method (standard, average, FIFO)
- `created_at`

#### work_order_costs
- `id` (PK)
- `org_id` (FK)
- `work_order_id` (FK)
- `material_cost_actual` - Actual material cost
- `material_cost_standard` - Standard material cost
- `material_variance` - Material variance
- `labor_cost_actual` - Actual labor cost
- `labor_cost_standard` - Standard labor cost
- `labor_variance` - Labor variance
- `overhead_cost_actual` - Actual overhead cost
- `overhead_cost_standard` - Standard overhead cost
- `overhead_variance` - Overhead variance
- `total_cost_actual` - Total actual cost
- `total_cost_standard` - Total standard cost
- `total_variance` - Total variance
- `quantity_produced` - Units produced
- `unit_cost_actual` - Actual cost per unit
- `unit_cost_standard` - Standard cost per unit
- `currency_id` (FK)
- `cost_center_id` (FK)
- `costing_date` - Date costs calculated
- `status` - Status (pending, calculated, approved)
- `created_at`, `updated_at`

#### material_consumption_costs
- `id` (PK)
- `org_id` (FK)
- `consumption_id` (FK material_consumption)
- `work_order_id` (FK)
- `product_id` (FK) - Material consumed
- `quantity` - Quantity consumed
- `uom` - Unit of measure
- `unit_cost` - Cost per unit
- `total_cost` - Total cost
- `currency_id` (FK)
- `cost_method` - Costing method (FIFO, average)
- `cost_center_id` (FK)
- `transaction_date` - Transaction date
- `created_at`

#### labor_costs
- `id` (PK)
- `org_id` (FK)
- `work_order_id` (FK)
- `operation_id` (FK) - Routing operation
- `user_id` (FK) - Worker
- `hours_actual` - Actual hours worked
- `hours_standard` - Standard hours
- `hourly_rate` - Labor rate per hour
- `total_cost` - Total labor cost
- `currency_id` (FK)
- `cost_center_id` (FK)
- `transaction_date` - Transaction date
- `created_at`

#### overhead_allocations
- `id` (PK)
- `org_id` (FK)
- `work_order_id` (FK)
- `cost_center_id` (FK)
- `allocation_basis` - Basis (labor hours, machine hours, units)
- `basis_quantity` - Quantity of basis
- `rate` - Overhead rate
- `total_cost` - Total overhead allocated
- `currency_id` (FK)
- `allocation_date` - Date allocated
- `created_at`

#### cost_variances
- `id` (PK)
- `org_id` (FK)
- `work_order_id` (FK)
- `variance_type` - Type (material_price, material_usage, labor_rate, labor_efficiency, overhead, yield)
- `variance_amount` - Variance amount (positive = unfavorable)
- `currency_id` (FK)
- `standard_amount` - Standard amount
- `actual_amount` - Actual amount
- `variance_percent` - Variance percentage
- `root_cause_category` - Root cause category
- `notes` - Variance notes
- `status` - Status (identified, under_review, approved, rejected)
- `reviewed_by` (FK users)
- `reviewed_at` - Review timestamp
- `created_at`, `updated_at`

#### inventory_cost_layers
- `id` (PK)
- `org_id` (FK)
- `product_id` (FK)
- `location_id` (FK)
- `lot_number` - Lot number
- `quantity_received` - Original quantity
- `quantity_remaining` - Remaining quantity
- `unit_cost` - Cost per unit
- `total_cost` - Total cost of layer
- `currency_id` (FK)
- `receipt_date` - Receipt date
- `valuation_method` - Method (FIFO, average)
- `created_at`, `updated_at`

#### product_margins
- `id` (PK)
- `org_id` (FK)
- `product_id` (FK)
- `effective_date` - Effective date
- `selling_price` - Selling price
- `total_cost` - Total product cost
- `margin_amount` - Margin amount
- `margin_percent` - Margin percentage
- `target_margin_percent` - Target margin
- `currency_id` (FK)
- `created_at`, `updated_at`

#### gl_account_mappings
- `id` (PK)
- `org_id` (FK)
- `cost_category` - Cost category (material, labor, overhead)
- `cost_subcategory` - Subcategory
- `gl_account_code` - External GL account code
- `gl_account_name` - External GL account name
- `is_active` - Active status
- `created_at`, `updated_at`

#### finance_exports
- `id` (PK)
- `org_id` (FK)
- `export_type` - Type (csv, xml, comarch_optima)
- `period_start` - Export period start
- `period_end` - Export period end
- `file_name` - Generated file name
- `file_path` - File storage path
- `record_count` - Number of records exported
- `status` - Status (pending, completed, failed)
- `exported_by` (FK users)
- `exported_at` - Export timestamp
- `created_at`

## API Endpoints

### Currency Management
- `GET /api/finance/currencies` - List currencies
- `GET /api/finance/currencies/:id` - Get currency details
- `POST /api/finance/currencies` - Create currency
- `PATCH /api/finance/currencies/:id` - Update currency
- `DELETE /api/finance/currencies/:id` - Delete currency
- `GET /api/finance/currencies/:id/exchange-rates` - Get exchange rate history
- `POST /api/finance/currencies/:id/exchange-rates` - Add exchange rate

### Tax Code Management
- `GET /api/finance/tax-codes` - List tax codes
- `GET /api/finance/tax-codes/:id` - Get tax code details
- `POST /api/finance/tax-codes` - Create tax code
- `PATCH /api/finance/tax-codes/:id` - Update tax code
- `DELETE /api/finance/tax-codes/:id` - Delete tax code

### Cost Center Management
- `GET /api/finance/cost-centers` - List cost centers
- `GET /api/finance/cost-centers/:id` - Get cost center details
- `POST /api/finance/cost-centers` - Create cost center
- `PATCH /api/finance/cost-centers/:id` - Update cost center
- `DELETE /api/finance/cost-centers/:id` - Delete cost center
- `GET /api/finance/cost-centers/:id/budgets` - Get cost center budgets
- `POST /api/finance/cost-centers/:id/budgets` - Create budget
- `GET /api/finance/cost-centers/:id/actuals` - Get actual costs

### Standard Cost Management
- `GET /api/finance/standard-costs` - List standard costs
- `GET /api/finance/standard-costs/:id` - Get standard cost details
- `POST /api/finance/standard-costs` - Create standard cost
- `PATCH /api/finance/standard-costs/:id` - Update standard cost
- `POST /api/finance/standard-costs/:id/approve` - Approve standard cost
- `GET /api/finance/standard-costs/by-product/:productId` - Get product standard costs

### BOM/Recipe Costing
- `GET /api/finance/bom-costs/:bomId` - Get BOM cost breakdown
- `POST /api/finance/bom-costs/:bomId/calculate` - Calculate BOM costs
- `POST /api/finance/bom-costs/:bomId/simulate` - Simulate BOM cost changes
- `GET /api/finance/bom-costs/compare` - Compare BOM versions

### Work Order Costing
- `GET /api/finance/work-order-costs/:workOrderId` - Get WO cost summary
- `POST /api/finance/work-order-costs/:workOrderId/calculate` - Calculate WO costs
- `GET /api/finance/work-order-costs/:workOrderId/material` - Get material costs
- `GET /api/finance/work-order-costs/:workOrderId/labor` - Get labor costs
- `GET /api/finance/work-order-costs/:workOrderId/overhead` - Get overhead costs
- `GET /api/finance/work-order-costs/:workOrderId/variances` - Get cost variances

### Cost Variance Management
- `GET /api/finance/variances` - List cost variances
- `GET /api/finance/variances/:id` - Get variance details
- `PATCH /api/finance/variances/:id` - Update variance (notes, root cause)
- `POST /api/finance/variances/:id/approve` - Approve variance
- `POST /api/finance/variances/:id/reject` - Reject variance

### Inventory Valuation
- `GET /api/finance/inventory-valuation` - Get inventory valuation summary
- `GET /api/finance/inventory-valuation/:productId` - Get product valuation
- `POST /api/finance/inventory-valuation/calculate` - Calculate inventory value
- `GET /api/finance/inventory-valuation/cost-layers` - Get FIFO cost layers

### Cost Reporting
- `GET /api/finance/reports/cost-by-product` - Cost by product report
- `GET /api/finance/reports/cost-by-period` - Cost by period report
- `GET /api/finance/reports/cost-by-line` - Cost by production line
- `GET /api/finance/reports/cost-by-center` - Cost by cost center
- `GET /api/finance/reports/cost-trends` - Cost trend analysis
- `GET /api/finance/reports/budget-vs-actual` - Budget vs actual report

### Margin Analysis
- `GET /api/finance/margins` - List product margins
- `GET /api/finance/margins/:productId` - Get product margin details
- `POST /api/finance/margins/:productId/calculate` - Calculate margin
- `GET /api/finance/reports/margin-by-product` - Margin by product report
- `GET /api/finance/reports/margin-trends` - Margin trend analysis

### Accounting Integration
- `GET /api/finance/gl-mappings` - List GL account mappings
- `POST /api/finance/gl-mappings` - Create GL mapping
- `PATCH /api/finance/gl-mappings/:id` - Update GL mapping
- `POST /api/finance/exports/csv` - Export to CSV
- `POST /api/finance/exports/xml` - Export to XML
- `POST /api/finance/exports/comarch` - Export to Comarch Optima format
- `GET /api/finance/exports` - List export history
- `GET /api/finance/exports/:id/download` - Download export file

### Dashboard
- `GET /api/finance/dashboard/kpis` - Get finance KPIs
- `GET /api/finance/dashboard/recent-variances` - Get recent variances
- `GET /api/finance/dashboard/cost-trends` - Get cost trend data

## User Interface

### Page Structure

```
/finance
  /dashboard                    - Finance KPI dashboard
  /costs
    /standard                   - Standard cost management
    /work-orders               - Work order cost tracking
    /variances                 - Cost variance analysis
  /inventory-valuation         - Inventory valuation reports
  /margins                     - Margin analysis
  /cost-centers               - Cost center management
  /budgets                    - Budget management
  /reports
    /cost-by-product          - Cost by product report
    /cost-by-period           - Cost by period report
    /cost-by-line             - Cost by production line
    /budget-vs-actual         - Budget variance report
    /variance-trends          - Variance trend dashboard (NEW)
    /margin-by-family         - Margin by product family (NEW)
  /settings
    /currencies               - Currency management
    /exchange-rates           - Exchange rate management
    /tax-codes                - Tax code configuration
    /gl-mappings              - GL account mappings
    /variance-thresholds      - Variance alert thresholds (NEW)
  /exports
    /history                  - Export history
    /configure                - Export configuration
  /alerts                     - Variance alerts (NEW)
```

### Key Components

**Finance Dashboard**
- Total production costs (current period)
- Cost variance summary (favorable/unfavorable)
- Inventory valuation total
- Top cost variances (requires attention)
- Cost trends chart (6-month view)
- Budget vs actual summary
- Margin trends chart
- **Real-time variance alerts panel** (NEW)
- **Active alerts count badge** (NEW)

**Standard Cost Form**
- Product/material selector
- Effective date range
- Cost breakdown (material, labor, overhead)
- Currency selector
- Cost basis selector (per unit, per batch)
- Approval workflow status

**Work Order Cost Summary**
- Actual vs standard cost comparison
- Cost breakdown by category
- Variance analysis with color coding
- Drill-down to transaction detail
- Unit cost calculation
- Export to CSV/Excel
- **Real-time variance indicator** (NEW)
- **Material price vs quantity breakdown** (NEW)
- **Labor rate vs efficiency breakdown** (NEW)

**Cost Variance Analysis**
- Variance type filter
- Variance amount threshold filter
- Root cause category assignment
- Approval workflow actions
- Variance trend visualization
- Export capabilities

**Variance Trend Dashboard (NEW)**
- Period selector (daily/weekly/monthly)
- Line chart with variance trends
- Stacked bar chart by category
- Top variance contributors table
- Drill-down navigation
- Filter by product/line/cost center

**Inventory Valuation Report**
- Valuation method selector (FIFO, average)
- Location filter
- Product category filter
- Aging analysis
- Cost layer detail (FIFO)
- Export to CSV/Excel

**Margin Analysis**
- Product selector
- Date range filter
- Margin calculation (amount and %)
- Target margin comparison
- Trend visualization
- Alert indicators for below-target margins

**Margin by Product Family (NEW)**
- Product family grouping
- Gross margin by family
- Contribution margin by family
- Target vs actual comparison
- Drill-down to product level

**Budget vs Actual Report**
- Cost center selector
- Period selector
- Variance analysis
- Drill-down to detail
- Forecast projection
- Export capabilities

**Variance Threshold Settings (NEW)**
- Threshold configuration per category
- Warning and critical levels
- Role assignment for notifications
- Email notification toggle
- Active/inactive status

**Variance Alerts Panel (NEW)**
- List of active alerts
- Severity indicators (warning/critical)
- Acknowledge action
- Navigate to work order
- Filter by status/severity

## Business Logic

### Cost Calculation Rules

**Material Cost Tracking**
1. Capture material cost at consumption time
2. Use valuation method (FIFO or weighted average)
3. Convert to base currency if needed
4. Allocate to work order and cost center
5. Calculate variance vs standard cost

**Labor Cost Tracking**
1. Track actual hours per operation
2. Apply hourly labor rate
3. Convert to base currency if needed
4. Allocate to work order and cost center
5. Calculate efficiency variance vs standard

**Overhead Allocation**
1. Select allocation basis (labor hours, machine hours, units)
2. Calculate overhead rate
3. Apply rate to actual basis quantity
4. Allocate to work order and cost center
5. Calculate variance vs standard

**BOM Cost Rollup**
1. Start at lowest BOM level
2. Sum ingredient costs (quantity x unit cost)
3. Add packaging costs
4. Roll up through multi-level BOMs
5. Add labor and overhead from routing
6. Store cost rollup with effective date

**Inventory Valuation - FIFO**
1. Track cost layers by receipt date
2. Consume oldest layers first
3. Calculate average cost when layer partially consumed
4. Maintain remaining quantity per layer
5. Sum all layer values for total inventory value

**Inventory Valuation - Weighted Average**
1. Calculate total value / total quantity
2. Update average cost on each receipt
3. Use average cost for all issues
4. Recalculate on inventory revaluation

**Variance Calculation**
1. Material Price Variance = (Actual Price - Standard Price) x Actual Quantity
2. Material Usage Variance = (Actual Quantity - Standard Quantity) x Standard Price
3. Labor Rate Variance = (Actual Rate - Standard Rate) x Actual Hours
4. Labor Efficiency Variance = (Actual Hours - Standard Hours) x Standard Rate
5. Yield Variance = (Actual Yield - Standard Yield) x Standard Cost

**Real-Time Variance Calculation (NEW)**
1. Calculate variance on each consumption/labor transaction
2. Update work_order_costs record in real-time
3. Check variance against thresholds
4. Generate alerts if thresholds exceeded
5. Refresh dashboard data every 5 minutes or on transaction

### Integration Points

**With Production Module**
- Consume material costs from material consumption transactions
- Calculate labor costs from operation time tracking
- Link costs to work orders
- Track scrap costs from scrap transactions
- **Trigger real-time variance calculation on production events** (NEW)

**With Warehouse Module**
- Use inventory levels for valuation
- Track cost layers for FIFO
- Update costs on inventory moves
- Calculate revaluation adjustments

**With Technical Module**
- Use BOM structure for cost rollup
- Use routing for labor/overhead standards
- Track cost by product version
- **Use product family for margin grouping** (NEW)

**With Planning Module**
- Use production plans for budget forecasting
- Link costs to production schedules

**With External ERP (Comarch Optima)**
- Export cost transactions (CSV/XML)
- Map cost categories to GL accounts
- Export inventory valuations
- Export variance transactions
- **Export variance breakdown by type to separate GL accounts** (NEW)

## Phase Roadmap

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Basic cost tracking and reporting

**Deliverables**:
- Currency and tax code management
- Cost center management
- Standard cost definition
- Material cost tracking (consumption-based)
- Labor cost tracking (operation-based)
- Work order cost summary
- Basic cost reports (by product, by period)
- Finance dashboard with key KPIs
- CSV export capability

**Stories**: 9.1-9.8

### Phase 2: Advanced Costing (Weeks 5-8)
**Goal**: Variance analysis and cost optimization

**Deliverables**:
- Overhead allocation
- Cost variance analysis (all types)
- BOM cost rollup
- BOM cost simulation
- Inventory valuation (FIFO, weighted average)
- Cost by production line report
- Cost by cost center report
- Budget definition and tracking
- Budget vs actual reporting
- XML export capability
- Comarch Optima export format
- GL account mapping
- **Real-time variance calculation (FR-FIN-050)** (NEW)
- **Variance threshold alerts (FR-FIN-051)** (NEW)
- **Material variance breakdown (FR-FIN-052)** (NEW)
- **Labor variance breakdown (FR-FIN-053)** (NEW)
- **Overhead variance allocation (FR-FIN-054)** (NEW)
- **Variance trend dashboard (FR-FIN-055)** (NEW)
- **Variance drill-down (FR-FIN-056)** (NEW)
- **Margin by product family (FR-FIN-057)** (NEW)
- **Variance export to Comarch (FR-FIN-058)** (NEW)

**Stories**: 9.9-9.18, FR-FIN-050 to FR-FIN-058

### Phase 3: Margin & Analytics (Weeks 9-12)
**Goal**: Profitability analysis and predictive insights

**Deliverables**:
- Margin calculation and analysis
- Margin by product reporting
- Margin trend analysis
- Cost trend analysis and visualization
- Multi-level BOM cost rollup
- Yield variance analysis
- Budget forecasting
- Scheduled exports
- Custom cost reports
- Root cause analysis for variances
- Variance approval workflow
- Cost update approval workflow
- Margin alert notifications

**Stories**: 9.19-9.26

## Success Metrics

### Operational Metrics
- Cost variance within +/-5% of standard
- Inventory valuation accuracy >98%
- Cost data entry lag <24 hours
- Report generation time <5 seconds
- Export success rate >99%
- **Real-time variance refresh <30 seconds** (NEW)
- **Alert notification delivery <1 minute** (NEW)

### Business Metrics
- Cost visibility across all production
- Variance investigation time reduced 60%
- Month-end close time reduced 40%
- Manual cost calculations eliminated
- Accounting integration errors <1%
- **Variance alerts acknowledged within 4 hours** (NEW)
- **Cost overruns identified same-day** (NEW)

### User Adoption
- 90% of users access finance dashboard weekly
- 80% of variances reviewed within 48 hours
- 100% of work orders costed within 24 hours of completion
- 95% user satisfaction with cost reports
- **70% of variance alerts acknowledged within 2 hours** (NEW)

## Technical Considerations

### Performance
- Cost calculations execute in background jobs
- Cache frequently accessed standard costs
- Index on work_order_id, product_id, cost_center_id
- Partition large tables by date (monthly)
- Pre-aggregate cost summaries for reporting
- **Real-time variance calculation via database triggers** (NEW)
- **WebSocket updates for dashboard refresh** (NEW)

### Security
- RLS enforcement on all finance tables
- Role-based access (admin, finance_manager, finance_viewer)
- Audit log for cost changes and approvals
- Encryption for export files
- Restricted access to standard cost approval

### Data Quality
- Validate currency codes against ISO 4217
- Validate tax rates (0-100%)
- Prevent backdated cost changes without approval
- Validate exchange rates (must be > 0)
- Enforce effective date ranges (no overlaps)

### Scalability
- Support 100K+ cost transactions per month
- Support 10K+ products with standard costs
- Support 1K+ cost centers
- Handle multi-year historical data
- Support 50+ concurrent users
- **Handle real-time updates for 100+ concurrent work orders** (NEW)

## Dependencies

### Module Dependencies
- **Production Module**: Work order data, consumption transactions, operation time tracking
- **Warehouse Module**: Inventory levels, lot tracking, material receipts
- **Technical Module**: BOM structure, routing operations, product definitions, product families
- **Settings Module**: Organization configuration, user roles, system settings

### External Dependencies
- Comarch Optima (or other ERP) for full accounting
- Exchange rate API (optional, for automatic rate updates)
- PDF generation library for report exports
- Excel export library for detailed reports

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incorrect cost calculations | High | Comprehensive testing, validation rules, audit logs |
| Data sync issues with ERP | Medium | Robust export validation, error handling, retry logic |
| Performance issues with large datasets | Medium | Background jobs, caching, data partitioning |
| Currency conversion errors | High | Validation rules, historical rate tracking, manual review |
| User adoption resistance | Medium | Training, intuitive UI, gradual rollout |
| Variance analysis complexity | Medium | Clear documentation, examples, wizard interface |
| **Real-time calculation load** | Medium | **Database triggers, async processing, caching** (NEW) |
| **Alert fatigue** | Medium | **Configurable thresholds, alert batching, severity levels** (NEW) |

## Future Enhancements (Post-Epic 9)

- Activity-based costing (ABC)
- Real-time cost tracking dashboard
- Predictive cost modeling (ML-based)
- Cost optimization recommendations
- Multi-site cost consolidation
- Transfer pricing between sites
- Landed cost calculation
- Project-based costing
- Customer-specific costing
- Cost allocation to sales orders
- Integration with BI tools (Power BI, Tableau)

## Appendix

### Polish VAT Rates (2024)
- Standard Rate: 23%
- Reduced Rate 1: 8% (most food products)
- Reduced Rate 2: 5% (specific food items)
- Zero Rate: 0% (exports, intra-EU)
- Exempt: N/A (certain categories)

### Comarch Optima Integration
Export format must include:
- Document type
- Document number
- Document date
- Cost center code
- GL account code
- Debit/credit amounts
- Description
- Currency code
- Exchange rate

### Cost Calculation Example

**Product**: Chocolate Bar (100g)

**Standard Costs**:
- Materials: 2.50 PLN (cocoa, sugar, milk)
- Packaging: 0.50 PLN
- Labor: 0.40 PLN (5 min @ 4.80 PLN/hr)
- Overhead: 0.60 PLN (150% of labor)
- **Total Standard: 4.00 PLN**

**Actual Costs (Work Order #12345)**:
- Materials: 2.65 PLN (actual consumption)
- Packaging: 0.50 PLN
- Labor: 0.48 PLN (6 min @ 4.80 PLN/hr)
- Overhead: 0.72 PLN (150% of actual labor)
- **Total Actual: 4.35 PLN**

**Variances**:
- Material Variance: 0.15 PLN unfavorable (6% over)
- Labor Variance: 0.08 PLN unfavorable (20% over)
- Overhead Variance: 0.12 PLN unfavorable (follows labor)
- **Total Variance: 0.35 PLN unfavorable (8.75% over)**

### Variance Breakdown Example (NEW)

**Material Variance Breakdown (FR-FIN-052)**:
- Standard Price: 2.50 PLN / 100g
- Actual Price: 2.55 PLN / 100g (supplier price increase)
- Standard Quantity: 100g
- Actual Quantity: 104g (overpour)

Calculations:
- Material Price Variance = (2.55 - 2.50) x 104g = 0.052 PLN unfavorable
- Material Quantity Variance = (104g - 100g) x 2.50 = 0.10 PLN unfavorable
- Total Material Variance = 0.052 + 0.10 = 0.152 PLN unfavorable

**Labor Variance Breakdown (FR-FIN-053)**:
- Standard Rate: 4.80 PLN/hr
- Actual Rate: 4.80 PLN/hr (no change)
- Standard Hours: 0.0833 hr (5 min)
- Actual Hours: 0.10 hr (6 min)

Calculations:
- Labor Rate Variance = (4.80 - 4.80) x 0.10 = 0 PLN
- Labor Efficiency Variance = (0.10 - 0.0833) x 4.80 = 0.08 PLN unfavorable
- Total Labor Variance = 0 + 0.08 = 0.08 PLN unfavorable

### Glossary

- **Cost Center**: Organizational unit where costs are accumulated
- **Cost Rollup**: Calculation of total product cost from BOM hierarchy
- **FIFO**: First In, First Out inventory valuation method
- **GL Account**: General Ledger account code in external ERP
- **Overhead**: Indirect costs allocated to production (utilities, depreciation, etc.)
- **Standard Cost**: Pre-determined expected cost for planning and variance analysis
- **Variance**: Difference between actual and standard cost
- **Weighted Average**: Inventory valuation using average cost of all units
- **Material Price Variance (MPV)**: Variance due to paying more/less than standard price (NEW)
- **Material Quantity Variance (MQV)**: Variance due to using more/less than standard quantity (NEW)
- **Labor Rate Variance (LRV)**: Variance due to paying more/less than standard hourly rate (NEW)
- **Labor Efficiency Variance (LEV)**: Variance due to working more/fewer hours than standard (NEW)
- **Overhead Spending Variance**: Variance due to actual overhead differing from budget (NEW)
- **Overhead Volume Variance**: Variance due to activity level differing from plan (NEW)

---

**Document Version**: 1.1
**Last Updated**: 2025-12-10
**Owner**: Product Team
**Status**: Ready for Implementation
**Change Log**:
- v1.1 (2025-12-10): Added real-time variance analysis requirements (FR-FIN-050 to FR-FIN-058) to address competitive gap
