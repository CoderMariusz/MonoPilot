# Database Schema Documentation

## Overview
MonoPilot uses Supabase (PostgreSQL) as its database backend. The schema is designed for a Manufacturing Execution System (MES) with comprehensive support for production planning, warehouse management, and quality control.

## Database Configuration
- **Platform**: Supabase (PostgreSQL)
- **Extensions**: uuid-ossp
- **Security**: Row Level Security (RLS) enabled
- **Authentication**: Supabase Auth integration

## Core Tables

### Users & Authentication
```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Operator', 'Planner', 'Technical', 'Purchasing', 'Warehouse', 'QC', 'Admin')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);
```

### Sessions Management
```sql
-- Sessions table
CREATE TABLE public.sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  user_name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  location TEXT NOT NULL,
  device TEXT NOT NULL,
  user_agent TEXT,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Production Management

### Products & Taxonomy
```sql
-- Products table with enhanced taxonomy
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('RM', 'PR', 'FG', 'WIP')),
  uom TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category TEXT CHECK (category IN ('MEAT', 'DRYGOODS', 'FINISHED_GOODS', 'PROCESS')),
  subtype TEXT,
  expiry_policy TEXT CHECK (expiry_policy IN ('DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE', 'FROM_CREATION_DATE')),
  shelf_life_days INTEGER,
  std_price DECIMAL(12,4),
  allergen_ids INTEGER[],
  rate DECIMAL(10,2),
  production_lines TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);
