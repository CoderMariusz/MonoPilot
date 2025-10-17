# Production Module Specification

## Overview
The Production Module is the core component of the MonoPilot MES system, responsible for managing work orders, production tracking, yield reporting, material consumption analysis, and full traceability from raw materials to finished goods.

## Module Architecture

### Core Components
- **Work Order Management**: Complete lifecycle from planning to completion
- **Yield Reporting**: PR (Process) and FG (Finished Goods) yield calculations
- **Material Consumption**: BOM-based variance analysis
- **Operations Tracking**: Per-operation weight and loss tracking
- **Traceability**: Forward and backward traceability trees
- **Quality Gates**: QA status enforcement for material movements

### Database Schema
- Enhanced work orders with routing, KPI scope, and completion tracking
- License plates with parent-child relationships and stage tracking
- Stock moves with move types, sources, and metadata
- Production outputs as source of truth for work order outputs
- WO operations with detailed weight and loss tracking

## Key Features

### 1. Work Order Management
- **Enhanced Work Orders**: Routing integration, KPI scope (PR/FG), box tracking
- **Completion Tracking**: Actual start/end times, output quantities, closure details
- **Status Management**: Draft → Planned → Released → In Progress → Completed
- **Quality Gates**: QA status enforcement for material movements

### 2. Yield Reporting
- **PR Yield**: Process yield calculations with per-operation tracking
- **FG Yield**: Finished goods yield with box and weight tracking
- **Time Windows**: Daily/Weekly/Monthly with Europe/London timezone
- **KPI Calculations**: Yield%, consumption rates, plan accuracy, on-time performance

### 3. Material Consumption
- **BOM Integration**: Standard vs actual consumption comparison
- **Variance Analysis**: Quantity and percentage variance tracking
- **Cost Analysis**: Material cost impact of variances
- **Trend Monitoring**: Consumption pattern analysis

### 4. Operations Tracking
- **Per-Operation Weights**: Input/output weights for each operation
- **Loss Tracking**: Cooking loss, trim loss, marinade gain
- **Scrap Breakdown**: Detailed scrap categorization
- **Operator Tracking**: Who performed each operation

### 5. Traceability
- **Forward Trace**: GRN → LP → WO → LP → FG
- **Backward Trace**: FG → LP → WO → LP → GRN → PO
- **Parent Chains**: Internal LP splits and relationships
- **Stage Tracking**: Operation suffixes (-R, -S, -D, etc.)

## Data Flow

### Work Order Lifecycle
1. **Planning**: Create WO with routing and KPI scope
2. **Release**: Allocate materials, assign to production line
3. **Execution**: Track operations, record weights and losses
4. **Completion**: Close WO, calculate final yields and variances
5. **Reporting**: Generate yield and consumption reports

### Material Movement Flow
1. **GRN**: Raw materials received with LP creation
2. **WO Issue**: Materials issued to work orders
3. **Processing**: Operations performed with weight tracking
4. **WO Output**: Processed materials output as new LPs
5. **Transfer**: Materials moved between locations
6. **Adjustment**: Inventory adjustments with reasons

### Traceability Flow
- **Forward**: Start with GRN LP, follow through WO operations to final FG
- **Backward**: Start with FG LP, trace back through operations to original GRN
- **Splits**: Track parent-child relationships for internal material splits

## API Endpoints

### Read Operations
- `GET /api/production/work-orders` - List work orders with filters
- `GET /api/production/work-orders/:id` - Get single work order with operations
- `GET /api/warehouse/license-plates` - List license plates with filters
- `GET /api/warehouse/stock-moves` - List stock moves with filters
- `GET /api/production/yield/pr` - PR yield data with time buckets
- `GET /api/production/yield/fg` - FG yield data with time buckets
- `GET /api/production/trace/forward` - Forward traceability tree
- `GET /api/production/trace/backward` - Backward traceability tree

### Write Operations
- `POST /api/warehouse/license-plates/:id/split` - Split license plate
- `PATCH /api/warehouse/license-plates/:id` - Amend LP quantity/location
- `POST /api/warehouse/license-plates/:id/qa` - Update QA status
- `POST /api/production/work-orders/:id/close` - Close work order
- `POST /api/production/wo/:id/operations/:seq/weights` - Record operation weights

### Export Operations
- `GET /api/exports/yield-pr.xlsx` - PR yield export
- `GET /api/exports/yield-fg.xlsx` - FG yield export
- `GET /api/exports/consume.xlsx` - Consumption export
- `GET /api/exports/trace.xlsx` - Traceability export
- `GET /api/exports/work-orders.xlsx` - Work orders export
- `GET /api/exports/license-plates.xlsx` - License plates export
- `GET /api/exports/stock-moves.xlsx` - Stock moves export

