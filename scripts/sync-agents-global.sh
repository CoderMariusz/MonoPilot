#!/bin/bash
#
# sync-agents-global.sh
# Synchronizes agents from methodology pack to global ~/.claude/agents/
#
# This makes agents available in ANY terminal session, not just this project.
#
# Usage:
#   bash scripts/sync-agents-global.sh
#   bash scripts/sync-agents-global.sh --force  (overwrite without asking)
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_ROOT="$(dirname "$SCRIPT_DIR")"
SOURCE_AGENTS="$PACK_ROOT/.claude/agents"
GLOBAL_AGENTS="$HOME/.claude/agents"

# Parse arguments
FORCE=false
if [[ "$1" == "--force" ]]; then
    FORCE=true
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Agent Methodology Pack - Global Agent Sync${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check source exists
if [ ! -d "$SOURCE_AGENTS" ]; then
    echo -e "${RED}ERROR: Source agents not found: $SOURCE_AGENTS${NC}"
    exit 1
fi

# Create global directory if needed
mkdir -p "$GLOBAL_AGENTS"

echo -e "${YELLOW}Source:${NC} $SOURCE_AGENTS"
echo -e "${YELLOW}Target:${NC} $GLOBAL_AGENTS"
echo ""

# Count agents
count_agents() {
    local dir="$1"
    find "$dir" -name "*.md" -type f 2>/dev/null | wc -l
}

SOURCE_COUNT=$(count_agents "$SOURCE_AGENTS")
TARGET_COUNT=$(count_agents "$GLOBAL_AGENTS")

echo -e "${GREEN}Agents in pack:${NC} $SOURCE_COUNT"
echo -e "${GREEN}Agents in global:${NC} $TARGET_COUNT"
echo ""

# Confirm unless force
if [ "$FORCE" = false ]; then
    echo -e "${YELLOW}This will copy/update agents to global location.${NC}"
    echo -e "${YELLOW}Existing agents will be overwritten.${NC}"
    echo ""
    echo -n -e "${YELLOW}Continue? (y/n):${NC} " >&2
    read -r confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo -e "${RED}Cancelled${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}Syncing agents...${NC}"
echo ""

# Copy ORCHESTRATOR.md (root level)
if [ -f "$SOURCE_AGENTS/ORCHESTRATOR.md" ]; then
    cp "$SOURCE_AGENTS/ORCHESTRATOR.md" "$GLOBAL_AGENTS/orchestrator.md"
    echo -e "${GREEN}✓${NC} orchestrator.md"
fi

# Copy planning agents
if [ -d "$SOURCE_AGENTS/planning" ]; then
    for file in "$SOURCE_AGENTS/planning"/*.md; do
        if [ -f "$file" ]; then
            filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
            cp "$file" "$GLOBAL_AGENTS/$filename"
            echo -e "${GREEN}✓${NC} $filename"
        fi
    done
fi

# Copy development agents
if [ -d "$SOURCE_AGENTS/development" ]; then
    for file in "$SOURCE_AGENTS/development"/*.md; do
        if [ -f "$file" ]; then
            filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
            cp "$file" "$GLOBAL_AGENTS/$filename"
            echo -e "${GREEN}✓${NC} $filename"
        fi
    done
fi

# Copy quality agents
if [ -d "$SOURCE_AGENTS/quality" ]; then
    for file in "$SOURCE_AGENTS/quality"/*.md; do
        if [ -f "$file" ]; then
            filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
            cp "$file" "$GLOBAL_AGENTS/$filename"
            echo -e "${GREEN}✓${NC} $filename"
        fi
    done
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Sync complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

FINAL_COUNT=$(count_agents "$GLOBAL_AGENTS")
echo -e "${GREEN}Global agents now:${NC} $FINAL_COUNT"
echo ""
echo -e "${YELLOW}Agents are now available globally!${NC}"
echo -e "${YELLOW}You can use them in any project by invoking:${NC}"
echo ""
echo -e "  ${BLUE}@orchestrator${NC} - Start task orchestration"
echo -e "  ${BLUE}@discovery-agent${NC} - Run discovery interview"
echo -e "  ${BLUE}@architect-agent${NC} - Architecture design"
echo -e "  ${BLUE}@pm-agent${NC} - Product management"
echo ""
