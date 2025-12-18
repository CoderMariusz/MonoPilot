#!/bin/bash
# =============================================================================
# CREATE-AGENT.SH - Generator szkieletu nowego agenta
# =============================================================================
# Usage: ./create-agent.sh <agent-name> <category> [model]
#
# Arguments:
#   agent-name  - Name of the agent (e.g., "data-analyst")
#   category    - Category: planning | development | quality
#   model       - Optional: sonnet (default) | opus | haiku
#
# Example:
#   ./create-agent.sh data-analyst planning opus
#   ./create-agent.sh api-tester quality
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$(dirname "$SCRIPT_DIR")/agents"

# Validate arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo ""
    echo "Usage: $0 <agent-name> <category> [model]"
    echo ""
    echo "Arguments:"
    echo "  agent-name  - Name of the agent (e.g., 'data-analyst')"
    echo "  category    - Category: planning | development | quality"
    echo "  model       - Optional: sonnet (default) | opus | haiku"
    echo ""
    echo "Example:"
    echo "  $0 data-analyst planning opus"
    exit 1
fi

AGENT_NAME="$1"
CATEGORY="$2"
MODEL="${3:-sonnet}"

# Validate category
if [[ ! "$CATEGORY" =~ ^(planning|development|quality)$ ]]; then
    echo -e "${RED}Error: Invalid category '$CATEGORY'${NC}"
    echo "Valid categories: planning, development, quality"
    exit 1
fi

# Validate model
if [[ ! "$MODEL" =~ ^(sonnet|opus|haiku)$ ]]; then
    echo -e "${RED}Error: Invalid model '$MODEL'${NC}"
    echo "Valid models: sonnet, opus, haiku"
    exit 1
fi

# Convert agent name to uppercase for file and title
AGENT_NAME_UPPER=$(echo "$AGENT_NAME" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
AGENT_NAME_LOWER=$(echo "$AGENT_NAME" | tr '[:upper:]' '[:lower:]')
AGENT_NAME_TITLE=$(echo "$AGENT_NAME" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')

# Target directory and file
TARGET_DIR="$AGENTS_DIR/$CATEGORY"
TARGET_FILE="$TARGET_DIR/${AGENT_NAME_UPPER}.md"

# Check if file already exists
if [ -f "$TARGET_FILE" ]; then
    echo -e "${RED}Error: Agent file already exists: $TARGET_FILE${NC}"
    exit 1
fi

# Create directory if needed
mkdir -p "$TARGET_DIR"

# Category-specific type suggestions
case "$CATEGORY" in
    planning)
        TYPE_SUGGESTION="Planning (Strategy | Product | Technical | Research | Design | Quality | Agile)"
        ;;
    development)
        TYPE_SUGGESTION="Development (Backend | Frontend | Full-stack | Infra)"
        ;;
    quality)
        TYPE_SUGGESTION="Quality (Review | Testing | Documentation)"
        ;;
esac

# Generate the agent file
cat > "$TARGET_FILE" << 'AGENT_TEMPLATE'
---
name: {{AGENT_NAME_LOWER}}
description: {{TODO: Brief description of what this agent does. Max 1-2 sentences.}}
type: {{TYPE_SUGGESTION}}
trigger: {{TODO: When to use this agent}}
tools: Read, Write, Grep, Glob
model: {{MODEL}}
---

# {{AGENT_NAME_UPPER}}

<persona>
**Name:** {{TODO: Agent persona name}}
**Role:** {{TODO: Role description}}

**How I think:**
- {{TODO: Thinking principle 1}}
- {{TODO: Thinking principle 2}}
- {{TODO: Thinking principle 3}}

**How I work:**
- {{TODO: Work principle 1}}
- {{TODO: Work principle 2}}
- {{TODO: Work principle 3}}

**What I don't do:**
- {{TODO: Anti-pattern 1}}
- {{TODO: Anti-pattern 2}}

**My motto:** "{{TODO: One-liner motto}}"
</persona>

```
╔════════════════════════════════════════════════════════════════════════════╗
║                        CRITICAL RULES - READ FIRST                         ║
╠════════════════════════════════════════════════════════════════════════════╣
║  1. {{TODO: Critical rule 1}}                                              ║
║  2. {{TODO: Critical rule 2}}                                              ║
║  3. {{TODO: Critical rule 3}}                                              ║
║  4. {{TODO: Critical rule 4}}                                              ║
║  5. {{TODO: Critical rule 5}}                                              ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## Interface

### Input (from orchestrator):
```yaml
task:
  type: {{TODO: task_type_1 | task_type_2 | task_type_3}}
  # {{TODO: Add input parameters}}
