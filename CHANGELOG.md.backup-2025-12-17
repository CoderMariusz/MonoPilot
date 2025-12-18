# Changelog

All notable changes to MonoPilot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Story 01.1 - Org Context + Base RLS (2025-12-16)

**Database:**
- Created `organizations` table with onboarding state tracking
- Created `users` table linked to Supabase Auth with org_id scoping
- Created `roles` table with JSONB permissions (ADR-012)
- Created `modules` and `organization_modules` tables (ADR-011)
- Implemented RLS (Row Level Security) policies on all org-scoped tables using ADR-013 pattern
- Added 12 RLS policies for tenant isolation and admin enforcement

**API:**
- Added `GET /api/v1/settings/context` endpoint for org context resolution
- Returns org_id, user_id, role_code, permissions, and organization details
- Single query with JOINs (no N+1 problem)
- Expected response time: <50ms

**Services:**
- Created `org-context-service.ts` with org context resolution
  - `getOrgContext(userId)` - Returns complete org context
  - `validateOrgContext(context)` - Validates context structure
  - `deriveUserIdFromSession()` - Gets user ID from Supabase auth session
- Created `permission-service.ts` with basic permission checks
  - `hasAdminAccess(roleCode)` - Checks for admin role
  - `canModifyOrganization(roleCode)` - Checks org modification permission
  - `canModifyUsers(roleCode)` - Checks user management permission
  - `isSystemRole(roleCode)` - Checks if role is system-defined
  - `hasPermission(module, operation, permissions)` - CRUD permission check

**Security:**
- Cross-tenant access returns 404 (not 403) to prevent enumeration attacks
- UUID validation prevents SQL injection
- Session validation with expiration checking
- Multi-tenant isolation enforced via RLS (ADR-013)
- Admin-only write enforcement at both RLS and application layers

**Seed Data:**
- 10 system roles with JSONB permissions:
  - Owner (full access)
  - Administrator (administrative access)
  - Manager (department management)
  - Production Supervisor (production oversight)
  - Production Operator (execute production)
  - Warehouse Worker (inventory management)
  - Quality Inspector (quality control)
  - Shipping Clerk (order fulfillment)
  - Viewer (read-only access)
  - Custom Role (placeholder for future custom roles)
- 11 modules:
  - Settings (cannot disable)
  - Technical Data (cannot disable)
  - Planning, Production, Warehouse, Quality, Shipping (can disable)
  - NPD, Finance, OEE, Integrations (can disable)

**Types:**
- Added `Organization` interface
- Added `OrgContext` interface (primary context type)
- Added `User` interface
- Added `Role` interface
- Added `Module` interface
- Added `OrganizationModule` interface

**Error Handling:**
- Created `AppError` base class
- Created `UnauthorizedError` (401)
- Created `NotFoundError` (404)
- Created `ForbiddenError` (403)
- Created `api-error-handler` utility

**Utilities:**
- Created `isValidUUID()` validation function

**Migrations:** 054-059 (6 files)
- 054: Organizations table
- 055: Roles table
- 056: Users table
- 057: Modules and organization_modules tables
- 058: RLS policies (12 policies)
- 059: Seed data (10 roles + 11 modules)

**ADRs Implemented:**
- ADR-011: Module Toggle Storage (modules + organization_modules tables)
- ADR-012: Role Permission Storage (JSONB permissions in roles table)
- ADR-013: RLS Org Isolation Pattern (users table lookup pattern)

**Tests:**
- 25/25 permission service tests passing (100% coverage)
- 24 org context service tests designed (pending UUID fixture fix)
- 15 SQL integration tests for RLS isolation (ready to run)

**Documentation:**
- API documentation: `docs/3-ARCHITECTURE/api/settings/context.md`
- Migration documentation: `docs/3-ARCHITECTURE/database/migrations/01.1-org-context-rls.md`
- Developer guide: `docs/3-ARCHITECTURE/guides/using-org-context.md`
- Code review report: `docs/2-MANAGEMENT/reviews/code-review-story-01.1.md` (APPROVED)
- QA report: `docs/2-MANAGEMENT/qa/qa-report-story-01.1.md` (CONDITIONALLY APPROVED)

**Dependencies:**
- This story is the foundation for all Settings module stories
- Blocks: 01.2, 01.6, 01.8, 01.12, 01.13, and all future stories requiring org context

**Breaking Changes:** None (new feature)

---

## [0.0.0] - 2025-12-16

### Initial Setup
- Project initialization
- Monorepo structure with pnpm workspaces
- Next.js 15.5 frontend
- Supabase backend
- TypeScript, TailwindCSS, ShadCN UI
- Vitest testing framework
