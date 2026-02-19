# MonoPilot - Agent Instructions (Codex CLI)

## Tech Stack
- Next.js 16, React 19, TypeScript, TailwindCSS, ShadCN UI
- Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- Zod validation schemas, pnpm workspaces monorepo

## Project Structure
- API routes: `apps/frontend/app/api/[module]/[resource]/route.ts`
- Services: `apps/frontend/lib/services/*-service.ts` (class-based, static methods)
- Validation: `apps/frontend/lib/validation/*-schemas.ts` (Zod)
- Components: `apps/frontend/components/[module]/`
- Pages: `apps/frontend/app/(authenticated)/[module]/`
- Tests: `apps/frontend/__tests__/[module]/`
- Migrations: `supabase/migrations/`

## Conventions

### API Routes
- GET: createRouteHandlerClient -> query with org_id filter -> NextResponse.json({data, total})
- POST: Zod validate body -> insert with org_id -> NextResponse.json(data, {status: 201})
- PUT/PATCH: Zod validate -> update WHERE id AND org_id -> NextResponse.json(data)
- DELETE: delete WHERE id AND org_id -> NextResponse.json({success: true})
- Error: try/catch -> NextResponse.json({error: message}, {status: 500})

### Multi-Tenancy (CRITICAL)
- Every table has `org_id` column
- Every query MUST filter by org_id from session
- RLS policies enforce at database level (defense in depth)
- Never trust client-provided org_id

### Services
- Class-based with static methods
- Accept org_id as first parameter
- Return typed objects (not raw Supabase responses)
- Handle errors with descriptive messages

### Validation
- Zod schemas for all API inputs
- Export both schema and inferred TypeScript type
- Use .refine() for complex business rules

## Testing
- Unit: Vitest (`pnpm test`)
- E2E: Playwright (`pnpm e2e`)
- Run tests before committing: `pnpm test && pnpm build`

## Quality Gates
- RED -> GREEN: tests exist and fail
- GREEN -> REVIEW: tests pass + build succeeds
- REVIEW -> QA: code-reviewer approved
- QA -> DONE: qa-agent pass

## Do NOT
- Use loose inventory quantities (LP-only system)
- Modify BOM snapshots after WO creation
- Skip org_id filtering on ANY query
- Create new migration files directly (use supabase CLI)
- Hardcode secrets or API keys
- Skip Zod validation on API inputs

## References
- Patterns: `.claude/TECHNICAL-REFERENCE.md`
- Handoff files: `.claude/handoffs/{STORY_ID}-backend.md`
- Story context: `docs/2-MANAGEMENT/epics/current/{epic}/context/{story-id}.context.yaml`
