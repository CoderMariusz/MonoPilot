#!/bin/bash
# Interactive Project Setup Wizard v3.0
# Complete project initialization with agent methodology pack
#
# Features:
#   - Multi-language support (communication)
#   - Full tech stack configuration
#   - Database selection
#   - Multiple flow types (New/Migration/Audit/QuickStart)
#   - Advanced mode (CI/CD, Testing, Hosting)
#   - High autonomy settings
#
# Usage:
#   Interactive: bash scripts/init-interactive.sh
#   CLI: bash scripts/init-interactive.sh --mode new --name my-project [OPTIONS]
#
# Author: Agent Methodology Pack
# Version: 3.0

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'

# Script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_ROOT="$(dirname "$SCRIPT_DIR")"

# Project configuration (will be set by user)
CONFIG_COMM_LANG=""
CONFIG_PROJECT_NAME=""
CONFIG_TECH_STACK=""
CONFIG_FRONTEND=""
CONFIG_DATABASE=""
CONFIG_TARGET_PATH=""
CONFIG_FLOW_TYPE=""
CONFIG_PROJECT_DESC=""
CONFIG_DONE_STATUS=""
CONFIG_UNCERTAINTIES=""
CONFIG_ADVANCED_MODE=false
CONFIG_CI_CD=""
CONFIG_TESTING=""
CONFIG_HOSTING=""

# Options
declare -A LANGUAGES=(
    [1]="English"
    [2]="Polish"
    [3]="Spanish"
    [4]="German"
    [5]="French"
    [6]="Portuguese"
    [7]="Italian"
    [8]="Ukrainian"
)

declare -A TECH_STACKS=(
    [1]="typescript"
    [2]="javascript"
    [3]="python"
    [4]="go"
    [5]="rust"
    [6]="java"
    [7]="csharp"
    [8]="dart"
    [9]="php"
    [10]="ruby"
)

declare -A FRONTENDS=(
    [1]="React"
    [2]="Vue"
    [3]="Angular"
    [4]="Svelte"
    [5]="Next.js"
    [6]="Nuxt"
    [7]="Flutter"
    [8]="None"
)

declare -A DATABASES=(
    [1]="Firebase"
    [2]="Supabase"
    [3]="PostgreSQL"
    [4]="MongoDB"
    [5]="MySQL"
    [6]="SQLite"
    [7]="Redis"
    [8]="None"
)

declare -A FLOW_TYPES=(
    [1]="new_project"
    [2]="migration"
    [3]="doc_audit"
    [4]="quick_start"
)

declare -A CI_CD_OPTIONS=(
    [1]="GitHub Actions"
    [2]="GitLab CI"
    [3]="CircleCI"
    [4]="Jenkins"
    [5]="None"
)

declare -A TESTING_OPTIONS=(
    [1]="Jest"
    [2]="Vitest"
    [3]="Pytest"
    [4]="Go Test"
    [5]="JUnit"
    [6]="xUnit"
    [7]="None"
)

declare -A HOSTING_OPTIONS=(
    [1]="Vercel"
    [2]="Netlify"
    [3]="AWS"
    [4]="GCP"
    [5]="Azure"
    [6]="DigitalOcean"
    [7]="Self-hosted"
    [8]="None"
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_banner() {
    clear
    echo ""
    echo -e "${BLUE}"
    echo "    _                    _     __  __      _   _               _       "
    echo "   / \   __ _  ___ _ __ | |_  |  \/  | ___| |_| |__   ___   __| |___   "
    echo "  / _ \ / _\` |/ _ \ '_ \| __| | |\/| |/ _ \ __| '_ \ / _ \ / _\` / __|  "
    echo " / ___ \ (_| |  __/ | | | |_  | |  | |  __/ |_| | | | (_) | (_| \__ \  "
    echo "/_/   \_\__, |\___|_| |_|\__| |_|  |_|\___|\__|_| |_|\___/ \__,_|___/  "
    echo "        |___/                                                          "
    echo -e "${NC}"
    echo -e "${CYAN}                    Interactive Setup Wizard v3.0${NC}"
    echo ""
    echo -e "${WHITE}Pack location: ${YELLOW}$PACK_ROOT${NC}"
    echo ""
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
}

print_option() {
    local num="$1"
    local text="$2"
    local selected="$3"
    if [ "$selected" = "true" ]; then
        echo -e "  ${GREEN}[$num]${NC} ${WHITE}$text${NC} ${GREEN}◀${NC}"
    else
        echo -e "  ${CYAN}[$num]${NC} $text"
    fi
}

get_input() {
    local prompt="$1"
    local default="$2"
    local result

    if [ -n "$default" ]; then
        echo -n -e "${YELLOW}$prompt ${WHITE}[$default]${NC}: " >&2
    else
        echo -n -e "${YELLOW}$prompt${NC}: " >&2
    fi

    read -r result </dev/tty
    result="${result%$'\r'}"
    result="${result#"${result%%[![:space:]]*}"}"
    result="${result%"${result##*[![:space:]]}"}"

    if [ -z "$result" ] && [ -n "$default" ]; then
        echo "$default"
    else
        echo "$result"
    fi
}

get_choice() {
    local prompt="$1"
    local max="$2"
    local choice

    while true; do
        choice=$(get_input "$prompt")
        if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "$max" ]; then
            echo "$choice"
            return 0
        fi
        echo -e "${RED}✗ Please enter a number between 1 and $max${NC}" >&2
    done
}

confirm() {
    local prompt="$1"
    local response
    response=$(get_input "$prompt (y/n)" "y")
    [[ "$response" =~ ^[Yy]$ ]]
}

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

check_claude_cli() {
    print_step "Checking Claude CLI..."
    if command -v claude &> /dev/null; then
        print_success "Claude CLI is installed"
        return 0
    else
        print_error "Claude CLI is not installed!"
        echo ""
        print_info "Install with: npm install -g @anthropic-ai/claude-code"
        print_info "Or visit: https://claude.com/claude-code"
        echo ""
        return 1
    fi
}

check_target_path() {
    local path="$1"

    # Check if parent directory exists
    local parent_dir="$(dirname "$path")"
    if [ ! -d "$parent_dir" ]; then
        print_error "Parent directory does not exist: $parent_dir"
        return 1
    fi

    # Check if writable
    if [ ! -w "$parent_dir" ]; then
        print_error "Cannot write to: $parent_dir"
        return 1
    fi

    # Check for existing .claude
    if [ -d "$path/.claude" ]; then
        print_warning "Target already has .claude/ directory"
        if confirm "Merge with existing configuration?"; then
            return 0
        else
            return 1
        fi
    fi

    return 0
}

# ============================================================================
# QUESTION FUNCTIONS
# ============================================================================

ask_language() {
    print_header "STEP 1/7: Communication Language"
    echo ""
    echo -e "  ${WHITE}Select your preferred language for Claude responses:${NC}"
    echo ""

    for i in "${!LANGUAGES[@]}"; do
        print_option "$i" "${LANGUAGES[$i]}"
    done
    echo ""

    local choice
    choice=$(get_choice "Select language [1-${#LANGUAGES[@]}]" "${#LANGUAGES[@]}")
    CONFIG_COMM_LANG="${LANGUAGES[$choice]}"

    print_success "Language: $CONFIG_COMM_LANG"
}

ask_project_name() {
    print_header "STEP 2/7: Project Name"
    echo ""

    local name
    name=$(get_input "Enter project name")

    while [ -z "$name" ]; do
        print_error "Project name cannot be empty"
        name=$(get_input "Enter project name")
    done

    # Sanitize name (lowercase, replace spaces with dashes)
    CONFIG_PROJECT_NAME=$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')

    print_success "Project name: $CONFIG_PROJECT_NAME"
}

ask_tech_stack() {
    print_header "STEP 3/7: Tech Stack"
    echo ""
    echo -e "  ${WHITE}Select primary programming language:${NC}"
    echo ""

    for i in "${!TECH_STACKS[@]}"; do
        print_option "$i" "${TECH_STACKS[$i]}"
    done
    echo ""

    local choice
    choice=$(get_choice "Select tech stack [1-${#TECH_STACKS[@]}]" "${#TECH_STACKS[@]}")
    CONFIG_TECH_STACK="${TECH_STACKS[$choice]}"

    print_success "Tech stack: $CONFIG_TECH_STACK"
}

ask_frontend() {
    print_header "STEP 4/7: Frontend Framework"
    echo ""
    echo -e "  ${WHITE}Select frontend framework (or None for backend-only):${NC}"
    echo ""

    for i in "${!FRONTENDS[@]}"; do
        print_option "$i" "${FRONTENDS[$i]}"
    done
    echo ""

    local choice
    choice=$(get_choice "Select frontend [1-${#FRONTENDS[@]}]" "${#FRONTENDS[@]}")
    CONFIG_FRONTEND="${FRONTENDS[$choice]}"

    print_success "Frontend: $CONFIG_FRONTEND"
}

ask_database() {
    print_header "STEP 5/7: Database"
    echo ""
    echo -e "  ${WHITE}Select database (or None):${NC}"
    echo ""

    for i in "${!DATABASES[@]}"; do
        print_option "$i" "${DATABASES[$i]}"
    done
    echo ""

    local choice
    choice=$(get_choice "Select database [1-${#DATABASES[@]}]" "${#DATABASES[@]}")
    CONFIG_DATABASE="${DATABASES[$choice]}"

    print_success "Database: $CONFIG_DATABASE"
}

ask_target_path() {
    print_header "STEP 6/7: Target Path"
    echo ""

    local parent_dir="$(dirname "$PACK_ROOT")"
    local suggested_path="$parent_dir/$CONFIG_PROJECT_NAME"

    echo -e "  ${WHITE}Where should the project be created?${NC}"
    echo ""
    print_option "1" "Suggested: $suggested_path"
    print_option "2" "Current directory: $(pwd)/$CONFIG_PROJECT_NAME"
    print_option "3" "Custom path"
    echo ""

    local choice
    choice=$(get_choice "Select option [1-3]" 3)

    case "$choice" in
        1) CONFIG_TARGET_PATH="$suggested_path" ;;
        2) CONFIG_TARGET_PATH="$(pwd)/$CONFIG_PROJECT_NAME" ;;
        3) CONFIG_TARGET_PATH=$(get_input "Enter full path") ;;
    esac

    # Validate
    if ! check_target_path "$CONFIG_TARGET_PATH"; then
        ask_target_path  # Retry
        return
    fi

    print_success "Target path: $CONFIG_TARGET_PATH"
}

