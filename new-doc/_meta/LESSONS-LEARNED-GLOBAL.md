# Lessons Learned from 341 Bug Fixes

**Analysis Date**: 2026-02-16
**Source**: MonoPilot production bug fixes (Jan-Feb 2026)

## Executive Summary

- **Total Fixes**: 341 commits
- **Time Period**: ~30 days of intensive development
- **Average**: ~11 bugs fixed per day

### Most Bug-Prone Modules

| Module | Count | % of Total |
|--------|-------|------------|
| 00-foundation | 94 | 27.6% |
| 02-technical | 86 | 25.2% |
| 01-settings | 76 | 22.3% |
| 03-planning | 28 | 8.2% |
| 06-quality | 17 | 5.0% |

### Most Common Bug Types

| Type | Count | % of Total |
|------|-------|------------|
| API | 118 | 34.6% |
| UI | 109 | 32.0% |
| Security | 104 | 30.5% |
| Data/DB | 95 | 27.9% |
| E2E/Testing | 76 | 22.3% |

---

## Bug Distribution by Module

| Module | Count | % | Top Bug Types |
|--------|-------|---|---------------|
| 00-foundation | 94 | 27.6% | Other, Data/DB, Security |
| 02-technical | 86 | 25.2% | UI, API, Security |
| 01-settings | 76 | 22.3% | API, Security, UI |
| 03-planning | 28 | 8.2% | UI, Type/TypeScript, Other |
| 06-quality | 17 | 5.0% | Security, API, Data/DB |
| 05-warehouse | 13 | 3.8% | UI, Data/DB, API |
| 00-testing | 12 | 3.5% | E2E/Testing, API, Data/DB |
| 00-dashboard | 7 | 2.1% | Security, Other, API |
| 05-scanner | 5 | 1.5% | Other, Validation, Security |
| 07-shipping | 2 | 0.6% | Other, API, UI |
| 04-production | 1 | 0.3% | Other |

## Bug Distribution by Type

