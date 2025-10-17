# Export API Specifications

## Overview
This document defines the export API specifications for the Production Module, including endpoint definitions, column sets, file naming conventions, and data formatting requirements.

## Export Endpoints

### Base URL
All export endpoints are prefixed with `/api/exports/`

### Endpoint List
- `GET /api/exports/yield-pr.xlsx` - Process yield export
- `GET /api/exports/yield-fg.xlsx` - Finished goods yield export
- `GET /api/exports/consume.xlsx` - Material consumption export
- `GET /api/exports/trace.xlsx` - Traceability export
- `GET /api/exports/work-orders.xlsx` - Work orders export
- `GET /api/exports/license-plates.xlsx` - License plates export
- `GET /api/exports/stock-moves.xlsx` - Stock moves export

## Query Parameters

### Common Parameters
```typescript
interface ExportParams {
  from?: string;        // Start date (YYYY-MM-DD)
  to?: string;          // End date (YYYY-MM-DD)
  bucket?: 'day' | 'week' | 'month';  // Time bucket
  line?: string[];      // Production line filter
  product?: string[];   // Product filter
  status?: string[];    // Status filter
  format?: 'xlsx' | 'csv' | 'pdf';  // Export format
}
```

### Specific Parameters

#### Yield Reports
```typescript
interface YieldExportParams extends ExportParams {
  scope: 'PR' | 'FG';  // Process or Finished Goods
  include_operations?: boolean;  // Include per-operation data
  include_summary?: boolean;     // Include summary data
}
```

#### Traceability Export
```typescript
interface TraceExportParams {
  lp_number?: string;   // License plate number
  wo_number?: string;   // Work order number
  direction: 'forward' | 'backward';  // Trace direction
  depth?: number;       // Maximum trace depth
}
```

## File Naming Conventions

### Standard Format
```
{report_type}_{scope}_{date_range}_{timestamp}.{extension}
```

### Examples
- `yield_pr_daily_2025-01-27_to_2025-01-27_20250127_143022.xlsx`
- `yield_fg_weekly_2025-01-20_to_2025-01-26_20250127_143022.xlsx`
- `consume_monthly_2025-01-01_to_2025-01-31_20250127_143022.xlsx`
- `trace_lp_001234_forward_20250127_143022.xlsx`
- `work_orders_daily_2025-01-27_to_2025-01-27_20250127_143022.xlsx`

### Naming Rules
- **Report Type**: lowercase with underscores
- **Scope**: pr, fg, or omitted for general reports
- **Date Range**: YYYY-MM-DD format
- **Timestamp**: YYYYMMDD_HHMMSS format
- **Extension**: xlsx, csv, or pdf

## Column Specifications

### 1. Process (PR) Yield Export

#### Summary Sheet
| Column | Data Type | Format | Description |
|--------|-----------|--------|-------------|
| Date | Date | YYYY-MM-DD | Production date (Europe/London) |
| Date_UTC | Date | YYYY-MM-DD | Production date (UTC) |
| Line | Text | - | Production line name |
| Product | Text | - | Product description |
| WO_Count | Number | Integer | Number of work orders |
| Total_Input_kg | Number | 2 decimals | Total input weight |
| Total_Output_kg | Number | 2 decimals | Total output weight |
| PR_Yield_Percent | Number | 1 decimal | Overall yield percentage |
| PR_Consumption_kg | Number | 2 decimals | Consumption per kg |
| Plan_Accuracy_Percent | Number | 1 decimal | Plan accuracy percentage |

