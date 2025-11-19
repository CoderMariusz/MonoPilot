# NPD Module Architecture

## Executive Summary

MonoPilot NPD (New Product Development) Module is a **premium add-on** implementing **bounded context architecture** within the existing MonoPilot monorepo. The module enables **dual-mode operation**: standalone (R&D consultancies without production) or integrated (full manufacturing workflow with handoff to production).

**Key Architectural Decisions:**

- **Bounded Context Isolation:** Separate `npd_*` tables with optional foreign keys, feature flag controlled
- **Event Sourcing Pattern:** Outbox pattern with pg_notify for reliable handoff and audit trail
- **Hybrid Versioning Service:** PostgreSQL functions (enforcement) + TypeScript wrapper (UI validation)
- **Server-Side Wizard State:** Resumable handoff flow with session management
- **Event-Driven Integration:** Loose coupling with Production modules via domain events

**Technology Stack:** Extends existing MonoPilot stack (Next.js 15, React 19, TypeScript 5.7, Supabase, Tailwind CSS, pnpm monorepo).

## Project Initialization

NPD Module extends existing MonoPilot codebase - **no new project initialization required**.

**Setup Steps:**

1. Run database migrations (100-113: create npd\_\* tables + modify existing tables)
2. Deploy Edge Function (`supabase/functions/npd-event-processor`)
3. Enable NPD Module per organization (`UPDATE org_settings SET enabled_modules = ARRAY['production', 'npd']`)

## Decision Summary

| Category           | Decision                                                | Version           | Affects Epics                        | Rationale                                                                        |
| ------------------ | ------------------------------------------------------- | ----------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| Database Schema    | Same schema (`public`) with `npd_` prefix               | PostgreSQL 15+    | All NPD epics                        | Consistency with MonoPilot, simple RLS policies, native foreign keys             |
| Bounded Context    | Optional foreign keys + Feature flags                   | N/A               | NPD-3, all integration points        | Enables NPD-only mode (R&D consultancies) and NPD+Production mode                |
| Event Sourcing     | Outbox pattern + pg_notify + sequence_number            | N/A               | NPD-3, NPD-5                         | Transactional safety, ordering guarantees, Supabase Realtime integration         |
| Versioning Service | Hybrid (PostgreSQL functions + TypeScript wrapper)      | N/A               | NPD-2, BOM integration               | Database triggers enforce (compliance), TypeScript provides instant UI feedback  |
| Handoff Wizard     | Server-side wizard state (`npd_handoff_sessions`)       | N/A               | NPD-3, NPD-6                         | Resumable flow, server-side validation, audit trail, transactional final step    |
| Feature Flags      | Database column (`org_settings.enabled_modules TEXT[]`) | N/A               | All NPD epics, access control        | Per-org control, PostgreSQL native, RLS friendly, future-proof                   |
| API Layer          | Static Class Pattern                                    | N/A               | NPD-1, NPD-2, NPD-3, NPD-4, NPD-5    | Consistency with 28 existing MonoPilot API classes                               |
| RLS Policies       | Per-table RLS with org_id isolation                     | N/A               | NPD-6, all NPD APIs                  | Consistency with 40+ existing tables, database-enforced security                 |
| UI Organization    | Separate `/npd` route group                             | Next.js 15        | NPD-1, NPD-2, NPD-3                  | Clear module boundary, middleware feature flag check, co-location                |
| Document Storage   | Hierarchical `npd/{org_id}/{project_id}/{category}/`    | Supabase Storage  | NPD-4                                | Organized by project, category folders, RLS friendly, easy cleanup               |
| Integration Points | Event-driven (NPD emits events, Production listens)     | N/A               | NPD-3, NPD-5, Production integration | Loose coupling, retry mechanism, audit trail, bounded context principle          |
| State Management   | React Context + SWR                                     | SWR 2.x           | NPD-1, NPD-2, NPD-3                  | Consistency with MonoPilot, optimistic updates, cache management                 |
| Caching Strategy   | SWR default config (60s stale, revalidate on focus)     | SWR 2.x           | All NPD UI                           | Standard SWR sufficient for NPD use cases                                        |
| Optimistic Updates | Enabled for create/update operations                    | SWR 2.x           | NPD-1, NPD-2                         | Better UX (instant feedback), SWR built-in support                               |
| Error Boundary     | Shared ErrorBoundary component (MonoPilot reused)       | N/A               | All NPD UI                           | General pattern sufficient, no NPD-specific error handling needed                |
| Notifications      | Supabase Realtime + shadcn/ui Toast                     | Supabase Realtime | NPD-1, NPD-2, NPD-3, NPD-5           | Real-time notifications, audit trail via audit_log, consistent UX with MonoPilot |

## Project Structure

