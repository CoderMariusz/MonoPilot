# Quality Gates - Shared Standards

Common quality criteria that apply across all stories and all agents. Agent-specific gates remain in their individual files. These are the universal "must haves" for any code/work to move forward.

---

## Universal Quality Gate: Tests Pass

**Applies To**: All implementation phases (P3)

**What It Means**:
- No tests are failing
- 100% of acceptance criteria have passing tests
- Tests can be run with: `npm test`
- All tests pass consistently (not flaky)

**Verification**:
```bash
npm test
# Output must show:
# PASS  <test-files>
# Tests:  X passed, 0 failed
# Coverage: adequate for new code
```

**Gate Decision**:
- PASS if: All tests pass consistently
- FAIL if: Any test fails, even intermittently
- FAIL if: New code coverage below 80%

**Who Checks**: Test-Engineer (after dev implements)

---

## Universal Quality Gate: No Hardcoded Secrets

**Applies To**: All code (P3, P4)

**What It Means**:
- No API keys, passwords, tokens in code
- No credentials in config files
- No secrets in error messages
- No secrets in logs

**Search Pattern**:
```bash
grep -r "api.key\|password\|token\|secret" apps/
grep -r "BEGIN RSA\|BEGIN PRIVATE" apps/
# Should return: no results or only in .env/.env.example
```

**Common Violations**:
```javascript
// FAIL - hardcoded secret
const API_KEY = "sk_live_abc123xyz";
const password = "admin123";

// FAIL - in error message
console.error(`Auth failed: token=${token}`);

// PASS - from environment
const API_KEY = process.env.STRIPE_API_KEY;
const dbUrl = process.env.DATABASE_URL;
```

**Gate Decision**:
- PASS if: No hardcoded secrets found
- FAIL if: Any secrets found in code
- CRITICAL severity if found before commit

**Who Checks**: Code-Reviewer, Security-aware agents

---

## Universal Quality Gate: Input Validation

**Applies To**: All API endpoints and service methods (P3)

**What It Means**:
- All external input is validated
- API routes validate request body, params, query
- Service methods validate parameters
- Validation uses Zod schemas where possible
- Invalid input returns 400 Bad Request (API) or throws validation error (service)

**Examples**:

```typescript
// FAIL - no validation
export async function GET(request: Request) {
  const { id } = req.query;  // Could be anything
  return await getProduct(id);
}

// PASS - validated
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const validation = IdSchema.safeParse(id);
  if (!validation.success) {
    return new Response('Invalid ID', { status: 400 });
  }

  return await getProduct(validation.data);
}

// PASS - service validation
async function updateProduct(id: string, data: unknown) {
  const validation = ProductUpdateSchema.safeParse(data);
  if (!validation.success) {
    throw new ValidationError('Invalid product data', validation.error);
  }
  return await db.products.update(id, validation.data);
}
```

**Gate Decision**:
- PASS if: All inputs validated with error handling
- FAIL if: Any input accepted without validation
- CRITICAL if: Parameter used in SQL query without validation (SQL injection risk)

**Who Checks**: Code-Reviewer, Security-aware agents

---

## Universal Quality Gate: Error Handling

**Applies To**: All code (P3, P4)

**What It Means**:
- Functions handle errors gracefully
- API routes return appropriate status codes (400/401/403/404/500)
- No uncaught exceptions
- Errors logged with context
- User-facing errors don't expose sensitive info

**Examples**:

```typescript
// FAIL - no error handling
export async function GET(request: Request) {
  const data = await db.query('SELECT * FROM products');
  return Response.json(data);
}

// FAIL - swallows error
export async function GET(request: Request) {
  try {
    const data = await db.query('SELECT * FROM products');
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Something failed' });
  }
}

// PASS - proper error handling
export async function GET(request: Request) {
  try {
    const data = await db.query('SELECT * FROM products');
    return Response.json(data);
  } catch (error) {
    console.error('Product query failed:', error);
    if (error instanceof ValidationError) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    // Generic error, don't expose details
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Gate Decision**:
- PASS if: All error paths handled with appropriate status codes
- FAIL if: Unhandled exceptions or generic 500s
- FAIL if: Error messages expose sensitive info

**Who Checks**: Code-Reviewer, Test-Engineer

---

## Universal Quality Gate: Multi-Tenancy (org_id)

**Applies To**: All data access (P3)

**What It Means**:
- Every database query includes org_id filter
- org_id comes from authenticated user context
- No data from other organizations accessible
- RLS policies verified in place

**Pattern**:

```typescript
// FAIL - no org_id filter
async function getProducts() {
  return await supabase
    .from('products')
    .select('*');  // Gets ALL products
}

// FAIL - org_id from request (user could spoof)
async function getProducts(orgId: string) {
  return await supabase
    .from('products')
    .select('*')
    .eq('org_id', orgId);  // Trusts user input
}