## UI Components

### Main Production Page
- **Tab-based Interface**: Work Orders, Yield, Consume, Operations, Trace
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live data refresh and status updates

### Work Orders Tab
- **Enhanced Table**: WO#, Product, Planned/Actual, Yield%, Line, Schedule, QA flags
- **Filtering**: Date bucket, line, product, status, QA status
- **Actions**: View details, close work order

### Yield Tab
- **PR/FG Toggle**: Switch between process and finished goods views
- **KPI Cards**: Yield%, consumption rates, plan accuracy, on-time performance
- **Time Buckets**: Day/Week/Month with Europe/London timezone
- **Drill-down**: Detailed breakdown by line, product, work order

### Consume Tab
- **Variance Table**: WO#, Material, BOM Standard, Actual, Variance
- **BOM Integration**: Link to bill of materials details
- **Export**: Download consumption reports

### Operations Tab
- **Per-Operation Tracking**: Sequence, operation, planned/actual weights
- **Loss Tracking**: Cooking, trim, marinade gains
- **Weight Recording**: Modal for recording operation weights
- **Operator Tracking**: Who performed each operation

### Trace Tab
- **Tree View**: Forward and backward traceability
- **Node Details**: GRN, LP, WO information with QA status
- **Stage Suffixes**: Visual indicators for operation stages
- **Export**: Download traceability reports

## Integration Points

### Scanner Module
- **Pack Terminal**: Integration with packing operations
- **Process Terminal**: Integration with processing operations
- **Material Consumption**: Real-time consumption tracking
- **Staged LPs**: License plate staging for production

### Warehouse Module
- **Material Availability**: Stock level checking
- **License Plate Management**: LP tracking and management
- **Stock Movements**: Material movement tracking
- **Quality Control**: QA status management

### Planning Module
- **Work Order Planning**: Production planning integration
- **Resource Planning**: Resource allocation and planning
- **Scheduling**: Production scheduling integration
- **Capacity Planning**: Production capacity management

## Performance Considerations

### Database Optimization
- **Strategic Indexing**: Indexes on frequently queried columns
- **View Optimization**: Efficient analytical views for reporting
- **Partitioning**: Consider for large historical tables
- **Archiving**: Historical data management strategy

### API Performance
- **Caching**: Strategic caching for frequently accessed data
- **Pagination**: Large dataset handling
- **Filtering**: Efficient query filtering
- **Export Optimization**: Stream processing for large exports

### UI Performance
- **Lazy Loading**: Load data as needed
- **Virtual Scrolling**: Handle large datasets efficiently
- **Debounced Search**: Optimize search operations
- **Real-time Updates**: Efficient WebSocket integration

## Security Considerations

### Data Access
- **Row Level Security**: Database-level access control
- **Role-based Access**: User role permissions
- **Audit Logging**: Track all data changes
- **Data Encryption**: Sensitive data protection

### API Security
- **Authentication**: User authentication and authorization
- **Input Validation**: Validate all API inputs
- **Rate Limiting**: Prevent API abuse
- **Error Handling**: Secure error responses

## Testing Strategy

### Unit Testing
- **Component Testing**: Individual component functionality
- **Hook Testing**: Custom hook behavior
- **Utility Testing**: Helper function validation
- **API Testing**: Endpoint functionality

### Integration Testing
- **Database Integration**: Schema and data integrity
- **API Integration**: End-to-end API functionality
- **Cross-module Integration**: Module interaction testing
- **External Integration**: Scanner and warehouse integration

### End-to-End Testing
- **User Workflows**: Complete user journey testing
- **Production Processes**: Full production cycle testing
- **Performance Testing**: Load and stress testing
- **Security Testing**: Security vulnerability testing

## Deployment Considerations

### Environment Configuration
- **Database Setup**: Schema migrations and data seeding
- **Environment Variables**: Configuration management
- **Feature Flags**: Feature toggle configuration
- **Monitoring**: Performance and error monitoring

### Production Readiness
- **Data Migration**: Historical data migration strategy
- **User Training**: End-user training materials
- **Documentation**: Operational documentation
- **Support**: Support and maintenance procedures

## Changelog

### 2025-01-27 - Initial Creation
- Created comprehensive production module specification
- Defined core components and features
- Established API and UI specifications
- Documented integration points and considerations
