# Shipment Manifest API Reference

Story: 07.14 Shipment Manifest and Ship

API endpoints for shipment manifest validation, shipping confirmation, delivery marking, and tracking information.

## Overview

The Shipment Manifest API provides four main operations:

1. **Manifest** - Validate SSCC completeness and update status to "manifested"
2. **Ship** - IRREVERSIBLE action that consumes inventory and updates sales order cascade
3. **Mark Delivered** - Update shipment and SO status to delivered (Manager+ only)
4. **Tracking** - Get shipment timeline and carrier tracking URL

## Base URL

```
/api/shipping/shipments/{shipmentId}
```

## Endpoints

### POST /api/shipping/shipments/{id}/manifest

Validate SSCC completeness on all boxes and update shipment status to manifested.

**Request**

```http
POST /api/shipping/shipments/shipment-001/manifest
Authorization: Bearer {token}
Content-Type: application/json
```

No request body required.

**Response - Success (200)**

```json
{
  "success": true,
  "data": {
    "id": "shipment-001",
    "shipment_number": "SHIP-2025-00001",
    "status": "manifested",
    "manifested_at": "2025-01-22T14:30:00Z",
    "packed_at": "2025-01-22T10:00:00Z",
    "box_count": 2,
    "boxes": [
      {
        "id": "box-001",
        "box_number": 1,
        "sscc": "00123456789012345678",
        "validated": true
      },
      {
        "id": "box-002",
        "box_number": 2,
        "sscc": "00123456789012345679",
        "validated": true
      }
    ]
  }
}
```

**Response - SSCC Validation Failed (400)**

```json
{
  "success": false,
  "error": {
    "code": "SSCC_VALIDATION_FAILED",
    "message": "Cannot manifest: 2 boxes missing SSCC",
    "missing_boxes": [
      { "box_number": 2, "id": "box-002" },
      { "box_number": 3, "id": "box-003" }
    ]
  }
}
```

**Response - Invalid Status (400)**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "Shipment must be in 'packed' status to manifest",
    "current_status": "pending",
    "allowed_statuses": ["packed"]
  }
}
```

**Required Roles:** Warehouse, Manager, Admin

---

### POST /api/shipping/shipments/{id}/ship

Ship the shipment. This is an IRREVERSIBLE action that:
- Updates shipment status to "shipped"
- Consumes all license plates in the shipment (LP status -> shipped)
- Updates sales order status to "shipped"
- Updates SO line quantity_shipped values

**Request**

```http
POST /api/shipping/shipments/shipment-001/ship
Authorization: Bearer {token}
Content-Type: application/json

{
  "confirm": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| confirm | boolean | Yes | Must be `true` to confirm the irreversible action |

**Response - Success (200)**

```json
{
  "success": true,
  "data": {
    "id": "shipment-001",
    "shipment_number": "SHIP-2025-00001",
    "status": "shipped",
    "shipped_at": "2025-01-22T15:00:00Z",
    "shipped_by": {
      "id": "user-001",
      "name": "John Warehouse"
    },
    "sales_order": {
      "id": "so-001",
      "order_number": "SO-2025-00001",
      "status": "shipped",
      "shipped_at": "2025-01-22T15:00:00Z"
    },
    "license_plates_consumed": 5,
    "sales_order_lines_updated": 3
  }
}
```

**Response - Confirmation Required (400)**

```json
{
  "success": false,
  "error": {
    "code": "CONFIRMATION_REQUIRED",
    "message": "Ship action requires explicit confirmation (confirm=true)"
  }
}
```

**Response - Not Manifested (400)**

```json
{
  "success": false,
  "error": {
    "code": "NOT_MANIFESTED",
    "message": "Shipment must be manifested or packed before shipping",
    "current_status": "pending",
    "allowed_statuses": ["manifested", "packed"]
  }
}
```

**Response - Transaction Failed (409)**

```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_FAILED",
    "message": "Failed to consume license plates"
  }
}
```

**Required Roles:** Warehouse, Manager, Admin

---

### POST /api/shipping/shipments/{id}/mark-delivered

Mark shipment as delivered. Updates both shipment and sales order status.

**Request**

```http
POST /api/shipping/shipments/shipment-001/mark-delivered
Authorization: Bearer {token}
```

No request body required.

**Response - Success (200)**

```json
{
  "success": true,
  "data": {
    "id": "shipment-001",
    "shipment_number": "SHIP-2025-00001",
    "status": "delivered",
    "delivered_at": "2025-01-23T09:00:00Z",
    "delivered_by": {
      "id": "user-mgr-001",
      "name": "Sarah Manager"
    },
    "sales_order": {
      "id": "so-001",
      "order_number": "SO-2025-00001",
      "status": "delivered"
    }
  }
}
```

**Response - Insufficient Permissions (403)**

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Manager role required to mark shipment as delivered",
    "user_role": "Warehouse",
    "required_roles": ["Manager", "Admin"]
  }
}
```

**Response - Invalid Status (400)**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "Shipment must be in 'shipped' status to mark as delivered",
    "current_status": "manifested",
    "allowed_statuses": ["shipped"]
  }
}
```

