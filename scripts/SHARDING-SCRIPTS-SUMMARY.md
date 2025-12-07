# Sharding Scripts Summary

Two powerful scripts for managing large documentation files and optimizing AI context usage.

## Overview

| Script | Purpose | Primary Use |
|--------|---------|-------------|
| **find-large-files.sh** | Find files that need sharding | Identify optimization opportunities |
| **shard-document.sh** | Split large files into smaller parts | Execute the sharding |

## Quick Start

### Step 1: Find Large Files
```bash
# Scan your project for files over 500 lines or 20KB
bash scripts/find-large-files.sh

# Or scan a specific directory
bash scripts/find-large-files.sh ./docs
```

### Step 2: Shard the Large Files
```bash
# Preview what would happen (dry run)
bash scripts/shard-document.sh docs/MIGRATION-GUIDE.md --dry-run

# Execute the sharding
bash scripts/shard-document.sh docs/MIGRATION-GUIDE.md
```

### Step 3: Update References
After sharding, update any @references in other files to point to the new sharded location.

---

## find-large-files.sh

### Purpose
Scans directories to identify files that exceed size/line thresholds, making them candidates for sharding.

### Key Features
- Configurable thresholds (lines and KB)
- File type filtering
- Token estimation
- Priority recommendations (SHARD NOW, SHARD SOON, CONSIDER)
- Potential savings calculation

### Usage Examples

**Basic scan:**
```bash
bash scripts/find-large-files.sh
```

**Custom thresholds:**
```bash
# Find files over 1000 lines or 50KB
bash scripts/find-large-files.sh --min-lines 1000 --min-size 50
```

**Scan specific directory:**
```bash
bash scripts/find-large-files.sh ./docs
```

**Find large code files:**
```bash
bash scripts/find-large-files.sh ./src --type ts --min-lines 300
```

### Output Interpretation

The script provides three action levels:

1. **SHARD NOW** (Red)
   - Files >2000 lines OR >100KB
   - Immediate action recommended
   - Likely causing context issues

2. **SHARD SOON** (Yellow)
   - Files >1000 lines OR >50KB
   - Plan to shard in near future
   - Growing concern

3. **CONSIDER** (Green)
   - Files >500 lines OR >20KB (or custom threshold)
   - Monitor for growth
   - May not need immediate action

### Token Estimation

The script estimates tokens using a conservative ratio:
- **1 line ≈ 25 tokens**
- Shows potential **~60% savings** after sharding (per file access)

Example:
- Original: 2340 lines = ~58,500 tokens
- After sharding: Access 1 file at a time = ~9,750 tokens per file
- Savings: ~83% per access (only load what you need)

---

## shard-document.sh

### Purpose
Splits large documents into smaller, focused files while preserving structure and creating navigation.

### Key Features
- Three sharding strategies (heading, fixed, smart)
- Automatic index file generation
- Original file backup (`.original`)
- Dry-run mode for preview
- Progress bar with statistics
- Slugified filenames

### Sharding Strategies

#### 1. Heading Strategy (Default)
**Best for:** Well-structured documents with `##` headings

```bash
bash scripts/shard-document.sh docs/architecture.md
```

**How it works:**
- Splits at every `##` heading
- Keeps sections intact
- Preserves document structure

**Pros:**
- Maintains logical grouping
- Easy to navigate
- Respects document organization

**Cons:**
- Large sections stay large
- Uneven shard sizes

#### 2. Fixed Strategy
**Best for:** Uniform splitting, no structure preservation needed

```bash
bash scripts/shard-document.sh docs/data.md --strategy fixed --max-lines 300
```

**How it works:**
- Splits at fixed line intervals
- Ignores headings and structure
- Predictable shard sizes

**Pros:**
- Consistent shard sizes
- Simple and predictable

**Cons:**
- May split mid-section
- Loses logical grouping

#### 3. Smart Strategy (Recommended for Large Files)
**Best for:** Files with large sections that exceed max-lines

```bash
bash scripts/shard-document.sh docs/guide.md --strategy smart --max-lines 400
```

**How it works:**
- Splits at `##` headings like `heading` strategy
- BUT also splits sections that exceed `--max-lines`
- Labels split sections as "part 1", "part 2", etc.

