# BOM Module Architecture

## Overview
The BOM (Bill of Materials) module is the foundation of the MonoPilot MES system, managing product definitions, component relationships, and material consumption logic.

## Data Flow Architecture

### 1. Product Creation Flow (Next.js 15 App Router)
```
Server Component → ProductsAPI → Supabase Database
     ↓
Client Component → AddItemModal → Real-time Updates
     ↓
Category Selection → Field Configuration → BOM Components → Save
```

### 2. BOM Component Flow (Server-Side Data Fetching)
```
Server Component → ProductsAPI.getAll() → Initial Data
     ↓
Client Component → Real-time Updates → Optimistic Updates
     ↓
Material Selection → Quantity/Scrap/Flags → Validation → Database Storage
```

### 3. Material Consumption Logic (Hybrid Approach)
```
Server Component → Work Orders API → Initial Data
     ↓
Client Component → Real-time Subscriptions → Live Updates
     ↓
Standard Consumption vs One-to-One LP → Scanner Terminal → Stock Moves
```

## Next.js 15 Integration Patterns

### Server Components for Data Fetching
```typescript
// app/technical/bom/page.tsx (Server Component)
import { ProductsAPI } from '@/lib/api/products'

export default async function BOMPage() {
  // Server-side data fetching with caching
  const meatProducts = await ProductsAPI.getByCategory('MEAT')
  const dryGoodsProducts = await ProductsAPI.getByCategory('DRYGOODS')
  const finishedGoodsProducts = await ProductsAPI.getByCategory('FINISHED_GOODS')
  const processProducts = await ProductsAPI.getByCategory('PROCESS')
  
  return (
    <BomCatalogClient 
      initialData={{
        meat: meatProducts,
        dryGoods: dryGoodsProducts,
        finishedGoods: finishedGoodsProducts,
        process: processProducts
      }}
    />
  )
}
```

### Client Components for Interactivity
```typescript
// components/BomCatalogClient.tsx (Client Component)
'use client'

import { useState } from 'react'
import { ProductsAPI } from '@/lib/api/products'

export default function BomCatalogClient({ initialData }) {
  const [products, setProducts] = useState(initialData)
  
  const handleProductCreate = async (productData) => {
    try {
      const newProduct = await ProductsAPI.create(productData)
      setProducts(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], newProduct]
      }))
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }
  
  return <ProductsTable products={products} onProductCreate={handleProductCreate} />
}
```

### Supabase Integration
```typescript
// lib/api/products.ts
import { supabase } from '@/lib/supabase/client'

export class ProductsAPI {
  static async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        bom_items(
          *,
          material:products(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      throw new Error('Failed to fetch products')
    }

    return data || []
  }
}
```

## Product Categorization System

### Category Logic
Products are categorized based on their `part_number` patterns and assigned to appropriate `product_group` and `product_type`:

```typescript
// MEAT products
if (partNumber.startsWith('RM-BEEF-') || partNumber.startsWith('RM-PORK-') || 
    partNumber.startsWith('RM-LAMB-') || partNumber.startsWith('RM-CHICKEN-')) {
  product_group = 'MEAT'
  product_type = 'RM_MEAT'
}

// DRYGOODS - Ingredients
if (partNumber.startsWith('RM-SALT-') || partNumber.startsWith('RM-PEPPER-') || 
    partNumber.startsWith('RM-SPICE-') || partNumber.startsWith('RM-ONION-') || 
    partNumber.startsWith('RM-GARLIC-') || partNumber.startsWith('RM-FAT-')) {
  product_group = 'DRYGOODS'
  product_type = 'DG_ING'
}

// DRYGOODS - Casings
if (partNumber.startsWith('RM-CASING-')) {
  product_group = 'DRYGOODS'
  product_type = 'DG_WEB'
}

// DRYGOODS - Labels
if (partNumber.startsWith('RM-PAPER-')) {
  product_group = 'DRYGOODS'
  product_type = 'DG_LABEL'
}

// PROCESS products
if (partNumber.startsWith('PR-')) {
  product_group = 'COMPOSITE'
  product_type = 'PR'
}

// FINISHED_GOODS products
if (partNumber.startsWith('FG-')) {
  product_group = 'COMPOSITE'
  product_type = 'FG'
}
```

## Product Type Hierarchy

### Raw Materials (RM)
- **MEAT**: Raw meat products (beef, pork, lamb, chicken)
  - `product_group = 'MEAT'`, `product_type = 'RM_MEAT'`
  - Features: Supplier required, expiry policies, allergen tracking
