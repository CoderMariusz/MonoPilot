# Story 1.3: User Invitations

Status: ready-for-dev

## Story

As an **Admin**,
I want to invite users via email or QR code,
so that new team members can easily onboard.

## Acceptance Criteria

### FR-SET-002: User Management (Stories 1.2, 1.3)

**AC-002.6**: Invitation email wysłany within 5s z następującą zawartością:
- Signup link z pre-filled email
- QR code do mobile scanning
- Invitation expires after 7 days
- Link format: `/signup?token={jwt_token}&email={email}`

**AC-002.7**: Invitation expires after 7 days:
- Token zawiera expiry timestamp (JWT exp claim)
- Expired invitation shows error: "This invitation has expired. Please request a new one."
- Admin może resend invitation (extends expiry o kolejne 7 days)

**AC-002.8**: Signup z invitation link:
- Email pre-filled (read-only)
- User sets password (min 8 chars, 1 uppercase, 1 number)
- On successful signup: user.status → 'active'
- Invitation token invalidated (one-time use)
- Redirect to dashboard with welcome message

**AC-003.1**: Admin views pending invitations:
- Navigate to /settings/users → "Invitations" tab
- Table columns: Email, Role, Invited By, Sent Date, Expires At, Status, Actions
- Status: Pending, Accepted, Expired
- Filter by status
- Search by email

**AC-003.2**: Resend invitation functionality:
- Click "Resend" action → new email sent
- New token generated (7-day expiry)
- Previous token invalidated
- Success toast: "Invitation resent to {email}"
- Sent Date updated to current timestamp

**AC-003.3**: Cancel invitation functionality:
- Click "Cancel" action → confirmation modal
- On confirm: invitation deleted, token invalidated
- User record removed from users table (if status still 'invited')
- Success toast: "Invitation cancelled"

**AC-003.4**: Expired invitations marked visually:
- Expires At column shows "Expired" badge (red) if past expiry
- Status = "Expired"
- Resend button enabled, Cancel button disabled
- Auto-cleanup: expired invitations >30 days old deleted weekly

**AC-003.5**: QR code generation:
- QR code contains same signup URL as email link
- Format: `{app_url}/signup?token={jwt}&email={email}`
- QR code displayed in invitation modal (for manual share)
- QR code embedded in email (for mobile scanning)
- Use library: qrcode or similar

**AC-003.6**: Invitation email template:
- Subject: "You've been invited to {org_name} on MonoPilot"
- Body includes: org name, role assigned, signup link, QR code, expiry date
- SendGrid transactional email
- Branding: org logo (if available), MonoPilot footer

## Tasks / Subtasks

### Task 1: Database Schema - Invitations Table (AC: 002.6, 002.7, 003.1)
- [ ] Create `user_invitations` table migration:
  - [ ] id UUID PK
  - [ ] org_id UUID FK → organizations (RLS key)
  - [ ] email VARCHAR(255) NOT NULL
  - [ ] role VARCHAR(20) NOT NULL
  - [ ] token TEXT NOT NULL (JWT)
  - [ ] invited_by UUID FK → users
  - [ ] status VARCHAR(20) DEFAULT 'pending' (enum: pending, accepted, expired, cancelled)
  - [ ] sent_at TIMESTAMP DEFAULT NOW()
  - [ ] expires_at TIMESTAMP (sent_at + 7 days)
  - [ ] accepted_at TIMESTAMP
  - [ ] created_at TIMESTAMP DEFAULT NOW()
- [ ] Add unique constraint: (org_id, email, status) WHERE status = 'pending'
- [ ] Add index: org_id, email, status, expires_at
- [ ] Create RLS policy: `org_id = (auth.jwt() ->> 'org_id')::uuid`
- [ ] Run migration and verify schema

### Task 2: Invitation Token Generation (AC: 002.6, 002.7)
- [ ] Create InvitationService.generateToken(email, role, orgId)
  - [ ] Generate JWT with claims: { email, role, org_id, exp: 7 days }
  - [ ] Sign with secret key (from env)
  - [ ] Return token string
