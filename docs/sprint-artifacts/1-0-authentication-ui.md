# Story 1.0: Authentication UI

Status: backlog

## Story

As a **User**,
I want to log in, log out, and reset my password,
so that I can securely access the MonoPilot system.

## Acceptance Criteria

### FR-SET-000: Authentication UI

**AC-000.1**: Login page functionality:
- Email + password form at `/login`
- "Remember me" checkbox (extends session to 30 days)
- "Forgot password?" link
- Client-side validation (email format, password min 8 chars)
- Error messages for invalid credentials
- Redirect to main dashboard on success
- Redirect to `/login?redirect={original_url}` for protected routes

**AC-000.2**: Forgot password flow:
- Page at `/forgot-password` with email input
- Sends password reset email via Supabase Auth
- Success message: "Check your email for reset link"
- Email contains magic link to `/reset-password?token={token}`
- Reset password page with: new password + confirm password fields
- Password strength indicator (weak/medium/strong)
- Validation: min 8 chars, 1 uppercase, 1 number

**AC-000.3**: Logout functionality:
- Logout button in user menu (top-right dropdown)
- Clears session and redirects to `/login`
- Optional: "Logout from all devices" (terminates all sessions via API)

**AC-000.4**: Signup flow (OPTIONAL - depends on invitation-only vs public signup):
- If public signup enabled: `/signup` page with email, password, name
- If invitation-only: `/signup?token={invitation_token}` pre-fills email
- On successful signup → redirect to Settings Wizard (Story 1.12) if Admin
- On successful signup → redirect to Main Dashboard if non-Admin

**AC-000.5**: UX/UI requirements:
- Centered card layout (max-w-md) on gradient background
- MonoPilot logo at top
- Shadcn/UI Form components (Input, Button, Card)
- Loading states during auth operations
- Toast notifications for errors/success
- Responsive design (mobile-friendly)

**Additional Acceptance Criteria:**

**Given** the user is not authenticated
**When** they navigate to any protected route (e.g., `/settings/organization`)
**Then** they are redirected to `/login?redirect=/settings/organization`
**And** after successful login, redirected back to original URL

**Given** the user enters invalid credentials
**When** they submit the login form
**Then** an error toast is shown: "Invalid email or password"
**And** password field is cleared

**Given** the user clicks "Forgot password?"
**When** they enter their email and submit
**Then** a password reset email is sent via Supabase
**And** success message shown (even if email doesn't exist - security)

## Tasks / Subtasks

### Task 1: Supabase Auth Configuration (AC: 000.1, 000.2, 000.3, 000.4)
- [ ] Configure Supabase Auth settings in dashboard:
  - [ ] Enable email/password authentication
  - [ ] Configure email templates (password reset, invitation)
  - [ ] Set session duration: 1 hour (default), 30 days (remember me)
  - [ ] Enable email confirmations (optional for MVP)
- [ ] Test Supabase Auth magic links and password reset flow
- [ ] Configure redirect URLs: `http://localhost:3000/auth/callback`, production URL

### Task 2: Zod Validation Schemas (AC: 000.1, 000.2, 000.4, 000.5)
- [ ] Create LoginSchema in `lib/validation/auth-schemas.ts`:
  - [ ] email: z.string().email("Invalid email format")
  - [ ] password: z.string().min(8, "Password must be at least 8 characters")
  - [ ] rememberMe: z.boolean().optional()
- [ ] Create ForgotPasswordSchema:
  - [ ] email: z.string().email("Invalid email format")
- [ ] Create ResetPasswordSchema:
  - [ ] password: z.string().min(8).regex(/[A-Z]/, "Must contain uppercase").regex(/[0-9]/, "Must contain number")
  - [ ] confirmPassword: z.string()
  - [ ] Refinement: password === confirmPassword
- [ ] Create SignupSchema (if public signup enabled):
  - [ ] email: z.string().email()
  - [ ] password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)
  - [ ] firstName: z.string().min(1, "First name required")
  - [ ] lastName: z.string().min(1, "Last name required")

### Task 3: Auth API Utilities (AC: 000.1, 000.2, 000.3, 000.4)
- [ ] Create `lib/auth/auth-client.ts` with methods:
  - [ ] `signIn(email, password, rememberMe)` - calls Supabase Auth
  - [ ] `signOut()` - clears session, redirects to /login
  - [ ] `signOutAllDevices()` - calls API to terminate all sessions
  - [ ] `resetPassword(email)` - sends reset email
  - [ ] `updatePassword(token, newPassword)` - updates password with token
  - [ ] `signUp(email, password, firstName, lastName)` - creates user (optional)
