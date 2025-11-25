---
id: NNN
title: <TITLE>
module: <MODULE>
priority: <P0|P1|P2>
owner: @mariusz
status: draft
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags: [auto, rls-on, next15, supabase, filament-style]
---

# <TITLE>

## Brief

<Dokładnie 5 zdań opisujących zadanie - wprowadź z INPUT>

## Constraints

**Domyślne dla repo:**
- RLS ON dla wszystkich tabel i operacji
- UI w stylu Filament (Create/Edit/List, Columns, Filters)
- Plan bez kodu - tylko kroki, kontrakty, testy, DoD
- Conventional Commits w PR
- Realne ścieżki plików

**Specyficzne dla zadania:**
<Dodatkowe constraints z INPUT>

## Notes

<Dodatkowe uwagi z INPUT - jeśli podane>

## Impact Analysis

**Zmienione komponenty:**
- Frontend: <lista komponentów>
- API: <lista endpointów>
- Database: <lista tabel>

**Dotknięte moduły:**
- <lista modułów>

**Estimated effort:** <X dni>

## File Plan

### Frontend
```
apps/frontend/
├── app/
│   └── <module>/
│       └── page.tsx (modify)
├── components/
│   ├── <Component>Table.tsx (create/modify)
│   └── <Component>Modal.tsx (create/modify)
└── lib/
    ├── api/<resource>.ts (create/modify)
    └── types.ts (modify)
```

### Backend/API
```
apps/frontend/lib/
├── api/
│   └── <resource>.ts (create/modify)
└── supabase/
    └── migrations/
        └── NNN_<description>.sql (create)
```

## DB & RLS

### Migration UP
```sql
-- Dodaj zmiany schematu (jeśli wymagane)
CREATE TABLE IF NOT EXISTS <table_name> (
  id SERIAL PRIMARY KEY,
  -- pola
);

-- Włącz RLS
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
```

### Migration DOWN
```sql
-- Cofnij zmiany
DROP TABLE IF EXISTS <table_name> CASCADE;
```

### RLS Policies
```sql
-- Read policy
CREATE POLICY "users_read_<resource>" ON <table_name>
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Write policy
CREATE POLICY "users_write_<resource>" ON <table_name>
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Update policy
CREATE POLICY "users_update_<resource>" ON <table_name>
  FOR UPDATE
  USING (auth.role() = 'authenticated');
```

## Contracts

### TypeScript Interfaces
```typescript
export interface <Resource> {
  id: number;
  <field>: <type>;
  created_at: string;
  updated_at: string;
}

export interface Create<Resource>DTO {
  <field>: <type>;
}

export interface Update<Resource>DTO {
  <field>?: <type>;
}
```

### API Endpoints
```typescript
// GET /<resource>
// Response: <Resource>[]

// GET /<resource>/:id
// Response: <Resource>

// POST /<resource>
// Body: Create<Resource>DTO
// Response: <Resource>

// PUT /<resource>/:id
// Body: Update<Resource>DTO
// Response: <Resource>

// DELETE /<resource>/:id
// Response: void
```

### Enums (jeśli wymagane)
```typescript
export enum <EnumName> {
  VALUE1 = 'value1',
  VALUE2 = 'value2',
}
```

## Algorithm / Flow

### Main Flow
1. <Krok 1 - opis>
2. <Krok 2 - opis>
3. <Krok 3 - opis>

### Edge Cases
- **Case 1:** <opis przypadku brzegowego>
  - Oczekiwane zachowanie: <opis>
- **Case 2:** <opis przypadku brzegowego>
  - Oczekiwane zachowanie: <opis>

### Validation Rules
- <Field>: <reguła walidacji>
- <Field>: <reguła walidacji>

## Tests First

### Unit Tests
```typescript
describe('<Resource>API', () => {
  test('should create <resource>', async () => {
    // Arrange
    const data = { ... };
    
    // Act
    const result = await <Resource>API.create(data);
    
    // Assert
    expect(result).toHaveProperty('id');
  });
  
  test('should validate required fields', async () => {
    // Test validation
  });
});
```

### Integration Tests
```typescript
describe('<Resource> Integration', () => {
  test('should handle full CRUD cycle', async () => {
    // Create -> Read -> Update -> Delete
  });
  
  test('should respect RLS policies', async () => {
    // Test RLS enforcement
  });
});
```

### UI Tests (Playwright/Cypress)
```typescript
test('<Resource> - create flow', async ({ page }) => {
  // Navigate to page
  // Fill form
  // Submit
  // Verify success
});
```

### Edge Case Tests
- Test z pustymi wartościami
- Test z maksymalnymi wartościami
- Test z duplikatami (jeśli unique)
- Test współbieżności (concurrent updates)
- Test uprawnień RLS

## DoD (Definition of Done)

- [ ] Wszystkie testy przechodzą (unit + integration + UI)
- [ ] TypeScript kompiluje się bez błędów (`tsc --noEmit`)
- [ ] Linter przechodzi bez błędów (`npm run lint`)
- [ ] RLS policies działają i są przetestowane
- [ ] UI jest w stylu Filament (spójny z resztą aplikacji)
- [ ] Wszystkie edge cases są obsłużone
- [ ] Commits używają Conventional Commits
- [ ] Migracje mają sekcje UP i DOWN
- [ ] API ma proper error handling
- [ ] Loading states są zaimplementowane
- [ ] Toast notifications dla akcji użytkownika
- [ ] Dokumentacja jest zaktualizowana (jeśli wymagane)

## Risks & Notes

### Risks
- **Risk 1:** <opis ryzyka>
  - Mitigation: <jak zminimalizować>
- **Risk 2:** <opis ryzyka>
  - Mitigation: <jak zminimalizować>

### Technical Debt
- <Opcjonalne: znane ograniczenia lub długi techniczny>

### Future Improvements
- <Opcjonalne: co można poprawić w przyszłości>

## Links

- Related Issue: #<number>
- Related Plan: `docs/plan/<NNN>--<module>--<slug>--pX.md`
- Design: <link do designu jeśli istnieje>
- API Docs: `docs/API_REFERENCE.md`
- Database Schema: `docs/DATABASE_SCHEMA.md`

