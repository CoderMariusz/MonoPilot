#!/usr/bin/env python3
"""
Generate comprehensive LESSONS-LEARNED document from bug fix analysis.
"""

import json
from collections import defaultdict, Counter

def load_data():
    """Load the JSON analysis data."""
    with open('/workspaces/MonoPilot/new-doc/_meta/bug-analysis-data.json') as f:
        return json.load(f)

def generate_lessons_document(data):
    """Generate the full lessons-learned markdown document."""

    lines = []

    # Header
    lines.append("# Lessons Learned from 341 Bug Fixes\n\n")
    lines.append("**Analysis Date**: 2026-02-16\n")
    lines.append("**Source**: MonoPilot production bug fixes (Jan-Feb 2026)\n\n")

    # Executive Summary
    lines.append("## Executive Summary\n\n")
    lines.append(f"- **Total Fixes**: {data['total']} commits\n")
    lines.append("- **Time Period**: ~30 days of intensive development\n")
    lines.append("- **Average**: ~11 bugs fixed per day\n\n")

    # Top modules
    by_module = sorted(data['by_module'].items(), key=lambda x: x[1], reverse=True)
    lines.append("### Most Bug-Prone Modules\n\n")
    lines.append("| Module | Count | % of Total |\n")
    lines.append("|--------|-------|------------|\n")
    for module, count in by_module[:5]:
        pct = (count / data['total']) * 100
        lines.append(f"| {module} | {count} | {pct:.1f}% |\n")

    # Top bug types
    by_type = sorted(data['by_type'].items(), key=lambda x: x[1], reverse=True)
    lines.append("\n### Most Common Bug Types\n\n")
    lines.append("| Type | Count | % of Total |\n")
    lines.append("|------|-------|------------|\n")
    for bug_type, count in by_type[:5]:
        pct = (count / data['total']) * 100
        lines.append(f"| {bug_type} | {count} | {pct:.1f}% |\n")

    lines.append("\n---\n\n")

    # Bug Distribution Tables
    lines.append("## Bug Distribution by Module\n\n")
    lines.append("| Module | Count | % | Top Bug Types |\n")
    lines.append("|--------|-------|---|---------------|\n")

    # Calculate top bug types per module
    module_bug_types = defaultdict(Counter)
    for commit in data['commits']:
        module = commit['module']
        for bug_type in commit['types']:
            module_bug_types[module][bug_type] += 1

    for module, count in by_module:
        pct = (count / data['total']) * 100
        top_types = [bt for bt, _ in module_bug_types[module].most_common(3)]
        lines.append(f"| {module} | {count} | {pct:.1f}% | {', '.join(top_types)} |\n")

    lines.append("\n## Bug Distribution by Type\n\n")
    lines.append("| Type | Count | % | Example |\n")
    lines.append("|------|-------|---|----------|\n")

    # Get example for each type
    type_examples = {}
    for commit in data['commits']:
        for bug_type in commit['types']:
            if bug_type not in type_examples:
                type_examples[bug_type] = commit['msg'][:60] + "..."

    for bug_type, count in by_type:
        pct = (count / data['total']) * 100
        example = type_examples.get(bug_type, "N/A")
        lines.append(f"| {bug_type} | {count} | {pct:.1f}% | {example} |\n")

    lines.append("\n---\n\n")

    # Top Bug Patterns
    lines.append("## Top 15 Bug Patterns (with Prevention Rules)\n\n")

    patterns = [
        {
            "name": "Missing RLS Policies / SELECT Permissions",
            "frequency": 12,
            "examples": ["5afcd9b5", "7a54e3d5", "992cf1cf"],
            "root_cause": "New tables created without proper Row Level Security (RLS) policies, or missing SELECT policies for authenticated users.",
            "fix_pattern": "Add migration with RLS policies for SELECT, INSERT, UPDATE, DELETE using org_id filtering.",
            "prevention": "**RULE**: Every new table MUST have RLS enabled and policies created in same migration. Use template: `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY; CREATE POLICY {table}_select ON {table} FOR SELECT USING (org_id = auth.org_id());`",
            "modules": ["01-settings", "02-technical", "05-warehouse"]
        },
        {
            "name": "Hardcoded org_id in Service Layer",
            "frequency": 8,
            "examples": ["e2b5b0e8"],
            "root_cause": "Service methods using hardcoded org_id values instead of extracting from authenticated user context. Critical security violation in multi-tenant SaaS.",
            "fix_pattern": "Extract org_id from authenticated session in API route, pass as parameter to service method. Service methods should NEVER hardcode org_id.",
            "prevention": "**RULE**: All service methods that query DB MUST accept orgId parameter. API routes extract from `auth.orgId`. Never use hardcoded UUIDs. Add ESLint rule to detect hardcoded UUID patterns in service files.",
            "modules": ["06-quality", "01-settings", "03-planning"]
        },
        {
            "name": "Schema Mismatch (Code vs Database)",
            "frequency": 15,
            "examples": ["3eb082e0", "175e231b", "5afcd9b5"],
            "root_cause": "Code references old column names after schema migrations (e.g., unit_cost → cost_per_unit, is_active → status, flat location schema → hierarchical).",
            "fix_pattern": "Search codebase for all references to old column name, replace with new column name. Check services, API routes, and components.",
            "prevention": "**RULE**: When migrating schema, use grep to find ALL references: `grep -r 'old_column_name' apps/frontend/`. Update all in single commit. Add TypeScript types matching exact DB schema. Use codegen tools like supabase gen types.",
            "modules": ["05-warehouse", "02-technical", "01-settings"]
        },
        {
            "name": "Next.js Dynamic Route Slug Conflicts",
            "frequency": 6,
            "examples": ["19b425d0"],
            "root_cause": "Using different slug names ([id] vs [woId] vs [supplierId]) for same dynamic segment level in Next.js App Router. Next.js requires consistent naming.",
            "fix_pattern": "Standardize all routes to use [id] convention. Move specific resource type routes to different path structure.",
            "prevention": "**RULE**: Always use [id] for dynamic segments at same level. For specific resource types, use query params or different path structure. Document route naming convention in ADR.",
            "modules": ["03-planning", "04-production", "02-technical"]
        },
        {
            "name": "Missing API Endpoints (404 Routes)",
            "frequency": 18,
            "examples": ["afdf6d8c", "106993e2", "b02fa83e"],
            "root_cause": "Frontend code references API routes that don't exist. Common in dashboard quick actions, modal forms, and navigation links.",
            "fix_pattern": "Create missing route.ts file with proper HTTP methods. Implement service layer logic. Add validation schemas.",
            "prevention": "**RULE**: When adding navigation link or form submit, create API route FIRST, then wire up frontend. Use TypeScript to define API contract. Add integration test for route.",
            "modules": ["07-shipping", "03-planning", "06-quality"]
        },
        {
            "name": "Auth Session Cookie Race Conditions",
            "frequency": 5,
            "examples": ["462b97d8", "2ecb99ac"],
            "root_cause": "Client-side auth (Supabase signInWithPassword) not properly setting cookies, causing session to be lost on page reload. Cookie storage vs localStorage mismatch.",
            "fix_pattern": "Use server-side /api/auth/login endpoint that properly sets HTTP-only cookies. Implement custom cookie handlers in Supabase client config.",
            "prevention": "**RULE**: Always use server-side auth endpoints for login/logout. Never rely on client-side only auth. Set cookies with {httpOnly: true, secure: true, sameSite: 'lax'}. Test session persistence across page reloads.",
            "modules": ["00-foundation", "01-settings"]
        },
        {
            "name": "UI Elements Not Visible (Missing Styling/Labels)",
            "frequency": 22,
            "examples": ["176b7381"],
            "root_cause": "Buttons, filters, and form elements render but lack sufficient contrast, labels, or sizing to be visible. Ghost buttons on white backgrounds.",
            "fix_pattern": "Add explicit styling: use variant='outline' for buttons, add labels to filters, increase font-weight, add bg colors for contrast.",
            "prevention": "**RULE**: All interactive elements must have visible borders or backgrounds. Use ShadCN variant='outline' or variant='default' (never ghost on white). All filters must have text labels. Test UI in browser, not just in dev tools.",
            "modules": ["01-settings", "03-planning", "06-quality"]
        },
        {
            "name": "Empty State Not Rendering Correctly",
            "frequency": 8,
            "examples": ["ae66d90e", "749756a5"],
            "root_cause": "Empty state messages hidden by loading spinners, or conditional rendering logic wrong. API returns empty array [] but UI shows loading forever.",
            "fix_pattern": "Fix conditional rendering: check isLoading first, then isEmpty. Ensure loading state is cleared after API response. Reset page to 1 on filter changes.",
            "prevention": "**RULE**: Empty state rendering order: if (isLoading) show spinner; else if (error) show error; else if (data.length === 0) show empty state; else show data. Always reset pagination on filter changes.",
            "modules": ["06-quality", "03-planning", "05-warehouse"]
        },
        {
            "name": "Missing data-testid for E2E Tests",
            "frequency": 35,
            "examples": ["1d1cec76", "d4e623e9", "06217f53"],
            "root_cause": "Playwright tests fail because components lack data-testid attributes. Tests use brittle CSS selectors or text matching.",
            "fix_pattern": "Add data-testid to all interactive elements: buttons, inputs, table rows, filters. Use consistent naming: {module}-{component}-{element}.",
            "prevention": "**RULE**: Every user-interactive element must have data-testid. Format: data-testid='{page}-{action}-btn' or '{table}-row-{index}'. Add during initial component development, not after test failures.",
            "modules": ["02-technical", "03-planning", "01-settings"]
        },
        {
            "name": "Incorrect Status Field Queries",
            "frequency": 7,
            "examples": ["604ba0b6"],
            "root_cause": "Queries filter by wrong status value. Production uses 'paused' but code queries for 'pause', or vice versa. Enum mismatch.",
            "fix_pattern": "Check database enum definition, update query to match exact enum value. Use TypeScript const for status values.",
            "prevention": "**RULE**: Define status enums as TypeScript const objects matching DB enums exactly. Import from single source of truth. Never use string literals in queries.",
            "modules": ["04-production", "03-planning", "05-warehouse"]
        },
        {
            "name": "Wrong HTTP Status Codes in API Routes",
            "frequency": 10,
            "examples": ["4d8dc77b"],
            "root_cause": "DELETE returns 204 No Content but frontend expects 200 with JSON. Or POST returns 200 when it should return 201 Created.",
            "fix_pattern": "Follow RESTful conventions: GET 200, POST 201, PUT/PATCH 200, DELETE 204. If DELETE needs to return data, use 200 instead of 204.",
            "prevention": "**RULE**: Standardize status codes: GET→200, POST→201, PUT/PATCH→200, DELETE→204 (or 200 if returning data). Document in API design guide. Add integration tests checking status codes.",
            "modules": ["01-settings", "02-technical", "06-quality"]
        },
        {
            "name": "Pagination Not Resetting on Filter Changes",
            "frequency": 6,
            "examples": ["fc3918ad"],
            "root_cause": "User changes filter while on page 5, gets empty results because filtered dataset only has 1 page. Page state not reset to 1.",
            "fix_pattern": "Add setPage(1) to filter change handlers. Reset pagination state in useEffect when filters change.",
            "prevention": "**RULE**: All filter/search handlers must reset page to 1. Pattern: `const handleFilterChange = () => { setFilters(newFilters); setPage(1); }`. Add to all DataTable components.",
            "modules": ["06-quality", "03-planning", "05-warehouse"]
        },
        {
            "name": "Missing Validation on Critical Fields",
            "frequency": 11,
            "examples": ["a7e172f0", "365816f8"],
            "root_cause": "Forms allow submission with empty required fields. No Zod validation, or validation not enforced on backend. Duplicate values allowed.",
            "fix_pattern": "Add Zod schema validation in lib/validation/. Enforce in API route with schema.parse(). Add unique constraints in DB for fields like barcodes.",
            "prevention": "**RULE**: Every form must have Zod schema. Every API POST/PUT must validate with schema.parse(). Add DB constraints for business rules (unique, not null, check). Test validation with invalid data.",
            "modules": ["02-technical", "03-planning", "01-settings"]
        },
        {
            "name": "CORS / Middleware Blocking API Calls",
            "frequency": 4,
            "examples": ["0f956dc2", "aeeddcc6"],
            "root_cause": "Middleware.ts redirect loops, or missing CORS headers for API routes. Auth middleware blocks public endpoints.",
            "fix_pattern": "Add API route patterns to middleware matcher exclusions. Set CORS headers in API routes if needed. Use NextResponse.next() for public routes.",
            "prevention": "**RULE**: Middleware should only run on page routes, not /api/* or /_next/*. Use matcher config to exclude. Public API routes (/api/health, /api/version) must skip auth check.",
            "modules": ["00-foundation", "02-technical"]
        },
        {
            "name": "TypeScript Type Errors Blocking Build",
            "frequency": 25,
            "examples": ["c19ff81d", "13cb307f", "a8c982db"],
            "root_cause": "Strict TypeScript mode catches: wrong types passed to functions, missing null checks, interface mismatches. Blocks Vercel deployment.",
            "fix_pattern": "Fix type errors: add proper types to function params, use optional chaining (?.), add null checks, import correct types.",
            "prevention": "**RULE**: Run `npm run build` locally before committing. Enable strict mode in tsconfig.json. Fix type errors immediately, don't accumulate. Use TypeScript in all new files.",
            "modules": ["01-settings", "02-technical", "03-planning"]
        }
    ]

    for i, pattern in enumerate(patterns, 1):
        lines.append(f"### Pattern {i}: {pattern['name']}\n\n")
        lines.append(f"**Frequency**: {pattern['frequency']} occurrences\n\n")
        lines.append(f"**Example commits**: {', '.join(pattern['examples'])}\n\n")
        lines.append(f"**Root cause**: {pattern['root_cause']}\n\n")
        lines.append(f"**Fix pattern**: {pattern['fix_pattern']}\n\n")
        lines.append(f"{pattern['prevention']}\n\n")
        lines.append(f"**Affected modules**: {', '.join(pattern['modules'])}\n\n")
        lines.append("---\n\n")

    # Module-specific lessons
    lines.append("## Module-Specific Lessons\n\n")

    module_lessons = {
        "00-foundation": [
            "Auth/session handling is critical - use server-side endpoints for login/logout",
            "Middleware must exclude API routes and static assets to prevent redirect loops",
            "Cookie handling requires explicit httpOnly, secure, and sameSite configuration",
            "Supabase client needs custom storage adapter for proper SSR cookie management"
        ],
        "01-settings": [
            "UI visibility issues most common - always use outline/default button variants",
            "RLS policies must be created for every new settings table immediately",
            "User/role management requires careful permission checking and cascade deletes",
            "Tax codes and location hierarchies need proper parent/child relationship handling"
        ],
        "02-technical": [
            "Product/BOM queries must handle nullable relationships (active_bom, routings)",
            "Schema changes (unit_cost → cost_per_unit) ripple through many services",
            "CORS and security headers needed for external API access",
            "Type/TypeScript errors most common in technical module due to complex types"
        ],
        "03-planning": [
            "PO line validation must check for PO_NO_LINES error before submission",
            "Transfer order workflow requires state machine for proper status transitions",
            "Work order creation needs BOM snapshot at creation time (immutable)",
            "Supplier/product relationships need proper foreign key handling"
        ],
        "04-production": [
            "Production dashboard queries must handle missing production_outputs table gracefully",
            "Over-consumption workflow requires approval routing before allowing excess usage",
            "Consumption queries prone to incorrect status filtering (paused vs pause)"
        ],
        "05-warehouse": [
            "License plate (LP) status calculation needs to check expiry dates",
            "Inventory KPI queries must use correct column names (cost_per_unit)",
            "ASN management requires proper warehouse location validation",
            "Packing slip PDFs must include weight column for compliance"
        ],
        "06-quality": [
            "Quality holds filtering must support multiple filter types (reason, product, status)",
            "NCR service had hardcoded org_id - critical multi-tenant security violation",
            "Empty state rendering broken by loading state not clearing properly",
            "Edit/Delete buttons need proper visibility styling"
        ],
        "07-shipping": [
            "Sales order creation page was completely missing - needed stub page.tsx",
            "Shipping dashboard context loading issues with organization data"
        ],
        "05-scanner": [
            "Scanner workflows (receive/pick/pack) prone to crashes from missing API routes",
            "Transfer route missing - needed page.tsx stub"
        ]
    }

    for module in sorted(module_lessons.keys()):
        lines.append(f"### {module}\n\n")
        for lesson in module_lessons[module]:
            lines.append(f"- {lesson}\n")
        lines.append("\n")

    # Code Quality Rules
    lines.append("## Code Quality Rules (Extracted from Bug Patterns)\n\n")

    rules = [
        "**Database Schema**: Every new table must have RLS enabled and policies in same migration. Use org_id filtering for all policies.",
        "**Multi-Tenancy**: Never hardcode org_id. Always extract from auth.orgId and pass as parameter. Add ESLint rule to detect hardcoded UUIDs.",
        "**Schema Migrations**: When renaming columns, grep entire codebase for old name. Update all references in single commit. Use TypeScript types matching DB schema.",
        "**API Routes**: Follow REST conventions: GET→200, POST→201, PUT/PATCH→200, DELETE→204. Return consistent error format with status, message, code.",
        "**Route Naming**: Always use [id] for dynamic segments. Never mix [id], [woId], [productId] at same level. Document in ADR.",
        "**Auth Sessions**: Use server-side auth endpoints for login/logout. Set httpOnly cookies. Test session persistence across page reloads.",
        "**Validation**: Every form needs Zod schema. Every POST/PUT API must validate with schema.parse(). Add DB constraints for business rules.",
        "**Empty States**: Render order: loading → error → empty → data. Always reset pagination to page 1 on filter changes.",
        "**UI Visibility**: All interactive elements need visible borders/backgrounds. Use ShadCN variant='outline' or variant='default'. Add text labels to filters.",
        "**E2E Testing**: Add data-testid to all interactive elements during initial development. Format: data-testid='{page}-{action}-btn'.",
        "**Status Enums**: Define as TypeScript const matching DB enums. Import from single source. Never use string literals in queries.",
        "**Type Safety**: Run `npm run build` before committing. Enable strict mode. Fix type errors immediately. Use TypeScript in all new files.",
        "**API Endpoints**: Create API route FIRST before wiring up frontend. Use TypeScript for API contract. Add integration test.",
        "**Middleware**: Only run on page routes, exclude /api/* and /_next/*. Public routes must skip auth. Prevent redirect loops.",
        "**Null Safety**: Use optional chaining (?.) for all DB relationships. Check for null before accessing nested properties.",
        "**Error Handling**: All API routes must have try/catch. Return proper error responses. Log errors with context.",
        "**Foreign Keys**: Check relationship exists before querying. Handle null relationships gracefully. Use LEFT JOIN when optional.",
        "**Service Layer**: All service methods that query DB must accept orgId parameter. No direct Supabase client calls from components.",
        "**Component State**: Loading states must clear after API response. Use separate loading/error/data states. Don't block UI with loading.",
        "**Security Headers**: Add CSRF protection for mutations. Set proper CORS headers. Rate limit auth endpoints."
    ]

    for i, rule in enumerate(rules, 1):
        lines.append(f"{i}. {rule}\n")

    lines.append("\n---\n\n")

    # Impact Analysis
    lines.append("## Impact Analysis\n\n")
    lines.append("### High-Impact Fixes (Changed 10+ files)\n\n")

    high_impact = [c for c in data['commits'] if c['file_count'] >= 10]
    lines.append(f"**Count**: {len(high_impact)} commits affected 10+ files\n\n")
    lines.append("These were typically:\n")
    lines.append("- Schema migrations requiring service layer updates\n")
    lines.append("- TypeScript strict mode fixes across entire codebase\n")
    lines.append("- API route standardization (Next.js 15 migration)\n")
    lines.append("- RLS policy additions affecting multiple tables\n\n")

    lines.append("### Critical Security Fixes\n\n")
    security_fixes = [c for c in data['commits'] if 'Security' in c['types']]
    lines.append(f"**Count**: {len(security_fixes)} security-related fixes\n\n")
    lines.append("Critical issues:\n")
    lines.append("- Hardcoded org_id in service layer (multi-tenant isolation breach)\n")
    lines.append("- Missing RLS policies on new tables\n")
    lines.append("- Auth session cookie race conditions\n")
    lines.append("- CSRF protection missing on mutation endpoints\n")
    lines.append("- Role-based access control not enforced in API routes\n\n")

    lines.append("### Module Maturity Assessment\n\n")
    lines.append("Based on bug frequency:\n\n")
    lines.append("| Module | Maturity | Bug Count | Assessment |\n")
    lines.append("|--------|----------|-----------|------------|\n")

    maturity = [
        ("01-settings", "Stabilizing", 76, "High bug count but systematic fixes applied. UI visibility resolved."),
        ("02-technical", "Maturing", 86, "Most bugs from schema changes and type safety. Core logic solid."),
        ("03-planning", "Stable", 28, "Lower bug rate. Main issues in workflow state transitions."),
        ("04-production", "Early", 1, "Minimal bugs but limited testing. Watch for consumption issues."),
        ("05-warehouse", "Stable", 13, "Good test coverage. Main issues: schema column naming."),
        ("06-quality", "Maturing", 17, "Security fix critical. Empty states resolved."),
        ("07-shipping", "Early", 2, "Minimal implementation. Missing basic CRUD pages."),
        ("05-scanner", "Early", 5, "Route structure issues. Needs integration testing."),
    ]

    for module, mat, count, assess in maturity:
        lines.append(f"| {module} | {mat} | {count} | {assess} |\n")

    lines.append("\n---\n\n")

    # Recommendations
    lines.append("## Recommendations for Future Development\n\n")
    lines.append("### Process Improvements\n\n")
    lines.append("1. **Schema Change Checklist**: Create PR template requiring grep search for old column names\n")
    lines.append("2. **RLS Policy Template**: Auto-generate RLS policies when creating new tables\n")
    lines.append("3. **API Route Generator**: CLI tool to scaffold route.ts with validation and error handling\n")
    lines.append("4. **E2E Test First**: Write E2E test before implementing feature, forces data-testid planning\n")
    lines.append("5. **Type Safety Gate**: Require `npm run build` to pass in CI before merge\n\n")

    lines.append("### Technical Debt to Address\n\n")
    lines.append("1. **Missing E2E Tests**: Scanner, Shipping, Quality modules need comprehensive E2E coverage\n")
    lines.append("2. **Inconsistent Error Handling**: Standardize API error format across all routes\n")
    lines.append("3. **Service Layer Patterns**: Some services still access Supabase directly, need refactoring\n")
    lines.append("4. **Status Enum Centralization**: Status values scattered across files, create single source\n")
    lines.append("5. **Middleware Optimization**: Current middleware runs on all routes, needs performance tuning\n\n")

    lines.append("### Skills to Create\n\n")
    lines.append("Based on this analysis, create these Claude Code skills:\n\n")
    lines.append("1. **`schema-migration`**: Checklist for safe schema changes (grep, types, RLS)\n")
    lines.append("2. **`api-route-creator`**: Generate route.ts with validation, auth, error handling\n")
    lines.append("3. **`rls-policy-generator`**: Auto-generate RLS policies for new tables\n")
    lines.append("4. **`multi-tenant-audit`**: Check codebase for hardcoded org_id violations\n")
    lines.append("5. **`ui-visibility-checker`**: Scan components for invisible elements (ghost buttons, missing labels)\n")
    lines.append("6. **`empty-state-validator`**: Ensure proper empty state rendering order\n")
    lines.append("7. **`e2e-test-generator`**: Generate E2E test with proper data-testid usage\n")
    lines.append("8. **`status-enum-validator`**: Check status queries match DB enum definitions\n\n")

    lines.append("---\n\n")
    lines.append("*Document generated from 341 bug fix commits in MonoPilot project*\n")

    return ''.join(lines)

def main():
    print("Loading bug analysis data...")
    data = load_data()

    print("Generating lessons learned document...")
    doc = generate_lessons_document(data)

    output_file = '/workspaces/MonoPilot/new-doc/_meta/LESSONS-LEARNED-GLOBAL.md'
    with open(output_file, 'w') as f:
        f.write(doc)

    print(f"Document written to {output_file}")
    print(f"Total size: {len(doc)} characters")

if __name__ == '__main__':
    main()
