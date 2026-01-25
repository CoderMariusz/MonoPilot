# CODE IMPLEMENTATION WORKFLOW ANALYSIS

**Date**: 2026-01-24
**Purpose**: Optimize dev agent workflows with script-first approach
**Scope**: backend-dev, frontend-dev, senior-dev agents

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Dev agents analyzed | 3 (backend-dev, frontend-dev, senior-dev) |
| Manual steps identified | 27 total (9 per agent avg) |
| Scriptable steps | 18 (67% of manual work) |
| Existing scripts usable | 3 (load-story-context.sh, query-table-schema.sh, extract-api-endpoints.sh) |
| Proposed new scripts | 6 (high-priority) |
| Total potential savings | 8,500 tokens/story |

---

## Part 1: Current State Analysis

### Agent: BACKEND-DEV

**Role**: Implements backend APIs and services (GREEN phase of TDD)
**Frequency**: Every API story (~15 stories/sprint)

| Step | Description | Tokens | Scriptable | Script Status |
|------|-------------|--------|------------|---------------|
| 1 | Read story context YAML | 1,000 | YES | `load-story-context.sh` EXISTS |
| 2 | Find table schema in TABLES.md | 3,000 | YES | `query-table-schema.sh` EXISTS |
| 3 | Check existing API patterns | 2,000 | YES | `extract-api-endpoints.sh` EXISTS (needs enhancement) |
| 4 | Read similar service for patterns | 2,500 | YES | **MISSING**: `extract-service-patterns.sh` |
| 5 | Verify Zod schema exists/structure | 800 | YES | **MISSING**: `analyze-zod-schema.sh` |
| 6 | Check auth-middleware patterns | 500 | YES | Can use Grep |
| 7 | Run existing tests | 300 | NO | Manual `pnpm test` |
| 8 | Implement code | N/A | NO | Core work |
| 9 | Verify org_id/RLS compliance | 600 | PARTIAL | **MISSING**: `verify-rls-compliance.sh` |

**Total manual tokens**: 10,700
**Automatable tokens**: 8,400 (78%)

```yaml
agent: backend-dev
current_manual_steps:
  - step: "Read story context YAML"
    tokens: 1000
    scriptable: YES
    script: load-story-context.sh (EXISTS)
    usage: "./scripts/load-story-context.sh 06.11"

  - step: "Find table schema in TABLES.md"
    tokens: 3000
    scriptable: YES
    script: query-table-schema.sh (EXISTS)
    usage: "./scripts/query-table-schema.sh work_orders"

  - step: "Check existing API patterns"
    tokens: 2000
    scriptable: YES
    script: extract-api-endpoints.sh (EXISTS - needs enhancement)
    usage: "./scripts/extract-api-endpoints.sh apps/frontend/app/api/quality"
    enhancement_needed: "Add pattern extraction, not just endpoint listing"

  - step: "Read similar service for patterns"
    tokens: 2500
    scriptable: YES
    script: extract-service-patterns.sh (MISSING)
    proposed_usage: "./scripts/extract-service-patterns.sh batch-release"

  - step: "Verify Zod schema structure"
    tokens: 800
    scriptable: YES
    script: analyze-zod-schema.sh (MISSING)
    proposed_usage: "./scripts/analyze-zod-schema.sh batch-release"

  - step: "Verify org_id/RLS compliance"
    tokens: 600
    scriptable: PARTIAL
    script: verify-rls-compliance.sh (MISSING)
    proposed_usage: "./scripts/verify-rls-compliance.sh apps/frontend/lib/services/batch-release-service.ts"

total_manual_tokens: 10700
automatable: 8400
percentage: 78%
```

---

### Agent: FRONTEND-DEV

**Role**: Implements UI components and frontend logic (GREEN phase)
**Frequency**: Every UI story (~12 stories/sprint)