- [ ] Error handling: map Supabase errors to user-friendly messages
- [ ] Success callbacks: redirect logic after auth actions

### Task 4: Login Page UI (AC: 000.1, 000.5)
- [ ] Create `/app/login/page.tsx` with:
  - [ ] Centered card (shadcn/ui Card component)
  - [ ] MonoPilot logo at top
  - [ ] LoginForm component (react-hook-form + Zod)
  - [ ] Email input, password input (with show/hide toggle)
  - [ ] "Remember me" checkbox
  - [ ] "Forgot password?" link
  - [ ] Submit button with loading state
  - [ ] Error toast for failed login
- [ ] Extract URL params: `?redirect=` for post-login navigation
- [ ] Gradient background: `bg-gradient-to-br from-blue-50 to-indigo-100`

### Task 5: Forgot Password & Reset Password Pages (AC: 000.2, 000.5)
- [ ] Create `/app/forgot-password/page.tsx`:
  - [ ] Email input with validation
  - [ ] Submit button → calls `resetPassword(email)`
  - [ ] Success message (toast + on-page text)
  - [ ] "Back to login" link
- [ ] Create `/app/reset-password/page.tsx`:
  - [ ] Extract token from URL params: `?token={token}`
  - [ ] New password input + confirm password input
  - [ ] Password strength indicator component (weak/medium/strong)
  - [ ] Validation: min 8 chars, 1 uppercase, 1 number
  - [ ] Submit → calls `updatePassword(token, newPassword)`
  - [ ] Success → redirect to /login with success toast

### Task 6: Logout Component (AC: 000.3, 000.5)
- [ ] Create `components/auth/UserMenu.tsx`:
  - [ ] Dropdown menu in app header (top-right)
  - [ ] User avatar + name
  - [ ] Menu items: "Profile", "Settings", "Logout", "Logout All Devices"
  - [ ] onClick Logout → calls `signOut()`
  - [ ] onClick Logout All Devices → calls `signOutAllDevices()` with confirmation modal
- [ ] Add UserMenu to main layout (`app/layout.tsx` or `app/(dashboard)/layout.tsx`)

### Task 7: Signup Page (OPTIONAL - AC: 000.4, 000.5)
- [ ] **Decision needed**: Public signup vs invitation-only?
  - [ ] If invitation-only: skip this task, use Story 1.3 (User Invitations)
  - [ ] If public signup: create `/app/signup/page.tsx`
- [ ] If public signup enabled:
  - [ ] Email, password, first name, last name inputs
  - [ ] Terms of Service checkbox
  - [ ] Submit → calls `signUp(...)`
  - [ ] On success → redirect to Settings Wizard (if Admin) or Main Dashboard

