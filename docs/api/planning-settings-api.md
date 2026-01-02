# Planning Settings API Reference

Story: 03.5a - PO Approval Setup & 03.17 - Planning Settings

## Overview

The Planning Settings API allows you to retrieve and configure planning module settings for your organization, including Purchase Order (PO) approval workflows, numbering conventions, and transfer order defaults.

## Base URL

All endpoints are relative to your app base URL:

```
https://your-domain.com/api/settings/planning
```

## Authentication

All endpoints require authentication. Include your session token in the request headers (automatically handled by the client SDK).

**Required Roles**:
- `GET`: Any authenticated user
- `PUT/PATCH`: `admin` or `owner`

## Endpoints

### GET /api/settings/planning

Retrieve the current planning settings for your organization. If no settings exist, this endpoint automatically initializes them with default values.

#### Request

```bash
curl -X GET https://your-domain.com/api/settings/planning \
  -H "Content-Type: application/json"
```

#### Response

**Status: 200 OK**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "org_123",
  "po_require_approval": false,
  "po_approval_threshold": null,
  "po_approval_roles": ["admin", "manager"],
  "po_auto_number_prefix": "PO-",
  "po_auto_number_format": "YYYY-NNNNN",
  "po_default_payment_terms": "Net 30",
  "po_default_currency": "PLN",
  "to_allow_partial_shipments": true,
  "to_require_lp_selection": false,
  "to_auto_number_prefix": "TO-",
  "to_auto_number_format": "YYYY-NNNNN",
  "to_default_transit_days": 1,
  "wo_material_check": true,
  "wo_copy_routing": true,
  "wo_auto_select_bom": true,
  "wo_require_bom": true,
  "wo_allow_overproduction": false,
  "wo_overproduction_limit": 10,
  "wo_auto_number_prefix": "WO-",
  "wo_auto_number_format": "YYYY-NNNNN",
  "wo_default_scheduling_buffer_hours": 2,
  "created_at": "2025-01-02T10:30:00Z",
  "updated_at": "2025-01-02T10:30:00Z"
}
```

#### Error Responses

**Status: 401 Unauthorized**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "details": "Session not found"
  }
}
```

**Status: 404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User profile not found",
    "details": "Cannot determine organization"
  }
}
```

**Status: 500 Internal Server Error**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch planning settings",
    "details": "Database connection error"
  }
}
```

---

### PUT /api/settings/planning

Update planning settings. Supports partial updates (only changed fields).

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body (all fields optional):**

```json
{
  "po_require_approval": true,
  "po_approval_threshold": 5000.50,
  "po_approval_roles": ["admin", "manager", "procurement"]
}
```

#### Response

**Status: 200 OK**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "org_id": "org_123",
    "po_require_approval": true,
    "po_approval_threshold": 5000.50,
    "po_approval_roles": ["admin", "manager", "procurement"],
    "...": "other fields"
  },
  "message": "Planning settings updated successfully"
}
```

#### Error Responses

**Status: 400 Bad Request** - Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fieldErrors": {
        "po_approval_threshold": ["Threshold must be a positive number"],
        "po_approval_roles": ["At least one approval role must be selected"]
      }
    }
  }
}
```

**Status: 400 Bad Request** - Invalid JSON

```json
{
  "success": false,
  "error": {
    "code": "INVALID_JSON",
    "message": "Invalid JSON",
    "details": "Request body must be valid JSON"
  }
}
```

**Status: 401 Unauthorized**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "details": "Session not found"
  }
}
```

**Status: 403 Forbidden**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access settings",
    "details": "Only admin and owner roles can modify settings"
  }
}
```

