#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

AGENTS_DIR="/workspaces/MonoPilot/.claude/agents"
FOOTER_FILE="$AGENTS_DIR/AGENT-FOOTER.md"
DRY_RUN=${1:-"--dry-run"}

echo -e "${YELLOW}Agent Update Script${NC}"
echo "================================"
echo ""

if [ "$DRY_RUN" = "--apply" ]; then
  echo -e "${RED}APPLYING CHANGES${NC}"
else
  echo -e "${GREEN}DRY RUN MODE (use --apply to actually update)${NC}"
fi
echo ""

# Function to update a single agent
update_agent() {
  local agent_file=$1
  local agent_name=$(basename "$agent_file")

  # Skip ORCHESTRATOR and AGENT-FOOTER
  if [[ "$agent_name" == "ORCHESTRATOR.md" ]] || [[ "$agent_name" == "AGENT-FOOTER.md" ]]; then
    echo -e "${YELLOW}⊘ SKIP${NC} $agent_name (special handling)"
    return
  fi

  echo -e "${GREEN}► Processing${NC} $agent_name"

  # Create temp file
  local temp_file=$(mktemp)
  local in_section_to_remove=0
  local removed_sections=""

  # Read file line by line
  while IFS= read -r line; do
    # Check if we're starting a section to remove
    if [[ "$line" =~ ^##[[:space:]]+(Output|Handoff|Quality[[:space:]]+Gates) ]]; then
      in_section_to_remove=1
      section_name=$(echo "$line" | sed 's/^##[[:space:]]*//')
      removed_sections="$removed_sections\n  - $section_name"
      continue
    fi

    # Check if we're starting a new section (exit removal mode)
    if [[ "$line" =~ ^##[[:space:]] ]] && [ $in_section_to_remove -eq 1 ]; then
      in_section_to_remove=0
    fi

    # Write line if not in removal section
    if [ $in_section_to_remove -eq 0 ]; then
      echo "$line" >> "$temp_file"
    fi
  done < "$agent_file"

  # Add footer at the end (before last "Error Recovery" if exists, or at end)
  echo "" >> "$temp_file"
  cat "$FOOTER_FILE" >> "$temp_file"

  # Show what was removed
  if [ -n "$removed_sections" ]; then
    echo -e "  ${YELLOW}Removed sections:${NC}$removed_sections"
  fi

  # Apply changes if not dry run
  if [ "$DRY_RUN" = "--apply" ]; then
    mv "$temp_file" "$agent_file"
    echo -e "  ${GREEN}✓ Updated${NC}"
  else
    echo -e "  ${GREEN}✓ Would update${NC} (dry run)"
    rm "$temp_file"
  fi

  echo ""
}

# Update ORCHESTRATOR separately (add checkpoint reading section)
update_orchestrator() {
  local orch_file="$AGENTS_DIR/ORCHESTRATOR.md"
  echo -e "${GREEN}► Processing${NC} ORCHESTRATOR.md (special)"

  if [ "$DRY_RUN" = "--apply" ]; then
    # Add checkpoint reading section before final section
    # This is simplified - you may want to customize
    echo -e "  ${YELLOW}Note:${NC} ORCHESTRATOR needs manual review for checkpoint reading logic"
    echo -e "  ${GREEN}✓ Marked for manual update${NC}"
  else
    echo -e "  ${GREEN}✓ Will need manual update${NC} (dry run)"
  fi
  echo ""
}

# Find all agent markdown files
echo "Finding agents..."
agent_files=$(find "$AGENTS_DIR" -maxdepth 1 -name "*.md" -type f)
agent_files+=" "
agent_files+=$(find "$AGENTS_DIR"/{development,operations,planning,quality,skills} -name "*.md" -type f 2>/dev/null || true)

# Count
total_agents=$(echo "$agent_files" | wc -w)
echo "Found $total_agents agent files"
echo ""

# Update each agent
for agent_file in $agent_files; do
  if [ -f "$agent_file" ]; then
    update_agent "$agent_file"
  fi
done

# Handle orchestrator
update_orchestrator

echo "================================"
if [ "$DRY_RUN" = "--apply" ]; then
  echo -e "${GREEN}✓ All agents updated!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review ORCHESTRATOR.md manually"
  echo "2. Test with a simple story"
  echo "3. Verify checkpoint files are created"
else
  echo -e "${YELLOW}Dry run complete. Run with --apply to update.${NC}"
fi
