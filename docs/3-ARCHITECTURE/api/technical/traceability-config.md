# Traceability Configuration API

## Overview

The Traceability Configuration API enables product-level configuration of lot number formats, batch size defaults, and GS1 barcode encoding settings. This is the foundation for traceability operations in Story 02.10a.

**Status**: MVP - Configuration only (Trace queries in Story 02.10b - Epic 05)

---

## Core Concepts

### Traceability Levels
- **Lot**: Multiple units grouped together (most common for food manufacturing)
- **Batch**: Production run-based tracking (tied to work order)
- **Serial**: Unit-level tracking (1:1 mapping, highest granularity)

### Lot Number Format
Configurable pattern with placeholders:
- `{YYYY}` - 4-digit year (e.g., 2025)
- `{YY}` - 2-digit year (e.g., 25)
- `{MM}` - 2-digit month (e.g., 01-12)
- `{DD}` - 2-digit day (e.g., 01-31)
- `{YYMMDD}` - Combined date (e.g., 250615)
- `{JULIAN}` - Julian day 001-366 (e.g., 015)
- `{SEQ:N}` - N-digit sequence (e.g., {SEQ:6} = 000001)
- `{PROD}` - Product code (provided at generation time)
- `{LINE}` - Production line code (provided at generation time)

Example: `LOT-{YYYY}-{SEQ:6}` generates `LOT-2025-000001`

### Expiry Calculation Methods
- **Fixed Days**: Expiry = Manufacturing Date + Shelf Life Days
- **Rolling**: Expiry = Earliest Ingredient Expiry Date - Buffer Days
- **Manual**: Entered manually per lot during production

### GS1 Compliance
Supports three GS1-128 encodings:
- **AI 10**: Lot/Batch Number (max 20 alphanumeric chars)
- **AI 17**: Expiry Date (YYMMDD format)
- **AI 00**: SSCC-18 (Serial Shipping Container Code) for pallet tracking

---

## GET Traceability Config

Retrieve traceability configuration for a specific product.

### Endpoint
```
GET /api/v1/technical/products/:id/traceability-config
```

### Authentication
- **Required**: Yes (Bearer token)
- **Permission**: `technical.R` (Technical module read)

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Product ID |

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Response

**Status**: 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "product_id": "abc123de-f456-7890-abcd-ef1234567890",
  "lot_number_format": "LOT-{YYYY}-{SEQ:6}",
  "lot_number_prefix": "LOT-",
  "lot_number_sequence_length": 6,
  "traceability_level": "lot",
  "standard_batch_size": 1000,
  "min_batch_size": 500,
  "max_batch_size": 2000,
  "expiry_calculation_method": "fixed_days",
  "processing_buffer_days": 0,
  "gs1_lot_encoding_enabled": true,
  "gs1_expiry_encoding_enabled": true,
  "gs1_sscc_enabled": false,
  "created_at": "2025-12-20T10:30:00Z",
  "updated_at": "2025-12-20T10:30:00Z",
  "created_by": "user-123",
  "updated_by": "user-123"
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Configuration record ID |
| org_id | UUID | Organization ID (for multi-tenancy) |
| product_id | UUID | Associated product ID |
| lot_number_format | String | Lot format pattern with placeholders |
| lot_number_prefix | String | Lot number prefix (e.g., "LOT-") |
| lot_number_sequence_length | Number | Padding length for SEQ placeholder (4-10) |
| traceability_level | String | One of: lot, batch, serial |
| standard_batch_size | Number \| null | Default batch size for work orders |
| min_batch_size | Number \| null | Minimum allowed batch size |
| max_batch_size | Number \| null | Maximum allowed batch size |
| expiry_calculation_method | String | One of: fixed_days, rolling, manual |
| processing_buffer_days | Number | Buffer days for rolling expiry (0-365) |
| gs1_lot_encoding_enabled | Boolean | Enable GS1-128 AI 10 encoding |
| gs1_expiry_encoding_enabled | Boolean | Enable GS1-128 AI 17 encoding |
| gs1_sscc_enabled | Boolean | Enable SSCC-18 pallet encoding |
| created_at | ISO8601 | Creation timestamp |
| updated_at | ISO8601 | Last update timestamp |
| created_by | UUID | User who created this config |
| updated_by | UUID | User who last updated this config |

