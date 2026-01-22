# Quality Settings API Reference

Story: 06.0 - Quality Settings (Module Configuration)

## Overview

The Quality Settings API allows you to retrieve and configure quality module settings for your organization, including inspection requirements, NCR/CAPA settings, HACCP thresholds, and audit trail policies.

## Base URL

All endpoints are relative to your app base URL:

```
https://your-domain.com/api/quality/settings
```

## Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by the client SDK).

**Required Roles**:
- `GET`: Any authenticated user
- `PUT`: `admin`, `owner`, or `quality_manager`

## Endpoints

### GET /api/quality/settings

Retrieve the current quality settings for your organization. If no settings exist, this endpoint automatically initializes them with default values.

#### Request

```bash
curl -X GET https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

#### Response

**Status: 200 OK**

```json
{
  "settings": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "org_123",
    "require_incoming_inspection": true,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": true,
    "default_sampling_level": "II",
    "require_hold_reason": true,
    "require_disposition_on_release": true,
    "ncr_auto_number_prefix": "NCR-",
    "ncr_require_root_cause": true,
    "ncr_critical_response_hours": 24,
    "ncr_major_response_hours": 48,
    "capa_auto_number_prefix": "CAPA-",
    "capa_require_effectiveness": true,
    "capa_effectiveness_wait_days": 30,
    "coa_auto_number_prefix": "COA-",
    "coa_require_approval": false,
    "ccp_deviation_escalation_minutes": 15,
    "ccp_auto_create_ncr": true,
    "require_change_reason": true,
    "retention_years": 7,
    "created_at": "2025-01-21T10:30:00Z",
    "updated_at": "2025-01-21T10:30:00Z"
  }
}
```

#### Error Responses

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

**Status: 500 Internal Server Error**

```json
{
  "error": "Internal server error"
}
```

---

### PUT /api/quality/settings

Update quality settings. Supports partial updates (only changed fields).

#### Request

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_SESSION_TOKEN
```

**Body (all fields optional):**

```json
{
  "require_incoming_inspection": false,
  "ncr_critical_response_hours": 12,
  "retention_years": 10
}
```

#### Response

**Status: 200 OK**

```json
{
  "settings": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "org_123",
    "require_incoming_inspection": false,
    "ncr_critical_response_hours": 12,
    "retention_years": 10,
    "...": "other fields"
  },
  "message": "Quality settings updated successfully"
}
```

#### Error Responses

**Status: 400 Bad Request** - Validation Error

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "Must be at least 1 hour",
      "path": ["ncr_critical_response_hours"]
    }
  ]
}
```

**Status: 401 Unauthorized**

```json
{
  "error": "Unauthorized"
}
```

**Status: 403 Forbidden**

```json
{
  "error": "Forbidden: Admin, Owner, or Quality Manager role required"
}
```

**Status: 404 Not Found**

```json
{
  "error": "User not found"
}
```

**Status: 500 Internal Server Error**

```json
{
  "error": "Internal server error"
}
```

---

## Settings Fields Reference

### Inspection Settings

| Field | Type | Default | Validation | Description |
|-------|------|---------|------------|-------------|
| `require_incoming_inspection` | boolean | true | - | All received materials must pass incoming inspection before use |
| `require_final_inspection` | boolean | true | - | Finished products must pass final inspection before shipping |
| `auto_create_inspection_on_grn` | boolean | true | - | Automatically create incoming inspection when goods receipt is completed |
| `default_sampling_level` | string | "II" | I, II, III, S-1, S-2, S-3, S-4 | Default AQL sampling level for inspection plans |

### Hold Settings

| Field | Type | Default | Validation | Description |
|-------|------|---------|------------|-------------|
| `require_hold_reason` | boolean | true | - | A reason must be provided when placing inventory on hold |
| `require_disposition_on_release` | boolean | true | - | Disposition decision must be documented when releasing held inventory |

### NCR Settings

| Field | Type | Default | Validation | Description |
|-------|------|---------|------------|-------------|
| `ncr_auto_number_prefix` | string | "NCR-" | 1-10 chars | Prefix for auto-generated NCR numbers |
| `ncr_require_root_cause` | boolean | true | - | Root cause must be documented before closing an NCR |
| `ncr_critical_response_hours` | integer | 24 | 1-168 | Maximum time to respond to critical severity NCRs (hours) |
| `ncr_major_response_hours` | integer | 48 | 1-336 | Maximum time to respond to major severity NCRs (hours) |

### CAPA Settings

| Field | Type | Default | Validation | Description |
|-------|------|---------|------------|-------------|
| `capa_auto_number_prefix` | string | "CAPA-" | 1-10 chars | Prefix for auto-generated CAPA numbers |
| `capa_require_effectiveness` | boolean | true | - | CAPA effectiveness must be verified before closing |
| `capa_effectiveness_wait_days` | integer | 30 | 0-365 | Minimum days to wait before effectiveness check |

### CoA Settings

| Field | Type | Default | Validation | Description |
|-------|------|---------|------------|-------------|
| `coa_auto_number_prefix` | string | "COA-" | 1-10 chars | Prefix for auto-generated Certificate of Analysis numbers |
| `coa_require_approval` | boolean | false | - | Certificates of Analysis must be approved before release |

### HACCP Settings

| Field | Type | Default | Validation | Description |
|-------|------|---------|------------|-------------|
| `ccp_deviation_escalation_minutes` | integer | 15 | 1-1440 | Time before CCP deviation escalates to QA Manager (minutes) |
| `ccp_auto_create_ncr` | boolean | true | - | Automatically create NCR when CCP deviation is recorded |

### Audit Settings

| Field | Type | Default | Validation | Description |
|-------|------|---------|------------|-------------|
| `require_change_reason` | boolean | true | - | Users must provide a reason when modifying critical quality records |
| `retention_years` | integer | 7 | 1-50 | How long quality records are retained (years) |

---

## Code Examples

### JavaScript/TypeScript (fetch)

```typescript
// Fetch quality settings
async function getQualitySettings(): Promise<QualitySettings> {
  const response = await fetch('/api/quality/settings', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch settings');
  }

  const data = await response.json();
  return data.settings;
}