ask_flow_type() {
    print_header "STEP 7/7: Project Flow"
    echo ""
    echo -e "  ${WHITE}What type of project setup?${NC}"
    echo ""

    print_option "1" "New Project       - Start from scratch with full discovery"
    print_option "2" "Migration         - Existing project with documentation to migrate"
    print_option "3" "Doc Audit Only    - Just audit existing documentation"
    print_option "4" "Quick Start       - Skip discovery, ready to work"
    echo ""

    local choice
    choice=$(get_choice "Select flow [1-4]" 4)
    CONFIG_FLOW_TYPE="${FLOW_TYPES[$choice]}"

    local flow_desc=""
    case "$CONFIG_FLOW_TYPE" in
        new_project)  flow_desc="Full discovery interview → PRD → Architecture" ;;
        migration)    flow_desc="Doc audit → Quick discovery → Migration plan" ;;
        doc_audit)    flow_desc="Documentation audit and quality report" ;;
        quick_start)  flow_desc="Direct to Orchestrator, ready to code" ;;
    esac

    print_success "Flow: $CONFIG_FLOW_TYPE"
    print_info "$flow_desc"
}

ask_project_description() {
    print_header "PROJECT DESCRIPTION"
    echo ""
    echo -e "  ${WHITE}Describe your project (this helps agents understand context):${NC}"
    echo ""

    # Project description (always ask)
    echo -e "${YELLOW}Brief project description (1-3 sentences):${NC}"
    echo -e "${CYAN}Example: E-commerce platform for selling handmade products with user accounts and payments${NC}"
    read -r CONFIG_PROJECT_DESC </dev/tty
    CONFIG_PROJECT_DESC="${CONFIG_PROJECT_DESC%$'\r'}"
    echo ""

    # For migration/existing projects - ask what's done
    if [[ "$CONFIG_FLOW_TYPE" == "migration" || "$CONFIG_FLOW_TYPE" == "doc_audit" ]]; then
        echo -e "${YELLOW}What is already done/implemented? (features, modules, integrations):${NC}"
        echo -e "${CYAN}Example: User auth with Firebase, product listing, basic cart - no checkout yet${NC}"
        read -r CONFIG_DONE_STATUS </dev/tty
        CONFIG_DONE_STATUS="${CONFIG_DONE_STATUS%$'\r'}"
        echo ""

        echo -e "${YELLOW}What are your uncertainties/concerns/problems?${NC}"
        echo -e "${CYAN}Example: Not sure about payment integration approach, performance issues with large catalogs${NC}"
        read -r CONFIG_UNCERTAINTIES </dev/tty
        CONFIG_UNCERTAINTIES="${CONFIG_UNCERTAINTIES%$'\r'}"
        echo ""
    fi

    # For new projects - ask about vision/uncertainties
    if [[ "$CONFIG_FLOW_TYPE" == "new_project" ]]; then
        echo -e "${YELLOW}What are your main uncertainties or questions?${NC}"
        echo -e "${CYAN}Example: Should I use monorepo? Which auth provider? How to handle file uploads?${NC}"
        read -r CONFIG_UNCERTAINTIES </dev/tty
        CONFIG_UNCERTAINTIES="${CONFIG_UNCERTAINTIES%$'\r'}"
        echo ""
    fi

    print_success "Project context captured"
}

ask_advanced_mode() {
    print_header "ADVANCED OPTIONS (Optional)"
    echo ""

    if ! confirm "Configure advanced options (CI/CD, Testing, Hosting)?"; then
        CONFIG_ADVANCED_MODE=false
        return
    fi

    CONFIG_ADVANCED_MODE=true

    # CI/CD
    echo ""
    echo -e "  ${WHITE}CI/CD Platform:${NC}"
    for i in "${!CI_CD_OPTIONS[@]}"; do
        print_option "$i" "${CI_CD_OPTIONS[$i]}"
    done
    local choice
    choice=$(get_choice "Select CI/CD [1-${#CI_CD_OPTIONS[@]}]" "${#CI_CD_OPTIONS[@]}")
    CONFIG_CI_CD="${CI_CD_OPTIONS[$choice]}"

    # Testing
    echo ""
    echo -e "  ${WHITE}Testing Framework:${NC}"
    for i in "${!TESTING_OPTIONS[@]}"; do
        print_option "$i" "${TESTING_OPTIONS[$i]}"
    done
    choice=$(get_choice "Select testing [1-${#TESTING_OPTIONS[@]}]" "${#TESTING_OPTIONS[@]}")
    CONFIG_TESTING="${TESTING_OPTIONS[$choice]}"

    # Hosting
    echo ""
    echo -e "  ${WHITE}Hosting Platform:${NC}"
    for i in "${!HOSTING_OPTIONS[@]}"; do
        print_option "$i" "${HOSTING_OPTIONS[$i]}"
    done
    choice=$(get_choice "Select hosting [1-${#HOSTING_OPTIONS[@]}]" "${#HOSTING_OPTIONS[@]}")
    CONFIG_HOSTING="${HOSTING_OPTIONS[$choice]}"

    print_success "Advanced options configured"
}

# ============================================================================
# CONFIRMATION
# ============================================================================

show_summary() {
    print_header "CONFIGURATION SUMMARY"
    echo ""
    echo -e "  ${WHITE}Communication:${NC}  $CONFIG_COMM_LANG"
    echo -e "  ${WHITE}Project Name:${NC}   $CONFIG_PROJECT_NAME"
    echo -e "  ${WHITE}Tech Stack:${NC}     $CONFIG_TECH_STACK"
    echo -e "  ${WHITE}Frontend:${NC}       $CONFIG_FRONTEND"
    echo -e "  ${WHITE}Database:${NC}       $CONFIG_DATABASE"
    echo -e "  ${WHITE}Target Path:${NC}    $CONFIG_TARGET_PATH"
    echo -e "  ${WHITE}Flow Type:${NC}      $CONFIG_FLOW_TYPE"

    if [ -n "$CONFIG_PROJECT_DESC" ]; then
        echo ""
        echo -e "  ${WHITE}Description:${NC}"
        echo -e "    $CONFIG_PROJECT_DESC"
    fi

    if [ -n "$CONFIG_DONE_STATUS" ]; then
        echo ""
        echo -e "  ${WHITE}Already Done:${NC}"
        echo -e "    $CONFIG_DONE_STATUS"
    fi

    if [ -n "$CONFIG_UNCERTAINTIES" ]; then
        echo ""
        echo -e "  ${WHITE}Uncertainties:${NC}"
        echo -e "    $CONFIG_UNCERTAINTIES"
    fi

    if [ "$CONFIG_ADVANCED_MODE" = true ]; then
        echo ""
        echo -e "  ${WHITE}Advanced:${NC}"
        echo -e "    CI/CD:    $CONFIG_CI_CD"
        echo -e "    Testing:  $CONFIG_TESTING"
        echo -e "    Hosting:  $CONFIG_HOSTING"
    fi

    echo ""
}

# ============================================================================
# FILE OPERATIONS
# ============================================================================

