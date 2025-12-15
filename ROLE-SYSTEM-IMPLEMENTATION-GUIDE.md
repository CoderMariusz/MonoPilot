# Role System Implementation Guide

**For**: FRONTEND-DEV
**Reference**: SET-008, SET-009
**PRD Requirement**: FR-SET-011, FR-SET-020 to FR-SET-029
**Status**: Ready for Implementation

---

## Quick Reference: 10 Roles

```
SUPER_ADMIN        → "Super Admin"       (System owner, billing access)
ADMIN              → "Admin"             (Full access except billing)
PRODUCTION_MANAGER → "Production Manager" (Production & planning oversight)
QUALITY_MANAGER    → "Quality Manager"    (Quality & CoA management)
WAREHOUSE_MANAGER  → "Warehouse Manager"  (Warehouse & location config)
PRODUCTION_OPERATOR→ "Production Operator"(Execute production tasks)
QUALITY_INSPECTOR  → "Quality Inspector"  (Test results & holds)
WAREHOUSE_OPERATOR → "Warehouse Operator" (Pick/pack/move operations)
PLANNER            → "Planner"            (Sales orders & MRP/MPS)
VIEWER             → "Viewer"             (Read-only access)
```

---

## Implementation Checklist

### Phase 1: Validation Schema
- [ ] Update `lib/validation/user-schema.ts` with 10-role enum
- [ ] Test validation against all 10 roles
- [ ] Ensure Zod schema includes all enum values

### Phase 2: Type Definitions
- [ ] Update user type in `lib/types/user.ts`
- [ ] Add UserRole type with all 10 values
- [ ] Update User interface to use new type

### Phase 3: Database Migrations
- [ ] Verify 10-role support in users table (likely already exists)
- [ ] Check RLS policies for role-based access
- [ ] Validate existing data (migrate if needed)

### Phase 4: Frontend Components
- [ ] Update role dropdown component to render 10 options
- [ ] Update role filter control in SET-008
- [ ] Update role badge styling (ensure unique colors for all 10)
- [ ] Test keyboard navigation with 10 options

### Phase 5: API Integration
- [ ] Create/update GET /api/settings/roles endpoint
- [ ] Ensure role list returns all 10 values with display labels
- [ ] Update user list endpoint to accept role filter
- [ ] Add role validation in POST/PATCH endpoints

### Phase 6: Testing
- [ ] Unit test: Role enum validation
- [ ] Integration test: Create user with each role
- [ ] E2E test: Filter user list by each role
- [ ] Permission test: Verify role-based access matrix

---

## Code Snippets

### Zod Schema (lib/validation/user-schema.ts)

```typescript
import { z } from 'zod';

export const userRoleEnum = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'PRODUCTION_MANAGER',
  'QUALITY_MANAGER',
  'WAREHOUSE_MANAGER',
  'PRODUCTION_OPERATOR',
  'QUALITY_INSPECTOR',
  'WAREHOUSE_OPERATOR',
  'PLANNER',
  'VIEWER',
]);

export type UserRole = z.infer<typeof userRoleEnum>;

export const createUserSchema = z.object({
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  email: z.string().email(),
  role: userRoleEnum,
  warehouse_access: z.array(z.string()).min(1),
  active: z.boolean().default(false),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

### Role Display Mapping (lib/utils/role-display.ts)

```typescript
import { UserRole } from '@/lib/validation/user-schema';

const roleDisplayMap: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  PRODUCTION_MANAGER: 'Production Manager',
  QUALITY_MANAGER: 'Quality Manager',
  WAREHOUSE_MANAGER: 'Warehouse Manager',
  PRODUCTION_OPERATOR: 'Production Operator',
  QUALITY_INSPECTOR: 'Quality Inspector',
  WAREHOUSE_OPERATOR: 'Warehouse Operator',
  PLANNER: 'Planner',
  VIEWER: 'Viewer',
};

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-900',
  ADMIN: 'bg-orange-100 text-orange-900',
  PRODUCTION_MANAGER: 'bg-blue-100 text-blue-900',
  QUALITY_MANAGER: 'bg-purple-100 text-purple-900',
  WAREHOUSE_MANAGER: 'bg-green-100 text-green-900',
  PRODUCTION_OPERATOR: 'bg-cyan-100 text-cyan-900',
  QUALITY_INSPECTOR: 'bg-yellow-100 text-yellow-900',
  WAREHOUSE_OPERATOR: 'bg-lime-100 text-lime-900',
  PLANNER: 'bg-pink-100 text-pink-900',
  VIEWER: 'bg-gray-100 text-gray-900',
};

export function getRoleDisplay(role: UserRole): string {
  return roleDisplayMap[role];
}

export function getRoleColor(role: UserRole): string {
  return roleColors[role];
}
```

### Role Filter Dropdown (for SET-008)

```typescript
import { userRoleEnum, UserRole } from '@/lib/validation/user-schema';
import { getRoleDisplay } from '@/lib/utils/role-display';

const roleOptions: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  ...userRoleEnum.options.map(role => ({
    value: role as UserRole,
    label: getRoleDisplay(role as UserRole),
  })),
];

