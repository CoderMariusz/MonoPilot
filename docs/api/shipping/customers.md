# Customers API Reference

**Story:** 07.1 - Customers CRUD
**Version:** 1.0
**Last Updated:** 2026-01-22

## Overview

The Customers API provides endpoints for managing customer records, contacts, and addresses. This API supports the complete customer lifecycle from creation through archival, with multi-tenant isolation via RLS policies.

## Base URL

All endpoints are relative to your app base URL:

```
https://your-domain.com/api
```

## Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by Supabase client).

**Required Roles by Operation:**

| Operation | Roles |
|-----------|-------|
| View customers | Any authenticated user |
| Create/Edit | `sales`, `manager`, `admin`, `owner` |
| Archive/Delete | `manager`, `admin`, `owner` |

---

## Customer Endpoints

### GET /api/shipping/customers

List customers with filtering, search, and pagination.

**Performance Target:** < 500ms for up to 1000 customers

#### Request

```bash
curl -X GET "https://your-domain.com/api/shipping/customers?category=wholesale&is_active=true&limit=25&page=1" \
  -H "Content-Type: application/json"
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 50 | Items per page (10-500) |
| `search` | string | No | - | Search by customer_code or name |
| `category` | string | No | - | Filter by category (retail, wholesale, distributor) |
| `is_active` | boolean | No | - | Filter by active status (true/false) |
| `sort_by` | string | No | `created_at` | Sort field (name, created_at, customer_code) |
| `sort_order` | string | No | `asc` | Sort direction (asc/desc) |

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "org_id": "org-001",
      "customer_code": "ACME-001",
      "name": "Acme Corporation",
      "category": "wholesale",
      "email": "orders@acme.com",
      "phone": "+1-555-123-4567",
      "tax_id": "12-3456789",
      "credit_limit": 50000.00,
      "payment_terms_days": 30,
      "allergen_restrictions": null,
      "is_active": true,
      "notes": "Priority customer",
      "created_at": "2026-01-22T10:30:00Z",
      "created_by": "user-001",
      "updated_at": "2026-01-22T10:35:00Z",
      "updated_by": "user-001"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

---

### GET /api/shipping/customers/:id

Get a single customer with contacts and addresses.

**Performance Target:** < 300ms

#### Request

```bash
curl -X GET https://your-domain.com/api/shipping/customers/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json"
```

#### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "org-001",
  "customer_code": "ACME-001",
  "name": "Acme Corporation",
  "category": "wholesale",
  "email": "orders@acme.com",
  "phone": "+1-555-123-4567",
  "tax_id": "12-3456789",
  "credit_limit": 50000.00,
  "payment_terms_days": 30,
  "allergen_restrictions": ["allergen-001", "allergen-002"],
  "is_active": true,
  "notes": "Priority customer",
  "created_at": "2026-01-22T10:30:00Z",
  "updated_at": "2026-01-22T10:35:00Z",
  "contacts": [
    {
      "id": "contact-001",
      "customer_id": "550e8400-e29b-41d4-a716-446655440000",
      "org_id": "org-001",
      "name": "John Smith",
      "title": "Purchasing Manager",
      "email": "john.smith@acme.com",
      "phone": "+1-555-123-4568",
      "is_primary": true,
      "created_at": "2026-01-22T10:31:00Z"
    }
  ],
  "addresses": [
    {
      "id": "addr-001",
      "customer_id": "550e8400-e29b-41d4-a716-446655440000",
      "org_id": "org-001",
      "address_type": "shipping",
      "address_line1": "123 Industrial Way",
      "address_line2": "Suite 100",
      "city": "Springfield",
      "state": "IL",
      "postal_code": "62701",
      "country": "United States",
      "dock_hours": {"mon": "08:00-17:00", "tue": "08:00-17:00"},
      "notes": "Use dock 3",
      "is_default": true,
      "created_at": "2026-01-22T10:32:00Z"
    }
  ]
}
```

#### Error Response (404 Not Found)

