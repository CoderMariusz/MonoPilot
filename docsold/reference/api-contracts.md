# API Contracts Documentation - MonoPilot

**Generated:** 2025-01-23
**Scan Level:** Deep
**Framework:** Next.js 15 App Router

---

## Table of Contents

1. [Overview](#overview)
2. [API Architecture](#api-architecture)
3. [Module Breakdown](#module-breakdown)
4. [Settings Module APIs](#settings-module-apis)
5. [Technical Module APIs](#technical-module-apis)
6. [Planning Module APIs](#planning-module-apis)
7. [Dashboard APIs](#dashboard-apis)
8. [Authentication & Webhooks](#authentication--webhooks)
9. [Cron Jobs](#cron-jobs)

---

## Overview

MonoPilot exposes RESTful API endpoints through Next.js 15 App Router's route handlers. All API routes are located in `apps/frontend/app/api/`.

### Key Characteristics

- **Multi-tenant:** All routes enforce org_id isolation via RLS or manual filtering
- **Service Layer Pattern:** Routes delegate to service classes in `lib/services/`
- **Dual Validation:** Client-side (forms) + Server-side (Zod schemas)
- **Error Handling:** RFC 7807 Problem Details format
- **Authentication:** Supabase Auth with JWT tokens

### Authentication Pattern

```typescript
// Standard auth check in routes
const supabase = await createServerSupabase()
const { data: { session }, error: authError } = await supabase.auth.getSession()

if (authError || !session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## API Architecture

### Route Structure

```
app/api/
├── settings/          # Epic 1 - Settings Module
│   ├── warehouses/
│   ├── locations/
│   ├── machines/
│   ├── lines/
│   ├── allergens/
│   ├── tax-codes/
│   ├── users/
│   ├── invitations/
│   ├── organization/
│   ├── modules/
│   └── wizard/
├── technical/         # Epic 2 - Technical Module
│   ├── products/
│   ├── product-types/
│   ├── boms/
│   ├── routings/
│   ├── tracing/
│   ├── settings/
│   └── dashboard/
├── planning/          # Epic 3 - Planning Module
│   ├── suppliers/
│   ├── purchase-orders/
│   ├── transfer-orders/
│   └── settings/
├── dashboard/         # General Dashboard
│   ├── overview/
│   ├── activity/
│   ├── preferences/
│   └── search/
├── auth/              # Authentication
│   └── callback/
├── webhooks/          # External webhooks
│   └── auth/
└── cron/              # Scheduled tasks
    └── cleanup-invitations/
```

---

## Module Breakdown

### Epic 1: Settings Module (11 story groups)

| Story | Tables | API Routes |
|-------|--------|------------|
| 1.5 Warehouses | warehouses | `/api/settings/warehouses` |
| 1.6 Locations | locations | `/api/settings/locations` |
| 1.7 Machines | machines | `/api/settings/machines` |
| 1.8 Production Lines | production_lines | `/api/settings/lines` |
| 1.9 Allergens | allergens | `/api/settings/allergens` |
| 1.10 Tax Codes | tax_codes | `/api/settings/tax-codes` |
| 1.11 User Management | users, user_sessions | `/api/settings/users` |
| 1.12 Invitations | user_invitations | `/api/settings/invitations` |
| 1.13 Organization | organizations | `/api/settings/organization` |
| 1.14 Modules | organizations.modules_enabled | `/api/settings/modules` |
| 1.15 Wizard | organizations.wizard_completed | `/api/settings/wizard` |

### Epic 2: Technical Module (14 stories)

| Story | Tables | API Routes |
|-------|--------|------------|
| 2.1-2.5 Products | products, product_type_config | `/api/technical/products` |
| 2.6-2.10 BOMs | boms, bom_items | `/api/technical/boms` |
| 2.15-2.16 Routings | routings, routing_operations, product_routings | `/api/technical/routings` |
| 2.17-2.21 Traceability | traceability_links, lp_genealogy | `/api/technical/tracing` |
| 2.22 Settings | technical_settings | `/api/technical/settings` |
| 2.23 Dashboard | - (aggregations) | `/api/technical/dashboard` |

### Epic 3: Planning Module (5+ stories)

| Story | Tables | API Routes |
|-------|--------|------------|
| 3.17 Suppliers | suppliers, supplier_products | `/api/planning/suppliers` |
| 3.1-3.5 Purchase Orders | purchase_orders, po_lines, po_approvals | `/api/planning/purchase-orders` |
| 3.6-3.10 Transfer Orders | transfer_orders, to_lines, to_line_lps | `/api/planning/transfer-orders` |
| Planning Settings | planning_settings | `/api/planning/settings` |

---

## Settings Module APIs

### 1. Warehouses API

**Base Path:** `/api/settings/warehouses`

#### `GET /api/settings/warehouses`

**Story:** 1.5
**Description:** List all warehouses for current organization with filtering

**Query Parameters:**
- `search` (optional): Search by code or name
- `status` (optional): Filter by status (`active` | `inactive`)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "WH01",
      "name": "Main Warehouse",
      "description": "...",
      "status": "active",
      "address": "...",
      "city": "...",
      "postal_code": "...",
      "country": "...",
      "default_location_id": "uuid",
      "org_id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

#### `POST /api/settings/warehouses`

**Description:** Create new warehouse

**Request Body:**
```json
{
  "code": "WH01",
  "name": "Main Warehouse",
  "description": "Central distribution center",
  "status": "active",
  "address": "123 Main St",
  "city": "Warsaw",
  "postal_code": "00-001",
  "country": "Poland"
}
```

**Validation:** `createWarehouseSchema` (Zod)

#### `GET /api/settings/warehouses/[id]`

**Description:** Get single warehouse by ID

#### `PUT /api/settings/warehouses/[id]`

**Description:** Update warehouse

#### `DELETE /api/settings/warehouses/[id]`

**Description:** Soft delete warehouse (sets deleted_at)

---

### 2. Locations API

**Base Path:** `/api/settings/locations`

#### `GET /api/settings/locations`

**Story:** 1.6
**Query Parameters:**
- `warehouse_id` (optional): Filter by warehouse
- `type` (optional): Filter by type (`storage` | `receiving` | `shipping` | `production` | `qa` | `staging`)
- `search` (optional): Search by code or name

**Response:** Array of location objects with warehouse relation

#### `POST /api/settings/locations`

**Request Body:**
```json
{
  "warehouse_id": "uuid",
  "code": "A-01-01",
  "name": "Aisle A - Rack 1 - Level 1",
  "type": "storage",
  "description": "...",
  "capacity_qty": 1000,
  "capacity_unit": "pallets",
  "status": "active",
  "zone": "Cold Storage",
  "is_quarantine": false
}
```

**Validation:** `createLocationSchema`

#### `PUT /api/settings/locations/[id]`

**Description:** Update location

#### `DELETE /api/settings/locations/[id]`

**Description:** Soft delete location

---

### 3. Machines API

**Base Path:** `/api/settings/machines`

#### `GET /api/settings/machines`

**Story:** 1.7
**Query Parameters:**
- `warehouse_id` (optional)
- `status` (optional)
- `search` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "warehouse_id": "uuid",
      "code": "M001",
      "name": "Mixer 1",
      "description": "Industrial mixer",
      "model": "MX-5000",
      "manufacturer": "...",
      "serial_number": "...",
      "capacity_per_hour": 500,
      "capacity_unit": "kg",
      "status": "active",
      "org_id": "uuid"
    }
  ]
}
```

#### `POST /api/settings/machines`

**Request Body:** Machine creation payload

#### `GET /api/settings/machines/[id]`

**Description:** Get machine details

#### `PUT /api/settings/machines/[id]`

**Description:** Update machine

#### `DELETE /api/settings/machines/[id]`

**Description:** Soft delete machine

---

### 4. Production Lines API

**Base Path:** `/api/settings/lines`

#### `GET /api/settings/lines`

**Story:** 1.8
**Query Parameters:**
- `warehouse_id` (optional)
- `status` (optional)

**Response:** Array of production line objects

#### `POST /api/settings/lines`

**Request Body:**
```json
{
  "warehouse_id": "uuid",
  "code": "LINE-01",
  "name": "Production Line 1",
  "description": "Main production line",
  "status": "active"
}
```

#### `PUT /api/settings/lines/[id]`

**Description:** Update production line

#### `DELETE /api/settings/lines/[id]`

**Description:** Soft delete production line

---

### 5. Allergens API

**Base Path:** `/api/settings/allergens`

#### `GET /api/settings/allergens`

**Story:** 1.9
**Query Parameters:**
- `search` (optional)
- `type` (optional): `EU14` | `CUSTOM`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "GLUTEN",
      "name": "Cereals containing gluten",
      "description": "...",
      "type": "EU14",
      "org_id": "uuid"
    }
  ]
}
```

#### `POST /api/settings/allergens`

**Description:** Create custom allergen (EU14 are pre-seeded)

#### `PUT /api/settings/allergens/[id]`

**Description:** Update allergen (only CUSTOM type can be edited)

#### `DELETE /api/settings/allergens/[id]`

**Description:** Delete custom allergen (EU14 cannot be deleted)

---

### 6. Tax Codes API

**Base Path:** `/api/settings/tax-codes`

#### `GET /api/settings/tax-codes`

**Story:** 1.10
**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "VAT23",
      "name": "Standard VAT 23%",
      "rate": 23.00,
      "description": "...",
      "is_default": true,
      "org_id": "uuid"
    }
  ]
}
```

#### `POST /api/settings/tax-codes`

**Request Body:**
```json
{
  "code": "VAT23",
  "name": "Standard VAT 23%",
  "rate": 23.00,
  "description": "Standard rate for Poland",
  "is_default": true
}
```

#### `PUT /api/settings/tax-codes/[id]`

**Description:** Update tax code

#### `DELETE /api/settings/tax-codes/[id]`

**Description:** Delete tax code (cascade protection if in use)

---

### 7. Users API

**Base Path:** `/api/settings/users`

#### `GET /api/settings/users`

**Story:** 1.11
**Query Parameters:**
- `role` (optional): `owner` | `admin` | `user`
- `status` (optional): `active` | `inactive` | `pending`
- `search` (optional)

**Response:** Array of user objects (no password field)

#### `GET /api/settings/users/[id]`

**Description:** Get user details

#### `PUT /api/settings/users/[id]`

**Description:** Update user (admin only)

**Request Body:**
```json
{
  "role": "admin",
  "status": "active"
}
```

#### `GET /api/settings/users/[id]/sessions`

**Description:** List all active sessions for user

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "device_type": "desktop",
      "browser": "Chrome",
      "os": "Windows",
      "ip_address": "192.168.1.1",
      "location": "Warsaw, Poland",
      "created_at": "timestamp",
      "last_activity": "timestamp"
    }
  ]
}
```

#### `DELETE /api/settings/users/[id]/sessions/[sessionId]`

**Description:** Revoke specific session (logout user from that device)

---

### 8. Invitations API

**Base Path:** `/api/settings/invitations`

#### `GET /api/settings/invitations`

**Story:** 1.12
**Query Parameters:**
- `status` (optional): `pending` | `accepted` | `expired` | `revoked`

**Response:** Array of invitation objects

#### `POST /api/settings/invitations`

**Description:** Create invitation

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "user",
  "expires_in_days": 7
}
```

**Side Effects:**
- Sends invitation email via SendGrid
- Generates unique invitation token
- Sets expiration timestamp

#### `POST /api/settings/invitations/[id]/resend`

**Description:** Resend invitation email

#### `DELETE /api/settings/invitations/[id]`

**Description:** Revoke invitation (sets status to 'revoked')

---

### 9. Organization API

**Base Path:** `/api/settings/organization`

#### `GET /api/settings/organization`

**Story:** 1.13
**Description:** Get current organization details

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Acme Corp",
    "email": "contact@acme.com",
    "phone": "+48 123 456 789",
    "website": "https://acme.com",
    "address": "...",
    "city": "Warsaw",
    "postal_code": "00-001",
    "country": "Poland",
    "logo_url": "https://...",
    "timezone": "Europe/Warsaw",
    "setup_completed": true,
    "modules_enabled": ["settings", "technical", "planning"],
    "wizard_completed": true,
    "wizard_steps_completed": ["warehouses", "locations", "users"],
    "created_at": "timestamp"
  }
}
```

#### `PUT /api/settings/organization`

**Description:** Update organization details

**Request Body:** Partial organization object (logo upload handled separately)

#### `POST /api/settings/organization/logo`

**Description:** Upload organization logo

**Content-Type:** `multipart/form-data`

**Side Effects:**
- Uploads to Supabase Storage
- Updates organization.logo_url

---

### 10. Modules API

**Base Path:** `/api/settings/modules`

#### `GET /api/settings/modules`

**Story:** 1.14
**Description:** Get enabled/disabled modules

**Response:**
```json
{
  "data": {
    "modules_enabled": ["settings", "technical", "planning"],
    "available_modules": [
      {
        "id": "settings",
        "name": "Settings",
        "description": "Basic configuration",
        "icon": "Settings",
        "enabled": true
      },
      {
        "id": "technical",
        "name": "Technical",
        "description": "Products, BOMs, Routings",
        "icon": "Package",
        "enabled": true
      },
      {
        "id": "planning",
        "name": "Planning",
        "description": "POs, TOs, Suppliers",
        "icon": "Calendar",
        "enabled": false
      }
    ]
  }
}
```

#### `PUT /api/settings/modules`

**Description:** Enable/disable modules

**Request Body:**
```json
{
  "modules_enabled": ["settings", "technical"]
}
```

---

### 11. Wizard API

**Base Path:** `/api/settings/wizard`

#### `GET /api/settings/wizard`

**Story:** 1.15
**Description:** Get wizard completion status

**Response:**
```json
{
  "data": {
    "wizard_completed": false,
    "wizard_steps_completed": ["warehouses", "locations"],
    "remaining_steps": ["users", "allergens"]
  }
}
```

#### `PUT /api/settings/wizard`

**Description:** Update wizard progress

**Request Body:**
```json
{
  "wizard_steps_completed": ["warehouses", "locations", "users"],
  "wizard_completed": false
}
```

---

## Technical Module APIs

### 1. Products API

**Base Path:** `/api/technical/products`

#### `GET /api/technical/products`

**Story:** 2.1
**Query Parameters:**
- `search` (optional): Search by code or name
- `type` (optional): Filter by product type (`RM` | `WIP` | `FG` | `PKG` | `BP` | `CUSTOM`)
- `status` (optional): `active` | `inactive` | `obsolete`
- `category` (optional)
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "RM-001",
      "name": "Flour - Wheat",
      "type": "RM",
      "description": "...",
      "category": "Ingredients",
      "uom": "kg",
      "version": 1.0,
      "status": "active",
      "shelf_life_days": 180,
      "min_stock_qty": 100,
      "max_stock_qty": 1000,
      "reorder_point": 200,
      "cost_per_unit": 2.50,
      "org_id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```

#### `POST /api/technical/products`

**Description:** Create new product

**Request Body:**
```json
{
  "code": "RM-001",
  "name": "Flour - Wheat",
  "type": "RM",
  "description": "High-quality wheat flour",
  "category": "Ingredients",
  "uom": "kg",
  "shelf_life_days": 180,
  "min_stock_qty": 100,
  "max_stock_qty": 1000,
  "reorder_point": 200,
  "cost_per_unit": 2.50
}
```

**Validation:** `productCreateSchema`

**Side Effects:**
- Initial version set to 1.0
- created_by set to current user

#### `GET /api/technical/products/[id]`

**Description:** Get product details

#### `PUT /api/technical/products/[id]`

**Description:** Update product

**Side Effects:**
- Auto-increments version (1.0 → 1.1 → ... → 1.9 → 2.0)
- Logs changes to `product_version_history` table
- Tracks changed fields in JSONB

**Story:** 2.2, 2.3 (Version tracking)

#### `DELETE /api/technical/products/[id]`

**Description:** Soft delete product

---

### 2. Product Allergens API

**Base Path:** `/api/technical/products/[id]/allergens`

#### `GET /api/technical/products/[id]/allergens`

**Story:** 2.4
**Response:**
```json
{
  "data": [
    {
      "allergen_id": "uuid",
      "allergen": {
        "code": "GLUTEN",
        "name": "Cereals containing gluten",
        "type": "EU14"
      },
      "relation_type": "contains",
      "created_at": "timestamp"
    }
  ]
}
```

#### `POST /api/technical/products/[id]/allergens`

**Description:** Add allergen to product

**Request Body:**
```json
{
  "allergen_id": "uuid",
  "relation_type": "contains"
}
```

**Validation:** `relation_type` must be `contains` or `may_contain`

#### `DELETE /api/technical/products/[id]/allergens/[allergen_id]`

**Description:** Remove allergen from product

---

### 3. Product Version History API

**Base Path:** `/api/technical/products/[id]/history`

#### `GET /api/technical/products/[id]/history`

**Story:** 2.2, 2.3
**Description:** Get version history for product

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "version": 1.2,
      "changed_fields": {
        "cost_per_unit": {
          "old": "2.50",
          "new": "2.75"
        },
        "min_stock_qty": {
          "old": "100",
          "new": "150"
        }
      },
      "change_summary": "Updated pricing and stock levels",
      "changed_by": "uuid",
      "changed_at": "timestamp",
      "user": {
        "name": "John Doe"
      }
    }
  ]
}
```

#### `GET /api/technical/products/[id]/history/compare?v1=1.0&v2=1.5`

**Description:** Compare two versions side-by-side

**Query Parameters:**
- `v1` (required): First version number
- `v2` (required): Second version number

**Response:** Diff object showing all changes between versions

---

### 4. Product Types Config API

**Base Path:** `/api/technical/product-types`

#### `GET /api/technical/product-types`

**Story:** 2.5
**Description:** Get custom product type configurations

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "CUSTOM_TYPE_1",
      "name": "Custom Type",
      "is_default": false,
      "is_active": true,
      "org_id": "uuid"
    }
  ]
}
```

