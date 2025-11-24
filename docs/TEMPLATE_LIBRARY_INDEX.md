# Template Library Index - Quick Reference

**Purpose:** Kompaktowy indeks wszystkich template'ów do szybkiego użycia podczas kodowania
**Created:** 2025-01-23
**Full Details:** Zobacz `shared-templates-library.md` dla pełnych implementacji

---

## 🎯 Quick Template Selector

**Pytanie:** Którą story implementujesz?

| Story Type | Template | File | Token Savings |
|------------|----------|------|---------------|
| CRUD (Products, BOMs, POs, etc.) | **Template A** | `shared-templates-library.md` | 8,000 |
| Line Items (PO Lines, BOM Items) | **Template B** | `shared-templates-library.md` | 7,000 |
| Settings (Module config, statuses) | **Template C** | `shared-templates-library.md` | 4,000 |
| Versioning (Product/BOM versions) | **Template D** | `shared-templates-library.md` | 5,600 |
| Traceability (Forward/Backward) | **Template E** | `shared-templates-library.md` | 8,400 |
| Unit Tests (All services) | **Template F** | `templates/template-f-test-suite-pattern.md` | 3,500 |
| Dashboards (Module dashboards) | **Template G** | `templates/template-g-dashboard-pattern.md` | 6,000 |
| Transactions (Multi-step workflow) | **Template H** | `templates/template-h-transaction-workflow.md` | 7,500 |

---

## 📚 Template A: CRUD Pattern

**Use:** 45 stories (Products, BOMs, POs, TOs, WOs, Suppliers, Warehouses, etc.)

**Pattern:**
```typescript
// 1. API Route (app/api/{module}/{resource}/route.ts)
export async function GET(request: NextRequest) {
  const result = await list{Resource}()
  return NextResponse.json({ data: result.data })
}

export async function POST(request: NextRequest) {
  const input = create{Resource}Schema.parse(body)
  const result = await create{Resource}(input)
  return NextResponse.json({ data: result.data }, { status: 201 })
}

// 2. Service (lib/services/{resource}-service.ts)
export async function create{Resource}(input: CreateInput): Promise<ServiceResult> {
  const orgId = await getCurrentOrgId()
  const supabaseAdmin = createServerSupabaseAdmin()

  // Validate uniqueness
  const { data: existing } = await supabaseAdmin
    .from('table')
    .select('id')
    .eq('org_id', orgId)
    .eq('code', input.code)
    .single()

  if (existing) return { success: false, error: 'Code exists', code: 'DUPLICATE_CODE' }

  // Insert with audit trail
  const { data, error } = await supabaseAdmin
    .from('table')
    .insert({ ...input, org_id: orgId, created_by: user.id })
    .select()
    .single()

  await invalidate{Resource}Cache(orgId)
  return { success: true, data }
}

// 3. Component (components/{resource}-form-modal.tsx)
export function {Resource}FormModal({ open, onClose, onSuccess }) {
  const form = useForm({ resolver: zodResolver(create{Resource}Schema) })

  const onSubmit = async (data) => {
    const res = await fetch('/api/{module}/{resource}', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (res.ok) {
      toast.success('{Resource} created')
      onSuccess?.()
    }
  }

  return <Dialog open={open}>...</Dialog>
}

// 4. Validation (lib/validation/{resource}-schema.ts)
export const create{Resource}Schema = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/),
  name: z.string().min(1).max(100),
  status: z.enum(['active', 'inactive']).default('active')
})
```

**Customization:** Only write entity-specific fields, validations, UI elements

---

## 📚 Template B: Line Items Pattern

**Use:** 25 stories (PO Lines, BOM Items, TO Lines, Routing Operations)