```json
{
  "error": "Customer not found"
}
```

---

### POST /api/shipping/customers

Create a new customer.

**Performance Target:** < 500ms

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/customers \
  -H "Content-Type: application/json" \
  -d '{
    "customer_code": "ACME-001",
    "name": "Acme Corporation",
    "category": "wholesale",
    "email": "orders@acme.com",
    "phone": "+1-555-123-4567",
    "tax_id": "12-3456789",
    "credit_limit": 50000.00,
    "payment_terms_days": 30,
    "allergen_restrictions": ["allergen-001", "allergen-002"],
    "notes": "Priority customer"
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer_code` | string | Yes | Unique code (3-20 chars, alphanumeric + dash/underscore) |
| `name` | string | Yes | Customer name (1-255 chars) |
| `category` | enum | Yes | Category: `retail`, `wholesale`, `distributor` |
| `email` | string | No | Email address (valid format) |
| `phone` | string | No | Phone number (max 50 chars) |
| `tax_id` | string | No | Tax ID (max 50 chars) |
| `credit_limit` | number | No | Credit limit (positive) |
| `payment_terms_days` | integer | No | Payment terms (1-365 days, default 30) |
| `allergen_restrictions` | array | No | Array of allergen UUIDs (max 20) |
| `is_active` | boolean | No | Active status (default true) |
| `notes` | string | No | Notes (max 2000 chars) |

#### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "org-001",
  "customer_code": "ACME-001",
  "name": "Acme Corporation",
  "category": "wholesale",
  "email": "orders@acme.com",
  "phone": "+1-555-123-4567",
  "tax_id": "12-3456789",
  "credit_limit": 50000.00,
  "payment_terms_days": 30,
  "allergen_restrictions": ["allergen-001", "allergen-002"],
  "is_active": true,
  "notes": "Priority customer",
  "created_at": "2026-01-22T10:30:00Z",
  "created_by": "user-001",
  "updated_at": "2026-01-22T10:30:00Z",
  "updated_by": "user-001"
}
```

#### Error Responses

**Status: 400 Bad Request - Validation Error**

```json
{
  "error": "Validation failed",
  "details": [
    { "path": ["customer_code"], "message": "Customer code must be at least 3 characters" },
    { "path": ["category"], "message": "Invalid enum value" }
  ]
}
```

**Status: 400 Bad Request - Invalid Character**

```json
{
  "error": "Invalid character in customer_code",
  "code": "INVALID_CODE"
}
```

**Status: 400 Bad Request - Invalid Allergen**

```json
{
  "error": "Invalid allergen ID",
  "code": "INVALID_ALLERGEN"
}
```

**Status: 409 Conflict - Duplicate Code**

```json
{
  "message": "Customer code already exists in organization",
  "code": "DUPLICATE_CODE"
}
```

---

### PUT /api/shipping/customers/:id

Update an existing customer.

**Note:** Customer code cannot be modified after creation.

#### Request

```bash
curl -X PUT https://your-domain.com/api/shipping/customers/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation Inc.",
    "credit_limit": 75000.00,
    "payment_terms_days": 45
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Customer name |
| `category` | enum | No | Category |
| `email` | string | No | Email address |
| `phone` | string | No | Phone number |
| `tax_id` | string | No | Tax ID |
| `credit_limit` | number | No | Credit limit |
| `payment_terms_days` | integer | No | Payment terms |
| `allergen_restrictions` | array | No | Allergen IDs |
| `is_active` | boolean | No | Active status |
| `notes` | string | No | Notes |

#### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_code": "ACME-001",
  "name": "Acme Corporation Inc.",
  "credit_limit": 75000.00,
  "payment_terms_days": 45,
  ...
}
```

#### Error Responses

**Status: 400 Bad Request - Cannot Modify Code**

```json
{
  "error": "Bad Request",
  "message": "Cannot modify customer_code"
}
```

**Status: 404 Not Found**