#### Detail Sheet
| Column | Data Type | Format | Description |
|--------|-----------|--------|-------------|
| WO_Number | Text | - | Work order number |
| Product | Text | - | Product description |
| Start_Time_London | DateTime | YYYY-MM-DD HH:MM | Start time (Europe/London) |
| Start_Time_UTC | DateTime | YYYY-MM-DD HH:MM | Start time (UTC) |
| End_Time_London | DateTime | YYYY-MM-DD HH:MM | End time (Europe/London) |
| End_Time_UTC | DateTime | YYYY-MM-DD HH:MM | End time (UTC) |
| Duration_Hours | Number | 2 decimals | Production duration |
| Operator | Text | - | Primary operator |
| Input_Weight_kg | Number | 2 decimals | Input weight |
| Output_Weight_kg | Number | 2 decimals | Output weight |
| Yield_Percent | Number | 1 decimal | Yield percentage |
| Cooking_Loss_kg | Number | 2 decimals | Cooking loss |
| Trim_Loss_kg | Number | 2 decimals | Trim loss |
| Marinade_Gain_kg | Number | 2 decimals | Marinade gain |

#### Operations Sheet
| Column | Data Type | Format | Description |
|--------|-----------|--------|-------------|
| WO_Number | Text | - | Work order number |
| Operation_Seq | Number | Integer | Operation sequence |
| Operation_Name | Text | - | Operation description |
| Planned_Input_kg | Number | 2 decimals | Planned input weight |
| Actual_Input_kg | Number | 2 decimals | Actual input weight |
| Planned_Output_kg | Number | 2 decimals | Planned output weight |
| Actual_Output_kg | Number | 2 decimals | Actual output weight |
| Operation_Yield_Percent | Number | 1 decimal | Operation yield |
| Cumulative_Yield_Percent | Number | 1 decimal | Cumulative yield |
| Start_Time_London | DateTime | YYYY-MM-DD HH:MM | Start time (Europe/London) |
| End_Time_London | DateTime | YYYY-MM-DD HH:MM | End time (Europe/London) |
| Operator | Text | - | Operation operator |

### 2. Finished Goods (FG) Yield Export

#### Summary Sheet
| Column | Data Type | Format | Description |
|--------|-----------|--------|-------------|
| Date | Date | YYYY-MM-DD | Production date (Europe/London) |
| Date_UTC | Date | YYYY-MM-DD | Production date (UTC) |
| Line | Text | - | Production line name |
| Product | Text | - | Product description |
| WO_Count | Number | Integer | Number of work orders |
| Planned_Boxes | Number | Integer | Planned box count |
| Actual_Boxes | Number | Integer | Actual box count |
| Box_Weight_kg | Number | 2 decimals | Weight per box |
| Total_FG_Weight_kg | Number | 2 decimals | Total finished goods weight |
| Meat_Input_kg | Number | 2 decimals | Total meat input |
| FG_Yield_Percent | Number | 1 decimal | FG yield percentage |
| Plan_Accuracy_Percent | Number | 1 decimal | Plan accuracy percentage |
| Waste_kg | Number | 2 decimals | Unaccounted waste |

#### Detail Sheet
| Column | Data Type | Format | Description |
|--------|-----------|--------|-------------|
| WO_Number | Text | - | Work order number |
| Product | Text | - | Product description |
| Start_Time_London | DateTime | YYYY-MM-DD HH:MM | Start time (Europe/London) |
| End_Time_London | DateTime | YYYY-MM-DD HH:MM | End time (Europe/London) |
| Duration_Hours | Number | 2 decimals | Production duration |
| Operator | Text | - | Primary operator |
| Planned_Boxes | Number | Integer | Planned box count |
| Actual_Boxes | Number | Integer | Actual box count |
| Box_Weight_kg | Number | 2 decimals | Weight per box |
| Total_FG_Weight_kg | Number | 2 decimals | Total finished goods weight |
| Meat_Input_kg | Number | 2 decimals | Meat input to work order |
| FG_Yield_Percent | Number | 1 decimal | FG yield percentage |
| Plan_Accuracy_Percent | Number | 1 decimal | Plan accuracy percentage |
| Waste_kg | Number | 2 decimals | Work order waste |

### 3. Consumption Export