### Default Values

If no configuration exists for a product, defaults are returned:
```json
{
  "product_id": "abc123de-f456-7890-abcd-ef1234567890",
  "lot_number_format": "LOT-{YYYY}-{SEQ:6}",
  "lot_number_prefix": "LOT-",
  "lot_number_sequence_length": 6,
  "traceability_level": "lot",
  "standard_batch_size": null,
  "min_batch_size": null,
  "max_batch_size": null,
  "expiry_calculation_method": "fixed_days",
  "processing_buffer_days": 0,
  "gs1_lot_encoding_enabled": false,
  "gs1_expiry_encoding_enabled": false,
  "gs1_sscc_enabled": false,
  "_isDefault": true
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```
- No valid JWT token provided
- Token expired or revoked

**403 Forbidden**
```json
{
  "error": "Forbidden"
}
```
- User lacks `technical.R` permission

**404 Not Found**
```json
{
  "error": "Product not found"
}
```
- Product doesn't exist
- Product belongs to different organization (returns 404, not 403 - security principle)

### Examples

#### cURL
```bash
curl -X GET \
  "https://api.monopilot.app/api/v1/technical/products/abc123/traceability-config" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### JavaScript/Fetch
```javascript
const productId = 'abc123de-f456-7890-abcd-ef1234567890';

const response = await fetch(
  `/api/v1/technical/products/${productId}/traceability-config`,
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Token automatically added by Next.js auth helpers
    }
  }
);

const config = await response.json();
if (response.ok) {
  console.log('Lot format:', config.lot_number_format);
} else {
  console.error('Error:', config.error);
}
```

#### React Hook
```typescript
import { useQuery } from '@tanstack/react-query';