create_directory_structure() {
    print_step "Creating directory structure..."

    local target="$CONFIG_TARGET_PATH"

    # Create main directories
    mkdir -p "$target/.claude/agents/planning"
    mkdir -p "$target/.claude/agents/development"
    mkdir -p "$target/.claude/agents/quality"
    mkdir -p "$target/.claude/workflows/definitions/product"
    mkdir -p "$target/.claude/workflows/definitions/engineering"
    mkdir -p "$target/.claude/workflows/documentation"
    mkdir -p "$target/.claude/templates"
    mkdir -p "$target/.claude/patterns"
    mkdir -p "$target/.claude/checklists"
    mkdir -p "$target/.claude/config"
    mkdir -p "$target/.claude/state/memory-bank"
    mkdir -p "$target/.claude/temp"
    mkdir -p "$target/.claude/logs/workflows"
    mkdir -p "$target/.claude/logs/sessions"
    mkdir -p "$target/scripts"
    mkdir -p "$target/docs/0-DISCOVERY/research/tech"
    mkdir -p "$target/docs/0-DISCOVERY/research/competition"
    mkdir -p "$target/docs/0-DISCOVERY/research/user-needs"
    mkdir -p "$target/docs/0-DISCOVERY/research/market"
    mkdir -p "$target/docs/0-DISCOVERY/research/pricing"
    mkdir -p "$target/docs/0-DISCOVERY/research/risk"
    mkdir -p "$target/docs/1-BASELINE/product"
    mkdir -p "$target/docs/1-BASELINE/architecture/decisions"
    mkdir -p "$target/docs/1-BASELINE/research"
    mkdir -p "$target/docs/2-MANAGEMENT/epics/current"
    mkdir -p "$target/docs/2-MANAGEMENT/epics/completed"
    mkdir -p "$target/docs/2-MANAGEMENT/sprints"
    mkdir -p "$target/docs/3-ARCHITECTURE/ux/wireframes"
    mkdir -p "$target/docs/3-ARCHITECTURE/ux/flows"
    mkdir -p "$target/docs/4-DEVELOPMENT"
    mkdir -p "$target/docs/5-ARCHIVE"
    mkdir -p "$target/docs/reviews"

    print_success "Directory structure created"
}

copy_agents() {
    print_step "Copying agents..."

    local target="$CONFIG_TARGET_PATH"
    local count=0

    # ORCHESTRATOR
    if [ -f "$PACK_ROOT/.claude/agents/ORCHESTRATOR.md" ]; then
        cp "$PACK_ROOT/.claude/agents/ORCHESTRATOR.md" "$target/.claude/agents/"
        ((count++))
    fi

    # Planning agents
    for agent in DISCOVERY-AGENT DOC-AUDITOR PM-AGENT ARCHITECT-AGENT PRODUCT-OWNER RESEARCH-AGENT SCRUM-MASTER UX-DESIGNER; do
        if [ -f "$PACK_ROOT/.claude/agents/planning/$agent.md" ]; then
            cp "$PACK_ROOT/.claude/agents/planning/$agent.md" "$target/.claude/agents/planning/"
            ((count++))
        fi
    done

    # Development agents
    for agent in BACKEND-DEV FRONTEND-DEV SENIOR-DEV TEST-ENGINEER; do
        if [ -f "$PACK_ROOT/.claude/agents/development/$agent.md" ]; then
            cp "$PACK_ROOT/.claude/agents/development/$agent.md" "$target/.claude/agents/development/"
            ((count++))
        fi
    done

    # Quality agents
    for agent in CODE-REVIEWER QA-AGENT TECH-WRITER; do
        if [ -f "$PACK_ROOT/.claude/agents/quality/$agent.md" ]; then
            cp "$PACK_ROOT/.claude/agents/quality/$agent.md" "$target/.claude/agents/quality/"
            ((count++))
        fi
    done

    # Operations agents
    mkdir -p "$target/.claude/agents/operations"
    for agent in DEVOPS-AGENT; do
        if [ -f "$PACK_ROOT/.claude/agents/operations/$agent.md" ]; then
            cp "$PACK_ROOT/.claude/agents/operations/$agent.md" "$target/.claude/agents/operations/"
            ((count++))
        fi
    done

    print_success "Agents copied: $count files"
}

copy_workflows() {
    print_step "Copying workflows..."

    local target="$CONFIG_TARGET_PATH"
    local count=0

    # Workflow definitions (YAML)
    if [ -d "$PACK_ROOT/.claude/workflows/definitions" ]; then
        cp -r "$PACK_ROOT/.claude/workflows/definitions/"* "$target/.claude/workflows/definitions/" 2>/dev/null || true
        count=$(find "$target/.claude/workflows/definitions" -name "*.yaml" 2>/dev/null | wc -l)
    fi

    # Workflow documentation (MD)
    if [ -d "$PACK_ROOT/.claude/workflows/documentation" ]; then
        cp -r "$PACK_ROOT/.claude/workflows/documentation/"* "$target/.claude/workflows/documentation/" 2>/dev/null || true
    fi

    print_success "Workflows copied: $count definitions"
}

copy_templates() {
    print_step "Copying templates..."

    local target="$CONFIG_TARGET_PATH"

    if [ -d "$PACK_ROOT/.claude/templates" ]; then
        cp -r "$PACK_ROOT/.claude/templates/"*.md "$target/.claude/templates/" 2>/dev/null || true
    fi

    local count=$(find "$target/.claude/templates" -name "*.md" 2>/dev/null | wc -l)
    print_success "Templates copied: $count files"
}

copy_patterns() {
    print_step "Copying patterns..."

    local target="$CONFIG_TARGET_PATH"

    if [ -d "$PACK_ROOT/.claude/patterns" ]; then
        cp -r "$PACK_ROOT/.claude/patterns/"*.md "$target/.claude/patterns/" 2>/dev/null || true
    fi

    local count=$(find "$target/.claude/patterns" -name "*.md" 2>/dev/null | wc -l)
    print_success "Patterns copied: $count files"
}

copy_checklists() {
    print_step "Copying checklists..."

    local target="$CONFIG_TARGET_PATH"

    if [ -d "$PACK_ROOT/.claude/checklists" ]; then
        cp -r "$PACK_ROOT/.claude/checklists/"*.md "$target/.claude/checklists/" 2>/dev/null || true
    fi

    local count=$(find "$target/.claude/checklists" -name "*.md" 2>/dev/null | wc -l)
    print_success "Checklists copied: $count files"
}

copy_state_templates() {
    print_step "Copying state templates..."

    local target="$CONFIG_TARGET_PATH"

    if [ -d "$PACK_ROOT/.claude/state" ]; then
        # Copy state files
        for file in AGENT-STATE.md DECISION-LOG.md TASK-QUEUE.md HANDOFFS.md AGENT-MEMORY.md DEPENDENCIES.md METRICS.md; do
            if [ -f "$PACK_ROOT/.claude/state/$file" ]; then
                cp "$PACK_ROOT/.claude/state/$file" "$target/.claude/state/"
            fi
        done

        # Copy memory-bank templates
        if [ -d "$PACK_ROOT/.claude/state/memory-bank" ]; then
            cp -r "$PACK_ROOT/.claude/state/memory-bank/"* "$target/.claude/state/memory-bank/" 2>/dev/null || true
        fi
    fi

    print_success "State templates copied"
}

copy_audit_templates() {
    print_step "Copying audit templates..."

    local target="$CONFIG_TARGET_PATH"
    mkdir -p "$target/.claude/audit"

    if [ -d "$PACK_ROOT/.claude/audit" ]; then
        # Copy only .md files (skip .tmp files)
        for file in "$PACK_ROOT/.claude/audit/"*.md; do
            if [ -f "$file" ]; then
                cp "$file" "$target/.claude/audit/"
            fi
        done
    fi

    print_success "Audit templates copied"
}

copy_migration_templates() {
    print_step "Copying migration templates..."

    local target="$CONFIG_TARGET_PATH"
    mkdir -p "$target/.claude/migration"

    if [ -d "$PACK_ROOT/.claude/migration" ]; then
        cp -r "$PACK_ROOT/.claude/migration/"*.md "$target/.claude/migration/" 2>/dev/null || true
    fi

    print_success "Migration templates copied"
}

copy_claude_scripts() {
    print_step "Copying .claude/scripts..."

    local target="$CONFIG_TARGET_PATH"
    mkdir -p "$target/.claude/scripts"

    if [ -d "$PACK_ROOT/.claude/scripts" ]; then
        cp -r "$PACK_ROOT/.claude/scripts/"* "$target/.claude/scripts/" 2>/dev/null || true
        chmod +x "$target/.claude/scripts/"*.sh 2>/dev/null || true
    fi

    print_success ".claude/scripts copied"
}