- [ ] Create InvitationService.validateToken(token)
  - [ ] Verify JWT signature
  - [ ] Check expiry (exp claim)
  - [ ] Return decoded payload or throw error
- [ ] Token format: JWT with HS256 algorithm

### Task 3: QR Code Generation (AC: 003.5)
- [ ] Install library: `pnpm add qrcode` or `qrcode.react`
- [ ] Create QRCodeGenerator utility
  - [ ] Input: signup URL with token
  - [ ] Output: QR code data URL (base64 image)
  - [ ] Size: 300x300px
  - [ ] Error correction: Medium
- [ ] Generate QR in API endpoint (for email embedding)
- [ ] Generate QR in frontend (for modal display)

### Task 4: API Endpoints (AC: 002.6, 002.7, 003.1, 003.2, 003.3)
- [ ] Modify POST /api/settings/users (from Story 1.2)
  - [ ] After creating user → call InvitationService.sendInvitation
  - [ ] Generate invitation token
  - [ ] Generate QR code
  - [ ] Send email via SendGrid
  - [ ] Create user_invitations record
  - [ ] Return { user, invitation } object
- [ ] Implement GET /api/settings/invitations
  - [ ] Query params: status?, search?
  - [ ] Filter by org_id (from JWT)
  - [ ] Apply filters (status, email search)
  - [ ] Return Invitation[] array
  - [ ] Include invited_by user name (JOIN)
  - [ ] Require Admin role
- [ ] Implement POST /api/settings/invitations/:id/resend
  - [ ] Generate new token (7-day expiry)
  - [ ] Invalidate old token
  - [ ] Update sent_at, expires_at in DB
  - [ ] Send new email
  - [ ] Return updated invitation
  - [ ] Require Admin role
- [ ] Implement DELETE /api/settings/invitations/:id
  - [ ] Update status = 'cancelled'
  - [ ] Delete user if status = 'invited' (soft delete or hard delete)
  - [ ] Return success: true
  - [ ] Require Admin role

### Task 5: SendGrid Email Integration (AC: 002.6, 003.6)
- [ ] Install SendGrid SDK: `pnpm add @sendgrid/mail`
- [ ] Configure SendGrid API key (from env: SENDGRID_API_KEY)
- [ ] Create email template (SendGrid dynamic template or inline HTML)
  - [ ] Subject: "You've been invited to {{org_name}} on MonoPilot"
  - [ ] Body sections:
    - [ ] Greeting: "Hi there!"
    - [ ] Message: "You've been invited to join {{org_name}} as {{role}}"
    - [ ] Signup button/link
    - [ ] QR code image (embedded base64)
    - [ ] Expiry notice: "This invitation expires on {{expires_at}}"
    - [ ] Footer: MonoPilot branding, org logo (if available)
- [ ] Create InvitationService.sendInvitation(email, token, qrCode, orgName, role)
  - [ ] Build email payload
  - [ ] Send via SendGrid API
  - [ ] Return success/failure
  - [ ] Log errors
- [ ] Retry logic: 3 attempts with exponential backoff (if SendGrid fails)

### Task 6: Signup Page (AC: 002.8)
- [ ] Create /app/signup/page.tsx
- [ ] Parse URL params: token, email
- [ ] Validate token (call InvitationService.validateToken)
  - [ ] If expired → show error message, offer "Request new invitation" link
  - [ ] If invalid → show error message
- [ ] Implement SignupForm component
  - [ ] Email field (pre-filled, read-only)
  - [ ] Password field (validation: min 8 chars, 1 uppercase, 1 number)
  - [ ] Confirm password field (must match)
  - [ ] Submit → POST to Supabase Auth signup endpoint
- [ ] On successful signup:
  - [ ] Update users.status = 'active'
  - [ ] Update user_invitations.status = 'accepted', accepted_at = NOW()
  - [ ] Invalidate token
  - [ ] Auto-login user (Supabase session)
  - [ ] Redirect to /dashboard with welcome toast

