# KPI Definitions and Formulas

## Overview
This document defines all Key Performance Indicators (KPIs) for the Production Module, including calculation formulas, data sources, and measurement criteria.

## Time Windows
All KPIs are calculated using Europe/London timezone boundaries:
- **Day**: 00:00-24:59 Europe/London time
- **Week**: Monday 00:00 to Sunday 24:59 Europe/London time
- **Month**: 1st 00:00 to last day 24:59 Europe/London time

## Process (PR) KPIs

### PR Yield Percentage
**Formula**: `PR Yield% = Σ(actual_output_kg) / Σ(actual_input_kg) × 100`

**Data Sources**:
- `wo_operations.actual_input_weight` (input materials)
- `wo_operations.actual_output_weight` (output materials)

**Calculation Logic**:
- Sum all actual input weights for the time period
- Sum all actual output weights for the time period
- Calculate percentage ratio
- Values > 100% indicate weight gain (e.g., marinade absorption)
- Values < 100% indicate weight loss (e.g., cooking loss, trim)

**Target Range**: 85-95% (varies by product type)

### PR Consumption per Kilogram
**Formula**: `PR Consumption/kg = Σ(actual_input_kg) / Σ(actual_output_kg)`

**Data Sources**:
- `wo_operations.actual_input_weight`
- `wo_operations.actual_output_weight`

**Calculation Logic**:
- Sum all actual input weights
- Sum all actual output weights
- Calculate ratio of input to output
- Lower values indicate more efficient material usage

**Target Range**: 1.05-1.15 (varies by product type)

### Per-Operation Yield
**Formula**: 
- `Op1 Yield = PR_out_1 / RM_in × 100`
- `Op2 Yield = PR_out_2 / PR_out_1 × 100`
- `Op3 Yield = PR_out_3 / PR_out_2 × 100`

**Data Sources**:
- `wo_operations` table with operation sequence
- Input/output weights per operation

**Calculation Logic**:
- Calculate yield for each operation in sequence
- Track cumulative yield through operation chain
- Identify bottlenecks in the process

**Target Range**: 90-98% per operation

### Plan Accuracy (PR)
**Formula**: `Plan Accuracy (PR) = actual_output / planned_qty × 100`

**Data Sources**:
- `work_orders.quantity` (planned quantity)
- `production_outputs.quantity` (actual output)

**Calculation Logic**:
- Compare actual output to planned quantity
- Calculate percentage of plan achievement
- Values > 100% indicate over-production
- Values < 100% indicate under-production

**Target Range**: 95-105%

## Finished Goods (FG) KPIs

### FG Yield Percentage
**Formula**: `FG Yield% = (box_weight_kg × boxes_done) / meat_input_to_line_kg × 100`

**Data Sources**:
- `work_orders.box_weight_kg` (weight per box)
- `work_orders.actual_boxes` (boxes completed)
- `work_orders.actual_output_qty` (meat input to line)

**Calculation Logic**:
- Calculate total finished weight (box_weight × boxes)
- Compare to total meat input
- Account for packaging and processing losses

**Target Range**: 80-90%

### Plan Accuracy (FG)
**Formula**: `Plan Accuracy (FG) = boxes_done / boxes_planned × 100`

**Data Sources**:
- `work_orders.planned_boxes` (planned boxes)
- `work_orders.actual_boxes` (actual boxes)

**Calculation Logic**:
- Compare actual boxes to planned boxes
- Calculate percentage of plan achievement
- Track production efficiency

**Target Range**: 95-105%

### Waste (FG)
**Formula**: `Waste (FG) = total_meat_consumed_in_order - trim_registered`

**Data Sources**:
- `wo_operations.actual_input_weight` (total meat consumed)
- `wo_operations.trim_loss_weight` (registered trim)

**Calculation Logic**:
- Sum all meat input to work order
- Subtract registered trim losses
- Calculate unaccounted waste
- Identify process inefficiencies

**Target Range**: < 5% of total input

## Common KPIs

