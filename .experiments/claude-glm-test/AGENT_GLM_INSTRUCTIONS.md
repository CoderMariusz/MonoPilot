# Agent Instructions - Using GLM Internally for Hybrid Approach

**For Agents**: test-writer, backend-dev, frontend-dev, tech-writer

---

## 🎯 How Agents Use GLM

### Agent Workflow Pattern

```
1. Receive task from orchestrator
2. Load story context
3. Create GLM prompt (agent's expertise)
4. Call GLM via glm_call_updated.py
5. Validate output
6. Save to checkpoint
7. Return micro-handoff to orchestrator
```

---

## 📝 TEST-WRITER Agent (Uses GLM-4.7)

### Task Delegation from Orchestrator:
```
Task(test-writer): Story 01.2 P2
Do: Write comprehensive Vitest tests for User Roles CRUD
Read: docs/2-MANAGEMENT/epics/current/01-settings/01.2.user-roles.md
Exit: Tests written with >50 cases, checkpoint updated
```

### Agent Internal Process:

**Step 1**: Load story context
```python
story = read_file("docs/2-MANAGEMENT/epics/current/01-settings/01.2.user-roles.md")
patterns = read_file(".claude/PATTERNS.md")
```

**Step 2**: Create GLM prompt
```python
glm_prompt = f"""
Write comprehensive Vitest unit tests for User Roles CRUD feature.

Requirements from story:
{story}

Test Coverage Required:
- Service layer: getAllRoles, createRole, updateRole, deleteRole, assignRole
- Validation: Zod schemas for role creation/update
- API routes: GET/POST/PUT/DELETE /api/settings/roles
- Edge cases: duplicates, invalid UUIDs, permission checks

Output: Complete test file with 50+ test cases

Tech stack: Next.js 15, TypeScript, Supabase, Zod, Vitest

Follow patterns:
{patterns}
"""
```

**Step 3**: Call GLM
```bash
python .experiments/claude-glm-test/scripts/glm_call_updated.py \
  --model glm-4.7 \
  --thinking \
  --temperature 0.7 \
  --max-tokens 4096 \
  --prompt "$glm_prompt" \
  --output .claude/checkpoints/01.2/P2_tests.test.ts \
  --json
```

**Step 4**: Validate output
```python
# Check GLM output
test_file = read_file(".claude/checkpoints/01.2/P2_tests.test.ts")

# Count test cases
test_count = test_file.count("it('should")

# Validate
if test_count < 50:
    # Re-prompt GLM with "add more test cases"
    ...

# Check TypeScript syntax
result = subprocess.run(['npx', 'tsc', '--noEmit', test_file])
if result.returncode != 0:
    # GLM made syntax errors, fix them
    ...
```

**Step 5**: Update checkpoint
```yaml
# .claude/checkpoints/01.2.yaml
phases:
  - phase: "P2"
    agent: "test-writer"
    status: "completed"
    glm_usage:
      model: "glm-4.7"
      thinking: true
      tokens_output: 2800
    claude_orchestration: 500
    deliverables:
      - "P2_tests.test.ts"
    test_count: 52
```

**Step 6**: Return to orchestrator
```
P2: ✓ test-writer | tests: 52 | glm: 2800 tokens | claude: 500 tokens
```

---

## 💻 BACKEND-DEV / FRONTEND-DEV Agents (Use GLM-4.7)

### Task Delegation:
```
Task(backend-dev): Story 01.2 P3
Do: Implement User Roles service + API routes + migration
Read: .claude/checkpoints/01.2.yaml
Exit: Implementation complete, tests passing
```

### Agent Internal Process:

**Step 1**: Create implementation prompt
```python
glm_prompt = f"""
Implement User Roles CRUD for MonoPilot Food MES.

Files to create:
1. Migration: supabase/migrations/XXX_create_roles_table.sql
   - Table: roles (id, org_id, name, description, permissions[], created_at)
   - RLS policy for org isolation
   - Indexes on org_id

2. Service: apps/frontend/lib/services/role-service.ts
   - getAllRoles(orgId)
   - createRole(data)
   - updateRole(roleId, data)
   - deleteRole(roleId)
   - assignRoleToUser(userId, roleId)

3. Validation: apps/frontend/lib/validation/role-schemas.ts
   - createRoleSchema (Zod)
   - updateRoleSchema (Zod)

4. API Routes:
   - GET /api/settings/roles/route.ts
   - POST /api/settings/roles/route.ts
   - PUT /api/settings/roles/[roleId]/route.ts
   - DELETE /api/settings/roles/[roleId]/route.ts

Tech Stack: Next.js 15, TypeScript, Supabase, Zod

Follow patterns:
{read_file('.claude/PATTERNS.md')}

Make tests pass (from P2):
{read_file('.claude/checkpoints/01.2/P2_tests.test.ts')}
"""
```