### Task 7: Frontend Invitations Tab (AC: 003.1, 003.2, 003.3, 003.4)
- [ ] Add "Invitations" tab to /app/settings/users/page.tsx
- [ ] Implement InvitationsTable component
  - [ ] Columns: Email, Role, Invited By, Sent Date, Expires At, Status, Actions
  - [ ] Status badge: Pending (blue), Accepted (green), Expired (red), Cancelled (gray)
  - [ ] Actions: Resend, Cancel buttons
  - [ ] Search input (filter by email)
  - [ ] Status filter dropdown
- [ ] Implement Resend functionality
  - [ ] Click Resend → POST /api/settings/invitations/:id/resend
  - [ ] Success → refresh table, toast: "Invitation resent to {email}"
  - [ ] Error → show error toast
- [ ] Implement Cancel functionality
  - [ ] Click Cancel → confirmation modal
  - [ ] On confirm → DELETE /api/settings/invitations/:id
  - [ ] Success → refresh table, toast: "Invitation cancelled"
- [ ] Visual indicators for expired invitations
  - [ ] Expires At column: show "Expired" badge if past expiry
  - [ ] Resend button enabled for expired invitations
  - [ ] Cancel button disabled for expired invitations

### Task 8: Invitation Modal (AC: 003.5)
- [ ] Create InvitationModal component (triggered after user creation)
- [ ] Display sections:
  - [ ] Success message: "User invited successfully!"
  - [ ] Email sent to: {email}
  - [ ] QR code for mobile scanning (generated in frontend)
  - [ ] Copy signup link button (clipboard.js or navigator.clipboard)
  - [ ] Expiry notice: "Expires in 7 days"
- [ ] Actions:
  - [ ] Close button
  - [ ] "Send another invitation" button (reopen user creation modal)

### Task 9: Auto-Cleanup Expired Invitations (AC: 003.4)
- [ ] Create background job/cron (Vercel Cron or Supabase Function)
  - [ ] Runs weekly (e.g., Sunday 2am UTC)
  - [ ] Delete invitations WHERE status = 'expired' AND expires_at < NOW() - 30 days
  - [ ] Log deleted count
- [ ] Configure cron job in vercel.json or Supabase dashboard

### Task 10: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] Token generation (valid JWT with 7-day expiry)
  - [ ] Token validation (expired, invalid signature)
  - [ ] QR code generation (valid URL encoded)
- [ ] Integration tests:
  - [ ] POST user → invitation email sent within 5s
  - [ ] Invitation record created in DB
  - [ ] GET invitations → filtered by status, search
  - [ ] Resend invitation → new token generated, email sent
  - [ ] Cancel invitation → status updated, user deleted
  - [ ] Signup with valid token → user.status = 'active'
  - [ ] Signup with expired token → error shown
- [ ] E2E tests (Playwright):
  - [ ] Create user → invitation modal appears
  - [ ] Copy signup link → paste in new browser → signup page loads
  - [ ] Complete signup → redirected to dashboard
  - [ ] View invitations tab → pending invitation listed
  - [ ] Resend invitation → new email sent (mock SendGrid)
  - [ ] Cancel invitation → removed from list
  - [ ] Try signup with expired token → error shown

### Task 11: SendGrid Mock for Testing (AC: 002.6)
- [ ] Create SendGridMock service for tests
  - [ ] Capture sent emails (in-memory array)
  - [ ] Verify email content (to, subject, body)
  - [ ] Simulate failures for retry logic testing
- [ ] Use mock in integration/E2E tests (not production)

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (Tabs, Table, Dialog, Badge)
- **Forms**: React Hook Form + Zod validation
- **Email**: SendGrid (@sendgrid/mail)
- **QR Code**: qrcode library (Node.js) or qrcode.react (React)
- **Auth**: Supabase Auth (signup endpoint)
- **Token**: JWT (jsonwebtoken library)
- **Database**: PostgreSQL 15 via Supabase

### Architecture Patterns
- **Multi-tenancy**: RLS policy on user_invitations table
- **Token Security**: JWT with 7-day expiry, one-time use, signed with secret
- **Email Retry**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **QR Code**: Embedded in email (base64 image) and displayed in modal
- **Auto-Cleanup**: Weekly cron job deletes expired invitations >30 days old

