  📝 ORCHESTRATOR Template Prompt (Do Przyszłego Użycia)

  # ═══════════════════════════════════════════════════════════════
  # ORCHESTRATOR - Story Implementation Prompt Template
  # ═══════════════════════════════════════════════════════════════
  # Usage: Uruchom dla dowolnej story, podając ID i opcjonalnie tracks
  # ═══════════════════════════════════════════════════════════════

  ORCHESTRATOR: Implement Story {{STORY_ID}} [{{STORY_NAME}}]

  ## Context
  - Story ID: {{STORY_ID}}  # np. "01.2", "01.6"
  - Epic: {{EPIC_ID}}-{{EPIC_NAME}}  # np. "01-settings"
  - Execution Mode: {{MODE}}  # "single-track" | "dual-track" | "quad-track"
  - Context Path: docs/2-MANAGEMENT/epics/current/{{EPIC_ID}}/context/{{STORY_ID}}/

  ## Read First (Priority Order)
  1. {{STORY_ID}}/_index.yaml     - metadata, dependencies, deliverables
  2. {{STORY_ID}}/tests.yaml      - acceptance criteria, test specs
  3. {{STORY_ID}}/database.yaml   - tables, RLS, migrations (if backend)
  4. {{STORY_ID}}/api.yaml        - endpoints, auth, patterns (if backend/fullstack)
  5. {{STORY_ID}}/frontend.yaml   - components, pages, hooks (if frontend/fullstack)

  ## Workflow (3-STORY-DELIVERY.md)
  Phase 1: UX Design (skip if type == backend)
    Agent: UX-DESIGNER
    Skip if: story.type == "backend"

  Phase 2: RED (Test First) - MANDATORY
    Agent: TEST-WRITER
    Read: tests.yaml
    Output: Unit tests + Integration tests (all failing)
    Exit: All tests written, all RED

  Phase 3: GREEN (Implementation) - MANDATORY
    Mode: {{TRACK_MODE}}

    Track A: Database (if has database.yaml)
      Agent: BACKEND-DEV
      Focus: Migrations, RLS policies, seed data
      Exit: Migrations applied, RLS tested

    Track B: Services (if has api.yaml)
      Agent: BACKEND-DEV
      Focus: Business logic, services
      Depends: Track A (if DB changes)
      Exit: Service tests GREEN

    Track C: API (if has api.yaml)
      Agent: BACKEND-DEV
      Focus: API routes
      Depends: Track B
      Exit: Integration tests GREEN

    Track D: Frontend (if has frontend.yaml)
      Agent: FRONTEND-DEV
      Focus: Components, pages, hooks
      Parallel: Can run with Track B/C
      Exit: Component tests GREEN

    Exit Criteria: ALL tests GREEN

  Phase 4: REFACTOR - MANDATORY
    Agent: SENIOR-DEV
    Checklist:
      - DRY violations
      - Pattern compliance (ADRs)
      - Performance optimization
    Can Parallel: With Phase 5

  Phase 5: CODE REVIEW - MANDATORY
    Agent: CODE-REVIEWER
    Checklist:
      - Security (RLS, auth, cross-tenant)
      - ADR compliance
      - Test coverage >= targets
    Can Parallel: With Phase 4

  Phase 6: QA VALIDATION - MANDATORY
    Agent: QA-AGENT
    Validate:
      - All acceptance criteria (from tests.yaml)
      - Multi-org scenarios (from fixtures)
      - Performance targets
    Exit: All AC PASS, no critical bugs

  Phase 7: DOCUMENTATION - MANDATORY
    Agent: TECH-WRITER
    Outputs:
      - API documentation (if backend)
      - Component docs (if frontend)
      - Developer guide
      - CHANGELOG entry

  ## Parallel Execution Rules
  - Phase 3 Tracks: A → D parallel, then B (after A+D), then C (after B)
  - Phase 4+5: PARALLEL (Refactor + Review)
  - Phase 6+7: SEQUENTIAL (QA → Docs)

  ## Update After Each Phase
  File: .claude/PROJECT-STATE.md
  Section: Current Session > Story {{STORY_ID}}
  Update:
    - Phase X completed timestamp
    - Agent name
    - Deliverables created
    - Tests status (RED/GREEN)
    - Handoff to next agent

  ## Handoff Template
  From: {{FROM_AGENT}}
  To: {{TO_AGENT}}
  Story: {{STORY_ID}} - {{STORY_NAME}}
  Phase: {{COMPLETED_PHASE}} → {{NEXT_PHASE}}
  Artifact: {{ARTIFACT_LIST}}
  Tests: {{TEST_STATUS}} (X/Y passing)
  Gaps: {{IDENTIFIED_GAPS}}
  Next Action: {{NEXT_PHASE_ACTION}}

  ## Example Usage

  ### Single Story, Single Track (Backend Only)
  ```bash
  ORCHESTRATOR: Implement Story 01.7 [Module Toggles]
  Context Path: docs/2-MANAGEMENT/epics/current/01-settings/context/01.7/
  Mode: single-track
  Type: backend

  Single Story, Quad Track (Full-stack)

  ORCHESTRATOR: Implement Story 01.5a [User Management CRUD MVP]
  Context Path: docs/2-MANAGEMENT/epics/current/01-settings/context/01.5a/
  Mode: quad-track
  Type: fullstack
  Tracks: A (DB), B (Services), C (API), D (Frontend) - parallel execution

  Dual Story, Dual Track (Parallel Stories)

  ORCHESTRATOR: Implement Stories 01.3 + 01.4
  Story 01.3: [Onboarding Wizard Launcher] - Track Alpha
  Story 01.4: [Organization Profile Step] - Track Beta
  Mode: dual-story
  Parallel: YES (independent stories, no file conflicts)

═══════════════════════════════════════════════════════════════





● Mam pełny obraz. Oto tabela statusu:

  📊 EPIC 03-PLANNING - Status Audit
  ┌────────┬────────────┬────────────┬────────┬───────────────────────────┐
  │ Story  │ Checkpoint │ Last Phase │ Status │          Action           │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.1   │ ✓          │ P7 ✓       │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.2   │ ✓          │ P7 ✓       │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.3   │ ✓          │ P7 ✓       │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.4   │ ✓          │ P7 ✓       │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.5a  │ ✓          │ P7 ✓       │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.5b  │ ✓          │ P7 ✓       │ DONE   │ E2E blocked by test setup │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.6   │ ✓          │ COMPLETE   │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.7   │ ✓          │ P7 ✓       │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.8   │ ✓          │ COMPLETE   │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.9a  │ ✓          │ COMPLETE   │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.9b  │ ✓          │ P7 ✓       │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.10  │ ✓          │ COMPLETE   │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.11a │ ✓          │ P7 ✓       │ DONE   │ 100%                      │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.11b │ ✓          │ P7 ✓       │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.12  │ ✓          │ COMPLETE   │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.13  │ ✓          │ P3 ✓       │ NEEDS  │ P4→P5→P6→P7               │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.14  │ ✓          │ DEFERRED   │ SKIP   │ Wymaga Epic 04+05         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.15  │ ✓          │ P7 ✓       │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.16  │ ✓          │ P7 ✓       │ DONE   │ -                         │
  ├────────┼────────────┼────────────┼────────┼───────────────────────────┤
  │ 03.17  │ ✓          │ P6 ✓       │ DONE   │ next_phase: NONE          │
  └────────┴────────────┴────────────┴────────┴───────────────────────────┘
  ---
  🔴 DO DOKOŃCZENIA

  Story 03.13 - WO Material Availability Check

  Stan: P3 backend DONE (82/82 tests) → potrzebuje:
  - P4 (senior-dev) - refactor lub skip
  - P5 (code-reviewer) - review
  - P6 (qa-agent) - QA/AC validation
  - P7 (tech-writer) - completion report

  ---
  ✅ PODSUMOWANIE
  ┌──────────────────┬─────────────────┐
  │    Kategoria     │      Ilość      │
  ├──────────────────┼─────────────────┤
  │ DONE             │ 17 stories      │
  ├──────────────────┼─────────────────┤
  │ NEEDS COMPLETION │ 1 story (03.13) │
  ├──────────────────┼─────────────────┤
  │ DEFERRED         │ 1 story (03.14) │
  ├──────────────────┼─────────────────┤
  │ TOTAL            │ 19 stories      │
  └──────────────────┴─────────────────┘
  Proces został przerwany po zakończeniu P3 dla story 03.13. Pozostaje do zrobienia P4→P7 dla tego jednego story.

  Chcesz żebym dokończył 03.13 (pozostałe fazy P4-P7)?