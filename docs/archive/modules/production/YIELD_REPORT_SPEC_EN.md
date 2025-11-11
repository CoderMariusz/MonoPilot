# Yield Report Specification

## Overview
This document defines the yield reporting system for the Production Module, including input data sources, output formats, calculation formulas, and export specifications.

## Report Types

### 1. Process (PR) Yield Reports
Track yield through production operations with per-operation breakdown.

### 2. Finished Goods (FG) Yield Reports
Track yield from raw materials to finished goods with box and weight tracking.

### 3. Consumption Reports
Track material consumption against BOM standards with variance analysis.

## Input Data Sources

### Primary Tables
- **work_orders**: Work order details, routing, KPI scope, completion data
- **wo_operations**: Per-operation weight tracking, losses, scrap breakdown
- **production_outputs**: Source of truth for work order outputs
- **license_plates**: Material tracking with parent-child relationships
- **stock_moves**: Material movements with move types and metadata
- **products**: Product information and categorization
- **routings**: Production routing and operation sequences

### Supporting Tables
- **bom_items**: Bill of materials for standard consumption
- **machines**: Production equipment and lines
- **locations**: Production locations and zones
- **users**: Operator and user information

## Output Formats

### 1. PR Yield Report Columns

#### Summary Level
- **Date Bucket**: Production date (UTC + Europe/London)
- **Line/Machine**: Production line or machine
- **Product**: Product description and part number
- **Work Orders**: Number of work orders processed
- **Total Input (kg)**: Sum of all input weights
- **Total Output (kg)**: Sum of all output weights
- **PR Yield %**: Overall yield percentage
- **PR Consumption/kg**: Input to output ratio
- **Plan Accuracy %**: Actual vs planned output

#### Detail Level
- **WO Number**: Work order identifier
- **Start Time**: Actual start time (UTC + Europe/London)
- **End Time**: Actual end time (UTC + Europe/London)
- **Duration**: Production duration in hours
- **Operator**: Primary operator
- **Input Weight (kg)**: Total input weight
- **Output Weight (kg)**: Total output weight
- **Yield %**: Work order yield percentage
- **Cooking Loss (kg)**: Cooking weight loss
- **Trim Loss (kg)**: Trim weight loss
- **Marinade Gain (kg)**: Marinade weight gain
- **Scrap Breakdown**: Detailed scrap categorization

#### Per-Operation Level
- **Operation Sequence**: Operation sequence number
- **Operation Name**: Operation description
- **Planned Input (kg)**: Planned input weight
- **Actual Input (kg)**: Actual input weight
- **Planned Output (kg)**: Planned output weight
- **Actual Output (kg)**: Actual output weight
- **Operation Yield %**: Per-operation yield
- **Cumulative Yield %**: Cumulative yield through operations
- **Start Time**: Operation start time
- **End Time**: Operation end time
- **Duration**: Operation duration
- **Operator**: Operation operator

### 2. FG Yield Report Columns

#### Summary Level
- **Date Bucket**: Production date (UTC + Europe/London)
- **Line/Machine**: Production line or machine
- **Product**: Product description and part number
- **Work Orders**: Number of work orders processed
- **Planned Boxes**: Total planned boxes
- **Actual Boxes**: Total actual boxes
- **Box Weight (kg)**: Weight per box
- **Total FG Weight (kg)**: Total finished goods weight
- **Meat Input (kg)**: Total meat input to line
- **FG Yield %**: Finished goods yield percentage
- **Plan Accuracy %**: Box plan accuracy
- **Waste (kg)**: Unaccounted waste

#### Detail Level
- **WO Number**: Work order identifier
- **Start Time**: Actual start time (UTC + Europe/London)
- **End Time**: Actual end time (UTC + Europe/London)
- **Duration**: Production duration in hours
- **Operator**: Primary operator
- **Planned Boxes**: Planned box count
- **Actual Boxes**: Actual box count
- **Box Weight (kg)**: Weight per box
- **Total FG Weight (kg)**: Total finished goods weight
- **Meat Input (kg)**: Meat input to work order
- **FG Yield %**: Work order FG yield
- **Plan Accuracy %**: Box plan accuracy
- **Waste (kg)**: Work order waste

### 3. Consumption Report Columns

#### Summary Level
- **Date Bucket**: Production date (UTC + Europe/London)
- **Line/Machine**: Production line or machine
- **Product**: Product description and part number
- **Work Orders**: Number of work orders processed
- **Materials**: Number of unique materials
- **Total Standard (kg)**: Total BOM standard consumption
- **Total Actual (kg)**: Total actual consumption
- **Total Variance (kg)**: Total consumption variance
- **Variance %**: Overall variance percentage
- **Cost Impact**: Estimated cost impact of variances