**Step 2**: Call GLM-4.7
```bash
python glm_call_updated.py \
  --model glm-4.7 \
  --thinking \
  --context .claude/PATTERNS.md \
  --context .claude/TABLES.md \
  --context .claude/checkpoints/01.2/P2_tests.test.ts \
  --prompt "$glm_prompt" \
  --output P3_implementation.md
```

**Step 3**: Extract code files
```python
# Parse markdown output, extract code blocks
# Save to actual files:
# - supabase/migrations/100_create_roles_table.sql
# - apps/frontend/lib/services/role-service.ts
# - etc.
```

**Step 4**: Validate
```bash
# TypeScript check
npx tsc --noEmit

# Run tests
pnpm vitest run P2_tests.test.ts

# Count files created
```

**Step 5**: Checkpoint
```yaml
phases:
  - phase: "P3_iter1"
    agent: "backend-dev"
    glm_usage:
      model: "glm-4.7"
      tokens_output: 4800
    claude_orchestration: 1200
    files_created: 5
    tests_status: "12/12 passing"
```

**Step 6**: Return
```
P3: ✓ backend-dev | files: 5 | tests: 12/12 | glm: 4800 | claude: 1200
```

---

## 📝 TECH-WRITER Agent (Uses GLM-4.5-Air)

### Task Delegation:
```
Task(tech-writer): Story 01.2 P7
Do: Generate API documentation and user guide
Read: .claude/checkpoints/01.2.yaml
Exit: Documentation complete
```

### Agent Internal Process:

**Step 1**: Create doc prompt
```python
glm_prompt = f"""
Generate comprehensive documentation for User Roles CRUD.

Sections:
1. API Reference
   - GET /api/settings/roles
   - POST /api/settings/roles
   - PUT /api/settings/roles/:id
   - DELETE /api/settings/roles/:id
   - Examples for each

2. User Guide
   - How to create a role
   - How to assign permissions
   - How to assign role to user

3. Database Schema
   - roles table structure
   - RLS policies

Format: Markdown

Implementation:
{read_file('P3_iter2_fixes.md')}
"""
```

**Step 2**: Call GLM-4.5-Air (fast, cheap)
```bash
python glm_call_updated.py \
  --model glm-4.5-air \
  --no-thinking \
  --temperature 1.0 \
  --max-tokens 8192 \
  --prompt "$glm_prompt" \
  --output P7_documentation.md
```

**Step 3**: Light formatting
```python
# Add table of contents
# Fix markdown formatting
# Add links
```

**Step 4**: Return
```
P7: ✓ tech-writer | glm-4.5-air: 2500 tokens | claude: 600
```

---

## 🔄 ITERATION HANDLING (P3 → P5 → P3)

### If P5 Returns REQUEST_CHANGES:

**Orchestrator sees**:
```
P5: ✗ code-reviewer | decision: request_changes | bugs: 7
```

**Orchestrator delegates P3 iter2**:
```
Task(backend-dev): Story 01.2 P3 iter2
Do: Fix 7 bugs found in code review
Read: .claude/checkpoints/01.2/P5_iter1_review.md
Exit: All bugs fixed
```

**backend-dev Agent**:

**Step 1**: Parse bug list from P5 review
```python
bugs = extract_bugs_from_review("P5_iter1_review.md")
# Returns:
# [
#   {"file": "role-service.ts", "line": 25, "issue": "Missing RLS check", "fix": "Add .eq('org_id', orgId)"},
#   ...
# ]
```

**Step 2**: Create fix prompt for GLM
```python
glm_fix_prompt = f"""
Fix the following 7 bugs in User Roles implementation:

BUG #1: Missing RLS check in getAllRoles
- File: role-service.ts:25
- Issue: Query doesn't filter by org_id
- Fix: Add .eq('org_id', orgId) to Supabase query

BUG #2: ...
... (all 7 bugs)

Original implementation:
{read_file('P3_iter1_implementation.md')}

Provide complete fixed code for each affected file.
"""
```