function useTraceabilityConfig(productId: string) {
  return useQuery({
    queryKey: ['traceability-config', productId],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/technical/products/${productId}/traceability-config`
      );
      if (!response.ok) throw new Error('Failed to fetch config');
      return response.json();
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage
function ProductTraceabilityPanel({ productId }) {
  const { data: config, isLoading } = useTraceabilityConfig(productId);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <p>Lot Format: {config.lot_number_format}</p>
      <p>Traceability Level: {config.traceability_level}</p>
    </div>
  );
}
```

---

## PUT Traceability Config

Create or update traceability configuration for a product.

### Endpoint
```
PUT /api/v1/technical/products/:id/traceability-config
```

### Authentication
- **Required**: Yes (Bearer token)
- **Permission**: `technical.U` (Technical module update)
- **Roles**: Super Admin, Admin, Production Manager

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Product ID |

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body

All fields are optional (PATCH-like behavior for idempotent updates):

```json
{
  "lot_number_format": "LOT-{YYYY}-{SEQ:6}",
  "lot_number_prefix": "LOT-",
  "lot_number_sequence_length": 6,
  "traceability_level": "lot",
  "standard_batch_size": 1000,
  "min_batch_size": 500,
  "max_batch_size": 2000,
  "expiry_calculation_method": "fixed_days",
  "processing_buffer_days": 0,
  "gs1_lot_encoding_enabled": true,
  "gs1_expiry_encoding_enabled": true,
  "gs1_sscc_enabled": false
}
```

### Request Field Validation

| Field | Type | Rules | Notes |
|-------|------|-------|-------|
| lot_number_format | String | 5-50 chars, valid placeholders | Must contain at least one placeholder |
| lot_number_prefix | String | 1-20 chars | Optional prefix portion |
| lot_number_sequence_length | Number | Integer 4-10 | Padding for {SEQ:N} |
| traceability_level | String | Enum: lot \| batch \| serial | Default: "lot" |
| standard_batch_size | Number \| null | Positive or null | Must be >= min, <= max |
| min_batch_size | Number \| null | Positive or null | Must be <= standard, <= max |
| max_batch_size | Number \| null | Positive or null | Must be >= min, >= standard |
| expiry_calculation_method | String | Enum: fixed_days \| rolling \| manual | Default: "fixed_days" |
| processing_buffer_days | Number | Integer 0-365 | Required for "rolling" method |
| gs1_lot_encoding_enabled | Boolean | true \| false | Default: true |
| gs1_expiry_encoding_enabled | Boolean | true \| false | Default: true |
| gs1_sscc_enabled | Boolean | true \| false | Default: false |

### Validation Rules

1. **Lot Format**: Must be 5-50 characters with valid placeholders
   - Invalid: `{INVALID}`, `PLAIN_TEXT`, `{}`
   - Valid: `LOT-{YYYY}-{SEQ:6}`, `{PROD}-{YYMMDD}-{SEQ:4}`

2. **Batch Size Constraints**:
   - `min_batch_size <= max_batch_size` (both can be null)
   - `min_batch_size <= standard_batch_size <= max_batch_size`
   - Example: min=500, standard=1000, max=2000 ✓
   - Example: min=500, standard=600, max=400 ✗ (max < standard)

3. **Expiry Method**:
   - If `rolling`, `processing_buffer_days >= 0` is required
   - `fixed_days` and `manual` don't require buffer days

4. **Sequence Length**:
   - Must be integer between 4-10 (controls {SEQ:N} padding)
   - Example: length=6 produces "000001", length=4 produces "0001"

### Response

**Status**: 200 OK

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "product_id": "abc123de-f456-7890-abcd-ef1234567890",
  "lot_number_format": "LOT-{YYYY}-{SEQ:6}",
  "lot_number_prefix": "LOT-",
  "lot_number_sequence_length": 6,
  "traceability_level": "lot",
  "standard_batch_size": 1000,
  "min_batch_size": 500,
  "max_batch_size": 2000,
  "expiry_calculation_method": "fixed_days",
  "processing_buffer_days": 0,
  "gs1_lot_encoding_enabled": true,
  "gs1_expiry_encoding_enabled": true,
  "gs1_sscc_enabled": false,
  "created_at": "2025-12-20T10:30:00Z",
  "updated_at": "2025-12-20T14:45:00Z",
  "created_by": "user-123",
  "updated_by": "user-456"
}
```

### Error Responses

**400 Bad Request**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "lot_number_format",
      "message": "Invalid placeholder. Use {YYYY}, {SEQ:N}, etc."
    },
    {
      "field": "min_batch_size",
      "message": "Minimum batch size cannot exceed maximum"
    }
  ]
}
```

Common validation errors:
- Invalid lot format placeholder (e.g., `{INVALID}`)
- `min_batch_size > max_batch_size`
- `standard_batch_size` outside min/max range
- Invalid `traceability_level` value
- Invalid `expiry_calculation_method` value
- Sequence length not 4-10

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden"
}
```
- User lacks `technical.U` permission

**404 Not Found**
```json
{
  "error": "Product not found"
}
```
- Product doesn't exist or belongs to different organization

**500 Internal Server Error**
```json
{
  "error": "Failed to save configuration"
}
```

### Examples

#### cURL - Create Configuration
```bash
curl -X PUT \
  "https://api.monopilot.app/api/v1/technical/products/abc123/traceability-config" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lot_number_format": "LOT-{YYYY}-{SEQ:6}",
    "lot_number_prefix": "LOT-",
    "lot_number_sequence_length": 6,
    "traceability_level": "lot",
    "standard_batch_size": 1000,
    "min_batch_size": 500,
    "max_batch_size": 2000,
    "gs1_lot_encoding_enabled": true,
    "gs1_expiry_encoding_enabled": true
  }'
```

#### cURL - Update Specific Fields
```bash
curl -X PUT \
  "https://api.monopilot.app/api/v1/technical/products/abc123/traceability-config" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "traceability_level": "batch",
    "processing_buffer_days": 5
  }'
