# Scanner Integration Guide

## Overview

The Scanner Integration module provides real-time production tracking through barcode scanning, enabling accurate material staging, weight recording, and operation completion. This system ensures data integrity and provides immediate feedback to operators.

## Scanner Terminal Types

### 1. Stage Board
**Purpose**: Real-time operation status overview
**Features**:
- Color-coded operation status (Red/Amber/Green)
- Staged LPs count and details
- Operation progress indicators
- Yield calculations and KPI metrics

### 2. Process Terminal
**Purpose**: Material staging and operation execution
**Features**:
- Stage materials for operations
- Record input/output weights
- Complete operations with validation
- QA status management

### 3. Pack Terminal
**Purpose**: Finished goods packaging and palletization
**Features**:
- Create pallets for finished goods
- Add LPs to pallets
- Track LP compositions
- Generate pallet labels

## Stage Board Implementation

### Color Coding System
- **Red**: Operation not started or missing requirements
- **Amber**: Operation in progress or partial completion
- **Green**: Operation completed successfully

### Status Indicators
```typescript
interface StageStatus {
  operation: {
    seq: number;
    name: string;
    status: 'not_started' | 'in_progress' | 'completed';
    color: 'red' | 'amber' | 'green';
  };
  stagedLPs: {
    count: number;
    total: number;
    details: LPDetails[];
  };
  metrics: {
    yield: number;
    consumption: number;
    variance: number;
  };
}
```

### Real-time Updates
- WebSocket connections for live status updates
- Automatic refresh when operations change
- Push notifications for critical status changes

## Process Terminal Workflow

### 1. Material Staging
```typescript
// Stage materials for operation
POST /api/scanner/process/[woId]/operations/[seq]/stage
{
  "lpNumbers": ["LP001", "LP002"],
  "operationSeq": 1,
  "stagedBy": "operator_id"
}
```

**Validation Rules**:
- LP must be in correct stage suffix
- LP must not be reserved for other operations
- LP must have sufficient quantity
- LP must pass QA status (unless override)

### 2. Weight Recording
```typescript
// Record operation weights
POST /api/scanner/process/[woId]/operations/[seq]/weights
{
  "inputWeights": [
    { "lpNumber": "LP001", "weight": 100.5 }
  ],
  "outputWeights": [
    { "lpNumber": "LP002", "weight": 95.2 }
  ],
  "lossWeight": 5.3,
  "recordedBy": "operator_id"
}
```

**Business Rules**:
- Input weights must match staged LPs
- Output weights must be recorded for all outputs
- Loss weight calculated automatically
- 1:1 components enforced strictly

### 3. Operation Completion
```typescript
// Complete operation
POST /api/scanner/process/[woId]/complete-op/[seq]
{
  "completedBy": "operator_id",
  "notes": "Operation completed successfully"
}
```

**Validation Checks**:
- All required weights recorded
- QA status passed (or override provided)
- Sequential routing enforced
- BOM compliance verified

## Pack Terminal Workflow

### 1. Pallet Creation
```typescript
// Create new pallet
POST /api/production/pallets
{
  "palletNumber": "PAL001",
  "location": "warehouse_a",
  "createdBy": "operator_id"
}
```

### 2. LP Addition to Pallet
```typescript
// Add LP to pallet
POST /api/production/pallets/[id]/items
{
  "lpNumber": "LP002",
  "quantity": 1,
  "addedBy": "operator_id"
}
```

### 3. LP Composition Tracking
```typescript
// Track LP compositions
interface LPComposition {
  parentLpId: string;
  childLpId: string;
  quantity: number;
  operationSeq: number;
  createdAt: Date;
}
```

## QA Gate System

### QA Status Enforcement
- **Passed**: Normal operation allowed
- **Failed**: Operations blocked with override option
- **Pending**: Awaiting QA approval
- **Override**: Supervisor PIN required

### Override Process
```typescript
// QA Override Modal
interface QAOverride {
  lpNumber: string;
  currentStatus: string;
  newStatus: string;
  reason: string;
  supervisorPin: string;
  overrideBy: string;
}
```