**Pros:**
- Best of both worlds
- Respects structure when possible
- Enforces size limits

**Cons:**
- More complex splitting logic
- Some sections may be split across files

### Usage Examples

**Basic sharding (heading strategy):**
```bash
bash scripts/shard-document.sh docs/architecture.md
```

**Smart strategy with custom max lines:**
```bash
bash scripts/shard-document.sh README.md --strategy smart --max-lines 400
```

**Dry run to preview:**
```bash
bash scripts/shard-document.sh docs/api.md --dry-run
```

**Custom output directory:**
```bash
bash scripts/shard-document.sh guide.md --output docs/guide-parts
```

### Output Structure

After sharding `docs/architecture.md`, you get:

```
docs/architecture-sharded/
├── 00-index.md              # Navigation + overview
├── 01-overview.md           # First section
├── 02-database-design.md    # Second section
├── 03-api-endpoints.md      # Third section
├── 04-security.md           # Fourth section
└── 05-deployment.md         # Fifth section
```

Plus:
```
docs/architecture.md.original  # Original file backup
```

### Index File

The `00-index.md` file provides:
- Links to all shards
- Line counts for each section
- Quick stats (original size, shard count)
- Timestamp and metadata

### Strategy Selection Guide

| File Type | Recommended Strategy | Max Lines |
|-----------|---------------------|-----------|
| API Reference | `smart` | 400 |
| Tutorial/Guide | `heading` | default |
| Data/Logs | `fixed` | 300 |
| Technical Spec | `smart` | 350 |
| User Manual | `heading` | default |

---

## Typical Workflow

### Full Optimization Process

```bash
# 1. Scan project for large files
bash scripts/find-large-files.sh

# Review output, note files marked SHARD NOW

# 2. Preview sharding for a specific file
bash scripts/shard-document.sh docs/MIGRATION-GUIDE.md --dry-run

# Review shard preview, check if sizes look good

# 3. Adjust strategy/max-lines if needed
bash scripts/shard-document.sh docs/MIGRATION-GUIDE.md \
  --dry-run --strategy smart --max-lines 400

# 4. Execute sharding when satisfied
bash scripts/shard-document.sh docs/MIGRATION-GUIDE.md \
  --strategy smart --max-lines 400

# 5. Update @references in other files
# Change: @docs/MIGRATION-GUIDE.md
# To: @docs/MIGRATION-GUIDE-sharded/00-index.md
# Or reference specific sections as needed

# 6. Verify with token counter
bash scripts/token-counter.sh

# 7. Archive or delete original file
mv docs/MIGRATION-GUIDE.md docs/archive/
```

---

## Integration with Other Scripts

### With token-counter.sh

Before sharding:
```bash
bash scripts/token-counter.sh
# Shows high token counts
```

After sharding:
```bash
bash scripts/token-counter.sh
# Shows reduced token usage per file access
```

### With validate-docs.sh

After sharding, validate structure:
```bash
bash scripts/validate-docs.sh
# Ensures all new files are properly structured
```

---

## Best Practices

### When to Shard

1. **Proactive Indicators:**
   - File exceeds 500 lines
   - File exceeds 20KB
   - Taking >30 seconds to load in Claude
   - Hitting context limits

2. **Reactive Indicators:**
   - Claude warns about context usage
   - Need to reference only part of a file
   - File has distinct sections

### When NOT to Shard

- File is <300 lines
- File has no logical structure
- File is frequently needed in full
- File is a reference table or config

### Choosing Max Lines

| Context Need | Max Lines | Rationale |
|--------------|-----------|-----------|
| Tight (Haiku) | 200-250 | Maximize file count reduction |
| Normal (Sonnet) | 300-400 | Balance between size and count |
| Generous (Opus) | 400-500 | Fewer shards, larger sections |

### File Naming

The script automatically:
- Converts to lowercase
- Replaces spaces/special chars with hyphens
- Numbers files sequentially (01, 02, 03...)
- Creates descriptive slugs from headings

Example:
- Heading: "## API Design Principles"
- Filename: "03-api-design-principles.md"

---

## Troubleshooting

### Issue: Too Many Shards

