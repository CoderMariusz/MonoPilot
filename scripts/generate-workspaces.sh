#!/bin/bash
# Generate Agent Workspaces Script
# Creates agent-specific workspace directories with context links
#
# Usage: bash scripts/generate-workspaces.sh [project-path] [--agents agent1,agent2,...]
# Example: bash scripts/generate-workspaces.sh . --agents BACKEND-DEV,FRONTEND-DEV
#
# Author: Agent Methodology Pack
# Version: 1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Default values
PROJECT_PATH="."
AGENTS_LIST=""
CURRENT_DATE=$(date '+%Y-%m-%d %H:%M:%S')

# All agents
ALL_AGENTS=(
    "ORCHESTRATOR"
    "RESEARCH-AGENT"
    "PM-AGENT"
    "SCRUM-MASTER"
    "ARCHITECT-AGENT"
    "UX-DESIGNER"
    "PRODUCT-OWNER"
    "TEST-ENGINEER"
    "BACKEND-DEV"
    "FRONTEND-DEV"
    "SENIOR-DEV"
    "QA-AGENT"
    "CODE-REVIEWER"
    "TECH-WRITER"
)

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --agents)
            AGENTS_LIST="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: bash scripts/generate-workspaces.sh [project-path] [--agents agent1,agent2,...]"
            echo ""
            echo "Arguments:"
            echo "  project-path    Path to project directory (default: current directory)"
            echo "  --agents LIST   Comma-separated list of agents (default: all agents)"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Available agents:"
            echo "  ORCHESTRATOR, RESEARCH-AGENT, PM-AGENT, SCRUM-MASTER,"
            echo "  ARCHITECT-AGENT, UX-DESIGNER, PRODUCT-OWNER,"
            echo "  TEST-ENGINEER, BACKEND-DEV, FRONTEND-DEV, SENIOR-DEV,"
            echo "  QA-AGENT, CODE-REVIEWER, TECH-WRITER"
            echo ""
            exit 0
            ;;
        *)
            if [ -z "$1" ] || [[ "$1" == -* ]]; then
                shift
            else
                PROJECT_PATH="$1"
                shift
            fi
            ;;
    esac
done

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

# Get absolute path
get_abs_path() {
    local path="$1"
    if [ -d "$path" ]; then
        (cd "$path" && pwd)
    else
        echo "$path"
    fi
}

# Detect relevant files for agent
detect_agent_files() {
    local agent="$1"
    local project_path="$2"
    local files=""

    case "$agent" in
        "BACKEND-DEV")
            # Look for backend files
            files=$(find "$project_path" -type f \( \
                -path "*/lib/api/*" -o \
                -path "*/lib/services/*" -o \
                -path "*/lib/repositories/*" -o \
                -path "*/server/*" -o \
                -path "*/backend/*" -o \
                -path "*/supabase/*" -o \
                -name "*_service.dart" -o \
                -name "*_repository.dart" -o \
                -name "*api*.dart" \
            \) 2>/dev/null | head -20 || echo "")
            ;;
        "FRONTEND-DEV")
            # Look for frontend files
            files=$(find "$project_path" -type f \( \
                -path "*/lib/ui/*" -o \
                -path "*/lib/screens/*" -o \
                -path "*/lib/widgets/*" -o \
                -path "*/lib/components/*" -o \
                -path "*/src/components/*" -o \
                -path "*/src/pages/*" -o \
                -name "*_screen.dart" -o \
                -name "*_widget.dart" -o \
                -name "*.tsx" -o \
                -name "*.jsx" \
            \) 2>/dev/null | head -20 || echo "")
            ;;
        "TEST-ENGINEER")
            # Look for test files
            files=$(find "$project_path" -type f \( \
                -path "*/test/*" -o \
                -path "*/tests/*" -o \
                -path "*/__tests__/*" -o \
                -name "*_test.dart" -o \
                -name "*.test.js" -o \
                -name "*.spec.js" \
            \) 2>/dev/null | head -20 || echo "")
            ;;
        "ARCHITECT-AGENT")
            # Look for architecture files
            files=$(find "$project_path" -type f \( \
                -name "architecture*.md" -o \
                -name "system-design*.md" -o \
                -name "adr-*.md" -o \
                -path "*/docs/*architecture*" \
            \) 2>/dev/null | head -20 || echo "")
            ;;
        "UX-DESIGNER")
            # Look for UI/UX files
            files=$(find "$project_path" -type f \( \
                -name "wireframe*" -o \
                -name "mockup*" -o \
                -name "design*" -o \
                -path "*/assets/*" -o \
                -path "*/design/*" \
            \) 2>/dev/null | head -20 || echo "")
            ;;
        "QA-AGENT")
            # Look for QA files
            files=$(find "$project_path" -type f \( \
                -path "*/test/*" -o \
                -name "*_test.dart" -o \
                -name "test_plan*.md" -o \
                -name "qa*.md" \
            \) 2>/dev/null | head -20 || echo "")
            ;;
        *)
            files=""
            ;;
    esac

    echo "$files"
}