copy_all_scripts() {
    print_step "Copying all scripts..."

    local target="$CONFIG_TARGET_PATH"

    if [ -d "$PACK_ROOT/scripts" ]; then
        # Copy all .sh scripts
        for script in "$PACK_ROOT/scripts/"*.sh; do
            if [ -f "$script" ]; then
                cp "$script" "$target/scripts/"
                chmod +x "$target/scripts/$(basename "$script")"
            fi
        done

        # Copy script documentation (.md files)
        for doc in "$PACK_ROOT/scripts/"*.md; do
            if [ -f "$doc" ]; then
                cp "$doc" "$target/scripts/"
            fi
        done
    fi

    local sh_count=$(find "$target/scripts" -name "*.sh" 2>/dev/null | wc -l)
    local md_count=$(find "$target/scripts" -name "*.md" 2>/dev/null | wc -l)
    print_success "Scripts copied: $sh_count .sh + $md_count .md files"
}

copy_docs_structure() {
    print_step "Copying docs structure..."

    local target="$CONFIG_TARGET_PATH"

    if [ -d "$PACK_ROOT/docs" ]; then
        # Copy entire docs structure
        cp -r "$PACK_ROOT/docs" "$target/"

        # Remove migration docs from target (keep in pack only)
        # rm -rf "$target/docs/migration" 2>/dev/null || true
    fi

    local count=$(find "$target/docs" -name "*.md" 2>/dev/null | wc -l)
    print_success "Docs structure copied: $count files"
}

copy_config() {
    print_step "Copying configuration..."

    local target="$CONFIG_TARGET_PATH"

    # Copy all config files
    if [ -d "$PACK_ROOT/.claude/config" ]; then
        cp -r "$PACK_ROOT/.claude/config/"* "$target/.claude/config/" 2>/dev/null || true
    fi

    print_success "Configuration copied"
}

copy_claude_root_files() {
    print_step "Copying .claude root documentation files..."

    local target="$CONFIG_TARGET_PATH"
    local count=0

    # Copy all root-level .md files from .claude/
    for file in CONTEXT-BUDGET.md MODEL-ROUTING.md MODULE-INDEX.md PATTERNS.md PROMPTS.md TABLES.md; do
        if [ -f "$PACK_ROOT/.claude/$file" ]; then
            cp "$PACK_ROOT/.claude/$file" "$target/.claude/"
            ((count++))
        fi
    done

    print_success ".claude root files copied: $count files"
}

copy_root_templates() {
    print_step "Copying root templates..."

    local target="$CONFIG_TARGET_PATH"
    mkdir -p "$target/templates"

    if [ -d "$PACK_ROOT/templates" ]; then
        # Copy all files from root templates/
        for file in "$PACK_ROOT/templates/"*; do
            if [ -f "$file" ]; then
                cp "$file" "$target/templates/"
            fi
        done
    fi

    local count=$(find "$target/templates" -type f 2>/dev/null | wc -l)
    print_success "Root templates copied: $count files"
}