**Step 3**: Call GLM
```bash
python glm_call_updated.py \
  --model glm-4.7 \
  --thinking \
  --context P5_iter1_review.md \
  --prompt "$glm_fix_prompt" \
  --output P3_iter2_fixes.md
```

**Step 4**: Return
```
P3 iter2: ✓ backend-dev | bugs_fixed: 7 | glm: 2500 | claude: 1000
```

---

## ⚙️ AGENT CONFIGURATION (For System Prompts)

### Add to Each Agent's System Prompt:

**test-writer**:
```yaml
hybrid_mode:
  enabled: true
  glm_model: "glm-4.7"
  glm_thinking: true
  glm_temperature: 0.7
  glm_max_tokens: 4096
  glm_script: ".experiments/claude-glm-test/scripts/glm_call_updated.py"

instructions:
  - Create detailed prompt for GLM based on story requirements
  - Call GLM via glm_call_updated.py
  - Validate generated tests (count, syntax, coverage)
  - Update checkpoint with GLM token usage
  - Return micro-handoff with test count
```

**backend-dev / frontend-dev**:
```yaml
hybrid_mode:
  enabled: true
  glm_model: "glm-4.7"
  glm_thinking: true
  glm_temperature: 0.7

instructions:
  - Create implementation spec for GLM
  - Include: architecture patterns, database schema, test context
  - Call GLM for code generation
  - Extract code from markdown blocks
  - Validate TypeScript syntax
  - Run tests to verify
  - Update checkpoint
```

**tech-writer**:
```yaml
hybrid_mode:
  enabled: true
  glm_model: "glm-4.5-air"
  glm_thinking: false
  glm_temperature: 1.0
  glm_max_tokens: 8192

instructions:
  - Create documentation structure
  - Call GLM-4.5-Air for content generation
  - Format output
  - Update checkpoint
```

---

## 🚀 TRANSPARENCY FOR USER

**Z Twojej perspektywy** (po wdrożeniu):

### Wywołujesz (normalnie jak MASTER-PROMPT):
```
Task(test-writer): Story 01.2 P2
```

### Agent robi (pod maską):
```
1. Load story ✅
2. Create GLM prompt ✅
3. Call glm_call_updated.py --model glm-4.7 ✅ (internal)
4. Validate output ✅
5. Save checkpoint ✅
6. Return: "P2: ✓ tests: 52 | glm: 2800 | claude: 500"
```

### Widzisz w output:
```
test-writer: Generating tests via GLM-4.7 (Deep Thinking enabled)...
test-writer: GLM generated 52 test cases (2,800 tokens)
test-writer: Validation passed
test-writer: P2 complete

Checkpoint: .claude/checkpoints/01.2.yaml
Tokens: GLM 2,800 + Claude orchestration 500 = 3,300 total
Cost: $0.013
```

**Nie musisz** ręcznie wywoływać `glm_call_updated.py` - agent robi to sam!

---

## 📊 TOKEN TRACKING (Automatic)

### Checkpoint Format (Auto-Updated by Agents):

```yaml
story_id: "01.2"
scenario: "b"
approach: "hybrid"

phases:
  - phase: "P2"
    agent: "test-writer"
    tokens:
      claude_orchestration: 500
      glm_execution: 2800
      total: 3300
    cost_usd:
      claude: 0.009
      glm: 0.002
      total: 0.011
    deliverable: "P2_tests.test.ts"

  - phase: "P3_iter1"
    agent: "backend-dev"
    tokens:
      claude_orchestration: 1200
      glm_execution: 4800
      total: 6000
    cost_usd:
      claude: 0.022
      glm: 0.003
      total: 0.025

# ... etc
```

**Monitoring**: Po każdym story uruchom:
```bash
python hybrid_monitor.py --story 01.2 --action all
# Automatycznie sprawdza checkpoint.yaml i waliduje metryki
```

---

## 🎯 BENEFIT: Same UX as MASTER-PROMPT

**Dla Ciebie nic się nie zmienia**:
- Wywołujesz `Task(test-writer)` jak zawsze
- Agent używa GLM pod maską
- Widzisz token breakdown w checkpoincie
- Monitorujesz 1 komendą

**Savings**: 53% cost, parallel execution = win-win! 🎉
