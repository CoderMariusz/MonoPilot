---
name: invest-stories
description: When writing, reviewing, or validating user stories. Used by ARCHITECT-AGENT and PRODUCT-OWNER.
---

## When to Use
When writing, reviewing, or validating user stories. Used by ARCHITECT-AGENT and PRODUCT-OWNER.

## Patterns

### INVEST Criteria

**I - Independent**
```
✅ Can be developed without waiting for other stories
✅ No circular dependencies
❌ "This needs Story X which needs this"
```

**N - Negotiable**
```
✅ HOW is flexible (implementation not prescribed)
✅ WHAT is clear (outcome defined)
❌ "Must use React Query with exact caching config"
```

**V - Valuable**
```
✅ Delivers value to USER or BUSINESS
✅ Value stated explicitly
❌ "Refactor database layer" (no user value)
✅ "User sees data faster because we optimized queries"
```

**E - Estimable**
```
✅ Team can estimate complexity (S/M/L)
✅ No major unknowns blocking estimation
❌ "Integrate with external API" (which API? what ops?)
```

**S - Small**
```
✅ Completable in 1-3 sessions
✅ Can be code reviewed in one sitting
❌ 10+ acceptance criteria, multiple components
```

**T - Testable**
```
✅ ALL acceptance criteria verifiable
✅ Given/When/Then format used
❌ "System should handle errors gracefully"
✅ "Given invalid input, Then error message X displays"
```

## Anti-Patterns
- Technical stories without user value
- Epic disguised as story (too big)
- Vague AC ("properly handles", "works correctly")
- Implementation prescribed in story
- Circular dependencies between stories

## Verification Checklist
- [ ] Story traces to PRD requirement
- [ ] Each INVEST criterion passes
- [ ] AC uses Given/When/Then
- [ ] No vague words in AC
- [ ] Dependencies are one-way only
- [ ] Estimated as S, M, or L