```
MonoPilot/
├── apps/
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── (authenticated)/
│   │   │   │   ├── npd/                           # NPD Module routes
│   │   │   │   │   ├── page.tsx                   # Dashboard (Kanban view)
│   │   │   │   │   ├── projects/
│   │   │   │   │   │   ├── page.tsx               # Project List
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   ├── page.tsx           # Project Detail (tabs: overview, gates, risks)
│   │   │   │   │   │   │   ├── formulation/
│   │   │   │   │   │   │   │   └── page.tsx       # Formulation Editor (versions, items, allergens)
│   │   │   │   │   │   │   ├── costing/
│   │   │   │   │   │   │   │   └── page.tsx       # Costing Calculator
│   │   │   │   │   │   │   ├── compliance/
│   │   │   │   │   │   │   │   └── page.tsx       # Compliance Documents
│   │   │   │   │   │   │   ├── handoff/
│   │   │   │   │   │   │   │   └── page.tsx       # Handoff Wizard (5 steps)
│   │   │   │   ├── planning/                      # Existing MonoPilot modules
│   │   │   │   ├── production/
│   │   │   │   ├── warehouse/
│   │   │   │   ├── settings/
│   │   ├── components/
│   │   │   ├── NPD/                               # NPD-specific components
│   │   │   │   ├── ProjectCard.tsx                # Kanban card component
│   │   │   │   ├── FormulationEditor/
│   │   │   │   │   ├── FormulationItemsTable.tsx  # Ingredients table
│   │   │   │   │   ├── AllergenDisplay.tsx        # Auto-aggregated allergen declaration
│   │   │   │   │   ├── VersionTimeline.tsx        # Visual timeline (v1 → v2 → v3)
│   │   │   │   ├── HandoffWizard/
│   │   │   │   │   ├── ValidationStep.tsx         # Step 1: Validation checklist
│   │   │   │   │   ├── ProductDecisionStep.tsx    # Step 2: New product vs version
│   │   │   │   │   ├── BOMTransferStep.tsx        # Step 3: Preview BOM transfer
│   │   │   │   │   ├── PilotWOStep.tsx            # Step 4: Pilot WO options
│   │   │   │   │   ├── ExecuteStep.tsx            # Step 5: Confirm & execute
│   │   │   │   ├── GateChecklist.tsx              # Gate-specific checklist UI
│   │   │   │   ├── CostingCalculator.tsx          # Target vs Estimated vs Actual
│   │   │   │   ├── RiskMatrix.tsx                 # Likelihood × Impact visualization
│   │   │   │   ├── DocumentUpload.tsx             # Drag-drop upload to Supabase Storage
│   │   │   ├── shared/                            # Shared components (Button, Modal, Toast, etc.)
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── NPDProjectsAPI.ts              # CRUD + advanceGate, cancel
│   │   │   │   ├── FormulationsAPI.ts             # Versioning + items + lock
│   │   │   │   ├── HandoffAPI.ts                  # startWizard, executeHandoff, exportProject
│   │   │   │   ├── GateReviewsAPI.ts              # Approval workflow (reuses approvals table)
│   │   │   │   ├── CostingAPI.ts                  # Costing calculations + variance alerts
│   │   │   │   ├── NPDEventsAPI.ts                # emit, markCompleted, retry
│   │   │   ├── services/
│   │   │   │   ├── VersioningService.ts           # Shared versioning logic (NPD + BOM)
│   │   │   │   ├── NPDEventProcessor.ts           # Event handler (client-side listener)
│   │   │   ├── hooks/
│   │   │   │   ├── useNPDProject.ts               # SWR hook: useSWR(`/npd/projects/${id}`)
│   │   │   │   ├── useFormulation.ts              # SWR hook with optimistic updates
│   │   │   │   ├── useHandoffSession.ts           # Wizard session state
│   │   │   ├── contexts/
│   │   │   │   ├── NPDContext.tsx                 # Global NPD state (selectedProject, wizardSession)
│   │   │   ├── supabase/
│   │   │   │   ├── migrations/
│   │   │   │   │   ├── 100_create_npd_projects.sql
│   │   │   │   │   ├── 101_create_npd_formulations.sql
│   │   │   │   │   ├── 102_create_npd_formulation_items.sql
│   │   │   │   │   ├── 103_create_npd_costing.sql
│   │   │   │   │   ├── 104_create_npd_risks.sql
│   │   │   │   │   ├── 105_create_npd_documents.sql
│   │   │   │   │   ├── 106_create_npd_events.sql
│   │   │   │   │   ├── 107_create_npd_handoff_sessions.sql
│   │   │   │   │   ├── 108_modify_work_orders_for_npd.sql
│   │   │   │   │   ├── 109_modify_products_for_npd.sql
│   │   │   │   │   ├── 110_modify_boms_for_npd.sql
│   │   │   │   │   ├── 111_modify_production_outputs_for_npd.sql
│   │   │   │   │   ├── 112_create_versioning_functions.sql   # Shared PL/pgSQL functions
│   │   │   │   │   ├── 113_add_org_enabled_modules.sql       # Feature flag column
├── packages/
│   ├── shared/
│   │   ├── schemas/
│   │   │   ├── npd.ts                             # Zod schemas (NPDProjectSchema, FormulationSchema, etc.)
├── supabase/
│   ├── functions/
│   │   ├── npd-event-processor/                   # Edge Function (event listener + handler)
│   │   │   └── index.ts
├── docs/
│   ├── MonoPilot-NPD-Module-PRD-2025-11-15.md     # Product Requirements Document
│   ├── NPD-Module-Architecture-2025-11-15.md      # This document
│   ├── brainstorming-npd-module-2025-11-15.md     # Brainstorming session results
```

## Epic to Architecture Mapping

| Epic                               | Architecture Components                             | Database Tables                          | API Classes              | UI Pages                                                  | Integration Points                                 |
| ---------------------------------- | --------------------------------------------------- | ---------------------------------------- | ------------------------ | --------------------------------------------------------- | -------------------------------------------------- |
| **NPD-1: Core Project Management** | NPDContext, ProjectCard, Dashboard                  | npd_projects                             | NPDProjectsAPI           | /npd (Kanban), /npd/projects, /npd/projects/[id]          | audit_log (reused)                                 |
| **NPD-2: Formulation Versioning**  | FormulationEditor, VersionTimeline, AllergenDisplay | npd_formulations, npd_formulation_items  | FormulationsAPI          | /npd/projects/[id]/formulation                            | VersioningService (shared), allergens (reused)     |
| **NPD-3: Handoff Wizard**          | HandoffWizard (5 steps), Event Processor            | npd_handoff_sessions, npd_events         | HandoffAPI, NPDEventsAPI | /npd/projects/[id]/handoff                                | ProductsAPI, BomsAPI, WorkOrdersAPI (event-driven) |
| **NPD-4: Costing & Compliance**    | CostingCalculator, DocumentUpload                   | npd_costing, npd_documents               | CostingAPI               | /npd/projects/[id]/costing, /npd/projects/[id]/compliance | Supabase Storage                                   |
| **NPD-5: Risk & Approvals**        | RiskMatrix, GateChecklist                           | npd_risks, approvals (reused)            | GateReviewsAPI           | /npd/projects/[id] (tabs)                                 | approvals table (reused)                           |
| **NPD-6: Database Schema**         | Migrations, RLS policies, triggers                  | All 8 npd\_\* tables + 4 modified tables | VersioningService        | N/A                                                       | org_settings (feature flags)                       |
| **NPD-7: E2E Testing**             | Playwright test specs                               | N/A                                      | All NPD APIs             | All NPD pages                                             | N/A                                                |

## Technology Stack Details

### Core Technologies

**Frontend:**

- Next.js 15 (App Router)
- React 19
- TypeScript 5.7
- Tailwind CSS 3.4

**Backend/Database:**

- Supabase (PostgreSQL 15+, Auth, RLS, Storage, Realtime)
- Edge Functions (Deno runtime)

**State Management:**

- React Context (global NPD state)
- SWR 2.x (data fetching, caching, optimistic updates)

**Validation:**

- Zod schemas (packages/shared/schemas/npd.ts)

**Testing:**

- Playwright (E2E tests)
- Vitest (unit tests)

**Package Manager:**

- pnpm 8.15 (monorepo)

### Integration Points

**NPD → Production Integration (Event-Driven):**

```typescript
// NPD emits event
await NPDEventsAPI.emit({
  type: 'NPD.HandoffRequested',
  payload: {
    projectId: '...',
    formulation: {...},
    productDecision: {...}
  }
});

// Edge Function processes event
// supabase/functions/npd-event-processor/index.ts
Deno.serve(async (req) => {
  const event = await req.json();

  if (event.type === 'NPD.HandoffRequested') {
    const { formulation, productDecision } = event.payload;

    // Create Product
    const product = await ProductsAPI.create(productDecision);

    // Create BOM (inherit from formulation)
    const bom = await BomsAPI.create({
      product_id: product.id,
      npd_formulation_id: formulation.id,
      source: 'npd_handoff'
    });

    // Create Pilot WO (optional)
    if (pilotWO) {
      await WorkOrdersAPI.create({
        type: 'pilot',
        npd_project_id: projectId
      });
    }

    // Mark event completed
    await NPDEventsAPI.markCompleted(event.id);
  }
});
```