generate_settings_local() {
    print_step "Generating settings.local.json (MAX autonomy)..."

    local target="$CONFIG_TARGET_PATH"

    cat > "$target/.claude/settings.local.json" << 'EOF'
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "console",
    "OTEL_METRIC_EXPORT_INTERVAL": "30000"
  },
  "permissions": {
    "allow": [
      "// ===== CORE TOOLS =====",
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "WebSearch",
      "WebFetch",
      "Task",
      "Batch",
      "TodoRead",
      "TodoWrite",

      "// ===== MCP TOOLS =====",
      "mcp__*",

      "// ===== FILE OPERATIONS =====",
      "Bash(mkdir:*)",
      "Bash(mkdir -p:*)",
      "Bash(rmdir:*)",
      "Bash(rm:*)",
      "Bash(rm -r:*)",
      "Bash(rm -rf:*)",
      "Bash(cp:*)",
      "Bash(cp -r:*)",
      "Bash(mv:*)",
      "Bash(chmod:*)",
      "Bash(chown:*)",
      "Bash(ln:*)",
      "Bash(ln -s:*)",
      "Bash(ls:*)",
      "Bash(ls -la:*)",
      "Bash(find:*)",
      "Bash(touch:*)",
      "Bash(cat:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(wc:*)",
      "Bash(diff:*)",
      "Bash(sort:*)",
      "Bash(uniq:*)",
      "Bash(grep:*)",
      "Bash(sed:*)",
      "Bash(awk:*)",
      "Bash(cut:*)",
      "Bash(tr:*)",
      "Bash(xargs:*)",
      "Bash(tee:*)",
      "Bash(basename:*)",
      "Bash(dirname:*)",
      "Bash(realpath:*)",
      "Bash(readlink:*)",

      "// ===== SHELL BASICS =====",
      "Bash(echo:*)",
      "Bash(printf:*)",
      "Bash(pwd)",
      "Bash(cd:*)",
      "Bash(pushd:*)",
      "Bash(popd:*)",
      "Bash(which:*)",
      "Bash(where:*)",
      "Bash(whereis:*)",
      "Bash(type:*)",
      "Bash(env:*)",
      "Bash(export:*)",
      "Bash(set:*)",
      "Bash(unset:*)",
      "Bash(source:*)",
      "Bash(.:*)",
      "Bash(eval:*)",
      "Bash(exec:*)",
      "Bash(test:*)",
      "Bash([:*)",
      "Bash([[:*)",
      "Bash(true)",
      "Bash(false)",
      "Bash(exit:*)",
      "Bash(return:*)",
      "Bash(sleep:*)",
      "Bash(date:*)",
      "Bash(time:*)",
      "Bash(timeout:*)",

      "// ===== GIT - ALL COMMANDS =====",
      "Bash(git:*)",
      "Bash(git init:*)",
      "Bash(git clone:*)",
      "Bash(git status:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(git pull:*)",
      "Bash(git fetch:*)",
      "Bash(git merge:*)",
      "Bash(git rebase:*)",
      "Bash(git checkout:*)",
      "Bash(git switch:*)",
      "Bash(git branch:*)",
      "Bash(git log:*)",
      "Bash(git diff:*)",
      "Bash(git show:*)",
      "Bash(git stash:*)",
      "Bash(git tag:*)",
      "Bash(git remote:*)",
      "Bash(git reset:*)",
      "Bash(git revert:*)",
      "Bash(git cherry-pick:*)",
      "Bash(git bisect:*)",
      "Bash(git blame:*)",
      "Bash(git reflog:*)",
      "Bash(git config:*)",
      "Bash(git clean:*)",
      "Bash(git gc:*)",
      "Bash(git fsck:*)",
      "Bash(git archive:*)",
      "Bash(git submodule:*)",
      "Bash(git worktree:*)",
      "Bash(git rev-parse:*)",
      "Bash(git ls-files:*)",
      "Bash(git ls-tree:*)",
      "Bash(git shortlog:*)",
      "Bash(git describe:*)",

      "// ===== GITHUB CLI =====",
      "Bash(gh:*)",
      "Bash(gh auth:*)",
      "Bash(gh repo:*)",
      "Bash(gh pr:*)",
      "Bash(gh issue:*)",
      "Bash(gh release:*)",
      "Bash(gh workflow:*)",
      "Bash(gh run:*)",
      "Bash(gh gist:*)",
      "Bash(gh api:*)",
      "Bash(gh browse:*)",
      "Bash(gh codespace:*)",
      "Bash(gh secret:*)",
      "Bash(gh variable:*)",

      "// ===== NODE.JS ECOSYSTEM =====",
      "Bash(node:*)",
      "Bash(npm:*)",
      "Bash(npm init:*)",
      "Bash(npm install:*)",
      "Bash(npm run:*)",
      "Bash(npm test:*)",
      "Bash(npm start:*)",
      "Bash(npm build:*)",
      "Bash(npm publish:*)",
      "Bash(npm link:*)",
      "Bash(npm unlink:*)",
      "Bash(npm update:*)",
      "Bash(npm outdated:*)",
      "Bash(npm audit:*)",
      "Bash(npm cache:*)",
      "Bash(npm exec:*)",
      "Bash(npm pkg:*)",
      "Bash(npx:*)",
      "Bash(yarn:*)",
      "Bash(pnpm:*)",
      "Bash(bun:*)",
      "Bash(deno:*)",
      "Bash(ts-node:*)",
      "Bash(tsx:*)",

      "// ===== TYPESCRIPT & LINTING =====",
      "Bash(tsc:*)",
      "Bash(eslint:*)",
      "Bash(prettier:*)",
      "Bash(biome:*)",
      "Bash(oxlint:*)",
      "Bash(stylelint:*)",
      "Bash(lint-staged:*)",
      "Bash(husky:*)",

      "// ===== TESTING FRAMEWORKS =====",
      "Bash(jest:*)",
      "Bash(vitest:*)",
      "Bash(mocha:*)",
      "Bash(jasmine:*)",
      "Bash(ava:*)",
      "Bash(tap:*)",
      "Bash(playwright:*)",
      "Bash(cypress:*)",
      "Bash(puppeteer:*)",
      "Bash(storybook:*)",

      "// ===== PYTHON ECOSYSTEM =====",
      "Bash(python:*)",
      "Bash(python3:*)",
      "Bash(pip:*)",
      "Bash(pip3:*)",
      "Bash(pipx:*)",
      "Bash(poetry:*)",
      "Bash(pdm:*)",
      "Bash(uv:*)",
      "Bash(rye:*)",
      "Bash(hatch:*)",
      "Bash(pipenv:*)",
      "Bash(virtualenv:*)",
      "Bash(venv:*)",
      "Bash(conda:*)",
      "Bash(mamba:*)",
      "Bash(pytest:*)",
      "Bash(unittest:*)",
      "Bash(nose:*)",
      "Bash(tox:*)",
      "Bash(nox:*)",
      "Bash(black:*)",
      "Bash(ruff:*)",
      "Bash(isort:*)",
      "Bash(mypy:*)",
      "Bash(pyright:*)",
      "Bash(pylint:*)",
      "Bash(flake8:*)",
      "Bash(bandit:*)",
      "Bash(safety:*)",
      "Bash(pre-commit:*)",
      "Bash(mkdocs:*)",
      "Bash(sphinx:*)",
      "Bash(pdoc:*)",
      "Bash(fastapi:*)",
      "Bash(uvicorn:*)",
      "Bash(gunicorn:*)",
      "Bash(django-admin:*)",
      "Bash(flask:*)",
      "Bash(celery:*)",
      "Bash(alembic:*)",
      "Bash(jupyter:*)",
      "Bash(ipython:*)",

      "// ===== GO ECOSYSTEM =====",
      "Bash(go:*)",
      "Bash(go build:*)",
      "Bash(go run:*)",
      "Bash(go test:*)",
      "Bash(go mod:*)",
      "Bash(go get:*)",
      "Bash(go install:*)",
      "Bash(go fmt:*)",
      "Bash(go vet:*)",
      "Bash(go generate:*)",
      "Bash(go work:*)",
      "Bash(gofmt:*)",
      "Bash(golint:*)",
      "Bash(golangci-lint:*)",
      "Bash(staticcheck:*)",
      "Bash(air:*)",

      "// ===== RUST ECOSYSTEM =====",
      "Bash(cargo:*)",
      "Bash(cargo build:*)",
      "Bash(cargo run:*)",
      "Bash(cargo test:*)",
      "Bash(cargo check:*)",
      "Bash(cargo clippy:*)",
      "Bash(cargo fmt:*)",
      "Bash(cargo doc:*)",
      "Bash(cargo publish:*)",
      "Bash(cargo add:*)",
      "Bash(cargo remove:*)",
      "Bash(cargo update:*)",
      "Bash(cargo audit:*)",
      "Bash(cargo deny:*)",
      "Bash(rustc:*)",
      "Bash(rustfmt:*)",
      "Bash(rustup:*)",

      "// ===== JAVA/JVM ECOSYSTEM =====",
      "Bash(java:*)",
      "Bash(javac:*)",
      "Bash(jar:*)",
      "Bash(mvn:*)",
      "Bash(gradle:*)",
      "Bash(gradlew:*)",
      "Bash(./gradlew:*)",
      "Bash(ant:*)",
      "Bash(kotlin:*)",
      "Bash(kotlinc:*)",
      "Bash(scala:*)",
      "Bash(sbt:*)",
      "Bash(groovy:*)",
      "Bash(clojure:*)",
      "Bash(lein:*)",

      "// ===== .NET ECOSYSTEM =====",
      "Bash(dotnet:*)",
      "Bash(dotnet new:*)",
      "Bash(dotnet build:*)",
      "Bash(dotnet run:*)",
      "Bash(dotnet test:*)",
      "Bash(dotnet publish:*)",
      "Bash(dotnet add:*)",
      "Bash(dotnet remove:*)",
      "Bash(dotnet restore:*)",
      "Bash(dotnet clean:*)",
      "Bash(dotnet watch:*)",
      "Bash(dotnet ef:*)",
      "Bash(dotnet format:*)",
      "Bash(nuget:*)",
      "Bash(csc:*)",
      "Bash(msbuild:*)",

      "// ===== DART/FLUTTER =====",
      "Bash(dart:*)",
      "Bash(dart pub:*)",
      "Bash(dart run:*)",
      "Bash(dart test:*)",
      "Bash(dart compile:*)",
      "Bash(dart analyze:*)",
      "Bash(dart format:*)",
      "Bash(dart fix:*)",
      "Bash(flutter:*)",
      "Bash(flutter create:*)",
      "Bash(flutter run:*)",
      "Bash(flutter build:*)",
      "Bash(flutter test:*)",
      "Bash(flutter pub:*)",
      "Bash(flutter doctor:*)",
      "Bash(flutter clean:*)",
      "Bash(flutter analyze:*)",

      "// ===== PHP ECOSYSTEM =====",
      "Bash(php:*)",
      "Bash(composer:*)",
      "Bash(artisan:*)",
      "Bash(php artisan:*)",
      "Bash(phpunit:*)",
      "Bash(pest:*)",
      "Bash(phpstan:*)",
      "Bash(psalm:*)",
      "Bash(pint:*)",
      "Bash(php-cs-fixer:*)",
      "Bash(rector:*)",
      "Bash(laravel:*)",
      "Bash(symfony:*)",

      "// ===== RUBY ECOSYSTEM =====",
      "Bash(ruby:*)",
      "Bash(gem:*)",
      "Bash(bundle:*)",
      "Bash(bundler:*)",
      "Bash(rails:*)",
      "Bash(rake:*)",
      "Bash(rspec:*)",
      "Bash(rubocop:*)",
      "Bash(erb:*)",
      "Bash(irb:*)",
      "Bash(pry:*)",

      "// ===== BUILD TOOLS =====",
      "Bash(make:*)",
      "Bash(cmake:*)",
      "Bash(ninja:*)",
      "Bash(meson:*)",
      "Bash(bazel:*)",
      "Bash(buck:*)",
      "Bash(pants:*)",
      "Bash(just:*)",
      "Bash(task:*)",
      "Bash(invoke:*)",
      "Bash(nuke:*)",
      "Bash(turbo:*)",
      "Bash(nx:*)",
      "Bash(lerna:*)",
      "Bash(rush:*)",

      "// ===== BUNDLERS & COMPILERS =====",
      "Bash(webpack:*)",
      "Bash(vite:*)",
      "Bash(esbuild:*)",
      "Bash(swc:*)",
      "Bash(rollup:*)",
      "Bash(parcel:*)",
      "Bash(babel:*)",
      "Bash(postcss:*)",
      "Bash(sass:*)",
      "Bash(less:*)",
      "Bash(tailwindcss:*)",

      "// ===== NETWORK & HTTP =====",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(http:*)",
      "Bash(httpie:*)",
      "Bash(nc:*)",
      "Bash(netcat:*)",
      "Bash(ssh:*)",
      "Bash(scp:*)",
      "Bash(rsync:*)",
      "Bash(ping:*)",
      "Bash(traceroute:*)",
      "Bash(dig:*)",
      "Bash(nslookup:*)",
      "Bash(host:*)",
      "Bash(openssl:*)",

      "// ===== ARCHIVE & COMPRESSION =====",
      "Bash(tar:*)",
      "Bash(zip:*)",
      "Bash(unzip:*)",
      "Bash(gzip:*)",
      "Bash(gunzip:*)",
      "Bash(bzip2:*)",
      "Bash(xz:*)",
      "Bash(7z:*)",
      "Bash(rar:*)",
      "Bash(unrar:*)",

      "// ===== TEXT PROCESSING =====",
      "Bash(jq:*)",
      "Bash(yq:*)",
      "Bash(xq:*)",
      "Bash(fx:*)",
      "Bash(gron:*)",
      "Bash(jo:*)",
      "Bash(csvtool:*)",
      "Bash(miller:*)",
      "Bash(pandoc:*)",
      "Bash(iconv:*)",
      "Bash(base64:*)",
      "Bash(md5sum:*)",
      "Bash(sha256sum:*)",
      "Bash(xxd:*)",
      "Bash(od:*)",
      "Bash(hexdump:*)",

      "// ===== SCRIPTS =====",
      "Bash(bash:*)",
      "Bash(sh:*)",
      "Bash(zsh:*)",
      "Bash(bash scripts/*)",
      "Bash(sh scripts/*)",
      "Bash(./scripts/*)",
      "Bash(./bin/*)",
      "Bash(./*.sh)",

      "// ===== MISC UTILITIES =====",
      "Bash(tree:*)",
      "Bash(watch:*)",
      "Bash(entr:*)",
      "Bash(ag:*)",
      "Bash(rg:*)",
      "Bash(fd:*)",
      "Bash(fzf:*)",
      "Bash(bat:*)",
      "Bash(exa:*)",
      "Bash(lsd:*)",
      "Bash(dust:*)",
      "Bash(duf:*)",
      "Bash(htop:*)",
      "Bash(btop:*)",
      "Bash(procs:*)",
      "Bash(ps:*)",
      "Bash(top:*)",
      "Bash(free:*)",
      "Bash(df:*)",
      "Bash(du:*)",
      "Bash(stat:*)",
      "Bash(file:*)",
      "Bash(lsof:*)",
      "Bash(strace:*)",
      "Bash(ltrace:*)",
      "Bash(nproc:*)",
      "Bash(uname:*)",
      "Bash(hostname:*)",
      "Bash(whoami:*)",
      "Bash(id:*)",
      "Bash(uptime:*)",
      "Bash(cal:*)",
      "Bash(bc:*)",
      "Bash(expr:*)",
      "Bash(seq:*)",
      "Bash(yes:*)",
      "Bash(clear:*)",
      "Bash(reset:*)",
      "Bash(tput:*)",
      "Bash(stty:*)",

      "// ===== DATABASE CLIENTS =====",
      "Bash(psql:*)",
      "Bash(mysql:*)",
      "Bash(mongosh:*)",
      "Bash(mongo:*)",
      "Bash(redis-cli:*)",
      "Bash(sqlite3:*)",
      "Bash(sqlcmd:*)",
      "Bash(bcp:*)",
      "Bash(pgcli:*)",
      "Bash(mycli:*)",
      "Bash(litecli:*)",
      "Bash(usql:*)",

      "// ===== CLOUD CLI =====",
      "Bash(aws:*)",
      "Bash(gcloud:*)",
      "Bash(az:*)",
      "Bash(doctl:*)",
      "Bash(linode-cli:*)",
      "Bash(heroku:*)",
      "Bash(vercel:*)",
      "Bash(netlify:*)",
      "Bash(flyctl:*)",
      "Bash(railway:*)",
      "Bash(render:*)",
      "Bash(wrangler:*)",
      "Bash(supabase:*)",
      "Bash(firebase:*)",
      "Bash(amplify:*)",
      "Bash(sst:*)",
      "Bash(pulumi:*)",
      "Bash(terraform:*)",
      "Bash(terragrunt:*)",
      "Bash(cdktf:*)",
      "Bash(cdk:*)",
      "Bash(sam:*)",
      "Bash(serverless:*)",
      "Bash(sls:*)",

      "// ===== CONTAINERS & ORCHESTRATION =====",
      "Bash(docker:*)",
      "Bash(docker-compose:*)",
      "Bash(docker compose:*)",
      "Bash(podman:*)",
      "Bash(buildah:*)",
      "Bash(skopeo:*)",
      "Bash(kubectl:*)",
      "Bash(k9s:*)",
      "Bash(helm:*)",
      "Bash(helmfile:*)",
      "Bash(kustomize:*)",
      "Bash(minikube:*)",
      "Bash(kind:*)",
      "Bash(k3s:*)",
      "Bash(k3d:*)",
      "Bash(microk8s:*)",
      "Bash(oc:*)",
      "Bash(istioctl:*)",
      "Bash(linkerd:*)",
      "Bash(argocd:*)",
      "Bash(flux:*)",
      "Bash(skaffold:*)",
      "Bash(tilt:*)",
      "Bash(devspace:*)",
      "Bash(garden:*)",
      "Bash(okteto:*)",

      "// ===== PACKAGE MANAGERS (local install) =====",
      "Bash(npm install:*)",
      "Bash(npm i:*)",
      "Bash(npm ci:*)",
      "Bash(npm uninstall:*)",
      "Bash(npm remove:*)",
      "Bash(yarn add:*)",
      "Bash(yarn remove:*)",
      "Bash(yarn install:*)",
      "Bash(pnpm add:*)",
      "Bash(pnpm remove:*)",
      "Bash(pnpm install:*)",
      "Bash(bun add:*)",
      "Bash(bun remove:*)",
      "Bash(bun install:*)",
      "Bash(pip install:*)",
      "Bash(pip uninstall:*)",
      "Bash(pip3 install:*)",
      "Bash(poetry add:*)",
      "Bash(poetry remove:*)",
      "Bash(poetry install:*)",
      "Bash(pdm add:*)",
      "Bash(pdm remove:*)",
      "Bash(pdm install:*)",
      "Bash(uv pip install:*)",
      "Bash(uv add:*)",
      "Bash(cargo add:*)",
      "Bash(cargo remove:*)",
      "Bash(go get:*)",
      "Bash(go mod tidy:*)",
      "Bash(composer require:*)",
      "Bash(composer remove:*)",
      "Bash(composer install:*)",
      "Bash(bundle add:*)",
      "Bash(bundle install:*)",
      "Bash(gem install:*)",
      "Bash(dotnet add:*)",
      "Bash(dotnet remove:*)",
      "Bash(flutter pub add:*)",
      "Bash(dart pub add:*)",

      "// ===== VERSION MANAGERS =====",
      "Bash(nvm:*)",
      "Bash(fnm:*)",
      "Bash(volta:*)",
      "Bash(n:*)",
      "Bash(pyenv:*)",
      "Bash(rbenv:*)",
      "Bash(goenv:*)",
      "Bash(rustup:*)",
      "Bash(sdkman:*)",
      "Bash(jabba:*)",
      "Bash(asdf:*)",
      "Bash(mise:*)",
      "Bash(rtx:*)"
    ],
    "deny": [
      "// ===== DANGEROUS SYSTEM COMMANDS =====",
      "Bash(sudo:*)",
      "Bash(su:*)",
      "Bash(doas:*)",
      "Bash(pkexec:*)",
      "Bash(rm -rf /:*)",
      "Bash(rm -rf ~:*)",
      "Bash(rm -rf /*:*)",
      "Bash(rm -rf $HOME:*)",
      "Bash(rm -rf %USERPROFILE%:*)",
      "Bash(chmod 777 /:*)",
      "Bash(chmod -R 777 /:*)",
      "Bash(chown -R:*:* /:*)",
      "Bash(:(){ :|:& };:)",
      "Bash(mkfs:*)",
      "Bash(dd if=/dev/zero:*)",
      "Bash(dd if=/dev/random:*)",
      "Bash(dd if=/dev/urandom:*)",
      "Bash(dd of=/dev/:*)",
      "Bash(wipefs:*)",
      "Bash(shred:*)",
      "Bash(shutdown:*)",
      "Bash(poweroff:*)",
      "Bash(reboot:*)",
      "Bash(halt:*)",
      "Bash(init 0)",
      "Bash(init 6)",
      "Bash(kill -9 1)",
      "Bash(kill -9 -1)",
      "Bash(killall -9:*)",
      "Bash(pkill -9:*)",
      "Bash(format:*)",
      "Bash(fdisk:*)",
      "Bash(parted:*)",
      "Bash(cfdisk:*)",
      "Bash(sfdisk:*)",
      "Bash(gdisk:*)",
      "Bash(lvremove:*)",
      "Bash(vgremove:*)",
      "Bash(pvremove:*)",
      "Bash(cryptsetup:*)",
      "Bash(mount:*)",
      "Bash(umount:*)",
      "Bash(modprobe:*)",
      "Bash(insmod:*)",
      "Bash(rmmod:*)",
      "Bash(systemctl:*)",
      "Bash(service:*)",
      "Bash(journalctl:*)",
      "Bash(iptables:*)",
      "Bash(nft:*)",
      "Bash(firewall-cmd:*)",
      "Bash(ufw:*)",
      "Bash(passwd:*)",
      "Bash(useradd:*)",
      "Bash(userdel:*)",
      "Bash(usermod:*)",
      "Bash(groupadd:*)",
      "Bash(groupdel:*)",
      "Bash(visudo:*)",
      "Bash(crontab -r:*)",
      "Bash(at:*)",
      "Bash(batch:*)"
    ],
    "ask": [
      "// ===== ONLY TRULY CRITICAL - ASK ONCE =====",
      "// Force push can destroy remote history",
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(git push origin --force:*)",
      "Bash(git push origin -f:*)",

      "// System-wide package managers (require admin)",
      "Bash(apt install:*)",
      "Bash(apt-get install:*)",
      "Bash(apt remove:*)",
      "Bash(apt purge:*)",
      "Bash(dpkg -i:*)",
      "Bash(yum install:*)",
      "Bash(dnf install:*)",
      "Bash(pacman -S:*)",
      "Bash(pacman -R:*)",
      "Bash(zypper install:*)",
      "Bash(apk add:*)",
      "Bash(brew install:*)",
      "Bash(brew uninstall:*)",
      "Bash(choco install:*)",
      "Bash(choco uninstall:*)",
      "Bash(scoop install:*)",
      "Bash(winget install:*)",
      "Bash(snap install:*)",
      "Bash(flatpak install:*)"
    ]
  }
}
EOF

    print_success "settings.local.json generated (MAX autonomy)"
}