#### Summary Sheet
| Column | Data Type | Format | Description |
|--------|-----------|--------|-------------|
| Date | Date | YYYY-MM-DD | Production date (Europe/London) |
| Date_UTC | Date | YYYY-MM-DD | Production date (UTC) |
| Line | Text | - | Production line name |
| Product | Text | - | Product description |
| WO_Count | Number | Integer | Number of work orders |
| Material_Count | Number | Integer | Number of unique materials |
| Total_Standard_kg | Number | 2 decimals | Total BOM standard |
| Total_Actual_kg | Number | 2 decimals | Total actual consumption |
| Total_Variance_kg | Number | 2 decimals | Total variance |
| Variance_Percent | Number | 1 decimal | Overall variance percentage |
| Cost_Impact | Currency | 2 decimals | Total cost impact |

#### Detail Sheet
| Column | Data Type | Format | Description |
|--------|-----------|--------|-------------|
| WO_Number | Text | - | Work order number |
| Material | Text | - | Material description |
| Material_Type | Text | - | Material category |
| BOM_Standard_kg | Number | 2 decimals | BOM standard quantity |
| Actual_Consumed_kg | Number | 2 decimals | Actual consumption |
| Variance_kg | Number | 2 decimals | Consumption variance |
| Variance_Percent | Number | 1 decimal | Variance percentage |
| Unit_Cost | Currency | 4 decimals | Material unit cost |
| Cost_Impact | Currency | 2 decimals | Variance cost impact |
| Reason_Code | Text | - | Variance reason code |
| Notes | Text | - | Additional notes |

### 4. Traceability Export

#### Trace Tree Sheet
| Column | Data Type | Format | Description |
|--------|-----------|--------|-------------|
| Node_ID | Text | - | Unique node identifier |
| Node_Type | Text | - | GRN, LP, WO, PO |
| Node_Number | Text | - | Reference number |
| Product | Text | - | Product description |
| Quantity | Number | 2 decimals | Quantity amount |
| UOM | Text | - | Unit of measure |
| QA_Status | Text | - | Quality assurance status |
| Stage_Suffix | Text | - | Operation stage suffix |
| Location | Text | - | Current location |
| Parent_Node | Text | - | Parent node reference |
| Child_Nodes | Text | - | Child node references |
| Created_Date_London | DateTime | YYYY-MM-DD HH:MM | Creation date (Europe/London) |
| Created_Date_UTC | DateTime | YYYY-MM-DD HH:MM | Creation date (UTC) |
| Modified_Date_London | DateTime | YYYY-MM-DD HH:MM | Modification date (Europe/London) |
| Modified_Date_UTC | DateTime | YYYY-MM-DD HH:MM | Modification date (UTC) |

### 5. Work Orders Export

#### Work Orders Sheet
| Column | Data Type | Format | Description |
|--------|-----------|--------|-------------|
| WO_Number | Text | - | Work order number |
| Product | Text | - | Product description |
| Product_Part_Number | Text | - | Product part number |
| Planned_Qty | Number | 2 decimals | Planned quantity |
| Actual_Output | Number | 2 decimals | Actual output quantity |
| Yield_Percent | Number | 1 decimal | Yield percentage |
| Line | Text | - | Production line |
| Machine | Text | - | Production machine |
| Status | Text | - | Work order status |
| Priority | Text | - | Work order priority |
| Planned_Start_London | DateTime | YYYY-MM-DD HH:MM | Planned start (Europe/London) |
| Planned_End_London | DateTime | YYYY-MM-DD HH:MM | Planned end (Europe/London) |
| Actual_Start_London | DateTime | YYYY-MM-DD HH:MM | Actual start (Europe/London) |
| Actual_End_London | DateTime | YYYY-MM-DD HH:MM | Actual end (Europe/London) |
| Created_Date_London | DateTime | YYYY-MM-DD HH:MM | Creation date (Europe/London) |
| Closed_Date_London | DateTime | YYYY-MM-DD HH:MM | Closure date (Europe/London) |
| Created_By | Text | - | Created by user |
| Closed_By | Text | - | Closed by user |

