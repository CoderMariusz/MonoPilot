# MonoPilot Templates - System Overview

**Created:** 2025-01-23
**Purpose:** Dual-purpose template system for context loading AND code generation

---

## 📁 Template Structure

```
docs/templates/
├── README.md (this file)
├── context/                    # FOR AI CONTEXT (loaded with stories)
│   ├── template-a-crud-pattern.md
│   ├── template-b-line-items-pattern.md
│   ├── template-c-settings-pattern.md
│   ├── template-d-versioning-pattern.md
│   └── template-e-traceability-pattern.md
└── code/                       # FOR CODE GENERATION (copy-paste snippets)
    ├── api-routes/
    │   ├── crud-get-list.ts
    │   ├── crud-post-create.ts
    │   ├── crud-put-update.ts
    │   ├── crud-delete-remove.ts
    │   └── line-items-nested.ts
    ├── services/
    │   ├── service-base.ts
    │   ├── service-create.ts
    │   ├── service-list.ts
    │   ├── service-get-by-id.ts
    │   ├── service-update.ts
    │   └── service-remove.ts
    ├── components/
    │   ├── form-modal-base.tsx
    │   ├── data-table-base.tsx
    │   ├── edit-drawer-base.tsx
    │   └── nested-items-table.tsx
    ├── validation/
    │   ├── schema-base.ts
    │   └── schema-line-items.ts
    └── cache/
        └── cache-layer-base.ts
```

---

## 🎯 2 Types of Templates

### Type 1: Context Templates (FOR AI)
**Location:** `docs/templates/context/`
**Purpose:** Ładowane wraz ze story jako kontekst dla Claude Code
**Format:** Markdown z opisami + przykładowym kodem
**Size:** 100-200 linii per template
**Usage:** Auto-loaded przez `/bmad:bmm:workflows:dev-story {id}`

**Example:**
```markdown
# Template A: CRUD Pattern

## Overview
This template provides standard CRUD implementation...

## 1. API Route Pattern
[Opisy + komentarze + przykładowy kod z placeholderami]

## 2. Service Layer Pattern
[Opisy + komentarze + przykładowy kod]

## 3. Component Pattern
[Opisy + komentarze + przykładowy kod]
```

**Benefits:**
- AI rozumie wzorzec i intencję
- Mniejszy kontekst (opisy + 1 przykład)
- Consistency guidance

---

### Type 2: Code Generation Templates (FOR DEVELOPERS)
**Location:** `docs/templates/code/`
**Purpose:** Gotowe snippety do skopiowania i dostosowania
**Format:** Czysty TypeScript/TSX (bez markdown)
**Size:** 20-100 linii per snippet
**Usage:** Copy-paste podczas implementacji

**Example:**
```typescript
// docs/templates/code/services/service-create.ts
export async function create{Resource}(
  input: Create{Resource}Input
): Promise<{Resource}ServiceResult> {
  const supabase = await createServerSupabase()
  const supabaseAdmin = createServerSupabaseAdmin()
  const orgId = await getCurrentOrgId()

  // ... pure implementation code
}
```

**Benefits:**
- Szybkie copy-paste
- Brak opisów (czysty kod)
- Find & Replace {placeholders}
- IDE auto-completion

---

## 🔄 Workflow Usage

### Context Templates (AI Stage)
```bash
# 1. Developer runs story workflow
claude-code "/bmad:bmm:workflows:dev-story 2-6"

# 2. Workflow auto-loads:
# - Batch 0: Core Architecture
# - Batch Epic-2: Technical Module
# - Batch Story-2.6: BOM CRUD
# - Context Template A: CRUD Pattern ← HERE
# - Context Template B: Line Items Pattern ← HERE

# 3. Claude Code understands pattern and generates code
# Output: Creates files with proper structure
```

### Code Templates (Dev Stage)
```bash
# After Claude generates initial structure, dev fine-tunes:

# 1. Open template folder
cd docs/templates/code/services

# 2. Copy snippet
cp service-create.ts ../../lib/services/bom-service.ts

# 3. Find & Replace placeholders
# {Resource} → BOM
# {resource} → bom
# Add BOM-specific fields

# 4. Done - consistent implementation
```

---

## 📊 Template Coverage