generate_project_config() {
    print_step "Generating project-config.json..."

    local target="$CONFIG_TARGET_PATH"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Escape special characters for JSON
    local desc_escaped=$(echo "$CONFIG_PROJECT_DESC" | sed 's/"/\\"/g' | sed 's/$/\\n/' | tr -d '\n' | sed 's/\\n$//')
    local done_escaped=$(echo "$CONFIG_DONE_STATUS" | sed 's/"/\\"/g' | sed 's/$/\\n/' | tr -d '\n' | sed 's/\\n$//')
    local uncert_escaped=$(echo "$CONFIG_UNCERTAINTIES" | sed 's/"/\\"/g' | sed 's/$/\\n/' | tr -d '\n' | sed 's/\\n$//')

    cat > "$target/.claude/project-config.json" << EOF
{
  "version": "3.0",
  "created_at": "$timestamp",
  "communication_language": "$CONFIG_COMM_LANG",
  "project": {
    "name": "$CONFIG_PROJECT_NAME",
    "description": "$desc_escaped",
    "tech_stack": "$CONFIG_TECH_STACK",
    "frontend": "$CONFIG_FRONTEND",
    "database": "$CONFIG_DATABASE"
  },
  "context": {
    "done_status": "$done_escaped",
    "uncertainties": "$uncert_escaped"
  },
  "flow": {
    "type": "$CONFIG_FLOW_TYPE",
    "status": "initialized"
  },
  "advanced": {
    "enabled": $CONFIG_ADVANCED_MODE,
    "ci_cd": "${CONFIG_CI_CD:-None}",
    "testing": "${CONFIG_TESTING:-None}",
    "hosting": "${CONFIG_HOSTING:-None}"
  },
  "paths": {
    "target": "$CONFIG_TARGET_PATH",
    "pack_source": "$PACK_ROOT"
  }
}
EOF

    print_success "project-config.json generated"
}