```

### Bill of Materials (BOM)
```sql
-- BOM table
CREATE TABLE public.bom (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES public.products(id) NOT NULL,
  version TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- BOM Items table
CREATE TABLE public.bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER REFERENCES public.bom(id) NOT NULL,
  material_id INTEGER REFERENCES public.products(id) NOT NULL,
  quantity DECIMAL(10,4) NOT NULL,
  uom TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  priority INTEGER,
  production_lines TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Work Orders
```sql
-- Work Orders table
CREATE TABLE public.work_orders (
  id SERIAL PRIMARY KEY,
  wo_number TEXT NOT NULL UNIQUE,
  product_id INTEGER REFERENCES public.products(id) NOT NULL,
  quantity DECIMAL(10,4) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'released', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  machine_id INTEGER REFERENCES public.machines(id),
  line_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);
```

## Warehouse Management

### Locations & Machines
```sql
-- Locations table
CREATE TABLE public.locations (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  zone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Machines table
CREATE TABLE public.machines (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);
```

### License Plates & Stock Management
```sql
-- License Plates table
CREATE TABLE public.license_plates (
  id SERIAL PRIMARY KEY,
  lp_number TEXT NOT NULL UNIQUE,
  product_id INTEGER REFERENCES public.products(id) NOT NULL,
  location_id INTEGER REFERENCES public.locations(id) NOT NULL,
  quantity DECIMAL(10,4) NOT NULL,
  qa_status TEXT NOT NULL CHECK (qa_status IN ('Pending', 'Passed', 'Failed', 'Quarantine')),
  grn_id INTEGER REFERENCES public.grn(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Stock Moves table
CREATE TABLE public.stock_moves (
  id SERIAL PRIMARY KEY,
  move_number TEXT NOT NULL UNIQUE,
  lp_id INTEGER REFERENCES public.license_plates(id) NOT NULL,
  from_location_id INTEGER REFERENCES public.locations(id),
  to_location_id INTEGER REFERENCES public.locations(id),
  quantity DECIMAL(10,4) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'completed', 'cancelled')),
  move_date TIMESTAMP WITH TIME ZONE,
  wo_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);
```

## Procurement & Receiving

### Purchase Orders
```sql
-- Purchase Orders table
CREATE TABLE public.purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'confirmed', 'received', 'cancelled', 'closed')),
  due_date TIMESTAMP WITH TIME ZONE,
  warehouse_id INTEGER REFERENCES public.locations(id),
  request_delivery_date TIMESTAMP WITH TIME ZONE,
  expected_delivery_date TIMESTAMP WITH TIME ZONE,
  buyer TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Purchase Order Items table
CREATE TABLE public.purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER REFERENCES public.purchase_orders(id) NOT NULL,
  product_id INTEGER REFERENCES public.products(id) NOT NULL,
  quantity DECIMAL(10,4) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Goods Receipt Notes (GRN)
```sql
-- GRN table
CREATE TABLE public.grn (
  id SERIAL PRIMARY KEY,
  grn_number TEXT NOT NULL UNIQUE,
  po_id INTEGER REFERENCES public.purchase_orders(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'completed', 'cancelled')),
  received_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- GRN Items table
CREATE TABLE public.grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER REFERENCES public.grn(id) NOT NULL,
  product_id INTEGER REFERENCES public.products(id) NOT NULL,
  quantity_ordered DECIMAL(10,4) NOT NULL,
  quantity_received DECIMAL(10,4) NOT NULL,
  location_id INTEGER REFERENCES public.locations(id) NOT NULL,
  lp_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Transfer Management

### Transfer Orders
```sql
-- Transfer Orders table
CREATE TABLE public.transfer_orders (
  id SERIAL PRIMARY KEY,
  to_number TEXT NOT NULL UNIQUE,
  from_location_id INTEGER REFERENCES public.locations(id) NOT NULL,
  to_location_id INTEGER REFERENCES public.locations(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'in_transit', 'received', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

-- Transfer Order Items table
CREATE TABLE public.transfer_order_items (
  id SERIAL PRIMARY KEY,
  transfer_order_id INTEGER REFERENCES public.transfer_orders(id) NOT NULL,
  product_id INTEGER REFERENCES public.products(id) NOT NULL,
  quantity DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Quality Control & Allergens

### Allergens Management
```sql
-- Allergens table
CREATE TABLE public.allergens (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);
```

## System Configuration

### Settings
```sql
-- Settings table
CREATE TABLE public.settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Default Settings
```sql
INSERT INTO public.settings (key, value) VALUES 
('general', '{"company_name": "Forza MES", "timezone": "UTC", "date_format": "YYYY-MM-DD", "currency": "USD"}'),
('production', '{"default_lp_prefix": "LP", "wo_number_format": "WO-{YYYY}-{MM}-{####}", "auto_complete_wos": false}'),
('warehouse', '{"default_location_id": null, "qa_required": true, "lp_split_allowed": true}'),
('notifications', '{"email_notifications": true, "low_stock_alerts": true, "threshold_quantity": 10}');
```

## Performance Indexes

### Core Indexes
```sql
-- Work Orders indexes
CREATE INDEX idx_work_orders_product_id ON public.work_orders(product_id);
CREATE INDEX idx_work_orders_status ON public.work_orders(status);
CREATE INDEX idx_work_orders_machine_id ON public.work_orders(machine_id);

-- Purchase Orders indexes
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);

-- License Plates indexes
CREATE INDEX idx_license_plates_product_id ON public.license_plates(product_id);
CREATE INDEX idx_license_plates_location_id ON public.license_plates(location_id);
CREATE INDEX idx_license_plates_qa_status ON public.license_plates(qa_status);

-- BOM indexes
CREATE INDEX idx_bom_items_bom_id ON public.bom_items(bom_id);
CREATE INDEX idx_bom_items_material_id ON public.bom_items(material_id);
```

## Security & Access Control

### Row Level Security (RLS)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_plates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_moves ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);
```

## Data Relationships

### Core Relationships
1. **Users** → **Sessions** (1:many)
2. **Products** → **BOM** (1:many)
3. **BOM** → **BOM Items** (1:many)
4. **Products** → **Work Orders** (1:many)
5. **Products** → **License Plates** (1:many)
6. **Purchase Orders** → **Purchase Order Items** (1:many)
7. **Purchase Orders** → **GRN** (1:many)
8. **GRN** → **GRN Items** (1:many)
9. **Transfer Orders** → **Transfer Order Items** (1:many)
10. **License Plates** → **Stock Moves** (1:many)

### Foreign Key Constraints
- All foreign keys properly defined
- Cascade rules for data integrity
- Referential integrity maintained

## Migration History

### Migration Files
1. **001_planning_tables.sql**: Core planning tables
2. **002_rls_policies.sql**: Row Level Security policies
3. **003_phase14_schema.sql**: Phase 14 schema updates
4. **004_phase14_rpc_functions.sql**: RPC functions
5. **005_product_taxonomy_enums.sql**: Product taxonomy
6. **006_tax_allergens.sql**: Tax and allergen tables
7. **007_supplier_products.sql**: Supplier product relationships
8. **008_bom_routing.sql**: BOM and routing tables
9. **009_routing_requirements.sql**: Routing requirements

## Data Types & Constraints

### Common Data Types
- **UUID**: User IDs and references
- **SERIAL**: Auto-incrementing primary keys
- **TEXT**: String data with length constraints
- **DECIMAL**: Monetary and quantity values
- **TIMESTAMP WITH TIME ZONE**: All date/time fields
- **BOOLEAN**: Status flags
- **JSONB**: Complex configuration data

### Check Constraints
- **Status fields**: Enumerated values
- **Role fields**: Valid role types
- **QA status**: Quality control states
- **Product types**: Valid product categories

## Database Best Practices

### Naming Conventions
- **Tables**: snake_case (e.g., `work_orders`)
- **Columns**: snake_case (e.g., `created_at`)
- **Indexes**: `idx_[table]_[column]`
- **Constraints**: Descriptive names

### Data Integrity
- **Primary Keys**: All tables have proper primary keys
- **Foreign Keys**: All relationships properly defined
- **Unique Constraints**: Business-critical fields
- **Check Constraints**: Data validation at database level

### Performance Considerations
- **Indexes**: Strategic indexing for common queries
- **Partitioning**: Consider for large tables
- **Archiving**: Historical data management
- **Monitoring**: Query performance tracking
