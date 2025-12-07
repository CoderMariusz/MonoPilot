# Template System Guide - MonoPilot

**Created:** 2025-01-23
**Purpose:** Complete guide to dual-template system for context AND code generation

---

## 🎯 Overview: 2 Template Systems

MonoPilot używa **dual-purpose template system**:

```
┌──────────────────────────────────────────────────────────────┐
│                   DUAL TEMPLATE SYSTEM                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1️⃣ CONTEXT TEMPLATES (FOR AI)                               │
│     → Ładowane z story jako kontekst                         │
│     → Markdown + opisy + przykłady                           │
│     → 100-200 linii per template                             │
│     → Usage: Auto-loaded by workflows                        │
│                                                               │
│  2️⃣ CODE TEMPLATES (FOR DEVELOPERS)                          │
│     → Copy-paste snippety                                    │
│     → Czysty TS/TSX bez markdown                             │
│     → 20-100 linii per snippet                               │
│     → Usage: Manual copy during implementation               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
docs/templates/
├── README.md                          # System overview
├── context/                           # ← FOR AI CONTEXT
│   ├── template-a-crud-pattern.md
│   ├── template-b-line-items-pattern.md
│   ├── template-c-settings-pattern.md
│   ├── template-d-versioning-pattern.md
│   └── template-e-traceability-pattern.md
└── code/                              # ← FOR CODE GENERATION
    ├── api-routes/
    │   ├── crud-get-list.ts          ✅ Created
    │   ├── crud-post-create.ts       ✅ Created
    │   ├── crud-put-update.ts
    │   ├── crud-delete-remove.ts
    │   └── line-items-nested.ts
    ├── services/
    │   ├── service-base.ts
    │   ├── service-create.ts         ✅ Created
    │   ├── service-list.ts
    │   ├── service-get-by-id.ts
    │   ├── service-update.ts
    │   └── service-remove.ts
    ├── components/
    │   ├── form-modal-base.tsx       ✅ Created
    │   ├── data-table-base.tsx
    │   ├── edit-drawer-base.tsx
    │   └── nested-items-table.tsx
    ├── validation/
    │   ├── schema-base.ts            ✅ Created
    │   └── schema-line-items.ts
    └── cache/
        └── cache-layer-base.ts
```

**Status:**
- ✅ Context Template A (CRUD) - Created
- ✅ 5 Code Templates - Created (api-routes/2, services/1, components/1, validation/1)
- ⏳ 14 Code Templates - Remaining
- ⏳ 4 Context Templates - Remaining (B-E)

---

## 🔍 Type 1: Context Templates (FOR AI)

### Purpose
Ładowane jako część kontekstu dla Claude Code podczas implementacji story. AI używa ich do **zrozumienia wzorców** i **konsystencji implementacji**.

### Characteristics
- **Format:** Markdown with sections
- **Size:** 100-200 lines per template (~2-4K tokens)
- **Content:**
  - Descriptions and explanations
  - Design patterns and rationale
  - One complete example with comments
  - Links to code templates
- **Location:** `docs/templates/context/`
- **Usage:** Auto-loaded by `/bmad:bmm:workflows:dev-story {id}`

### Example Structure
```markdown
# Template A: CRUD Pattern

## Overview
[Opisy wzorca, kluczowe features]

## 1. API Route Pattern
[Opisy + przykładowy kod z komentarzami]

## 2. Service Layer Pattern
[Opisy + przykładowy kod z komentarzami]

## 3. Component Pattern
[Opisy + przykładowy kod z komentarzami]

## 4. Usage Examples
Story 2.6: Replace {Resource} → BOM
Story 3.1: Replace {Resource} → PurchaseOrder
```

### When Loaded
```yaml
# Story metadata triggers auto-loading
---
epic: 2
story: 2.6
templates_required:
  - context/template-a-crud-pattern      # ← Loaded by workflow
  - context/template-b-line-items-pattern
---
```

### Benefits for AI
- ✅ Understands **WHY** pattern exists
- ✅ Sees **complete flow** (API → Service → Component)
- ✅ Maintains **consistency** across stories
- ✅ Reduces **token usage** (shared pattern knowledge)

---

## 💻 Type 2: Code Templates (FOR DEVELOPERS)

### Purpose
Ready-to-use code snippets that developers **copy-paste** and customize during implementation. Pure code without descriptions.