#### `POST /api/technical/product-types`

**Description:** Create custom product type

#### `PUT /api/technical/product-types/[id]`

**Description:** Update product type

#### `DELETE /api/technical/product-types/[id]`

**Description:** Deactivate product type

---

### 5. BOMs API

**Base Path:** `/api/technical/boms`

#### `GET /api/technical/boms`

**Story:** 2.6
**Query Parameters:**
- `product_id` (optional): Filter by output product
- `search` (optional): Search by code or name
- `status` (optional): `draft` | `approved` | `archived`
- `date` (optional): Filter active BOMs at specific date

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "BOM-FG-001",
      "name": "White Bread BOM",
      "product_id": "uuid",
      "product": {
        "code": "FG-001",
        "name": "White Bread"
      },
      "version": "1.0",
      "status": "approved",
      "effective_from": "2025-01-01",
      "effective_to": null,
      "quantity": 1000,
      "uom": "kg",
      "yield_percentage": 95,
      "org_id": "uuid",
      "created_at": "timestamp"
    }
  ]
}
```

#### `POST /api/technical/boms`

**Description:** Create new BOM

**Request Body:**
```json
{
  "code": "BOM-FG-001",
  "name": "White Bread BOM",
  "product_id": "uuid",
  "version": "1.0",
  "status": "draft",
  "effective_from": "2025-01-01",
  "quantity": 1000,
  "uom": "kg",
  "yield_percentage": 95
}
```

**Validation:**
- `effective_from` and `effective_to` cannot overlap for same product (Story 2.9)
- Enforced by database trigger `validate_bom_date_overlap()`

#### `GET /api/technical/boms/[id]`

**Description:** Get BOM details with items

#### `PUT /api/technical/boms/[id]`

**Description:** Update BOM header

#### `DELETE /api/technical/boms/[id]`

**Description:** Delete BOM (cascade deletes items)

---

### 6. BOM Items API

**Base Path:** `/api/technical/boms/[id]/items`

#### `GET /api/technical/boms/[id]/items`

**Story:** 2.7
**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "bom_id": "uuid",
      "line_number": 10,
      "component_id": "uuid",
      "component": {
        "code": "RM-001",
        "name": "Flour - Wheat",
        "type": "RM"
      },
      "quantity": 500,
      "uom": "kg",
      "scrap_percentage": 2,
      "is_byproduct": false,
      "conditional_flags": ["organic", "gluten_free"],
      "notes": "High-quality wheat flour"
    }
  ]
}
```

