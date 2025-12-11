# SKILL-CREATOR & SKILL-VALIDATOR Review

Data: 2025-01-10

---

## 1. Analiza SKILL-CREATOR

### Stan obecny
```yaml
Tokeny: ~550
skills.required: []  # PUSTE!
skills.optional: []  # PUSTE!
tools: Read, Write, Grep, Glob, WebSearch, WebFetch
```

### Co ma (dobrze):
- ✅ Skill Structure Template
- ✅ Workflow 4-krokowy
- ✅ Confidence Levels
- ✅ Quality Gates
- ✅ Token estimation rules

### Co brakuje:

| Brak | Problem | Rozwiązanie |
|------|---------|-------------|
| Skills w frontmatter | Agent tworzy skills ale nie używa żadnych | Dodać required/optional |
| Research methodology | Nie wie JAK szukać authoritative sources | Nowy skill |
| Version detection | Nie wie jak sprawdzić aktualność | Nowy skill |
| Skill types workflow | Brak generic/domain/project | Dodać sekcję |
| Handoff format | Niejasne co przekazać do VALIDATOR | Dodać YAML format |
| Error recovery | Co robić gdy research nie daje wyników | Dodać sekcję |

### Rekomendowane skills:
```yaml
skills:
  required:
    - documentation-patterns      # formatowanie skill
  optional:
    - research-source-evaluation  # NOWY - jak szukać źródeł
    - version-changelog-patterns  # NOWY - jak sprawdzać wersje
```

---

## 2. Analiza SKILL-VALIDATOR

### Stan obecny
```yaml
Tokeny: ~630
skills.required: []  # PUSTE!
skills.optional: []  # PUSTE!
tools: Read, Write, Grep, Glob, WebSearch, WebFetch
```

### Co ma (dobrze):
- ✅ Verdict Types (5 typów)
- ✅ Validation Checklist (4 kategorie)
- ✅ Output Format (Validation Report)
- ✅ Review Cycle Integration
- ✅ Handoff per verdict

### Co brakuje:

| Brak | Problem | Rozwiązanie |
|------|---------|-------------|
| Skills w frontmatter | Waliduje skills ale nie używa żadnych | Dodać required/optional |
| Source evaluation | Nie wie co to "authoritative source" | Nowy skill |
| Version comparison | Nie wie jak porównać wersje | Nowy skill |
| Breaking changes detection | Nie wie jak wykryć breaking changes | Część version skill |
| Project onboarding | Nie wie jak analizować nowy projekt | Dodać sekcję |
| Batch validation | Brak workflow dla wielu skills naraz | Dodać sekcję |

### Rekomendowane skills:
```yaml
skills:
  required:
    - documentation-patterns      # ocena jakości skill
  optional:
    - research-source-evaluation  # NOWY - weryfikacja źródeł
    - version-changelog-patterns  # NOWY - sprawdzanie wersji
```

---

## 3. Nowe Skills do Stworzenia

### 3.1 `research-source-evaluation`

```markdown
## When to Use
When searching for authoritative sources or validating existing sources.

## Patterns

### Source Tiers
```
Tier 1 (Highest): Official documentation, RFCs, specs
Tier 2: Official blogs, release notes, changelogs
Tier 3: Reputable tech blogs (Vercel, Netlify, etc.)
Tier 4: Community (Stack Overflow, GitHub issues)
Tier 5 (Lowest): Personal blogs, tutorials
```

### Search Strategy
```
1. "[technology] official documentation"
2. "[technology] latest version changelog"
3. "[technology] best practices [year]"
4. "[technology] breaking changes"
```

### Source Validation
```
✅ Domain matches official project
✅ Date within last 12 months
✅ Author is maintainer/team member
✅ Links to source code/spec
```

## Anti-Patterns
- Trusting outdated StackOverflow answers
- Using blog posts without checking official docs
- Ignoring version numbers in examples
```

### 3.2 `version-changelog-patterns`

```markdown
## When to Use
When checking if skill content matches current library/framework version.

## Patterns

### Version Check Strategy
```
1. WebSearch: "[library] latest version [year]"
2. Check official changelog/releases page
3. Compare major.minor version
4. Look for deprecation notices
```

### Breaking Changes Detection
```
Keywords to search:
- "breaking change"
- "deprecated"
- "removed in"
- "migration guide"
- "BREAKING:"
```

### Changelog Locations
```
GitHub: /releases or CHANGELOG.md
npm: npmjs.com/package/[name]?activeTab=versions
Docs: Usually /changelog or /releases
```

## Anti-Patterns
- Assuming patch versions have no changes
- Ignoring beta/canary version patterns
- Not checking peer dependencies
```

---

## 4. Plan Odchudzania Agentów

### Filozofia odchudzania:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT SLIMMING PHILOSOPHY                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ZOSTAWIĆ w Agencie:                                             │
│  ├─ Identity/Role (kim jest)                                     │
│  ├─ Workflow Steps (JAK pracuje)                                 │
│  ├─ Decision Logic (KIEDY co robić)                              │
│  ├─ Output Format (CO produkuje)                                 │
│  └─ Handoff Protocol (KOMU przekazuje)                           │
│                                                                  │
│  PRZENIEŚĆ do Skills:                                            │
│  ├─ Domain Knowledge (patterns, best practices)                  │
│  ├─ Checklists (weryfikacja)                                     │
│  ├─ Templates (struktury)                                        │
│  └─ Reference Data (confidence levels, tiers)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.1 SKILL-CREATOR Slimming

