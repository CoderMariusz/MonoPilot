# Technical Reference

> Consolidated technical documentation for MonoPilot
> Last Updated: 2026-02-10
> Database: 65 tables verified | TypeScript: Strict mode enabled

---

## Quick Links
- **Database Schema**: See section below
- **Code Patterns**: See Code Patterns section
- **Module Organization**: See Module Index section
- **API Endpoints**: See routes in `apps/frontend/app/api/`

---

## Database Schema Overview

**Total Tables:** 65
**RLS Enabled:** 60 tables  
**Status:** ✅ Verified against 131 active migrations

### Core Tables by Module

#### Settings Module (Epic 1)
- **organizations** - Multi-tenant org master records
- **users** - User accounts with role-based access
- **roles** - Role definitions (owner, admin, manager, operator, viewer)
- **user_invitations** - Pending user invitations
- **allergens** - Allergen definitions (FDA 14 + EU 14)
- **tax_codes** - Tax codes per organization
- **product_types** - Product categorization
- **user_org_context** - User-org relationships with role info

#### Technical Module (Epic 2)
- **products** - Product master with SKU, UOM, costing
- **product_allergens** - Product-allergen mappings
- **boms** (bill_of_materials) - Product composition
- **bom_items** - BOM line items with quantities
- **routings** - Production routing sequences
- **routing_steps** - Routing step details

#### Planning Module (Epic 3)
- **forecast_headers** - Demand forecast master
- **forecast_lines** - Forecast detail lines
- **mrp_orders** - Material requirement planning orders
- **purchase_orders** - Supplier purchase orders  
- **purchase_order_items** - PO line items
- **work_orders** - Production work orders
- **work_order_items** - WO line items
- **planning_calendar** - Planning period definitions

#### Production Module (Epic 4)
- **batch_headers** - Production batch master
- **batch_details** - Batch line details
- **batch_operations** - Batch operation records
- **quality_holds** - Quality check holds
- **production_runs** - Production execution records

#### Warehouse Module (Epic 5)
- **warehouses** - Physical warehouse locations
- **locations** - Warehouse bin locations
- **machines** - Equipment/machines
- **production_lines** - Production line definitions
- **production_line_machines** - Line-to-machine mappings
- **license_plates** - Inventory unit identifiers
- **inventory** - Current stock levels
- **inventory_movements** - Stock transaction log

#### Quality Module (Epic 6)
- **quality_tests** - Test definitions
- **quality_test_results** - Test execution results
- **quality_alerts** - Quality anomaly alerts
- **quality_holds** - Hold status tracking

#### Shipping Module (Epic 7)
- **shipments** - Outbound shipment records
- **shipment_items** - Shipment line items
- **shipment_documents** - Shipping documentation
- **shipping_labels** - Label printing records

#### Common Tables
- **audit_log** - System audit trail
- **organization_modules** - Module enablement per org
- **webhooks** - Integration webhooks
- **webhook_logs** - Webhook execution logs

---

## Module Index

Quick reference for finding implementation guidance.

### Planning Phase Agents
| Agent | Primary Use | File Location |
|-------|-------------|---------------|
| RESEARCH-AGENT | Requirements discovery | `.claude/agents/planning/` |
| PM-AGENT | Product requirements | `.claude/agents/planning/` |
| UX-DESIGNER | User experience design | `.claude/agents/planning/` |
| ARCHITECT-AGENT | System architecture | `.claude/agents/planning/` |

### Development Phase Agents
| Agent | Primary Use | File Location |
|-------|-------------|---------------|
| TEST-ENGINEER | Test strategy & design | `.claude/agents/development/` |
| BACKEND-DEV | Backend implementation | `.claude/agents/development/` |
| FRONTEND-DEV | Frontend implementation | `.claude/agents/development/` |
| SENIOR-DEV | Complex refactoring | `.claude/agents/development/` |

### Quality Assurance Agents
| Agent | Primary Use | File Location |
|-------|-------------|---------------|
| CODE-REVIEWER | Code review & approval | `.claude/agents/quality/` |
| QA-AGENT | Manual testing & validation | `.claude/agents/quality/` |
| TECH-WRITER | Documentation | `.claude/agents/quality/` |

### Workflows
| Workflow | Purpose | File Location |
|----------|---------|---------------|
| EPIC-WORKFLOW | Feature epic delivery | `.claude/workflows/` |
| STORY-WORKFLOW | Story implementation | `.claude/workflows/` |
| BUG-WORKFLOW | Bug fix process | `.claude/workflows/` |
| SPRINT-WORKFLOW | Sprint management | `.claude/workflows/` |

---

## Code Patterns

### Naming Conventions
- **Files**: `kebab-case.md` or `kebab-case.ts`
- **Agents/Roles**: `UPPER-CASE.md`
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **SQL**: snake_case for columns, PascalCase for types

### File Organization

#### React Components
```
component/
  ├── index.ts           # Main export
  ├── component.tsx      # Implementation
  ├── component.test.tsx # Tests
  ├── types.ts           # Component types
  ├── hooks.ts           # Custom hooks
  └── utils.ts           # Helper functions
```