#### `POST /api/technical/boms/[id]/items`

**Description:** Add item to BOM

**Request Body:**
```json
{
  "component_id": "uuid",
  "quantity": 500,
  "uom": "kg",
  "scrap_percentage": 2,
  "is_byproduct": false,
  "conditional_flags": [],
  "notes": ""
}
```

**Auto-calculation:**
- `line_number` auto-incremented by 10

#### `PUT /api/technical/boms/[id]/items/[itemId]`

**Description:** Update BOM item

#### `DELETE /api/technical/boms/[id]/items/[itemId]`

**Description:** Remove item from BOM

---

### 7. BOM Cloning API

**Base Path:** `/api/technical/boms/[id]/clone`

#### `POST /api/technical/boms/[id]/clone`

**Story:** 2.8
**Description:** Clone existing BOM with all items

**Request Body:**
```json
{
  "new_code": "BOM-FG-001-V2",
  "new_version": "2.0",
  "effective_from": "2025-02-01",
  "copy_items": true
}
```

**Side Effects:**
- Creates new BOM record
- Copies all BOM items with new bom_id
- Resets status to 'draft'

---

### 8. BOM Timeline API

**Base Path:** `/api/technical/boms/timeline`

#### `GET /api/technical/boms/timeline?product_id=uuid`

