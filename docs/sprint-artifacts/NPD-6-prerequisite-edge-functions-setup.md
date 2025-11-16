# Epic NPD-6 Prerequisite: Edge Functions Deployment Pipeline

**Epic:** NPD-6 (Database Schema)
**Story Type:** Infrastructure Setup (Prerequisite)
**Priority:** CRITICAL - MUST complete before Epic NPD-1 Story 4 (Event Sourcing)
**Estimated Effort:** 4 hours
**Created:** 2025-11-16
**Status:** PENDING

---

## User Story

**As a** DevOps engineer
**I want** Edge Functions CI/CD pipeline configured
**So that** Epic NPD-1 can deploy NPD event processor without manual setup

---

## Context

**Why This Story Exists:**

Epic NPD-1 Story 4 implements event sourcing with an Edge Function (`npd-event-processor`) that processes events from the `npd_events` table. This Edge Function must be deployable via CI/CD to avoid manual deployment friction.

**Architectural Decision Reference:**

- ADR-002 (Event Sourcing for Handoff): Requires Edge Function processor with retry logic
- ADR-003 (Hybrid Versioning Service): Event-driven integration pattern

**Dependencies:**

- Epic NPD-6 database migrations (100-113) must be complete (creates `npd_events` table)
- This story MUST complete before Epic NPD-1 Story 4 starts

---

## Acceptance Criteria

### 1. Supabase CLI Installation in CI Environment

- [ ] Supabase CLI installed in GitHub Actions runner (or equivalent CI environment)
- [ ] CLI version verified: `supabase --version` returns >= 1.50.0
- [ ] Installation documented in `.github/workflows/deploy-edge-functions.yml`

**Verification:**

```bash
# In CI environment
supabase --version
# Expected output: supabase 1.50.x or higher
```

### 2. Authentication Configuration

- [ ] `SUPABASE_ACCESS_TOKEN` secret configured in GitHub repository settings
- [ ] `SUPABASE_PROJECT_ID` environment variable set (from existing `.env.local`)
- [ ] Authentication tested: `supabase login` succeeds in CI

**Verification:**

```bash
# In CI environment (GitHub Actions)
echo "$SUPABASE_ACCESS_TOKEN" | supabase login --token -
supabase projects list
# Expected: Lists MonoPilot project
```

### 3. Edge Function Deployment Script

- [ ] Deployment script created: `scripts/deploy-edge-function.sh`
- [ ] Script validates Edge Function exists before deploying
- [ ] Script handles deployment errors gracefully (exit codes)
- [ ] Script outputs deployment URL for verification

**Script Template:**

```bash
#!/bin/bash
set -e

FUNCTION_NAME="npd-event-processor"
FUNCTION_PATH="apps/frontend/supabase/functions/${FUNCTION_NAME}"

echo "Deploying Edge Function: ${FUNCTION_NAME}..."

# Validate function exists
if [ ! -d "$FUNCTION_PATH" ]; then
  echo "Error: Function directory not found at $FUNCTION_PATH"
  exit 1
fi

# Deploy function
supabase functions deploy "$FUNCTION_NAME" \
  --project-ref "$SUPABASE_PROJECT_ID" \
  --no-verify-jwt

echo "Deployment successful!"
echo "Function URL: https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${FUNCTION_NAME}"
```

**Acceptance:**

- [ ] Script executes successfully on staging environment
- [ ] Script outputs deployment URL
- [ ] Script fails gracefully if function directory missing

### 4. CI/CD Workflow Integration

- [ ] GitHub Actions workflow created: `.github/workflows/deploy-edge-functions.yml`
- [ ] Workflow triggers on:
  - Push to `main` branch (after migrations run)
  - Manual trigger (`workflow_dispatch`)
- [ ] Workflow runs `scripts/deploy-edge-function.sh`
- [ ] Workflow reports deployment status (success/failure)

**Workflow Template:**

```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'apps/frontend/supabase/functions/**'
      - 'apps/frontend/lib/supabase/migrations/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Authenticate Supabase
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: echo "$SUPABASE_ACCESS_TOKEN" | supabase login --token -

      - name: Deploy Edge Function
        env:
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: bash scripts/deploy-edge-function.sh

      - name: Verify Deployment
        run: |
          curl -I https://${{ secrets.SUPABASE_PROJECT_ID }}.supabase.co/functions/v1/npd-event-processor
          # Expected: HTTP 200 or 401 (function exists, auth required)
```

**Acceptance:**

- [ ] Workflow executes successfully on test push
- [ ] Workflow deploys Edge Function to staging
- [ ] Workflow fails if Edge Function has errors

### 5. Staging Environment Testing

- [ ] Edge Function deployed successfully to staging Supabase project
- [ ] Function responds to HTTP requests (even if auth required)
- [ ] Function logs visible in Supabase Dashboard
- [ ] Deployment takes <2 minutes

**Verification:**

```bash
# Test deployment
curl -X POST https://gvnkzwokxtztyxsfshct.supabase.co/functions/v1/npd-event-processor \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Expected: Response from Edge Function (even if error, proves it's deployed)
```

**Acceptance:**

- [ ] Edge Function responds within 5 seconds
- [ ] Function logs appear in Supabase Dashboard → Edge Functions → Logs
- [ ] No deployment errors in GitHub Actions logs

### 6. Documentation Updates

- [ ] Deployment process documented in `docs/13_DATABASE_MIGRATIONS.md`
- [ ] Edge Function deployment added to runbook
- [ ] Rollback procedure documented (redeploy previous version)
- [ ] Troubleshooting section added (common errors)

**Documentation Requirements:**