- **DRYGOODS**: Ingredients, packaging, labels, casings
  - `product_group = 'DRYGOODS'`, `product_type = 'DG_ING'` (ingredients)
  - `product_group = 'DRYGOODS'`, `product_type = 'DG_LABEL'` (labels/paper)
  - `product_group = 'DRYGOODS'`, `product_type = 'DG_WEB'` (casings/webs)
  - `product_group = 'DRYGOODS'`, `product_type = 'DG_BOX'` (packaging boxes)
  - `product_group = 'DRYGOODS'`, `product_type = 'DG_SAUCE'` (sauces)
  - Features: Supplier required, expiry policies, allergen tracking

### Processed Products (PR)
- **PROCESS**: Intermediate products
  - `product_group = 'COMPOSITE'`, `product_type = 'PR'`
  - Features: BOM required, fixed expiry policy, production lines

### Finished Goods (FG)
- **FINISHED_GOODS**: Final products
  - `product_group = 'COMPOSITE'`, `product_type = 'FG'`
  - Features: Complex BOM, production rates, line-specific settings

## BOM Component Types

### Standard Components
- **Quantity-based**: Consume based on calculated quantity
- **Scrap handling**: Account for material loss
- **Production lines**: Restrict to specific lines

### Special Components
- **Optional**: Can be omitted from production
- **Phantom**: Not physically present, used for costing
- **One-to-One**: Consume entire LP regardless of quantity

## LP Consumption Modes

### Standard Mode
```
LP: 500kg Meat
BOM: 0.5kg per unit
Production: 100 units
Consumption: 50kg (0.5 × 100)
Remaining: 450kg
```

### One-to-One Mode
```
LP: 500kg Meat
BOM: 0.5kg per unit (one_to_one = true)
Production: 100 units
Consumption: 500kg (entire LP)
Remaining: 0kg
```

## Allergen Inheritance

### Automatic Inheritance
```
Component A: Allergens [Nuts, Dairy]
Component B: Allergens [Soy]
Product: Inherits [Nuts, Dairy, Soy]
```

### Manual Override
```
Product: Inherits [Nuts, Dairy, Soy]
User: Suppresses [Dairy]
Result: [Nuts, Soy]
```

## Production Line Integration

### Line-Specific BOM
```
Product: Pizza
Line 1: Standard BOM
Line 2: Premium BOM (extra cheese)
Line 3: Vegan BOM (no dairy)
```

### Line Restrictions
```
Component: Premium Cheese
Restrictions: [Line 2, Line 3]
Result: Not available on Line 1
```

## Database Relationships

### Core Tables
- `products`: Product definitions
- `bom`: BOM versions
- `bom_items`: BOM components
- `wo_materials`: Work order BOM snapshots

### Key Relationships
```
products (1) ←→ (many) bom
bom (1) ←→ (many) bom_items
bom_items (many) ←→ (1) products (materials)
wo_materials (many) ←→ (1) bom_items
```

## API Endpoints

### Products API
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### BOM API
- `GET /api/products/:id/bom` - Get product BOM
- `POST /api/products/:id/bom` - Create/update BOM
- `DELETE /api/products/:id/bom` - Delete BOM

## Error Handling

### Validation Errors
- Required fields missing
- Invalid product types
- BOM component validation
- Allergen conflicts

### Business Logic Errors
- Circular BOM references
- Invalid material combinations
- Production line conflicts
- Cost calculation errors

## Performance Considerations

### Database Indexes
- `idx_products_product_group` - Product group-based queries
- `idx_products_product_type` - Product type-based queries
- `idx_bom_items_bom_id` - BOM component lookups
- `idx_bom_items_material_id` - Material usage tracking

### Caching Strategy
- Product data caching
- BOM structure caching
- Allergen inheritance caching

## Security Considerations

### Access Control
- Role-based permissions
- Product category restrictions
- BOM modification audit trail

### Data Integrity
- Foreign key constraints
- BOM validation rules
- Material availability checks

## Integration Points

### Planning Module
- BOM → Work Order creation
- Material requirement calculation
- Production scheduling

### Production Module
- BOM → Material consumption
- Scanner integration
- Yield tracking

### Warehouse Module
- Material availability
- LP management
- Stock movements

## Future Enhancements

### Planned Features
- BOM versioning
- Cost rollup calculations
- Supplier integration
- Quality specifications
- Regulatory compliance

### Scalability
- Multi-plant support
- International standards
- Advanced routing
- AI-powered optimization