**Security Measures**:
- Supervisor PIN validation
- Audit trail for all overrides
- Reason documentation required
- Time-limited override validity

## Reservation System

### Reservation Creation
```typescript
// Create LP reservation
POST /api/scanner/reservations
{
  "lpNumber": "LP001",
  "woId": "WO123",
  "operationSeq": 1,
  "quantity": 50,
  "reservedBy": "operator_id"
}
```

### Available Quantity Calculation
```sql
-- Calculate available quantity
SELECT 
  lp.quantity - COALESCE(SUM(r.quantity), 0) as available_quantity
FROM license_plates lp
LEFT JOIN lp_reservations r ON lp.id = r.lp_id 
  AND r.status = 'active'
WHERE lp.lp_number = 'LP001'
GROUP BY lp.id, lp.quantity;
```

### Reservation Safety
- Prevents double-booking of LPs
- Shows warnings for insufficient quantities
- Automatic reservation cleanup on operation completion
- Manual reservation cancellation available

## Scanner Panel Enhancements

### Stage Suffix Display
```typescript
// Enhanced LP display
interface LPDisplay {
  lpNumber: string;
  stageSuffix: string;
  quantity: number;
  qaStatus: string;
  reserved: boolean;
  availableQuantity: number;
}
```

### Real-time Status Updates
- Live quantity updates
- Reservation status changes
- QA status modifications
- Operation progress indicators

## Error Handling

### Common Scanner Errors
1. **Invalid LP Number**: LP not found or incorrect format
2. **Wrong Stage**: LP not in expected stage suffix
3. **Insufficient Quantity**: Not enough available quantity
4. **QA Blocked**: LP failed QA with no override
5. **Reservation Conflict**: LP already reserved

### Error Recovery
- Clear error messages with suggested actions
- Automatic retry for transient errors
- Manual override options where appropriate
- Audit trail for all error conditions

## Performance Optimization

### Database Indexes
```sql
-- Optimize scanner queries
CREATE INDEX idx_lp_stage_suffix ON license_plates(stage_suffix);
CREATE INDEX idx_reservations_active ON lp_reservations(lp_id, status);
CREATE INDEX idx_wo_operations_seq ON wo_operations(wo_id, seq);
```

### Caching Strategy
- Stage Board status cached for 30 seconds
- LP details cached for 5 minutes
- Reservation data cached for 1 minute
- Real-time updates bypass cache

### Query Optimization
- Use prepared statements for repeated queries
- Batch operations where possible
- Minimize database round trips
- Use connection pooling

## Testing Scenarios

### Unit Tests
- LP number validation
- Stage suffix checking
- Quantity calculations
- QA status validation
- Reservation logic

### Integration Tests
- Scanner API endpoints
- Database transactions
- Error handling
- Performance under load

### End-to-End Tests
- Complete operation workflow
- Multi-user scenarios
- Error recovery
- Data consistency

## Deployment Considerations

### Environment Setup
- Scanner hardware configuration
- Network connectivity requirements
- Database connection pooling
- WebSocket server setup

### Monitoring
- Scanner terminal health checks
- Database performance monitoring
- Error rate tracking
- User activity analytics

### Backup and Recovery
- Database backup strategies
- Scanner data synchronization
- Offline operation handling
- Data integrity verification

## Security Considerations

### Access Control
- Role-based permissions for scanner operations
- Supervisor PIN management
- Audit trail for all actions
- Session management

### Data Protection
- Encrypted communication
- Secure PIN storage
- Privacy compliance
- Data retention policies

## Troubleshooting Guide

### Common Issues
1. **Scanner Not Responding**: Check network and hardware
2. **LP Not Found**: Verify LP number format and existence
3. **Permission Denied**: Check user roles and permissions
4. **Database Errors**: Verify connections and transactions
5. **Performance Issues**: Check indexes and query optimization

### Debug Tools
- Scanner terminal logs
- Database query monitoring
- Network connectivity tests
- Performance profiling

### Support Procedures
- Error reporting and tracking
- Escalation procedures
- Maintenance windows
- User training and support