**NPD → Shared Services:**

- `VersioningService` (shared with BOM versioning)
- `audit_log` table (reused for NPD actions)
- `approvals` table (reused for gate reviews)
- `allergens` table (reused for formulation allergen aggregation)
- Supabase Storage (reused for NPD documents)

**Feature Flag Integration:**

```typescript
// Middleware check
export async function middleware(req: NextRequest) {
  const org = await getOrganization(req);

  if (req.nextUrl.pathname.startsWith('/npd')) {
    if (!org.enabled_modules.includes('npd')) {
      return NextResponse.redirect('/403'); // Module not enabled
    }
  }
}

// API check
class NPDProjectsAPI {
  static async create(input: CreateNPDProject) {
    const org = await getOrganization();
    if (!org.enabled_modules.includes('npd')) {
      throw new Error('NPD Module not enabled');
    }
    // ... proceed
  }
}
```

## Novel Pattern Designs

### 1. Temporal Versioning Pattern (Multi-Version Formulations)

**Purpose:** Enable multiple formulation versions with date-based effective ranges, preventing overlaps and ensuring immutability after approval.

**Components:**

**Database Schema:**

```sql
CREATE TABLE npd_formulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id),
  version TEXT NOT NULL, -- "1.0", "1.1", "2.0"
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status TEXT CHECK (status IN ('draft', 'approved', 'superseded')) DEFAULT 'draft',
  locked_at TIMESTAMPTZ, -- Immutability timestamp
  org_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent overlapping date ranges for same project
  EXCLUDE USING gist (
    npd_project_id WITH =,
    tstzrange(effective_from, effective_to, '[)') WITH &&
  )
);

-- Trigger: Lock formulation on approval (immutable snapshot)
CREATE OR REPLACE FUNCTION lock_formulation_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.locked_at = NOW();
  END IF;

  IF NEW.locked_at IS NOT NULL AND NEW.status = 'draft' THEN
    RAISE EXCEPTION 'Cannot unlock approved formulation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER formulation_lock_trigger
  BEFORE UPDATE ON npd_formulations
  FOR EACH ROW
  EXECUTE FUNCTION lock_formulation_on_approval();
```

**Lineage Tracking:**

```sql
CREATE TABLE npd_formulation_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_project_id UUID NOT NULL,
  from_version_id UUID REFERENCES npd_formulations(id),
  to_version_id UUID NOT NULL REFERENCES npd_formulations(id),
  change_type TEXT CHECK (change_type IN ('minor', 'major')),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**VersioningService (Shared with BOM):**

```typescript
export class VersioningService {
  // TypeScript wrapper (UI validation)
  static validateEffectiveDates(
    effectiveFrom: Date,
    effectiveTo: Date | null,
    existingVersions: Version[]
  ): ValidationResult {
    // Check overlaps
    const hasOverlap = existingVersions.some(
      v =>
        (effectiveFrom >= v.effective_from && effectiveFrom < v.effective_to) ||
        (effectiveTo &&
          effectiveTo > v.effective_from &&
          effectiveTo <= v.effective_to)
    );

    if (hasOverlap) {
      return {
        valid: false,
        error: 'Date range overlaps with existing version',
      };
    }

    return { valid: true };
  }

  static calculateNextVersion(
    currentVersion: string,
    changeType: 'major' | 'minor'
  ): string {
    const [major, minor] = currentVersion.split('.').map(Number);

    if (changeType === 'major') {
      return `${major + 1}.0`;
    } else {
      return `${major}.${minor + 1}`;
    }
  }

  // Immutability check
  static isLocked(formulation: Formulation): boolean {
    return formulation.locked_at !== null;
  }
}
```

**Usage in Epic NPD-2:**

```typescript
// Create new formulation version
const nextVersion = VersioningService.calculateNextVersion('1.0', 'minor'); // "1.1"

const validation = VersioningService.validateEffectiveDates(
  new Date('2025-12-01'),
  new Date('2026-06-01'),
  existingVersions
);

if (!validation.valid) {
  showError(validation.error);
  return;
}

// Database trigger will enforce again (defense in depth)
await FormulationsAPI.create({
  version: nextVersion,
  effective_from: '2025-12-01',
  effective_to: '2026-06-01',
});
```

### 2. Strategy Pattern + Feature Flag Router (Dual-Mode Handoff)

**Purpose:** Same handoff wizard UI, different execution strategies based on organization's enabled modules.

**Components:**

**Strategy Interface:**

```typescript
interface HandoffStrategy {
  execute(session: HandoffSession): Promise<HandoffResult>;
}

class TransferStrategy implements HandoffStrategy {
  async execute(session: HandoffSession): Promise<HandoffResult> {
    // Path A: Create Product + BOM + Pilot WO
    const event = await NPDEventsAPI.emit({
      type: 'NPD.HandoffRequested',
      payload: session.data,
    });

    return {
      success: true,
      type: 'transfer',
      eventId: event.id,
      message: 'Handoff initiated. Creating Product, BOM, and Pilot WO...',
    };
  }
}

class ExportStrategy implements HandoffStrategy {
  async execute(session: HandoffSession): Promise<HandoffResult> {
    // Path B: Generate Excel/PDF export
    const exportFile = await NPDExportAPI.generateExport(session.data, 'excel');

    return {
      success: true,
      type: 'export',
      fileUrl: exportFile.url,
      message: 'Project exported successfully. Download link generated.',
    };
  }
}
```

**Strategy Router:**

```typescript
class HandoffAPI {
  static async executeHandoff(sessionId: string): Promise<HandoffResult> {
    const session = await this.getSession(sessionId);
    const org = await getOrganization();

    // Select strategy based on feature flags
    const strategy: HandoffStrategy = org.enabled_modules.includes('production')
      ? new TransferStrategy()
      : new ExportStrategy();

    // Execute selected strategy
    const result = await strategy.execute(session);

    // Update session status
    await this.updateSessionStatus(sessionId, 'completed', result);

    return result;
  }
}
```

**Usage in Epic NPD-3:**

- Wizard UI is identical for both modes
- Step 5 (Execute) calls `HandoffAPI.executeHandoff(sessionId)`
- Router determines strategy at runtime
- User sees different success messages:
  - Transfer: "Product created! Pilot WO scheduled."
  - Export: "Download ready: project_export.xlsx"

### 3. Domain Events + Outbox Pattern (Event-Driven Integration)

**Purpose:** Reliable, retryable, auditable integration between NPD and Production modules.

**Components:**

**Outbox Table:**

```sql
CREATE TABLE npd_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'NPD.HandoffRequested', 'NPD.FormulationLocked'
  payload JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  error_message TEXT,
  sequence_number BIGSERIAL, -- Ordering guarantee
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Trigger: Notify on new event
CREATE OR REPLACE FUNCTION notify_npd_event() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('npd_events', NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER npd_events_notify
  AFTER INSERT ON npd_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_npd_event();
```

**Event Processor (Edge Function):**

```typescript
// supabase/functions/npd-event-processor/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async req => {
  const event = await req.json();
  const supabase = createClient(/* ... */);

  try {
    // Update status to processing
    await supabase
      .from('npd_events')
      .update({ status: 'processing' })
      .eq('id', event.id);

    // Handle event
    if (event.type === 'NPD.HandoffRequested') {
      await handleHandoff(event.payload);
    }

    // Mark completed
    await supabase
      .from('npd_events')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', event.id);

    return new Response('Event processed', { status: 200 });
  } catch (error) {
    // Mark failed + increment retry
    await supabase
      .from('npd_events')
      .update({
        status: 'failed',
        error_message: error.message,
        retry_count: event.retry_count + 1,
      })
      .eq('id', event.id);

    return new Response('Event failed', { status: 500 });
  }
});

