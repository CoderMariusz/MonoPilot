# Installation Guide

Complete installation instructions for the Agent Methodology Pack.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Install](#quick-install)
3. [Manual Installation](#manual-installation)
4. [Integration with Existing Project](#integration-with-existing-project)
5. [Post-Install Verification](#post-install-verification)
6. [Configuration Options](#configuration-options)
7. [Troubleshooting](#troubleshooting)
8. [Updating the Pack](#updating-the-pack)

---

## Prerequisites

### Required

- **Claude CLI**: Installed and configured
  - Install: Follow instructions at https://claude.ai/cli
  - Verify: Run `claude --version`

- **Git**: For version control
  - Windows: https://git-scm.com/download/win
  - macOS: `brew install git` or Xcode Command Line Tools
  - Linux: `sudo apt-get install git` (Debian/Ubuntu)
  - Verify: Run `git --version`

### Optional

- **Node.js**: For advanced automation (v16.x or higher)
  - Download: https://nodejs.org/
  - Verify: Run `node --version`

- **Bash**: For running automation scripts
  - Windows: Git Bash (included with Git) or WSL2
  - macOS/Linux: Built-in

### System Requirements

- Operating System: Windows 10+, macOS 10.15+, or Linux
- Disk Space: ~50 MB
- Claude CLI with API access configured

---

## Quick Install

Three commands to get started:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/agent-methodology-pack.git

# 2. Navigate to the pack directory
cd agent-methodology-pack

# 3. Initialize your project
bash scripts/init-project.sh my-project-name
```

That's it! Your project is now set up with the Agent Methodology Pack.

**Next Steps:** Jump to [Post-Install Verification](#post-install-verification) to verify your setup.

---

## Manual Installation

For more control over the installation process, follow these detailed steps:

### Step 1: Download the Pack

**Option A: Clone with Git (Recommended)**
```bash
git clone https://github.com/your-org/agent-methodology-pack.git
cd agent-methodology-pack
```

**Option B: Download ZIP**
1. Download the ZIP file from the releases page
2. Extract to your desired location
3. Open terminal in the extracted folder

### Step 2: Verify Directory Structure

Ensure all required directories exist:

```bash
# Run the validation script
bash scripts/validate-docs.sh
```

Expected directory structure:
```
agent-methodology-pack/
├── .claude/                    # Agent definitions and patterns
│   ├── agents/
│   │   ├── planning/          # Planning phase agents
│   │   ├── development/       # Development phase agents
│   │   ├── quality/           # Quality assurance agents
│   │   └── ORCHESTRATOR.md    # Main orchestrator
│   ├── patterns/              # Development patterns
│   ├── state/                 # Runtime state management
│   └── workflows/             # Process workflows
├── docs/                      # Project documentation
│   ├── 1-BASELINE/           # Requirements & architecture
│   ├── 2-MANAGEMENT/         # Epics, stories, sprints
│   ├── 3-ARCHITECTURE/       # Technical design
│   ├── 4-DEVELOPMENT/        # Implementation docs
│   └── 5-ARCHIVE/            # Completed work
├── scripts/                   # Automation scripts
├── templates/                 # Document templates
├── CLAUDE.md                  # Root project file
├── PROJECT-STATE.md           # Current state tracker
├── README.md                  # Project overview
├── INSTALL.md                 # This file
└── QUICK-START.md             # Quick start guide
```

### Step 3: Create Core Files

**Create CLAUDE.md:**
```bash
# Copy from template (if available)
cp templates/CLAUDE.md.template CLAUDE.md

# Or create manually
cat > CLAUDE.md << 'EOF'
# My Project

## Overview
[Describe your project]

## Tech Stack
- Language: [Your language]
- Framework: [Your framework]

## Current Phase
- Phase: Planning
- Sprint: 1

## Key Files
- @PROJECT-STATE.md - Current state
- @.claude/agents/ORCHESTRATOR.md - Agent orchestrator

---
EOF
```

**Create PROJECT-STATE.md:**
```bash
# Copy from template
cp templates/PROJECT-STATE.md.template PROJECT-STATE.md

# Or create manually
cat > PROJECT-STATE.md << 'EOF'
# Project State

## Current Sprint
- Sprint: 1
- Start Date: [Today's date]
- Sprint Goal: Initial setup and planning

## Active Work
- Setting up project structure

## Blockers
None

## Recent Updates
- [Today's date]: Project initialized
EOF
```

### Step 4: Initialize State Files

Create empty state files in `.claude/state/`:

```bash
# Navigate to state directory
cd .claude/state/

# Create state files
touch AGENT-STATE.md AGENT-MEMORY.md TASK-QUEUE.md
touch HANDOFFS.md DECISION-LOG.md DEPENDENCIES.md METRICS.md

# Return to root
cd ../..
```

### Step 5: Configure Git (Optional)

```bash
# Initialize git repository
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# OS Files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Backup files
*.backup
*.bak

# Environment
.env
.env.local

# Dependencies (if using Node.js)
node_modules/
EOF

# Create initial commit
git add .
git commit -m "Initial commit: Agent Methodology Pack setup"
```

### Step 6: Verify Installation

```bash
# Run validation script
bash scripts/validate-docs.sh
```

You should see all checks pass with green checkmarks.

---

## Integration with Existing Project

Already have a project? Here's how to add the Agent Methodology Pack:

### Method 1: Submodule (Recommended)

Add as a Git submodule to keep the pack separate and updatable:

```bash
# Navigate to your existing project
cd /path/to/your-project

# Add as submodule
git submodule add https://github.com/your-org/agent-methodology-pack.git .agent-pack

# Initialize submodule
git submodule update --init --recursive

# Copy core files to your project root
cp .agent-pack/templates/CLAUDE.md.template ./CLAUDE.md
cp .agent-pack/templates/PROJECT-STATE.md.template ./PROJECT-STATE.md

# Create symbolic link to .claude folder (optional)
ln -s .agent-pack/.claude ./.claude
```

### Method 2: Direct Copy

Copy the methodology pack directly into your project:

```bash
# Navigate to your existing project
cd /path/to/your-project

# Copy the pack
cp -r /path/to/agent-methodology-pack/.claude ./
cp -r /path/to/agent-methodology-pack/scripts ./
cp -r /path/to/agent-methodology-pack/templates ./

# Copy core files
cp /path/to/agent-methodology-pack/templates/CLAUDE.md.template ./CLAUDE.md
cp /path/to/agent-methodology-pack/templates/PROJECT-STATE.md.template ./PROJECT-STATE.md
```

### Method 3: Hybrid Approach

Keep methodology in a separate folder:

```bash
# Create methodology folder in your project
mkdir -p methodology
cd methodology

# Clone or copy the pack
git clone https://github.com/your-org/agent-methodology-pack.git .

# Create CLAUDE.md in your project root
cd ..
cat > CLAUDE.md << 'EOF'
# My Existing Project

## Overview
[Your project description]

## Methodology
Agent-based development using methodology pack in `./methodology/`

## Key Files
- @PROJECT-STATE.md - Current state
- @methodology/.claude/agents/ORCHESTRATOR.md - Agent orchestrator

---
EOF
```

### Update Your Project Structure

Add documentation directories if not present:

```bash
# Create documentation structure
mkdir -p docs/{1-BASELINE,2-MANAGEMENT,3-ARCHITECTURE,4-DEVELOPMENT,5-ARCHIVE}
mkdir -p docs/2-MANAGEMENT/{epics/current,sprints}
```

---

## Post-Install Verification

### 1. Check Core Files

Verify essential files exist:

```bash
# Check for core files
ls -la CLAUDE.md PROJECT-STATE.md README.md

# Check .claude directory
ls -la .claude/agents/
ls -la .claude/state/
ls -la .claude/workflows/
```

### 2. Validate Line Counts

CLAUDE.md should be under 70 lines:

```bash
wc -l CLAUDE.md
```

If over 70 lines, trim to essentials and move details to other files.

### 3. Run Validation Script

```bash
bash scripts/validate-docs.sh
```

Expected output:
- All core files: ✅
- All directories: ✅
- All agent definitions: ✅
- CLAUDE.md line count: ✅

### 4. Test Token Counter

```bash
# Basic count
bash scripts/token-counter.sh

# Detailed breakdown
bash scripts/token-counter.sh --verbose
```

### 5. Test Claude CLI Integration

Create a test prompt:

```bash
echo "Test the setup by loading the Orchestrator agent:

@CLAUDE.md
@PROJECT-STATE.md
@.claude/agents/ORCHESTRATOR.md

Please confirm you can see all three files and summarize the project status."
```

Run with Claude CLI and verify all files load correctly.

---

## Configuration Options

### Customize CLAUDE.md

Edit `CLAUDE.md` to match your project:

1. **Project Name & Description**: Clear, concise overview
2. **Tech Stack**: List main technologies
3. **Current Phase**: Update as you progress
4. **Key Files**: Add project-specific @references
5. **Instructions**: Agent-specific guidelines

**Keep it under 70 lines!** Move details to referenced files.

### Customize Agents

Edit agent definitions in `.claude/agents/` to match your needs:

- **Add team-specific practices** to agent instructions
- **Modify output formats** to match your standards
- **Add technology-specific guidelines**

### Configure Context Budget

Edit `.claude/CONTEXT-BUDGET.md` to manage token usage:

- Adjust reserved token allocations
- Set task-specific limits
- Define chunking strategies

### Set Up Model Routing

Edit `.claude/MODEL-ROUTING.md` for model selection:

- Define when to use Opus vs Sonnet
- Set task complexity thresholds
- Configure cost optimization

---

## Troubleshooting

### Issue: Scripts Won't Execute

**Symptom:** `Permission denied` when running scripts

**Solution:**
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Or run with bash
bash scripts/validate-docs.sh
```

### Issue: CLAUDE.md Over 70 Lines

**Symptom:** Validation fails due to line count

**Solution:**
1. Move detailed content to referenced files
2. Use `@reference.md` syntax instead of inline content
3. Trim comments and whitespace

Example refactor:
```markdown
# Before (80 lines)
# My Project

## Tech Stack
- Framework: Flutter 3.x
  - Material Design 3
  - State: Riverpod 2.x
- Backend: Supabase
  - Auth
  - Database
  - Storage
...

# After (35 lines)
# My Project

## Tech Stack
See @docs/1-BASELINE/architecture/tech-stack.md

## Current Phase
Phase: Planning | Sprint: 1
...
```

### Issue: Missing Template Files

**Symptom:** Templates not found during initialization

**Solution:**
```bash
# Create minimal templates manually
mkdir -p templates

cat > templates/CLAUDE.md.template << 'EOF'
# {PROJECT_NAME}

## Overview
[Project description]

## Tech Stack
[Your stack]

## Current Phase
Phase: Planning
Sprint: 1

## Key Files
- @PROJECT-STATE.md
- @.claude/agents/ORCHESTRATOR.md
EOF
```

### Issue: Git Submodule Problems

**Symptom:** Submodule not updating or missing files

**Solution:**
```bash
# Update submodule
git submodule update --remote

# Reinitialize if needed
git submodule deinit -f .agent-pack
git submodule update --init
```

### Issue: Broken @References

**Symptom:** Warnings about broken references in validation

**Solution:**
1. Check file paths are correct (case-sensitive on Linux/macOS)
2. Use forward slashes even on Windows: `@.claude/agents/PM-AGENT.md`
3. Ensure referenced files exist
4. Run validation to find all broken refs:
   ```bash
   bash scripts/validate-docs.sh
   ```

### Issue: Claude CLI Not Loading Files

**Symptom:** Claude doesn't see @referenced files

**Solution:**
1. Verify file paths are relative to CLAUDE.md location
2. Use `@` prefix: `@PROJECT-STATE.md` not `PROJECT-STATE.md`
3. Check files are not in .gitignore
4. Test with explicit file listing in prompt

---

## Updating the Pack

### Check for Updates

```bash
# If installed as submodule
git submodule update --remote

# If cloned directly
cd agent-methodology-pack
git pull origin main
```

### Upgrade Process

1. **Backup your customizations:**
   ```bash
   # Backup modified files
   cp CLAUDE.md CLAUDE.md.backup
   cp .claude/agents/ORCHESTRATOR.md .claude/agents/ORCHESTRATOR.md.backup
   ```

2. **Pull updates:**
   ```bash
   git pull origin main
   ```

3. **Merge customizations:**
   - Compare backup files with new versions
   - Reapply your project-specific changes
   - Keep new methodology improvements

4. **Validate:**
   ```bash
   bash scripts/validate-docs.sh
   ```

### Version Compatibility

Check `CHANGELOG.md` for breaking changes:

- **Major version** (1.x → 2.x): Breaking changes, migration guide included
- **Minor version** (1.1 → 1.2): New features, backward compatible
- **Patch version** (1.1.1 → 1.1.2): Bug fixes, always safe

---

## Next Steps

Installation complete! Here's what to do next:

1. **Read Quick Start**: See `QUICK-START.md` for 5-minute setup
2. **Customize CLAUDE.md**: Add your project details
3. **Run Orchestrator**: Start planning with `@.claude/agents/ORCHESTRATOR.md`
4. **Create First Epic**: Use PM-AGENT to break down work
5. **Start Sprint 1**: Follow SCRUM-MASTER for sprint planning

---

## Support

- **Documentation**: See `docs/00-START-HERE.md`
- **Scripts**: See `scripts/README.md` for script documentation
- **Issues**: Report at project repository
- **Examples**: See example projects in `examples/` (if available)

---

**Installation Guide Version:** 1.0
**Last Updated:** 2025-12-05
**Maintained by:** Agent Methodology Pack Team
