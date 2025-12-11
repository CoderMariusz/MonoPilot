# Security Architecture

## Overview

Multi-layered security with Supabase Auth, Row Level Security, RBAC, and comprehensive audit trails.

## Authentication

### Supabase Auth
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabase() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### Session Management
```typescript
// JWT with refresh token rotation
interface SessionConfig {
  access_token_lifetime: '1h'
  refresh_token_lifetime: '7d'
  refresh_token_rotation: true
}

// Middleware session refresh
// apps/frontend/middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerSupabase()

  // Refresh session if needed
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && !isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### MFA (Optional)
```typescript
// User can enable MFA in settings
async function enableMFA(userId: string) {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Authenticator App',
  })

  if (data) {
    // Show QR code for user to scan
    return data.totp.qr_code
  }
}

// Verify MFA on login
async function verifyMFA(factorId: string, code: string) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    code,
  })

  return !error
}
```

### SSO/SAML (Phase 3)
```typescript
// Enterprise SSO configuration
interface SSOConfig {
  provider: 'okta' | 'azure-ad' | 'google-workspace'
  metadata_url: string
  attribute_mapping: {
    email: string
    name: string
    org_id: string
    role: string
  }
}

// Supabase handles SAML flow
const { data } = await supabase.auth.signInWithSSO({
  domain: 'company.com', // Maps to SSO provider
})
```

## Authorization

### Role-Based Access Control (RBAC)

#### Default Roles
| Role | Description | Module Access |
|------|-------------|---------------|
| Admin | Full access | All modules, all operations |
| Manager | Operational oversight | All modules, limited settings |
| Planner | Planning operations | Planning, view Production |
| Operator | Production execution | Production, Scanner |
| Warehouse | Inventory management | Warehouse, Scanner |
| Quality (QC) | Quality control | Quality, view Production |
| Viewer | Read-only access | All modules, read only |
| Purchasing | PO management | Planning (PO only), Settings (suppliers) |
| Technical | Product/BOM management | Technical, view Planning |

#### Custom Roles
```typescript
// Organizations can define custom roles
interface CustomRole {
  id: string
  org_id: string
  name: string
  permissions: ModulePermission[]
}

interface ModulePermission {
  module: string
  actions: ('read' | 'create' | 'update' | 'delete')[]
}

// Example custom role
const shiftSupervisor: CustomRole = {
  id: 'role-123',
  org_id: 'org-456',
  name: 'Shift Supervisor',
  permissions: [
    { module: 'production', actions: ['read', 'create', 'update'] },
    { module: 'warehouse', actions: ['read'] },
    { module: 'quality', actions: ['read', 'create'] },
  ],
}
```

#### Permission Checking
```typescript
// lib/auth/permissions.ts
export async function checkPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  const user = await getUserWithRole(userId)

  // Admin bypass
  if (user.role === 'admin') return true

  // Check module permission
  const permissions = await getRolePermissions(user.role_id)
  const modulePermission = permissions.find(p => p.module === module)

  return modulePermission?.actions.includes(action) || false
}

// Usage in API
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!await checkPermission(user.id, 'work_orders', 'create')) {
    throw new APIError(403, 'forbidden', 'Not authorized to create work orders')
  }

  // Proceed with creation...
}

// Usage in UI
function CreateWOButton() {
  const { can } = usePermissions()

  if (!can('work_orders', 'create')) {
    return null
  }

  return <Button>Create Work Order</Button>
}
```

### Delegated Access
```typescript
// Support staff can act as user
interface DelegatedSession {
  support_user_id: string
  acting_as_user_id: string
  reason: string
  expires_at: Date
}

// All actions logged with both users
const auditEntry = {
  user_id: acting_as_user_id,
  delegated_by: support_user_id,
  // ...
}
```

## Row Level Security (RLS)

### Standard Policy Pattern
```sql
-- All business tables have this pattern
CREATE POLICY "Tenant isolation" ON work_orders
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- With role-based restrictions
CREATE POLICY "Manager+ can update" ON work_orders
  FOR UPDATE
  USING (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin', 'manager', 'planner')
  );
```

### Service Role Bypass
```typescript
// Server-side operations that need to bypass RLS
// Use service role key (never expose to client)
const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Only for: migrations, scheduled jobs, system operations
```

## Data Protection

### Encryption at Rest
- Supabase default encryption
- PostgreSQL TDE (Transparent Data Encryption)
- No additional configuration needed

### PII Fields
| Table | Field | Classification |
|-------|-------|----------------|
| users | email | PII |
| users | phone | PII |
| users | name | PII |
| suppliers | contact_email | PII |
| suppliers | contact_phone | PII |
| customers | email | PII |
| customers | phone | PII |
| customers | address | PII |

### Data Masking
```typescript
// Mask PII in logs
function maskPII(data: unknown): unknown {
  if (typeof data === 'object' && data !== null) {
    const masked = { ...data }
    const piiFields = ['email', 'phone', 'address', 'ssn']

    for (const field of piiFields) {
      if (field in masked) {
        masked[field] = '***MASKED***'
      }
    }

    return masked
  }
  return data
}