```json
{
  "error": "Customer not found"
}
```

**Status: 409 Conflict - Open Orders**

```json
{
  "error": "Conflict",
  "message": "Cannot deactivate customer with open orders"
}
```

---

### DELETE /api/shipping/customers/:id

Archive a customer (soft delete via is_active=false).

**Note:** Customers with open orders cannot be archived.

#### Request

```bash
curl -X DELETE https://your-domain.com/api/shipping/customers/550e8400-e29b-41d4-a716-446655440000
```

#### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_code": "ACME-001",
  "is_active": false,
  ...
}
```

#### Error Response (409 Conflict)

```json
{
  "error": "Conflict",
  "message": "Cannot archive customer with open orders"
}
```

---

## Contact Endpoints

### GET /api/shipping/customers/:id/contacts

List contacts for a customer.

#### Response (200 OK)

```json
[
  {
    "id": "contact-001",
    "customer_id": "cust-001",
    "org_id": "org-001",
    "name": "John Smith",
    "title": "Purchasing Manager",
    "email": "john.smith@acme.com",
    "phone": "+1-555-123-4568",
    "is_primary": true,
    "created_at": "2026-01-22T10:31:00Z"
  }
]
```

---

### POST /api/shipping/customers/:id/contacts

Create a contact for a customer.

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/customers/cust-001/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "title": "Logistics Coordinator",
    "email": "jane.doe@acme.com",
    "phone": "+1-555-123-4569",
    "is_primary": false
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Contact name (1-255 chars) |
| `title` | string | No | Job title (max 100 chars) |
| `email` | string | No | Email address (valid format) |
| `phone` | string | No | Phone number (max 50 chars) |
| `is_primary` | boolean | No | Primary contact (default false) |

#### Response (201 Created)

```json
{
  "id": "contact-002",
  "customer_id": "cust-001",
  "org_id": "org-001",
  "name": "Jane Doe",
  "title": "Logistics Coordinator",
  "email": "jane.doe@acme.com",
  "phone": "+1-555-123-4569",
  "is_primary": false,
  "created_at": "2026-01-22T11:00:00Z"
}
```

#### Error Response (409 Conflict)

```json
{
  "error": "Conflict",
  "message": "Contact with this email already exists for this customer"
}
```

---

### PUT /api/shipping/customers/:id/contacts/:contactId

Update a contact.

#### Request

```bash
curl -X PUT https://your-domain.com/api/shipping/customers/cust-001/contacts/contact-001 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Purchasing Manager",
    "is_primary": true
  }'
```

#### Response (200 OK)

```json
{
  "id": "contact-001",
  "name": "John Smith",
  "title": "Senior Purchasing Manager",
  "is_primary": true,
  ...
}
```

---

### DELETE /api/shipping/customers/:id/contacts/:contactId

Delete a contact.

#### Response (204 No Content)

---

## Address Endpoints

### GET /api/shipping/customers/:id/addresses

List addresses for a customer.

#### Response (200 OK)

```json
[
  {
    "id": "addr-001",
    "customer_id": "cust-001",
    "org_id": "org-001",
    "address_type": "shipping",
    "address_line1": "123 Industrial Way",
    "address_line2": "Suite 100",
    "city": "Springfield",
    "state": "IL",
    "postal_code": "62701",
    "country": "United States",
    "dock_hours": {"mon": "08:00-17:00", "tue": "08:00-17:00"},
    "notes": "Use dock 3",
    "is_default": true,
    "created_at": "2026-01-22T10:32:00Z"
  },
  {
    "id": "addr-002",
    "address_type": "billing",
    "address_line1": "456 Corporate Blvd",
    "city": "Springfield",
    "state": "IL",
    "postal_code": "62702",
    "country": "United States",
    "is_default": true,
    "created_at": "2026-01-22T10:33:00Z"
  }
]
```

---

### POST /api/shipping/customers/:id/addresses

Create an address for a customer.

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/customers/cust-001/addresses \
  -H "Content-Type: application/json" \
  -d '{
    "address_type": "shipping",
    "address_line1": "789 Warehouse Rd",
    "city": "Chicago",
    "state": "IL",
    "postal_code": "60601",
    "country": "United States",
    "dock_hours": {"mon": "06:00-18:00"},
    "is_default": false
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address_type` | enum | Yes | Type: `billing` or `shipping` |
| `address_line1` | string | Yes | Street address (1-255 chars) |
| `address_line2` | string | No | Additional address (max 255 chars) |
| `city` | string | Yes | City (1-100 chars) |
| `state` | string | No | State/Province (max 100 chars) |
| `postal_code` | string | Yes | Postal code (1-20 chars) |
| `country` | string | Yes | Country (1-100 chars) |
| `dock_hours` | object | No | Dock hours by day (mon-sun) |
| `notes` | string | No | Address notes (max 1000 chars) |
| `is_default` | boolean | No | Default address for type |