export function RoleFilterDropdown() {
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');

  return (
    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as any)}>
      {roleOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
```

### API Endpoint (POST /api/settings/users)

```typescript
// apps/frontend/app/api/settings/users/route.ts
import { createUserSchema } from '@/lib/validation/user-schema';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json();

  // Validate against schema
  const result = createUserSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Create user with validated role
  const { data, error } = await supabase
    .from('users')
    .insert({
      org_id: user.user_metadata.org_id,
      email: result.data.email,
      first_name: result.data.first_name,
      last_name: result.data.last_name,
      role: result.data.role, // Enum-validated value
      warehouse_access: result.data.warehouse_access,
      active: result.data.active,
      status: 'invited',
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Send invitation email
  // ... email logic ...

  return Response.json(data);
}
```

### Role Badge Component

```typescript
import { UserRole } from '@/lib/validation/user-schema';
import { getRoleDisplay, getRoleColor } from '@/lib/utils/role-display';

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${getRoleColor(role)}`}>
      {getRoleDisplay(role)}
    </span>
  );
}
```

---

## API Endpoints (Reference)

### Get All Valid Roles
```
GET /api/settings/roles

Response:
{
  "roles": [
    { "value": "SUPER_ADMIN", "label": "Super Admin" },
    { "value": "ADMIN", "label": "Admin" },
    ...
  ]
}
```

### List Users with Role Filter
```
GET /api/settings/users?role={role}&status={status}&page={page}

Parameters:
- role: UserRole | 'all'
- status: 'all' | 'active' | 'invited' | 'disabled'
- page: number (default: 1)

Response:
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "PRODUCTION_MANAGER",
      "status": "active",
      ...
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

### Create User
```
POST /api/settings/users

Body:
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "role": "PRODUCTION_MANAGER",
  "warehouse_access": ["wh_001", "wh_002"],
  "active": false
}

Response: Created user object with all fields
```

### Update User
```
PATCH /api/settings/users/:id

Body:
{
  "role": "QUALITY_MANAGER",
  "warehouse_access": ["wh_001"],
  "active": true
}

Response: Updated user object
```

---

## Permission Matrix (for Reference)

**Role-Based Action Permissions**:

| Role | View Users | Invite | Edit Other | Change Role | Disable |
|------|-----------|--------|-----------|------------|---------|
| SUPER_ADMIN | All | Yes | All | All | All |
| ADMIN | All | Yes | All | Admin↓ | Admin↓ |
| PRODUCTION_MANAGER | All | No | Self | No | No |
| QUALITY_MANAGER | All | No | Self | No | No |
| WAREHOUSE_MANAGER | All | No | Self | No | No |
| PRODUCTION_OPERATOR | All | No | Self | No | No |
| QUALITY_INSPECTOR | All | No | Self | No | No |
| WAREHOUSE_OPERATOR | All | No | Self | No | No |
| PLANNER | All | No | Self | No | No |
| VIEWER | All | No | Self | No | No |

**Notes**:
- Admin↓ = Can only change/manage roles below their own
- Cannot demote self
- Cannot disable last Super Admin
- Cannot invite roles above current role

---

## Testing Strategy

### Unit Tests
```typescript
// test/validation/user-schema.test.ts
describe('userRoleEnum', () => {
  it('should validate all 10 roles', () => {
    const roles = [
      'SUPER_ADMIN',
      'ADMIN',
      'PRODUCTION_MANAGER',
      'QUALITY_MANAGER',
      'WAREHOUSE_MANAGER',
      'PRODUCTION_OPERATOR',
      'QUALITY_INSPECTOR',
      'WAREHOUSE_OPERATOR',
      'PLANNER',
      'VIEWER',
    ];

    roles.forEach(role => {
      const result = userRoleEnum.safeParse(role);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid roles', () => {
    const result = userRoleEnum.safeParse('INVALID_ROLE');
    expect(result.success).toBe(false);
  });
});
```

### E2E Tests (Playwright)
```typescript
// e2e/user-management.spec.ts
test('Create user with each role', async ({ page }) => {
  const roles = [
    'SUPER_ADMIN',
    'ADMIN',
    'PRODUCTION_MANAGER',
    'QUALITY_MANAGER',
    'WAREHOUSE_MANAGER',
    'PRODUCTION_OPERATOR',
    'QUALITY_INSPECTOR',
    'WAREHOUSE_OPERATOR',
    'PLANNER',
    'VIEWER',
  ];

  for (const role of roles) {
    await page.click('[data-testid="invite-user-button"]');
    await page.fill('[data-testid="first-name"]', 'Test');
    await page.fill('[data-testid="last-name"]', role);
    await page.fill('[data-testid="email"]', `${role}@test.com`);
    await page.selectOption('[data-testid="role-select"]', role);
    await page.click('[data-testid="submit"]');
    await expect(page.locator(`text=${role}`)).toBeVisible();
  }
});
```

---

## Troubleshooting

### Issue: Dropdown shows only 5 roles
**Solution**: Verify role options array includes all 10 values. Check that `roleOptions` constant matches the schema.

### Issue: Type validation fails
**Solution**: Ensure role value uses UPPER_SNAKE_CASE (e.g., PRODUCTION_MANAGER not ProductionManager)

### Issue: Role not saving to database
**Solution**: Verify database column accepts all 10 enum values. Run migration if needed.

### Issue: Permissions not working correctly
**Solution**: Check RLS policies match permission matrix. Verify role-based logic in API routes.

---

## Rollout Plan

1. **Phase 1**: Deploy validation schema + types
2. **Phase 2**: Update frontend components (dropdowns, badges)
3. **Phase 3**: Update API endpoints
4. **Phase 4**: Run full test suite
5. **Phase 5**: Deploy to staging
6. **Phase 6**: Deploy to production

---

## References

- **Wireframes**: SET-008 (User List), SET-009 (Create/Edit Modal)
- **Validation**: lib/validation/user-schema.ts
- **Services**: lib/services/user-service.ts
- **PRD**: docs/1-BASELINE/product/modules/settings.md (FR-SET-011, FR-SET-020 to FR-SET-029)

---

**Last Updated**: 2025-12-15
**Status**: Ready for Implementation
**Approved By**: UX-DESIGNER
