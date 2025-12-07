# Document Sharding Pattern

## 1. Overview

### What is Document Sharding

Document sharding is the practice of splitting large documents into smaller, focused sections stored as separate files. Each shard contains a logically complete unit of information, linked together through an index file.

```
large-document.md (2000 lines)
      |
      v
large-document/
  ├── 00-index.md
  ├── 01-introduction.md
  ├── 02-architecture.md
  ├── 03-implementation.md
  └── 04-deployment.md
```

### Why It Matters for AI

AI assistants have context window limits. Loading irrelevant content wastes tokens and dilutes focus:

| Problem | Impact |
|---------|--------|
| Large files fill context | Less room for actual work |
| Irrelevant sections loaded | AI attention diluted |
| Token costs increase | Higher API costs |
| Response quality drops | Too much noise in context |

### The 90% Token Savings Claim

Research from BMAD Method demonstrates that strategic document sharding can reduce token consumption by up to 90%:

| Scenario | Traditional | Sharded | Savings |
|----------|-------------|---------|---------|
| Load full PRD (5000 tokens) | 5000 | 500 (index only) | 90% |
| Need one section | 5000 | 800 (index + section) | 84% |
| Need two sections | 5000 | 1400 (index + 2 sections) | 72% |

**Key insight:** Most tasks only need 10-20% of a large document. Sharding enables loading only what is needed.

---

## 2. When to Shard

### Size Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Lines | >1000 | MUST shard |
| Lines | 800-1000 | Consider sharding |
| File size | >40KB | MUST shard |
| File size | 20-40KB | Consider sharding |
| Tokens | >4000 | MUST shard |
| Tokens | 2000-4000 | Consider sharding |
| Sections | >7 major | Consider sharding |

### Auto-Sharding Rules (MANDATORY)

When creating PRD, Architecture, or Epic documents:

```
IF document_lines > 1000:
    1. Create index file: {doc-name}/00-index.md
    2. Split into shards of ~800-1000 lines each
    3. Name shards: 01-{section}.md, 02-{section}.md, etc.
    4. Update index with links to all shards
    5. Original file becomes the index
```

**Example:**
```
prd.md (1500 lines)
    ↓ AUTO-SHARD
prd/
  ├── 00-index.md (overview + links)
  ├── 01-executive-summary.md
  ├── 02-requirements.md
  └── 03-specifications.md
```

### Signs a Document Needs Sharding

- **Context overflow:** File regularly exceeds recommended context allocation
- **Partial relevance:** Tasks only need portions of the document
- **Slow navigation:** Finding specific content takes too long
- **Mixed concerns:** Document covers multiple distinct topics
- **Frequent updates:** Different sections updated by different agents
- **Versioning conflicts:** Merge conflicts due to unrelated changes

### When NOT to Shard

- **Small files:** Under 500 lines / 20KB / 2000 tokens
- **Atomic content:** Tightly coupled content that must be read together
- **Single-purpose docs:** Files serving one specific function
- **Reference tables:** Lookup data that benefits from single-file search
- **Configuration files:** Settings that work as a unit
- **Code files:** Keep source code intact (shard documentation instead)

---

## 3. Sharding Strategies

### Strategy A: Heading-Based