| Step | Description | Tokens | Scriptable | Script Status |
|------|-------------|--------|------------|---------------|
| 1 | Read story context YAML | 1,000 | YES | `load-story-context.sh` EXISTS |
| 2 | Check UX wireframes | 1,500 | PARTIAL | Wireframes in context, could extract |
| 3 | Find similar component patterns | 2,000 | YES | **MISSING**: `extract-component-patterns.sh` |
| 4 | Verify ShadCN component usage | 800 | YES | **MISSING**: `list-shadcn-usage.sh` |
| 5 | Check 4-state implementation pattern | 500 | NO | Best as documentation |
| 6 | Verify accessibility requirements | 600 | PARTIAL | **MISSING**: `check-a11y-patterns.sh` |
| 7 | Run existing tests | 300 | NO | Manual `pnpm test` |
| 8 | Implement component | N/A | NO | Core work |
| 9 | Check responsive patterns | 400 | NO | Manual |

**Total manual tokens**: 7,100
**Automatable tokens**: 5,300 (75%)

```yaml
agent: frontend-dev
current_manual_steps:
  - step: "Read story context YAML"
    tokens: 1000
    scriptable: YES
    script: load-story-context.sh (EXISTS)

  - step: "Check UX wireframes"
    tokens: 1500
    scriptable: PARTIAL
    note: "Wireframes referenced in context YAML"

  - step: "Find similar component patterns"
    tokens: 2000
    scriptable: YES
    script: extract-component-patterns.sh (MISSING)
    proposed_usage: "./scripts/extract-component-patterns.sh DataTable"

  - step: "Verify ShadCN component usage"
    tokens: 800
    scriptable: YES
    script: list-shadcn-usage.sh (MISSING)
    proposed_usage: "./scripts/list-shadcn-usage.sh shipping"

  - step: "Verify accessibility requirements"
    tokens: 600
    scriptable: PARTIAL
    script: check-a11y-patterns.sh (MISSING)
    note: "accessibility-checklist skill available but not scripted"

total_manual_tokens: 7100
automatable: 5300
percentage: 75%
```

---

### Agent: SENIOR-DEV

**Role**: Refactors code (REFACTOR phase), handles complex implementations
**Frequency**: After every GREEN phase (~25 stories/sprint)

| Step | Description | Tokens | Scriptable | Script Status |
|------|-------------|--------|------------|---------------|
| 1 | Run tests to verify GREEN | 300 | NO | Manual `pnpm test` |
| 2 | Identify code smells | 1,500 | YES | **MISSING**: `detect-code-smells.sh` |
| 3 | Find duplicate code | 1,200 | YES | **MISSING**: `find-duplicates.sh` |
| 4 | Check function lengths | 400 | YES | Can use wc + awk |
| 5 | Identify magic numbers | 300 | YES | Can use grep |
| 6 | Check test coverage gaps | 800 | PARTIAL | Coverage reports exist |
| 7 | Refactor code | N/A | NO | Core work |
| 8 | Verify tests still GREEN | 300 | NO | Manual `pnpm test` |
| 9 | Create ADR if needed | 500 | NO | Manual decision |

**Total manual tokens**: 5,300
**Automatable tokens**: 3,400 (64%)

```yaml
agent: senior-dev
current_manual_steps:
  - step: "Identify code smells"
    tokens: 1500
    scriptable: YES
    script: detect-code-smells.sh (MISSING)
    proposed_usage: "./scripts/detect-code-smells.sh apps/frontend/lib/services/batch-release-service.ts"

  - step: "Find duplicate code"
    tokens: 1200
    scriptable: YES
    script: find-duplicates.sh (MISSING)
    proposed_usage: "./scripts/find-duplicates.sh apps/frontend/lib/services"

  - step: "Check function lengths"
    tokens: 400
    scriptable: YES
    note: "Can use wc -l with awk to find long functions"

  - step: "Identify magic numbers"
    tokens: 300
    scriptable: YES
    note: "grep for numeric literals not in const declarations"

  - step: "Check test coverage gaps"
    tokens: 800
    scriptable: PARTIAL
    note: "Coverage reports exist, need script to parse"

total_manual_tokens: 5300
automatable: 3400
percentage: 64%
```

---

## Part 2: Proposed Scripts (Prioritized)

### Priority 1: HIGH VALUE (>2000 token savings, frequent use)

#### Script CODE-001: extract-service-patterns.sh