### Key Technical Decisions

1. **Invitation Token**:
   - JWT format: `{ email, role, org_id, exp: 7 days }`
   - Signed with HS256 algorithm
   - Secret key from env: JWT_SECRET
   - One-time use (invalidated after signup)

2. **Invitation Expiry**:
   - 7 days from sent_at
   - Stored in expires_at column (for DB queries)
   - Also in JWT exp claim (for token validation)
   - Expired invitations can be resent (generates new token)

3. **QR Code**:
   - Contains same URL as email link
   - Format: `{APP_URL}/signup?token={jwt}&email={email}`
   - Embedded in email as base64 image
   - Generated in API (for email) and frontend (for modal)

4. **Email Service**:
   - SendGrid transactional email
   - Dynamic template or inline HTML
   - Retry logic: 3 attempts with exponential backoff
   - Fallback: if SendGrid fails, show QR code in modal for manual share

5. **Status Lifecycle**:
   - pending: Invitation sent, not yet accepted
   - accepted: User signed up successfully
   - expired: Expiry date passed
   - cancelled: Admin cancelled invitation

### Security Considerations
- **Token Security**: JWT signed with secret, 7-day expiry, one-time use
- **Email Validation**: Email must match invitation token email
- **Expiry Enforcement**: Server validates token expiry (not just client)
- **One-Time Use**: Token invalidated after signup (prevents reuse)
- **RLS Policy**: Users see only their org's invitations
- **Password Policy**: Min 8 chars, 1 uppercase, 1 number (Supabase Auth enforced)

### Project Structure Notes

Expected file locations:
```
app/
  signup/
    page.tsx                # Signup page with token validation
  settings/
    users/
      page.tsx              # Updated with Invitations tab
  api/
    settings/
      invitations/
        route.ts            # GET /api/settings/invitations
        [id]/
          resend/
            route.ts        # POST /api/settings/invitations/:id/resend
          route.ts          # DELETE /api/settings/invitations/:id

lib/
  services/
    InvitationService.ts    # Token generation, validation, email sending
  utils/
    QRCodeGenerator.ts      # QR code generation utility

components/
  settings/
    InvitationsTable.tsx    # Invitations tab table
    InvitationModal.tsx     # Post-creation modal with QR code
  auth/
    SignupForm.tsx          # Signup form component

supabase/
  migrations/
    XXXX_create_user_invitations.sql  # Invitations table

cron/
  cleanup-expired-invitations.ts  # Weekly cleanup job
```

### Data Model

```typescript
interface UserInvitation {
  id: string                    // UUID PK
  org_id: string                // FK → organizations, RLS key
  email: string                 // Email to invite
  role: UserRole                // Role to assign
  token: string                 // JWT invitation token
  invited_by: string            // FK → users (admin who invited)
  status: InvitationStatus      // pending, accepted, expired, cancelled
  sent_at: Date                 // When invitation was sent
  expires_at: Date              // sent_at + 7 days
  accepted_at?: Date            // When user signed up
  created_at: Date
}

enum InvitationStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Expired = 'expired',
  Cancelled = 'cancelled'
}

// JWT Token Payload
interface InvitationTokenPayload {
  email: string
  role: UserRole
  org_id: string
  exp: number                   // Unix timestamp (7 days from now)
}

// Unique constraint: (org_id, email, status) WHERE status = 'pending'
// Prevents duplicate pending invitations for same email
```

### API Endpoints

```typescript
GET    /api/settings/invitations
  Query: { status?, search? }
  Response: UserInvitation[] (with invited_by user name)
  Auth: Admin only

POST   /api/settings/invitations/:id/resend
  Response: UserInvitation (updated)
  Auth: Admin only
  Side effects: New token, new email, invalidate old token

DELETE /api/settings/invitations/:id
  Response: { success: boolean }
  Auth: Admin only
  Side effects: status = 'cancelled', delete user if invited

POST   /api/auth/signup (Supabase Auth)
  Body: { email, password, token }
  Response: { user, session }
  Side effects: users.status = 'active', invitation.status = 'accepted'
```

