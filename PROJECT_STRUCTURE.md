# MonoPilot Project Structure

## Overview
MonoPilot is a Manufacturing Execution System (MES) built as a monorepo using pnpm workspaces. The project consists of a Next.js 15 frontend application with Supabase backend integration.

## Monorepo Architecture

### Root Configuration
- **Package Manager**: pnpm (>=8.0.0)
- **Node.js**: >=20.0.0
- **Workspace Structure**: pnpm workspaces with `apps/*` and `packages/*`

### Directory Structure
```
MonoPilot/
├── apps/
│   └── frontend/                 # Next.js 15 application
├── packages/
│   └── shared/                   # Shared types and schemas
├── infra/                        # Docker and nginx configuration
├── attached_assets/              # Project documentation and context
├── package.json                 # Root workspace configuration
├── pnpm-workspace.yaml          # pnpm workspace configuration
└── vercel.json                  # Vercel deployment configuration
```

## Frontend Application (apps/frontend)

### Technology Stack
- **Framework**: Next.js 15.5.4
- **React**: 19.0.0
- **TypeScript**: 5.7.2
- **Styling**: Tailwind CSS 3.4.17
- **Database**: Supabase (PostgreSQL)
- **State Management**: SWR 2.2.6
- **Authentication**: Supabase Auth
- **Icons**: Lucide React 0.469.0

### Application Structure
```
apps/frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── signup/
│   ├── api/                      # API routes
│   │   └── health/
│   ├── admin/                    # Admin module
│   ├── planning/                 # Planning module
│   ├── production/               # Production module
│   ├── scanner/                  # Scanner terminals
│   │   ├── pack/                 # Pack terminal
│   │   └── process/              # Process terminal
│   ├── settings/                 # Settings module
│   ├── technical/                # Technical module
│   │   └── bom/                  # BOM management
│   └── warehouse/                # Warehouse module
├── components/                   # React components
│   ├── layout/                   # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── lazy/                     # Lazy-loaded components
│   └── [Module]Table.tsx         # Data table components
├── lib/                          # Library code
│   ├── api/                      # API layer
│   ├── auth/                     # Authentication
│   ├── supabase/                 # Database configuration
│   │   ├── migrations/           # Database migrations
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── types.ts                  # TypeScript definitions
│   ├── mockData.ts               # Mock data for development
│   └── clientState.ts            # Client state management
└── middleware.ts                 # Next.js middleware
```

## Component Organization

### Layout Components
- **AppLayout.tsx**: Main application layout wrapper
- **Sidebar.tsx**: Navigation sidebar with role-based menu
- **Topbar.tsx**: Top navigation bar with user info

### Data Table Components
Each module has corresponding table components:
- **WorkOrdersTable.tsx**: Work order management
- **PurchaseOrdersTable.tsx**: Purchase order management
- **TransferOrdersTable.tsx**: Transfer order management
- **GRNTable.tsx**: Goods receipt notes
- **StockMoveTable.tsx**: Stock movement tracking
- **LicensePlatesTable.tsx**: License plate management
- **UsersTable.tsx**: User management
- **SuppliersTable.tsx**: Supplier management
- **WarehousesTable.tsx**: Warehouse management
- **LocationsTable.tsx**: Location management
- **MachinesTable.tsx**: Machine management
- **AllergensTable.tsx**: Allergen management
- **TaxCodesTable.tsx**: Tax code management
- **RoutingsTable.tsx**: Routing management
- **SessionsTable.tsx**: Session management

### Modal Components
- **Create[Entity]Modal.tsx**: Creation modals
- **Edit[Entity]Modal.tsx**: Edit modals
- **[Entity]DetailsModal.tsx**: Detail view modals
- **LazyModal.tsx**: Lazy-loaded modal wrapper

## API Layer Structure

### API Configuration
- **config.ts**: API configuration and environment detection
- **index.ts**: API exports and initialization

