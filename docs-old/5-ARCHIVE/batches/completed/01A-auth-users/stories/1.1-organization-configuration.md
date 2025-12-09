# Story 1.1: Organization Configuration

Status: ready-for-dev

## Story

As an **Admin**,
I want to configure my organization's basic settings,
so that the system reflects my company's identity and preferences.

## Acceptance Criteria

### FR-SET-001: Organization Configuration

**AC-001.1**: User może wypełnić i zapisać organization form z wymaganymi polami:
- company_name (required, max 100 chars)
- address, city, postal_code, country
- NIP/VAT number (optional)

**AC-001.2**: Logo upload functionality:
- Accepts only jpg/png/webp formats
- Max file size: 2MB
- Upload to Supabase Storage
- Returns signed URL for display

**AC-001.3**: Regional settings zapisywane i applied globally:
- timezone (dropdown with standard timezones)
- default_currency (PLN, EUR, USD, GBP)
- default_language (PL, EN)
- date_format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- number_format ('1 000,00', '1,000.00')
- unit_system ('metric', 'imperial')

**AC-001.4**: User experience requirements:
- Validation errors shown inline on blur
- Success toast displayed after successful save
- Form sections: Basic Data, Business Settings, Regional

**Additional Acceptance Criteria from Epic:**

**Given** the user is logged in as Admin
**When** they navigate to /settings/organization
**Then** they see a form with three sections

**And** fiscal_year_start dropdown (January, April, July, October)
**And** all dropdowns properly populated (countries, timezones, currencies)
**And** changes saved immediately with success feedback

## Tasks / Subtasks

### Task 1: Database Schema & Migrations (AC: 001.1, 001.3)
- [ ] Create `organizations` table migration with all fields:
  - [ ] company_name VARCHAR(100) NOT NULL
  - [ ] logo_url TEXT (Supabase Storage signed URL)
  - [ ] street_address, city, postal_code, country
  - [ ] nip_vat_number VARCHAR(50)
  - [ ] timezone VARCHAR(50) DEFAULT 'UTC'
  - [ ] default_currency VARCHAR(3) DEFAULT 'PLN'
  - [ ] default_language VARCHAR(2) DEFAULT 'PL'
  - [ ] fiscal_year_start VARCHAR(20) DEFAULT 'January'
  - [ ] date_format VARCHAR(20)
  - [ ] number_format VARCHAR(20)
  - [ ] unit_system VARCHAR(10) DEFAULT 'metric'
  - [ ] created_at, updated_at timestamps
- [ ] Add unique constraint on organization (likely 1 org per tenant initially)
- [ ] Run migration and verify schema

### Task 2: Supabase Storage Configuration (AC: 001.2)
- [ ] Create 'organization-logos' bucket in Supabase Storage
- [ ] Configure bucket policy: authenticated access only
- [ ] Set max file size: 2MB
- [ ] Configure allowed MIME types: image/jpeg, image/png, image/webp
- [ ] Test signed URL generation (1h TTL)

### Task 3: API Endpoints (AC: 001.1, 001.2, 001.3)
- [ ] Implement GET /api/settings/organization
  - [ ] Fetch organization by current user's org_id (from JWT)
  - [ ] Return complete organization object
  - [ ] Handle case when org doesn't exist (return defaults)
- [ ] Implement PUT /api/settings/organization
  - [ ] Validate all fields with Zod schema
  - [ ] Update organization record
  - [ ] Return updated organization
  - [ ] Require Admin role (middleware check)
- [ ] Implement POST /api/settings/organization/logo
  - [ ] Accept FormData with file
  - [ ] Validate file: size (max 2MB), type (jpg/png/webp)
  - [ ] Upload to Supabase Storage bucket
  - [ ] Generate signed URL (1h TTL)
  - [ ] Update organizations.logo_url
  - [ ] Return { logo_url: string }

### Task 4: Zod Validation Schemas (AC: 001.1, 001.2, 001.3, 001.4)
- [ ] Create UpdateOrganizationSchema
  - [ ] company_name: z.string().min(1).max(100)
  - [ ] country: z.enum(['PL', 'UK', 'US', 'DE', 'FR', ...])
  - [ ] timezone: z.string() (IANA timezone)
  - [ ] default_currency: z.enum(['PLN', 'EUR', 'USD', 'GBP'])
  - [ ] default_language: z.enum(['PL', 'EN'])
  - [ ] fiscal_year_start: z.enum(['January', 'April', 'July', 'October'])
  - [ ] date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
  - [ ] number_format: z.enum(['1 000,00', '1,000.00'])
  - [ ] unit_system: z.enum(['metric', 'imperial'])
- [ ] Create LogoUploadSchema
  - [ ] file: z.instanceof(File).refine(size <= 2MB).refine(type in allowed)
- [ ] Use schemas in both client and server validation