### Characteristics
- **Format:** Pure TypeScript/TSX (no markdown)
- **Size:** 20-100 lines per snippet
- **Content:**
  - Working, compilable code
  - Placeholder variables (`{Resource}`, `{resource}`, `{module}`)
  - Minimal comments (only critical logic)
- **Location:** `docs/templates/code/`
- **Usage:** Manual copy-paste + Find & Replace

### Example: `code/services/service-create.ts`
```typescript
// Service: Create Operation
// Replace: {Resource}, {resource}, {resources}

import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import { invalidate{Resource}Cache } from '@/lib/cache/{resource}-cache'

export async function create{Resource}(input: Create{Resource}Input) {
  const supabaseAdmin = createServerSupabaseAdmin()
  const orgId = await getCurrentOrgId()

  // Check unique constraint
  const { data: existing } = await supabaseAdmin
    .from('{resources}')
    .select('id')
    .eq('org_id', orgId)
    .eq('code', input.code)
    .single()

  if (existing) {
    return { success: false, error: 'Code exists', code: 'DUPLICATE_CODE' }
  }

  // Insert with audit trail
  const { data, error } = await supabaseAdmin
    .from('{resources}')
    .insert({ ...input, org_id: orgId, created_by: user.id })
    .select()
    .single()

  await invalidate{Resource}Cache(orgId)
  return { success: true, data }
}
```

### How to Use
```bash
# Step 1: Copy snippet
cp docs/templates/code/services/service-create.ts \
   apps/frontend/lib/services/bom-service.ts

# Step 2: Find & Replace (VSCode / sed)
# {Resource} → BOM
# {resource} → bom
# {resources} → boms

# Step 3: Add BOM-specific fields
# e.g., product_id, version, effective_from

# Step 4: Done!
```

### Benefits for Developers
- ✅ **Fast** - No writing boilerplate from scratch
- ✅ **Consistent** - All services follow same pattern
- ✅ **Tested** - Snippets are production-ready
- ✅ **Modular** - One concern per file

---

## 🔄 Workflow: How Both Systems Work Together

### Phase 1: AI Implementation (Context Templates)
```bash
# Developer runs workflow
$ claude-code "/bmad:bmm:workflows:dev-story 2-6"

# Workflow loads context:
1. ✅ Batch 0: Core Architecture (31K tokens)
2. ✅ Batch Epic-2: Technical Module (14.7K tokens)
3. ✅ Batch Story-2.6: BOM CRUD (10K tokens)
4. ✅ Context Template A: CRUD Pattern (4K tokens)  ← HERE
5. ✅ Context Template B: Line Items (3K tokens)    ← HERE

Total: ~62K tokens (88.6% reduction vs. full load)

# Claude Code generates:
- API routes structure
- Service layer skeleton
- Component scaffolding
- Validation schemas
```

### Phase 2: Developer Fine-tuning (Code Templates)
```bash
# After AI generates initial structure, dev customizes:

# Copy specific snippets
$ cp docs/templates/code/services/service-create.ts \
     apps/frontend/lib/services/bom-service.ts

$ cp docs/templates/code/components/form-modal-base.tsx \
     apps/frontend/components/technical/BOMFormModal.tsx

# Find & Replace placeholders
$ sed -i 's/{Resource}/BOM/g' bom-service.ts
$ sed -i 's/{resource}/bom/g' bom-service.ts
$ sed -i 's/{resources}/boms/g' bom-service.ts1

# Add BOM-specific logic
# - product_id field
# - version auto-generation
# - effective_from/to validation

# Test and commit
$ pnpm test __tests__/api/technical/boms.test.ts
$ git add . && git commit -m "feat(epic-2): implement story 2.6 - BOM CRUD"
```

---

## 📊 Template Coverage Matrix

| Story Type | Context Template | Code Templates Used | Stories Count |
|------------|------------------|---------------------|---------------|
| **CRUD Operations** | A: CRUD Pattern | api-routes/crud-*.ts<br/>services/service-*.ts<br/>components/form-modal-base.tsx<br/>validation/schema-base.ts | 15 |
| **Line Items / Nested** | B: Line Items | api-routes/line-items-nested.ts<br/>components/nested-items-table.tsx<br/>validation/schema-line-items.ts | 6 |
| **Settings / Config** | C: Settings | services/settings-*.ts<br/>components/settings-accordion.tsx | 6 |
| **Versioning / History** | D: Versioning | services/versioning-*.ts<br/>components/version-compare.tsx | 6 |
| **Traceability / Genealogy** | E: Traceability | services/tracing-*.ts<br/>components/tree-*.tsx | 4 |