**Problem:** File split into 50+ small pieces

**Solution:**
```bash
# Increase max-lines
bash scripts/shard-document.sh file.md --strategy smart --max-lines 500
```

### Issue: Shards Still Too Large

**Problem:** Some shards exceed desired size

**Solution:**
```bash
# Use smart strategy with lower max-lines
bash scripts/shard-document.sh file.md --strategy smart --max-lines 250
```

### Issue: Broken Mid-Sentence

**Problem:** Fixed strategy breaks in middle of content

**Solution:**
```bash
# Use heading or smart strategy instead
bash scripts/shard-document.sh file.md --strategy heading
```

### Issue: No Headings Detected

**Problem:** "No ## headings found, switching to smart"

**Solution:**
- Add `##` headings to your document for better structure
- Or use `--strategy fixed` if structure doesn't matter

### Issue: Can't Find Original After Sharding

**Problem:** Need to reference original file

**Solution:**
```bash
# Original is saved as .original
ls -la docs/*.original

# Restore if needed
cp docs/architecture.md.original docs/architecture.md
```

---

## Performance Impact

### Token Savings

**Example: 2000-line file**

Before sharding:
- Load entire file: ~50,000 tokens
- Every access: 50,000 tokens

After sharding (5 files):
- Load index: ~1,250 tokens
- Load one section: ~10,000 tokens
- **Savings per access: ~80%**

### File Count Impact

**Tradeoff:**
- More files = lower token usage per access
- More files = more navigation needed
- Sweet spot: 5-10 shards per large file

---

## Advanced Usage

### Batch Sharding

Shard multiple files at once:
```bash
# Find all files needing sharding
bash scripts/find-large-files.sh | grep "SHARD NOW" | awk '{print $1}' > large-files.txt

# Shard each one
while read file; do
  echo "Sharding $file..."
  bash scripts/shard-document.sh "$file" --strategy smart --max-lines 400
done < large-files.txt
```

### Custom Thresholds for Different Types

```bash
# Documentation files: conservative
bash scripts/find-large-files.sh ./docs --min-lines 300 --min-size 15

# Code files: aggressive
bash scripts/find-large-files.sh ./src --type ts --min-lines 200 --min-size 10

# Archive files: very aggressive
bash scripts/find-large-files.sh ./archive --min-lines 100 --min-size 5
```

### Integration with Git

```bash
# Before sharding
git add docs/architecture.md
git commit -m "Backup before sharding"

# Shard
bash scripts/shard-document.sh docs/architecture.md

# Commit sharded version
git add docs/architecture-sharded/
git add docs/architecture.md.original
git commit -m "Shard architecture.md for better context management"

# Remove original from tracking (keep as backup)
git rm docs/architecture.md
git commit -m "Remove original architecture.md (preserved as .original)"
```

---

## FAQ

**Q: Can I shard a file that's already been sharded?**
A: Yes, but usually unnecessary. If shards are still too large, adjust `--max-lines` and re-shard the original.

**Q: What happens to internal links?**
A: The script preserves markdown links. You may need to update relative paths if shards reference each other.

**Q: Can I use different strategies for different files?**
A: Yes! Each file can use its own strategy based on structure and needs.

**Q: How do I undo sharding?**
A: The original is saved as `.original`. Just rename it back:
```bash
mv docs/architecture.md.original docs/architecture.md
rm -rf docs/architecture-sharded/
```

**Q: Do shards work with @references?**
A: Yes! Reference the index or specific shards:
- `@docs/architecture-sharded/00-index.md` - Full overview
- `@docs/architecture-sharded/02-database.md` - Specific section

**Q: How often should I run find-large-files?**
A: Weekly during active development, or after major documentation updates.

---

## Summary

**find-large-files.sh:**
- Identifies optimization opportunities
- Provides token estimates
- Prioritizes actions
- Runs quickly and safely

**shard-document.sh:**
- Splits large files intelligently
- Preserves structure and navigation
- Creates backups automatically
- Supports dry-run previews

**Together:**
1. Find → 2. Preview → 3. Shard → 4. Validate → 5. Optimize

---

**Last Updated:** 2025-12-05
**Version:** 1.0
**Maintained by:** Agent Methodology Pack