```yaml
script_id: CODE-001
name: extract-service-patterns.sh
purpose: Extract service layer patterns from existing service files
input: Service name or pattern (e.g., "batch-release", "inspection")
output: JSON with method signatures, common patterns, imports used
token_savings: 2500 per use
implementation_complexity: MEDIUM
priority: HIGH
usage_frequency: Every backend API story (15x/sprint)
dependencies: None

example_usage: |
  ./scripts/extract-service-patterns.sh batch-release
  # Output:
  {
    "service_file": "lib/services/batch-release-service.ts",
    "patterns": {
      "method_structure": "async function methodName(params: Type): Promise<Return>",
      "error_handling": "try/catch with typed errors",
      "supabase_client": "createClient() from @/lib/supabase/client",
      "org_id_usage": "passed as parameter or from auth context"
    },
    "common_imports": [
      "createClient from @/lib/supabase/client",
      "types from @/lib/validation/*-schemas"
    ],
    "method_signatures": [
      "checkReleaseReadiness(batchNumber: string): Promise<ReleaseCheckResult>",
      "approveBatchRelease(batchNumber, input, userId): Promise<BatchReleaseResponse>"
    ]
  }

implementation_notes: |
  - Parse TypeScript AST or use regex for quick extraction
  - Extract export function/const signatures
  - Identify import patterns
  - Extract JSDoc comments for context
```

#### Script CODE-002: extract-component-patterns.sh

```yaml
script_id: CODE-002
name: extract-component-patterns.sh
purpose: Find similar React components and extract their patterns
input: Component type (e.g., "DataTable", "Modal", "Form")
output: JSON with file paths, props interface, state patterns
token_savings: 2000 per use
implementation_complexity: MEDIUM
priority: HIGH
usage_frequency: Every frontend story (12x/sprint)
dependencies: None

example_usage: |
  ./scripts/extract-component-patterns.sh DataTable
  # Output:
  {
    "pattern": "DataTable",
    "similar_files": [
      "components/shipping/sales-orders/SODataTable.tsx",
      "components/shipping/pick-lists/PickListDataTable.tsx",
      "components/shipping/rma/RMADataTable.tsx"
    ],
    "common_props": [
      "data: T[]",
      "loading?: boolean",
      "error?: string | null",
      "onEdit?: (id: string) => void",
      "onDelete?: (id: string) => void"
    ],
    "imports": [
      "@/components/ui/table",
      "@/components/ui/dropdown-menu",
      "@/components/ui/skeleton"
    ],
    "state_patterns": [
      "useState for sorting, filtering",
      "useCallback for handlers"
    ],
    "4_states": "loading, error, empty, success"
  }

implementation_notes: |
  - Search for component files matching pattern
  - Extract interface/type definitions
  - Identify common ShadCN imports
  - Check for 4-state implementation
```

#### Script CODE-003: detect-code-smells.sh

```yaml
script_id: CODE-003
name: detect-code-smells.sh
purpose: Analyze TypeScript file for common code smells
input: File path or directory
output: JSON with detected smells and locations
token_savings: 1500 per use
implementation_complexity: MEDIUM
priority: HIGH
usage_frequency: Every REFACTOR phase (25x/sprint)
dependencies: None

example_usage: |
  ./scripts/detect-code-smells.sh apps/frontend/lib/services/batch-release-service.ts
  # Output:
  {
    "file": "batch-release-service.ts",
    "total_lines": 890,
    "smells_detected": [
      {
        "type": "long_function",
        "location": "line 142-220",
        "function": "approveBatchRelease",
        "lines": 78,
        "threshold": 30,
        "severity": "MEDIUM"
      },
      {
        "type": "deep_nesting",
        "location": "line 185",
        "depth": 4,
        "threshold": 3,
        "severity": "LOW"
      },
      {
        "type": "magic_number",
        "location": "line 133",
        "value": "4",
        "context": "MIN_CHECKLIST_ITEMS_FOR_APPROVAL",
        "severity": "ADDRESSED (has const)"
      }
    ],
    "summary": {
      "critical": 0,
      "medium": 1,
      "low": 1,
      "addressed": 1
    }
  }

implementation_notes: |
  - Count lines per function
  - Track nesting depth
  - Find numeric literals not in const
  - Check for duplicated code blocks
  - Identify long parameter lists
```

---

### Priority 2: MEDIUM VALUE (1000-2000 tokens, moderate use)

#### Script CODE-004: analyze-zod-schema.sh

