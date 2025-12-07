#!/bin/bash
# Interactive Project Setup Wizard v2.0
# Guides user through new project creation or existing project migration
#
# IMPORTANT: This script distinguishes between:
#   - PACK_ROOT: Where agent-methodology-pack is located
#   - TARGET_PROJECT: Where the user's project is located
#
# Usage:
#   Interactive mode: bash scripts/init-interactive.sh
#   CLI mode: bash scripts/init-interactive.sh --mode {new|existing|migrate} [OPTIONS]
#
# Examples:
#   bash scripts/init-interactive.sh --mode new --name my-project --target ../my-project
#   bash scripts/init-interactive.sh --mode migrate --target /path/to/project
#   bash scripts/init-interactive.sh --mode existing --target . --lang typescript
#
# Author: Agent Methodology Pack
# Version: 2.0 (Separated PACK_ROOT from TARGET_PROJECT, added language & suggestions)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Get script directory (this is where the pack is)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_ROOT="$(dirname "$SCRIPT_DIR")"

# Target project (will be set by user)
TARGET_PROJECT=""

# Project configuration
PROJECT_NAME=""
PROJECT_LANG=""
SKIP_DISCOVERY=false

# Supported languages
SUPPORTED_LANGS=("typescript" "javascript" "python" "go" "rust" "java" "csharp" "dart" "other")

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

print_menu_item() {
    echo -e "${CYAN}  [$1]${NC} $2"
}

# Detect parent directory as suggested target
suggest_target_path() {
    local parent_dir="$(dirname "$PACK_ROOT")"
    local current_dir="$(pwd)"

    echo ""
    print_info "Suggested target paths:"
    echo ""
    echo -e "  ${GREEN}[1]${NC} Parent directory: ${CYAN}$parent_dir${NC}"
    echo -e "  ${GREEN}[2]${NC} Current directory: ${CYAN}$current_dir${NC}"

    # Check if we're inside another project (has package.json, etc.)
    if [ -f "$parent_dir/package.json" ]; then
        echo -e "      ${YELLOW}(Node.js project detected)${NC}"
    elif [ -f "$parent_dir/requirements.txt" ] || [ -f "$parent_dir/pyproject.toml" ]; then
        echo -e "      ${YELLOW}(Python project detected)${NC}"
    elif [ -f "$parent_dir/go.mod" ]; then
        echo -e "      ${YELLOW}(Go project detected)${NC}"
    elif [ -f "$parent_dir/Cargo.toml" ]; then
        echo -e "      ${YELLOW}(Rust project detected)${NC}"
    elif [ -f "$parent_dir/pubspec.yaml" ]; then
        echo -e "      ${YELLOW}(Dart/Flutter project detected)${NC}"
    fi

    echo -e "  ${GREEN}[3]${NC} Custom path (you will enter it)"
    echo ""
}

# Detect project language from files
detect_language() {
    local path="$1"

    if [ -f "$path/package.json" ]; then
        if grep -q "typescript" "$path/package.json" 2>/dev/null; then
            echo "typescript"
        else
            echo "javascript"
        fi
    elif [ -f "$path/tsconfig.json" ]; then
        echo "typescript"
    elif [ -f "$path/requirements.txt" ] || [ -f "$path/pyproject.toml" ] || [ -f "$path/setup.py" ]; then
        echo "python"
    elif [ -f "$path/go.mod" ]; then
        echo "go"
    elif [ -f "$path/Cargo.toml" ]; then
        echo "rust"
    elif [ -f "$path/pom.xml" ] || [ -f "$path/build.gradle" ]; then
        echo "java"
    elif [ -f "$path/pubspec.yaml" ]; then
        echo "dart"
    elif [ -f "$path/*.csproj" ] 2>/dev/null || [ -f "$path/*.sln" ] 2>/dev/null; then
        echo "csharp"
    else
        echo "unknown"
    fi
}

