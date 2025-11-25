# Scanner Module API Documentation

**Last Updated**: 2025-01-XX  
**Version**: 2.0 - Documentation Audit Update

**Note**: This document describes API **endpoints**, not API classes. Scanner functionality is implemented through WorkOrdersAPI methods and dedicated API routes.

## Overview

The Scanner Module provides comprehensive APIs for production operations including material staging, weight recording, operation completion, and pallet management. All endpoints are designed to work with the sequential routing system and enforce strict validation rules.

## Base URL

All scanner endpoints are prefixed with `/api/scanner/`

## Authentication

All endpoints require authentication. Include the appropriate authentication headers in your requests.

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error description",
  "details": "Additional error details",
  "code": "ERROR_CODE"
}
```

## Stage Board API

### GET /api/scanner/wo/[id]/stage-status

Get stage board data for a specific work order operation.

**Parameters:**
- `id` (path): Work order ID
- `operation_seq` (query): Operation sequence number (optional, defaults to current operation)

**Response:**
```json
{
  "wo_id": 1,
  "wo_number": "WO-2024-001",
  "operation": {
    "id": 1,
    "seq_no": 1,
    "name": "Raw Material Intake",
    "code": "RM-IN",
    "status": "IN_PROGRESS"
  },
  "stage_board": {
    "operation_seq": 1,
    "required_kg": 1000.0,
    "staged_kg": 800.0,
    "in_kg": 600.0,
    "remaining_kg": 400.0,
    "overall_percentage": 60,
    "overall_status": "amber",
    "components": [
      {
        "material_id": 1,
        "part_number": "RM001",
        "description": "Raw Material 1",
        "uom": "kg",
        "required_kg": 500.0,
        "staged_kg": 400.0,
        "in_kg": 300.0,
        "remaining_kg": 200.0,
        "status_color": "amber",
        "one_to_one": false,
        "staged_lps": [
          {
            "id": 1,
            "lp_number": "LP001",
            "quantity": 400.0,
            "qa_status": "Passed",
            "stage_suffix": "-RM"
          }
        ],
        "warnings": []
      }
    ],
    "summary": {
      "total_components": 1,
      "components_ready": 0,
      "components_partial": 1,
      "components_missing": 0,
      "one_to_one_components": 0
    }
  }
}
```

## Staging API

### POST /api/scanner/process/[woId]/operations/[seq]/stage

Stage a license plate for a specific operation.

**Parameters:**
- `woId` (path): Work order ID
- `seq` (path): Operation sequence number

**Request Body:**
```json
{
  "lp_id": 1,
  "quantity": 100.0
}
```

**Response:**
```json
{
  "success": true,
  "reservation_id": 1,
  "lp_number": "LP001",
  "quantity_staged": 100.0,
  "operation_seq": 1,
  "one_to_one": false,
  "available_quantity": 0.0
}
```

### DELETE /api/scanner/process/[woId]/operations/[seq]/stage

Unstage a license plate from an operation.

**Request Body:**
```json
{
  "lp_id": 1
}
```

## Weights API

### POST /api/scanner/process/[woId]/operations/[seq]/weights

Record weights for an operation.

**Parameters:**
- `woId` (path): Work order ID
- `seq` (path): Operation sequence number

**Request Body:**
```json
{
  "in_kg": 100.0,
  "out_kg": 85.0,
  "cook_loss": 10.0,
  "trim_loss": 5.0,
  "marinade_gain": 0.0
}
```

**Response:**
```json
{
  "success": true,
  "operation_id": 1,
  "seq_no": 1,
  "weights": {
    "input_kg": 100.0,
    "output_kg": 85.0,
    "cook_loss_kg": 10.0,
    "trim_loss_kg": 5.0,
    "marinade_gain_kg": 0.0,
    "net_loss_kg": 15.0
  },
  "output_lp": {
    "id": 2,
    "lp_number": "PR-WO-001-OP1-1234567890",
    "quantity": 85.0
  },
  "yield_percentage": 85
}
```

## Complete Operation API

### POST /api/scanner/process/[woId]/complete-op/[seq]

Complete an operation and enable handover to the next operation.

**Parameters:**
- `woId` (path): Work order ID
- `seq` (path): Operation sequence number

**Response:**
```json
{
  "success": true,
  "operation_id": 1,
  "seq_no": 1,
  "operation_name": "Raw Material Intake",
  "completed_at": "2024-01-15T10:30:00Z",
  "weights": {
    "input_kg": 100.0,
    "output_kg": 85.0,
    "yield_percentage": 85
  },
  "output_lps": [
    {
      "id": 2,
      "lp_number": "PR-WO-001-OP1-1234567890",
      "quantity": 85.0,
      "stage_suffix": "-PR"
    }
  ],
  "handover": {
    "is_last_operation": false,
    "next_operation_seq": 2,
    "auto_staged_count": 1
  },
  "work_order": {
    "id": 1,
    "wo_number": "WO-2024-001",
    "status": "in_progress",
    "is_completed": false
  }
}
```

## Pack Terminal API

### POST /api/scanner/pack/[woId]/output

Record pack output for a finished goods work order.

**Parameters:**
- `woId` (path): Work order ID

**Request Body:**
```json
{
  "boxes": 24,
  "box_weight_kg": 25.0,
  "pallet_id": 1,
  "input_lps": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "output": {
    "box_lp": {
      "id": 3,
      "lp_number": "FG-WO-001-1234567890",
      "quantity": 600.0,
      "boxes": 24,
      "box_weight_kg": 25.0
    },
    "pallet_id": 1,
    "composition_recorded": 3
  }
}
```

## Pallet Management API

### POST /api/scanner/pallets

Create a new pallet.

**Request Body:**
```json
{
  "wo_id": 1,
  "line_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "pallet": {
    "id": 1,
    "pallet_number": "PAL-2024-0001",
    "wo_id": 1,
    "line_id": 1,
    "status": "building",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### GET /api/scanner/pallets

Get list of pallets.

**Query Parameters:**
- `wo_id` (optional): Filter by work order ID
- `status` (optional): Filter by pallet status

### GET /api/scanner/pallets/[id]

Get pallet details.

### PUT /api/scanner/pallets/[id]

Update pallet status.

**Request Body:**
```json
{
  "status": "complete"
}
```

### POST /api/scanner/pallets/[id]/items

Add items to a pallet.

**Request Body:**
```json
{
  "box_lp_ids": [1, 2, 3]
}
```

### DELETE /api/scanner/pallets/[id]/items

Remove items from a pallet.

**Request Body:**
```json
{
  "box_lp_ids": [1, 2]
}
```

## LP Operations API

### GET /api/scanner/lp/[id]

Get LP composition trace.

**Query Parameters:**
- `direction` (optional): "forward" or "backward" (default: "backward")

### POST /api/scanner/lp/[id]

Split a license plate.

**Request Body:**
```json
{
  "splits": [
    {
      "quantity": 50.0,
      "reason": "Partial consumption required"
    }
  ]
}
```

### PUT /api/scanner/lp/[id]/move

Move a license plate to a different location.

**Request Body:**
```json
{
  "to_location_id": 2,
  "qty": 100.0
}
```

### PATCH /api/scanner/lp/[id]/qa

Change QA status with override.

**Request Body:**
```json
{
  "status": "Passed",
  "reason": "Additional testing completed",
  "pin": "1234"
}
```

## Reservations API

### POST /api/scanner/reservations

Create a new reservation.

**Request Body:**
```json
{
  "lp_id": 1,
  "wo_id": 1,
  "qty": 100.0,
  "operation_id": 1,
  "notes": "Reserved for operation 1"
}
```

### GET /api/scanner/reservations

Get reservations.

**Query Parameters:**
- `lp_id` (optional): Filter by LP ID
- `wo_id` (optional): Filter by work order ID
- `status` (optional): Filter by reservation status

### DELETE /api/scanner/reservations/[id]

Cancel a reservation.

## Error Codes

### Common Error Codes

- `INVALID_PARAMETERS`: Invalid request parameters
- `OPERATION_NOT_FOUND`: Operation not found
- `WO_NOT_FOUND`: Work order not found
- `LP_NOT_FOUND`: License plate not found
- `INSUFFICIENT_QUANTITY`: Insufficient available quantity
- `SEQUENTIAL_VIOLATION`: Sequential routing violation
- `QA_STATUS_INVALID`: Invalid QA status for operation
- `ONE_TO_ONE_VIOLATION`: 1:1 component rule violation
- `RESERVATION_CONFLICT`: Reservation conflict detected

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (reservation conflicts, sequential violations)
- `500`: Internal Server Error

## Validation Rules

### Sequential Routing
- Operations must be completed in sequence
- Operation(n+1) cannot start until operation(n) is completed
- Weights must be recorded before operation completion

### 1:1 Components
- Components marked as 1:1 must be consumed in full
- Partial consumption is not allowed for 1:1 components
- Exactly one input LP must produce one output LP

### QA Status
- LPs with "Failed" or "Quarantine" status cannot be used without override
- QA overrides require supervisor PIN and reason
- All QA overrides are logged for audit purposes

### Cross-WO PR Intake
- Process Recipe (PR) LPs from other work orders must match exact product_id and stage_suffix
- Stage suffix validation ensures correct operation output is used as input

### Reservations
- Reservations prevent double-allocation of LP quantities
- Available quantity = Total quantity - Reserved quantity
- Reservations are automatically consumed when weights are recorded

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per minute per user
- 1000 requests per minute per IP address

## Webhooks

The scanner module supports webhooks for real-time notifications:

- `operation.started`: When an operation starts
- `operation.completed`: When an operation completes
- `lp.staged`: When an LP is staged
- `lp.unstaged`: When an LP is unstaged
- `weights.recorded`: When weights are recorded
- `pallet.created`: When a pallet is created
- `pallet.completed`: When a pallet is completed

Configure webhooks in your application settings to receive real-time updates.