// Usage in logging
console.log('User created:', maskPII(userData))
```

## Input Validation

### Request Validation
```typescript
// All inputs validated with Zod
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'manager', 'operator', ...]),
})

// SQL injection prevention (Supabase handles)
// XSS prevention (React handles, plus CSP)
```

### Content Security Policy
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
]
```

## API Security

### API Key Management
```typescript
// Generate secure API key
function generateAPIKey(): string {
  return `mp_${crypto.randomBytes(32).toString('hex')}`
}

// Store hashed
async function createAPIKey(orgId: string, name: string): Promise<string> {
  const key = generateAPIKey()
  const hash = await bcrypt.hash(key, 10)

  await supabase
    .from('api_keys')
    .insert({
      org_id: orgId,
      name,
      key_hash: hash,
      key_prefix: key.substring(0, 10), // For display
    })

  return key // Only returned once
}

// Validate
async function validateAPIKey(key: string): Promise<APIKey | null> {
  const prefix = key.substring(0, 10)

  const { data: keys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_prefix', prefix)
    .eq('active', true)

  for (const apiKey of keys || []) {
    if (await bcrypt.compare(key, apiKey.key_hash)) {
      return apiKey
    }
  }

  return null
}
```

### OAuth2 Scopes
```typescript
// Scopes for third-party apps
const scopes = {
  'read:work_orders': 'Read work orders',
  'write:work_orders': 'Create and update work orders',
  'read:inventory': 'Read inventory data',
  'write:inventory': 'Modify inventory',
  // ...
}

// Validate scope on request
function hasScope(token: OAuthToken, scope: string): boolean {
  return token.scopes.includes(scope)
}
```

### Webhook Security
```typescript
// Sign webhook payloads
function signWebhook(payload: unknown, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(JSON.stringify(payload))
  return hmac.digest('hex')
}

// Verify on receiver
function verifyWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = signWebhook(JSON.parse(payload), secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}
```

## Audit Logging

### Comprehensive Logging
```sql
-- Trigger for all audited tables
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    org_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_by,
    ip_address
  ) VALUES (
    COALESCE(NEW.org_id, OLD.org_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### Security Events
```typescript
// Critical events logged with extra detail
const securityEvents = [
  'auth.login',
  'auth.logout',
  'auth.failed_login',
  'auth.mfa_enabled',
  'auth.password_changed',
  'auth.role_changed',
  'api_key.created',
  'api_key.revoked',
  'webhook.created',
  'export.data_exported',
]

async function logSecurityEvent(
  event: string,
  userId: string,
  metadata: Record<string, unknown>
) {
  await supabase.from('security_events').insert({
    event,
    user_id: userId,
    metadata,
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
    timestamp: new Date().toISOString(),
  })
}
```

## GDPR Compliance (Phase 3)

### Data Export
```typescript
// Export all user data
async function exportUserData(userId: string): Promise<UserDataExport> {
  const tables = [
    'users',
    'user_preferences',
    'audit_log',
    'notifications',
    // ...
  ]

  const data: Record<string, unknown[]> = {}

  for (const table of tables) {
    const { data: records } = await adminClient
      .from(table)
      .select('*')
      .eq('user_id', userId)

    data[table] = records || []
  }

  return {
    exported_at: new Date().toISOString(),
    user_id: userId,
    data,
  }
}
```

### Right to Delete
```typescript
// Delete all user data
async function deleteUserData(userId: string): Promise<void> {
  // Soft delete user
  await adminClient
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId)

  // Anonymize audit logs
  await adminClient
    .from('audit_log')
    .update({ changed_by: null })
    .eq('changed_by', userId)

  // Delete preferences
  await adminClient
    .from('user_preferences')
    .delete()
    .eq('user_id', userId)

  // Log deletion
  await logSecurityEvent('gdpr.data_deleted', userId, {
    requested_at: new Date().toISOString(),
  })
}
```

### Data Retention
```typescript
// Configurable per org (Phase 3)
interface RetentionPolicy {
  audit_log_days: 365
  security_events_days: 730
  archived_data_days: 2555 // 7 years
}

// Scheduled cleanup job
async function enforceRetention(orgId: string) {
  const policy = await getRetentionPolicy(orgId)

  // Delete old audit logs
  await adminClient
    .from('audit_log')
    .delete()
    .eq('org_id', orgId)
    .lt('changed_at', daysAgo(policy.audit_log_days))
}
```

## Security Testing

### Automated Checks
```typescript
// Security tests in CI
describe('Security', () => {
  it('prevents cross-tenant access', async () => {
    const orgA = await createTestOrg()
    const orgB = await createTestOrg()
    const userA = await createUserInOrg(orgA.id)

    // User A should not see Org B data
    const { data } = await supabase
      .from('work_orders')
      .select('*')
      .eq('org_id', orgB.id)

    expect(data).toHaveLength(0)
  })

  it('validates permissions', async () => {
    const viewer = await createUser({ role: 'viewer' })

    const response = await fetch('/api/work-orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${viewer.token}` },
      body: JSON.stringify(validWO),
    })

    expect(response.status).toBe(403)
  })
})
```

### Penetration Testing
- Annual third-party pentest
- OWASP Top 10 coverage
- Results tracked and remediated