#### Response (201 Created)

```json
{
  "id": "addr-003",
  "customer_id": "cust-001",
  "address_type": "shipping",
  "address_line1": "789 Warehouse Rd",
  "city": "Chicago",
  ...
}
```

---

### PUT /api/shipping/customers/:id/addresses/:addressId

Update an address.

#### Request

```bash
curl -X PUT https://your-domain.com/api/shipping/customers/cust-001/addresses/addr-001 \
  -H "Content-Type: application/json" \
  -d '{
    "dock_hours": {"mon": "07:00-19:00", "tue": "07:00-19:00"},
    "notes": "Updated dock hours"
  }'
```

---

### DELETE /api/shipping/customers/:id/addresses/:addressId

Delete an address.

#### Response (204 No Content)

---

### POST /api/shipping/customers/:id/addresses/:addressId/set-default

Set an address as the default for its type.

#### Request

```bash
curl -X POST https://your-domain.com/api/shipping/customers/cust-001/addresses/addr-003/set-default
```

#### Response (200 OK)

```json
{
  "id": "addr-003",
  "address_type": "shipping",
  "is_default": true,
  ...
}
```

**Note:** Only one address per type (billing/shipping) can be default. Setting a new default automatically unsets the previous one.

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Customer/contact/address not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INVALID_CODE` | 400 | Invalid customer code format |
| `INVALID_ALLERGEN` | 400 | Invalid allergen ID |
| `DUPLICATE_CODE` | 409 | Customer code already exists |
| `OPEN_ORDERS` | 409 | Cannot archive customer with open orders |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Code Examples

### TypeScript/React

```typescript
// Fetch customers with filters
async function fetchCustomers(params: {
  category?: 'retail' | 'wholesale' | 'distributor'
  is_active?: boolean
  search?: string
  page?: number
  limit?: number
}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.append(key, String(value))
  })

  const response = await fetch(`/api/shipping/customers?${query}`)
  const data = await response.json()
  return data
}

// Create a new customer
async function createCustomer(customer: {
  customer_code: string
  name: string
  category: 'retail' | 'wholesale' | 'distributor'
  email?: string
  phone?: string
  credit_limit?: number
  payment_terms_days?: number
  allergen_restrictions?: string[]
}) {
  const response = await fetch('/api/shipping/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || error.error || 'Failed to create customer')
  }

  return response.json()
}