### Task 5: Frontend Organization Settings Page (AC: 001.1, 001.3, 001.4)
- [ ] Create /app/settings/organization/page.tsx (Next.js App Router)
- [ ] Implement OrganizationForm component with react-hook-form
  - [ ] Section 1: Basic Data (company_name, address, city, postal_code, country, NIP/VAT)
  - [ ] Section 2: Business Settings (fiscal_year_start, date_format, number_format, unit_system)
  - [ ] Section 3: Regional (timezone, default_currency, default_language)
- [ ] Populate dropdowns:
  - [ ] Countries list (use library like world-countries)
  - [ ] Timezones (use date-fns-tz or Intl API)
  - [ ] Currencies (static list)
  - [ ] Languages (static list)
- [ ] Inline validation on blur (Zod + react-hook-form)
- [ ] Success toast on save (shadcn/ui Toast component)
- [ ] Error toast on failure

### Task 6: Logo Upload Component (AC: 001.2, 001.4)
- [ ] Create LogoUpload component
  - [ ] File input (hidden, triggered by button/dropzone)
  - [ ] Preview current logo (or placeholder initials)
  - [ ] Drag-and-drop support (optional, nice-to-have)
  - [ ] Client-side validation: format, size
  - [ ] Upload progress indicator
  - [ ] Error handling: show toast if upload fails
- [ ] Display uploaded logo with signed URL
- [ ] Fallback: show company initials if no logo

### Task 7: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] Zod schemas validation (valid/invalid cases)
  - [ ] Logo file size/type validation
- [ ] Integration tests:
  - [ ] POST organization → GET organization (data persisted)
  - [ ] PUT organization → updated fields returned
  - [ ] Logo upload → signed URL returned
  - [ ] Supabase Storage integration (upload/retrieve)
- [ ] E2E tests (Playwright):
  - [ ] Navigate to /settings/organization
  - [ ] Fill form with valid data
  - [ ] Upload logo (2MB jpg)
  - [ ] Submit form → success toast
  - [ ] Refresh page → data persisted
  - [ ] Try invalid logo (3MB) → error shown

### Task 8: Documentation & Cleanup
- [ ] Update type definitions (TypeScript interfaces)
- [ ] Add API route documentation (JSDoc comments)
- [ ] Update README if needed (API endpoints section)

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components
- **Forms**: React Hook Form + Zod validation (client + server)
- **Database**: PostgreSQL 15 via Supabase
- **Storage**: Supabase Storage for logo uploads
- **State**: SWR for data fetching/caching (optional for this story)

### Architecture Patterns
- **Multi-tenancy**: All organization data isolated by org_id (from JWT)
- **Validation**: Zod schemas shared between client and server
- **Error Handling**: RFC 7807 error responses from API
- **File Upload**: Direct to Supabase Storage, return signed URL

### Key Technical Decisions
1. **Logo Storage**: Use Supabase Storage authenticated bucket, signed URLs (1h TTL)
2. **Logo Size**: Resize to max 1024x1024 on upload (sharp library) - optional optimization
3. **Organization Model**: Single organization per tenant initially (can extend to multi-org later)
4. **Regional Settings**: Applied globally across all modules (stored in org settings)

### Security Considerations
- **Logo Upload**: Client + server validation (size, type)
- **Storage Bucket**: Authenticated access only (not public)
- **API Access**: Admin-only for PUT /api/settings/organization
- **Input Validation**: Zod schemas prevent SQL injection, XSS

### Project Structure Notes

Expected file locations (Next.js App Router):
```
app/
  settings/
    organization/
      page.tsx              # Main settings page
  api/
    settings/
      organization/
        route.ts            # GET /api/settings/organization, PUT
        logo/
          route.ts          # POST /api/settings/organization/logo

lib/
  validation/
    schemas.ts              # Zod schemas (UpdateOrganizationSchema, LogoUploadSchema)
  api/
    SettingsAPI.ts          # API client methods

components/
  settings/
    OrganizationForm.tsx    # Main form component
    LogoUpload.tsx          # Logo upload component

supabase/
  migrations/
    20XX_create_organizations.sql  # Database migration
```

### Testing Strategy

**Unit Tests** (Vitest):
- Zod schema validation (valid/invalid inputs)
- Logo file validation (size, type)

**Integration Tests** (Vitest + Supabase Test Client):
- API endpoints (GET/PUT organization, POST logo)
- Database operations (create, update)
- Supabase Storage integration

**E2E Tests** (Playwright):
- Complete organization setup flow
- Logo upload (valid + invalid files)
- Form validation and error handling
- Data persistence across page refresh

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.1]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#FR-SET-001]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Organizations-Table]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#APIs-and-Interfaces]
- [Source: docs/architecture/modules/settings.md] (if exists)

### Prerequisites

**None** - This is the first story in Epic 1 (Foundation module)

### Dependencies

**External Services:**
- Supabase (Database, Storage, Auth)

**Libraries:**
- react-hook-form (form state management)
- zod (validation)
- @supabase/supabase-js (Supabase client)
- shadcn/ui (UI components: Form, Input, Select, Toast)
- sharp (image resizing - optional)

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-1-organization-configuration.context.xml) - Generated 2025-11-20

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