```

#### JavaScript/Fetch
```javascript
async function updateTraceabilityConfig(productId, config) {
  const response = await fetch(
    `/api/v1/technical/products/${productId}/traceability-config`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Save failed: ${error.details?.[0]?.message || error.error}`);
  }

  return response.json();
}

// Usage
try {
  const updated = await updateTraceabilityConfig('abc123', {
    lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
    traceability_level: 'lot'
  });
  console.log('Saved:', updated);
} catch (err) {
  console.error(err.message);
}
```

#### React Hook
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useUpdateTraceabilityConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, config }) => {
      const response = await fetch(
        `/api/v1/technical/products/${productId}/traceability-config`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details?.[0]?.message || error.error);
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch config
      queryClient.invalidateQueries({
        queryKey: ['traceability-config', variables.productId]
      });
    }
  });
}

// Usage
function TraceabilityConfigForm({ productId }) {
  const mutation = useUpdateTraceabilityConfig();
  const [format, setFormat] = useState('LOT-{YYYY}-{SEQ:6}');

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutation.mutate({
        productId,
        config: { lot_number_format: format }
      });
    }}>
      <input
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        placeholder="LOT-{YYYY}-{SEQ:6}"
      />
      <button disabled={mutation.isPending}>Save</button>
      {mutation.error && <p>{mutation.error.message}</p>}
      {mutation.isSuccess && <p>Saved!</p>}
    </form>
  );
}
```

---

## Implementation Details

### File Locations
- **API Route**: `/apps/frontend/app/api/v1/technical/products/[id]/traceability-config/route.ts`
- **Service**: `/apps/frontend/lib/services/traceability-config-service.ts`
- **Types**: `/apps/frontend/lib/types/traceability.ts`
- **Validation**: `/apps/frontend/lib/validation/traceability.ts`

### Database
- **Table**: `product_traceability_config`
- **Unique Constraint**: One config per product (product_id UNIQUE)
- **RLS Policy**: `org_id = (SELECT org_id FROM users WHERE id = auth.uid())`

### Security
- Multi-tenant isolation via RLS on all queries
- 404 returned for cross-tenant access (never 403)
- Role-based permissions: Admin/Super_Admin for all ops
- Audit trail: created_by, created_at, updated_by, updated_at

### Caching
- Service layer uses Supabase auth context for user org_id
- Recommended client-side cache: React Query with 5-minute stale time
- Updates invalidate cache automatically

---

## Common Integration Patterns

### Loading Default Config
```typescript
// If config doesn't exist, defaults are returned automatically
const config = await getProductTraceabilityConfig('product-123');
if (config._isDefault) {
  console.log('Using defaults for unconfigured product');
}
```

### Lot Format Preview
```typescript
import { generateSampleLotNumber } from '@/lib/services/traceability-config-service';

// Generate preview of lot format
const preview = generateSampleLotNumber(
  'LOT-{YYYY}-{SEQ:6}',
  'BRD', // product code
  'L01'  // line code
);
console.log(preview); // "LOT-2025-000001"
```

### Validation Before Save
```typescript
import { validateLotFormat } from '@/lib/services/traceability-config-service';

const validation = validateLotFormat('LOT-{YYYY}-{SEQ:6}');
if (!validation.valid) {
  console.error('Invalid format:', validation.errors);
  // Display errors to user
}
```

### GS1 Barcode Generation
See `/docs/5-DEVELOPER-GUIDES/gs1-barcode-encoding.md` for complete GS1 service examples.

---

## Related Documentation
- [GS1 Barcode Encoding Guide](/docs/5-DEVELOPER-GUIDES/gs1-barcode-encoding.md)
- [User Guide - Traceability Configuration](/docs/4-USER-GUIDES/traceability-configuration.md)
- [Story 02.10a Context](/docs/2-MANAGEMENT/epics/current/02-technical/context/02.10a/_index.yaml)
- [Story 02.10b - Traceability Queries (Planned for Epic 05)](/docs/2-MANAGEMENT/epics/current/02-technical/context/02.10b/_index.yaml)