**Story:** 2.9
**Description:** Get timeline of all BOM versions for a product

**Response:**
```json
{
  "data": [
    {
      "version": "1.0",
      "effective_from": "2025-01-01",
      "effective_to": "2025-01-31",
      "status": "archived"
    },
    {
      "version": "2.0",
      "effective_from": "2025-02-01",
      "effective_to": null,
      "status": "approved"
    }
  ]
}
```

---

### 9. BOM Comparison API

**Base Path:** `/api/technical/boms/compare`

#### `GET /api/technical/boms/compare?bom1=uuid&bom2=uuid`

**Story:** 2.10
**Description:** Compare two BOMs side-by-side

**Response:**
```json
{
  "data": {
    "bom1": { /* BOM details */ },
    "bom2": { /* BOM details */ },
    "differences": {
      "header": {
        "yield_percentage": { "bom1": 95, "bom2": 96 }
      },
      "items": {
        "added": [/* items in bom2 not in bom1 */],
        "removed": [/* items in bom1 not in bom2 */],
        "changed": [
          {
            "component": "RM-001",
            "field": "quantity",
            "bom1": 500,
            "bom2": 550
          }
        ]
      }
    }
  }
}
```

---

### 10. BOM Allergens API

**Base Path:** `/api/technical/boms/[id]/allergens`

