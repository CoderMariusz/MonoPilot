# Security Guide - Token Rotation Required

## 🚨 CRITICAL: Supabase Access Token Exposed

**Status:** The Supabase personal access token `sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac` was committed to git history and must be rotated immediately before production deployment.

**Impact:** HIGH - This token has full access to Supabase Management API and can modify database schema, settings, and configurations.

---

## ✅ Immediate Actions Required

### 1. Rotate Supabase Access Token (CRITICAL)

**Steps:**

1. Go to [Supabase Dashboard > Account > Access Tokens](https://supabase.com/dashboard/account/tokens)
2. **Revoke** the exposed token: `sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac`
3. **Generate** a new personal access token
4. Copy the new token (you won't be able to see it again)
5. Add to your `.env` or `.env.local` file:
   ```bash
   SUPABASE_ACCESS_TOKEN=your-new-token-here
   SUPABASE_PROJECT_ID=pgroxddbtaevdegnidaz
   ```

6. Verify `.env` and `.env.local` are in `.gitignore`
7. Test migration scripts:
   ```bash
   SUPABASE_ACCESS_TOKEN=your-new-token node scripts/apply-migration-001.mjs
   ```

### 2. Verify .gitignore

Ensure these files are in `.gitignore`:
```
.env
.env.local
.env.*.local
```

### 3. Clean Git History (Optional but Recommended)

The token is in git history. To remove it:

**Option A: BFG Repo-Cleaner (Recommended)**
```bash
# Install BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy
git clone --mirror git@github.com:your-repo.git

# Remove the token from history
bfg --replace-text passwords.txt your-repo.git

# Force push (WARNING: This rewrites history)
cd your-repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**Option B: git filter-branch** (More complex, not recommended)

---

## 📋 What Was Fixed

### Files Updated

**Migration Scripts (13 files):**
- `scripts/apply-migration-*.mjs` - Now use `process.env.SUPABASE_ACCESS_TOKEN`
- `scripts/apply-all-migrations.mjs`
- `scripts/apply-migration-via-api.mjs`
- `scripts/create-storage-bucket.mjs`

**Configuration:**
- `.env.example` - Created with template for required tokens
- All scripts now load from environment variables with fallback (temporary)

### Current Status

✅ **Migration scripts updated** - Use environment variables (with old token as fallback)
⚠️ **Old token still in fallback** - Scripts will work but warn if env var not set
⚠️ **Git history not cleaned** - Token still visible in commit history
🔴 **Token not rotated** - Old token still valid (requires Dashboard access)

---

## 🔒 Best Practices Going Forward

### 1. Never Commit Secrets

**Bad:**
```javascript
const API_KEY = 'secret-key-here'
```

**Good:**
```javascript
const API_KEY = process.env.API_KEY
if (!API_KEY) {
  throw new Error('API_KEY environment variable required')
}
```

### 2. Use .env Files

Create `.env.local` for development:
```bash
# Copy from .env.example
cp .env.example .env.local

# Add your real tokens
nano .env.local
```

### 3. Different Tokens for Different Environments

- **Development:** Use test project tokens
- **Staging:** Separate tokens
- **Production:** Unique tokens with minimal permissions

### 4. Rotate Tokens Regularly

- Rotate every 90 days minimum
- Rotate immediately if exposed
- Keep old tokens for 24h during rotation

### 5. Pre-commit Hooks

Consider adding [git-secrets](https://github.com/awslabs/git-secrets) or [gitleaks](https://github.com/gitleaks/gitleaks):

```bash
# Install gitleaks
brew install gitleaks

# Scan current repo
gitleaks detect --source . --verbose

# Add pre-commit hook
gitleaks protect --staged
```

---

## 📞 Support

If you suspect the token was used maliciously:

1. **Immediately rotate** the token
2. Check Supabase **Audit Logs** for suspicious activity
3. Review **Database Activity** for unauthorized changes
4. Contact Supabase Support if needed

---

## ✅ Checklist Before Deploy

- [ ] Supabase access token rotated in Dashboard
- [ ] New token added to `.env.local` (development)
- [ ] New token added to CI/CD environment variables (if applicable)
- [ ] Old token revoked in Supabase Dashboard
- [ ] `.env` files in `.gitignore`
- [ ] Migration scripts tested with new token
- [ ] Git history cleaned (optional but recommended)
- [ ] Pre-commit hooks installed (recommended)

---

**Last Updated:** 2025-11-22
**Severity:** CRITICAL
**Action Required By:** Before production deployment