### On-Time Work Order Percentage
**Formula**: `On-Time WO% = #WO_closed_on_or_before_due / #WO_closed × 100`

**Data Sources**:
- `work_orders.due_date` (planned completion)
- `work_orders.closed_at` (actual completion)

**Calculation Logic**:
- Count work orders closed on or before due date
- Count total work orders closed
- Calculate percentage of on-time completion

**Target Range**: > 90%

### Material Variance
**Formula**: `Material Variance = Σ(actual_consumed - standard_consumed)`

**Data Sources**:
- `bom_items.quantity` (BOM standard)
- `stock_moves.quantity` (actual consumed)

**Calculation Logic**:
- Compare actual material consumption to BOM standards
- Calculate variance for each material
- Sum total variance across all materials
- Track cost impact of variances

**Target Range**: ± 5% of standard

### Overall Equipment Effectiveness (OEE)
**Formula**: `OEE = Availability × Performance × Quality`

**Components**:
- **Availability**: Actual run time / Planned run time
- **Performance**: Actual output / Standard output
- **Quality**: Good output / Total output

**Data Sources**:
- `work_orders.scheduled_start/end` (planned time)
- `work_orders.actual_start/end` (actual time)
- `production_outputs.quantity` (output quantities)

**Target Range**: > 75%

## KPI Calculation Examples

### Daily PR Yield Calculation
```sql
SELECT 
    DATE(wo.actual_start AT TIME ZONE 'Europe/London') as production_date,
    p.description as product,
    SUM(wo_ops.actual_input_weight) as total_input_kg,
    SUM(wo_ops.actual_output_weight) as total_output_kg,
    ROUND(
        (SUM(wo_ops.actual_output_weight) / SUM(wo_ops.actual_input_weight)) * 100, 
        2
    ) as pr_yield_percentage
FROM work_orders wo
JOIN wo_operations wo_ops ON wo.id = wo_ops.wo_id
JOIN products p ON wo.product_id = p.id
WHERE wo.actual_start >= CURRENT_DATE - INTERVAL '1 day'
  AND wo.actual_start < CURRENT_DATE
GROUP BY DATE(wo.actual_start AT TIME ZONE 'Europe/London'), p.description
ORDER BY production_date DESC;
```

### Weekly FG Yield Calculation
```sql
SELECT 
    DATE_TRUNC('week', wo.actual_start AT TIME ZONE 'Europe/London') as week_start,
    SUM(wo.actual_boxes * wo.box_weight_kg) as total_fg_weight,
    SUM(wo.actual_output_qty) as total_meat_input,
    ROUND(
        (SUM(wo.actual_boxes * wo.box_weight_kg) / SUM(wo.actual_output_qty)) * 100, 
        2
    ) as fg_yield_percentage
FROM work_orders wo
WHERE wo.kpi_scope = 'FG'
  AND wo.actual_start >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
  AND wo.actual_start < DATE_TRUNC('week', CURRENT_DATE)
GROUP BY DATE_TRUNC('week', wo.actual_start AT TIME ZONE 'Europe/London')
ORDER BY week_start DESC;
```

## KPI Monitoring and Alerting

### Thresholds and Alerts
- **Critical**: Yield < 80%, Plan accuracy < 90%, On-time < 85%
- **Warning**: Yield < 85%, Plan accuracy < 95%, On-time < 90%
- **Target**: Yield 85-95%, Plan accuracy 95-105%, On-time > 90%

### Reporting Frequency
- **Real-time**: Current production status
- **Daily**: End-of-day KPI summary
- **Weekly**: Weekly performance review
- **Monthly**: Monthly performance analysis

### Data Quality Checks
- **Completeness**: All required data fields populated
- **Accuracy**: Data validation and range checks
- **Consistency**: Cross-reference validation
- **Timeliness**: Data freshness monitoring

## Changelog

### 2025-01-27 - Initial Creation
- Defined all PR and FG KPI formulas
- Established calculation logic and data sources
- Created example SQL queries
- Set target ranges and monitoring criteria
