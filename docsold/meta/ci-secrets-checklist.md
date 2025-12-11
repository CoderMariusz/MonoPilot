# CI/CD Secrets Checklist

Required and optional secrets for GitHub Actions CI/CD pipeline.

## 📋 Required Secrets

### None Required for Basic Setup

The basic CI/CD pipeline requires **no secrets** to function. Tests run without authentication or external services.

## 🔒 Optional Secrets

Configure these if you need advanced features:

### 1. Supabase (Database Access)

**Required for**: Test data setup, cleanup, API testing

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) | Supabase Dashboard → Settings → API → Service Role |

**Where to set**:
```
GitHub Repository → Settings → Secrets and variables → Actions → New repository secret
```

**Usage in workflow**:
```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### 2. Slack Notifications (Optional)

**Required for**: Slack notifications on test failures

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `SLACK_WEBHOOK` | Incoming webhook URL | Slack → Apps → Incoming Webhooks → Add to Channel |

**Where to set**: GitHub Settings → Secrets → Actions

**Usage in workflow**:
```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 3. Test User Credentials

**Required for**: Authentication tests

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `TEST_USER_EMAIL` | Test user email | `test@example.com` |
| `TEST_USER_PASSWORD` | Test user password | `SecurePassword123!` |
| `TEST_ADMIN_EMAIL` | Test admin email | `admin@example.com` |
| `TEST_ADMIN_PASSWORD` | Test admin password | `AdminPassword123!` |

**Where to set**: GitHub Settings → Secrets → Actions

**Usage in workflow**:
```yaml
env:
  TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
  TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

### 4. API Keys (If Applicable)

**Required for**: Third-party API testing

| Secret Name | Description |
|------------|-------------|
| `API_KEY_SERVICE_NAME` | External service API key |
| `STRIPE_TEST_KEY` | Stripe test API key (if using Stripe) |

**Where to set**: GitHub Settings → Secrets → Actions

## 🔧 How to Add Secrets

### GitHub Actions

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter:
   - **Name**: Secret name (e.g., `SLACK_WEBHOOK`)
   - **Value**: Secret value
5. Click **Add secret**

### Environment-Specific Secrets

For multiple environments (staging, production):

1. Create **Environments**:
   - Settings → Environments → New environment
2. Add environment-specific secrets:
   - Environment → Secrets → Add secret

**Usage in workflow**:
```yaml
jobs:
  test:
    environment: staging
    steps:
      - run: echo "Using staging secrets"
```

## 🛡️ Security Best Practices

### 1. Never Commit Secrets

```bash
# ✅ Use secrets in CI
env:
  API_KEY: ${{ secrets.API_KEY }}

# ❌ Never hardcode
env:
  API_KEY: "sk_test_123456789"
```

### 2. Use Service Accounts

Create dedicated service accounts for CI:

- ✅ `ci-bot@example.com` (dedicated)
- ❌ `your-personal-email@example.com` (bad)

### 3. Rotate Secrets Regularly

- **Quarterly**: Rotate all secrets
- **Immediately**: If exposed or suspicious activity

### 4. Limit Secret Scope

- Use read-only keys when possible
- Grant minimum permissions required

### 5. Audit Secret Usage

Check GitHub Actions logs:
- Settings → Actions → Logs
- Review which workflows access secrets

## ✅ Verification Checklist

After adding secrets, verify:

- [ ] Secret name matches exactly (case-sensitive)
- [ ] Secret value has no leading/trailing spaces
- [ ] Workflow references secret correctly: `${{ secrets.NAME }}`
- [ ] Workflow has permission to access secret
- [ ] Test run passes with secret configured

## 🔄 Testing Secrets Locally

**Never use production secrets locally!**

Instead:

1. Create `.env.test` (gitignored):
   ```bash
   TEST_USER_EMAIL=local-test@example.com
   TEST_USER_PASSWORD=LocalPassword123!
   ```

2. Load in tests:
   ```typescript
   const email = process.env.TEST_USER_EMAIL || 'fallback@example.com';
   ```

3. Use separate test database/project

## 📚 Related Documentation

- [CI/CD Pipeline Documentation](./ci.md)
- [Test Framework Setup](../tests/README.md)
- [GitHub Encrypted Secrets Docs](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Generated by**: BMAD Test Architect v6.0
**Date**: 2025-11-20