| Pattern | Context Template | Code Templates Count | Stories Using |
|---------|------------------|----------------------|---------------|
| **A: CRUD** | `context/template-a-crud-pattern.md` | 9 snippets | 15 stories |
| **B: Line Items** | `context/template-b-line-items-pattern.md` | 4 snippets | 6 stories |
| **C: Settings** | `context/template-c-settings-pattern.md` | 3 snippets | 6 stories |
| **D: Versioning** | `context/template-d-versioning-pattern.md` | 4 snippets | 6 stories |
| **E: Traceability** | `context/template-e-traceability-pattern.md` | 3 snippets | 4 stories |

---

## 🛠️ How to Use

### For AI (Context Templates)
```yaml
# Story file metadata
---
epic: 2
story: 2.6
templates_required:
  - context/template-a-crud-pattern  # Auto-loaded by workflow
  - context/template-b-line-items-pattern
---
```

### For Developers (Code Templates)
```bash
# Quick snippet copy
alias crud-api="cp docs/templates/code/api-routes/crud-*.ts"
alias crud-service="cp docs/templates/code/services/service-*.ts"
alias crud-component="cp docs/templates/code/components/form-modal-base.tsx"

# Example usage
cd apps/frontend/app/api/technical/boms
crud-api .
# → Copies all CRUD API routes
# → Find & Replace {Resource} → BOM
```

---

## 📝 Placeholder Conventions

All templates use consistent placeholders:

| Placeholder | Replace With | Example |
|-------------|--------------|---------|
| `{Resource}` | PascalCase name | `BOM`, `PurchaseOrder` |
| `{resource}` | kebab-case name | `bom`, `purchase-order` |
| `{resources}` | plural kebab-case | `boms`, `purchase-orders` |
| `{module}` | module name | `technical`, `planning` |
| `{RESOURCE}` | UPPER_CASE | `BOM`, `PURCHASE_ORDER` |

---

## 🚀 Implementation Status

### Phase 1: Context Templates (FOR AI)
- [x] Template A: CRUD Pattern
- [ ] Template B: Line Items Pattern
- [ ] Template C: Settings Pattern
- [ ] Template D: Versioning Pattern
- [ ] Template E: Traceability Pattern

### Phase 2: Code Templates (FOR DEVS)
- [ ] API Routes (5 files)
- [ ] Services (7 files)
- [ ] Components (4 files)
- [ ] Validation (2 files)
- [ ] Cache (1 file)

**Total:** 5 context templates + 19 code templates = 24 files

---

## 💡 Best Practices

### Context Templates (AI)
1. **Include descriptions** - AI needs to understand WHY
2. **Show 1 complete example** - Full implementation with comments
3. **Keep concise** - 100-200 lines max (token efficiency)
4. **Link to code templates** - Reference actual snippets

### Code Templates (Devs)
1. **Pure code only** - No markdown, no descriptions
2. **Complete & working** - Should compile after placeholder replacement
3. **Modular** - One concern per file
4. **Tested** - Each snippet should be production-ready

---

## 🔍 Finding the Right Template

### By Story Type
```
Story Name Contains → Use Templates
-----------------------------------
"CRUD" → Context: A | Code: api-routes/crud-*.ts, services/service-*.ts
"Lines" / "Items" → Context: B | Code: api-routes/line-items-*.ts
"Settings" / "Configuration" → Context: C | Code: services/settings-*.ts
"Versioning" / "History" → Context: D | Code: services/versioning-*.ts
"Trace" / "Genealogy" → Context: E | Code: components/tree-*.tsx
```

### By Layer
```
Layer → Code Template Folder
----------------------------
API Routes → code/api-routes/
Service Layer → code/services/
Components → code/components/
Validation → code/validation/
Cache → code/cache/
```

---

## 📚 Related Documentation

- **Main Plan:** `docs/story-context-optimization-plan.md`
- **Quick Reference:** `docs/story-context-batch-summary.md`
- **Architecture:** `docs/CODE_ARCHITECTURE_DOCUMENTATION.md`

---

**Next Steps:**
1. Create remaining 4 context templates (B-E)
2. Create 19 code generation templates
3. Test with pilot stories (2.6, 3.1, 2.18)
4. Refine based on actual usage

---

**END OF README**
