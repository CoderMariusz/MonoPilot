# NAMING-CONVENTIONS

> **Version:** 1.0
> **Updated:** 2025-12-10

---

## Overview

Hierarchical naming convention for epics, stories, subtasks, and test files. Provides clear visibility into project structure and relationships between artifacts.

## Pattern

```
{XX}.{N}.{M}.{slug}
```

| Component | Description | Example |
|-----------|-------------|---------|
| `XX` | Epic number (2 digits, zero-padded) | `01`, `02`, `03` |
| `N` | Story number within epic | `1`, `2`, `3` |
| `M` | Subtask number within story (optional) | `1`, `2`, `3` |
| `slug` | Short kebab-case description | `db-schema`, `login-endpoint` |

### Special Values

| Pattern | Meaning |
|---------|---------|
| `XX.0.*` | Epic-level documents (overview, clarifications, test-strategy) |
| `XX.N.*` | Story-level documents |
| `XX.N.M.*` | Subtask-level documents |

---

## Documentation Structure

```
docs/2-MANAGEMENT/epics/
├── epic-catalog.md                      # Index of all epics
├── dependency-graph.md                  # Epic dependencies
│
├── 01-user-auth/                        # Epic 01 folder
│   ├── 01.0.epic-overview.md            # Epic overview
│   ├── 01.0.clarifications.md           # Business logic clarifications
│   ├── 01.0.test-strategy.md            # Test strategy (from TEST-ENGINEER)
│   │
│   ├── 01.1.db-schema-setup.md          # Story 1
│   ├── 01.2.login-endpoint.md           # Story 2
│   ├── 01.2.1.input-validation.md       # Story 2, Subtask 1
│   ├── 01.2.2.error-handling.md         # Story 2, Subtask 2
│   ├── 01.3.ux-login-form.md            # Story 3
│   └── 01.4.session-management.md       # Story 4
│
├── 02-supplier-mgmt/                    # Epic 02 folder
│   ├── 02.0.epic-overview.md
│   ├── 02.0.clarifications.md
│   ├── 02.0.test-strategy.md
│   │
│   ├── 02.1.supplier-model.md           # Story 1
│   ├── 02.2.supplier-crud-api.md        # Story 2
│   └── 02.3.supplier-list-ui.md         # Story 3
│
└── 03-inventory/                        # Epic 03 folder
    ├── 03.0.epic-overview.md
    └── ...
```

---

## Test File Structure

Tests mirror the documentation structure:

```
tests/
├── 01-user-auth/                        # Epic 01 tests
│   ├── 01.0.user-auth.e2e.test.ts       # E2E tests (epic level)
│   │
│   ├── 01.1.db-schema-setup.test.ts     # Unit tests for Story 1
│   ├── 01.2.login-endpoint.test.ts      # Unit tests for Story 2
│   ├── 01.2.login-endpoint.integration.test.ts  # Integration tests
│   └── 01.3.ux-login-form.test.ts       # Unit tests for Story 3
│
├── 02-supplier-mgmt/                    # Epic 02 tests
│   ├── 02.0.supplier-mgmt.e2e.test.ts
│   ├── 02.1.supplier-model.test.ts
│   └── 02.2.supplier-crud-api.test.ts
│
└── fixtures/                            # Shared test fixtures
    ├── 01-user-auth.fixtures.ts
    └── 02-supplier-mgmt.fixtures.ts
```

---

## File Naming Patterns

### Documentation Files

| Type | Pattern | Example |
|------|---------|---------|
| Epic folder | `{XX}-{epic-slug}/` | `01-user-auth/` |
| Epic overview | `{XX}.0.epic-overview.md` | `01.0.epic-overview.md` |
| Clarifications | `{XX}.0.clarifications.md` | `01.0.clarifications.md` |
| Test strategy | `{XX}.0.test-strategy.md` | `01.0.test-strategy.md` |
| Story | `{XX}.{N}.{story-slug}.md` | `01.2.login-endpoint.md` |
| Subtask | `{XX}.{N}.{M}.{subtask-slug}.md` | `01.2.1.input-validation.md` |

### Test Files

| Type | Pattern | Example |
|------|---------|---------|
| Test folder | `tests/{XX}-{epic-slug}/` | `tests/01-user-auth/` |
| Unit test | `{XX}.{N}.{story-slug}.test.ts` | `01.2.login-endpoint.test.ts` |
| Integration | `{XX}.{N}.{story-slug}.integration.test.ts` | `01.2.login-endpoint.integration.test.ts` |
| E2E | `{XX}.0.{epic-slug}.e2e.test.ts` | `01.0.user-auth.e2e.test.ts` |
| Fixtures | `{XX}-{epic-slug}.fixtures.ts` | `01-user-auth.fixtures.ts` |

---

## Test Function Naming

```typescript
// Pattern: describe('{XX}_{N}_{feature}', () => { it('should_{action}_{expected}') })

describe('01_2_LoginEndpoint', () => {
  describe('POST /auth/login', () => {
    it('should_return_token_when_credentials_valid', () => {
      // ...
    });

    it('should_reject_when_password_incorrect', () => {
      // ...
    });

    it('should_reject_when_user_not_found', () => {
      // ...
    });
  });
});
```

---

## Slug Guidelines

### Do's
- Use lowercase letters
- Use hyphens for spaces
- Keep short but descriptive (2-4 words)
- Be specific about what the file contains

### Don'ts
- No underscores (use hyphens)
- No camelCase in file names
- No abbreviations that aren't obvious
- No version numbers in slug

### Examples

| Good | Bad |
|------|-----|
| `login-endpoint` | `loginEndpoint` |
| `db-schema-setup` | `database_schema` |
| `ux-login-form` | `ux_login_form_v2` |
| `supplier-crud-api` | `sup-api` |
| `input-validation` | `inputVal` |

---

## Cross-Reference Format

When referencing other files in documentation:

```markdown
## Related
- Epic: [01.0.epic-overview](./01.0.epic-overview.md)
- Parent Story: [01.2.login-endpoint](./01.2.login-endpoint.md)
- Subtasks:
  - [01.2.1.input-validation](./01.2.1.input-validation.md)
  - [01.2.2.error-handling](./01.2.2.error-handling.md)
- Tests: [01.2.login-endpoint.test.ts](../../tests/01-user-auth/01.2.login-endpoint.test.ts)
```

---

## Quick Reference

```
EPIC LEVEL (XX.0.*)
├── {XX}.0.epic-overview.md       # What this epic delivers
├── {XX}.0.clarifications.md      # Business logic Q&A
└── {XX}.0.test-strategy.md       # How to test this epic

STORY LEVEL (XX.N.*)
├── {XX}.{N}.{slug}.md            # Story definition
└── {XX}.{N}.{slug}.test.ts       # Story tests

SUBTASK LEVEL (XX.N.M.*)
└── {XX}.{N}.{M}.{slug}.md        # Subtask definition
```

---

## Migration from Old Format

If you have existing files in old format:

| Old Format | New Format |
|------------|------------|
| `epic-01-stories.md` | `01-user-auth/01.0.epic-overview.md` |
| `epic-01-clarifications.md` | `01-user-auth/01.0.clarifications.md` |
| `test-strategy-epic-01.md` | `01-user-auth/01.0.test-strategy.md` |
| `story-1.1.md` | `01.1.{story-slug}.md` |

---

**NAMING-CONVENTIONS Version:** 1.0
**Created:** 2025-12-10
**Maintained by:** Agent Methodology Pack