#### Backend Routes
```
app/api/v1/feature/
  ├── route.ts           # GET, POST, PUT, DELETE
  ├── __tests__/route.test.ts
  └── types.ts           # Request/response types
```

#### Database Migrations
```
supabase/migrations/
  ├── 001_create_table.sql
  ├── 002_add_columns.sql
  └── 003_rls_policies.sql
```

### TypeScript Patterns

#### Type Definitions
```typescript
// API Request/Response
interface CreateUserRequest {
  email: string
  name: string
  role_code: string
}

interface UserResponse extends CreateUserRequest {
  id: string
  created_at: string
}

// Database Models
type User = Database['public']['Tables']['users']['Row']
type InsertUser = Database['public']['Tables']['users']['Insert']
```

#### Service Layer
```typescript
// Service pattern: thin wrapper around Supabase
export const UserService = {
  async list(orgId: string) {
    return supabase
      .from('users')
      .select('*')
      .eq('org_id', orgId)
  },
  
  async create(data: InsertUser) {
    return supabase.from('users').insert(data).select()
  }
}
```

#### Component Patterns
```typescript
// Server Component (data fetching)
export default async function UsersPage() {
  const users = await UserService.list(orgId)
  return <UsersList users={users} />
}

// Client Component (interactivity)
'use client'
export function UserForm() {
  const [loading, setLoading] = useState(false)
  // Event handlers here
}
```

### Documentation Patterns

#### Markdown Structure
```markdown
# Title (H1) - One per document
> Context line if needed

## Section (H2)
Brief intro paragraph.

### Subsection (H3)
Details with examples.

#### Code Examples (H4)
```

#### Tables
```markdown
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | UUID | YES | Primary key |
| name | TEXT | YES | Display name |
```

#### Status Updates
```markdown
**Status:** In Progress | Blocked | Complete
**Progress:** 65%
**Next:** Step 2 - Implementation
**Blocker:** (if any)
```

#### Handoff Format
```markdown
**From:** Agent X
**To:** Agent Y
**What:** Description of artifact
**Context:** Key decisions/assumptions
**Dependencies:** (if any)
```

---

## API Endpoint Patterns

### Naming Convention
```
GET    /api/v1/{module}/{resource}           - List
GET    /api/v1/{module}/{resource}/{id}      - Read
POST   /api/v1/{module}/{resource}           - Create
PUT    /api/v1/{module}/{resource}/{id}      - Update
DELETE /api/v1/{module}/{resource}/{id}      - Delete
```

### Response Format
```typescript
// Success (200)
{
  "success": true,
  "data": { /* resource */ },
  "meta": { "count": 10, "page": 1 }
}

// Error (4xx/5xx)
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": { /* optional */ }
}
```

### Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (auth required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate key, etc)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

---

## Testing Patterns

### Unit Tests (Jest)
```typescript
describe('UserService', () => {
  it('should create user with valid data', async () => {
    const user = await UserService.create({ email: 'test@example.com' })
    expect(user.email).toBe('test@example.com')
  })
})
```

### E2E Tests (Playwright)
```typescript
test('user can create new item', async ({ page }) => {
  await page.goto('/dashboard')
  await page.click('button:has-text("New Item")')
  await page.fill('input[name="title"]', 'Test Item')
  await page.click('button:has-text("Create")')
  await expect(page.locator('text=Test Item')).toBeVisible()
})
```

### Naming Convention
- Unit: `{feature}.test.ts` or `{feature}.unit.test.ts`
- E2E: `e2e/tests/{module}/{feature}.spec.ts`
- Coverage: Target 80%+ for business logic

---

## Styling Patterns

### Tailwind CSS Organization
```tsx
// Component structure
<div className={cn(
  "base classes spacing",      // Layout
  "border-color bg-color",      // Vision
  "hover:bg-color transition",  // Interaction
  className                     // Overrides
)}>
```

### Responsive Design
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          // mobile:  1 col
          // tablet:  2 cols
          // desktop: 3 cols
```

---

## Performance Considerations

### Frontend
- **Code splitting:** Use Next.js dynamic imports
- **Images:** Use Next.js Image component with sizes
- **Data fetching:** Use React Query for caching
- **Rendering:** Memoize expensive components

### Backend
- **Database**: Add indexes for frequently queried columns
- **Caching:** Redis for session/temporary data
- **RLS:** Min 100ms query time impact acceptable
- **Pagination:** Always paginate large result sets

---

## Security Checklist

- [ ] RLS policies enabled on all data tables
- [ ] API endpoints validate user org_id
- [ ] Sensitive data never logged
- [ ] CORS headers properly configured
- [ ] Auth tokens in secure HTTP-only cookies
- [ ] Passwords hashed with Supabase Auth
- [ ] Rate limiting on auth endpoints
- [ ] SQL injection impossible (use parameterized queries)

---

## References

For detailed docs, see:
- **Architecture**: `docs/1-BASELINE/architecture/`
- **Module Specs**: `docs/2-MANAGEMENT/specs/`
- **API Schema**: `TECHNICAL_API_SCHEMA.md`
- **Skills**: `.claude/skills/` for domain-specific patterns
