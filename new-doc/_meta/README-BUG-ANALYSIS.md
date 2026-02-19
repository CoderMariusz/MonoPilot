# Bug Analysis Artifacts

This directory contains comprehensive analysis of 341 bug fixes from MonoPilot project (Jan-Feb 2026).

## Files Created

### 1. **LESSONS-LEARNED-GLOBAL.md** (22KB) ⭐ MAIN DOCUMENT
The comprehensive lessons-learned document with:
- Executive summary of 341 fixes across 30 days
- Top 15 bug patterns with prevention rules
- Module-specific lessons for all 11 modules
- 20 code quality rules extracted from actual bugs
- Impact analysis and module maturity assessment
- Recommendations for future development
- Skills to create for bug prevention

### 2. **fix-commits-with-stats.txt** (raw data)
The source data file containing all 341 commit messages with file stats.

### 3. **bug-analysis-report.txt**
Initial analysis report with:
- Distribution by module
- Distribution by bug type
- Sample commits by module

### 4. **bug-analysis-data.json**
Structured JSON data with:
- Commit metadata (hash, message, module, types, file count)
- Statistics by module and bug type
- Used for generating the final document

## Key Findings

### Most Bug-Prone Modules
1. **00-foundation** (94 bugs, 27.6%) - Auth, middleware, Supabase integration
2. **02-technical** (86 bugs, 25.2%) - Products, BOMs, complex types
3. **01-settings** (76 bugs, 22.3%) - UI visibility, RLS policies

### Most Common Bug Types
1. **API** (118 occurrences, 34.6%) - Wrong status codes, missing endpoints
2. **UI** (109 occurrences, 32.0%) - Invisible elements, empty states
3. **Security** (104 occurrences, 30.5%) - Hardcoded org_id, missing RLS
4. **Data/DB** (95 occurrences, 27.9%) - Schema mismatches, column renames
5. **E2E/Testing** (76 occurrences, 22.3%) - Missing data-testid attributes

### Top 3 Critical Patterns
1. **Missing RLS Policies** (12 occurrences) - Security: Multi-tenant isolation
2. **Schema Mismatch** (15 occurrences) - Database: Code vs DB column names
3. **UI Elements Not Visible** (22 occurrences) - UX: Ghost buttons, missing labels

## Usage

### For Developers
Read **LESSONS-LEARNED-GLOBAL.md** sections:
- "Top 15 Bug Patterns" - Learn what to avoid
- "Code Quality Rules" - Apply to all new code
- "Module-Specific Lessons" - Review before working on a module

### For Code Reviewers
Check PRs against:
- 20 code quality rules (lines 374-393)
- Prevention rules in each bug pattern
- Module-specific lessons for affected modules

### For Project Managers
Review:
- "Module Maturity Assessment" - Understand technical debt
- "Recommendations for Future Development" - Process improvements
- "Technical Debt to Address" - Prioritization guidance

## Scripts Used

### analyze-fixes.py
Parses raw commit data and categorizes by module and bug type.

### generate-lessons.py
Generates the final LESSONS-LEARNED-GLOBAL.md document with:
- Pattern analysis
- Prevention rules
- Module-specific insights
- Actionable recommendations

## Next Steps

1. **Create Skills**: Implement the 8 recommended Claude Code skills
2. **Update Patterns**: Add prevention rules to `.claude/patterns/`
3. **Enhance Testing**: Add E2E tests for Scanner, Shipping, Quality
4. **Process Changes**: Implement PR templates and automation
5. **Documentation**: Update coding standards with extracted rules

---

*Analysis completed: 2026-02-16*
*Source commits: Jan-Feb 2026 (30 days of development)*
*Total bugs analyzed: 341*
