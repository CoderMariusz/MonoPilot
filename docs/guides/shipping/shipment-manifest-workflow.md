# Shipment Manifest and Ship Workflow Guide

Story: 07.14 Shipment Manifest and Ship

This guide explains how to manifest, ship, and track shipments in MonoPilot.

## Overview

The shipment workflow follows these stages:

1. **Packed** - Boxes are packed and ready
2. **Manifested** - SSCC validated, ready for shipping
3. **Shipped** - Inventory consumed, goods dispatched
4. **Delivered** - Confirmed receipt by customer

## Workflow Diagram

```
[Packed] --> [Manifest] --> [Manifested] --> [Ship] --> [Shipped] --> [Delivered]
                                  |
               MVP shortcut: [Packed] --> [Ship] --> [Shipped]
```

## Step 1: Manifest Shipment

Manifesting validates that all boxes have SSCC codes assigned.

### When to Manifest

Manifest a shipment when:
- All boxes are packed
- SSCC labels are printed and applied
- You want to validate completeness before shipping

### How to Manifest

1. Navigate to **Shipping > Shipments**
2. Open a shipment in "Packed" status
3. Click the **Manifest** button
4. System validates all boxes have SSCC
5. On success: status changes to "Manifested"

### Manifest Validation

The manifest process checks:

| Validation | Pass | Fail |
|------------|------|------|
| Status is "packed" | Continue | Error: "Invalid status" |
| All boxes have SSCC | Success | Error: "X boxes missing SSCC" |

### Handling Missing SSCC

If boxes are missing SSCC:

1. Review the error message showing which boxes need labels
2. Navigate to each box and generate SSCC label
3. Print and apply the label
4. Retry manifest

## Step 2: Ship Shipment

Shipping is an **IRREVERSIBLE** action that:

- Consumes all license plates in the shipment
- Updates the sales order status to "shipped"
- Records shipped quantities on SO lines

### Ship Confirmation Dialog

Because shipping is irreversible, a confirmation dialog appears:

```
+------------------------------------------------+
|  Confirm Shipment                              |
+------------------------------------------------+
|  This action is IRREVERSIBLE                   |
|                                                |
|  Shipment: SHIP-2025-00001                     |
|  Customer: Acme Foods Corp                     |
|  Boxes: 3                                      |
|                                                |
|  This will:                                    |
|  - Consume 5 license plates                    |
|  - Update sales order SO-2025-00001           |
|  - Record shipped quantities                   |
|                                                |
|  [ ] I understand this action cannot be undone |
|                                                |
|  [Cancel]              [Ship Shipment]         |
+------------------------------------------------+
```

### Ship Requirements

| Requirement | Description |
|-------------|-------------|
| Status | Must be "manifested" or "packed" (MVP) |
| Confirmation | Must check the acknowledgment checkbox |
| Role | Warehouse, Manager, or Admin |

### What Happens on Ship

1. Shipment status updates to "shipped"
2. `shipped_at` timestamp is recorded
3. `shipped_by` user ID is recorded
4. All license plates in boxes update to "shipped" status
5. Sales order status updates to "shipped"
6. SO line `quantity_shipped` values are updated

### Ship Without Manifest (MVP)

In MVP mode, you can ship directly from "packed" status:

1. Open a "Packed" shipment
2. Click **Ship** button
3. Confirm the action
4. Shipment goes directly to "Shipped"

This is useful for urgent shipments where SSCC validation is not required.

## Step 3: Mark Delivered

Only **Manager** or **Admin** users can mark shipments as delivered.

### How to Mark Delivered

1. Open a shipment in "Shipped" status
2. Click **Mark Delivered** button (only visible to Manager/Admin)
3. Status changes to "Delivered"
4. Sales order status also updates to "Delivered"

### Delivery Confirmation

Typically, delivery is confirmed when:

- Customer signs for delivery
- Carrier confirms delivery
- Proof of delivery is received

## Tracking Information

### View Tracking

1. Open any shipped or delivered shipment
2. Click **View Tracking** button
3. Tracking dialog shows timeline and carrier link

### Tracking Timeline

The timeline shows all status transitions:

```
+------------------------------------------+
|  Shipment Tracking                       |
+------------------------------------------+
|  SHIP-2025-00001                         |
|  Carrier: DHL                            |
|  Tracking: 1234567890                    |
|                                          |
|  [Track Online]                          |
|                                          |
|  Timeline:                               |
|  o Packed    - Jan 22, 10:00 by John     |
|  o Manifested - Jan 22, 14:30            |
|  * Shipped   - Jan 22, 15:00 by Sarah    |
|  . Delivered - (pending)                 |
+------------------------------------------+
```

### Carrier Tracking Links

Click **Track Online** to open the carrier's tracking page:

| Carrier | Tracking URL |
|---------|--------------|
| DHL | dhl.com/tracking |
| UPS | ups.com/track |
| DPD | dpd.de/tracking |
| FedEx | fedex.com/track |

## Button States

Action buttons change based on shipment status:

| Status | Manifest | Ship | Mark Delivered | View Tracking |
|--------|----------|------|----------------|---------------|
| Packed | Enabled | Enabled* | Hidden | Hidden |
| Manifested | Disabled | Enabled | Hidden | Hidden |
| Shipped | Disabled | Disabled | Enabled** | Enabled |
| Delivered | Disabled | Disabled | Disabled | Enabled |

*MVP allows shipping from packed status
**Only visible to Manager/Admin users

## Role Permissions

| Role | Manifest | Ship | Mark Delivered | View Tracking |
|------|----------|------|----------------|---------------|
| Warehouse | Yes | Yes | No | Yes |
| Manager | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |
| Picker | No | No | No | Yes |
| Viewer | No | No | No | Yes |

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid status" | Wrong shipment status | Check current status |
| "Boxes missing SSCC" | Labels not generated | Generate and apply labels |
| "Confirmation required" | Checkbox not checked | Check acknowledgment |
| "Permission denied" | Role not authorized | Contact Manager/Admin |
| "Transaction failed" | Database error | Retry or contact support |

### Retry on Error

If ship fails mid-transaction:
1. The system attempts automatic rollback
2. Check license plate statuses
3. Verify sales order status
4. Retry the ship action
5. If issues persist, contact support

## Best Practices

1. **Always manifest first** - Validates SSCC completeness
2. **Verify box contents** - Before shipping, confirm all items packed
3. **Print BOL and packing slip** - Generate documents before ship
4. **Record tracking number** - Enter carrier tracking if available
5. **Mark delivered promptly** - Keep status current for reporting

## Related Features

- [Packing Scanner](/docs/guides/shipping/packing-scanner-workflow.md) - Pack items into boxes
- [SSCC Labels](/docs/guides/shipping/sscc-bol-labels.md) - Generate shipping labels
- [BOL Generation](/docs/api/shipping/sscc-bol-labels.md) - Bill of Lading documents
- [Shipping Dashboard](/docs/guides/shipping/shipping-dashboard.md) - Monitor shipments