### SendGrid Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invitation to MonoPilot</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #f4f4f4; padding: 20px; text-align: center;">
    <img src="{{org_logo_url}}" alt="{{org_name}}" style="max-height: 60px;">
  </div>

  <div style="padding: 30px; background: white;">
    <h2>You've been invited to {{org_name}}</h2>

    <p>Hi there!</p>

    <p>You've been invited to join <strong>{{org_name}}</strong> on MonoPilot as <strong>{{role}}</strong>.</p>

    <p style="text-align: center; margin: 30px 0;">
      <a href="{{signup_url}}" style="background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Accept Invitation
      </a>
    </p>

    <p style="text-align: center;">
      <strong>Or scan this QR code on your mobile device:</strong><br>
      <img src="{{qr_code_data_url}}" alt="QR Code" style="margin-top: 10px;">
    </p>

    <p style="color: #666; font-size: 14px;">
      This invitation expires on <strong>{{expires_at}}</strong> (7 days).
    </p>
  </div>

  <div style="background: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px;">
    <p>Powered by <strong>MonoPilot MES</strong></p>
  </div>
</body>
</html>
```

### Testing Strategy

**Unit Tests** (Vitest):
- Token generation (valid JWT, 7-day expiry, correct claims)
- Token validation (expired, invalid signature, tampered payload)
- QR code generation (valid data URL, correct content)
- Email template rendering (placeholders replaced)

**Integration Tests** (Vitest + Supabase Test Client):
- User creation → invitation sent within 5s
- Invitation record created in DB with correct expiry
- Resend → new token, old token invalidated
- Cancel → status updated, user removed
- Signup with valid token → user activated
- Signup with expired token → error returned
- Auto-cleanup cron → expired invitations deleted

**E2E Tests** (Playwright):
- Complete invitation flow (create user → email sent → signup → login)
- Resend invitation → new email received
- Cancel invitation → removed from list
- Expired invitation → error on signup page
- QR code scan simulation (mobile view)

### Performance Targets
- Email sending: <5s (SendGrid SLA)
- QR code generation: <100ms
- Invitations list (100 invitations): <300ms
- Signup page load: <500ms

### Learnings from Previous Story

**From Story 1.2 (User Management - CRUD)**

Story 1.2 is in status "drafted" (not yet implemented), so no implementation learnings available yet.

**Key Integration Points:**
- Builds on Story 1.2: POST /api/settings/users now triggers invitation flow
- Shares users table: invitation creates user with status 'invited'
- Shares UserRole enum: role assignment during invitation
- Shares RLS patterns: user_invitations table follows same org_id isolation

**Expected Patterns from Story 1.2:**
- Supabase Auth integration (auth.users ↔ public.users sync)
- Zod validation schemas
- Admin-only API endpoints
- Error handling (RFC 7807 format)

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.3]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#FR-SET-002]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#User-Invitation-Flow]
- [Source: docs/architecture/patterns/security.md] (Token security)
- [Source: docs/architecture/patterns/api.md] (SendGrid integration)

### Prerequisites

**Story 1.2**: User Management - CRUD (requires users table, POST /api/settings/users endpoint)

### Dependencies

**External Services:**
- Supabase (Database, Auth)
- SendGrid (Email delivery)

**Libraries:**
- @sendgrid/mail (email sending)
- jsonwebtoken (JWT generation/validation)
- qrcode (QR code generation)
- @supabase/supabase-js (Supabase client)
- react-hook-form, zod (form validation)
- shadcn/ui (Tabs, Table, Dialog, Badge components)

**Internal Dependencies:**
- users table (from Story 1.2)
- CreateUserSchema, UserRole enum (from Story 1.2)

## Dev Agent Record

### Context Reference

<!-- Path to story context XML will be added by story-context workflow -->

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added after story completion -->

### File List

<!-- NEW/MODIFIED/DELETED files will be listed here after implementation -->

## Change Log

- 2025-11-20: Story drafted by Mariusz (from Epic 1 + Tech Spec Epic 1)