Split at markdown heading boundaries (## or ###).

```markdown
# Original Document
## Introduction     --> 01-introduction.md
## Architecture     --> 02-architecture.md
## Implementation   --> 03-implementation.md
## Testing          --> 04-testing.md
```

**Best for:**
- Documentation
- Guides and tutorials
- Technical specifications
- PRDs and requirements

**Advantages:**
- Preserves logical structure
- Easy to navigate
- Natural split points
- Maintains readability

**Process:**
1. Identify ## level headings as split points
2. Each heading becomes a shard
3. Keep subheadings (###, ####) within their parent shard

### Strategy B: Fixed-Size

Split at fixed intervals regardless of content.

```
Large log file (10000 lines)
  --> log-001.txt (lines 1-2000)
  --> log-002.txt (lines 2001-4000)
  --> log-003.txt (lines 4001-6000)
  --> log-004.txt (lines 6001-8000)
  --> log-005.txt (lines 8001-10000)
```

**Best for:**
- Log files
- Data exports
- Generated content
- Large datasets

**Advantages:**
- Predictable shard sizes
- Easy to automate
- Works with any content

**Disadvantages:**
- May break context mid-sentence
- Loses logical grouping
- Harder to find specific content

### Strategy C: Smart/Hybrid

Combine heading-based with maximum size constraints.

```
# Original (3000 lines)
## Introduction (100 lines)    --> 01-introduction.md (100 lines)
## Architecture (800 lines)    --> 02-architecture.md (800 lines)
## Implementation (1500 lines) --> split further:
  ### Backend (700 lines)        --> 03a-impl-backend.md
  ### Frontend (800 lines)       --> 03b-impl-frontend.md
## Testing (600 lines)         --> 04-testing.md (600 lines)
```

**Best for:**
- Mixed content sizes
- Unbalanced documents
- Real-world projects

**Process:**
1. Start with heading-based splits
2. Check each shard against size threshold (500 lines)
3. If oversized, split at subheading level
4. If still oversized, use fixed-size within section

---

## 4. Sharding Process

### Step-by-Step Guide

#### Step 1: Analyze File Structure

```bash
# Count lines
wc -l document.md

# Estimate tokens
echo "Tokens: $(( $(wc -c < document.md) / 4 ))"

# List headings
grep "^##" document.md
```

#### Step 2: Identify Split Points

Map out the document structure:

```markdown
## Introduction (lines 1-50)
## Background (lines 51-150)
## Requirements (lines 151-400)
  ### Functional (lines 151-280)
  ### Non-functional (lines 281-400)
## Architecture (lines 401-800)
## Implementation (lines 801-1200)
```

#### Step 3: Create Output Directory

```bash
# Create directory named after original file
mkdir -p document/
```

#### Step 4: Generate Shards

Extract each section to its own file:

```bash
# Manual extraction
sed -n '1,50p' document.md > document/01-introduction.md
sed -n '51,150p' document.md > document/02-background.md
# ... continue for each section
```

#### Step 5: Create Index File

Create `00-index.md` (see Section 5 for template).

#### Step 6: Update Internal Links

Convert internal links to cross-shard references:

```markdown
# Before (in single file)
See [Architecture](#architecture) for details.

# After (in sharded structure)
See @document/03-architecture.md for details.
```

#### Step 7: Validate Result

```bash
# Check all shards exist
ls -la document/

# Verify line counts
wc -l document/*.md

# Test links (manual review)
```

---

## 5. Index File Pattern

### Template for 00-index.md

```markdown
# {Document Title} - Index

## Overview
{One paragraph describing the document's purpose}

## Quick Stats
| Metric | Value |
|--------|-------|
| Total Sections | {N} |
| Total Lines | {X} |
| Est. Tokens | {Y} |
| Last Updated | {YYYY-MM-DD} |

## Sections

### 1. Introduction
**File:** @{dir}/01-introduction.md
**Lines:** {X} | **Tokens:** ~{Y}
**Summary:** {One-line description}

### 2. Architecture
**File:** @{dir}/02-architecture.md
**Lines:** {X} | **Tokens:** ~{Y}
**Summary:** {One-line description}

### 3. Implementation
**File:** @{dir}/03-implementation.md
**Lines:** {X} | **Tokens:** ~{Y}
**Summary:** {One-line description}

{Continue for all sections}

## Navigation

| Need | Load |
|------|------|
| Overview only | This index |
| Full document | All files |
| Specific topic | Index + relevant section |

## Cross-References
- Related: @other-doc/00-index.md
- See also: @related-topic.md
```

---

## 6. Naming Conventions

### Directory Naming

```
{original-filename}/
```

Examples:
- `architecture-overview.md` --> `architecture-overview/`
- `prd.md` --> `prd/`
- `api-specification.md` --> `api-specification/`

### File Naming

```
{NN}-{section-slug}.md
```

Where:
- `NN` = Two-digit sequence number (00, 01, 02...)
- `section-slug` = Kebab-case section name

Examples:
- `00-index.md` (always the index)
- `01-introduction.md`
- `02-system-overview.md`
- `03a-backend-api.md` (subsections use letters)
- `03b-frontend-api.md`

### Index File Names

Use one of:
- `00-index.md` (preferred - sorts first)
- `README.md` (GitHub-friendly)
- `_index.md` (underscore prefix)

---

## 7. Link Management

### Updating Internal Links

**Before sharding:**
```markdown
See [Requirements](#requirements) section below.
```

**After sharding:**
```markdown
See @document/02-requirements.md for details.
```

### Cross-Shard References

Within the same sharded document:
```markdown
# In 02-architecture.md
For implementation details, see @./03-implementation.md
```

Between different sharded documents:
```markdown
# In prd/02-requirements.md
Architecture defined in @architecture/02-system-design.md
```

### Maintaining @Reference Compatibility

Ensure all references work with the agent methodology:

```markdown
# Valid references
@document/00-index.md           # Load index
@document/02-specific.md        # Load specific shard
@document/                      # Reference directory (agents will load index)
```

### Link Validation

Check for broken links after sharding:

```bash
# Find all @references
grep -r "@" document/ | grep "\.md"

# Verify each target exists
```

---

## 8. Before/After Examples

### Example 1: Large README

**Before:** `README.md` (1200 lines, ~4800 tokens)

```markdown
# Project Name
## Installation
{200 lines}
## Configuration
{300 lines}
## Usage
{400 lines}
## API Reference
{250 lines}
## Contributing
{50 lines}
```

**After:** `readme/` directory

```
readme/
├── 00-index.md (30 lines, ~120 tokens)
├── 01-installation.md (200 lines, ~800 tokens)
├── 02-configuration.md (300 lines, ~1200 tokens)
├── 03-usage.md (400 lines, ~1600 tokens)
├── 04-api-reference.md (250 lines, ~1000 tokens)
└── 05-contributing.md (50 lines, ~200 tokens)
```

**Savings:** Agent needs installation help? Load 920 tokens instead of 4800 (81% savings).

### Example 2: Architecture Document

**Before:** `architecture-overview.md` (800 lines, ~3200 tokens)

**After:** `architecture-overview/`

```
architecture-overview/
├── 00-index.md
├── 01-principles.md
├── 02-system-context.md
├── 03-containers.md
├── 04-components.md
├── 05-data-flow.md
└── 06-deployment.md
```

### Example 3: PRD

**Before:** `prd.md` (1500 lines, ~6000 tokens)

**After:** `prd/`

```
prd/
├── 00-index.md
├── 01-executive-summary.md
├── 02-problem-statement.md
├── 03-user-personas.md
├── 04-requirements-functional.md
├── 05-requirements-nonfunctional.md
├── 06-user-stories.md
├── 07-acceptance-criteria.md
└── 08-timeline.md
```

---

## 9. Token Estimation

### Formula

```
Estimated Tokens = (Character Count / 4) * 1.1
```

The 1.1 multiplier accounts for tokenization overhead.

### Quick Estimation Table

| Characters | Est. Tokens |
|------------|-------------|
| 1,000 | ~275 |
| 5,000 | ~1,375 |
| 10,000 | ~2,750 |
| 20,000 | ~5,500 |
| 50,000 | ~13,750 |

### Before/After Comparison Template

```markdown
## Token Analysis: {Document Name}

### Before Sharding
- File: {filename}
- Characters: {N}
- Lines: {N}
- Est. Tokens: {N}

### After Sharding
| Shard | Characters | Tokens |
|-------|------------|--------|
| 00-index.md | {N} | {N} |
| 01-section.md | {N} | {N} |
| ... | ... | ... |
| **Total** | {N} | {N} |

### Savings Analysis
| Scenario | Before | After | Savings |
|----------|--------|-------|---------|
| Load index only | {X} | {Y} | {Z}% |
| Load one section | {X} | {Y} | {Z}% |
| Load all | {X} | {X} | 0% |
```

---

## 10. Integration with Agents

### How Agents Load Sharded Docs

Agents should follow this pattern:

1. **Load index first:** `@document/00-index.md`
2. **Identify needed sections:** Based on task requirements
3. **Load only relevant shards:** `@document/03-specific.md`

### Index-First Approach

```markdown
# Agent prompt pattern
Read @prd/00-index.md first.
Based on the task, load only the relevant sections.
Do NOT load the entire document unless explicitly needed.
```

### Agent Context Loading Example

**Task:** Implement user authentication

**Traditional approach (wasteful):**
```
Load: @prd.md (6000 tokens)
```

**Sharded approach (efficient):**
```
Load: @prd/00-index.md (120 tokens)
Load: @prd/02-requirements-auth.md (800 tokens)
Total: 920 tokens (85% savings)
```

### Agent Instructions Template

Add to agent definitions:

```markdown
## Document Loading Rules
1. For sharded documents, ALWAYS load index first
2. Read index to understand available sections
3. Load only sections relevant to current task
4. Reference specific shards in outputs
5. If unsure which section, ask before loading all
```

---

## 11. Tools

### find-large-files.sh

```bash
#!/bin/bash
# Find files that should be considered for sharding

THRESHOLD_LINES=${1:-500}
THRESHOLD_KB=${2:-20}

echo "Files exceeding thresholds:"
echo "Lines > $THRESHOLD_LINES or Size > ${THRESHOLD_KB}KB"
echo "----------------------------------------"

find . -name "*.md" -type f | while read file; do
    lines=$(wc -l < "$file")
    size_kb=$(($(wc -c < "$file") / 1024))

    if [ $lines -gt $THRESHOLD_LINES ] || [ $size_kb -gt $THRESHOLD_KB ]; then
        tokens=$(($(wc -c < "$file") / 4))
        echo "$file"
        echo "  Lines: $lines | Size: ${size_kb}KB | Est. Tokens: $tokens"
    fi
done
```

### shard-document.sh

```bash
#!/bin/bash
# Basic document sharding script (heading-based)

FILE=$1
if [ -z "$FILE" ]; then
    echo "Usage: shard-document.sh <file.md>"
    exit 1
fi

BASENAME=$(basename "$FILE" .md)
mkdir -p "$BASENAME"

# Extract sections based on ## headings
# (Simplified - production version would be more robust)
csplit -f "$BASENAME/section-" -b "%02d.md" "$FILE" '/^## /' '{*}' 2>/dev/null

echo "Created shards in $BASENAME/"
ls -la "$BASENAME/"
echo ""
echo "Next steps:"
echo "1. Rename files to descriptive names"
echo "2. Create 00-index.md"
echo "3. Update cross-references"
```

### Manual Sharding Guide

For complex documents, manual sharding is often better:

1. **Open document in editor**
2. **Identify logical sections** (## headings)
3. **Create directory** with document name
4. **Copy each section** to numbered file
5. **Create index** from heading list
6. **Update links** to use @references
7. **Validate** all links work

---

## 12. Anti-Patterns

### Over-Sharding

**Problem:** Creating too many tiny shards

```
# Bad: Over-sharded
document/
├── 00-index.md (10 lines)
├── 01-intro.md (20 lines)
├── 02-purpose.md (15 lines)
├── 03-scope.md (10 lines)
├── 04-definitions.md (25 lines)
└── ... (20 more tiny files)
```

**Impact:**
- Index becomes larger than content
- Navigation overhead increases
- Context switching penalty
- More files to maintain

**Solution:** Minimum shard size of 100 lines or 400 tokens.

### Breaking Logical Units

**Problem:** Splitting tightly coupled content

```
# Bad: Function split from its documentation
03a-function-signature.md
03b-function-parameters.md
03c-function-examples.md
```

**Impact:**
- Lost context between related content
- Must load multiple shards to understand one concept
- Defeats purpose of sharding

**Solution:** Keep logically coupled content together.

### Losing Context at Boundaries

**Problem:** Important context lost at split points

```markdown
# End of 02-setup.md
Configure the database connection before proceeding.

# Start of 03-usage.md (missing context)
Run the migration command:
```

**Impact:**
- Shards not self-contained
- Readers confused without previous shard
- Agent may miss dependencies

**Solution:** Add brief context/prerequisites at start of each shard.

### Orphan Shards

**Problem:** Shards not linked in index

```
document/
├── 00-index.md (links to 01, 02, 03)
├── 01-intro.md
├── 02-main.md
├── 03-conclusion.md
└── 04-appendix.md (NOT IN INDEX!)
```

**Impact:**
- Content becomes invisible
- Agents never load it
- Knowledge loss

**Solution:** Always update index when adding/removing shards.

### Stale Index

**Problem:** Index out of sync with shards

**Impact:**
- Broken links
- Missing sections
- Incorrect token estimates

**Solution:** Update index immediately after any shard changes.

---

## Summary

| Aspect | Recommendation |
|--------|----------------|
| When to shard | >500 lines, >20KB, >2000 tokens |
| Strategy | Heading-based with size limits |
| Index | Always create 00-index.md |
| Naming | NN-kebab-case.md |
| Min shard size | 100 lines / 400 tokens |
| Links | Use @references |
| Validation | Check all links after sharding |

**Key Benefits:**
- 70-90% token savings on partial loads
- Faster agent context loading
- Better focused responses
- Easier maintenance
- Reduced merge conflicts

---

*Document Sharding Pattern v1.0*
*Part of Agent Methodology Pack*