// Add contact to customer
async function addContact(
  customerId: string,
  contact: {
    name: string
    title?: string
    email?: string
    phone?: string
    is_primary?: boolean
  }
) {
  const response = await fetch(`/api/shipping/customers/${customerId}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to add contact')
  }

  return response.json()
}

// Add address to customer
async function addAddress(
  customerId: string,
  address: {
    address_type: 'billing' | 'shipping'
    address_line1: string
    city: string
    postal_code: string
    country: string
    state?: string
    is_default?: boolean
  }
) {
  const response = await fetch(`/api/shipping/customers/${customerId}/addresses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(address),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to add address')
  }

  return response.json()
}
```

### Complete Customer Creation Flow

```typescript
async function createCustomerWithDetails() {
  // Step 1: Create customer
  const customer = await createCustomer({
    customer_code: 'NEWCUST-001',
    name: 'New Customer Inc.',
    category: 'wholesale',
    email: 'orders@newcustomer.com',
    phone: '+1-555-987-6543',
    credit_limit: 25000,
    payment_terms_days: 30,
  })

  console.log('Customer created:', customer.customer_code)

  // Step 2: Add primary contact
  const contact = await addContact(customer.id, {
    name: 'Primary Contact',
    title: 'Buyer',
    email: 'buyer@newcustomer.com',
    phone: '+1-555-987-6544',
    is_primary: true,
  })

  console.log('Contact added:', contact.name)

  // Step 3: Add shipping address
  const shippingAddress = await addAddress(customer.id, {
    address_type: 'shipping',
    address_line1: '100 Commerce St',
    city: 'Industrial City',
    state: 'TX',
    postal_code: '75001',
    country: 'United States',
    is_default: true,
  })

  console.log('Shipping address added:', shippingAddress.city)

  // Step 4: Add billing address
  const billingAddress = await addAddress(customer.id, {
    address_type: 'billing',
    address_line1: '200 Corporate Ave',
    city: 'Business Town',
    state: 'TX',
    postal_code: '75002',
    country: 'United States',
    is_default: true,
  })

  console.log('Billing address added:', billingAddress.city)

  return customer
}
```

---

## Request/Response Schemas

### Customer

```typescript
interface Customer {
  id: string
  org_id: string
  customer_code: string            // 3-20 chars, alphanumeric + dash/underscore
  name: string                     // 1-255 chars
  category: CustomerCategory
  email: string | null
  phone: string | null
  tax_id: string | null
  credit_limit: number | null      // DECIMAL(15,2)
  payment_terms_days: number       // 1-365
  allergen_restrictions: string[] | null  // max 20 UUIDs
  is_active: boolean
  notes: string | null
  created_at: string               // ISO 8601
  created_by: string | null
  updated_at: string               // ISO 8601
  updated_by: string | null
}

type CustomerCategory = 'retail' | 'wholesale' | 'distributor'
```

### CustomerContact

```typescript
interface CustomerContact {
  id: string
  customer_id: string
  org_id: string
  name: string                     // 1-255 chars
  title: string | null             // max 100 chars
  email: string | null
  phone: string | null             // max 50 chars
  is_primary: boolean
  created_at: string
}
```

### CustomerAddress

```typescript
interface CustomerAddress {
  id: string
  customer_id: string
  org_id: string
  address_type: 'billing' | 'shipping'
  address_line1: string            // 1-255 chars
  address_line2: string | null     // max 255 chars
  city: string                     // 1-100 chars
  state: string | null             // max 100 chars
  postal_code: string              // 1-20 chars
  country: string                  // 1-100 chars
  dock_hours: Record<string, string | null> | null
  notes: string | null             // max 1000 chars
  is_default: boolean
  created_at: string
}
```

---

## Customer Code Rules

Customer codes follow these rules:

- **Length:** 3-20 characters
- **Allowed characters:** Letters (A-Z, a-z), numbers (0-9), dashes (-), underscores (_)
- **Case:** Stored as uppercase, searches are case-insensitive
- **Uniqueness:** Must be unique within the organization
- **Immutable:** Cannot be changed after creation

**Valid examples:** `ACME-001`, `CUST_123`, `ABC123`
**Invalid examples:** `AB` (too short), `Customer Name` (spaces), `cust@123` (invalid character)

---

## Related Documentation

- [Customer Management Guide](../../guides/shipping/customer-management.md)
- [Sales Orders API](./sales-orders.md) (Story 07.2)
- [SO Line Pricing](./so-line-pricing.md) (Story 07.4)

---

## Support

**Story:** 07.1
**Last Updated:** 2026-01-22
