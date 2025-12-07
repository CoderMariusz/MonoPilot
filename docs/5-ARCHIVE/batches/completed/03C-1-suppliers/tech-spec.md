# Batch 03C-1: Suppliers - Technical Specification

**Batch ID:** 03C-1
**Epic:** 3 - Planning Operations
**Stories:** 3.17-3.18
**Prerequisites:** Epic 1 (Tax Codes)
**Blocks:** Story 3.1 (PO CRUD)

---

## Overview

Supplier management with defaults (currency, tax code, payment terms) and supplier-product assignments for price inheritance.

---

## Database Schema

### Table: suppliers

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'PLN',
  tax_code_id UUID REFERENCES tax_codes(id),
  payment_terms VARCHAR(100),
  lead_time_days INTEGER DEFAULT 7,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2),
  moq NUMERIC(15,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_suppliers_org_code ON suppliers(org_id, code);
```

### Table: supplier_products

```sql
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  supplier_product_code VARCHAR(100),
  unit_price NUMERIC(15,2),
  lead_time_days INTEGER,
  moq NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_supplier_products_unique ON supplier_products(supplier_id, product_id);
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planning/suppliers` | List suppliers |
| POST | `/api/planning/suppliers` | Create supplier |
| GET | `/api/planning/suppliers/:id` | Get supplier |
| PUT | `/api/planning/suppliers/:id` | Update supplier |
| DELETE | `/api/planning/suppliers/:id` | Delete supplier |
| GET | `/api/planning/suppliers/:id/products` | Get supplier products |
| PUT | `/api/planning/suppliers/:id/products` | Assign products |

---

## Stories

| Story | Title | Points | Effort |
|-------|-------|--------|--------|
| 3.17 | Supplier Management | 5 | 4-6h |
| 3.18 | Supplier-Product Assignments | 3 | 3-4h |

**Total:** 8 points (~7-10 hours)

---

## Key Features

### Supplier Defaults
- Currency (inherited by POs)
- Tax Code (inherited by PO lines)
- Payment Terms (inherited by POs)
- Lead Time Days (for delivery estimates)
- MOQ (minimum order quantity)

### Supplier-Product Assignments
- One default supplier per product
- Override pricing per supplier
- Override lead time per supplier
- Used by Bulk PO creation for auto-grouping