```yaml
script_id: CODE-004
name: analyze-zod-schema.sh
purpose: Extract and summarize Zod validation schema structure
input: Schema file name or entity name (e.g., "batch-release")
output: JSON with schema fields, validations, types
token_savings: 800 per use
implementation_complexity: LOW
priority: MEDIUM
usage_frequency: Every API story needing validation (10x/sprint)
dependencies: None

example_usage: |
  ./scripts/analyze-zod-schema.sh batch-release
  # Output:
  {
    "file": "lib/validation/batch-release-schemas.ts",
    "schemas": [
      {
        "name": "releaseChecklistSchema",
        "fields": ["test_results", "ccp_records", "checkpoints", "label_verify", "spec_review", "ncr_review"],
        "field_types": "all boolean",
        "exported_type": "ReleaseChecklist"
      },
      {
        "name": "batchReleaseRequestSchema",
        "fields": ["release_decision", "checklist", "conditional_reason", "rejection_reason"],
        "validations": ["conditional fields based on decision type"],
        "exported_type": "BatchReleaseRequest"
      }
    ],
    "enums": [
      "RELEASE_DECISIONS: ['approved', 'rejected', 'conditional']"
    ]
  }

implementation_notes: |
  - Parse z.object, z.enum patterns
  - Extract field names and types
  - Identify .refine() custom validations
  - List exported types (z.infer)
```

#### Script CODE-005: find-duplicates.sh

```yaml
script_id: CODE-005
name: find-duplicates.sh
purpose: Find potential duplicate code blocks across services
input: Directory path
output: JSON with potential duplications and locations
token_savings: 1200 per use
implementation_complexity: HIGH
priority: MEDIUM
usage_frequency: Every REFACTOR phase (25x/sprint)
dependencies: None

example_usage: |
  ./scripts/find-duplicates.sh apps/frontend/lib/services
  # Output:
  {
    "analyzed_files": 25,
    "potential_duplicates": [
      {
        "pattern": "supabase query with org_id filter",
        "occurrences": 18,
        "files": ["batch-release-service.ts:142", "inspection-service.ts:89", "..."],
        "suggestion": "Extract to shared query helper"
      },
      {
        "pattern": "error handling with typed response",
        "occurrences": 12,
        "files": ["..."],
        "suggestion": "Already have handleApiError, ensure consistent use"
      }
    ],
    "duplication_score": 0.15,
    "notes": "15% duplication is acceptable"
  }

implementation_notes: |
  - Use jscpd or similar tool
  - Focus on 10+ line blocks
  - Exclude test files
  - Suggest consolidation
```

#### Script CODE-006: verify-rls-compliance.sh

```yaml
script_id: CODE-006
name: verify-rls-compliance.sh
purpose: Verify service/route uses org_id correctly for multi-tenancy
input: File path (service or API route)
output: JSON with compliance status and issues
token_savings: 600 per use
implementation_complexity: LOW
priority: MEDIUM
usage_frequency: Every backend story (15x/sprint)
dependencies: None

example_usage: |
  ./scripts/verify-rls-compliance.sh apps/frontend/lib/services/batch-release-service.ts
  # Output:
  {
    "file": "batch-release-service.ts",
    "compliance": {
      "org_id_present": true,
      "org_id_sources": ["parameter", "auth_context"],
      "queries_checked": 12,
      "queries_with_org_id": 12,
      "hardcoded_org_id": false
    },
    "issues": [],
    "status": "COMPLIANT"
  }

  # Bad example output:
  {
    "file": "legacy-service.ts",
    "compliance": {
      "org_id_present": false,
      "hardcoded_org_id": true
    },
    "issues": [
      "Line 45: Hardcoded org_id 'abc-123'",
      "Line 89: Query missing org_id filter"
    ],
    "status": "NON-COMPLIANT"
  }

implementation_notes: |
  - Grep for org_id usage patterns
  - Check for hardcoded UUIDs
  - Verify .eq('org_id', ...) in queries
  - Flag missing org_id in INSERT/UPDATE
```

---

### Priority 3: LOW VALUE (<1000 tokens or rare use)

#### Script CODE-007: list-shadcn-usage.sh

