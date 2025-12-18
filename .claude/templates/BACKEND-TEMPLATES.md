# Backend Templates

## API Endpoint Documentation Template

```markdown
# API: {Endpoint Name}

## Endpoint Info
- **Method:** GET / POST / PUT / PATCH / DELETE
- **Path:** `/api/v1/{resource}`
- **Auth:** Required / Public
- **Rate Limit:** {limit} requests/minute

## Request

### Headers
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer {token} |
| Content-Type | Yes | application/json |

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| {param} | string | Yes | {description} |

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| {param} | string | No | {default} | {description} |

### Request Body
```json
{
  "field1": "string",
  "field2": 123,
  "nested": {
    "field3": true
  }
}
```

### Validation Rules
| Field | Rules |
|-------|-------|
| field1 | required, string, max:255 |
| field2 | required, integer, min:0 |

## Response

### Success Response (200/201)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "field1": "value",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {"field": "field1", "message": "Field is required"}
    ]
  }
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Examples

### cURL
```bash
curl -X POST https://api.example.com/api/v1/resource \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"field1": "value", "field2": 123}'
```

### JavaScript (fetch)
```javascript
const response = await fetch('https://api.example.com/api/v1/resource', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ field1: 'value', field2: 123 })
});
```
```

---

## Database Migration Template

