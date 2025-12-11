#!/bin/bash
#
# Sync Skills to Global Knowledge Base
# Version: 2.0.0
# Purpose: Share all skills globally
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

GLOBAL_DIR="$HOME/.claude-agent-pack/global"
LOCAL_SKILLS=".claude/skills"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}        ${YELLOW}SYNC SKILLS TO GLOBAL KB${NC}                         ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if global dir exists
if [ ! -d "$GLOBAL_DIR" ]; then
    echo -e "${RED}❌ Global directory not found${NC}"
    echo -e "Run: bash scripts/setup-global-cache.sh"
    exit 1
fi

# Check if skills dir exists
if [ ! -d "$LOCAL_SKILLS" ]; then
    echo -e "${RED}❌ Skills directory not found${NC}"
    exit 1
fi

echo -e "${BLUE}Source: ${CYAN}$LOCAL_SKILLS${NC}"
echo -e "${BLUE}Target: ${CYAN}$GLOBAL_DIR/skills/${NC}"
echo ""

# Count skills
SKILL_COUNT=$(find "$LOCAL_SKILLS" -name "*.md" -type f | wc -l)
echo -e "${YELLOW}Found $SKILL_COUNT skill definitions${NC}"
echo ""

# Create category structure in global
mkdir -p "$GLOBAL_DIR/skills/generic"
mkdir -p "$GLOBAL_DIR/skills/domain-specific"

# Copy skills
echo -e "${YELLOW}Copying skills...${NC}"
echo ""

COPIED=0
find "$LOCAL_SKILLS" -name "*.md" -type f | while read skill_file; do
    SKILL_NAME=$(basename "$skill_file")

    # Determine category (generic or domain-specific)
    if [[ "$skill_file" == *"/generic/"* ]]; then
        TARGET="$GLOBAL_DIR/skills/generic/$SKILL_NAME"
    else
        TARGET="$GLOBAL_DIR/skills/domain-specific/$SKILL_NAME"
    fi

    cp "$skill_file" "$TARGET"
    echo -e "${GREEN}✓${NC} $SKILL_NAME"
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
skills_dir = global_dir / "skills"
registry_file = skills_dir / "registry.json"

# Scan for skill files
skill_files = list(skills_dir.glob("**/*.md"))

skills = []
for skill_file in skill_files:
    # Get category from parent dir
    category = skill_file.parent.name if skill_file.parent.name != "skills" else "generic"

    skill_name = skill_file.stem
    skills.append({
        "name": skill_name,
        "file": str(skill_file.relative_to(skills_dir)),
        "category": category,
        "project": "MonoPilot",
        "sharedAt": datetime.now().isoformat()
    })

# Update registry
registry = {
    "version": "1.0.0",
    "skills": skills,
    "metadata": {
        "totalSkills": len(skills),
        "lastUpdated": datetime.now().isoformat()
    }
}

# Save
with open(registry_file, 'w') as f:
    json.dump(registry, f, indent=2)

print(f"[OK] Registry updated: {len(skills)} skills")
PYTHON_SCRIPT

# Summary
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}SYNC COMPLETE${NC}                                           ${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "  Skills synced: ${GREEN}$SKILL_COUNT${NC}"
echo -e "  Location:      ${CYAN}$GLOBAL_DIR/skills/${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${GREEN}✅ All skills available globally!${NC}"
echo ""