**Pattern:**
```typescript
// Parent-child relationship (PO → PO Lines, BOM → BOM Items)

// API Route (app/api/{module}/{parent}/:id/lines/route.ts)
export async function POST(request: NextRequest, { params }) {
  const parentId = params.id
  const input = create{Line}Schema.parse(body)
  const result = await add{Line}({parentId, ...input})
  return NextResponse.json({ data: result.data }, { status: 201 })
}

// Service: Validate parent + recalculate totals
export async function add{Line}({ parentId, ...input }) {
  const { data: parent } = await supabaseAdmin
    .from('{parent}_table')
    .select('id')
    .eq('id', parentId)
    .eq('org_id', orgId)
    .single()

  if (!parent) return { success: false, error: 'Parent not found' }

  const { data, error } = await supabaseAdmin
    .from('{line}_table')
    .insert({ {parent}_id: parentId, ...input })
    .select()
    .single()

  await recalculate{Parent}Totals(parentId)
  return { success: true, data }
}
```

---

## 📚 Template C: Settings Configuration

**Use:** 20 stories (Module settings, status config, field toggles)

**Pattern:**
```typescript
// JSONB settings storage in org table

// API Route
export async function GET(request: NextRequest) {
  const settings = await get{Module}Settings()
  return NextResponse.json({ data: settings.data })
}

// Service
export async function get{Module}Settings() {
  const orgId = await getCurrentOrgId()
  const { data } = await supabaseAdmin
    .from('organizations')
    .select('{module}_settings')
    .eq('id', orgId)
    .single()

  return { success: true, data: data.{module}_settings || DEFAULT_SETTINGS }
}

// Component: Accordion UI
export function {Module}SettingsPage() {
  return <Accordion type="multiple">
    <AccordionItem value="general">
      <AccordionTrigger>General Settings</AccordionTrigger>
      <AccordionContent>{/* Toggle fields */}</AccordionContent>
    </AccordionItem>
  </Accordion>
}
```

---

## 📚 Template D: Versioning Pattern

**Use:** 15 stories (Product versioning, BOM versioning)

**Pattern:**
```typescript
// Auto-increment version logic
export async function incrementVersion(currentVersion: string): string {
  const [major, minor] = currentVersion.split('.').map(Number)
  if (minor >= 9) return `${major + 1}.0`
  return `${major}.${minor + 1}`
}

// History tracking
export async function recordVersionChange({
  entity_id,
  version,
  changed_fields,
  changed_by
}) {
  await supabaseAdmin
    .from('{entity}_version_history')
    .insert({
      {entity}_id: entity_id,
      version,
      changed_fields: JSON.stringify(changed_fields),
      changed_by,
      changed_at: new Date()
    })
}
```

---

## 📚 Template E: Traceability Pattern

**Use:** 10 stories (Forward/Backward trace, Genealogy, Recall)

**Pattern:**
```typescript
// Recursive CTE queries for LP relationships

export async function forwardTrace(lpId: string) {
  const { data } = await supabaseAdmin.rpc('forward_trace', { lp_id: lpId })
  return { success: true, data: buildTree(data) }
}

// Tree visualization with ReactFlow
import ReactFlow, { Node, Edge } from 'react-flow-renderer'

export function GenealogyTree({ trace }) {
  const nodes: Node[] = trace.map(lp => ({
    id: lp.id,
    data: { label: `${lp.lp_number}\n${lp.product_name}` },
    position: calculatePosition(lp)
  }))

  const edges: Edge[] = trace.map(lp => ({
    id: `${lp.parent_id}-${lp.id}`,
    source: lp.parent_id,
    target: lp.id
  }))

  return <ReactFlow nodes={nodes} edges={edges} />
}
```

---

## 📚 Template F: Test Suite Pattern ⭐ NEW

**Use:** 80 stories (ALL service layers)

**File:** `docs/templates/template-f-test-suite-pattern.md`

**Pattern:**
```typescript
describe('{Entity}Service', () => {
  // CRUD tests
  describe('create', () => {
    it('creates with org_id scoping')
    it('validates uniqueness')
    it('handles duplicates')
  })

  // RLS tests
  describe('RLS', () => {
    it('prevents cross-org access')
    it('allows org access')
  })
})
```

**Customization:** Add entity-specific validations, FK constraints

---

## 📚 Template G: Dashboard Pattern ⭐ NEW