async function handleHandoff(payload: any) {
  // Create Product, BOM, WO
  // ... implementation
}
```

**Retry Mechanism (Scheduled Job):**

```typescript
// Cron job: Every 5 minutes, retry failed events
const failedEvents = await supabase
  .from('npd_events')
  .select('*')
  .eq('status', 'failed')
  .lt('retry_count', 3);

for (const event of failedEvents) {
  await pg_notify('npd_events', event.id);
}
```

**Usage in Epic NPD-3:**

- Handoff wizard emits event (transactionally with session update)
- Edge Function processes asynchronously
- User sees progress via session status polling
- If failure: Event stays in `failed` status, retry mechanism activates
- Admin UI shows failed events for manual investigation

## Implementation Patterns

### Naming Conventions

**Database:**

- Tables: `snake_case` with `npd_` prefix (`npd_projects`, `npd_formulations`)
- Columns: `snake_case` (`effective_from`, `target_launch_date`, `retry_count`)
- Foreign keys: `{table}_id` (`npd_project_id`, `owner_id`, `npd_formulation_id`)
- Enums: `lowercase_with_underscores` (`idea`, `feasibility`, `business_case`, `development`, `testing`, `launched`)

**TypeScript/API:**

- API Classes: `PascalCase` + `API` suffix (`NPDProjectsAPI`, `FormulationsAPI`, `HandoffAPI`)
- Types: `PascalCase` (`NPDProject`, `Formulation`, `HandoffSession`, `GateReview`)
- Functions: `camelCase` (`createProject`, `advanceGate`, `validateDates`, `executeHandoff`)
- Enums: `PascalCase` values (`Gate.G0`, `Gate.G1`, `FormulationStatus.Draft`)

**React Components:**

- Components: `PascalCase` (`ProjectCard`, `HandoffWizard`, `FormulationEditor`, `AllergenDisplay`)
- Files: Match component name (`ProjectCard.tsx`, `HandoffWizard.tsx`)
- Folders: Component name for complex components (`HandoffWizard/`, contains ValidationStep.tsx, etc.)

**Routes:**

- URL paths: `kebab-case` (`/npd/projects/[id]/formulation`, `/npd/projects/[id]/handoff`)

### Code Organization

**File Co-location:**

```
apps/frontend/
├── app/(authenticated)/npd/          # Pages (co-located with route)
├── components/NPD/                   # NPD-specific components
├── lib/
│   ├── api/                          # API classes
│   ├── services/                     # Shared utilities (VersioningService)
│   ├── hooks/                        # Custom React hooks
│   ├── contexts/                     # React Context providers
```

**Import Order (Enforced):**

```typescript
// 1. React/Next imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { useSWR } from 'swr';

// 3. Internal API classes
import { NPDProjectsAPI } from '@/lib/api/NPDProjectsAPI';
import { FormulationsAPI } from '@/lib/api/FormulationsAPI';

// 4. Components
import { ProjectCard } from '@/components/NPD/ProjectCard';
import { Button } from '@/components/shared/Button';

// 5. Types
import type { NPDProject, Formulation } from '@/lib/types';

// 6. Styles (if any)
import styles from './styles.module.css';
```

### Consistency Rules

**API Response Format (All NPD APIs MUST follow):**

```typescript
// Success
{
  data: NPDProject | NPDProject[],
  error: null
}

// Error
{
  data: null,
  error: {
    message: string,
    code?: string
  }
}
```

**Error Handling Pattern:**

```typescript
// API Layer (MUST catch and transform errors)
class NPDProjectsAPI {
  static async create(
    input: CreateNPDProject
  ): Promise<ApiResponse<NPDProject>> {
    try {
      const { data, error } = await supabase
        .from('npd_projects')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      // Log to audit_log
      await AuditLogAPI.log({
        action: 'npd_project_created',
        entity_type: 'npd_project',
        entity_id: data.id,
      });

      return { data, error: null };
    } catch (error) {
      console.error('[NPDProjectsAPI.create]', error);

      return {
        data: null,
        error: {
          message: 'Failed to create project',
          code: error.code,
        },
      };
    }
  }
}

// UI Layer (MUST check error before using data)
const handleCreate = async (input: CreateNPDProject) => {
  const result = await NPDProjectsAPI.create(input);

  if (result.error) {
    toast.error(result.error.message);
    return;
  }

  // Success path
  toast.success('Project created!');
  router.push(`/npd/projects/${result.data.id}`);
};
```

**Date Handling Pattern:**

```typescript
// Storage: ALWAYS UTC (ISO 8601 strings)
const formulation = {
  effective_from: new Date('2025-12-01').toISOString(), // "2025-12-01T00:00:00.000Z"
  effective_to: new Date('2026-06-01').toISOString()
};

// Display: Browser timezone (Intl.DateTimeFormat)
const formatDate = (isoString: string) => {
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoString));
};

// Usage
<p>Effective: {formatDate(formulation.effective_from)}</p>
// Output: "1 gru 2025, 01:00" (if user timezone is CET)
```

**Versioning Pattern:**

```typescript
// Semantic versioning for formulations
// Format: "major.minor"
// Examples:
//   "1.0" - Initial formulation
//   "1.1" - Minor change (ingredient qty adjustment)
//   "2.0" - Major change (complete recipe overhaul)

// MUST use VersioningService for version calculation
const currentVersion = '1.0';
const nextVersion = VersioningService.calculateNextVersion(
  currentVersion,
  'minor' // 'major' | 'minor'
);
// Result: "1.1"
```

**RLS Enforcement (CRITICAL):**

```typescript
// ✅ CORRECT: Use Supabase client (auto-applies RLS policies)
const { data } = await supabase.from('npd_projects').select('*');