# Show language selection menu
show_language_menu() {
    print_header "Select Project Language"
    echo ""
    print_menu_item "1" "TypeScript"
    print_menu_item "2" "JavaScript"
    print_menu_item "3" "Python"
    print_menu_item "4" "Go"
    print_menu_item "5" "Rust"
    print_menu_item "6" "Java"
    print_menu_item "7" "C#"
    print_menu_item "8" "Dart/Flutter"
    print_menu_item "9" "Other"
    echo ""
}

# Get language from selection
get_language_from_selection() {
    local selection="$1"
    case "$selection" in
        1) echo "typescript" ;;
        2) echo "javascript" ;;
        3) echo "python" ;;
        4) echo "go" ;;
        5) echo "rust" ;;
        6) echo "java" ;;
        7) echo "csharp" ;;
        8) echo "dart" ;;
        9) echo "other" ;;
        *) echo "unknown" ;;
    esac
}

# Get user input (handles both interactive and non-interactive)
get_choice() {
    local prompt="$1"
    local choice

    echo -n -e "${YELLOW}${prompt}${NC} " >&2

    if read -r choice 2>/dev/null; then
        choice="${choice%$'\r'}"
        choice="${choice#"${choice%%[![:space:]]*}"}"
        choice="${choice%"${choice##*[![:space:]]}"}"
        echo "$choice"
    else
        echo ""
        print_error "Cannot read input in non-interactive mode"
        print_info "Use CLI arguments instead. See --help for details"
        exit 1
    fi
}

# Copy pack to target project
copy_pack_to_target() {
    local target="$1"

    print_step "Copying Agent Methodology Pack to target..."

    # Create target if it doesn't exist
    mkdir -p "$target"

    # Copy essential directories
    cp -r "$PACK_ROOT/.claude" "$target/" 2>/dev/null || true
    cp -r "$PACK_ROOT/docs" "$target/" 2>/dev/null || true
    cp -r "$PACK_ROOT/scripts" "$target/" 2>/dev/null || true
    cp -r "$PACK_ROOT/templates" "$target/" 2>/dev/null || true

    # Copy essential files (but not overwrite existing README, etc.)
    cp "$PACK_ROOT/CLAUDE.md" "$target/" 2>/dev/null || true
    cp "$PACK_ROOT/PROJECT-STATE.md" "$target/" 2>/dev/null || true

    # Don't copy pack's README, INSTALL, etc. to target
    # User's project should keep its own README

    # Copy settings template as local settings (high autonomy mode)
    if [ -f "$PACK_ROOT/templates/settings.local.json.template" ]; then
        cp "$PACK_ROOT/templates/settings.local.json.template" "$target/.claude/settings.local.json"
        print_success "Claude permissions configured (high autonomy mode)"
    fi

    print_success "Pack copied to: $target"
}

# Update CLAUDE.md with project info
update_claude_md() {
    local target="$1"
    local name="$2"
    local lang="$3"

    local claude_file="$target/CLAUDE.md"

    # Get language-specific tech stack
    local backend_tech=""
    local frontend_tech=""
    local db_tech="PostgreSQL"

    case "$lang" in
        typescript|javascript)
            backend_tech="Node.js + Express"
            frontend_tech="React + TypeScript"
            ;;
        python)
            backend_tech="Python + FastAPI"
            frontend_tech="React or Vue.js"
            ;;
        go)
            backend_tech="Go + Gin/Echo"
            frontend_tech="React or Vue.js"
            ;;
        rust)
            backend_tech="Rust + Actix/Axum"
            frontend_tech="React or Yew"
            ;;
        java)
            backend_tech="Java + Spring Boot"
            frontend_tech="React or Angular"
            ;;
        dart)
            backend_tech="Dart + Shelf/Serverpod"
            frontend_tech="Flutter"
            db_tech="Firebase/PostgreSQL"
            ;;
        csharp)
            backend_tech="C# + ASP.NET Core"
            frontend_tech="Blazor or React"
            ;;
        *)
            backend_tech="{technology}"
            frontend_tech="{technology}"
            ;;
    esac

    cat > "$claude_file" << EOF
