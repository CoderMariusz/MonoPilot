# Database Migration Notes

## Overview
This document provides rationale and detailed notes for all database migrations in the Production Module enhancement, including schema changes, constraint additions, and policy implementations.

## Migration History

### 010_production_enums.sql
**Purpose**: Create production-specific enums for move types, sources, statuses, and KPI scopes.

**Enums Created**:
- `move_type_enum`: GRN_IN, WO_ISSUE, TRANSFER, ADJUST, WO_OUTPUT
- `move_source_enum`: scanner, portal, system
- `move_status_enum`: draft, completed, void
- `kpi_scope_enum`: PR, FG

**Rationale**: 
- Standardizes move type classification for better tracking
- Enables source tracking for audit purposes
- Supports both Process (PR) and Finished Goods (FG) KPI calculations
- Provides clear status lifecycle for stock moves

### 011_work_orders_enhancement.sql
**Purpose**: Enhance work orders table with routing integration, KPI scope tracking, and completion details.

**Columns Added**:
- `routing_id`: Links to production routing
- `kpi_scope`: PR or FG tracking scope
- `planned_boxes`/`actual_boxes`: Box tracking for FG
- `box_weight_kg`: Weight per box for FG
- `current_operation_seq`: Current operation in routing
- `closed_by`/`closed_at`/`closed_source`: Completion tracking
- `actual_start`/`actual_end`/`actual_output_qty`: Actual production data

**Rationale**:
- Enables routing-based production tracking
- Supports both PR and FG yield calculations
- Provides audit trail for work order completion
- Tracks actual vs planned production metrics

### 012_license_plates_enhancement.sql
**Purpose**: Enhance license plates with parent-child relationships and origin tracking.

**Columns Added**:
- `parent_lp_id`: References parent license plate
- `parent_lp_number`: External parent LP from GRN
- `stage_suffix`: Operation stage indicator (-R, -S, -D, etc.)
- `origin_type`: Origin classification (GRN, WO_OUTPUT, SPLIT)
- `origin_ref`: JSONB reference to origin record

**Rationale**:
- Enables traceability through parent-child relationships
- Tracks material transformation stages
- Supports both internal and external LP numbering
- Provides flexible origin tracking with JSONB

### 013_stock_moves_enhancement.sql
**Purpose**: Enhance stock moves with move type classification and metadata tracking.

**Columns Added**:
- `move_type`: Classification of move type
- `status`: Move status lifecycle
- `wo_id`: Work order reference
- `meta`: JSONB metadata for additional information
- `source`: Source of the move (scanner, portal, system)

**Rationale**:
- Enables move type-based filtering and reporting
- Supports work order integration
- Provides flexible metadata storage
- Enables audit trail for move sources

### 014_production_outputs.sql
**Purpose**: Create production outputs table as source of truth for work order outputs.

**Table Structure**:
- `id`: Primary key
- `wo_id`: Work order reference
- `product_id`: Product reference
- `quantity`: Output quantity
- `uom`: Unit of measure
- `lp_id`: License plate reference
- `boxes`: Box count for FG outputs
- `created_at`: Creation timestamp

**Rationale**:
- Provides single source of truth for production outputs
- Enables accurate yield calculations
- Supports both quantity and box tracking
- Links outputs to specific license plates

### 015_wo_operations_enhancement.sql
**Purpose**: Enhance WO operations table with detailed weight and loss tracking.

**Columns Added**:
- `planned_input_weight`/`planned_output_weight`: Planned weights
- `actual_input_weight`/`actual_output_weight`: Actual weights
- `cooking_loss_weight`: Cooking weight loss
- `trim_loss_weight`: Trim weight loss
- `marinade_gain_weight`: Marinade weight gain
- `scrap_breakdown`: JSONB detailed scrap categorization

**Rationale**:
- Enables detailed per-operation weight tracking
- Supports loss analysis and optimization
- Provides scrap categorization for waste management
- Enables accurate yield calculations per operation

### 016_lp_numbering_trigger.sql
**Purpose**: Implement automated LP numbering with parent-child relationship support.

**Components**:
- `lp_seq`: Sequence for LP numbering
- `gen_lp_number()`: Trigger function for LP number generation
- LP numbering logic: parent_lp_number-<SEQ8> or <SEQ8>
- Check constraint: `lp_number ~ '^[A-Z0-9-]+$'`