**Total:** 5 context templates + 19 code templates = **37 stories covered**

---

## 🛠️ Placeholder Conventions

All templates use **consistent placeholders** for Find & Replace:

| Placeholder | Description | Example Replacement |
|-------------|-------------|---------------------|
| `{Resource}` | PascalCase singular | `BOM`, `PurchaseOrder`, `Warehouse` |
| `{resource}` | kebab-case singular | `bom`, `purchase-order`, `warehouse` |
| `{resources}` | kebab-case plural | `boms`, `purchase-orders`, `warehouses` |
| `{module}` | Module name lowercase | `technical`, `planning`, `settings` |
| `{RESOURCE}` | UPPER_CASE singular | `BOM`, `PURCHASE_ORDER`, `WAREHOUSE` |

### Example Transformations

**Story 2.6: BOM CRUD**
```typescript
// Before (template)
export async function create{Resource}(input: Create{Resource}Input)
const { data } = await supabaseAdmin.from('{resources}').insert(...)

// After (replaced)
export async function createBOM(input: CreateBOMInput)
const { data } = await supabaseAdmin.from('boms').insert(...)
```

**Story 3.1: Purchase Order CRUD**
```typescript
// Before (template)
export async function create{Resource}(input: Create{Resource}Input)
const { data } = await supabaseAdmin.from('{resources}').insert(...)

// After (replaced)
export async function createPurchaseOrder(input: CreatePurchaseOrderInput)
const { data } = await supabaseAdmin.from('purchase_orders').insert(...)
```

---

## 🚀 Implementation Status

### Context Templates (FOR AI) - 5 total
- [x] **Template A:** CRUD Pattern (200 lines)
- [ ] **Template B:** Line Items Pattern (150 lines)
- [ ] **Template C:** Settings Pattern (100 lines)
- [ ] **Template D:** Versioning Pattern (120 lines)
- [ ] **Template E:** Traceability Pattern (180 lines)

**Status:** 1/5 complete (20%)

### Code Templates (FOR DEVS) - 19 total
- [x] `api-routes/crud-get-list.ts`
- [x] `api-routes/crud-post-create.ts`
- [ ] `api-routes/crud-put-update.ts`
- [ ] `api-routes/crud-delete-remove.ts`
- [ ] `api-routes/line-items-nested.ts`
- [x] `services/service-create.ts`
- [ ] `services/service-list.ts`
- [ ] `services/service-get-by-id.ts`
- [ ] `services/service-update.ts`
- [ ] `services/service-remove.ts`
- [ ] `services/service-base.ts`
- [x] `components/form-modal-base.tsx`
- [ ] `components/data-table-base.tsx`
- [ ] `components/edit-drawer-base.tsx`
- [ ] `components/nested-items-table.tsx`
- [x] `validation/schema-base.ts`
- [ ] `validation/schema-line-items.ts`
- [ ] `cache/cache-layer-base.ts`

**Status:** 5/19 complete (26%)

---

## 📚 Usage Examples

### Example 1: Story 2.6 (BOM CRUD)

**Context Templates Loaded (AI):**
```yaml
templates_required:
  - context/template-a-crud-pattern      # CRUD operations
  - context/template-b-line-items-pattern # BOM items management
```

**Code Templates Used (Dev):**
```bash
# API Routes
cp code/api-routes/crud-get-list.ts → app/api/technical/boms/route.ts (GET)
cp code/api-routes/crud-post-create.ts → app/api/technical/boms/route.ts (POST)

# Services
cp code/services/service-create.ts → lib/services/bom-service.ts
cp code/services/service-list.ts → lib/services/bom-service.ts

# Components
cp code/components/form-modal-base.tsx → components/technical/BOMFormModal.tsx

# Validation
cp code/validation/schema-base.ts → lib/validation/bom-schemas.ts
```

**Find & Replace:**
```
{Resource} → BOM
{resource} → bom
{resources} → boms
{module} → technical
```