#### `GET /api/technical/boms/[id]/allergens`

**Story:** 2.11
**Description:** Calculate all allergens from BOM items (inherited from components)

**Response:**
```json
{
  "data": {
    "contains": [
      {
        "allergen": {
          "code": "GLUTEN",
          "name": "Cereals containing gluten"
        },
        "sources": [
          {
            "component_code": "RM-001",
            "component_name": "Flour - Wheat"
          }
        ]
      }
    ],
    "may_contain": [
      /* allergens marked as may_contain in any component */
    ]
  }
}
```

**Business Logic:**
- Aggregates allergens from all BOM item components
- If ANY component "contains" allergen → BOM "contains"
- If ANY component "may_contain" allergen → BOM "may_contain"

---

### 11. Routings API

**Base Path:** `/api/technical/routings`

#### `GET /api/technical/routings`

**Story:** 2.15
**Response:** Array of routing headers

#### `POST /api/technical/routings`

**Request Body:**
```json
{
  "code": "RTG-001",
  "name": "Bread Production Routing",
  "description": "Standard bread production process",
  "version": "1.0",
  "status": "draft"
}
```

#### `GET /api/technical/routings/[id]`

**Description:** Get routing with operations

#### `PUT /api/technical/routings/[id]`

**Description:** Update routing

#### `DELETE /api/technical/routings/[id]`

**Description:** Delete routing

---

### 12. Routing Operations API

**Base Path:** `/api/technical/routings/[id]/operations`

#### `GET /api/technical/routings/[id]/operations`

