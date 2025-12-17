przymij role @/workspaces/MonoPilot/.claude/agents/ORCHESTRATOR.md i przeczytaj @.claude/PROJECT-STATE.md najpierw w katalogu 
@docs/2-MANAGEMENT/epics/current/01-settings/context/ mamy podkalagoli z contextem dla kazdej ze stories. zadania Zrob tak samo dla epic2. cotext musi byc rozbity na pod 
kategorie jak w epic1 mozesz uzyc @docs/2-MANAGEMENT/epics/current/01-settings/context/01.1/_index.yaml dla przykladu. uruchom falowo po 4 agentow do rozbicia wszystkich 
stories na context. wszystkie pliki md sa w katalogu 02-technical zapoznaj sie i przedstaw mi plan, nie przydzielaj wiecej niz jedna story do agenta zeby nie przeladowac 
jego contextu. w context powinnien tez zawierac odwolania do ux @docs/3-ARCHITECTURE/ux/wireframes/ 
  ⎿  Read .claude/agents/ORCHESTRATOR.md (308 lines)
  ⎿  Read .claude/PROJECT-STATE.md (530 lines)
  ⎿  Listed directory docs/2-MANAGEMENT/epics/current/01-settings/context/
  ⎿  Read docs/2-MANAGEMENT/epics/current/01-settings/context/01.1/_index.yaml (79 lines)
  ⎿  Listed directory docs/3-ARCHITECTURE/ux/wireframes/

● 🎯 Epic 02 Context Structure Creation

  Routing: → Task-based coordination with parallel agent waves

  Let me first explore the Epic 02 structure and prepare the execution plan.

● Bash(ls /workspaces/MonoPilot/docs/2-MANAGEMENT/epics/current/02-technical/)
  ⎿  02.0.epic-overview.md         
     02.0.test-strategy.md
     02.1.products-crud-types.md
     … +26 lines (ctrl+o to expand)

● Bash(ls /workspaces/MonoPilot/docs/3-ARCHITECTURE/ux/wireframes/ | grep "^TEC-")
  ⎿  TEC-001-products-list.md      
     TEC-002-product-modal.md
     TEC-003-materials-list.md
     … +17 lines (ctrl+o to expand)

● Read(docs/2-MANAGEMENT/epics/current/02-technical/02.0.epic-overview.md)
  ⎿  Read 664 lines

● Rozumiem zadanie. Przygotowuję plan stworzenia struktury context dla Epic 02.

● Bash(find /workspaces/MonoPilot/docs/2-MANAGEMENT/epics/current/02-technical/ -name "*.md" -type f | grep -E "02\.[0-9]+[ab]?\." | sort)
  ⎿  /workspaces/MonoPilot/docs/2-MANAGEMENT/epics/current/02-technical/02.0.epic-overview.md      
     /workspaces/MonoPilot/docs/2-MANAGEMENT/epics/current/02-technical/02.0.test-strategy.md
     /workspaces/MonoPilot/docs/2-MANAGEMENT/epics/current/02-technical/02.1.products-crud-types.md
     … +20 lines (ctrl+o to expand)

● Read(docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md)
  ⎿  Read 100 lines