// ❌ WRONG: Direct SQL query bypasses RLS
const projects = await db.query('SELECT * FROM npd_projects');
```

**Feature Flag Check Pattern:**

```typescript
// Middleware (route-level check)
export async function middleware(req: NextRequest) {
  const org = await getOrganization(req);

  if (req.nextUrl.pathname.startsWith('/npd')) {
    if (!org.enabled_modules.includes('npd')) {
      return NextResponse.redirect(new URL('/403', req.url));
    }
  }
}

// API (method-level check)
class NPDProjectsAPI {
  static async create(input: CreateNPDProject) {
    const org = await getOrganization();

    if (!org.enabled_modules.includes('npd')) {
      return {
        data: null,
        error: { message: 'NPD Module not enabled for this organization' },
      };
    }

    // ... proceed with creation
  }
}
```

**Optimistic Updates Pattern (SWR):**

```typescript
function NPDDashboard() {
  const { data: projects, mutate } = useSWR('/npd/projects', () =>
    NPDProjectsAPI.getAll()
  );

  const createProject = async (input: CreateNPDProject) => {
    // Optimistic update (instant UI)
    const optimisticProject = {
      id: 'temp-' + Date.now(),
      ...input,
      status: 'idea',
      current_gate: 'G0',
    };

    mutate(
      async currentProjects => {
        const result = await NPDProjectsAPI.create(input);

        if (result.error) {
          toast.error(result.error.message);
          return currentProjects; // Revert on error
        }

        return [...currentProjects, result.data]; // Real data
      },
      {
        optimisticData: [...projects, optimisticProject], // Show immediately
        revalidate: false, // Don't refetch until mutation completes
      }
    );
  };
}
```

## Data Architecture

### NPD Module Tables (8 new tables)

**1. npd_projects**

```sql
CREATE TABLE npd_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  project_number TEXT NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('idea', 'feasibility', 'business_case', 'development', 'testing', 'launched', 'cancelled')) DEFAULT 'idea',
  current_gate TEXT CHECK (current_gate IN ('G0', 'G1', 'G2', 'G3', 'G4')) DEFAULT 'G0',
  target_launch_date DATE,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  portfolio_category TEXT,
  owner_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, project_number)
);

CREATE INDEX idx_npd_projects_org_id ON npd_projects(org_id);
CREATE INDEX idx_npd_projects_status ON npd_projects(status);
CREATE INDEX idx_npd_projects_owner_id ON npd_projects(owner_id);
```

**2. npd_formulations**

```sql
CREATE TABLE npd_formulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  status TEXT CHECK (status IN ('draft', 'approved', 'superseded')) DEFAULT 'draft',
  locked_at TIMESTAMPTZ,
  notes TEXT,
  org_id UUID NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent overlapping date ranges
  EXCLUDE USING gist (
    npd_project_id WITH =,
    tstzrange(effective_from, effective_to, '[)') WITH &&
  )
);

CREATE INDEX idx_npd_formulations_project_id ON npd_formulations(npd_project_id);
CREATE INDEX idx_npd_formulations_status ON npd_formulations(status);
```

**3. npd_formulation_items**

```sql
CREATE TABLE npd_formulation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_formulation_id UUID NOT NULL REFERENCES npd_formulations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  qty DECIMAL(10,3) NOT NULL,
  uom TEXT NOT NULL,
  sequence INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_npd_formulation_items_formulation_id ON npd_formulation_items(npd_formulation_id);
```

**4. npd_costing**

```sql
CREATE TABLE npd_costing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  target_cost DECIMAL(10,2),
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  variance_pct DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN target_cost > 0 THEN ((actual_cost - target_cost) / target_cost * 100) ELSE NULL END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_npd_costing_project_id ON npd_costing(npd_project_id);
```

**5. npd_risks**

```sql
CREATE TABLE npd_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  risk_description TEXT NOT NULL,
  likelihood TEXT CHECK (likelihood IN ('low', 'medium', 'high')) DEFAULT 'medium',
  impact TEXT CHECK (impact IN ('low', 'medium', 'high')) DEFAULT 'medium',
  risk_score INT GENERATED ALWAYS AS (
    (CASE likelihood WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END) *
    (CASE impact WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END)
  ) STORED,
  mitigation_plan TEXT,
  owner_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('open', 'mitigated', 'accepted')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_npd_risks_project_id ON npd_risks(npd_project_id);
CREATE INDEX idx_npd_risks_risk_score ON npd_risks(risk_score DESC);
```

**6. npd_documents**

```sql
CREATE TABLE npd_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('formulation', 'trial', 'compliance', 'label', 'other')) DEFAULT 'other',
  version INT DEFAULT 1,
  file_size_bytes BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

CREATE INDEX idx_npd_documents_project_id ON npd_documents(npd_project_id);
CREATE INDEX idx_npd_documents_file_type ON npd_documents(file_type);
```

**7. npd_events**

```sql
CREATE TABLE npd_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  error_message TEXT,
  sequence_number BIGSERIAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_npd_events_status ON npd_events(status) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_npd_events_sequence ON npd_events(sequence_number);
```

**8. npd_handoff_sessions**

```sql
CREATE TABLE npd_handoff_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id),
  current_step INT DEFAULT 1,
  validation_results JSONB,
  product_decision JSONB,
  bom_preview JSONB,
  pilot_wo_options JSONB,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_npd_handoff_sessions_project_id ON npd_handoff_sessions(npd_project_id);
CREATE INDEX idx_npd_handoff_sessions_status ON npd_handoff_sessions(status);
```

### Modified Existing Tables (4 tables)

**1. work_orders (add pilot support)**

```sql
ALTER TABLE work_orders
ADD COLUMN type TEXT CHECK (type IN ('production', 'pilot')) DEFAULT 'production',
ADD COLUMN npd_project_id UUID REFERENCES npd_projects(id) ON DELETE SET NULL;

CREATE INDEX idx_work_orders_npd_project_id ON work_orders(npd_project_id);
```

**2. products (add NPD traceability)**

```sql
ALTER TABLE products
ADD COLUMN npd_project_id UUID REFERENCES npd_projects(id) ON DELETE SET NULL,
ADD COLUMN source TEXT CHECK (source IN ('direct', 'npd_handoff')) DEFAULT 'direct';

CREATE INDEX idx_products_npd_project_id ON products(npd_project_id);
```

**3. boms (add formulation traceability)**

```sql
ALTER TABLE boms
ADD COLUMN npd_formulation_id UUID REFERENCES npd_formulations(id) ON DELETE SET NULL,
ADD COLUMN source TEXT CHECK (source IN ('direct', 'npd_handoff')) DEFAULT 'direct';