**Required Roles:** Manager, Admin (Warehouse cannot mark delivered)

---

### GET /api/shipping/shipments/{id}/tracking

Get tracking information including timeline and carrier tracking URL.

**Request**

```http
GET /api/shipping/shipments/shipment-001/tracking
Authorization: Bearer {token}
```

**Response - Success (200)**

```json
{
  "success": true,
  "data": {
    "shipment_id": "shipment-001",
    "shipment_number": "SHIP-2025-00001",
    "sales_order_number": "SO-2025-00001",
    "carrier": "DHL",
    "tracking_number": "1234567890",
    "status": "shipped",
    "timeline": {
      "packed_at": "2025-01-22T10:00:00Z",
      "packed_by": "John Packer",
      "manifested_at": "2025-01-22T14:30:00Z",
      "manifested_by": null,
      "shipped_at": "2025-01-22T15:00:00Z",
      "shipped_by": "John Warehouse",
      "delivered_at": null,
      "delivered_by": null
    },
    "external_url": "https://www.dhl.com/en/express/tracking.html?AWB=1234567890"
  }
}
```

**Required Roles:** Any authenticated user in the organization

## Carrier Tracking URLs

The API generates carrier-specific tracking URLs for supported carriers:

| Carrier | URL Pattern |
|---------|-------------|
| DHL | `https://www.dhl.com/en/express/tracking.html?AWB={tracking}` |
| UPS | `https://www.ups.com/track?tracknum={tracking}` |
| DPD | `https://tracking.dpd.de/status/en_US/parcel/{tracking}` |
| FedEx | `https://www.fedex.com/fedextrack/?tracknumbers={tracking}` |

Returns `null` if carrier is not supported or tracking number is not set.

## Status Workflow

```
pending -> packed -> manifested -> shipped -> delivered
                  \-> shipped (MVP skip manifest)
```

**Valid Transitions:**

| Current Status | Manifest | Ship | Mark Delivered |
|----------------|----------|------|----------------|
| pending        | No       | No   | No             |
| packed         | Yes      | Yes* | No             |
| manifested     | No       | Yes  | No             |
| shipped        | No       | No   | Yes            |
| delivered      | No       | No   | No             |

*MVP allows shipping directly from packed status (skip manifest step)

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| NOT_FOUND | 404 | Shipment not found or not in user's org |
| FORBIDDEN | 403 | Insufficient permissions |
| INVALID_STATUS | 400 | Shipment not in required status |
| SSCC_VALIDATION_FAILED | 400 | One or more boxes missing SSCC |
| CONFIRMATION_REQUIRED | 400 | Ship action requires confirm=true |
| NOT_MANIFESTED | 400 | Ship requires manifested or packed status |
| INSUFFICIENT_PERMISSIONS | 403 | Role not authorized for action |
| TRANSACTION_FAILED | 409 | Database transaction failed |
| INTERNAL_ERROR | 500 | Server error |

## Role Permissions

| Operation | Warehouse | Manager | Admin | Picker | Viewer |
|-----------|-----------|---------|-------|--------|--------|
| Manifest  | Yes       | Yes     | Yes   | No     | No     |
| Ship      | Yes       | Yes     | Yes   | No     | No     |
| Mark Delivered | No   | Yes     | Yes   | No     | No     |
| View Tracking | Yes   | Yes     | Yes   | Yes    | Yes    |

## Related Endpoints

- [Packing Scanner](/docs/api/shipping/packing-scanner.md) - Create shipments and boxes
- [SSCC and BOL Labels](/docs/api/shipping/sscc-bol-labels.md) - Generate SSCC labels
- [Shipping Dashboard](/docs/api/shipping/shipping-dashboard.md) - Overview metrics