**Story:** 2.16
**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "routing_id": "uuid",
      "operation_number": 10,
      "name": "Mixing",
      "description": "Mix ingredients",
      "machine_id": "uuid",
      "machine": {
        "code": "M001",
        "name": "Mixer 1"
      },
      "location_id": "uuid",
      "setup_time_minutes": 15,
      "cycle_time_minutes": 30,
      "queue_time_minutes": 5,
      "is_quality_check": false
    }
  ]
}
```

#### `POST /api/technical/routings/[id]/operations`

**Request Body:**
```json
{
  "name": "Mixing",
  "description": "Mix ingredients",
  "machine_id": "uuid",
  "location_id": "uuid",
  "setup_time_minutes": 15,
  "cycle_time_minutes": 30,
  "queue_time_minutes": 5,
  "is_quality_check": false
}
```

**Auto-calculation:**
- `operation_number` auto-incremented by 10

#### `PUT /api/technical/routings/[id]/operations/[operationId]`

**Description:** Update operation

#### `DELETE /api/technical/routings/[id]/operations/[operationId]`

**Description:** Remove operation

---

### 13. Product Routings API

**Base Path:** `/api/technical/routings/[id]/products`

#### `GET /api/technical/routings/[id]/products`

**Story:** 2.16
**Description:** Get products assigned to routing

#### `POST /api/technical/routings/[id]/products`

**Description:** Assign product to routing

**Request Body:**
```json
{
  "product_id": "uuid"
}
```

#### `DELETE /api/technical/routings/[id]/products/[product_id]`

**Description:** Unassign product from routing

---

### 14. Traceability APIs

**Base Path:** `/api/technical/tracing`

#### `POST /api/technical/tracing/forward`

**Story:** 2.17, 2.18
**Description:** Forward trace from License Plate (where did it go?)

**Request Body:**
```json
{
  "lp_number": "LP-12345"
}
```

**Response:**
```json
{
  "data": {
    "origin": {
      "lp_number": "LP-12345",
      "product": { /* product details */ },
      "quantity": 1000,
      "produced_at": "timestamp"
    },
    "descendants": [
      {
        "lp_number": "LP-12346",
        "product": { /* product details */ },
        "quantity": 950,
        "produced_at": "timestamp",
        "relationship": "consumed_in_production"
      }
    ]
  }
}
```

#### `POST /api/technical/tracing/backward`

**Story:** 2.17, 2.19
**Description:** Backward trace from License Plate (where did it come from?)

**Request Body:**
```json
{
  "lp_number": "LP-12346"
}
```

**Response:**
```json
{
  "data": {
    "target": {
      "lp_number": "LP-12346",
      "product": { /* product details */ }
    },
    "ancestors": [
      {
        "lp_number": "LP-12345",
        "product": { /* product details */ },
        "quantity_consumed": 1000,
        "relationship": "used_as_input"
      }
    ]
  }
}
```

#### `POST /api/technical/tracing/recall`

**Story:** 2.20
**Description:** Simulate recall scenario

**Request Body:**
```json
{
  "lp_number": "LP-12345",
  "reason": "Contamination detected in batch"
}
```

**Response:**
```json
{
  "data": {
    "simulation_id": "uuid",
    "affected_lps": [
      {
        "lp_number": "LP-12346",
        "product": { /* product details */ },
        "quantity": 950,
        "location": "Warehouse A",
        "status": "in_stock"
      }
    ],
    "total_affected_qty": 2850,
    "total_affected_lps": 3,
    "created_at": "timestamp"
  }
}
```

**Side Effects:**
- Creates record in `recall_simulations` table
- Does NOT actually recall products (simulation only)

---

### 15. Technical Settings API

**Base Path:** `/api/technical/settings`

#### `GET /api/technical/settings`

**Story:** 2.22
**Response:**
```json
{
  "data": {
    "product_field_config": {
      "shelf_life_days": { "visible": true, "mandatory": false },
      "min_stock_qty": { "visible": true, "mandatory": false },
      "max_stock_qty": { "visible": true, "mandatory": false },
      "reorder_point": { "visible": true, "mandatory": false },
      "cost_per_unit": { "visible": true, "mandatory": false },
      "category": { "visible": true, "mandatory": false }
    },
    "max_bom_versions": 10,
    "use_conditional_flags": false,
    "conditional_flags": [
      "organic",
      "gluten_free",
      "vegan",
      "kosher",
      "halal"
    ]
  }
}
```

#### `PUT /api/technical/settings`

**Description:** Update technical settings

**Request Body:** Partial settings object

---

### 16. Technical Dashboard APIs

**Base Path:** `/api/technical/dashboard`

#### `GET /api/technical/dashboard/products`

**Story:** 2.23
**Description:** Get product statistics

**Response:**
```json
{
  "data": {
    "total_products": 150,
    "by_type": {
      "RM": 50,
      "WIP": 20,
      "FG": 60,
      "PKG": 15,
      "BP": 5
    },
    "by_status": {
      "active": 140,
      "inactive": 8,
      "obsolete": 2
    },
    "recent_changes": [
      {
        "product_code": "RM-001",
        "product_name": "Flour - Wheat",
        "version": 1.2,
        "changed_at": "timestamp"
      }
    ]
  }
}
```

#### `GET /api/technical/dashboard/allergen-matrix`

**Story:** 2.23
**Description:** Get allergen matrix (products vs allergens)

**Response:**
```json
{
  "data": {
    "products": [
      {
        "code": "FG-001",
        "name": "White Bread",
        "allergens": {
          "GLUTEN": "contains",
          "MILK": "may_contain"
        }
      }
    ],
    "allergens": [
      { "code": "GLUTEN", "name": "Cereals containing gluten" }
    ]
  }
}
```

---

## Planning Module APIs

### 1. Suppliers API

**Base Path:** `/api/planning/suppliers`

#### `GET /api/planning/suppliers`

**Story:** 3.17
**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "SUP-001",
      "name": "ABC Ingredients",
      "email": "contact@abc.com",
      "phone": "+48 123 456 789",
      "address": "...",
      "city": "Warsaw",
      "postal_code": "00-001",
      "country": "Poland",
      "payment_terms": "NET30",
      "lead_time_days": 7,
      "status": "active",
      "org_id": "uuid"
    }
  ]
}
```

#### `POST /api/planning/suppliers`

**Request Body:**
```json
{
  "code": "SUP-001",
  "name": "ABC Ingredients",
  "email": "contact@abc.com",
  "phone": "+48 123 456 789",
  "payment_terms": "NET30",
  "lead_time_days": 7,
  "status": "active"
}
```

#### `GET /api/planning/suppliers/[id]`

**Description:** Get supplier details

#### `PUT /api/planning/suppliers/[id]`

**Description:** Update supplier

#### `DELETE /api/planning/suppliers/[id]`

**Description:** Soft delete supplier

---

### 2. Supplier Products API

**Base Path:** `/api/planning/suppliers/[id]/products`

#### `GET /api/planning/suppliers/[id]/products`

**Story:** 3.17
**Description:** Get products supplied by this supplier

**Response:**
```json
{
  "data": [
    {
      "supplier_id": "uuid",
      "product_id": "uuid",
      "product": {
        "code": "RM-001",
        "name": "Flour - Wheat"
      },
      "supplier_code": "ABC-FLOUR-001",
      "price_per_unit": 2.50,
      "currency": "PLN",
      "min_order_qty": 100,
      "lead_time_days": 7,
      "is_preferred": true
    }
  ]
}
```

#### `POST /api/planning/suppliers/[id]/products`

**Description:** Add product to supplier

#### `PUT /api/planning/suppliers/[id]/products/[product_id]`

**Description:** Update supplier product

#### `DELETE /api/planning/suppliers/[id]/products/[product_id]`

**Description:** Remove product from supplier

---

### 3. Purchase Orders API

**Base Path:** `/api/planning/purchase-orders`

#### `GET /api/planning/purchase-orders`