CREATE INDEX idx_boms_npd_formulation_id ON boms(npd_formulation_id);
```

**4. production_outputs (add trial support)**

```sql
ALTER TABLE production_outputs
ADD COLUMN type TEXT CHECK (type IN ('production', 'trial')) DEFAULT 'production',
ADD COLUMN npd_trial_id UUID REFERENCES npd_projects(id) ON DELETE SET NULL;

CREATE INDEX idx_production_outputs_npd_trial_id ON production_outputs(npd_trial_id);
```

**5. org_settings (add feature flags)**

```sql
ALTER TABLE org_settings
ADD COLUMN enabled_modules TEXT[] DEFAULT ARRAY['production'];

CREATE INDEX idx_org_settings_enabled_modules ON org_settings USING GIN(enabled_modules);
```

### Relationships

```
npd_projects (1) ──< (M) npd_formulations
npd_formulations (1) ──< (M) npd_formulation_items
npd_formulation_items (M) ──> (1) products (reused)
npd_projects (1) ──< (M) npd_costing
npd_projects (1) ──< (M) npd_risks
npd_projects (1) ──< (M) npd_documents
npd_projects (1) ──< (M) npd_handoff_sessions
npd_projects (1) ──< (M) work_orders (type='pilot')
npd_projects (1) ──< (M) products (source='npd_handoff')
npd_formulations (1) ──< (M) boms (source='npd_handoff')
```

## API Contracts

### NPDProjectsAPI

```typescript
class NPDProjectsAPI {
  // CRUD Operations
  static async getAll(filters?: {
    status?: string;
    owner_id?: string;
    portfolio_category?: string;
  }): Promise<ApiResponse<NPDProject[]>>;

  static async getById(id: string): Promise<ApiResponse<NPDProject>>;

  static async create(input: {
    project_name: string;
    description?: string;
    target_launch_date?: string;
    priority?: 'high' | 'medium' | 'low';
    portfolio_category?: string;
  }): Promise<ApiResponse<NPDProject>>;

  static async update(
    id: string,
    updates: Partial<NPDProject>
  ): Promise<ApiResponse<NPDProject>>;

  static async delete(id: string): Promise<ApiResponse<void>>;

  // Gate Management
  static async advanceGate(
    id: string,
    toGate: 'G1' | 'G2' | 'G3' | 'G4'
  ): Promise<ApiResponse<NPDProject>>;

  static async cancel(
    id: string,
    reason: string
  ): Promise<ApiResponse<NPDProject>>;
}
```

### FormulationsAPI

```typescript
class FormulationsAPI {
  static async getByProject(
    projectId: string
  ): Promise<ApiResponse<Formulation[]>>;

  static async getById(id: string): Promise<ApiResponse<Formulation>>;

  static async create(input: {
    npd_project_id: string;
    version: string;
    effective_from: string;
    effective_to?: string;
  }): Promise<ApiResponse<Formulation>>;

  static async update(
    id: string,
    updates: Partial<Formulation>
  ): Promise<ApiResponse<Formulation>>;

  static async lock(id: string): Promise<ApiResponse<Formulation>>;

  static async addItem(input: {
    npd_formulation_id: string;
    product_id: string;
    qty: number;
    uom: string;
  }): Promise<ApiResponse<FormulationItem>>;

  static async removeItem(itemId: string): Promise<ApiResponse<void>>;

  static async getAggregatedAllergens(
    formulationId: string
  ): Promise<ApiResponse<string[]>>;
}
```

### HandoffAPI

```typescript
class HandoffAPI {
  // Wizard Session Management
  static async startWizard(
    projectId: string
  ): Promise<ApiResponse<HandoffSession>>;

  static async getSession(
    sessionId: string
  ): Promise<ApiResponse<HandoffSession>>;

  // Step-by-Step Execution
  static async validateStep(
    sessionId: string
  ): Promise<ApiResponse<ValidationResult>>;

  static async productDecisionStep(
    sessionId: string,
    decision: {
      type: 'new' | 'version';
      product_id?: string;
      product_name?: string;
      standard_cost?: number;
    }
  ): Promise<ApiResponse<HandoffSession>>;

  static async bomTransferStep(
    sessionId: string
  ): Promise<ApiResponse<BOMPreview>>;

  static async pilotWOStep(
    sessionId: string,
    options?: {
      create: boolean;
      qty?: number;
      routing_id?: string;
    }
  ): Promise<ApiResponse<HandoffSession>>;

  // Final Execution (Transactional)
  static async executeHandoff(
    sessionId: string
  ): Promise<ApiResponse<HandoffResult>>;

  // Alternative Path (NPD-only mode)
  static async exportProject(
    projectId: string,
    format: 'excel' | 'pdf'
  ): Promise<ApiResponse<{ fileUrl: string }>>;
}
```

### NPDEventsAPI

```typescript
class NPDEventsAPI {
  static async emit(event: {
    type: string;
    payload: any;
  }): Promise<ApiResponse<NPDEvent>>;

  static async markCompleted(eventId: string): Promise<ApiResponse<void>>;

  static async markFailed(
    eventId: string,
    errorMessage: string
  ): Promise<ApiResponse<void>>;

  static async getFailedEvents(): Promise<ApiResponse<NPDEvent[]>>;

  static async retryEvent(eventId: string): Promise<ApiResponse<void>>;
}
```

### NotificationsAPI

```typescript
class NotificationsAPI {
  /**
   * Subscribe to NPD notifications for current user's org
   * Called once in NPD layout component
   * Implementation uses useNPDNotifications hook
   */
  static subscribe(orgId: string, userId: string): void;

  /**
   * Dismiss notification (mark as read in audit_log)
   */
  static async dismiss(notificationId: string): Promise<ApiResponse<void>>;