```markdown
# Migration: {Migration Name}

## Migration Info
- **ID:** {timestamp}_{name}
- **Type:** Create / Alter / Drop / Data
- **Table(s):** {table names}
- **Reversible:** Yes / No

## Up Migration

```sql
-- Create table
CREATE TABLE {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business fields
  {column_name} {data_type} {constraints},

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Soft delete (optional)
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_{table}_{column} ON {table_name}({column});

-- Foreign keys
ALTER TABLE {table_name}
  ADD CONSTRAINT fk_{table}_{ref}
  FOREIGN KEY ({column}) REFERENCES {ref_table}(id);

-- RLS policies (if using Supabase/Postgres RLS)
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{policy_name}" ON {table_name}
  FOR {SELECT|INSERT|UPDATE|DELETE}
  USING ({condition});
```

## Down Migration

```sql
-- Drop in reverse order
DROP POLICY IF EXISTS "{policy_name}" ON {table_name};
DROP TABLE IF EXISTS {table_name};
```

## Data Migration (if needed)

```sql
-- Migrate existing data
INSERT INTO {new_table} (columns)
SELECT columns FROM {old_table};
```

## Verification

```sql
-- Verify migration succeeded
SELECT COUNT(*) FROM {table_name};
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = '{table_name}';
```

## Rollback Instructions

1. Run down migration
2. Verify data integrity
3. Update application code
```

---

## Service/Repository Pattern Template

```markdown
# Service: {ServiceName}

## Responsibility
{What this service does - one sentence}

## Dependencies
| Dependency | Type | Purpose |
|------------|------|---------|
| {Repository} | Repository | Data access |
| {ExternalService} | External | {purpose} |

## Public Methods

### {methodName}

**Signature:**
```typescript
async {methodName}(params: {ParamsType}): Promise<{ReturnType}>
```

**Purpose:** {what it does}

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| {param} | {type} | Yes/No | {description} |

**Returns:** {description of return value}

**Throws:**
| Error | Condition |
|-------|-----------|
| {ErrorType} | {when thrown} |

**Example:**
```typescript
const result = await service.{methodName}({
  param1: 'value'
});
```

## Error Handling

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| {CODE} | {status} | {description} |

## Business Rules

1. {Rule 1}
2. {Rule 2}
3. {Rule 3}
```

---

## Error Codes Template

```markdown
# Error Codes: {Feature/Module}

## Error Code Format
`{MODULE}_{CATEGORY}_{SPECIFIC}`

Example: `USER_VALIDATION_EMAIL_INVALID`

## Error Categories

### Validation Errors (4xx)
| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| {MODULE}_VALIDATION_{FIELD} | 400 | {message} | {how to fix} |

### Authentication Errors (401)
| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| AUTH_TOKEN_INVALID | 401 | Invalid token | Refresh token |
| AUTH_TOKEN_EXPIRED | 401 | Token expired | Re-authenticate |

### Authorization Errors (403)
| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| AUTH_FORBIDDEN | 403 | Access denied | Check permissions |

### Not Found Errors (404)
| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| {MODULE}_NOT_FOUND | 404 | {Resource} not found | Verify ID exists |

### Conflict Errors (409)
| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| {MODULE}_DUPLICATE | 409 | {Resource} already exists | Use different value |

### Server Errors (5xx)
| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| INTERNAL_ERROR | 500 | Unexpected error | Contact support |
| SERVICE_UNAVAILABLE | 503 | Service down | Retry later |
```

---

## Backend Code Patterns

### Repository Pattern
```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter: FilterType): Promise<T[]>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
}

class EntityRepository implements Repository<Entity> {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Entity | null> {
    return this.db.entity.findUnique({ where: { id } });
  }

  async findMany(filter: FilterType): Promise<Entity[]> {
    return this.db.entity.findMany({ where: filter });
  }

  async create(data: CreateDTO): Promise<Entity> {
    return this.db.entity.create({ data });
  }

  async update(id: string, data: UpdateDTO): Promise<Entity> {
    return this.db.entity.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.entity.delete({ where: { id } });
  }
}
```

### Service Layer Pattern
```typescript
class EntityService {
  constructor(
    private repository: EntityRepository,
    private validator: EntityValidator,
    private eventBus: EventBus
  ) {}

  async createEntity(dto: CreateDTO): Promise<Entity> {
    // 1. Validate
    const validationResult = this.validator.validate(dto);
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }

    // 2. Business logic
    const entity = await this.repository.create(dto);

    // 3. Side effects
    await this.eventBus.publish(new EntityCreatedEvent(entity));

    return entity;
  }
}
```

### Error Handling Pattern
```typescript
// Custom error class
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }

  static validation(field: string, message: string): AppError {
    return new AppError(
      `VALIDATION_${field.toUpperCase()}`,
      message,
      400
    );
  }

  static notFound(resource: string): AppError {
    return new AppError(
      `${resource.toUpperCase()}_NOT_FOUND`,
      `${resource} not found`,
      404
    );
  }
}

// Error handler middleware
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}
```

### Input Validation Pattern
```typescript
// Validation schema
const createEntitySchema = {
  field1: {
    type: 'string',
    required: true,
    maxLength: 255
  },
  field2: {
    type: 'number',
    required: true,
    min: 0,
    max: 1000
  }
};

// Validation function
function validate<T>(data: unknown, schema: Schema): ValidationResult<T> {
  const errors: ValidationError[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    if (rules.required && !value) {
      errors.push({ field, message: `${field} is required` });
      continue;
    }

    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push({ field, message: `${field} must be a string` });
    }

    if (rules.maxLength && value?.length > rules.maxLength) {
      errors.push({ field, message: `${field} exceeds max length` });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data as T : undefined
  };
}
```

### Transaction Pattern
```typescript
async function performTransaction<T>(
  db: Database,
  operation: (tx: Transaction) => Promise<T>
): Promise<T> {
  const tx = await db.beginTransaction();

  try {
    const result = await operation(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

// Usage
const result = await performTransaction(db, async (tx) => {
  const entity1 = await tx.entity1.create({ data: data1 });
  const entity2 = await tx.entity2.create({ data: { ...data2, entity1Id: entity1.id } });
  return { entity1, entity2 };
});
```

### Logging Pattern
```typescript
const logger = {
  info: (message: string, context?: object) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      ...context,
      timestamp: new Date().toISOString()
    }));
  },

  error: (message: string, error?: Error, context?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
      ...context,
      timestamp: new Date().toISOString()
    }));
  },

  warn: (message: string, context?: object) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      ...context,
      timestamp: new Date().toISOString()
    }));
  }
};
```