### Task 8: Middleware & Route Protection (AC: 000.1)
- [ ] Update `middleware.ts` to:
  - [ ] Check session with Supabase Auth
  - [ ] Public routes: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`
  - [ ] Protected routes: all others
  - [ ] If not authenticated and accessing protected route → redirect to `/login?redirect={path}`
  - [ ] After login → redirect to `?redirect` param or Main Dashboard
- [ ] Test redirect flow: `/settings/users` → `/login?redirect=/settings/users` → login → `/settings/users`

### Task 9: Auth Callback Route (AC: 000.1, 000.2, 000.4)
- [ ] Create `/app/auth/callback/route.ts`:
  - [ ] Handle Supabase Auth callbacks (magic links, OAuth, email confirmations)
  - [ ] Exchange code for session
  - [ ] Redirect to Main Dashboard or `?redirect` param
  - [ ] Error handling: invalid token → redirect to /login with error toast

### Task 10: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] Zod schemas (valid/invalid inputs)
  - [ ] Auth utilities (signIn, signOut, resetPassword - mock Supabase client)
- [ ] Integration tests:
  - [ ] POST /auth/callback (with valid token)
  - [ ] Middleware redirect logic (protected route → login)
- [ ] E2E tests (Playwright):
  - [ ] Login flow: enter credentials → submit → redirect to dashboard
  - [ ] Login with invalid credentials → error toast shown
  - [ ] Forgot password flow: enter email → success message
  - [ ] Reset password flow: click link → enter new password → success → login
  - [ ] Logout flow: click logout → redirect to /login
  - [ ] Protected route redirect: visit /settings → redirect to /login → login → back to /settings

### Task 11: UX Design & Documentation
- [ ] Create UX design mockups for:
  - [ ] Login page (centered card, gradient background)
  - [ ] Forgot password page
  - [ ] Reset password page (with strength indicator)
  - [ ] User menu dropdown (logout options)
- [ ] Document in `docs/ux-design-auth-module.md`:
  - [ ] Layout specifications (card size, spacing)
  - [ ] Color scheme (gradient, button colors)
  - [ ] Typography (heading sizes, input labels)
  - [ ] Error states (toast notifications, inline errors)
- [ ] Add to Figma (if design system exists)

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (Card, Form, Input, Button, Toast)
- **Forms**: React Hook Form + Zod validation
- **Auth**: Supabase Auth (email/password, magic links, password reset)
- **State**: No complex state needed (auth handled by Supabase client)

### Architecture Patterns
- **Auth Strategy**: Supabase Auth with JWT sessions stored in cookies
- **Session Management**: 1h default, 30 days with "remember me"
- **Middleware**: Next.js middleware for route protection
- **Validation**: Zod schemas for all auth forms (client-side)
- **Error Handling**: User-friendly error messages (map Supabase errors)

### Key Technical Decisions
1. **No Custom Signup Page (Recommendation)**: Use invitation-only flow (Story 1.3) for better security and onboarding control
2. **Password Requirements**: Min 8 chars, 1 uppercase, 1 number (align with Supabase policies)
3. **Remember Me**: Extends session to 30 days (configurable in Supabase)
4. **Redirect After Login**: Support `?redirect=` param for deep linking
5. **Logout All Devices**: Calls API to terminate all sessions (Story 1.4 backend)

### Security Considerations
- **Password Reset**: Always show success message (don't reveal if email exists)
- **Rate Limiting**: Enable Supabase Auth rate limiting (prevent brute force)
- **CSRF Protection**: Supabase handles CSRF tokens in cookies
- **XSS Prevention**: Zod validation prevents injection attacks
- **Session Security**: HttpOnly cookies, SameSite=Lax

### Project Structure

Expected file locations (Next.js App Router):
```
app/
  login/
    page.tsx              # Login page
  signup/
    page.tsx              # Signup page (optional)
  forgot-password/
    page.tsx              # Forgot password page
  reset-password/
    page.tsx              # Reset password page
  auth/
    callback/
      route.ts            # Auth callback handler

lib/
  auth/
    auth-client.ts        # Auth utilities (signIn, signOut, etc.)
  validation/
    auth-schemas.ts       # Zod schemas (LoginSchema, ResetPasswordSchema)

components/
  auth/
    LoginForm.tsx         # Login form component
    ForgotPasswordForm.tsx # Forgot password form
    ResetPasswordForm.tsx  # Reset password form
    UserMenu.tsx          # User dropdown menu (logout button)
    PasswordStrength.tsx  # Password strength indicator

middleware.ts             # Route protection middleware
```

### Testing Strategy

**Unit Tests** (Vitest):
- Zod schema validation (valid/invalid inputs)
- Auth utilities (mock Supabase client)

**Integration Tests** (Vitest + Supabase Test Client):
- Auth callback route (token exchange)
- Middleware redirect logic

**E2E Tests** (Playwright):
- Complete login/logout flow
- Forgot password → reset password flow
- Protected route redirect with deep linking
- Error handling (invalid credentials, expired tokens)

### References

- [Source: docs/architecture/patterns/security.md] (Supabase Auth setup, middleware)
- [Source: docs/epics/epic-1-settings.md#Story-1.2-1.4] (User Management, Session Management - backend)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)

### Prerequisites

**None** - This is the first story users interact with (before Story 1.1)

### Dependencies

**External Services:**
- Supabase (Auth, Database)

**Libraries:**
- react-hook-form (form state management)
- zod (validation)
- @supabase/supabase-js (Supabase client)
- @supabase/ssr (SSR helpers for Next.js)
- shadcn/ui (UI components: Form, Input, Button, Card, Toast, DropdownMenu)

### Integration with Story 1.3 (User Invitations)

**Decision Point**: Should we support public signup or invitation-only?

**Recommendation: Invitation-Only (skip Task 7)**
- More secure (no spam accounts)
- Better onboarding control (Admin invites users via Story 1.3)
- Aligns with B2B SaaS model
- Story 1.3 already handles signup flow via invitation tokens

**If Public Signup Needed Later**:
- Enable Task 7 (signup page)
- Add email confirmation requirement
- Consider CAPTCHA for spam prevention

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-0-authentication-ui.context.xml) - To be generated

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added after story completion -->

### File List

<!-- NEW/MODIFIED/DELETED files will be listed here after implementation -->

## Change Log

- 2025-11-20: Story created by Mariusz (missing authentication UI in Epic 1)