**Add BOM-specific fields:**
- `product_id: string`
- `version: string`
- `effective_from: Date`
- `effective_to: Date | null`
- `output_qty: number`
- `output_uom: string`

---

### Example 2: Story 3.1 (PO CRUD)

**Context Templates Loaded (AI):**
```yaml
templates_required:
  - context/template-a-crud-pattern
```

**Code Templates Used (Dev):**
```bash
cp code/api-routes/crud-*.ts → app/api/planning/purchase-orders/
cp code/services/service-*.ts → lib/services/purchase-order-service.ts
cp code/components/form-modal-base.tsx → components/planning/POFormModal.tsx
cp code/validation/schema-base.ts → lib/validation/purchase-order-schemas.ts
```

**Find & Replace:**
```
{Resource} → PurchaseOrder
{resource} → purchase-order
{resources} → purchase_orders
{module} → planning
```

**Add PO-specific fields:**
- `supplier_id: string`
- `warehouse_id: string`
- `expected_delivery_date: Date`
- `currency: string`
- `tax_code_id: string`
- `payment_terms: string`

---

## 💡 Best Practices

### For Context Templates (AI)
1. ✅ **Include WHY** - Explain design decisions
2. ✅ **Show complete flow** - API → Service → Component → DB
3. ✅ **Add comments** - AI learns from explanations
4. ✅ **Keep concise** - 100-200 lines max (token efficiency)
5. ✅ **Link code templates** - Reference actual snippets

### For Code Templates (Devs)
1. ✅ **Pure code only** - No markdown, minimal comments
2. ✅ **Complete & working** - Should compile after placeholder replacement
3. ✅ **Modular** - One concern per file (separation of concerns)
4. ✅ **Tested** - Each snippet should be production-ready
5. ✅ **Consistent placeholders** - Follow conventions

---

## 🔧 Quick Commands

### Setup Aliases (Optional)
```bash
# Add to ~/.bashrc or ~/.zshrc
alias crud-api="cp docs/templates/code/api-routes/crud-*.ts"
alias crud-service="cp docs/templates/code/services/service-*.ts"
alias crud-component="cp docs/templates/code/components/form-modal-base.tsx"
alias crud-validation="cp docs/templates/code/validation/schema-base.ts"

# Usage
cd apps/frontend/app/api/technical/boms
crud-api .
# → Copies all CRUD API routes to current directory
```

### Batch Find & Replace (VSCode)
```
1. Open VSCode Search (Cmd/Ctrl + Shift + H)
2. Enable "Use Regular Expression" (.*) button
3. Find: {Resource}
   Replace: BOM
4. Find: {resource}
   Replace: bom
5. Find: {resources}
   Replace: boms
6. Replace All in Files
```

### Batch Find & Replace (CLI)
```bash
# Using sed (Linux/Mac)
find . -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/{Resource}/BOM/g'
find . -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/{resource}/bom/g'
find . -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/{resources}/boms/g'

# Using PowerShell (Windows)
Get-ChildItem -Recurse -Include *.ts,*.tsx | ForEach-Object {
  (Get-Content $_) -replace '{Resource}','BOM' | Set-Content $_
}
```

---

## 📖 Related Documentation

- **Main Plan:** `docs/story-context-optimization-plan.md`
- **Quick Reference:** `docs/story-context-batch-summary.md`
- **Template Folder:** `docs/templates/README.md`
- **Architecture:** `docs/CODE_ARCHITECTURE_DOCUMENTATION.md`

---

## ✅ Next Steps

### Immediate (Week 1)
1. [ ] Complete remaining 4 context templates (B-E)
2. [ ] Complete remaining 14 code templates
3. [ ] Test with pilot stories (2.6, 3.1, 2.18)
4. [ ] Measure token usage vs. projections

### Short-term (Week 2)
5. [ ] Create context loading utility (`load-story-context.ts`)
6. [ ] Update dev-story workflow (auto-load templates)
7. [ ] Refactor Epic 1-2 stories (38 stories)

### Long-term (Week 3+)
8. [ ] Rollout to Epic 3-8 (remaining stories)
9. [ ] Add template versioning (v1, v2)
10. [ ] Create template generator script (auto-generate from existing code)

---

**END OF GUIDE**

**Status:** ✅ System designed and partially implemented
**Next:** Complete remaining 18 templates (4 context + 14 code)
