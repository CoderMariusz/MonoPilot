#!/bin/bash
#
# Sync Agents & Skills to Global Knowledge Base
# Version: 2.0.0
# Purpose: Share all agent definitions and skills globally
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

GLOBAL_DIR="$HOME/.claude-agent-pack/global"
LOCAL_AGENTS=".claude/agents"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}        ${YELLOW}SYNC AGENTS TO GLOBAL KB${NC}                         ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if global dir exists
if [ ! -d "$GLOBAL_DIR" ]; then
    echo -e "${RED}❌ Global directory not found${NC}"
    echo -e "Run: bash scripts/setup-global-cache.sh"
    exit 1
fi

# Check if agents dir exists
if [ ! -d "$LOCAL_AGENTS" ]; then
    echo -e "${RED}❌ Agents directory not found${NC}"
    exit 1
fi

echo -e "${BLUE}Source: ${CYAN}$LOCAL_AGENTS${NC}"
echo -e "${BLUE}Target: ${CYAN}$GLOBAL_DIR/agents/${NC}"
echo ""

# Count agents
AGENT_COUNT=$(find "$LOCAL_AGENTS" -name "*.md" -type f | wc -l)
echo -e "${YELLOW}Found $AGENT_COUNT agent definitions${NC}"
echo ""

# Copy agents
echo -e "${YELLOW}Copying agents...${NC}"
echo ""

COPIED=0
find "$LOCAL_AGENTS" -name "*.md" -type f | while read agent_file; do
    AGENT_NAME=$(basename "$agent_file")
    TARGET="$GLOBAL_DIR/agents/$AGENT_NAME"

    cp "$agent_file" "$TARGET"
    echo -e "${GREEN}✓${NC} $AGENT_NAME"
    ((COPIED++)) || true
done

# Update registry using Python
echo ""
echo -e "${YELLOW}Updating registry...${NC}"

python3 << 'PYTHON_SCRIPT'
import json
import os
from pathlib import Path
from datetime import datetime

global_dir = Path.home() / ".claude-agent-pack" / "global"
agents_dir = global_dir / "agents"
registry_file = agents_dir / "registry.json"

# Load registry
with open(registry_file) as f:
    registry = json.load(f)

# Scan for agent files
agent_files = list(agents_dir.glob("*.md"))

agents = []
for agent_file in agent_files:
    agent_name = agent_file.stem
    agents.append({
        "name": agent_name,
        "file": agent_file.name,
        "project": "MonoPilot",
        "sharedAt": datetime.now().isoformat()
    })

# Update registry
registry["agents"] = agents
registry["metadata"]["totalAgents"] = len(agents)
registry["metadata"]["lastUpdated"] = datetime.now().isoformat()

# Save
with open(registry_file, 'w') as f:
    json.dump(registry, f, indent=2)

print(f"[OK] Registry updated: {len(agents)} agents")
PYTHON_SCRIPT

# Summary
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}SYNC COMPLETE${NC}                                           ${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "  Agents synced: ${GREEN}$AGENT_COUNT${NC}"
echo -e "  Location:      ${CYAN}$GLOBAL_DIR/agents/${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${GREEN}✅ All agents available globally!${NC}"
echo ""
echo -e "${YELLOW}💡 Next:${NC}"
echo "  - Other projects can now access these agents"
echo "  - Run: python3 .claude/cache/global_cache.py"
echo ""