### 6. License Plates Export

#### License Plates Sheet
| Column | Data Type | Format | Description |
|--------|-----------|--------|-------------|
| LP_Number | Text | - | License plate number |
| Product | Text | - | Product description |
| Product_Part_Number | Text | - | Product part number |
| Quantity | Number | 2 decimals | Quantity amount |
| UOM | Text | - | Unit of measure |
| Location | Text | - | Current location |
| QA_Status | Text | - | Quality assurance status |
| Stage_Suffix | Text | - | Operation stage suffix |
| Parent_LP | Text | - | Parent license plate |
| Origin_Type | Text | - | Origin type |
| Origin_Ref | Text | - | Origin reference |
| Created_Date_London | DateTime | YYYY-MM-DD HH:MM | Creation date (Europe/London) |
| Created_Date_UTC | DateTime | YYYY-MM-DD HH:MM | Creation date (UTC) |
| Modified_Date_London | DateTime | YYYY-MM-DD HH:MM | Modification date (Europe/London) |
| Modified_Date_UTC | DateTime | YYYY-MM-DD HH:MM | Modification date (UTC) |

### 7. Stock Moves Export

#### Stock Moves Sheet
| Column | Data Type | Format | Description |
|--------|-----------|--------|-------------|
| Move_Number | Text | - | Stock move number |
| LP_Number | Text | - | License plate number |
| Product | Text | - | Product description |
| Move_Type | Text | - | Move type |
| Status | Text | - | Move status |
| Source | Text | - | Move source |
| From_Location | Text | - | Source location |
| To_Location | Text | - | Destination location |
| Quantity | Number | 2 decimals | Move quantity |
| WO_Number | Text | - | Work order number |
| Move_Date_London | DateTime | YYYY-MM-DD HH:MM | Move date (Europe/London) |
| Move_Date_UTC | DateTime | YYYY-MM-DD HH:MM | Move date (UTC) |
| Created_Date_London | DateTime | YYYY-MM-DD HH:MM | Creation date (Europe/London) |
| Created_By | Text | - | Created by user |

## Response Headers

### Excel Export Headers
```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="yield_pr_daily_2025-01-27.xlsx"
Content-Length: 12345
Cache-Control: no-cache
```

### CSV Export Headers
```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="yield_pr_daily_2025-01-27.csv"
Content-Length: 12345
Cache-Control: no-cache
```

### PDF Export Headers
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="yield_pr_daily_2025-01-27.pdf"
Content-Length: 12345
Cache-Control: no-cache
```

## Error Handling

### Error Responses
```typescript
interface ExportErrorResponse {
  error: string;
  message: string;
  code: string;
  details?: any;
}
```

### Common Error Codes
- `INVALID_DATE_RANGE`: Invalid date range parameters
- `INVALID_FORMAT`: Unsupported export format
- `NO_DATA`: No data found for specified criteria
- `EXPORT_FAILED`: Export generation failed
- `PERMISSION_DENIED`: Insufficient permissions

### Error Examples
```json
{
  "error": "INVALID_DATE_RANGE",
  "message": "Start date must be before end date",
  "code": "EXPORT_001"
}
```

## Performance Considerations

### Large Dataset Handling
- **Pagination**: Limit results to prevent memory issues
- **Streaming**: Stream large exports to avoid timeouts
- **Caching**: Cache frequently requested exports
- **Background Processing**: Use background jobs for large exports

### Optimization Strategies
- **Database Indexes**: Optimize queries with proper indexing
- **Query Optimization**: Use efficient SQL queries
- **Memory Management**: Monitor memory usage during exports
- **Timeout Handling**: Set appropriate timeout limits

## Changelog

### 2025-01-27 - Initial Creation
- Defined export endpoint specifications
- Established file naming conventions
- Created detailed column specifications
- Documented response headers and error handling
- Set up performance considerations