# CLAUDE.md

## Project: $name

## Quick Context
{Brief project description - fill this in}

## Tech Stack
- Backend: $backend_tech
- Frontend: $frontend_tech
- Database: $db_tech

## Agent System
This project uses the Agent Methodology Pack.
See \`.claude/agents/ORCHESTRATOR.md\` for entry point.

## Key Commands
- Start planning: \`@.claude/agents/ORCHESTRATOR.md\`
- View state: \`@PROJECT-STATE.md\`

## Conventions
- Language: $lang
- {Add your coding conventions}
- {Add your naming conventions}

## Current Sprint
See \`@PROJECT-STATE.md\` for current sprint status.
EOF

    print_success "Updated CLAUDE.md with project configuration"
}

# Create startup prompt for Claude
create_startup_prompt() {
    local target="$1"
    local flow_type="$2"
    local name="$3"
    local lang="$4"

    local startup_file="$target/.claude/STARTUP-PROMPT.md"
    mkdir -p "$target/.claude"

    cat > "$startup_file" << EOF
# Claude Startup Prompt

## Auto-generated by init-interactive.sh v2.0
**Date:** $(date +%Y-%m-%d)
**Flow Type:** $flow_type
**Project:** $name
**Language:** $lang
**Path:** $target

---

## Instructions for Claude

@.claude/agents/ORCHESTRATOR.md

### Context
This is a ${flow_type} project initialization.
- **Project Name:** $name
- **Primary Language:** $lang

### Required Flow
Start with **DISCOVERY-FLOW** to ensure complete project understanding.

### Flow Steps
1. **DISCOVERY-AGENT** - Conduct project interview
2. **Domain agents** - Ask specific questions (ARCHITECT, PM, RESEARCH)
3. **DOC-AUDITOR** - Scan and validate documentation
4. **Gap Analysis** - Identify missing information
5. **Confirmation** - Get user approval

### Start Command
\`\`\`
Start DISCOVERY-FLOW for this ${flow_type} project.
Project name: $name
Language: $lang
\`\`\`

---

**To use:** Copy this file content or reference @.claude/STARTUP-PROMPT.md
EOF

    echo "$startup_file"
}

# Show CLI help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Interactive mode (no arguments):"
    echo "  $0"
    echo ""
    echo "CLI mode:"
    echo "  $0 --mode {new|existing|migrate} [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --mode MODE        Operation mode: new, existing, or migrate"
    echo "  --name NAME        Project name"
    echo "  --target PATH      Target project path (where to set up)"
    echo "  --lang LANGUAGE    Project language (typescript, python, go, etc.)"
    echo "  --skip-discovery   Skip DISCOVERY-FLOW (advanced users only)"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --mode new --name my-app --target ../my-app --lang typescript"
    echo "  $0 --mode migrate --target /path/to/existing/project"
    echo "  $0 --mode existing --target . --lang python"
    echo ""
    echo "Supported languages:"
    echo "  typescript, javascript, python, go, rust, java, csharp, dart, other"
    echo ""
    echo "IMPORTANT:"
    echo "  - PACK_ROOT: $PACK_ROOT (where this script lives)"
    echo "  - TARGET: Where your project is/will be"
    echo "  - After migration, you can delete the pack directory"
    exit 0
}

# Parse CLI arguments
CLI_MODE=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            CLI_MODE="$2"
            shift 2
            ;;
        --name)
            PROJECT_NAME="$2"
            shift 2
            ;;
        --target)
            TARGET_PROJECT="$2"
            shift 2
            ;;
        --lang)
            PROJECT_LANG="$2"
            shift 2
            ;;
        --skip-discovery)
            SKIP_DISCOVERY=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            print_error "Unknown argument: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# New project flow (CLI)
new_project_flow_cli() {
    print_header "NEW PROJECT SETUP (CLI MODE)"

    # Validate required params
    if [ -z "$PROJECT_NAME" ]; then
        print_error "Project name required. Use --name PROJECT_NAME"
        exit 1
    fi

    if [ -z "$TARGET_PROJECT" ]; then
        print_error "Target path required. Use --target PATH"
        exit 1
    fi

    # Create target directory
    mkdir -p "$TARGET_PROJECT"
    TARGET_PROJECT="$(cd "$TARGET_PROJECT" && pwd)"

    # Detect or use provided language
    if [ -z "$PROJECT_LANG" ]; then
        PROJECT_LANG="typescript"  # Default
    fi

    print_info "Project: $PROJECT_NAME"
    print_info "Target: $TARGET_PROJECT"
    print_info "Language: $PROJECT_LANG"
    echo ""

    # Copy pack to target
    copy_pack_to_target "$TARGET_PROJECT"

    # Update CLAUDE.md
    update_claude_md "$TARGET_PROJECT" "$PROJECT_NAME" "$PROJECT_LANG"

    # Create startup prompt
    local startup_file
    startup_file=$(create_startup_prompt "$TARGET_PROJECT" "new" "$PROJECT_NAME" "$PROJECT_LANG")

    print_success "Project initialized at: $TARGET_PROJECT"
    print_success "Startup file: $startup_file"

    echo ""
    print_info "After setup is complete, you can delete the pack:"
    echo -e "     ${YELLOW}rm -rf $PACK_ROOT${NC}"
    echo ""

    # Auto-launch Claude Code with DISCOVERY-FLOW
    print_step "Launching Claude Code..."
    cd "$TARGET_PROJECT"
    claude "Read @.claude/STARTUP-PROMPT.md and start DISCOVERY-FLOW for this new project. Project name: $PROJECT_NAME, Language: $PROJECT_LANG"
}

# Migrate existing project flow (CLI)
migrate_project_flow_cli() {
    print_header "PROJECT MIGRATION (CLI MODE)"

    if [ -z "$TARGET_PROJECT" ]; then
        print_error "Target path required. Use --target PATH"
        exit 1
    fi

    # Resolve path
    if [ ! -d "$TARGET_PROJECT" ]; then
        print_error "Target directory does not exist: $TARGET_PROJECT"
        exit 1
    fi

    TARGET_PROJECT="$(cd "$TARGET_PROJECT" && pwd)"

    # Get project name from directory if not provided
    if [ -z "$PROJECT_NAME" ]; then
        PROJECT_NAME="$(basename "$TARGET_PROJECT")"
    fi

    # Detect language if not provided
    if [ -z "$PROJECT_LANG" ]; then
        PROJECT_LANG=$(detect_language "$TARGET_PROJECT")
        if [ "$PROJECT_LANG" = "unknown" ]; then
            PROJECT_LANG="other"
        fi
    fi

    print_info "Project: $PROJECT_NAME"
    print_info "Target: $TARGET_PROJECT"
    print_info "Detected Language: $PROJECT_LANG"
    echo ""

    # Check if target already has .claude
    if [ -d "$TARGET_PROJECT/.claude" ]; then
        print_warning "Target already has .claude directory"
        print_info "Will merge/update existing configuration"
    fi

    # Copy pack to target
    copy_pack_to_target "$TARGET_PROJECT"

    # Update CLAUDE.md
    update_claude_md "$TARGET_PROJECT" "$PROJECT_NAME" "$PROJECT_LANG"

    # Create startup prompt
    local startup_file
    startup_file=$(create_startup_prompt "$TARGET_PROJECT" "migrate" "$PROJECT_NAME" "$PROJECT_LANG")

    print_success "Migration complete: $TARGET_PROJECT"

    echo ""
    print_info "After migration is verified, you can delete the pack:"
    echo -e "     ${YELLOW}rm -rf $PACK_ROOT${NC}"
    echo ""

    # Auto-launch Claude Code with DISCOVERY-FLOW
    print_step "Launching Claude Code..."
    cd "$TARGET_PROJECT"
    claude "Read @.claude/STARTUP-PROMPT.md and start DISCOVERY-FLOW for this migrate project. Project name: $PROJECT_NAME, Language: $PROJECT_LANG"
}

# Interactive new project flow
new_project_flow_interactive() {
    print_header "NEW PROJECT SETUP"
    echo ""

    # 1. Get project name
    PROJECT_NAME=$(get_choice "Enter project name:")
    if [ -z "$PROJECT_NAME" ]; then
        print_error "Project name cannot be empty"
        return
    fi

    # 2. Suggest and get target path
    suggest_target_path
    local path_choice=$(get_choice "Select target path [1-3]:")

    case "$path_choice" in
        1) TARGET_PROJECT="$(dirname "$PACK_ROOT")/$PROJECT_NAME" ;;
        2) TARGET_PROJECT="$(pwd)/$PROJECT_NAME" ;;
        3) TARGET_PROJECT=$(get_choice "Enter custom path:") ;;
        *) TARGET_PROJECT="$(dirname "$PACK_ROOT")/$PROJECT_NAME" ;;
    esac

    # 3. Get language
    show_language_menu
    local lang_choice=$(get_choice "Select language [1-9]:")
    PROJECT_LANG=$(get_language_from_selection "$lang_choice")

    # 4. Confirm
    echo ""
    print_header "CONFIRM CONFIGURATION"
    echo ""
    echo -e "  Project Name: ${GREEN}$PROJECT_NAME${NC}"
    echo -e "  Target Path:  ${GREEN}$TARGET_PROJECT${NC}"
    echo -e "  Language:     ${GREEN}$PROJECT_LANG${NC}"
    echo ""

    local confirm=$(get_choice "Proceed? (y/n):")
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        print_warning "Setup cancelled"
        return
    fi

    # Create and set up
    mkdir -p "$TARGET_PROJECT"
    TARGET_PROJECT="$(cd "$TARGET_PROJECT" && pwd)"

    copy_pack_to_target "$TARGET_PROJECT"
    update_claude_md "$TARGET_PROJECT" "$PROJECT_NAME" "$PROJECT_LANG"

    local startup_file
    startup_file=$(create_startup_prompt "$TARGET_PROJECT" "new" "$PROJECT_NAME" "$PROJECT_LANG")

    print_success "Project initialized!"

    echo ""
    print_info "After setup is complete, you can delete the pack:"
    echo -e "     ${YELLOW}rm -rf $PACK_ROOT${NC}"
    echo ""

    # Auto-launch Claude Code with DISCOVERY-FLOW
    print_step "Launching Claude Code..."
    cd "$TARGET_PROJECT"
    claude "Read @.claude/STARTUP-PROMPT.md and start DISCOVERY-FLOW for this new project. Project name: $PROJECT_NAME, Language: $PROJECT_LANG"
}

# Interactive migrate flow
migrate_project_flow_interactive() {
    print_header "MIGRATE EXISTING PROJECT"
    echo ""

    # 1. Suggest and get target path
    suggest_target_path
    local path_choice=$(get_choice "Select project to migrate [1-3]:")

    case "$path_choice" in
        1) TARGET_PROJECT="$(dirname "$PACK_ROOT")" ;;
        2) TARGET_PROJECT="$(pwd)" ;;
        3) TARGET_PROJECT=$(get_choice "Enter project path:") ;;
        *) TARGET_PROJECT="$(dirname "$PACK_ROOT")" ;;
    esac

    # Validate
    if [ ! -d "$TARGET_PROJECT" ]; then
        print_error "Directory does not exist: $TARGET_PROJECT"
        return
    fi

    TARGET_PROJECT="$(cd "$TARGET_PROJECT" && pwd)"

    # 2. Get/detect project name
    local detected_name="$(basename "$TARGET_PROJECT")"
    PROJECT_NAME=$(get_choice "Project name [$detected_name]:")
    if [ -z "$PROJECT_NAME" ]; then
        PROJECT_NAME="$detected_name"
    fi

    # 3. Detect/get language
    local detected_lang=$(detect_language "$TARGET_PROJECT")
    print_info "Detected language: $detected_lang"

    show_language_menu
    local lang_choice=$(get_choice "Select language [1-9] (Enter to keep detected):")
    if [ -n "$lang_choice" ]; then
        PROJECT_LANG=$(get_language_from_selection "$lang_choice")
    else
        PROJECT_LANG="$detected_lang"
        if [ "$PROJECT_LANG" = "unknown" ]; then
            PROJECT_LANG="other"
        fi
    fi

    # 4. Confirm
    echo ""
    print_header "CONFIRM MIGRATION"
    echo ""
    echo -e "  Project Name: ${GREEN}$PROJECT_NAME${NC}"
    echo -e "  Target Path:  ${GREEN}$TARGET_PROJECT${NC}"
    echo -e "  Language:     ${GREEN}$PROJECT_LANG${NC}"
    echo ""

    local confirm=$(get_choice "Proceed with migration? (y/n):")
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        print_warning "Migration cancelled"
        return
    fi

    # Migrate
    copy_pack_to_target "$TARGET_PROJECT"
    update_claude_md "$TARGET_PROJECT" "$PROJECT_NAME" "$PROJECT_LANG"

    local startup_file
    startup_file=$(create_startup_prompt "$TARGET_PROJECT" "migrate" "$PROJECT_NAME" "$PROJECT_LANG")

    print_success "Migration complete!"

    echo ""
    print_info "After setup is complete, you can delete the pack:"
    echo -e "     ${YELLOW}rm -rf $PACK_ROOT${NC}"
    echo ""

    # Auto-launch Claude Code with DISCOVERY-FLOW
    print_step "Launching Claude Code..."
    cd "$TARGET_PROJECT"
    claude "Read @.claude/STARTUP-PROMPT.md and start DISCOVERY-FLOW for this migrate project. Project name: $PROJECT_NAME, Language: $PROJECT_LANG"
}

# Show welcome banner
show_welcome() {
    clear
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       AGENT METHODOLOGY PACK - INTERACTIVE SETUP v2.0      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${MAGENTA}Welcome to the Agent Methodology Pack Setup Wizard!${NC}"
    echo ""
    echo -e "Pack location: ${CYAN}$PACK_ROOT${NC}"
    echo ""
    echo -e "${YELLOW}This wizard will help you:${NC}"
    echo -e "  • Set up a new project with the agent framework"
    echo -e "  • Migrate an existing project to use agents"
    echo -e "  • Configure project-specific settings"
    echo ""
}

# Main menu
show_main_menu() {
    print_header "What would you like to do?"
    echo ""
    print_menu_item "1" "Create NEW project"
    print_menu_item "2" "Migrate EXISTING project"
    print_menu_item "3" "Exit"
    echo ""
}

# Main function
main() {
    # CLI MODE
    if [ -n "$CLI_MODE" ]; then
        case "$CLI_MODE" in
            new)
                new_project_flow_cli
                ;;
            existing|migrate)
                migrate_project_flow_cli
                ;;
            *)
                print_error "Invalid mode: $CLI_MODE"
                print_info "Valid modes: new, existing, migrate"
                exit 1
                ;;
        esac
        exit 0
    fi

    # INTERACTIVE MODE
    show_welcome

    while true; do
        show_main_menu

        local choice
        choice=$(get_choice "Select option [1-3]:")

        case "$choice" in
            1)
                new_project_flow_interactive
                ;;
            2)
                migrate_project_flow_interactive
                ;;
            3)
                echo ""
                print_info "Thank you for using Agent Methodology Pack!"
                echo ""
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-3."
                sleep 1
                ;;
        esac

        echo ""
        echo -e "${YELLOW}Press Enter to return to main menu...${NC}"
        read -r
        clear
        show_welcome
    done
}

# Run main
main