**Rationale**:
- Ensures unique LP numbering across the system
- Supports both internal and external LP numbering
- Maintains parent-child relationship in numbering
- Provides consistent LP number format validation

### 017_qa_gate_policies.sql
**Purpose**: Enforce QA gate requirements for material movements.

**Policies**:
- WO_ISSUE moves require qa_status='Passed' on LP
- WO_OUTPUT moves require qa_status='Passed' on LP
- Override roles for emergency situations
- Audit trail for QA gate bypasses

**Rationale**:
- Ensures quality control compliance
- Prevents movement of non-approved materials
- Provides audit trail for quality decisions
- Supports emergency override scenarios

### 018_yield_views.sql
**Purpose**: Create analytical views for yield reporting with Europe/London timezone support.

**Views Created**:
- `vw_yield_pr_daily/weekly/monthly`: PR yield analytics
- `vw_yield_fg_daily/weekly/monthly`: FG yield analytics
- `vw_consume`: Material consumption variance
- `vw_trace_forward`/`vw_trace_backward`: Traceability functions

**Rationale**:
- Provides efficient access to yield data
- Supports multiple time buckets (day/week/month)
- Handles Europe/London timezone conversions
- Enables complex traceability queries

## Index Strategy

### Performance Indexes
- **Work Orders**: `(product_id)`, `(status)`, `(machine_id)`, `(kpi_scope)`
- **License Plates**: `(product_id)`, `(location_id)`, `(qa_status)`, `(parent_lp_id)`
- **Stock Moves**: `(wo_id)`, `(lp_id)`, `(move_type, move_date)`, `(status)`
- **Production Outputs**: `(wo_id)`, `(lp_id)`, `(product_id)`
- **WO Operations**: `(wo_id)`, `(status)`, `(operator_id)`

### Composite Indexes
- **Stock Moves**: `(move_type, move_date, status)` for efficient filtering
- **License Plates**: `(parent_lp_id, stage_suffix)` for traceability
- **Work Orders**: `(kpi_scope, status, due_date)` for reporting

## RLS Policy Strategy

### Row Level Security
- **Users**: Can view their own data and role-appropriate data
- **Work Orders**: Role-based access to work order data
- **License Plates**: Location-based access control
- **Stock Moves**: Audit trail access control
- **Production Outputs**: Work order-based access control

### Policy Implementation
- **Authenticated Users**: Basic read access to relevant data
- **Role-based Access**: Different access levels by user role
- **Location-based Access**: Warehouse location access control
- **Audit Policies**: Track all data modifications

## Data Migration Considerations

### Existing Data Handling
- **Backward Compatibility**: Ensure existing data remains accessible
- **Default Values**: Provide sensible defaults for new columns
- **Data Validation**: Validate existing data against new constraints
- **Migration Scripts**: Handle data transformation where needed

### Performance Impact
- **Index Creation**: Create indexes during low-usage periods
- **Constraint Addition**: Add constraints with validation
- **View Creation**: Test views with production data volumes
- **Rollback Strategy**: Maintain rollback capability

## Testing Strategy

### Migration Testing
- **Schema Validation**: Verify all schema changes applied correctly
- **Constraint Testing**: Test all constraints and triggers
- **Performance Testing**: Verify query performance with new indexes
- **Data Integrity**: Ensure data consistency after migrations

### Rollback Testing
- **Rollback Scripts**: Test rollback procedures
- **Data Preservation**: Ensure data is preserved during rollback
- **Dependency Handling**: Handle migration dependencies correctly
- **Recovery Procedures**: Test recovery from failed migrations

## Monitoring and Maintenance

### Post-Migration Monitoring
- **Performance Metrics**: Monitor query performance
- **Error Rates**: Track constraint violations and errors
- **Data Quality**: Monitor data quality metrics
- **Usage Patterns**: Analyze usage patterns for optimization

### Maintenance Procedures
- **Index Maintenance**: Regular index maintenance and optimization
- **Statistics Updates**: Keep database statistics current
- **Constraint Monitoring**: Monitor constraint violations
- **View Optimization**: Optimize views based on usage patterns

## Changelog

### 2025-01-27 - Initial Creation
- Documented all migration rationales and purposes
- Established index and RLS strategies
- Created data migration considerations
- Set up testing and monitoring procedures
