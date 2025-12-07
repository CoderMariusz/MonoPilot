# Code Review: Najczęstsze Błędy i Jak Ich Unikać

**Cel dokumentu:** Pomóc developerom uczyć się z błędów wykrytych podczas code review i poprawić jakość dostaw.

**Ostatnia aktualizacja:** 2025-11-21
**Autor:** Mariusz (Senior Developer Review Process)

---

## 📋 Spis Treści

1. [Story File - Błędy Proceduralne](#1-story-file---błędy-proceduralne)
2. [Brak Testów](#2-brak-testów)
3. [Niepełna Implementacja Acceptance Criteria](#3-niepełna-implementacja-acceptance-criteria)
4. [Status Inconsistency](#4-status-inconsistency)
5. [Brak Dokumentacji Zmian](#5-brak-dokumentacji-zmian)
6. [Checklist Przed Oznaczeniem Story Jako "Review"](#checklist-przed-oznaczeniem-story-jako-review)

---

## 1. Story File - Błędy Proceduralne

### ❌ BŁĄD: Story file nie aktualizowany po implementacji

**Objaw:**
- Wszystkie taski oznaczone jako `[ ]` (incomplete) mimo że kod został zaimplementowany
- Sekcja "File List" jest pusta
- Sekcja "Completion Notes" jest pusta
- Status w story file: "ready-for-dev" mimo że w sprint-status.yaml: "review"

**Wykryto w:** Story 1.0 (Authentication UI)

**Dlaczego to problem:**
- Sprint tracking jest zepsuty - nikt nie wie co zostało zrobione
- Następny developer nie może zaufać statusowi story
- Code reviewer musi ręcznie szukać wszystkich plików zamiast sprawdzić File List
- Brak Completion Notes = brak kontekstu o decyzjach implementacyjnych

**✅ JAK NAPRAWIĆ:**

1. **Zaznacz ukończone taski:**
   ```markdown
   ### Task 2: Zod Validation Schemas (AC: 000.1, 000.2, 000.4, 000.5)
   - [x] Create LoginSchema in `lib/validation/auth-schemas.ts`
   - [x] email: z.string().email("Invalid email format")
   - [x] password: z.string().min(8, "Password must be at least 8 characters")
   ```

2. **Wypełnij File List:**
   ```markdown
   ### File List

   **NEW:**
   - apps/frontend/app/login/page.tsx
   - apps/frontend/app/forgot-password/page.tsx
   - apps/frontend/app/reset-password/page.tsx
   - apps/frontend/app/auth/callback/route.ts
   - apps/frontend/components/auth/LoginForm.tsx
   - apps/frontend/components/auth/ForgotPasswordForm.tsx
   - apps/frontend/components/auth/ResetPasswordForm.tsx
   - apps/frontend/components/auth/PasswordStrength.tsx
   - apps/frontend/components/auth/UserMenu.tsx
   - apps/frontend/lib/auth/auth-client.ts
   - apps/frontend/lib/validation/auth-schemas.ts

   **MODIFIED:**
   - apps/frontend/middleware.ts (added public routes for auth pages)
   - apps/frontend/app/dashboard/page.tsx (added UserMenu)

   **DELETED:**
   - (none)
   ```

3. **Dodaj Completion Notes:**
   ```markdown
   ### Completion Notes List

   **Implementation Summary:**
   - Implemented complete auth flow: login, logout, forgot password, reset password
   - Used Supabase Auth for backend (email/password provider)
   - Form validation with React Hook Form + Zod schemas
   - Middleware route protection with automatic redirects
   - UserMenu component integrated into dashboard header

   **Key Technical Decisions:**
   - DECISION: Skipped Task 7 (Signup Page) - MonoPilot is invitation-only (Story 1.3)
   - DECISION: Remember Me extends session via Supabase Auth settings (not code-level)
   - DECISION: Password requirements: min 8 chars, 1 uppercase, 1 number
   - DECISION: Forgot password always shows success (security - don't reveal if email exists)

   **Known Limitations:**
   - TODO: Task 10 (Testing) deferred - will add tests in follow-up PR
   - TODO: Remember Me session extension needs Supabase dashboard configuration
   ```

4. **Zaktualizuj Status:**
   ```markdown
   Status: review  # (must match sprint-status.yaml)
   ```

5. **Dodaj Change Log entry:**
   ```markdown
   ## Change Log

   - 2025-11-20: Story created by Mariusz
   - 2025-11-21: Implementation completed - login/logout/forgot-password flows with Supabase Auth (commit: a9bbe9c)
   ```

**Kiedy aktualizować story file:**
- **ZAWSZE** przed oznaczeniem story jako "review" w sprint-status.yaml
- Po każdym ukończonym tasku (opcjonalnie - możesz robić batch update na koniec)
- Przed commitowaniem zmian

---

## 2. Brak Testów

### ❌ BŁĄD: Task 10 (Integration & Testing) całkowicie pominięty

**Objaw:**
- Brak jakichkolwiek plików testowych (`*.test.ts`, `*.spec.ts`, `e2e/*.spec.ts`)
- Developer oznacza story jako gotowe mimo że Task 10 wymaga testów

**Wykryto w:** Story 1.0 (Authentication UI) - 0% test coverage

**Dlaczego to problem:**
- Brak automatycznej weryfikacji auth flows
- Regresje mogą przejść niezauważone
- Każda zmiana wymaga manualnego testowania
- Zwiększa ryzyko błędów w produkcji

**✅ JAK NAPRAWIĆ:**

### Minimum Required Tests (per Task 10):

1. **Unit Tests (Vitest):**
   ```typescript
   // lib/validation/__tests__/auth-schemas.test.ts
   import { LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../auth-schemas'

   describe('LoginSchema', () => {
     it('accepts valid email and password', () => {
       const result = LoginSchema.safeParse({
         email: 'test@example.com',
         password: 'Password123',
         rememberMe: false,
       })
       expect(result.success).toBe(true)
     })

     it('rejects invalid email format', () => {
       const result = LoginSchema.safeParse({
         email: 'invalid-email',
         password: 'Password123',
       })
       expect(result.success).toBe(false)
       expect(result.error?.errors[0].message).toContain('Invalid email')
     })

     it('rejects password shorter than 8 characters', () => {
       const result = LoginSchema.safeParse({
         email: 'test@example.com',
         password: 'Pass1',
       })
       expect(result.success).toBe(false)
       expect(result.error?.errors[0].message).toContain('at least 8 characters')
     })
   })
   ```

2. **Integration Tests (Vitest):**
   ```typescript
   // app/auth/callback/__tests__/route.test.ts
   import { GET } from '../route'
   import { createServerSupabase } from '@/lib/supabase/server'

   jest.mock('@/lib/supabase/server')

   describe('Auth Callback Route', () => {
     it('exchanges code for session and redirects to dashboard', async () => {
       const mockSupabase = {
         auth: {
           exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }),
         },
       }
       ;(createServerSupabase as jest.Mock).mockResolvedValue(mockSupabase)

       const request = new Request('http://localhost:3000/auth/callback?code=test-code')
       const response = await GET(request)

       expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code')
       expect(response.status).toBe(307) // redirect
       expect(response.headers.get('Location')).toContain('/dashboard')
     })
   })
   ```

3. **E2E Tests (Playwright):**
   ```typescript
   // e2e/auth.spec.ts
   import { test, expect } from '@playwright/test'

   test.describe('Authentication Flows', () => {
     test('login flow - valid credentials', async ({ page }) => {
       await page.goto('/login')

       await page.fill('input[name="email"]', 'test@example.com')
       await page.fill('input[name="password"]', 'ValidPassword123')
       await page.click('button[type="submit"]')

       // Should redirect to dashboard
       await expect(page).toHaveURL(/\/dashboard/)
       await expect(page.getByText('Welcome to MonoPilot')).toBeVisible()
     })

     test('login flow - invalid credentials shows error', async ({ page }) => {
       await page.goto('/login')

       await page.fill('input[name="email"]', 'invalid@example.com')
       await page.fill('input[name="password"]', 'WrongPassword')
       await page.click('button[type="submit"]')

       // Should show error toast
       await expect(page.getByText(/Invalid email or password/i)).toBeVisible()
       // Should stay on login page
       await expect(page).toHaveURL(/\/login/)
     })

     test('forgot password flow', async ({ page }) => {
       await page.goto('/login')
       await page.click('a[href="/forgot-password"]')

       await page.fill('input[name="email"]', 'test@example.com')
       await page.click('button[type="submit"]')

       // Should show success message
       await expect(page.getByText(/Check your email/i)).toBeVisible()
     })
   })
   ```

**Kiedy pisać testy:**
- **PRZED** oznaczeniem story jako "review"
- Idealnie: TDD (Test-Driven Development) - testy przed kodem
- Minimum: testy po kodzie, ale przed PR

**Wyjątki (kiedy można odłożyć testy):**
- Prototyp / spike (jawnie oznaczony jako "bez testów")
- UX mockup bez backendu
- **NIGDY dla production code bez wyraźnej zgody SM**

---

## 3. Niepełna Implementacja Acceptance Criteria

### ❌ BŁĄD: AC częściowo zaimplementowane, ale oznaczone jako complete

**Objaw:**
- AC wymaga "Remember me extends session to 30 days"
- Kod ma checkbox "Remember me", ale nie robi nic z tym parametrem
- Developer oznacza AC jako ukończone

**Wykryto w:** Story 1.0, AC-000.1 (Remember Me functionality)

**Kod:**
```typescript
// lib/auth/auth-client.ts:19-34
export async function signIn(
  email: string,
  password: string,
  rememberMe?: boolean
): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { session: null, error: mapAuthError(error) }
  }

  // Note: "Remember me" session extension would be handled via Supabase Auth settings
  // For now, we return the standard session  // ❌ TODO comment = incomplete implementation

  return { session: data.session, error: null }
}
```

**Dlaczego to problem:**
- AC nie jest spełnione - funkcjonalność nie działa
- User klika "Remember me" i nic się nie dzieje
- Wprowadza w błąd - wygląda jakby działało, ale nie działa

**✅ JAK NAPRAWIĆ:**

1. **Zaimplementuj brakującą funkcjonalność:**
   ```typescript
   export async function signIn(
     email: string,
     password: string,
     rememberMe?: boolean
   ): Promise<AuthResult> {
     const supabase = createClient()

     const { data, error } = await supabase.auth.signInWithPassword({
       email,
       password,
       options: {
         // 30 days = 30 * 24 * 60 * 60 = 2,592,000 seconds
         maxAge: rememberMe ? 2592000 : 3600, // 30 days vs 1 hour
       },
     })

     // ... rest of the code
   }
   ```

2. **LUB: Zaktualizuj AC jeśli funkcjonalność nie jest możliwa:**
   - Skonsultuj z PM/SM
   - Zaktualizuj AC z nową specyfikacją
   - Dodaj justification w story notes

**Checklist przed oznaczeniem AC jako done:**
- [ ] Funkcjonalność działa zgodnie ze specyfikacją
- [ ] Wszystkie sub-punkty AC są zaimplementowane
- [ ] Brak TODO/FIXME comments w kodzie związanym z AC
- [ ] E2E test sprawdza AC end-to-end
- [ ] Manualnie przetestowałem AC w przeglądarce

---

## 4. Status Inconsistency

### ❌ BŁĄD: Status w story file ≠ status w sprint-status.yaml

**Objaw:**
```markdown
# Story file: docs/sprint-artifacts/1-0-authentication-ui.md
Status: ready-for-dev
```

```yaml
# Sprint status: docs/sprint-artifacts/sprint-status.yaml
1-0-authentication-ui: review
```

**Wykryto w:** Story 1.0 (Authentication UI)

**Dlaczego to problem:**
- Code reviewer nie wie który status jest prawdziwy
- Automaty CI/CD mogą źle interpretować status
- Sprint tracking dashboard pokazuje błędne dane

**✅ JAK NAPRAWIĆ:**

**ZASADA:** `sprint-status.yaml` jest źródłem prawdy (single source of truth)

1. **Zawsze aktualizuj oba pliki razem:**
   ```bash
   # 1. Update story file status
   vim docs/sprint-artifacts/1-0-authentication-ui.md
   # Change: Status: ready-for-dev → Status: review

   # 2. Update sprint-status.yaml
   vim docs/sprint-artifacts/sprint-status.yaml
   # Change: 1-0-authentication-ui: ready-for-dev → 1-0-authentication-ui: review

   # 3. Commit both changes together
   git add docs/sprint-artifacts/1-0-authentication-ui.md
   git add docs/sprint-artifacts/sprint-status.yaml
   git commit -m "feat(story-1.0): mark as ready for review"
   ```

2. **Workflow dla zmiany statusu:**
   ```
   ready-for-dev → in-progress → review → done

   ready-for-dev: Developer hasn't started yet
   in-progress: Developer is actively working
   review: Developer finished, ready for code review
   done: Code review passed, story completed
   ```

3. **Validation script (opcjonalnie):**
   ```bash
   #!/bin/bash
   # scripts/validate-story-status.sh

   STORY_FILE=$1
   STORY_KEY=$(basename "$STORY_FILE" .md)

   STORY_STATUS=$(grep "^Status:" "$STORY_FILE" | awk '{print $2}')
   SPRINT_STATUS=$(grep "$STORY_KEY:" docs/sprint-artifacts/sprint-status.yaml | awk '{print $2}')

   if [ "$STORY_STATUS" != "$SPRINT_STATUS" ]; then
     echo "❌ Status mismatch for $STORY_KEY:"
     echo "   Story file: $STORY_STATUS"
     echo "   Sprint status: $SPRINT_STATUS"
     exit 1
   fi

   echo "✅ Status consistent for $STORY_KEY: $STORY_STATUS"
   ```

---

## 5. Brak Dokumentacji Zmian

### ❌ BŁĄD: Change Log nie aktualizowany

**Objaw:**
```markdown
## Change Log

- 2025-11-20: Story created by Mariusz
```
(Brak wpisów o implementacji mimo że kod został dodany)

**Wykryto w:** Story 1.0 (Authentication UI)

**Dlaczego to problem:**
- Nikt nie wie kiedy story została zaimplementowana
- Nie można śledzić historii zmian
- Trudno znaleźć commit z implementacją

**✅ JAK NAPRAWIĆ:**

**Dodaj wpis do Change Log po każdej znaczącej zmianie:**

```markdown
## Change Log

- 2025-11-20: Story created by Mariusz (missing authentication UI in Epic 1)
- 2025-11-21: Implementation completed - login/logout/forgot-password flows with Supabase Auth (commit: a9bbe9c)
- 2025-11-21: Senior Developer Review notes appended
```

**Co dokumentować w Change Log:**
- Data story creation
- Data implementation completion (z commit hash)
- Data code review
- Data każdej poprawki po review
- Data merge do main branch

**Format:**
```
- YYYY-MM-DD: <Action> - <Optional details> (commit: <hash>)
```

**Przykłady:**
```markdown
- 2025-11-20: Story created by Mariusz
- 2025-11-21: Implementation started - added login page and auth utilities
- 2025-11-21: Implementation completed - all AC implemented (commit: a9bbe9c)
- 2025-11-21: Senior Developer Review - CHANGES REQUESTED (missing tests)
- 2025-11-22: Added unit tests and E2E tests (commit: b3cd2e1)
- 2025-11-22: Senior Developer Review - APPROVED
- 2025-11-22: Merged to main (PR #42)
```

---

## 6. Checklist Przed Oznaczeniem Story Jako "Review"

### ✅ COMPLETE CHECKLIST

Użyj tego checklist przed każdym:
```bash
git commit -m "feat(story-X.Y): mark as ready for review"
```

#### A. Story File - Procedural Requirements

- [ ] **Status:** Zaktualizowany w story file (musi być = "review")
- [ ] **Status:** Zaktualizowany w sprint-status.yaml (musi być = "review")
- [ ] **Tasks:** Wszystkie ukończone taski oznaczone jako `[x]`
- [ ] **Tasks:** Wszystkie nieukończone taski oznaczone jako `[ ]` z wyjaśnieniem dlaczego
- [ ] **File List:** Wypełniona sekcja "File List" z NEW/MODIFIED/DELETED
- [ ] **Completion Notes:** Wypełniona sekcja "Completion Notes" z summary + key decisions
- [ ] **Change Log:** Dodany wpis o implementacji z commit hash

#### B. Implementation - Technical Requirements

- [ ] **ACs:** WSZYSTKIE Acceptance Criteria w pełni zaimplementowane
- [ ] **ACs:** Brak TODO/FIXME comments w kodzie related to ACs
- [ ] **Code Quality:** Kod działa lokalnie (npm run dev / pnpm dev)
- [ ] **Code Quality:** Brak TypeScript errors (npm run type-check)
- [ ] **Code Quality:** Brak linter errors (npm run lint)
- [ ] **Tests:** Unit tests dla utilities/schemas (Task 10)
- [ ] **Tests:** Integration tests dla API routes (Task 10)
- [ ] **Tests:** E2E tests dla user flows (Task 10)
- [ ] **Tests:** Wszystkie testy przechodzą (npm run test)

#### C. Documentation

- [ ] **UX Design:** Jeśli Task 11 wymaga, UX docs są zaktualizowane
- [ ] **Code Comments:** Kompleksowa logika ma komentarze wyjaśniające "dlaczego"
- [ ] **API Docs:** Jeśli dodano nowe API endpoints, są udokumentowane

#### D. Manual Testing

- [ ] **Happy Path:** Przetestowałem główny flow manualnie
- [ ] **Error Cases:** Przetestowałem error cases (invalid input, network errors)
- [ ] **Edge Cases:** Przetestowałem edge cases wymienione w ACs
- [ ] **Responsive:** Przetestowałem na mobile (jeśli dotyczy)

#### E. Git & Commits

- [ ] **Commits:** Commit messages są opisowe (conventional commits format)
- [ ] **Branch:** Branch name matches story key (e.g., `feature/1-0-authentication-ui`)
- [ ] **No Debug Code:** Usunąłem console.log() i debug code
- [ ] **No Secrets:** Brak hardcoded secrets (API keys, passwords)

---

## 📊 Statystyki Błędów (Story 1.0)

| Kategoria | Wykryte Błędy | Severity |
|-----------|---------------|----------|
| Story File Not Updated | 1 (all tasks `[ ]`) | 🔴 HIGH |
| Missing Tests (Task 10) | 1 (0% coverage) | 🔴 HIGH |
| Incomplete AC (Remember Me) | 1 | 🟡 MEDIUM |
| Status Inconsistency | 1 (file vs yaml) | 🟡 MEDIUM |
| Change Log Missing | 1 | 🟢 LOW |

**Total:** 5 findings (2 HIGH, 2 MEDIUM, 1 LOW)

---

## 🎯 Lekcje Wyciągnięte

### Story 1.0 (Authentication UI)

**Co poszło dobrze:**
- ✅ Implementacja kodu jest excellent quality
- ✅ Właściwe użycie Supabase Auth best practices
- ✅ Czytelna architektura (pages → components → lib)
- ✅ Validation z Zod + React Hook Form
- ✅ UX design dokumentacja istnieje

**Co można poprawić:**
- ❌ **ZAWSZE aktualizuj story file po implementacji**
- ❌ **NIGDY nie pomijaj Task 10 (Testing)** - testy są MANDATORY
- ❌ **Sprawdź status consistency** przed commit
- ❌ **Nie zostawiaj TODO comments w AC-critical code** - finish implementation or update AC

**Action Items dla następnych stories:**
1. Dodaj pre-commit hook sprawdzający status consistency
2. Dodaj CI check dla test coverage (minimum 70%)
3. Stwórz template checklist w każdym story file
4. Code review wymaga test evidence przed approval

---

## 📚 Dodatkowe Zasoby

- [BMM Workflow Documentation](../.bmad/bmm/README.md)
- [Code Review Checklist](../.bmad/bmm/workflows/4-implementation/code-review/checklist.md)
- [Sprint Status YAML Schema](./sprint-artifacts/sprint-status-schema.md)
- [Testing Strategy Guide](./test-design-system.md)

---

**Feedback Mile Widziany!**

Jeśli znajdziesz inne częste błędy podczas code review, dodaj je do tego dokumentu:

```bash
git add docs/code-review-common-errors-guide.md
git commit -m "docs: add new common error pattern to review guide"
```

---

_Ten dokument jest living document - aktualizowany po każdym code review z nowymi findings._