**Use:** 12 stories (Module dashboards)

**File:** `docs/templates/template-g-dashboard-pattern.md`

**Pattern:**
```tsx
export default function {Module}DashboardPage() {
  const { data } = useSWR('/api/{module}/dashboard', fetcher, { refreshInterval: 30000 })

  return <div>
    {/* KPI Cards */}
    <div className="grid grid-cols-4 gap-4">
      <KPICard title="KPI 1" value={data.kpis.kpi1} trend={data.kpis.kpi1_trend} />
      <KPICard title="KPI 2" value={data.kpis.kpi2} />
    </div>

    {/* Charts */}
    <ChartCard title="Chart 1">
      <BarChart data={data.charts.chart1_data} />
    </ChartCard>

    {/* Recent Activity */}
    <RecentActivityTable data={data.recent_activity} />
  </div>
}
```

**Customization:** Define KPIs, chart data queries

---

## 📚 Template H: Transaction Workflow ⭐ NEW

**Use:** 15 stories (PO→GRN→LP, WO execution, Multi-step transactions)

**File:** `docs/templates/template-h-transaction-workflow.md`

**Pattern:**
```typescript
const steps: TransactionStep[] = [
  {
    name: 'validate_parent',
    execute: async (ctx) => {
      // Validation logic
      return { success: true, data: parent }
    }
  },
  {
    name: 'create_child',
    execute: async (ctx) => {
      // Create logic
      return { success: true, data: child }
    },
    rollback: async (ctx, result) => {
      // Rollback logic
      await ctx.supabase.from('child').delete().eq('id', result.data.id)
    }
  }
]

return await executeTransaction({ steps, context: { orgId, userId, data } })
```

**Customization:** Define workflow steps, validation, rollback handlers

---

## 🔍 How to Use During Development

### Step 1: Identify Template
```bash
# Example: Story 2.1 (Product CRUD)
# → Template A (CRUD Pattern)
```

### Step 2: Load Context
```bash
/bmad:bmm:workflows:dev-story 2-1

# Context loaded:
# - Batch 0: Core Architecture
# - Epic 2: Technical Module
# - Story 2.1: Product CRUD
# - Template A: CRUD Pattern (from this index)
```

### Step 3: Implement Customizations Only
```typescript
// ❌ DON'T rewrite entire CRUD pattern
// ✅ DO write only customizations:

export const createProductSchema = z.object({
  code: z.string().regex(/^[A-Z0-9-]+$/),
  name: z.string().min(1).max(100),
  type: z.string().uuid(), // CUSTOM
  uom: z.string().min(1), // CUSTOM
  version: z.string().default('1.0'), // CUSTOM
  status: z.enum(['active', 'inactive']).default('active')
})
```

### Step 4: Add Tests (Template F)
```typescript
// Reference Template F, add custom tests
it('should set version to 1.0 on create', async () => {
  const result = await service.create({ code: 'PROD-001', name: 'Sugar' })
  expect(result.data.version).toBe('1.0')
})
```

---

## 📊 Token Savings Summary

| Template | Stories | Savings per Story | Total Savings |
|----------|---------|-------------------|---------------|
| A (CRUD) | 45 | 8,000 | 360,000 |
| B (Lines) | 25 | 7,000 | 175,000 |
| C (Settings) | 20 | 4,000 | 80,000 |
| D (Versioning) | 15 | 5,600 | 84,000 |
| E (Traceability) | 10 | 8,400 | 84,000 |
| F (Tests) | 80 | 3,500 | 280,000 |
| G (Dashboard) | 12 | 6,000 | 72,000 |
| H (Transactions) | 15 | 7,500 | 112,500 |
| **TOTAL** | **222** | **-** | **1,247,500** |

**83% token reduction across all stories!**

---

**END OF INDEX**

*For full implementations, see:*
- `shared-templates-library.md` (Templates A-E)
- `templates/template-f-test-suite-pattern.md`
- `templates/template-g-dashboard-pattern.md`
- `templates/template-h-transaction-workflow.md`