// PASS - org_id from auth context
async function getProducts(user: User) {
  return await supabase
    .from('products')
    .select('*')
    .eq('org_id', user.user_metadata.org_id);  // From JWT
}

// PASS - RLS handles it
async function getProducts() {
  return await supabase
    .from('products')
    .select('*');  // RLS policy filters by org_id
}
```

**Gate Decision**:
- PASS if: All queries filtered by org_id OR RLS policy covers it
- FAIL if: Data from other orgs could leak
- CRITICAL if: org_id sourced from untrusted request data

**Who Checks**: Code-Reviewer, Security-aware agents

---

## Universal Quality Gate: No SQL Injection

**Applies To**: All database operations (P3, P4)

**What It Means**:
- All database operations use parameterized queries
- No string concatenation in SQL
- No user input directly in query strings

**Examples**:

```typescript
// FAIL - SQL injection vulnerability
const name = req.query.name;
const query = `SELECT * FROM products WHERE name = '${name}'`;
// Attacker: name=' OR '1'='1

// FAIL - string concatenation
const query = `SELECT * FROM products WHERE id = ${id}`;
// Attacker: id = 1 OR 1=1

// PASS - parameterized query
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('name', name);  // Parameter separate from query

// PASS - explicit parameters (if using raw SQL)
const { data } = await supabase.rpc('get_products', {
  p_name: name,
  p_org_id: orgId
});
```

**Gate Decision**:
- PASS if: All queries parameterized
- FAIL if: Any string concatenation in queries
- CRITICAL severity (security)

**Who Checks**: Code-Reviewer, Security-aware agents

---

## Universal Quality Gate: Type Safety

**Applies To**: All TypeScript code (P3, P4)

**What It Means**:
- Code compiles without TypeScript errors
- No `any` type (use `unknown` + type guard instead)
- All functions have return types
- All external data validated to type

**Verification**:
```bash
npm run typecheck
# Output must show: no errors
```

**Examples**:

```typescript
// FAIL - uses any
function processData(data: any) {
  return data.name.toUpperCase();
}

// FAIL - missing return type
function getProduct(id) {
  return db.products.findById(id);
}

// PASS - explicit types
function processData(data: unknown): string {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('Invalid data');
  }
  const schema = DataSchema.safeParse(data);
  if (!schema.success) throw schema.error;
  return schema.data.name.toUpperCase();
}

// PASS - return type specified
async function getProduct(id: string): Promise<Product | null> {
  return db.products.findById(id);
}
```

**Gate Decision**:
- PASS if: `npm run typecheck` returns 0 errors
- PASS if: No `any` types (use `unknown`)
- FAIL if: Type errors or widespread `any` usage

**Who Checks**: Test-Engineer (pre-commit), Code-Reviewer

---

## Universal Quality Gate: No Console Logs (Production)

**Applies To**: All code shipped to production (P3, P4)

**What It Means**:
- No `console.log()` statements in implementation
- Only `console.error()` for errors (caught by linter usually)
- No debug code left in
- Use proper logging framework for production

**Examples**:

```typescript
// FAIL - debug console.log left in
async function getProducts() {
  console.log('Fetching products...');
  const data = await db.getProducts();
  console.log('Got:', data);
  return data;
}

// PASS - removed debug logs
async function getProducts() {
  const data = await db.getProducts();
  return data;
}

// PASS - production logging
async function getProducts() {
  logger.debug('Fetching products...');
  const data = await db.getProducts();
  logger.debug('Product count:', data.length);
  return data;
}
```

**Gate Decision**:
- PASS if: No `console.log()` found in code
- FAIL if: Debug logs left in
- FAIL if: Sensitive data in any logs

**Who Checks**: Linter (npm run lint), Code-Reviewer

---

## Universal Quality Gate: Commit Message Quality

**Applies To**: All commits (P3, P4, at any phase)

**What It Means**:
- Commits follow conventional commits format
- Messages describe "why" not "what"
- No commits with `WIP`, `temp`, `debug`
- Commit granularity: one logical unit per commit

**Format**:
```
<type>(<scope>): <subject>

<body - explain why this change>

Co-Authored-By: Agent Name <noreply@anthropic.com>
```

**Examples**:

```
FAIL - bad commit messages:
- "fix stuff"
- "WIP: testing"
- "debug: console logs"
- "temp fix, revert later"

PASS - good commit messages:
- "feat(products): Add GS1-14 validation for product creation"
- "fix(quality): Resolve hardcoded org_id in NCRService - Multi-tenant isolation"
- "refactor(batch-release): Extract magic strings to constants"
```

**Gate Decision**:
- PASS if: Commits follow conventional format
- FAIL if: WIP, temp, or vague messages
- FAIL if: Too many files in one commit (>15 files usually indicates bundling)

**Who Checks**: Linter, Code-Reviewer, Git history review

---

## Universal Quality Gate: Performance Acceptable

**Applies To**: All code (P3, P4) - measured during QA

**What It Means**:
- API responses within acceptable time
- UI interactions feel responsive
- Database queries complete in reasonable time
- No N+1 query problems

**Targets**:
```
API endpoint response:  < 200ms (p95)
Page load time:         < 2s (p95)
Database query:         < 100ms (p95)
Component render:       < 50ms (p95)
Search results:         < 500ms (p95)
```

**Measurement**:
```bash
# API performance
time curl http://localhost:3000/api/products