```yaml
script_id: CODE-007
name: list-shadcn-usage.sh
purpose: List ShadCN components used in a module
input: Module name (e.g., "shipping", "quality")
output: JSON with components used and frequency
token_savings: 800 per use
implementation_complexity: LOW
priority: LOW
usage_frequency: Occasional (5x/sprint)

example_usage: |
  ./scripts/list-shadcn-usage.sh shipping
  # Output: Component usage frequency in module
```

#### Script CODE-008: check-a11y-patterns.sh

```yaml
script_id: CODE-008
name: check-a11y-patterns.sh
purpose: Check component for accessibility patterns
input: Component file path
output: JSON with a11y checklist status
token_savings: 600 per use
implementation_complexity: MEDIUM
priority: LOW
usage_frequency: Optional (5x/sprint)

example_usage: |
  ./scripts/check-a11y-patterns.sh components/shipping/SODataTable.tsx
  # Output: ARIA labels, keyboard nav, focus management status
```

---

## Part 3: Pre-Execution Framework for Code Implementation

### Backend-Dev Pre-Execution Checklist

```markdown
# Backend-Dev Pre-Execution Protocol

## Phase 0: Automated Context Gathering (RUN FIRST)

```bash
# 1. Load story context (500 tokens saved)
./scripts/load-story-context.sh {story-id}

# 2. Query table schemas (2500 tokens saved)
./scripts/query-table-schema.sh {table_name}

# 3. Find API patterns (1500 tokens saved)
./scripts/extract-api-endpoints.sh apps/frontend/app/api/{module} | jq '.'

# 4. Extract service patterns (2500 tokens saved) - PROPOSED
./scripts/extract-service-patterns.sh {similar_service}

# 5. Analyze Zod schemas (800 tokens saved) - PROPOSED
./scripts/analyze-zod-schema.sh {entity}
```

## Phase 1: Planning (5 minutes)

Based on script outputs:
- [ ] Identify files_to_create from context
- [ ] Verify dependencies are met (check tables exist)
- [ ] Choose service pattern to follow
- [ ] Identify Zod schema to create/extend

## Phase 2: Implementation

- [ ] Write code following TDD (make failing tests pass)
- [ ] Run tests after each change: `pnpm test {test_file}`
- [ ] Validate org_id usage (multi-tenancy)
- [ ] Use consistent error handling (handleApiError)

## Phase 3: Verification

```bash
# Verify RLS compliance (600 tokens saved) - PROPOSED
./scripts/verify-rls-compliance.sh {service_file}

# Run all tests
pnpm test

# Type check
pnpm typecheck
```

## Phase 4: Handoff

- [ ] Append checkpoint
- [ ] Update PROJECT-STATE.md
- [ ] Handoff to SENIOR-DEV for refactor
```

---

### Frontend-Dev Pre-Execution Checklist

```markdown
# Frontend-Dev Pre-Execution Protocol

## Phase 0: Automated Context Gathering (RUN FIRST)

```bash
# 1. Load story context (500 tokens saved)
./scripts/load-story-context.sh {story-id}

# 2. Extract component patterns (2000 tokens saved) - PROPOSED
./scripts/extract-component-patterns.sh {component_type}

# 3. List ShadCN usage in module (800 tokens saved) - PROPOSED
./scripts/list-shadcn-usage.sh {module}
```

## Phase 1: Planning (5 minutes)

Based on script outputs:
- [ ] Identify UX wireframe reference
- [ ] Choose similar component to follow
- [ ] Plan 4 states: loading, error, empty, success
- [ ] Identify ShadCN components needed

## Phase 2: Implementation

- [ ] Write component following pattern
- [ ] Implement all 4 states
- [ ] Add keyboard navigation (Tab, Enter, Escape)
- [ ] Add ARIA labels
- [ ] Run tests after each change

## Phase 3: Verification

```bash
# Check a11y patterns (600 tokens saved) - PROPOSED
./scripts/check-a11y-patterns.sh {component_file}

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Phase 4: Handoff

- [ ] Append checkpoint
- [ ] Handoff to SENIOR-DEV for refactor
```

---

### Senior-Dev Pre-Execution Checklist

```markdown
# Senior-Dev Pre-Execution Protocol

## Phase 0: Automated Analysis (RUN FIRST)

```bash
# 1. Verify tests are GREEN
pnpm test

# 2. Detect code smells (1500 tokens saved) - PROPOSED
./scripts/detect-code-smells.sh {file_path}

# 3. Find duplicates (1200 tokens saved) - PROPOSED
./scripts/find-duplicates.sh {directory}
```