### Module-Specific APIs
- **workOrders.ts**: Work order operations
- **purchaseOrders.ts**: Purchase order operations
- **transferOrders.ts**: Transfer order operations
- **suppliers.ts**: Supplier management
- **warehouses.ts**: Warehouse operations
- **users.ts**: User management
- **routings.ts**: Routing operations
- **supplierProducts.ts**: Supplier product management
- **taxCodes.ts**: Tax code operations
- **asns.ts**: Advanced shipping notices

### API Pattern
```typescript
export class [Entity]API {
  static async getAll(): Promise<[Entity][]> {
    if (shouldUseMockData()) {
      return mock[Entity]s;
    }
    // Supabase implementation
  }
  
  static async create(data: Create[Entity]Data): Promise<[Entity]> {
    // Implementation
  }
  
  static async update(id: string, data: Update[Entity]Data): Promise<[Entity]> {
    // Implementation
  }
  
  static async delete(id: string): Promise<void> {
    // Implementation
  }
}
```

## Authentication & Authorization

### Auth Structure
- **AuthContext.tsx**: React context for authentication state
- **roleRedirect.ts**: Role-based routing logic
- **middleware.ts**: Next.js middleware for route protection

### User Roles
- **Admin**: Full system access
- **Planner**: Production planning access
- **Operator**: Production operations
- **Technical**: Technical configuration
- **Purchasing**: Purchase order management
- **Warehouse**: Warehouse operations
- **QC**: Quality control operations

## Database Integration

### Supabase Configuration
- **client.ts**: Browser client configuration
- **server.ts**: Server-side client configuration
- **middleware.ts**: Authentication middleware

### Migration Files
- **001_planning_tables.sql**: Core planning tables
- **002_rls_policies.sql**: Row Level Security policies
- **003_phase14_schema.sql**: Phase 14 schema updates
- **004_phase14_rpc_functions.sql**: RPC functions
- **005_product_taxonomy_enums.sql**: Product taxonomy
- **006_tax_allergens.sql**: Tax and allergen tables
- **007_supplier_products.sql**: Supplier product relationships
- **008_bom_routing.sql**: BOM and routing tables
- **009_routing_requirements.sql**: Routing requirements

## Module Structure

### Planning Module (`/planning`)
- Work order management
- Production scheduling
- Resource planning

### Production Module (`/production`)
- Production line management
- Work order execution
- Production tracking

### Warehouse Module (`/warehouse`)
- License plate management
- Stock movement tracking
- Inventory management

### Scanner Module (`/scanner`)
- **Pack Terminal** (`/scanner/pack`): Packing operations
- **Process Terminal** (`/scanner/process`): Processing operations
- Material consumption tracking
- Staged LP management

### Settings Module (`/settings`)
- System configuration
- User management
- Company settings

### Technical Module (`/technical`)
- **BOM Management** (`/technical/bom`): Bill of Materials
- Routing configuration
- Product taxonomy

## Configuration Files

### Build Configuration
- **next.config.ts**: Next.js configuration
- **tsconfig.json**: TypeScript configuration
- **tailwind.config.ts**: Tailwind CSS configuration
- **postcss.config.mjs**: PostCSS configuration

### Deployment Configuration
- **vercel.json**: Vercel deployment settings
- **middleware.ts**: Route protection middleware

### Development Configuration
- **package.json**: Dependencies and scripts
- **pnpm-lock.yaml**: Lock file for dependencies
- **.gitignore**: Git ignore patterns

## Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Deployment
- **Platform**: Vercel
- **URL**: https://frontend-2qtrziyrz-codermariuszs-projects.vercel.app
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## Key Features

### Real-time Updates
- SWR for data fetching and caching
- Real-time database updates via Supabase

### Role-based Access
- Middleware-based route protection
- Component-level permission checks

### Responsive Design
- Tailwind CSS for styling
- Mobile-first responsive design

### Type Safety
- Full TypeScript implementation
- Shared type definitions
- Runtime type validation with Zod

## Development Notes

### Mock Data
- Comprehensive mock data for development
- Environment-based switching between mock and real data
- Mock data includes all entity types with relationships

### State Management
- SWR for server state
- React Context for authentication
- Local state with React hooks

### Performance
- Lazy loading for modals and heavy components
- Optimized bundle with Next.js
- Efficient data fetching patterns