#### Detail Level
- **WO Number**: Work order identifier
- **Material**: Material description and part number
- **Material Type**: Material category (RM, PR, FG, WIP)
- **BOM Standard (kg)**: BOM standard quantity
- **Actual Consumed (kg)**: Actual consumption
- **Variance (kg)**: Consumption variance
- **Variance %**: Variance percentage
- **Unit Cost**: Material unit cost
- **Cost Impact**: Variance cost impact
- **Reason Code**: Variance reason code
- **Notes**: Additional notes

## Calculation Formulas

### PR Yield Calculations

#### Overall PR Yield
```sql
PR_Yield_Percentage = (SUM(actual_output_weight) / SUM(actual_input_weight)) * 100
```

#### Per-Operation Yield
```sql
Operation_Yield = (actual_output_weight / actual_input_weight) * 100
Cumulative_Yield = (current_output / initial_input) * 100
```

#### PR Consumption Rate
```sql
PR_Consumption_per_kg = SUM(actual_input_weight) / SUM(actual_output_weight)
```

### FG Yield Calculations

#### FG Yield Percentage
```sql
FG_Yield_Percentage = ((box_weight_kg * actual_boxes) / meat_input_kg) * 100
```

#### Plan Accuracy
```sql
Plan_Accuracy = (actual_boxes / planned_boxes) * 100
```

#### Waste Calculation
```sql
Waste_kg = total_meat_consumed - trim_registered - finished_goods_weight
```

### Consumption Calculations

#### Material Variance
```sql
Variance_kg = actual_consumed - bom_standard
Variance_Percentage = (variance_kg / bom_standard) * 100
```

#### Cost Impact
```sql
Cost_Impact = variance_kg * unit_cost
```

## Time Zone Handling

### UTC Storage
- All timestamps stored in UTC in database
- Consistent timezone handling across all reports

### Europe/London Display
- Convert UTC to Europe/London for display
- Handle daylight saving time transitions
- Maintain consistent time boundaries (00:00-24:59)

### Time Bucket Calculations
```sql
-- Daily bucket (Europe/London)
DATE(created_at AT TIME ZONE 'Europe/London')

-- Weekly bucket (Europe/London)
DATE_TRUNC('week', created_at AT TIME ZONE 'Europe/London')

-- Monthly bucket (Europe/London)
DATE_TRUNC('month', created_at AT TIME ZONE 'Europe/London')
```

## Export Specifications

### Excel Export Format
- **File Format**: .xlsx (Excel 2016+ compatible)
- **Sheet Names**: PR_Yield, FG_Yield, Consumption, Summary
- **Headers**: Bold formatting with background color
- **Data Types**: Proper number formatting for weights and percentages
- **Date Format**: YYYY-MM-DD HH:MM (Europe/London timezone)
- **Number Format**: 2 decimal places for weights, 1 decimal for percentages

### CSV Export Format
- **File Format**: .csv (UTF-8 encoding)
- **Delimiter**: Comma (,)
- **Headers**: First row contains column names
- **Date Format**: ISO 8601 (YYYY-MM-DDTHH:MM:SS)
- **Number Format**: Decimal point (.) for numbers

### PDF Export Format
- **File Format**: .pdf
- **Page Size**: A4
- **Orientation**: Landscape for tables, Portrait for summaries
- **Headers**: Company logo and report title
- **Footers**: Page numbers and generation timestamp
- **Charts**: Embedded charts for trend analysis

## Report Generation Logic

### Data Aggregation
1. **Filter by Date Range**: Apply time bucket filters
2. **Filter by Scope**: PR or FG scope filtering
3. **Group by Dimensions**: Date, Line, Product, Work Order
4. **Calculate Metrics**: Apply yield and consumption formulas
5. **Sort Results**: Order by date, line, product

### Performance Optimization
- **Index Usage**: Leverage database indexes for fast queries
- **View Materialization**: Pre-calculate common aggregations
- **Caching**: Cache frequently accessed data
- **Pagination**: Handle large datasets efficiently

### Error Handling
- **Data Validation**: Check for missing or invalid data
- **Calculation Errors**: Handle division by zero and null values
- **Timeout Handling**: Manage long-running queries
- **Fallback Values**: Provide default values for missing data

## Report Scheduling

### Automated Reports
- **Daily**: End-of-day yield summary
- **Weekly**: Weekly performance analysis
- **Monthly**: Monthly trend analysis
- **Quarterly**: Quarterly performance review

### Manual Reports
- **Ad-hoc**: On-demand report generation
- **Custom Date Ranges**: Flexible time period selection
- **Filtered Views**: Line, product, or operator specific reports
- **Comparative Analysis**: Period-over-period comparisons

## Changelog

### 2025-01-27 - Initial Creation
- Defined yield report specifications
- Established input data sources and output formats
- Created calculation formulas and timezone handling
- Set up export specifications and report generation logic