## Phase 1: Prioritize Refactoring

Based on script outputs:
- [ ] List smells by severity (CRITICAL > MEDIUM > LOW)
- [ ] Identify duplications worth extracting
- [ ] Plan refactoring order (small changes first)

## Phase 2: Refactor Loop

For each refactoring:
1. Make ONE small change
2. Run tests immediately
3. If GREEN -> commit
4. If RED -> UNDO immediately
5. Repeat

## Phase 3: Documentation

- [ ] Create ADR if architectural decision
- [ ] Update PATTERNS.md if new pattern
- [ ] Append checkpoint

## Phase 4: Handoff

- [ ] Handoff to CODE-REVIEWER
```

---

## Part 4: Implementation Roadmap

### Week 1: High-Priority Scripts (3 scripts)

| Day | Script | Owner | Effort |
|-----|--------|-------|--------|
| 1-2 | CODE-001: extract-service-patterns.sh | Backend | 4h |
| 2-3 | CODE-002: extract-component-patterns.sh | Frontend | 4h |
| 3-4 | CODE-003: detect-code-smells.sh | Senior | 6h |

**Week 1 Savings**: 6,000 tokens/story

### Week 2: Medium-Priority Scripts (3 scripts)

| Day | Script | Owner | Effort |
|-----|--------|-------|--------|
| 1 | CODE-004: analyze-zod-schema.sh | Backend | 2h |
| 2 | CODE-005: find-duplicates.sh | Senior | 4h |
| 3 | CODE-006: verify-rls-compliance.sh | Backend | 2h |

**Week 2 Savings**: 2,600 tokens/story

### Integration (Week 2)

- Update agent definitions to reference scripts
- Add pre-execution protocol to QUICK-START.md
- Create script documentation in scripts/README.md

---

## Summary: Token Savings Per Story

| Agent | Manual Tokens | After Scripts | Savings |
|-------|---------------|---------------|---------|
| backend-dev | 10,700 | 2,300 | 8,400 (78%) |
| frontend-dev | 7,100 | 1,800 | 5,300 (75%) |
| senior-dev | 5,300 | 1,900 | 3,400 (64%) |

**Average per story**: ~5,700 tokens saved
**Per sprint (25 stories)**: ~142,500 tokens saved
**Monthly (100 stories)**: ~570,000 tokens saved

---

## Existing Scripts Already Available

| Script | Purpose | Token Savings | Ready |
|--------|---------|---------------|-------|
| load-story-context.sh | Parse story YAML | 1,000 | YES |
| query-table-schema.sh | Extract table schema | 2,500 | YES |
| extract-api-endpoints.sh | List API routes | 1,500 | YES (needs enhancement) |

**Total existing script savings**: 5,000 tokens/story (already available!)

---

## Appendix: Script Specifications Summary

### Recommended Implementation Order

1. **CODE-001**: extract-service-patterns.sh (HIGH - backend critical path)
2. **CODE-002**: extract-component-patterns.sh (HIGH - frontend critical path)
3. **CODE-003**: detect-code-smells.sh (HIGH - refactor critical path)
4. **CODE-004**: analyze-zod-schema.sh (MEDIUM - quick win)
5. **CODE-006**: verify-rls-compliance.sh (MEDIUM - security critical)
6. **CODE-005**: find-duplicates.sh (MEDIUM - requires jscpd integration)

### Not Recommended (Low ROI)

- CODE-007: list-shadcn-usage.sh (occasional use)
- CODE-008: check-a11y-patterns.sh (accessibility-checklist skill covers this)

---

## Conclusion

The code implementation workflow has significant optimization potential through script automation:

1. **Existing scripts underutilized**: 3 scripts exist but agents don't consistently use them
2. **High-value scripts missing**: 3 new scripts would save 6,000 tokens/story
3. **Pre-execution framework needed**: Standardized "Phase 0" for all dev agents
4. **Integration critical**: Scripts must be referenced in agent definitions and procedures

**Immediate Action**:
- Enforce existing script usage in agent workflows
- Implement CODE-001, CODE-002, CODE-003 this week
- Add "Phase 0" to all dev agent definitions