**Story:** 3.1
**Query Parameters:**
- `status` (optional): `draft` | `submitted` | `approved` | `rejected` | `closed`
- `supplier_id` (optional)
- `date_from` (optional)
- `date_to` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "po_number": "PO-2025-001",
      "supplier_id": "uuid",
      "supplier": {
        "code": "SUP-001",
        "name": "ABC Ingredients"
      },
      "order_date": "2025-01-15",
      "expected_delivery": "2025-01-22",
      "status": "submitted",
      "total_amount": 1250.00,
      "currency": "PLN",
      "notes": "...",
      "org_id": "uuid"
    }
  ]
}
```

#### `POST /api/planning/purchase-orders`

**Description:** Create purchase order

**Request Body:**
```json
{
  "supplier_id": "uuid",
  "order_date": "2025-01-15",
  "expected_delivery": "2025-01-22",
  "notes": "Urgent delivery"
}
```

**Auto-generation:**
- `po_number` auto-generated (e.g., PO-2025-001)

#### `GET /api/planning/purchase-orders/[id]`

**Description:** Get PO with lines

#### `PUT /api/planning/purchase-orders/[id]`

**Description:** Update PO header

#### `DELETE /api/planning/purchase-orders/[id]`

**Description:** Cancel PO (sets status to 'cancelled')

---

### 4. Purchase Order Lines API

**Base Path:** `/api/planning/purchase-orders/[id]/lines`

#### `GET /api/planning/purchase-orders/[id]/lines`

**Story:** 3.2
**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "po_id": "uuid",
      "line_number": 10,
      "product_id": "uuid",
      "product": {
        "code": "RM-001",
        "name": "Flour - Wheat"
      },
      "quantity": 500,
      "uom": "kg",
      "price_per_unit": 2.50,
      "total_price": 1250.00,
      "tax_code_id": "uuid",
      "notes": ""
    }
  ]
}
```

#### `POST /api/planning/purchase-orders/[id]/lines`

**Description:** Add line to PO

**Request Body:**
```json
{
  "product_id": "uuid",
  "quantity": 500,
  "uom": "kg",
  "price_per_unit": 2.50,
  "tax_code_id": "uuid"
}
```

**Auto-calculation:**
- `line_number` auto-incremented by 10
- `total_price` = quantity * price_per_unit

#### `PUT /api/planning/purchase-orders/[id]/lines/[lineId]`

**Description:** Update PO line

#### `DELETE /api/planning/purchase-orders/[id]/lines/[lineId]`

**Description:** Remove line from PO

---

### 5. Purchase Order Approvals API

**Base Path:** `/api/planning/purchase-orders/[id]/approvals`

#### `GET /api/planning/purchase-orders/[id]/approvals`

**Story:** 3.3
**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "po_id": "uuid",
      "approver_id": "uuid",
      "approver": {
        "name": "John Doe"
      },
      "status": "approved",
      "comments": "Approved for urgent delivery",
      "approved_at": "timestamp"
    }
  ]
}
```

#### `POST /api/planning/purchase-orders/[id]/approvals`

**Description:** Submit approval decision

**Request Body:**
```json
{
  "status": "approved",
  "comments": "Approved for urgent delivery"
}
```

**Validation:** `status` must be `approved` or `rejected`

**Side Effects:**
- If approved → PO status changes to 'approved'
- If rejected → PO status changes to 'rejected'

---

### 6. Transfer Orders API

**Base Path:** `/api/planning/transfer-orders`

#### `GET /api/planning/transfer-orders`

**Story:** 3.6
**Query Parameters:**
- `status` (optional): `draft` | `submitted` | `in_transit` | `received` | `cancelled`
- `from_warehouse_id` (optional)
- `to_warehouse_id` (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "to_number": "TO-2025-001",
      "from_warehouse_id": "uuid",
      "from_warehouse": {
        "code": "WH01",
        "name": "Main Warehouse"
      },
      "to_warehouse_id": "uuid",
      "to_warehouse": {
        "code": "WH02",
        "name": "Branch Warehouse"
      },
      "order_date": "2025-01-15",
      "expected_ship_date": "2025-01-16",
      "expected_receive_date": "2025-01-17",
      "status": "draft",
      "notes": "...",
      "org_id": "uuid"
    }
  ]
}
```

#### `POST /api/planning/transfer-orders`

**Description:** Create transfer order

#### `GET /api/planning/transfer-orders/[id]`

**Description:** Get TO with lines

#### `PUT /api/planning/transfer-orders/[id]`

**Description:** Update TO header

#### `POST /api/planning/transfer-orders/[id]/ship`

**Story:** 3.8
**Description:** Mark TO as shipped

**Side Effects:**
- Updates status to 'in_transit'
- Records actual_ship_date

#### `DELETE /api/planning/transfer-orders/[id]`

**Description:** Cancel TO

---

### 7. Transfer Order Lines API

**Base Path:** `/api/planning/transfer-orders/[id]/lines`

#### `GET /api/planning/transfer-orders/[id]/lines`

**Story:** 3.7
**Response:** Array of TO line objects

#### `POST /api/planning/transfer-orders/[id]/lines`

**Description:** Add line to TO

#### `PUT /api/planning/transfer-orders/[id]/lines/[lineId]`

**Description:** Update TO line

#### `DELETE /api/planning/transfer-orders/[id]/lines/[lineId]`

**Description:** Remove line from TO

---

### 8. Transfer Order Line LPs API

**Base Path:** `/api/planning/transfer-orders/[id]/lines/[lineId]/lps`

#### `GET /api/planning/transfer-orders/[id]/lines/[lineId]/lps`