// Update quality settings
async function updateQualitySettings(
  updates: Partial<QualitySettings>
): Promise<QualitySettings> {
  const response = await fetch('/api/quality/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update settings');
  }

  const data = await response.json();
  return data.settings;
}
```

### React Hook (with React Query)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch hook
export function useQualitySettings() {
  return useQuery({
    queryKey: ['quality-settings'],
    queryFn: async () => {
      const res = await fetch('/api/quality/settings');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return data.settings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update hook
export function useUpdateQualitySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      const res = await fetch('/api/quality/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['quality-settings'], data.settings);
    },
  });
}
```

### cURL Examples

```bash
# Get quality settings
curl -X GET https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Update NCR response times
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "ncr_critical_response_hours": 12,
    "ncr_major_response_hours": 24
  }'

# Disable incoming inspection requirement
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "require_incoming_inspection": false
  }'
```

---

## Auto-Initialization

When you call `GET /api/quality/settings` for the first time:

1. The service checks if settings exist for your organization
2. If not found, it automatically creates a new record with default values
3. The populated settings are returned

You do not need to call any initialization endpoint. Additionally, a database trigger automatically creates quality settings when a new organization is created.

---

## Common Workflows

### Configure Stricter NCR Response Times

```json
{
  "ncr_critical_response_hours": 12,
  "ncr_major_response_hours": 24,
  "ncr_require_root_cause": true
}
```

### Reduce Inspection Requirements for Trusted Suppliers

```json
{
  "require_incoming_inspection": false,
  "auto_create_inspection_on_grn": false,
  "default_sampling_level": "I"
}
```

### Enable HACCP Auto-NCR with Faster Escalation

```json
{
  "ccp_deviation_escalation_minutes": 5,
  "ccp_auto_create_ncr": true
}
```

### Increase Document Retention for Compliance

```json
{
  "retention_years": 10,
  "require_change_reason": true
}
```

### Require CoA Approval for All Certificates

```json
{
  "coa_require_approval": true
}
```

---

## Database Schema

The `quality_settings` table has the following structure:

```sql
CREATE TABLE quality_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,

    -- Inspection Settings
    require_incoming_inspection BOOLEAN DEFAULT true,
    require_final_inspection BOOLEAN DEFAULT true,
    auto_create_inspection_on_grn BOOLEAN DEFAULT true,
    default_sampling_level TEXT DEFAULT 'II',

    -- Hold Settings
    require_hold_reason BOOLEAN DEFAULT true,
    require_disposition_on_release BOOLEAN DEFAULT true,

    -- NCR Settings
    ncr_auto_number_prefix TEXT DEFAULT 'NCR-',
    ncr_require_root_cause BOOLEAN DEFAULT true,
    ncr_critical_response_hours INTEGER DEFAULT 24,
    ncr_major_response_hours INTEGER DEFAULT 48,

    -- CAPA Settings
    capa_auto_number_prefix TEXT DEFAULT 'CAPA-',
    capa_require_effectiveness BOOLEAN DEFAULT true,
    capa_effectiveness_wait_days INTEGER DEFAULT 30,

    -- CoA Settings
    coa_auto_number_prefix TEXT DEFAULT 'COA-',
    coa_require_approval BOOLEAN DEFAULT false,

    -- HACCP Settings
    ccp_deviation_escalation_minutes INTEGER DEFAULT 15,
    ccp_auto_create_ncr BOOLEAN DEFAULT true,

    -- Audit Settings
    require_change_reason BOOLEAN DEFAULT true,
    retention_years INTEGER DEFAULT 7,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Row Level Security**: Users can only access settings for their own organization.

---

## Rate Limiting

No explicit rate limiting is applied. API requests are subject to standard Supabase per-function rate limits.

---

## Changelog

### v1.0 (2025-01-21)

- Initial release with Quality Settings API
- GET endpoint with auto-initialization
- PUT endpoint for partial updates
- Validation for all numeric fields
- RLS policy for org isolation
- Auto-initialization trigger on org creation
