# P3 GREEN Phase - Parallel 4-Agent Structure

## Oryginalna struktura (do zachowania):

```
P3 GREEN Phase
     │
     ├─── P3a: backend-dev (API Services)
     │         └─ lib/services/*-service.ts
     │         └─ lib/types/*.ts
     │
     ├─── P3b: backend-dev (REST Routes)
     │         └─ app/api/[module]/route.ts
     │         └─ app/api/[module]/[id]/route.ts
     │
     ├─── P3c: frontend-dev (Components)
     │         └─ components/[module]/*.tsx
     │         └─ components/ui/* (jeśli custom)
     │
     └─── P3d: frontend-dev (Pages/Hooks)
               └─ app/(authenticated)/[module]/page.tsx
               └─ lib/hooks/use-*.ts
```

## Flow z parallel P3:

```
P1 UX ──► P2 Tests RED ──► P3 GREEN (4 parallel) ──► P4 Refactor ──► P5 Review ──► P6 QA ──► P7 Docs
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                   P3a         P3b         P3c         P3d
                 Services    Routes     Components   Pages/Hooks
                    │           │           │           │
                    └───────────┼───────────┘
                                │
                           [wait all]
                                │
                                ▼
                            P4 Refactor
```

## Agent Configuration:

| Sub-phase | Agent | GLM Model | Focus Area |
|-----------|-------|-----------|------------|
| P3a | backend-dev | glm-4.7 | Services, Types, Validation |
| P3b | backend-dev | glm-4.7 | API Routes, Handlers |
| P3c | frontend-dev | glm-4.7 | React Components, UI |
| P3d | frontend-dev | glm-4.7 | Pages, Hooks, State |

## Wrapper Commands (Parallel):

```bash
# Run all 4 in parallel (separate terminals or background):

# P3a: Services
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --agent backend-dev \
  --task implement-services \
  --story 01.2 \
  --context "tests/01.2.test.ts,context/01.2.context.yaml" \
  --output-json > outputs/01.2/p3a-services.json &

# P3b: Routes
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --agent backend-dev \
  --task implement-routes \
  --story 01.2 \
  --context "tests/01.2.test.ts,context/01.2.context.yaml" \
  --output-json > outputs/01.2/p3b-routes.json &

# P3c: Components
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --agent frontend-dev \
  --task implement-components \
  --story 01.2 \
  --context "tests/01.2.test.ts,wireframes/01.2-ux.md" \
  --output-json > outputs/01.2/p3c-components.json &

# P3d: Pages/Hooks
python -B .experiments/claude-glm-test/scripts/glm_wrapper.py \
  --agent frontend-dev \
  --task implement-pages \
  --story 01.2 \
  --context "tests/01.2.test.ts,wireframes/01.2-ux.md" \
  --output-json > outputs/01.2/p3d-pages.json &

# Wait for all
wait
```

## Output Structure per Story:

```
.experiments/claude-glm-test/outputs/01.2/
├── p1-ux.md                 # UX wireframes
├── p2-tests.json            # Test files
├── p3a-services.json        # Services implementation
├── p3b-routes.json          # API routes
├── p3c-components.json      # React components
├── p3d-pages.json           # Pages and hooks
├── p4-refactor.json         # Refactored code
├── p5-review.json           # Code review results
├── p6-qa.json               # QA results
└── p7-docs.json             # Documentation
```

## File Responsibilities:

### P3a: Services (backend-dev)
```
apps/frontend/lib/services/
├── user-roles-service.ts      # CRUD operations
├── permissions-service.ts     # Permission checks
└── org-service.ts             # Organization operations

apps/frontend/lib/types/
├── user-roles.ts              # TypeScript types
└── permissions.ts             # Permission types

apps/frontend/lib/validation/
└── user-roles-schema.ts       # Zod schemas
```

### P3b: Routes (backend-dev)
```
apps/frontend/app/api/settings/
├── user-roles/
│   ├── route.ts               # GET, POST
│   └── [id]/route.ts          # GET, PUT, DELETE
├── permissions/
│   └── route.ts               # GET, POST
└── organization/
    └── route.ts               # GET, PUT
```

### P3c: Components (frontend-dev)
```
apps/frontend/components/settings/
├── UserRolesTable.tsx         # Data table
├── UserRoleForm.tsx           # Create/Edit form
├── UserRoleModal.tsx          # Modal wrapper
├── PermissionsMatrix.tsx      # Permissions grid
└── DeleteConfirmDialog.tsx    # Confirmation dialog
```

### P3d: Pages/Hooks (frontend-dev)
```
apps/frontend/app/(authenticated)/settings/
├── user-roles/
│   └── page.tsx               # List page
└── permissions/
    └── page.tsx               # Permissions page

apps/frontend/lib/hooks/
├── use-user-roles.ts          # Data fetching hook
├── use-permissions.ts         # Permissions hook
└── use-role-form.ts           # Form state hook
```

## Dependency Graph:

```
P3a (Services) ◄─────┐
       │             │
       ▼             │
P3b (Routes) ────────┤ (Routes use Services)
                     │
P3c (Components) ◄───┤ (Components use hooks)
       │             │
       ▼             │
P3d (Pages/Hooks) ───┘ (Pages use Components + Hooks)
```

**Note**: P3a should complete first as Routes depend on Services.
Recommended execution order:
1. P3a starts first
2. P3b, P3c, P3d start after P3a completes (or with slight delay)

## Simplified Parallel Strategy:

```
Phase 1: P3a (Services) - 30s
Phase 2: P3b + P3c + P3d (parallel) - 45s
Total P3: ~75s vs ~180s sequential (60% faster)
```