**Status: 500 Internal Server Error**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to update planning settings",
    "details": "Database connection error"
  }
}
```

---

### PATCH /api/settings/planning

Update planning settings (identical to PUT). Follows the same request/response format as PUT.

**Note**: Both PUT and PATCH are supported for convenience. They perform identical operations.

---

## Validation Rules

### PO Approval Settings

| Field | Type | Rules | Default |
|-------|------|-------|---------|
| `po_require_approval` | boolean | N/A | false |
| `po_approval_threshold` | number / null | Positive number > 0; max 4 decimal places; can be null | null |
| `po_approval_roles` | string[] | At least one role; non-empty strings | ["admin", "manager"] |

### PO Configuration

| Field | Type | Rules | Default |
|-------|------|-------|---------|
| `po_auto_number_prefix` | string | 1-10 chars | "PO-" |
| `po_auto_number_format` | string | YYYY-NNNNN format | "YYYY-NNNNN" |
| `po_default_payment_terms` | string | Any text | "Net 30" |
| `po_default_currency` | string | 3-letter code (PLN, EUR, USD, GBP) | "PLN" |

### Transfer Order Settings

| Field | Type | Rules | Default |
|-------|------|-------|---------|
| `to_allow_partial_shipments` | boolean | N/A | true |
| `to_require_lp_selection` | boolean | N/A | false |
| `to_auto_number_prefix` | string | 1-10 chars | "TO-" |
| `to_auto_number_format` | string | YYYY-NNNNN format | "YYYY-NNNNN" |
| `to_default_transit_days` | number | Positive integer | 1 |

### Work Order Settings

| Field | Type | Rules | Default |
|-------|------|-------|---------|
| `wo_material_check` | boolean | N/A | true |
| `wo_copy_routing` | boolean | N/A | true |
| `wo_auto_select_bom` | boolean | N/A | true |
| `wo_require_bom` | boolean | N/A | true |
| `wo_allow_overproduction` | boolean | N/A | false |
| `wo_overproduction_limit` | number | 0-100 (percent) | 10 |
| `wo_auto_number_prefix` | string | 1-10 chars | "WO-" |
| `wo_auto_number_format` | string | YYYY-NNNNN format | "YYYY-NNNNN" |
| `wo_default_scheduling_buffer_hours` | number | 0-24 (hours) | 2 |

## Code Examples

### JavaScript/TypeScript

```typescript
// Fetch settings
const response = await fetch('/api/settings/planning', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});
const settings = await response.json();

// Update PO approval settings
const updateResponse = await fetch('/api/settings/planning', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    po_require_approval: true,
    po_approval_threshold: 1000,
    po_approval_roles: ['admin', 'manager', 'procurement']
  })
});
const updated = await updateResponse.json();
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

export function PlanningSettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/settings/planning');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(updates) {
    try {
      const response = await fetch('/api/settings/planning', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message);
      }
      const updated = await response.json();
      setSettings(updated.data);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Planning Settings</h2>
      {/* Render settings and form */}
    </div>
  );
}
```

### Python

```python
import requests

# Fetch settings
response = requests.get('https://your-domain.com/api/settings/planning')
settings = response.json()

# Update settings
updated = requests.put(
    'https://your-domain.com/api/settings/planning',
    json={
        'po_require_approval': True,
        'po_approval_threshold': 5000.50,
        'po_approval_roles': ['admin', 'manager', 'procurement']
    }
)
```

## Auto-Initialization

When you call `GET /api/settings/planning` for the first time:

1. The service checks if settings exist for your organization
2. If not found (PGRST116 error), it automatically creates a new record
3. The new record is populated with default values
4. The populated settings are returned

You do not need to call any initialization endpoint. It happens automatically.

## Common Workflows

### Enable PO Approval for POs Over 5000 PLN

```json
{
  "po_require_approval": true,
  "po_approval_threshold": 5000,
  "po_approval_roles": ["admin", "manager"]
}
```

### Require Approval for All POs

```json
{
  "po_require_approval": true,
  "po_approval_threshold": null,
  "po_approval_roles": ["admin"]
}
```

### Disable PO Approval

```json
{
  "po_require_approval": false,
  "po_approval_threshold": null
}
```

### Add Procurement Role to Approvers

```json
{
  "po_approval_roles": ["admin", "manager", "procurement"]
}
```

## Rate Limiting

No explicit rate limiting is applied, but API requests are subject to standard Supabase per-function rate limits (100 requests per minute per IP address).

## Changelog

### v1.0 (2025-01-02)

- Initial release with PO Approval Settings
- GET endpoint with auto-initialization
- PUT/PATCH endpoints for updates
- Validation for threshold, roles, and other settings