**Story:** 3.9
**Description:** Get License Plates assigned to TO line

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "to_line_id": "uuid",
      "lp_id": "uuid",
      "lp": {
        "lp_number": "LP-12345",
        "product": { /* product details */ },
        "quantity": 500
      },
      "picked_at": "timestamp"
    }
  ]
}
```

#### `POST /api/planning/transfer-orders/[id]/lines/[lineId]/lps`

**Description:** Assign LP to TO line

**Request Body:**
```json
{
  "lp_id": "uuid"
}
```

#### `DELETE /api/planning/transfer-orders/[id]/lines/[lineId]/lps/[lpId]`

**Description:** Unassign LP from TO line

---

### 9. Planning Settings API

**Base Path:** `/api/planning/settings`

#### `GET /api/planning/settings`

**Response:**
```json
{
  "data": {
    "default_lead_time_days": 7,
    "default_payment_terms": "NET30",
    "require_po_approval": true,
    "approval_threshold_amount": 5000.00,
    "auto_generate_po_numbers": true
  }
}
```

#### `PUT /api/planning/settings`

**Description:** Update planning settings

---

## Dashboard APIs

### 1. Overview API

**Base Path:** `/api/dashboard/overview`

#### `GET /api/dashboard/overview`

**Description:** Get dashboard overview metrics

**Response:**
```json
{
  "data": {
    "total_users": 12,
    "active_users": 10,
    "total_warehouses": 3,
    "total_locations": 25,
    "total_products": 150,
    "pending_invitations": 2,
    "recent_activity_count": 45
  }
}
```

---

### 2. Activity API

**Base Path:** `/api/dashboard/activity`

#### `GET /api/dashboard/activity`

**Query Parameters:**
- `limit` (optional, default: 20)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user": {
        "name": "John Doe"
      },
      "action": "created",
      "resource_type": "warehouse",
      "resource_id": "uuid",
      "details": { /* JSONB data */ },
      "ip_address": "192.168.1.1",
      "created_at": "timestamp"
    }
  ]
}
```

---

### 3. Preferences API

**Base Path:** `/api/dashboard/preferences`

#### `GET /api/dashboard/preferences`

**Description:** Get current user's preferences

**Response:**
```json
{
  "data": {
    "theme": "light",
    "language": "en",
    "timezone": "Europe/Warsaw",
    "notifications_enabled": true
  }
}
```

#### `PUT /api/dashboard/preferences`

**Description:** Update user preferences

---

### 4. Search API

**Base Path:** `/api/dashboard/search`

#### `GET /api/dashboard/search?q=flour`

**Description:** Global search across all entities

**Response:**
```json
{
  "data": {
    "products": [
      {
        "id": "uuid",
        "type": "product",
        "code": "RM-001",
        "name": "Flour - Wheat",
        "relevance": 0.95
      }
    ],
    "warehouses": [],
    "suppliers": [],
    "total_results": 1
  }
}
```

---

## Authentication & Webhooks

### 1. Auth Callback

**Base Path:** `/api/auth/callback`

#### `GET /api/auth/callback`

**Description:** Supabase Auth callback handler

**Used for:**
- Email confirmation
- Password reset confirmation
- OAuth redirects

**Side Effects:**
- Exchanges code for session
- Redirects to dashboard or specified next URL

---

### 2. Auth Webhook

**Base Path:** `/api/webhooks/auth`

#### `POST /api/webhooks/auth`

**Description:** Supabase Auth webhook handler

**Triggers:**
- `user.created` → Create user record in public.users
- `user.updated` → Update user metadata
- `user.deleted` → Soft delete user

**Security:**
- Validates webhook signature
- Checks JWT_SECRET

---

## Cron Jobs

### 1. Cleanup Invitations

**Base Path:** `/api/cron/cleanup-invitations`

#### `GET /api/cron/cleanup-invitations`

**Description:** Expire old invitations (runs daily via Vercel Cron)

**Side Effects:**
- Sets status to 'expired' for invitations past expiration date
- Logs cleanup activity

**Security:**
- Requires Vercel Cron secret header

---

## Error Handling

All API routes follow RFC 7807 Problem Details format:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "code",
      "message": "Code must be at least 2 characters"
    }
  ],
  "status": 400
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `409` - Conflict (unique constraint violation)
- `500` - Internal Server Error

---

## Performance Considerations

### Caching Strategy

- **Redis:** Used for session blacklist, warehouse cache
- **Stale-While-Revalidate:** Applied to dashboard metrics
- **Database Indexes:** All org_id queries use composite indexes

### Pagination

Standard pagination for list endpoints:

```typescript
{
  page: number    // Default: 1
  limit: number   // Default: 50, Max: 100
  total: number   // Total count
  pages: number   // Total pages
}
```

### Rate Limiting

- **Authentication routes:** 5 requests per 15 minutes
- **Mutation routes:** 100 requests per hour
- **Query routes:** 300 requests per hour

---

## Migration Roadmap

### Completed Endpoints (Epic 1-2)

✅ All Settings Module APIs (Epic 1)
✅ Products API (Story 2.1-2.5)
✅ BOMs API (Story 2.6-2.11)
✅ Routings API (Story 2.15-2.16)
✅ Traceability API (Story 2.17-2.21)
✅ Technical Dashboard API (Story 2.23)

### In Progress (Epic 3)

🚧 Planning Module APIs
🚧 Purchase Orders
🚧 Transfer Orders

### Future Epics

⏳ Epic 4: Production Module
⏳ Epic 5: Warehouse Module
⏳ Epic 6: Quality Module

---

**End of API Contracts Documentation**