generate_claude_md() {
    print_step "Generating CLAUDE.md..."

    local target="$CONFIG_TARGET_PATH"

    # Determine backend based on tech stack
    local backend=""
    case "$CONFIG_TECH_STACK" in
        typescript) backend="Node.js + Express/Fastify" ;;
        javascript) backend="Node.js + Express" ;;
        python)     backend="Python + FastAPI/Django" ;;
        go)         backend="Go + Gin/Echo" ;;
        rust)       backend="Rust + Actix/Axum" ;;
        java)       backend="Java + Spring Boot" ;;
        csharp)     backend="C# + ASP.NET Core" ;;
        dart)       backend="Dart + Shelf/Serverpod" ;;
        php)        backend="PHP + Laravel" ;;
        ruby)       backend="Ruby + Rails" ;;
        *)          backend="$CONFIG_TECH_STACK" ;;
    esac

    # Build description section
    local desc_section=""
    if [ -n "$CONFIG_PROJECT_DESC" ]; then
        desc_section="$CONFIG_PROJECT_DESC"
    else
        desc_section="{Brief project description - fill this in after discovery}"
    fi

    # Build status section for migrations
    local status_section=""
    if [ -n "$CONFIG_DONE_STATUS" ]; then
        status_section="
## Current Status
**Already implemented:**
$CONFIG_DONE_STATUS
"
    fi

    # Build uncertainties section
    local uncert_section=""
    if [ -n "$CONFIG_UNCERTAINTIES" ]; then
        uncert_section="
## Open Questions / Uncertainties
$CONFIG_UNCERTAINTIES
"
    fi

    cat > "$target/CLAUDE.md" << EOF
# CLAUDE.md

## Project: $CONFIG_PROJECT_NAME

## Quick Context
$desc_section
$status_section
$uncert_section
## Tech Stack
- **Backend:** $backend
- **Frontend:** $CONFIG_FRONTEND
- **Database:** $CONFIG_DATABASE
- **Language:** $CONFIG_TECH_STACK

## Communication
- **Respond in:** $CONFIG_COMM_LANG