# Page load
lighthouse https://localhost:3000/products

# Database query
SELECT query_time FROM logs WHERE endpoint = '/api/products' ORDER BY query_time DESC LIMIT 1;
```

**Gate Decision**:
- PASS if: Metrics within targets
- FAIL if: Metrics exceed targets by >20%
- WARNING if: Approaching limits (>80% of target)

**Who Checks**: QA-Agent (P6), Senior-Dev during refactor (P4)

---

## Phase-Specific Gates

### Additional P2 (Test Writing) Gates

**100% Acceptance Criteria Coverage**
- Every AC has at least one test
- Test names clearly describe what they test
- Edge cases covered (null, empty, invalid)

**Test Independence**
- Tests can run in any order
- No shared state between tests
- Each test sets up its own fixtures

### Additional P3 (Implementation) Gates

**All Tests Pass**
- `npm test` returns exit code 0
- Tests pass consistently (run 2-3 times)
- No flaky or timing-dependent tests

**Code Coverage**
- New code: 80%+ coverage
- Overall: maintain or improve coverage
- No "coverage holes" in critical paths

### Additional P4 (Refactor) Gates

**Behavior Preserved**
- All tests still pass (same as before)
- No new behavior changes
- Edge cases handled same way

**Code Quality Improved**
- At least one code smell addressed
- Complexity reduced or clarified
- Maintainability improved

### Additional P5 (Code Review) Gates

**Security Review Complete**
- No hardcoded secrets
- Input validation present
- Auth/authorization enforced
- No SQL injection risks
- No XSS vulnerabilities

**Documentation Present**
- Complex functions have comments
- API endpoints documented
- Database changes tracked
- Breaking changes noted

### Additional P6 (QA Testing) Gates

**All Acceptance Criteria Met**
- Every AC verified passing
- User workflows complete end-to-end
- Edge cases handled
- Error cases tested

**No Critical Bugs**
- Data integrity maintained
- No crashes or errors
- Performance acceptable
- UI responsive

---

## Quality Gate Decision Matrix

| Gate | P2 | P3 | P4 | P5 | P6 |
|------|----|----|----|----|-----|
| Tests Pass | ✓ | ✓ | ✓ | Check | Check |
| No Hardcoded Secrets | - | ✓ | ✓ | ✓ | - |
| Input Validation | - | ✓ | ✓ | ✓ | - |
| Error Handling | - | ✓ | ✓ | ✓ | - |
| Multi-Tenancy (org_id) | - | ✓ | ✓ | ✓ | - |
| No SQL Injection | - | ✓ | ✓ | ✓ | - |
| Type Safety | - | ✓ | ✓ | ✓ | - |
| No Console Logs | - | ✓ | ✓ | ✓ | - |
| Commit Messages | - | ✓ | ✓ | ✓ | - |
| Performance OK | - | - | ✓ | Check | ✓ |
| All AC Covered | ✓ | - | - | ✓ | ✓ |

---

## Using This Document

### For Implementation Agents (P3)
1. Verify every gate in the P3 column
2. Run `npm test` before handing off
3. Run `npm run typecheck` before commit
4. Search for hardcoded secrets before commit

### For Code Reviewers (P5)
1. Check all P3 + P5 gates from the matrix
2. Verify security gates (secrets, injection, auth)
3. Confirm commit messages follow format
4. Return REQUEST_CHANGES if any gate fails

### For QA Agents (P6)
1. Verify all AC (acceptance criteria) met
2. Spot-check critical gates (security, data integrity)
3. Performance check against targets
4. Document any gate violations with severity

### For Senior-Dev (P4)
1. Maintain all P3 gates (tests still pass)
2. Improve code quality (reduce complexity)
3. Verify no console logs or debug code
4. Document any deferred refactoring needs

---

## Integration with Agent Files

Each agent file should include:

```markdown
## Quality Standards

See: `.claude/procedures/quality-gates-common.md`

Universal gates for ALL code:
- Tests must pass
- No hardcoded secrets
- Input validation required
- Type safety enforced
- Multi-tenancy (org_id) checked

Additional [AGENT-NAME] specific gates:
- [agent-specific gate 1]
- [agent-specific gate 2]
```

---

## References

- `.claude/PATTERNS.md` - Code patterns following quality standards
- `.claude/checklists/` - Pre-commit checklists
- `npm run lint` - Automated code quality checks
- `npm run typecheck` - TypeScript verification
- `npm test` - Unit test verification
- Conventional Commits: https://www.conventionalcommits.org/