  /**
   * Get notification history from audit_log
   * Returns notifications sorted by created_at DESC
   */
  static async getHistory(
    orgId: string,
    userId: string,
    limit?: number
  ): Promise<ApiResponse<AuditLogEntry[]>>;
}
```

## Security Architecture

### Authentication

**Supabase Auth (Session-Based JWT):**

- All `/npd/*` routes protected by middleware
- JWT contains: `user_id`, `org_id`, `role`
- Session refresh automatic (middleware)

### Authorization (RBAC)

**NPD-Specific Roles:**

- `NPD Lead`: Full access (create, edit, delete projects, approve gates)
- `R&D`: Create/edit formulations, view projects
- `Regulatory`: View compliance checklists, upload docs
- `Finance`: View/approve costing
- `Production`: View projects in handoff stage (read-only)

**Implementation:**

```typescript
// Check role in API
class NPDProjectsAPI {
  static async delete(id: string) {
    const user = await getCurrentUser();

    if (user.role !== 'NPD Lead' && user.role !== 'Admin') {
      return {
        data: null,
        error: { message: 'Insufficient permissions' },
      };
    }

    // ... proceed with delete
  }
}
```

### Row-Level Security (RLS)

**All npd\_\* tables have org_id isolation:**

```sql
ALTER TABLE npd_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY npd_projects_org_isolation ON npd_projects
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Repeat for: npd_formulations, npd_formulation_items, npd_costing,
-- npd_risks, npd_documents, npd_events, npd_handoff_sessions
```

### Data Protection

**Sensitive Data:**

- Formulations: Access logged in `audit_log` (IP protection)
- Costing: Only Finance + NPD Lead can view
- Documents: RLS on Supabase Storage (path-based policies)

**Audit Logging:**

```typescript
await AuditLogAPI.log({
  action: 'npd_formulation_viewed',
  entity_type: 'npd_formulation',
  entity_id: formulation.id,
  user_id: currentUser.id,
  org_id: currentOrg.id,
  details: { version: formulation.version },
});
```

## Performance Considerations

### Caching Strategy

**SWR Configuration:**

```typescript
// Default cache config
const swrConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
};

// Per-resource overrides
useSWR('/npd/projects', NPDProjectsAPI.getAll, {
  ...swrConfig,
  refreshInterval: 60000, // 1 minute auto-refresh
});
```

**Performance Targets:**

- Dashboard load: <500ms (p95)
- Formulation detail: <300ms (p95)
- Handoff validation: <2s
- Handoff execution: <5s (transactional)

### Database Optimization

**Indexes:**

- All foreign keys indexed
- Status columns indexed (filtered queries)
- Composite index on `(org_id, status)` for dashboard queries

**Query Optimization:**

```typescript
// ✅ Efficient (single query with join)
const projectWithFormulations = await supabase
  .from('npd_projects')
  .select(
    `
    *,
    formulations:npd_formulations(*)
  `
  )
  .eq('id', projectId)
  .single();

// ❌ Inefficient (N+1 queries)
const project = await supabase
  .from('npd_projects')
  .select('*')
  .eq('id', projectId)
  .single();
const formulations = await supabase
  .from('npd_formulations')
  .select('*')
  .eq('npd_project_id', projectId);
```

### Event Processing Optimization

**Batch Processing (for high-volume events):**

```typescript
// Process events in batches of 10
const pendingEvents = await supabase
  .from('npd_events')
  .select('*')
  .eq('status', 'pending')
  .limit(10);

await Promise.all(pendingEvents.map(event => processEvent(event)));
```

## Deployment Architecture

### Infrastructure

**Supabase (Managed):**

- PostgreSQL database (primary + read replicas)
- Edge Functions (Deno runtime)
- Storage (documents)
- Realtime (pg_notify subscriptions)

**Vercel (Frontend):**

- Next.js app deployment
- Edge runtime for middleware
- Serverless functions for API routes

### Environment Configuration

**Environment Variables:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb... (server-side only)

# Feature Flags (optional override)
FEATURE_NPD_MODULE_DEFAULT=false
```

### Deployment Strategy

**Migrations:**

1. Run migrations on staging (test data)
2. Run E2E tests
3. Run migrations on production
4. Deploy Edge Function (`npd-event-processor`)
5. Deploy Next.js app (zero-downtime)

**Rollback Plan:**

- Database: Rollback migrations (113 → 099)
- Edge Function: Redeploy previous version
- Next.js: Revert deployment (Vercel instant rollback)

## Development Environment

### Prerequisites

- Node.js 20+
- pnpm 8.15+
- Supabase CLI
- Git

### Setup Commands

```bash
# 1. Install dependencies
pnpm install

# 2. Setup Supabase (local development)
npx supabase init
npx supabase start

# 3. Run migrations
npx supabase db reset

# 4. Generate TypeScript types
SUPABASE_PROJECT_ID=xxx pnpm gen-types

# 5. Start development server
pnpm frontend:dev

# 6. Run tests
pnpm test:unit
pnpm test:e2e:npd
```

### Local Development Workflow

1. Create feature branch: `git checkout -b npd/feature-name`
2. Implement changes (follow Implementation Patterns)
3. Run type-check: `pnpm type-check`
4. Run tests: `pnpm test:unit`, `pnpm test:e2e:npd`
5. Update docs: `pnpm docs:update` (if API/DB changes)
6. Commit: `git commit -m "feat(npd): description"`
7. Push & create PR

## Architecture Decision Records (ADRs)

### ADR-001: Bounded Context over Microservices

**Context:** NPD Module needs isolation from Production modules but shared infrastructure.

**Decision:** Implement NPD as bounded context within monolith (separate `npd_*` tables, optional integration).

**Rationale:**

- Simpler deployment (single codebase)
- Suitable for SME customers (no distributed systems complexity)
- Can evolve to microservices later if needed
- Event-driven integration provides loose coupling

**Consequences:**

- ✅ Easier development/testing
- ✅ Lower infrastructure costs
- ⚠️ Requires discipline (clear module boundaries)

### ADR-002: Event Sourcing for Handoff

**Context:** Handoff from NPD → Production must be reliable, auditable, retryable.

**Decision:** Implement outbox pattern with `npd_events` table + Edge Function processor.

**Rationale:**

- Transactional safety (event logged atomically with handoff session)
- Audit trail (compliance requirement: FSMA 204)
- Retry mechanism (failed handoffs don't require manual re-entry)
- Loose coupling (NPD doesn't call Production APIs directly)

**Consequences:**

- ✅ Reliable integration
- ✅ Full audit trail
- ⚠️ Async (user waits for event processing)
- ⚠️ Requires Edge Function monitoring

### ADR-003: Hybrid Versioning Service

**Context:** Formulation versioning logic must be consistent with BOM versioning, but also provide instant UI feedback.

**Decision:** PostgreSQL functions (triggers) + TypeScript wrapper.

**Rationale:**

- Database enforcement = cannot bypass (compliance critical)
- TypeScript wrapper = instant validation (UX)
- Shared functions = reusable (NPD + BOM use same logic)

**Consequences:**

- ✅ Strong guarantees (DB-enforced)
- ✅ Good UX (instant feedback)
- ⚠️ Logic in 2 places (but acceptable for validation)

### ADR-004: Server-Side Wizard State

**Context:** Handoff wizard has 5 steps, can take 2-5 minutes, user may refresh browser.

**Decision:** Store wizard state in `npd_handoff_sessions` table.

**Rationale:**

- Resumable (user can refresh and continue)
- Server-side validation (cannot skip steps)
- Audit trail (each step recorded)

**Consequences:**

- ✅ Better UX (resumable)
- ✅ Secure (server validates)
- ⚠️ More DB writes (acceptable trade-off)

### ADR-005: Feature Flags in Database

**Context:** NPD Module must be enable/disable per organization.

**Decision:** `org_settings.enabled_modules TEXT[]` column.

**Rationale:**

- Per-org control (not global)
- Query-able (can filter in DB)
- RLS friendly (org_id isolation)
- Future-proof (can add more modules: quality, shipping, iot)

**Consequences:**

- ✅ Flexible per-org
- ✅ No external dependency
- ⚠️ Requires deployment for new flags (acceptable)

### ADR-006: Notifications Architecture

**Context:** FR70-74 require real-time notifications for gate approvals, formulation locks, handoff completion, and cost variance alerts.

**Decision:** Use Supabase Realtime subscriptions + shadcn/ui Toast component for real-time notifications.

**Implementation:**

**1. Notification Types:**

```typescript
type NotificationType =
  | 'gate_approval_required' // When project reaches gate milestone
  | 'formulation_locked' // When formulation approved and locked
  | 'handoff_completed' // When handoff to Production succeeds
  | 'handoff_failed' // When handoff to Production fails (retry available)
  | 'cost_variance_alert' // When actual cost exceeds target by >10%
  | 'risk_threshold_exceeded' // When risk score > 8 (likelihood × impact)
  | 'document_approval_required'; // When regulatory document needs review
```

**2. Supabase Realtime Subscriptions:**

```typescript
// lib/hooks/useNPDNotifications.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useNPDNotifications(orgId: string, userId: string) {
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to npd_projects changes (gate approvals)
    const projectsChannel = supabase
      .channel('npd_projects_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'npd_projects',
          filter: `org_id=eq.${orgId}`,
        },
        payload => {
          // Check if status changed to gate milestone
          if (payload.new.status !== payload.old.status) {
            toast({
              title: 'Gate Milestone Reached',
              description: `Project "${payload.new.name}" is ready for ${payload.new.status} gate review`,
              variant: 'info',
            });
          }
        }
      )
      .subscribe();

    // Subscribe to npd_formulations changes (lock events)
    const formulationsChannel = supabase
      .channel('npd_formulations_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'npd_formulations',
          filter: `org_id=eq.${orgId}`,
        },
        payload => {
          if (payload.new.locked_at && !payload.old.locked_at) {
            toast({
              title: 'Formulation Locked',
              description: `Formulation v${payload.new.version} has been approved and locked`,
              variant: 'success',
            });
          }
        }
      )
      .subscribe();

    // Subscribe to npd_events (handoff completion)
    const eventsChannel = supabase
      .channel('npd_events_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'npd_events',
          filter: `org_id=eq.${orgId}`,
        },
        payload => {
          if (
            payload.new.status === 'completed' &&
            payload.new.type === 'handoff_to_production'
          ) {
            toast({
              title: 'Handoff Completed',
              description: 'NPD project successfully handed off to Production',
              variant: 'success',
            });
          } else if (
            payload.new.status === 'failed' &&
            payload.new.retry_count < 3
          ) {
            toast({
              title: 'Handoff Failed',
              description: `Handoff failed. Retry ${payload.new.retry_count}/3 will occur automatically`,
              variant: 'warning',
            });
          }
        }
      )
      .subscribe();

    // Subscribe to npd_costing (variance alerts)
    const costingChannel = supabase
      .channel('npd_costing_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'npd_costing',
          filter: `org_id=eq.${orgId}`,
        },
        payload => {
          // variance_pct is GENERATED column: (actual_cost - target_cost) / target_cost * 100
          if (payload.new.variance_pct > 10) {
            toast({
              title: 'Cost Variance Alert',
              description: `Project cost variance: ${payload.new.variance_pct.toFixed(1)}% over target`,
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    return () => {
      projectsChannel.unsubscribe();
      formulationsChannel.unsubscribe();
      eventsChannel.unsubscribe();
      costingChannel.unsubscribe();
    };
  }, [orgId, userId, toast]);
}
```

**3. Toast Component Usage (shadcn/ui):**

```typescript
// components/ui/use-toast.ts (already exists in MonoPilot)
// Variants: default, success, info, warning, destructive
toast({
  title: 'Notification Title',
  description: 'Notification message',
  variant: 'info', // blue
  duration: 5000, // 5 seconds
});
```

**4. Notification Persistence (audit_log integration):**

```sql
-- Trigger to persist notifications to audit_log
CREATE OR REPLACE FUNCTION log_npd_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    org_id,
    user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    created_at
  ) VALUES (
    NEW.org_id,
    current_setting('app.user_id')::UUID,
    TG_TABLE_NAME,
    NEW.id,
    'notification_sent',
    row_to_json(OLD),
    row_to_json(NEW),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to npd_projects, npd_formulations, npd_events, npd_costing
CREATE TRIGGER npd_projects_notification_trigger
  AFTER UPDATE ON npd_projects
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION log_npd_notification();

CREATE TRIGGER npd_formulations_notification_trigger
  AFTER UPDATE ON npd_formulations
  FOR EACH ROW
  WHEN (NEW.locked_at IS NOT NULL AND OLD.locked_at IS NULL)
  EXECUTE FUNCTION log_npd_notification();
```

**5. NotificationsAPI Class:**

```typescript
// lib/api/NotificationsAPI.ts
export class NotificationsAPI {
  /**
   * Subscribe to NPD notifications for current user's org
   * Called once in NPD layout component
   */
  static subscribe(orgId: string, userId: string): void {
    // Implementation in useNPDNotifications hook
  }

  /**
   * Dismiss notification (mark as read in audit_log)
   */
  static async dismiss(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('audit_log')
      .update({ metadata: { read: true } })
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Get notification history from audit_log
   */
  static async getHistory(
    orgId: string,
    userId: string,
    limit = 50
  ): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .eq('action', 'notification_sent')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
```

**Rationale:**

- **Leverages existing infrastructure:** Supabase Realtime already used in MonoPilot, no new dependencies
- **Consistent UX:** shadcn/ui Toast component already used in MonoPilot core (same visual style)
- **Compliance-friendly:** Notification persistence in audit_log table provides audit trail for FSMA 204
- **RLS-compatible:** Subscriptions filter by org_id, ensuring multi-tenant isolation
- **Low latency:** Realtime subscriptions provide <1s notification delivery (vs polling)

**Consequences:**

- ✅ Real-time notifications without polling overhead
- ✅ Full audit trail (compliance requirement)
- ✅ Consistent with MonoPilot patterns (shadcn/ui Toast)
- ✅ RLS-enforced security (org_id filtering)
- ⚠️ Supabase Realtime connection overhead (~1KB/connection, acceptable for <100 concurrent users)
- ⚠️ Requires cleanup job for old audit_log notifications (delete after 90 days)

**Database Migrations:**

- Migration 114: Add notification triggers (log_npd_notification function + 4 triggers)
- Migration 115: Add audit_log cleanup job (delete notifications >90 days old)

**RLS Policies:**

```sql
-- audit_log RLS policy (already exists, covers notifications)
CREATE POLICY audit_log_select_own_org ON audit_log
  FOR SELECT USING (org_id = current_setting('app.org_id')::UUID);
```

## --- tylko koment

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-15_
_Updated: 2025-11-16 (ADR-006 added per Solutioning Gate Check Condition 1)_
_For: Mariusz_