**docs/13_DATABASE_MIGRATIONS.md** should include:

```markdown
### Edge Functions Deployment

**Automatic Deployment:**
Edge Functions deploy automatically on push to `main` branch via GitHub Actions.

**Manual Deployment:**

1. Install Supabase CLI: `npm install -g supabase`
2. Authenticate: `supabase login`
3. Deploy: `bash scripts/deploy-edge-function.sh`

**Rollback Procedure:**
Supabase keeps previous versions for 7 days. To rollback:

1. Go to Supabase Dashboard → Edge Functions
2. Select `npd-event-processor`
3. Click "Versions" → Select previous version → "Restore"

**Troubleshooting:**

- **Error: "Function not found"**: Ensure `apps/frontend/supabase/functions/npd-event-processor/index.ts` exists
- **Error: "Authentication failed"**: Check `SUPABASE_ACCESS_TOKEN` secret is valid
- **Error: "Deployment timeout"**: Function may be too large (>1MB). Optimize dependencies.
```

**Acceptance:**

- [ ] Documentation includes deployment, rollback, troubleshooting sections
- [ ] Documentation reviewed by team
- [ ] Documentation links added to Epic NPD-6 summary

---

## Technical Notes

### Function Location

```
apps/frontend/supabase/functions/npd-event-processor/
├── index.ts          # Main Edge Function handler
├── _shared/          # Shared utilities (optional)
└── package.json      # Dependencies (if needed)
```

**Note:** Edge Function code will be created in Epic NPD-1 Story 4. This story only sets up deployment infrastructure.

### Deployment Trigger

- **Automatic:** On merge to `main` branch (after migrations run)
- **Order:** Migrations (100-113) → Edge Function deployment
- **Timing:** Edge Function deploys AFTER migration 113 completes

### Rollback Strategy

- **Supabase keeps previous versions for 7 days**
- **Rollback via Dashboard:** Edge Functions → npd-event-processor → Versions → Restore
- **Rollback via CLI:** `supabase functions deploy npd-event-processor --version <previous-version>`

### Performance Expectations

- **Deployment time:** <2 minutes
- **Cold start latency:** <500ms (first request after deployment)
- **Warm latency:** <100ms (subsequent requests)

### Security Considerations

- **JWT verification:** Initially disabled (`--no-verify-jwt`) for development, enable in production
- **RLS policies:** Edge Function uses service role key (bypasses RLS), must validate org_id manually
- **Secrets:** `SUPABASE_ACCESS_TOKEN` stored in GitHub Secrets (encrypted at rest)

---

## Definition of Done (DoD)

- [ ] All 6 acceptance criteria met
- [ ] Deployment tested on staging environment
- [ ] Edge Function accessible via HTTPS
- [ ] Documentation updated in `docs/13_DATABASE_MIGRATIONS.md`
- [ ] GitHub Actions workflow green (passing)
- [ ] Rollback procedure tested (deploy → rollback → redeploy)
- [ ] Code review completed (if applicable)
- [ ] Story demo'd to team (show deployment logs)

---

## Dependencies

**Depends On:**

- Epic NPD-6 Migration 113 (indexes) - creates `npd_events` table

**Blocks:**

- Epic NPD-1 Story 4 (Event Sourcing Implementation)

**Integration Points:**

- GitHub Actions (CI/CD)
- Supabase CLI
- Supabase Edge Functions runtime (Deno)

---

## Risks and Mitigations

### Risk 1: Supabase CLI Breaking Changes

**Risk:** Supabase CLI may introduce breaking changes in future versions.

**Mitigation:**

- Pin CLI version in GitHub Actions: `uses: supabase/setup-cli@v1 with: version: 1.50.0`
- Test CLI updates in staging before production

### Risk 2: Deployment Failures in Production

**Risk:** Edge Function deployment may fail in production (network issues, Supabase outage).

**Mitigation:**

- Keep previous version for 7 days (automatic)
- Monitor deployment status via GitHub Actions notifications
- Document rollback procedure (tested in staging)

### Risk 3: Authentication Token Expiration

**Risk:** `SUPABASE_ACCESS_TOKEN` may expire, breaking CI/CD.

**Mitigation:**

- Use long-lived access tokens (90 days)
- Add monitoring alert when token expires in <7 days
- Document token refresh procedure

---

## Story Points

**Estimated:** 4 hours

**Breakdown:**

- Supabase CLI setup (1 hour)
- Deployment script creation (1 hour)
- GitHub Actions workflow (1 hour)
- Testing and documentation (1 hour)

---

## Success Metrics

- [ ] Edge Function deploys successfully on first try
- [ ] Deployment time <2 minutes (95th percentile)
- [ ] Zero manual deployments required in Epic NPD-1
- [ ] Rollback tested successfully (restore previous version in <5 minutes)

---

## Notes

**Why This is a Prerequisite:**

Epic NPD-1 Story 4 implements event sourcing, which requires the Edge Function to be deployable. Without CI/CD setup, developers would need to manually deploy the function, causing friction and potential errors.

**When to Complete:**

- **Earliest:** After Epic NPD-6 Migration 113 (indexes)
- **Latest:** Before Epic NPD-1 Story 4 starts
- **Recommended:** Complete during Epic NPD-6 (Database Schema) sprint

**Reference:**

- Solutioning Gate Check Report: `docs/implementation-readiness-report-npd-2025-11-16.md`
- Condition 2 (page 1176-1185): Edge Functions CI/CD setup required before implementation

---

**Created by:** Solutioning Gate Check Condition 2
**Last Updated:** 2025-11-16
**Status:** Ready for Epic NPD-6 inclusion