| Type | Count | % | Example |
|------|-------|---|----------|
| API | 118 | 34.6% | fix: dashboard ui and settings stats display issues... |
| UI | 109 | 32.0% | fix: dashboard ui and settings stats display issues... |
| Security | 104 | 30.5% | fix: dashboard ui and settings stats display issues... |
| Data/DB | 95 | 27.9% | fix: dashboard ui and settings stats display issues... |
| E2E/Testing | 76 | 22.3% | Add structured handoff files and bug-fixing skill; implement... |
| Type/TypeScript | 69 | 20.2% | fix(technical): auth endpoints, security headers, rate limit... |
| Other | 59 | 17.3% | docs: Update bugs.md - Mark all 7 Settings bugs as FIXED (co... |
| Validation | 46 | 13.5% | BUG-W-002: Add barcode uniqueness validation to prevent dupl... |
| Routing | 30 | 8.8% | Add structured handoff files and bug-fixing skill; implement... |
| State Management | 20 | 5.9% | fix(settings): BUG-SET-001,002,003,004,005,006,007 - Enhance... |
| UX | 20 | 5.9% | Fix Warehouse bugs W7: Complete transfer order workflow with... |
| Performance | 13 | 3.8% | fix(technical): CORS, security headers, pagination endpoint... |
| Integration | 8 | 2.3% | Fix: Add 10s timeout to auth login to prevent hanging on Sup... |

---

## Top 15 Bug Patterns (with Prevention Rules)

### Pattern 1: Missing RLS Policies / SELECT Permissions

**Frequency**: 12 occurrences

**Example commits**: 5afcd9b5, 7a54e3d5, 992cf1cf

**Root cause**: New tables created without proper Row Level Security (RLS) policies, or missing SELECT policies for authenticated users.

**Fix pattern**: Add migration with RLS policies for SELECT, INSERT, UPDATE, DELETE using org_id filtering.

**RULE**: Every new table MUST have RLS enabled and policies created in same migration. Use template: `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY; CREATE POLICY {table}_select ON {table} FOR SELECT USING (org_id = auth.org_id());`

**Affected modules**: 01-settings, 02-technical, 05-warehouse

---

### Pattern 2: Hardcoded org_id in Service Layer

**Frequency**: 8 occurrences

**Example commits**: e2b5b0e8

**Root cause**: Service methods using hardcoded org_id values instead of extracting from authenticated user context. Critical security violation in multi-tenant SaaS.

**Fix pattern**: Extract org_id from authenticated session in API route, pass as parameter to service method. Service methods should NEVER hardcode org_id.

**RULE**: All service methods that query DB MUST accept orgId parameter. API routes extract from `auth.orgId`. Never use hardcoded UUIDs. Add ESLint rule to detect hardcoded UUID patterns in service files.

**Affected modules**: 06-quality, 01-settings, 03-planning

---

### Pattern 3: Schema Mismatch (Code vs Database)

**Frequency**: 15 occurrences

**Example commits**: 3eb082e0, 175e231b, 5afcd9b5

**Root cause**: Code references old column names after schema migrations (e.g., unit_cost → cost_per_unit, is_active → status, flat location schema → hierarchical).

**Fix pattern**: Search codebase for all references to old column name, replace with new column name. Check services, API routes, and components.

**RULE**: When migrating schema, use grep to find ALL references: `grep -r 'old_column_name' apps/frontend/`. Update all in single commit. Add TypeScript types matching exact DB schema. Use codegen tools like supabase gen types.

**Affected modules**: 05-warehouse, 02-technical, 01-settings

---

### Pattern 4: Next.js Dynamic Route Slug Conflicts

**Frequency**: 6 occurrences

**Example commits**: 19b425d0

**Root cause**: Using different slug names ([id] vs [woId] vs [supplierId]) for same dynamic segment level in Next.js App Router. Next.js requires consistent naming.

**Fix pattern**: Standardize all routes to use [id] convention. Move specific resource type routes to different path structure.

**RULE**: Always use [id] for dynamic segments at same level. For specific resource types, use query params or different path structure. Document route naming convention in ADR.

**Affected modules**: 03-planning, 04-production, 02-technical

---

### Pattern 5: Missing API Endpoints (404 Routes)

**Frequency**: 18 occurrences

**Example commits**: afdf6d8c, 106993e2, b02fa83e

**Root cause**: Frontend code references API routes that don't exist. Common in dashboard quick actions, modal forms, and navigation links.

**Fix pattern**: Create missing route.ts file with proper HTTP methods. Implement service layer logic. Add validation schemas.

**RULE**: When adding navigation link or form submit, create API route FIRST, then wire up frontend. Use TypeScript to define API contract. Add integration test for route.

**Affected modules**: 07-shipping, 03-planning, 06-quality

---

### Pattern 6: Auth Session Cookie Race Conditions

**Frequency**: 5 occurrences

**Example commits**: 462b97d8, 2ecb99ac

**Root cause**: Client-side auth (Supabase signInWithPassword) not properly setting cookies, causing session to be lost on page reload. Cookie storage vs localStorage mismatch.

**Fix pattern**: Use server-side /api/auth/login endpoint that properly sets HTTP-only cookies. Implement custom cookie handlers in Supabase client config.

**RULE**: Always use server-side auth endpoints for login/logout. Never rely on client-side only auth. Set cookies with {httpOnly: true, secure: true, sameSite: 'lax'}. Test session persistence across page reloads.

**Affected modules**: 00-foundation, 01-settings

---

### Pattern 7: UI Elements Not Visible (Missing Styling/Labels)

**Frequency**: 22 occurrences

**Example commits**: 176b7381

**Root cause**: Buttons, filters, and form elements render but lack sufficient contrast, labels, or sizing to be visible. Ghost buttons on white backgrounds.

**Fix pattern**: Add explicit styling: use variant='outline' for buttons, add labels to filters, increase font-weight, add bg colors for contrast.

**RULE**: All interactive elements must have visible borders or backgrounds. Use ShadCN variant='outline' or variant='default' (never ghost on white). All filters must have text labels. Test UI in browser, not just in dev tools.

**Affected modules**: 01-settings, 03-planning, 06-quality

---

### Pattern 8: Empty State Not Rendering Correctly

**Frequency**: 8 occurrences

**Example commits**: ae66d90e, 749756a5

**Root cause**: Empty state messages hidden by loading spinners, or conditional rendering logic wrong. API returns empty array [] but UI shows loading forever.

**Fix pattern**: Fix conditional rendering: check isLoading first, then isEmpty. Ensure loading state is cleared after API response. Reset page to 1 on filter changes.

**RULE**: Empty state rendering order: if (isLoading) show spinner; else if (error) show error; else if (data.length === 0) show empty state; else show data. Always reset pagination on filter changes.

**Affected modules**: 06-quality, 03-planning, 05-warehouse

---

### Pattern 9: Missing data-testid for E2E Tests

**Frequency**: 35 occurrences

**Example commits**: 1d1cec76, d4e623e9, 06217f53

**Root cause**: Playwright tests fail because components lack data-testid attributes. Tests use brittle CSS selectors or text matching.

**Fix pattern**: Add data-testid to all interactive elements: buttons, inputs, table rows, filters. Use consistent naming: {module}-{component}-{element}.

**RULE**: Every user-interactive element must have data-testid. Format: data-testid='{page}-{action}-btn' or '{table}-row-{index}'. Add during initial component development, not after test failures.

**Affected modules**: 02-technical, 03-planning, 01-settings

---

### Pattern 10: Incorrect Status Field Queries

**Frequency**: 7 occurrences

**Example commits**: 604ba0b6

**Root cause**: Queries filter by wrong status value. Production uses 'paused' but code queries for 'pause', or vice versa. Enum mismatch.

**Fix pattern**: Check database enum definition, update query to match exact enum value. Use TypeScript const for status values.

**RULE**: Define status enums as TypeScript const objects matching DB enums exactly. Import from single source of truth. Never use string literals in queries.

**Affected modules**: 04-production, 03-planning, 05-warehouse

---

### Pattern 11: Wrong HTTP Status Codes in API Routes

**Frequency**: 10 occurrences

**Example commits**: 4d8dc77b

**Root cause**: DELETE returns 204 No Content but frontend expects 200 with JSON. Or POST returns 200 when it should return 201 Created.

**Fix pattern**: Follow RESTful conventions: GET 200, POST 201, PUT/PATCH 200, DELETE 204. If DELETE needs to return data, use 200 instead of 204.

**RULE**: Standardize status codes: GET→200, POST→201, PUT/PATCH→200, DELETE→204 (or 200 if returning data). Document in API design guide. Add integration tests checking status codes.

**Affected modules**: 01-settings, 02-technical, 06-quality

---

### Pattern 12: Pagination Not Resetting on Filter Changes

**Frequency**: 6 occurrences

**Example commits**: fc3918ad

**Root cause**: User changes filter while on page 5, gets empty results because filtered dataset only has 1 page. Page state not reset to 1.

**Fix pattern**: Add setPage(1) to filter change handlers. Reset pagination state in useEffect when filters change.

**RULE**: All filter/search handlers must reset page to 1. Pattern: `const handleFilterChange = () => { setFilters(newFilters); setPage(1); }`. Add to all DataTable components.

**Affected modules**: 06-quality, 03-planning, 05-warehouse

---

### Pattern 13: Missing Validation on Critical Fields

**Frequency**: 11 occurrences

**Example commits**: a7e172f0, 365816f8

**Root cause**: Forms allow submission with empty required fields. No Zod validation, or validation not enforced on backend. Duplicate values allowed.

**Fix pattern**: Add Zod schema validation in lib/validation/. Enforce in API route with schema.parse(). Add unique constraints in DB for fields like barcodes.

**RULE**: Every form must have Zod schema. Every API POST/PUT must validate with schema.parse(). Add DB constraints for business rules (unique, not null, check). Test validation with invalid data.

**Affected modules**: 02-technical, 03-planning, 01-settings

---

### Pattern 14: CORS / Middleware Blocking API Calls

**Frequency**: 4 occurrences

**Example commits**: 0f956dc2, aeeddcc6

**Root cause**: Middleware.ts redirect loops, or missing CORS headers for API routes. Auth middleware blocks public endpoints.

**Fix pattern**: Add API route patterns to middleware matcher exclusions. Set CORS headers in API routes if needed. Use NextResponse.next() for public routes.

**RULE**: Middleware should only run on page routes, not /api/* or /_next/*. Use matcher config to exclude. Public API routes (/api/health, /api/version) must skip auth check.

**Affected modules**: 00-foundation, 02-technical

---

### Pattern 15: TypeScript Type Errors Blocking Build

**Frequency**: 25 occurrences

**Example commits**: c19ff81d, 13cb307f, a8c982db

**Root cause**: Strict TypeScript mode catches: wrong types passed to functions, missing null checks, interface mismatches. Blocks Vercel deployment.

**Fix pattern**: Fix type errors: add proper types to function params, use optional chaining (?.), add null checks, import correct types.

**RULE**: Run `npm run build` locally before committing. Enable strict mode in tsconfig.json. Fix type errors immediately, don't accumulate. Use TypeScript in all new files.

**Affected modules**: 01-settings, 02-technical, 03-planning

---

## Module-Specific Lessons

### 00-foundation

- Auth/session handling is critical - use server-side endpoints for login/logout
- Middleware must exclude API routes and static assets to prevent redirect loops
- Cookie handling requires explicit httpOnly, secure, and sameSite configuration
- Supabase client needs custom storage adapter for proper SSR cookie management

### 01-settings

- UI visibility issues most common - always use outline/default button variants
- RLS policies must be created for every new settings table immediately
- User/role management requires careful permission checking and cascade deletes
- Tax codes and location hierarchies need proper parent/child relationship handling

### 02-technical

- Product/BOM queries must handle nullable relationships (active_bom, routings)
- Schema changes (unit_cost → cost_per_unit) ripple through many services
- CORS and security headers needed for external API access
- Type/TypeScript errors most common in technical module due to complex types

### 03-planning

- PO line validation must check for PO_NO_LINES error before submission
- Transfer order workflow requires state machine for proper status transitions
- Work order creation needs BOM snapshot at creation time (immutable)
- Supplier/product relationships need proper foreign key handling

### 04-production

- Production dashboard queries must handle missing production_outputs table gracefully
- Over-consumption workflow requires approval routing before allowing excess usage
- Consumption queries prone to incorrect status filtering (paused vs pause)

### 05-scanner

- Scanner workflows (receive/pick/pack) prone to crashes from missing API routes
- Transfer route missing - needed page.tsx stub

### 05-warehouse

- License plate (LP) status calculation needs to check expiry dates
- Inventory KPI queries must use correct column names (cost_per_unit)
- ASN management requires proper warehouse location validation
- Packing slip PDFs must include weight column for compliance

### 06-quality

- Quality holds filtering must support multiple filter types (reason, product, status)
- NCR service had hardcoded org_id - critical multi-tenant security violation
- Empty state rendering broken by loading state not clearing properly
- Edit/Delete buttons need proper visibility styling

### 07-shipping

- Sales order creation page was completely missing - needed stub page.tsx
- Shipping dashboard context loading issues with organization data

## Code Quality Rules (Extracted from Bug Patterns)

1. **Database Schema**: Every new table must have RLS enabled and policies in same migration. Use org_id filtering for all policies.
2. **Multi-Tenancy**: Never hardcode org_id. Always extract from auth.orgId and pass as parameter. Add ESLint rule to detect hardcoded UUIDs.
3. **Schema Migrations**: When renaming columns, grep entire codebase for old name. Update all references in single commit. Use TypeScript types matching DB schema.
4. **API Routes**: Follow REST conventions: GET→200, POST→201, PUT/PATCH→200, DELETE→204. Return consistent error format with status, message, code.
5. **Route Naming**: Always use [id] for dynamic segments. Never mix [id], [woId], [productId] at same level. Document in ADR.
6. **Auth Sessions**: Use server-side auth endpoints for login/logout. Set httpOnly cookies. Test session persistence across page reloads.
7. **Validation**: Every form needs Zod schema. Every POST/PUT API must validate with schema.parse(). Add DB constraints for business rules.
8. **Empty States**: Render order: loading → error → empty → data. Always reset pagination to page 1 on filter changes.
9. **UI Visibility**: All interactive elements need visible borders/backgrounds. Use ShadCN variant='outline' or variant='default'. Add text labels to filters.
10. **E2E Testing**: Add data-testid to all interactive elements during initial development. Format: data-testid='{page}-{action}-btn'.
11. **Status Enums**: Define as TypeScript const matching DB enums. Import from single source. Never use string literals in queries.
12. **Type Safety**: Run `npm run build` before committing. Enable strict mode. Fix type errors immediately. Use TypeScript in all new files.
13. **API Endpoints**: Create API route FIRST before wiring up frontend. Use TypeScript for API contract. Add integration test.
14. **Middleware**: Only run on page routes, exclude /api/* and /_next/*. Public routes must skip auth. Prevent redirect loops.
15. **Null Safety**: Use optional chaining (?.) for all DB relationships. Check for null before accessing nested properties.
16. **Error Handling**: All API routes must have try/catch. Return proper error responses. Log errors with context.
17. **Foreign Keys**: Check relationship exists before querying. Handle null relationships gracefully. Use LEFT JOIN when optional.
18. **Service Layer**: All service methods that query DB must accept orgId parameter. No direct Supabase client calls from components.
19. **Component State**: Loading states must clear after API response. Use separate loading/error/data states. Don't block UI with loading.
20. **Security Headers**: Add CSRF protection for mutations. Set proper CORS headers. Rate limit auth endpoints.

---

## Impact Analysis

### High-Impact Fixes (Changed 10+ files)

**Count**: 52 commits affected 10+ files

These were typically:
- Schema migrations requiring service layer updates
- TypeScript strict mode fixes across entire codebase
- API route standardization (Next.js 15 migration)
- RLS policy additions affecting multiple tables

### Critical Security Fixes

**Count**: 104 security-related fixes

Critical issues:
- Hardcoded org_id in service layer (multi-tenant isolation breach)
- Missing RLS policies on new tables
- Auth session cookie race conditions
- CSRF protection missing on mutation endpoints
- Role-based access control not enforced in API routes

### Module Maturity Assessment

Based on bug frequency:

| Module | Maturity | Bug Count | Assessment |
|--------|----------|-----------|------------|
| 01-settings | Stabilizing | 76 | High bug count but systematic fixes applied. UI visibility resolved. |
| 02-technical | Maturing | 86 | Most bugs from schema changes and type safety. Core logic solid. |
| 03-planning | Stable | 28 | Lower bug rate. Main issues in workflow state transitions. |
| 04-production | Early | 1 | Minimal bugs but limited testing. Watch for consumption issues. |
| 05-warehouse | Stable | 13 | Good test coverage. Main issues: schema column naming. |
| 06-quality | Maturing | 17 | Security fix critical. Empty states resolved. |
| 07-shipping | Early | 2 | Minimal implementation. Missing basic CRUD pages. |
| 05-scanner | Early | 5 | Route structure issues. Needs integration testing. |

---

## Recommendations for Future Development

### Process Improvements

1. **Schema Change Checklist**: Create PR template requiring grep search for old column names
2. **RLS Policy Template**: Auto-generate RLS policies when creating new tables
3. **API Route Generator**: CLI tool to scaffold route.ts with validation and error handling
4. **E2E Test First**: Write E2E test before implementing feature, forces data-testid planning
5. **Type Safety Gate**: Require `npm run build` to pass in CI before merge

### Technical Debt to Address

1. **Missing E2E Tests**: Scanner, Shipping, Quality modules need comprehensive E2E coverage
2. **Inconsistent Error Handling**: Standardize API error format across all routes
3. **Service Layer Patterns**: Some services still access Supabase directly, need refactoring
4. **Status Enum Centralization**: Status values scattered across files, create single source
5. **Middleware Optimization**: Current middleware runs on all routes, needs performance tuning

### Skills to Create

Based on this analysis, create these Claude Code skills:

1. **`schema-migration`**: Checklist for safe schema changes (grep, types, RLS)
2. **`api-route-creator`**: Generate route.ts with validation, auth, error handling
3. **`rls-policy-generator`**: Auto-generate RLS policies for new tables
4. **`multi-tenant-audit`**: Check codebase for hardcoded org_id violations
5. **`ui-visibility-checker`**: Scan components for invisible elements (ghost buttons, missing labels)
6. **`empty-state-validator`**: Ensure proper empty state rendering order
7. **`e2e-test-generator`**: Generate E2E test with proper data-testid usage
8. **`status-enum-validator`**: Check status queries match DB enum definitions

---

*Document generated from 341 bug fix commits in MonoPilot project*