## Agent System
This project uses the Agent Methodology Pack v3.0.
Entry point: \`.claude/agents/ORCHESTRATOR.md\`

## Quick Commands
- Start planning: \`@.claude/agents/ORCHESTRATOR.md\`
- View project state: \`@PROJECT-STATE.md\`
- View config: \`@.claude/project-config.json\`

## Conventions
- {Add your coding conventions}
- {Add your naming conventions}
- {Add your file organization rules}

## Current Sprint
See \`PROJECT-STATE.md\` for current sprint status.

---
*Generated by init-interactive.sh v3.0*
EOF

    print_success "CLAUDE.md generated"
}

generate_project_state() {
    print_step "Generating PROJECT-STATE.md..."

    local target="$CONFIG_TARGET_PATH"
    local date=$(date +%Y-%m-%d)

    # Build description
    local project_desc=""
    if [ -n "$CONFIG_PROJECT_DESC" ]; then
        project_desc="$CONFIG_PROJECT_DESC"
    else
        project_desc="*To be defined during discovery*"
    fi

    # Build done status section
    local done_section=""
    if [ -n "$CONFIG_DONE_STATUS" ]; then
        done_section="
## Already Implemented
$CONFIG_DONE_STATUS
"
    fi

    # Build uncertainties section
    local uncert_section=""
    if [ -n "$CONFIG_UNCERTAINTIES" ]; then
        uncert_section="
## Open Questions / Uncertainties
$CONFIG_UNCERTAINTIES
"
    fi

    cat > "$target/PROJECT-STATE.md" << EOF
# PROJECT-STATE.md

## Project: $CONFIG_PROJECT_NAME
**Last Updated:** $date
**Status:** Initialized
**Flow Type:** $CONFIG_FLOW_TYPE

## Description
$project_desc
$done_section
$uncert_section
## Current Phase
- [ ] Discovery
- [ ] Planning (PRD)
- [ ] Architecture
- [ ] Development
- [ ] Testing
- [ ] Release

## Active Sprint
*No sprint started yet*

## Blockers
*None*

## Recent Decisions
| Date | Decision | Rationale |
|------|----------|-----------|
| $date | Project initialized | Using Agent Methodology Pack v3.0 |

## Next Actions
1. Run initial flow based on project type: \`$CONFIG_FLOW_TYPE\`
2. Complete discovery interview
3. Generate PRD and architecture

---
*Auto-generated - will be updated by agents*
EOF

    print_success "PROJECT-STATE.md generated"
}

# ============================================================================
# LAUNCH CLAUDE
# ============================================================================

generate_startup_prompt() {
    local flow="$1"
    local prompt=""

    # Build context sections
    local desc_context=""
    if [ -n "$CONFIG_PROJECT_DESC" ]; then
        desc_context="
## Project Description
$CONFIG_PROJECT_DESC"
    fi

    local done_context=""
    if [ -n "$CONFIG_DONE_STATUS" ]; then
        done_context="
## Already Implemented
$CONFIG_DONE_STATUS"
    fi

    local uncert_context=""
    if [ -n "$CONFIG_UNCERTAINTIES" ]; then
        uncert_context="
## User's Uncertainties / Questions
$CONFIG_UNCERTAINTIES"
    fi

    case "$flow" in
        new_project)
            prompt="@.claude/agents/planning/DISCOVERY-AGENT.md

Start NEW PROJECT discovery interview.

## Project Configuration
- Name: $CONFIG_PROJECT_NAME
- Language: $CONFIG_TECH_STACK
- Frontend: $CONFIG_FRONTEND
- Database: $CONFIG_DATABASE
- Communication: $CONFIG_COMM_LANG
$desc_context
$uncert_context

## Interview Settings
- Type: new_project
- Depth: deep
- Target clarity: 85%+

## Instructions
1. Read @CLAUDE.md and @PROJECT-STATE.md for full context
2. Note the user's uncertainties above - address them during discovery
3. Conduct structured interview (7 questions per round)
4. Show clarity score after each round
5. Stop at 85%+ clarity or when user is satisfied

IMPORTANT: Respond in $CONFIG_COMM_LANG.

After discovery complete (clarity >= 80%), handoff to PM-AGENT for PRD creation."
            ;;

        migration)
            prompt="@.claude/agents/planning/DOC-AUDITOR.md

Perform MIGRATION AUDIT for existing project.

## Project Configuration
- Name: $CONFIG_PROJECT_NAME
- Path: $CONFIG_TARGET_PATH
- Language: $CONFIG_TECH_STACK
- Frontend: $CONFIG_FRONTEND
- Database: $CONFIG_DATABASE
- Communication: $CONFIG_COMM_LANG
$desc_context
$done_context
$uncert_context

## Audit Settings
- Type: gap_analysis
- Depth: deep

## Instructions
1. Read @CLAUDE.md and @PROJECT-STATE.md for context
2. Note what is ALREADY IMPLEMENTED above
3. Note user's UNCERTAINTIES - these are priority areas
4. Scan project structure
5. Identify existing documentation
6. Flag large files (>500 lines) for sharding
7. Create MIGRATION-PLAN.md with priorities

IMPORTANT: Respond in $CONFIG_COMM_LANG.

After audit, trigger DISCOVERY-AGENT (depth=quick) to fill gaps."
            ;;

        doc_audit)
            prompt="@.claude/agents/planning/DOC-AUDITOR.md

Perform FULL DOCUMENTATION AUDIT.

## Project Configuration
- Name: $CONFIG_PROJECT_NAME
- Path: $CONFIG_TARGET_PATH
- Communication: $CONFIG_COMM_LANG
$desc_context
$done_context
$uncert_context

## Audit Settings
- Type: full_audit
- Depth: exhaustive

## Instructions
1. Read @CLAUDE.md and @PROJECT-STATE.md for context
2. Inventory all documentation files
3. Apply DEEP DIVE protocol to each
4. Cross-reference between documents
5. Generate quality score
6. Address user's uncertainties if related to docs
7. Create AUDIT-REPORT.md

IMPORTANT: Respond in $CONFIG_COMM_LANG.

Generate comprehensive audit report with quality score and recommendations."
            ;;

        quick_start)
            prompt="@.claude/agents/ORCHESTRATOR.md

QUICK START mode - project already configured.

## Project Configuration
- Name: $CONFIG_PROJECT_NAME
- Language: $CONFIG_TECH_STACK
- Frontend: $CONFIG_FRONTEND
- Database: $CONFIG_DATABASE
- Communication: $CONFIG_COMM_LANG
$desc_context
$done_context
$uncert_context

## Mode
Skip discovery phase - ready to work.

## Instructions
1. Read @CLAUDE.md and @PROJECT-STATE.md for context
2. Note what is already implemented (if any)
3. Note user's uncertainties - can help with these
4. Ask user what they want to work on

IMPORTANT: Respond in $CONFIG_COMM_LANG.

Ask the user what they want to build or what task to start with."
            ;;
    esac

    echo "$prompt"
}

launch_claude() {
    print_header "LAUNCHING CLAUDE"
    echo ""

    local prompt
    prompt=$(generate_startup_prompt "$CONFIG_FLOW_TYPE")

    # Save startup prompt for reference
    echo "$prompt" > "$CONFIG_TARGET_PATH/.claude/STARTUP-PROMPT.md"

    print_info "Startup prompt saved to: .claude/STARTUP-PROMPT.md"
    echo ""

    print_step "Starting Claude with $CONFIG_FLOW_TYPE flow..."
    echo ""

    # Change to target directory
    cd "$CONFIG_TARGET_PATH" || exit 1

    print_success "Project ready at: $CONFIG_TARGET_PATH"
    echo ""
    print_info "Launching Claude interactive session..."
    echo ""

    # Launch Claude with the startup prompt (interactive mode)
    # Using @ syntax to include the prompt file content
    exec claude "Execute the instructions in @.claude/STARTUP-PROMPT.md - start immediately"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

run_interactive() {
    print_banner

    # Pre-flight check
    if ! check_claude_cli; then
        exit 1
    fi

    echo ""
    print_info "Press Enter to start the setup wizard..."
    read -r </dev/tty

    # Collect configuration
    ask_language
    ask_project_name
    ask_tech_stack
    ask_frontend
    ask_database
    ask_target_path
    ask_flow_type
    ask_project_description
    ask_advanced_mode

    # Show summary and confirm
    show_summary

    if ! confirm "Proceed with this configuration?"; then
        print_warning "Setup cancelled"
        exit 0
    fi

    # Execute setup
    print_header "SETTING UP PROJECT"
    echo ""

    create_directory_structure
    copy_agents
    copy_workflows
    copy_templates
    copy_patterns
    copy_checklists
    copy_state_templates
    copy_audit_templates
    copy_migration_templates
    copy_claude_scripts
    copy_all_scripts
    copy_docs_structure
    copy_config
    copy_claude_root_files
    copy_root_templates
    generate_settings_local
    generate_project_config
    generate_claude_md
    generate_project_state

    # Summary
    print_header "SETUP COMPLETE"
    echo ""
    echo -e "  ${WHITE}Project created at:${NC} ${GREEN}$CONFIG_TARGET_PATH${NC}"
    echo ""
    echo -e "  ${WHITE}.claude/ contents:${NC}"
    echo -e "    agents/      $(find "$CONFIG_TARGET_PATH/.claude/agents" -name "*.md" 2>/dev/null | wc -l) files"
    echo -e "    workflows/   $(find "$CONFIG_TARGET_PATH/.claude/workflows" -name "*.yaml" -o -name "*.md" 2>/dev/null | wc -l) files"
    echo -e "    templates/   $(find "$CONFIG_TARGET_PATH/.claude/templates" -name "*.md" 2>/dev/null | wc -l) files"
    echo -e "    patterns/    $(find "$CONFIG_TARGET_PATH/.claude/patterns" -name "*.md" 2>/dev/null | wc -l) files"
    echo -e "    checklists/  $(find "$CONFIG_TARGET_PATH/.claude/checklists" -name "*.md" 2>/dev/null | wc -l) files"
    echo -e "    audit/       $(find "$CONFIG_TARGET_PATH/.claude/audit" -name "*.md" 2>/dev/null | wc -l) files"
    echo -e "    migration/   $(find "$CONFIG_TARGET_PATH/.claude/migration" -name "*.md" 2>/dev/null | wc -l) files"
    echo -e "    state/       $(find "$CONFIG_TARGET_PATH/.claude/state" -name "*.md" 2>/dev/null | wc -l) files"
    echo -e "    scripts/     $(find "$CONFIG_TARGET_PATH/.claude/scripts" -name "*.sh" 2>/dev/null | wc -l) files"
    echo -e "    config/      $(find "$CONFIG_TARGET_PATH/.claude/config" -type f 2>/dev/null | wc -l) files"
    echo -e "    root docs    $(find "$CONFIG_TARGET_PATH/.claude" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l) files"
    echo ""
    echo -e "  ${WHITE}Other directories:${NC}"
    echo -e "    scripts/     $(find "$CONFIG_TARGET_PATH/scripts" -name "*.sh" 2>/dev/null | wc -l) .sh + $(find "$CONFIG_TARGET_PATH/scripts" -name "*.md" 2>/dev/null | wc -l) .md"
    echo -e "    docs/        $(find "$CONFIG_TARGET_PATH/docs" -name "*.md" 2>/dev/null | wc -l) files"
    echo -e "    templates/   $(find "$CONFIG_TARGET_PATH/templates" -type f 2>/dev/null | wc -l) files"
    echo ""

    print_info "You can delete the pack after verification:"
    echo -e "     ${YELLOW}rm -rf $PACK_ROOT${NC}"
    echo ""

    print_info "To restart later, run:"
    echo -e "     ${CYAN}cd $CONFIG_TARGET_PATH && claude \"@.claude/STARTUP-PROMPT.md\"${NC}"
    echo ""

    # Auto-launch Claude
    launch_claude
}

show_help() {
    echo "Agent Methodology Pack - Interactive Setup Wizard v3.0"
    echo ""
    echo "Usage:"
    echo "  $0                    Interactive mode (recommended)"
    echo "  $0 --help             Show this help"
    echo ""
    echo "Interactive mode guides you through:"
    echo "  1. Communication language selection"
    echo "  2. Project name"
    echo "  3. Tech stack (TypeScript, Python, Go, etc.)"
    echo "  4. Frontend framework"
    echo "  5. Database selection"
    echo "  6. Target path"
    echo "  7. Flow type (New/Migration/Audit/QuickStart)"
    echo "  8. Advanced options (CI/CD, Testing, Hosting)"
    echo ""
    echo "After configuration, the wizard will:"
    echo "  - Create directory structure"
    echo "  - Copy all agents, workflows, templates"
    echo "  - Generate project configuration"
    echo "  - Launch Claude with appropriate agent"
    echo ""
    echo "Pack location: $PACK_ROOT"
    exit 0
}

# Parse arguments
case "${1:-}" in
    -h|--help)
        show_help
        ;;
    *)
        run_interactive
        ;;
esac
