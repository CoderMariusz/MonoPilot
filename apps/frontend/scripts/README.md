# Scripts Documentation

## Overview

This directory contains utility scripts for database management, testing, and documentation generation.

## Documentation Scripts

### `update-docs.ts`

Automatically generates/updates documentation files from source code:
- Parses SQL migrations → `docs/DATABASE_SCHEMA.md`
- Parses TypeScript API files → `docs/API_REFERENCE.md`
- Extracts foreign key relationships → `docs/DATABASE_RELATIONSHIPS.md`

**Usage**:
```bash
pnpm docs:update
```

**Features**:
- ✅ Automatic backup creation (with timestamp)
- ✅ Parse CREATE TABLE statements from migrations
- ✅ Parse CREATE INDEX statements
- ✅ Extract foreign key relationships
- ✅ Parse TypeScript API classes and methods
- ✅ Extract JSDoc comments
- ✅ Generate formatted Markdown tables
- ✅ Collapsible SQL definitions

**Output Files**:
- `docs/DATABASE_SCHEMA.md` - Complete database schema with tables, columns, constraints
- `docs/API_REFERENCE.md` - API classes with method signatures and parameters
- `docs/DATABASE_RELATIONSHIPS.md` - Entity relationship mapping

**How It Works**:

1. **SQL Parser Module**
   - Reads all `.sql` files from `apps/frontend/lib/supabase/migrations/`
   - Uses regex to parse CREATE TABLE statements
   - Extracts columns, types, constraints, foreign keys
   - Parses CREATE INDEX statements
   
2. **TypeScript API Parser Module**
   - Reads all `.ts` files from `apps/frontend/lib/api/`
   - Matches class definitions (e.g., `WorkOrdersAPI`)
   - Extracts static async methods with parameters and return types
   - Attempts to extract JSDoc comments
   
3. **Markdown Generator Module**
   - Formats parsed data into Markdown tables
   - Creates collapsible sections for SQL definitions
   - Generates cross-references between tables
   - Adds timestamps and version information
   
4. **File Operations Module**
   - Creates timestamped backups before overwriting
   - Writes new documentation files
   - Reports success/failure

**Example Output**:

```markdown
### work_orders

**Columns**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| wo_number | VARCHAR(50) | UNIQUE, NOT NULL |
| product_id | INTEGER | REFERENCES products(id) |

**Foreign Keys**:

- `product_id` → `products.id`

<details>
<summary>SQL Definition</summary>

\`\`\`sql
CREATE TABLE work_orders (
  id SERIAL PRIMARY KEY,
  wo_number VARCHAR(50) UNIQUE NOT NULL,
  ...
);
\`\`\`

</details>
```

**Future Enhancements**:
- [ ] Parse TypeScript types from `packages/shared/types.ts`
- [ ] Generate ER diagrams (Mermaid/PlantUML)
- [ ] Extract business rules from comments
- [ ] Generate API usage examples
- [ ] Detect schema changes and highlight differences
- [ ] Integration with pre-commit hooks

## Database Scripts

### `seed-test-users.ts`
Seeds test users for authentication testing.

### `test-database-connection.js`
Tests database connectivity and schema.

### `apply-migrations.js`
Applies SQL migrations to database.

### `check-database.js`
Validates database schema and integrity.

## Test Scripts

### `generate-test-report.ts`
Generates test coverage reports.

### `generate-all-reports.ts`
Generates comprehensive test reports.

## MCP Scripts

### `mcp/supabase-mcp.js`
Supabase Model Context Protocol integration.

---

**Note**: For scripts that modify the database, always ensure you have a backup before running them in production.