previous_summary: string     # MAX 50 words from prior agent
```

### Output (to orchestrator):
```yaml
status: success | needs_input | blocked
summary: string              # MAX 100 words
deliverables:
  - path: {{TODO: output path}}
    type: {{TODO: output type}}
# {{TODO: Add output parameters}}
questions: []                # if needs_input
blockers: []                 # if blocked
```

---

## Input Files

```
@CLAUDE.md
@PROJECT-STATE.md
# {{TODO: Add relevant input files}}
```

## Output Files

```
# {{TODO: Add output file paths}}
```

---

## Workflow

### Step 1: {{TODO: First step name}}
- {{TODO: Step 1 action 1}}
- {{TODO: Step 1 action 2}}

### Step 2: {{TODO: Second step name}}
- {{TODO: Step 2 action 1}}
- {{TODO: Step 2 action 2}}

### Step 3: {{TODO: Third step name}}
- {{TODO: Step 3 action 1}}
- {{TODO: Step 3 action 2}}

### Step 4: {{TODO: Fourth step name}}
- {{TODO: Step 4 action 1}}
- {{TODO: Step 4 action 2}}

### Step 5: Deliver
- Save outputs to designated locations
- Return structured output to orchestrator

---

## Output Locations

| Artifact | Location |
|----------|----------|
| {{TODO: Artifact 1}} | {{TODO: path}} |
| {{TODO: Artifact 2}} | {{TODO: path}} |

---

## Quality Checklist

Before delivery:
- [ ] {{TODO: Quality check 1}}
- [ ] {{TODO: Quality check 2}}
- [ ] {{TODO: Quality check 3}}
- [ ] {{TODO: Quality check 4}}
- [ ] {{TODO: Quality check 5}}

---

## Common Mistakes to Avoid

| Mistake | Impact | Prevention |
|---------|--------|------------|
| {{TODO: Mistake 1}} | {{TODO: Impact}} | {{TODO: Prevention}} |
| {{TODO: Mistake 2}} | {{TODO: Impact}} | {{TODO: Prevention}} |
| {{TODO: Mistake 3}} | {{TODO: Impact}} | {{TODO: Prevention}} |

---

## Error Recovery

| Situation | Recovery Action |
|-----------|-----------------|
| {{TODO: Situation 1}} | {{TODO: Recovery}} |
| {{TODO: Situation 2}} | {{TODO: Recovery}} |
| {{TODO: Situation 3}} | {{TODO: Recovery}} |

---

## Handoff Protocols

### From {{TODO: Previous Agent}}
**Expect to receive:**
- {{TODO: Input 1}}
- {{TODO: Input 2}}

### To {{TODO: Next Agent}}
**When:** {{TODO: Condition}}
**What to pass:**
- {{TODO: Output 1}}
- {{TODO: Output 2}}

---

## Templates

Load on demand:
- {{TODO: Template name}}: @.claude/templates/{{TODO: template-file}}.md

---

## Session Flow Example

```
┌─────────────────────────────────────────────────────────────────────┐
│ {{AGENT_NAME_UPPER}} SESSION                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 1. {{TODO: Step 1}}                                                 │
│    └─> {{TODO: Description}}                                        │
│                                                                     │
│ 2. {{TODO: Step 2}}                                                 │
│    └─> {{TODO: Description}}                                        │
│                                                                     │
│ 3. {{TODO: Step 3}}                                                 │
│    └─> {{TODO: Description}}                                        │
│                                                                     │
│ 4. {{TODO: Step 4}}                                                 │
│    └─> {{TODO: Description}}                                        │
│                                                                     │
│ 5. HANDOFF                                                          │
│    └─> To {{TODO: Next agent}}                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```
AGENT_TEMPLATE

# Replace placeholders
sed -i "s/{{AGENT_NAME_LOWER}}/$AGENT_NAME_LOWER/g" "$TARGET_FILE"
sed -i "s/{{AGENT_NAME_UPPER}}/$AGENT_NAME_UPPER/g" "$TARGET_FILE"
sed -i "s/{{MODEL}}/$MODEL/g" "$TARGET_FILE"
sed -i "s/{{TYPE_SUGGESTION}}/$TYPE_SUGGESTION/g" "$TARGET_FILE"

echo -e "${GREEN}✓ Agent created successfully!${NC}"
echo ""
echo -e "  File: ${BLUE}$TARGET_FILE${NC}"
echo -e "  Name: ${BLUE}$AGENT_NAME_UPPER${NC}"
echo -e "  Category: ${BLUE}$CATEGORY${NC}"
echo -e "  Model: ${BLUE}$MODEL${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Open the file and replace all {{TODO: ...}} placeholders"
echo "  2. Run validation: ./validate-agent.sh $TARGET_FILE"
echo "  3. Add agent to ORCHESTRATOR.md routing table"
echo ""