# Count files matching pattern
count_agent_files() {
    local files="$1"
    if [ -z "$files" ]; then
        echo "0"
    else
        echo "$files" | wc -l | tr -d ' '
    fi
}

# Generate workspace for agent
generate_workspace() {
    local agent="$1"
    local project_path="$2"
    local workspace_dir="$project_path/.claude/state/workspaces/$agent"

    print_step "Creating workspace for $agent..."

    # Create directory
    mkdir -p "$workspace_dir"

    # Detect relevant files
    local relevant_files=$(detect_agent_files "$agent" "$project_path")
    local file_count=$(count_agent_files "$relevant_files")

    # Generate CONTEXT.md
    local context_file="$workspace_dir/CONTEXT.md"

    cat > "$context_file" << EOF
# $agent Context

**Generated:** $CURRENT_DATE
**Auto-updated by:** generate-workspaces.sh

---

## Quick Links

**Core Files:**
- @CLAUDE.md
- @PROJECT-STATE.md
- @.claude/agents/$(get_agent_path "$agent")

**Documentation:**
- @docs/1-BASELINE/
- @.claude/PATTERNS.md
- @.claude/TABLES.md

EOF

    # Add agent-specific links
    case "$agent" in
        "ORCHESTRATOR")
            cat >> "$context_file" << EOF
**State Files:**
- @.claude/state/AGENT-STATE.md
- @.claude/state/TASK-QUEUE.md
- @.claude/state/HANDOFFS.md
- @.claude/state/DEPENDENCIES.md

**Workflows:**
- @.claude/workflows/
EOF
            ;;
        "BACKEND-DEV")
            cat >> "$context_file" << EOF
**Backend Specific:**
- @.claude/TABLES.md - Database schemas
- @.claude/patterns/ERROR-RECOVERY.md
- @docs/1-BASELINE/architecture/api-specs.md

**Code Patterns:**
- @.claude/patterns/REPOSITORY-PATTERN.md
- @.claude/patterns/SERVICE-LAYER.md
EOF
            ;;
        "FRONTEND-DEV")
            cat >> "$context_file" << EOF
**Frontend Specific:**
- @docs/1-BASELINE/architecture/ui-architecture.md
- @.claude/patterns/COMPONENT-PATTERNS.md
- @.claude/patterns/STATE-MANAGEMENT.md
EOF
            ;;
        "TEST-ENGINEER")
            cat >> "$context_file" << EOF
**Testing Specific:**
- @.claude/patterns/GIVEN-WHEN-THEN.md
- @.claude/patterns/QUALITY-RUBRIC.md
- @test/ directory
EOF
            ;;
        "ARCHITECT-AGENT")
            cat >> "$context_file" << EOF
**Architecture Specific:**
- @docs/1-BASELINE/architecture/
- @.claude/patterns/ARCHITECTURE-DECISIONS.md
- @docs/3-ARCHITECTURE/
EOF
            ;;
        "PM-AGENT")
            cat >> "$context_file" << EOF
**Planning Specific:**
- @docs/2-MANAGEMENT/backlog.md
- @docs/2-MANAGEMENT/epics/
- @templates/epic-template.md
EOF
            ;;
        "SCRUM-MASTER")
            cat >> "$context_file" << EOF
