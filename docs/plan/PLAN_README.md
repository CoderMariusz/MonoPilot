# Documentation Structure Guide

## Overview
This directory contains the centralized documentation structure for MonoPilot MES system specifications, designed to be reusable across Cursor sessions and maintainable by development teams.

## Directory Structure

```
/docs/
├── plan/                    # Planning and architecture documentation
│   └── PLAN_README.md       # This file - documentation guide
├── db/                      # Database schema and migration documentation
│   └── MIGRATION_NOTES.md   # Migration rationale and notes
├── api/                     # API specifications
│   └── EXPORTS_XLSX_SPEC.md # Export endpoint specifications
├── ui/                      # UI wireframes and component specifications
│   └── PRODUCTION_UI_WIREFRAMES.md # UI component specifications
└── modules/                 # Module-specific documentation
    └── production/          # Production module specifications
        ├── PRODUCTION_SPEC_EN.md     # Living production specification
        ├── KPIS_EN.md               # KPI definitions and formulas
        ├── YIELD_REPORT_SPEC_EN.md  # Yield reporting specifications
        └── TRACE_SPEC_EN.md         # Traceability specifications
```

## Naming Conventions

### File Naming
- Use `UPPERCASE_SNAKE_CASE.md` for specification files
- Use descriptive names that indicate content and language
- Include language suffix (e.g., `_EN.md` for English)
- Use consistent prefixes for related files (e.g., `PRODUCTION_*`)

### Document Structure
- Start with overview and purpose
- Include table of contents for complex documents
- Use consistent heading hierarchy (H1 for main sections, H2 for subsections)
- Include changelog sections at the end
- Link between related documents

### Content Guidelines
- Keep each document focused and concise
- Use clear, technical language
- Include examples and code snippets where helpful
- Document assumptions and constraints
- Include validation criteria and acceptance tests

## How to Add New Specifications

### 1. Determine Document Type
- **Architecture/Planning**: Add to `/docs/plan/`
- **Database**: Add to `/docs/db/`
- **API**: Add to `/docs/api/`
- **UI/UX**: Add to `/docs/ui/`
- **Module-specific**: Add to `/docs/modules/{module_name}/`

### 2. Create Document Structure
```markdown
# Document Title

## Overview
Brief description of the document's purpose and scope.

## [Main Content Sections]
Use consistent heading structure.

## Changelog
### [Date] - [Author]
- [Change description]
- [Change description]
```

### 3. Update Cross-References
- Add links to new documents in relevant existing documents
- Update table of contents if applicable
- Ensure related documents reference each other

### 4. Validation
- Review for completeness and accuracy
- Check all links are functional
- Ensure consistent formatting
- Validate technical content with implementation

## Document Maintenance

### Regular Updates
- Update documents when specifications change
- Add changelog entries for all modifications
- Review and update cross-references
- Archive outdated versions if needed

### Quality Assurance
- Technical accuracy review
- Consistency with implementation
- Link validation
- Format consistency

## Integration with Development

### Cursor Integration
- Documents serve as single source of truth for specifications
- Use in Cursor sessions for context and reference
- Link between documents for comprehensive understanding
- Maintain version control with code changes

### Team Collaboration
- Use for onboarding new team members
- Reference during code reviews
- Guide for testing and validation
- Foundation for user documentation

## Best Practices

1. **Keep it Current**: Update documents when specifications change
2. **Be Specific**: Include concrete details, not just high-level descriptions
3. **Link Everything**: Connect related concepts across documents
4. **Version Control**: Track changes in changelog sections
5. **Validate**: Ensure documents match actual implementation
6. **Accessible**: Use clear language and structure for all team members

## Changelog

### 2025-01-27 - Initial Creation
- Created documentation structure guide
- Established naming conventions
- Defined maintenance procedures
- Set up integration guidelines
