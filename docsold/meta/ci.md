# CI/CD Pipeline Documentation

Production-ready CI/CD pipeline for MonoPilot test automation using GitHub Actions.

## 📋 Table of Contents

- [Pipeline Overview](#pipeline-overview)
- [Pipeline Stages](#pipeline-stages)
- [Running Locally](#running-locally)
- [Debugging CI Failures](#debugging-ci-failures)
- [Configuration](#configuration)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## 🔄 Pipeline Overview

The CI/CD pipeline runs automatically on:

- **Push** to `main` or `develop` branches
- **Pull requests** to `main` or `develop`
- **Weekly schedule** (Sunday 2 AM UTC) for burn-in
- **Manual trigger** via GitHub Actions UI

### Performance Targets

- **Lint stage**: <2 minutes
- **Test stage** (per shard): <10 minutes (4 shards in parallel)
- **Burn-in stage**: <30 minutes (10 iterations)
- **Total pipeline**: <45 minutes

### Speed-up

**20× faster** than sequential execution through:
- Parallel sharding (4 jobs)
- Dependency caching
- Browser binary caching

## 🚀 Pipeline Stages

### Stage 1: Lint (Code Quality)

Validates code quality before running tests:

```yaml
- ESLint checks
- TypeScript type checking
- Prettier formatting (optional)
```

**Timeout**: 5 minutes

### Stage 2: Test (Parallel Sharding)

Runs E2E tests across 4 parallel shards:

```bash
# Shard 1: Tests 1-25%
# Shard 2: Tests 26-50%
# Shard 3: Tests 51-75%
# Shard 4: Tests 76-100%
```

**Features**:
- Parallel execution (4 jobs)
- Chromium browser only (faster)
- Failure artifacts uploaded automatically
- Traces, screenshots, videos retained

**Timeout**: 15 minutes per shard

### Stage 3: Burn-In Loop (Flaky Detection)

Detects non-deterministic (flaky) tests:

```bash
for i in {1..10}; do
  run tests || exit 1
done
```

**Purpose**: Catch flaky tests before they reach main branch

**When it runs**:
- ✅ On PRs to `main`/`develop`
- ✅ Weekly on schedule
- ✅ Manual trigger
- ❌ NOT on every commit (too slow)

**Failure threshold**: Even ONE failure = flaky tests detected

**Timeout**: 60 minutes

### Stage 4: Report

Aggregates results and generates summary:

- Lint result
- Test result (all shards)
- Burn-in result
- Links to artifacts (if failures)

## 🏃 Running Locally

### Mirror Full CI Pipeline

Run the complete CI pipeline locally:

```bash
./scripts/ci-local.sh
```

This mirrors the CI environment:
- Stage 1: Lint + Type check
- Stage 2: E2E tests
- Stage 3: Burn-in (3 iterations instead of 10)

### Run Burn-In Loop

Standalone burn-in execution:

```bash
# 10 iterations (default)
./scripts/burn-in.sh

# Custom iterations
./scripts/burn-in.sh 5
./scripts/burn-in.sh 100
```

### Run Selective Tests

Test only changed files:

```bash
./scripts/test-changed.sh
```

## 🐛 Debugging CI Failures

### Step 1: Check Summary

View the **Test Report Summary** at the bottom of the Actions run.

### Step 2: Download Artifacts

If tests failed, download artifacts:

1. Go to failed workflow run
2. Scroll to **Artifacts** section
3. Download:
   - `test-results-shard-X` - Test results for shard X
   - `playwright-trace-shard-X` - Trace files
   - `burn-in-failures` - Burn-in loop failures

### Step 3: View Traces

Open traces in Playwright Trace Viewer:

```bash
npx playwright show-trace path/to/trace.zip
```

**Trace includes**:
- Full test execution timeline
- Screenshots at each step
- Network requests/responses
- Console logs
- DOM snapshots

### Step 4: Reproduce Locally

Run the same shard locally:

```bash
# Reproduce shard 2 failure
pnpm test:e2e --shard=2/4
```

Or mirror the full CI pipeline:

```bash
./scripts/ci-local.sh
```

### Step 5: Check Logs

Review detailed logs in GitHub Actions:

1. Click on failed job (e.g., "E2E Tests (Shard 2)")
2. Expand failed step
3. Review error messages and stack traces

## ⚙️ Configuration

### Required Secrets

No secrets required for basic setup.

**Optional secrets** (for advanced features):

| Secret Name | Purpose | Where to Set |
|------------|---------|--------------|
| `SLACK_WEBHOOK` | Slack notifications on failure | GitHub Settings → Secrets |
| `SUPABASE_SERVICE_ROLE_KEY` | Database access for test setup | GitHub Settings → Secrets |

See `docs/ci-secrets-checklist.md` for full list.

### Environment Variables

Configure in `.github/workflows/test.yml`:

```yaml
env:
  NODE_VERSION: '20.11.0'  # Node.js version
  BASE_URL: 'http://localhost:5000'  # App URL
  CI: true  # CI flag for tests
```

### Adjust Parallelism

Change shard count in workflow file:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]  # Change to [1, 2] for 2 shards
```

**Guidelines**:
- **Small test suite** (<50 tests): 2 shards
- **Medium test suite** (50-200 tests): 4 shards
- **Large test suite** (200+ tests): 8 shards

**Target**: Each shard should run <10 minutes

### Adjust Burn-In Iterations

Change iteration count in burn-in loop:

```yaml
for i in {1..10}; do  # Change 10 to desired count
```

**Recommended**:
- **Quick feedback**: 3 iterations
- **Thorough detection**: 10 iterations
- **High confidence**: 100 iterations

## 🚀 Performance Optimization

### Caching Strategy

Two cache layers:

1. **pnpm dependencies**
   - Key: `pnpm-lock.yaml` hash
   - Saves: 2-3 minutes per run

2. **Playwright browser binaries**
   - Key: `pnpm-lock.yaml` hash
   - Saves: 1-2 minutes per run

**Total savings**: 3-5 minutes per run

### Artifact Collection

Only failure artifacts are uploaded:

```yaml
if: failure()
```

**Saves**:
- Storage costs (no success artifacts)
- Upload time (faster pipeline)

**Retention**: 30 days (configurable)

### Browser Selection

Only Chromium in CI:

```yaml
npx playwright install --with-deps chromium
```

**Why**:
- Fastest installation
- Most common browser
- Full suite still tests Firefox/Safari locally

**To enable all browsers** (slower):

```yaml
npx playwright install --with-deps
```

## 🔧 Troubleshooting

### Issue: "Tests pass locally but fail in CI"

**Possible causes**:
- Race conditions (timing-dependent)
- Environment differences
- Network latency

**Solution**:
1. Download CI trace files
2. Compare with local trace
3. Add explicit waits or retries
4. Run burn-in loop locally

### Issue: "Burn-in fails intermittently"

**Diagnosis**: Flaky tests detected

**Solution**:
1. Identify which test(s) fail
2. Review test for:
   - Hard-coded waits (`sleep`)
   - Race conditions
   - External dependencies
3. Fix determinism issues
4. Re-run burn-in to verify

### Issue: "CI runs too slow"

**Solutions**:

1. **Increase shards**:
   ```yaml
   matrix:
     shard: [1, 2, 3, 4, 5, 6, 7, 8]
   ```

2. **Reduce browser coverage**:
   ```yaml
   npx playwright install --with-deps chromium  # Chromium only
   ```

3. **Enable selective testing**:
   ```bash
   ./scripts/test-changed.sh
   ```

4. **Skip burn-in on small PRs**:
   ```yaml
   if: contains(github.event.pull_request.labels.*.name, 'run-burn-in')
   ```

### Issue: "Cache not working"

**Check**:

1. Cache key matches:
   ```yaml
   key: ${{ runner.os }}-pnpm-playwright-${{ hashFiles('**/pnpm-lock.yaml') }}
   ```

2. pnpm-lock.yaml not in `.gitignore`

3. Cache storage not full (10 GB limit per repo)

### Issue: "Artifacts not uploaded"

**Check**:

1. Upload only happens on failure:
   ```yaml
   if: failure()
   ```

2. Path exists:
   ```yaml
   path: test-results/
   ```

3. Artifacts quota not exceeded

## 📊 Monitoring & Metrics

### GitHub Actions Dashboard

View pipeline metrics:

1. Go to **Actions** tab
2. Click on **Test Suite** workflow
3. View:
   - Success/failure rate
   - Average duration
   - Most common failures

### Badge (Optional)

Add status badge to README:

```markdown
![Test Suite](https://github.com/CoderMariusz/MonoPilot/actions/workflows/test.yml/badge.svg)
```

## 🔗 Related Documentation

- [Test Framework Setup](../tests/README.md)
- [CI Secrets Checklist](./ci-secrets-checklist.md)
- [Playwright Configuration](../playwright.config.ts)

---

**Generated by**: BMAD Test Architect v6.0
**Platform**: GitHub Actions
**Date**: 2025-11-20