● 📋 PLAN: Epic 02 Context Structure Creation

  Analiza struktury

  Stories do stworzenia context: 17 active stories
  - Main stories: 02.1, 02.2, 02.3, 02.4, 02.6, 02.7, 02.8, 02.9, 02.11, 02.12, 02.13, 02.14, 02.15 (13)
  - Split substories: 02.5a, 02.5b, 02.10a, 02.10b (4)

  Wireframes TEC-*: 19 wireframes (TEC-001 to TEC-017 + TEC-006a + TEC-008a)

  Story → Wireframe mapping:
  - 02.1 → TEC-001, TEC-002, TEC-003, TEC-004
  - 02.2 → TEC-002
  - 02.3 → TEC-010, TEC-012
  - 02.4 → TEC-005, TEC-006
  - 02.5a/02.5b → TEC-006a
  - 02.6 → TEC-005, TEC-006a
  - 02.7 → TEC-007, TEC-008
  - 02.8 → TEC-008a
  - 02.9 → TEC-013
  - 02.10a/02.10b → TEC-016, TEC-014
  - 02.11 → TEC-014
  - 02.12 → TEC-017
  - 02.13 → TEC-009, TEC-011
  - 02.14 → TEC-005, TEC-006
  - 02.15 → TEC-015

  ---
  🎯 Execution Plan (5 Waves)

  Struktura katalogów (do stworzenia)

  docs/2-MANAGEMENT/epics/current/02-technical/context/
  ├── 02.1/
  │   ├── _index.yaml       # Story metadata + dependencies
  │   ├── database.yaml     # Tables, RLS, seed data
  │   ├── api.yaml          # Endpoints, auth, errors
  │   ├── frontend.yaml     # Types, services, components
  │   └── tests.yaml        # Acceptance criteria, test specs
  ├── 02.2/
  ├── 02.3/
  ├── 02.4/
  ├── 02.5a/
  ├── 02.5b/
  ├── 02.6/
  ├── 02.7/
  ├── 02.8/
  ├── 02.9/
  ├── 02.10a/
  ├── 02.10b/
  ├── 02.11/
  ├── 02.12/
  ├── 02.13/
  ├── 02.14/
  └── 02.15/

  Wave 1: Products Foundation (4 agents)

  Stories: 02.1, 02.2, 02.3, 02.4

  | Agent       | Story | Name                         | Wireframes                         | Complexity |
  |-------------|-------|------------------------------|------------------------------------|------------|
  | architect-1 | 02.1  | Products CRUD + Types        | TEC-001, TEC-002, TEC-003, TEC-004 | M          |
  | architect-2 | 02.2  | Product Versioning + History | TEC-002                            | S          |
  | architect-3 | 02.3  | Product Allergens            | TEC-010, TEC-012                   | M          |
  | architect-4 | 02.4  | BOMs CRUD + Date Validity    | TEC-005, TEC-006                   | M          |

  Wave 2: BOM Items & Routings (4 agents)

  Stories: 02.5a, 02.5b, 02.6, 02.7

  | Agent       | Story | Name                          | Wireframes        | Complexity |
  |-------------|-------|-------------------------------|-------------------|------------|
  | architect-5 | 02.5a | BOM Items Core (MVP)          | TEC-006a          | M          |
  | architect-6 | 02.5b | BOM Items Advanced (Phase 1B) | TEC-006a          | M          |
  | architect-7 | 02.6  | BOM Alternatives + Clone      | TEC-005, TEC-006a | M          |
  | architect-8 | 02.7  | Routings CRUD                 | TEC-007, TEC-008  | M          |

  Wave 3: Operations & Traceability (4 agents)

  Stories: 02.8, 02.9, 02.10a, 02.10b

  | Agent        | Story  | Name                            | Wireframes       | Complexity |
  |--------------|--------|---------------------------------|------------------|------------|
  | architect-9  | 02.8   | Routing Operations              | TEC-008a         | L          |
  | architect-10 | 02.9   | BOM-Routing Costs               | TEC-013          | M          |
  | architect-11 | 02.10a | Traceability Configuration      | TEC-016, TEC-014 | M          |
  | architect-12 | 02.10b | Traceability Queries (DEFERRED) | TEC-016          | L          |

  Wave 4: Nutrition & Advanced (4 agents)

  Stories: 02.11, 02.12, 02.13, 02.14

  | Agent        | Story | Name                   | Wireframes       | Complexity |
  |--------------|-------|------------------------|------------------|------------|
  | architect-13 | 02.11 | Shelf Life Calculation | TEC-014          | M          |
  | architect-14 | 02.12 | Technical Dashboard    | TEC-017          | M          |
  | architect-15 | 02.13 | Nutrition Calculation  | TEC-009, TEC-011 | L          |
  | architect-16 | 02.14 | BOM Advanced Features  | TEC-005, TEC-006 | M          |

  Wave 5: Cost History (1 agent)

  Stories: 02.15

  | Agent        | Story | Name                    | Wireframes | Complexity |
  |--------------|-------|-------------------------|------------|------------|
  | architect-17 | 02.15 | Cost History + Variance | TEC-015    | S          |

  ---
  📦 Context YAML Template (Based on Epic 01)

  Każdy agent stworzy 5 plików YAML w folderze story:

  1. _index.yaml - Metadata, dependencies, technical notes
  2. database.yaml - Tables, columns, RLS policies, indexes, seed data
  3. api.yaml - Endpoints (CRUD), auth, roles, request/response schemas
  4. frontend.yaml - Page paths, components, services, validation schemas
  5. tests.yaml - Acceptance criteria, unit tests, integration tests, e2e tests

  ---
  🚀 Agent Instructions (Unified)

  Każdy agent dostanie:
  task: "Create context YAML structure for Story {story-id}"
  inputs:
    story_file: "docs/2-MANAGEMENT/epics/current/02-technical/{story-id}.{name}.md"
    wireframes: ["TEC-XXX", "TEC-YYY"]
    example_pattern: "docs/2-MANAGEMENT/epics/current/01-settings/context/01.1/"
    prd: "docs/1-BASELINE/product/modules/technical.md"
    architecture: "docs/1-BASELINE/architecture/modules/technical.md"

  output_location: "docs/2-MANAGEMENT/epics/current/02-technical/context/{story-id}/"

  deliverables:
    - _index.yaml (metadata, dependencies, deliverables)
    - database.yaml (tables, RLS, seed data)
    - api.yaml (endpoints, auth, schemas)
    - frontend.yaml (pages, components, services)
    - tests.yaml (acceptance criteria, test specs)

  requirements:
    - Follow Epic 01 pattern exactly (01.1/_index.yaml as template)
    - Include UX wireframe references (path + components list)
    - Map PRD FRs to story scope
    - Document dependencies (Epic 01.1 + other stories)
    - All fields must match PROJECT-STATE.md structure

  ---
  🎭 Agent Coordination

  - Parallel execution: 4 agents per wave (max parallelism)
  - No cross-story dependencies within wave: Stories in same wave are independent
  - Sequential waves: Wave N+1 starts after Wave N completes
  - Context compression: Agents receive only story file + wireframes (not full PRD)

  ---
  ✅ Acceptance Criteria

  - 17 folders created in context/ directory
  - Each folder has 5 YAML files (_index, database, api, frontend, tests)
  - All wireframes referenced with full path
  - Dependencies mapped (01.1 + cross-story)
  - PRD FR coverage documented
  - Pattern matches Epic 01 structure 100%

  ---
  📊 Estimated Effort

  - Total stories: 17
  - Total waves: 5
  - Time per wave: ~10-15 minutes
  - Total time: ~50-75 minutes
  - Agents used: 17 (architect-agent)

  ---
  Czy zatwierdzasz ten plan? Mogę rozpocząć falę 1 (02.1, 02.2, 02.3, 02.4) w trybie równoległym.