**Przed (~550 tok):**
```
- Identity
- Core Principles
- Skill Structure Template    ← ZOSTAWIĆ (output format)
- Workflow Steps              ← ZOSTAWIĆ
- Size Check rules           ← PRZENIEŚĆ do skill
- Confidence Levels          ← PRZENIEŚĆ do skill
- Output Format              ← ZOSTAWIĆ
- Quality Gates              ← CZĘŚCIOWO przenieść
- Handoff                    ← ROZBUDOWAĆ
```

**Po (~400 tok):**
```yaml
---
name: skill-creator
skills:
  required: [documentation-patterns]
  optional: [research-source-evaluation, version-changelog-patterns]
---

# SKILL-CREATOR

## Identity
[krótko - 2-3 zdania]

## Workflow
1. Research → Load: research-source-evaluation
2. Draft → Use: documentation-patterns
3. Validate → Check quality gates
4. Register → Update REGISTRY.yaml

## Skill Structure (Output)
[template - bez szczegółów, są w documentation-patterns]

## Handoff to VALIDATOR
[konkretny YAML format]

## Quality Gates
- [ ] Size < 1500 tokens
- [ ] Sources cited
- [ ] REGISTRY updated
```

**Redukcja:** ~550 → ~400 tok (-27%)

### 4.2 SKILL-VALIDATOR Slimming

**Przed (~630 tok):**
```
- Identity
- Core Principles
- Validation Workflow         ← ZOSTAWIĆ
- Verdict Types              ← ZOSTAWIĆ
- Validation Checklist       ← CZĘŚCIOWO przenieść
- Output Format              ← ZOSTAWIĆ
- Review Cycle Integration   ← ZOSTAWIĆ
- Handoff                    ← ZOSTAWIĆ
```

**Po (~450 tok):**
```yaml
---
name: skill-validator
skills:
  required: [documentation-patterns]
  optional: [research-source-evaluation, version-changelog-patterns]
---

# SKILL-VALIDATOR

## Identity
[krótko - 2-3 zdania]

## Workflow
1. Source Check → Load: research-source-evaluation
2. Freshness Check → Load: version-changelog-patterns
3. Quality Check → Use: documentation-patterns
4. Issue Verdict

## Verdict Types
[tabela - to jest core logic, zostaje]

## Output Format
[Validation Report template]

## Review Cycle
[kiedy uruchamiać review]

## Handoff per Verdict
[gdzie kierować wyniki]
```

**Redukcja:** ~630 → ~450 tok (-29%)

---

## 5. Co Wyekstrahować do Skills

### Z SKILL-CREATOR:

| Wiedza | Nowy skill | Tokeny |
|--------|------------|--------|
| Confidence Levels | `skill-quality-standards` | ~200 |
| Token estimation | `skill-quality-standards` | - |
| Source tiers | `research-source-evaluation` | ~400 |

### Z SKILL-VALIDATOR:

| Wiedza | Nowy skill | Tokeny |
|--------|------------|--------|
| Source verification | `research-source-evaluation` | ~400 |
| Version checking | `version-changelog-patterns` | ~350 |
| Quality checklist | `skill-quality-standards` | ~200 |

### Wspólny skill dla obu:

**`skill-quality-standards`** (~400 tok)
```markdown
## When to Use
When creating or validating skills.

## Patterns

### Size Limits
- Target: 400-1000 tokens
- Max: 1500 tokens
- 1 word ≈ 1.3 tokens
- 1 code line ≈ 10 tokens

### Confidence Levels
| Level | Criteria |
|-------|----------|
| high | 2+ official sources, tested |
| medium | 1 source or community |
| low | blog/experimental |

### Required Sections
- When to Use (trigger)
- Patterns (2+ with code)
- Anti-Patterns
- Verification Checklist

### Quality Checklist
- [ ] Under 1500 tokens
- [ ] Every pattern has source
- [ ] Trigger is specific
- [ ] Anti-patterns included
```

---

## 6. Podsumowanie Nowych Skills

| Skill | Tokeny | Dla kogo |
|-------|--------|----------|
| `research-source-evaluation` | ~400 | CREATOR, VALIDATOR |
| `version-changelog-patterns` | ~350 | CREATOR, VALIDATOR |
| `skill-quality-standards` | ~400 | CREATOR, VALIDATOR |

**Razem:** 3 nowe skills, ~1150 tokenów

---

## 7. Action Items

### Natychmiastowe:
1. [ ] Stworzyć `research-source-evaluation` skill
2. [ ] Stworzyć `version-changelog-patterns` skill
3. [ ] Stworzyć `skill-quality-standards` skill
4. [ ] Zaktualizować SKILL-CREATOR (dodać skills, rozbudować handoff)
5. [ ] Zaktualizować SKILL-VALIDATOR (dodać skills, dodać project onboarding)
6. [ ] Update REGISTRY.yaml

### Efekt końcowy:
```
SKILL-CREATOR:  550 → 400 tok (-27%)
SKILL-VALIDATOR: 630 → 450 tok (-29%)
+ 3 nowe skills: 1150 tok (shared between agents)
```

Agenci będą mniejszi ALE mądrzejsi dzięki skills!