**Sprint Specific:**
- @docs/2-MANAGEMENT/sprints/
- @.claude/state/TASK-QUEUE.md
- @.claude/workflows/SPRINT-WORKFLOW.md
EOF
            ;;
    esac

    cat >> "$context_file" << EOF

---

## Project Files (Auto-detected)

EOF

    if [ "$file_count" -gt 0 ]; then
        cat >> "$context_file" << EOF
Found $file_count relevant files:

\`\`\`
EOF
        echo "$relevant_files" | while read -r file; do
            rel_path="${file#$project_path/}"
            echo "$rel_path" >> "$context_file"
        done

        cat >> "$context_file" << EOF
\`\`\`
EOF
    else
        cat >> "$context_file" << EOF
*(No project files detected yet - will update as project grows)*
EOF
    fi

    cat >> "$context_file" << EOF

---

## Patterns to Follow

EOF

    # Add agent-specific patterns
    case "$agent" in
        "TEST-ENGINEER")
            cat >> "$context_file" << EOF
1. **TDD Approach**: Always write tests first (RED-GREEN-REFACTOR)
2. **Given-When-Then**: Use BDD style test descriptions
3. **Test Coverage**: Aim for >80% coverage
4. **Quality Gates**: Follow @.claude/patterns/QUALITY-RUBRIC.md
EOF
            ;;
        "BACKEND-DEV")
            cat >> "$context_file" << EOF
1. **Repository Pattern**: Separate data access from business logic
2. **Error Recovery**: Implement retry and fallback strategies
3. **API Design**: Follow RESTful or GraphQL conventions
4. **Database**: Use migrations, maintain schema docs
EOF
            ;;
        "FRONTEND-DEV")
            cat >> "$context_file" << EOF
1. **Component Design**: Small, reusable, single responsibility
2. **State Management**: Use Riverpod/Redux/Context appropriately
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Performance**: Lazy loading, memoization, optimization
EOF
            ;;
        "SENIOR-DEV")
            cat >> "$context_file" << EOF
1. **Code Review**: Review all PRs before merge
2. **Architecture**: Maintain system design coherence
3. **Mentorship**: Guide junior developers
4. **Integration**: Coordinate between frontend/backend
EOF
            ;;
        "QA-AGENT")
            cat >> "$context_file" << EOF
1. **Test Plan**: Create comprehensive test plans
2. **Regression**: Maintain regression test suites
3. **Bug Reports**: Detailed reproduction steps
4. **Quality Gates**: Enforce quality standards
EOF
            ;;
        *)
            cat >> "$context_file" << EOF
*(Follow general patterns in @.claude/patterns/)*
EOF
            ;;
    esac

    cat >> "$context_file" << EOF

---

## Recent Work

See @.claude/state/workspaces/$agent/RECENT-WORK.md for task history.

---

*Auto-generated by generate-workspaces.sh*
*Last updated: $CURRENT_DATE*
EOF

    # Generate RECENT-WORK.md
    local recent_work_file="$workspace_dir/RECENT-WORK.md"

    cat > "$recent_work_file" << EOF
# $agent - Recent Work

**Last Updated:** $CURRENT_DATE

---

## Current Tasks

| Task | Story | Status | Started | Notes |
|------|-------|--------|---------|-------|
| *(No active tasks)* | - | - | - | - |

---

## Completed Today

| Task | Story | Completed | Duration | Quality |
|------|-------|-----------|----------|---------|
| *(No tasks completed yet)* | - | - | - | - |

---

## Work Log

### $(date '+%Y-%m-%d')

- Workspace initialized
- Ready for first task assignment

---

## Notes

- Track your daily work here
- Link to story files: @docs/2-MANAGEMENT/epics/current/
- Update after each major task completion

---

*Template generated by generate-workspaces.sh*
EOF

    # Generate NOTES.md
    local notes_file="$workspace_dir/NOTES.md"

    cat > "$notes_file" << EOF
# $agent - Notes & Learnings

**Created:** $CURRENT_DATE

---

## Key Learnings

### Project-Specific Patterns

*(Add patterns you discover specific to this project)*

### Common Pitfalls

*(Document issues to avoid)*

### Best Practices

*(Document what works well)*

---

## Code Snippets

### Useful Templates

\`\`\`
(Add reusable code templates here)
\`\`\`

---

## Decision Log

| Date | Decision | Rationale | Outcome |
|------|----------|-----------|---------|
| *(Log important decisions here)* | - | - | - |

---

## Resources

- [Add helpful links]
- [Documentation references]
- [Tools and utilities]

---

*Template generated by generate-workspaces.sh*
EOF

    print_success "$agent workspace created"
}

# Get agent definition path
get_agent_path() {
    local agent="$1"

    case "$agent" in
        "ORCHESTRATOR")
            echo "ORCHESTRATOR.md"
            ;;
        "RESEARCH-AGENT"|"PM-AGENT"|"SCRUM-MASTER"|"ARCHITECT-AGENT"|"UX-DESIGNER"|"PRODUCT-OWNER")
            echo "planning/$agent.md"
            ;;
        "TEST-ENGINEER"|"BACKEND-DEV"|"FRONTEND-DEV"|"SENIOR-DEV")
            echo "development/$agent.md"
            ;;
        "QA-AGENT"|"CODE-REVIEWER"|"TECH-WRITER")
            echo "quality/$agent.md"
            ;;
        *)
            echo "$agent.md"
            ;;
    esac
}

# Main function
main() {
    # Convert to absolute path
    PROJECT_PATH=$(get_abs_path "$PROJECT_PATH")

    # Validate project path
    if [ ! -d "$PROJECT_PATH" ]; then
        print_error "Project directory does not exist: $PROJECT_PATH"
        exit 1
    fi

    # Show banner
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        GENERATE AGENT WORKSPACES - METHODOLOGY PACK        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    print_info "Project path: $PROJECT_PATH"
    echo ""

    # Determine which agents to generate
    local agents_to_generate=()

    if [ -z "$AGENTS_LIST" ]; then
        # Generate all agents
        agents_to_generate=("${ALL_AGENTS[@]}")
        print_info "Generating workspaces for all ${#ALL_AGENTS[@]} agents"
    else
        # Parse comma-separated list
        IFS=',' read -ra agents_to_generate <<< "$AGENTS_LIST"
        print_info "Generating workspaces for ${#agents_to_generate[@]} agents"
    fi

    # Create base workspace directory
    mkdir -p "$PROJECT_PATH/.claude/state/workspaces"

    # Generate workspaces
    print_header "Generating Workspaces"
    echo ""

    local success_count=0

    for agent in "${agents_to_generate[@]}"; do
        # Trim whitespace
        agent=$(echo "$agent" | xargs)

        # Validate agent name
        if [[ ! " ${ALL_AGENTS[@]} " =~ " ${agent} " ]]; then
            print_warning "Unknown agent: $agent (skipping)"
            continue
        fi

        generate_workspace "$agent" "$PROJECT_PATH"
        ((success_count++))
    done

    # ============================================================
    # COMPLETION SUMMARY
    # ============================================================
    print_header "GENERATION COMPLETE"

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       AGENT WORKSPACES SUCCESSFULLY GENERATED              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${CYAN}Generated Workspaces:${NC}"
    echo -e "  ✓ $success_count agent workspaces created"
    echo -e "  ✓ Location: $PROJECT_PATH/.claude/state/workspaces/"
    echo ""

    echo -e "${CYAN}Files Created per Workspace:${NC}"
    echo -e "  • CONTEXT.md - Agent-specific context and links"
    echo -e "  • RECENT-WORK.md - Task tracking and work log"
    echo -e "  • NOTES.md - Learnings and decision log"
    echo ""

    print_header "NEXT STEPS"

    echo ""
    echo -e "${YELLOW}1. Review generated workspaces:${NC}"
    echo -e "   ls -la $PROJECT_PATH/.claude/state/workspaces/"
    echo ""
    echo -e "${YELLOW}2. Customize CONTEXT.md files:${NC}"
    echo -e "   Add project-specific links and patterns"
    echo ""
    echo -e "${YELLOW}3. Start using workspaces:${NC}"
    echo -e "   Agents will reference @.claude/state/workspaces/{AGENT}/CONTEXT.md"
    echo ""
    echo -e "${YELLOW}4. Track work:${NC}"
    echo -e "   Update RECENT-WORK.md after each task"
    echo ""

    echo ""
}

# Run main function
main
