# SO Allergen Validation API Reference

> **Story**: 07.6 - SO Allergen Validation
> **Module**: Shipping
> **Version**: 1.0
> **Last Updated**: 2026-01-22

## Overview

The SO Allergen Validation API provides food safety compliance by validating sales orders against customer allergen restrictions. It prevents shipment of products containing allergens to customers with documented restrictions.

## Base URL

```
/api/shipping/sales-orders/:id
```

## Authentication

All endpoints require authentication via Supabase Auth session cookie.

| Endpoint | Required Role |
|----------|---------------|
| POST /validate-allergens | Sales Clerk, Manager, Admin |
| POST /override-allergen | Manager, Admin only |

---

## Endpoints

### POST /api/shipping/sales-orders/:id/validate-allergens

Validate SO lines against customer allergen restrictions.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Sales order ID |

**Request Body**

None required.

**Response - 200 (No Conflicts)**

```json
{
  "valid": true,
  "conflicts": [],
  "customer_restrictions": ["allergen-peanut", "allergen-milk"],
  "validated_at": "2026-01-22T10:30:00.000Z",
  "validated_by": "John Smith"
}
```

**Response - 200 (Conflicts Found)**

```json
{
  "valid": false,
  "conflicts": [
    {
      "line_id": "line-001",
      "line_number": 1,
      "product_id": "prod-001",
      "product_code": "SKU-1234",
      "product_name": "Peanut Brittle",
      "allergen_id": "allergen-peanut",
      "allergen_code": "A05",
      "allergen_name": "Peanuts"
    },
    {
      "line_id": "line-002",
      "line_number": 2,
      "product_id": "prod-002",
      "product_code": "SKU-5678",
      "product_name": "Chocolate Milk",
      "allergen_id": "allergen-milk",
      "allergen_code": "A07",
      "allergen_name": "Milk"
    }
  ],
  "customer_restrictions": ["allergen-peanut", "allergen-milk"],
  "validated_at": "2026-01-22T10:30:00.000Z",
  "validated_by": "John Smith"
}
```

**Error Responses**

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_SO_STATUS | SO status does not allow validation |
| 401 | UNAUTHORIZED | Not authenticated |
| 403 | PERMISSION_DENIED | Insufficient role permissions |
| 404 | SALES_ORDER_NOT_FOUND | Sales order not found |
| 500 | VALIDATION_ERROR | Internal server error |

---

### POST /api/shipping/sales-orders/:id/override-allergen

Manager or Admin override for allergen conflicts with reason capture.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Sales order ID |

**Request Body**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| reason | string | Yes | 20-500 chars | Reason for override approval |
| confirmed | boolean | Yes | Must be true | Confirmation checkbox |

**Request Example**

```json
{
  "reason": "Customer confirmed they can accept milk products for this order per phone call on 2026-01-22",
  "confirmed": true
}
```

**Response - 200 (Success)**

```json
{
  "success": true,
  "allergen_validated": true,
  "allow_allergen_override": true,
  "overridden_by": "Jane Manager",
  "overridden_at": "2026-01-22T10:35:00.000Z",
  "audit_log_id": "audit-001"
}
```

**Error Responses**

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REASON | Reason too short or too long |
| 400 | UNCONFIRMED | Override not confirmed |
| 401 | UNAUTHORIZED | Not authenticated |
| 403 | PERMISSION_DENIED | Not Manager or Admin |
| 404 | SALES_ORDER_NOT_FOUND | Sales order not found |
| 409 | NO_CONFLICTS | No allergen conflicts to override |
| 500 | DATABASE_ERROR | Internal server error |

---

### GET /api/shipping/customers/:id/orders

Retrieve paginated order history for a customer.

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Customer ID |

**Query Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number (>= 1) |
| limit | integer | No | 20 | Items per page (1-100) |
| status | string | No | - | Filter by status |

**Response - 200 (Success)**

```json
{
  "orders": [
    {
      "id": "so-001",
      "order_number": "SO-2026-00001",
      "order_date": "2026-01-22T10:00:00.000Z",
      "status": "confirmed",
      "total_amount": 1250.00,
      "currency": "USD",
      "line_count": 5
    },
    {
      "id": "so-002",
      "order_number": "SO-2026-00002",
      "order_date": "2026-01-21T14:30:00.000Z",
      "status": "shipped",
      "total_amount": 890.50,
      "currency": "USD",
      "line_count": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Error Responses**

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_PAGE | Page must be >= 1 |
| 400 | INVALID_LIMIT | Limit must be 1-100 |
| 401 | UNAUTHORIZED | Not authenticated |
| 404 | CUSTOMER_NOT_FOUND | Customer not found |
| 500 | DATABASE_ERROR | Internal server error |

---

## Business Rules

| Rule | Description |
|------|-------------|
| BR-001 | Only "contains" allergens trigger conflicts, not "may_contain" |
| BR-002 | Customers with no restrictions auto-pass validation |
| BR-003 | SO confirmation blocked until allergen_validated = true |
| BR-004 | Validation resets on SO line add/edit/delete |
| BR-005 | Only Manager/Admin can override allergen blocks |
| BR-006 | Override reason must be 20-500 characters |
| BR-007 | All overrides logged to audit_logs table |
| BR-008 | Validation completes within 1 second for 50 lines |
| BR-009 | Order history pagination default 20, max 100 |

---

## Database Schema

**sales_orders columns (added)**

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| allergen_validated | boolean | false | Validation passed flag |
| allow_allergen_override | boolean | false | Override approved flag |
| allergen_validation_date | timestamptz | null | Last validation timestamp |
| allergen_validation_user | uuid | null | User who validated |
| allergen_override_date | timestamptz | null | Override approval timestamp |
| allergen_override_user | uuid | null | User who approved override |
| allergen_override_reason | text | null | Reason text for override |

**audit_logs table**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| org_id | uuid | Organization (RLS) |
| entity_type | text | "sales_order" |
| entity_id | uuid | Sales order ID |
| action | text | "allergen_validation_passed", "allergen_validation_failed", "allergen_override" |
| old_value | jsonb | Previous state |
| new_value | jsonb | New state |
| user_id | uuid | User who performed action |
| reason | text | Override reason (if applicable) |
| created_at | timestamptz | Timestamp |

---

## Type Definitions

```typescript
interface AllergenConflict {
  line_id: string;
  line_number: number;
  product_id: string;
  product_code: string;
  product_name: string;
  allergen_id: string;
  allergen_code: string;
  allergen_name: string;
}

interface ValidateAllergensResponse {
  valid: boolean;
  conflicts: AllergenConflict[];
  customer_restrictions: string[];
  validated_at: string;
  validated_by: string;
}

interface OverrideAllergenRequest {
  reason: string;
  confirmed: boolean;
}

interface OverrideAllergenResponse {
  success: boolean;
  allergen_validated: boolean;
  allow_allergen_override: boolean;
  overridden_by: string;
  overridden_at: string;
  audit_log_id: string;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  total_amount: number;
  currency: string;
  line_count: number;
}

interface CustomerOrdersResponse {
  orders: CustomerOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

---

## Related Documentation

- [Allergen Validation User Guide](../../guides/shipping/allergen-validation-guide.md)
- [Customer Management Guide](../../guides/shipping/customer-management.md)
- [Sales Orders API](./sales-orders.md)
