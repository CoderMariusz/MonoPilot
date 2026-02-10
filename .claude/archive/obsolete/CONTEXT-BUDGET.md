# Context Budget Management

## Overview
Strategies for managing context window effectively.

## Context Allocation

### Reserved (Always Load)
- CLAUDE.md (~500 tokens)
- PROJECT-STATE.md (~300 tokens)
- Current agent definition (~500 tokens)
- **Total Reserved:** ~1,300 tokens

### Task-Specific
- Story/Task details (~200-500 tokens)
- Relevant code files (~1,000-5,000 tokens)
- Test files (~500-2,000 tokens)
- **Total Task:** ~2,000-8,000 tokens

### Reference (Load as Needed)
- Architecture docs
- API specifications
- Previous decisions
- **Total Reference:** Variable

## Budget Guidelines

### Small Context (8K)
- Load essentials only
- One file at a time
- Summarize results

### Medium Context (32K)
- Load task context
- Multiple related files
- Keep history limited

### Large Context (100K+)
- Full task context
- Related documentation
- Extended history

## Optimization Strategies

### Summarization
- Summarize completed sections
- Extract key points only
- Reference docs by location

### Chunking
- Break large files
- Process in sections
- Merge results

### Selective Loading
- Load headers first
- Expand as needed
- Unload when done

## Token Estimation
| Content | Approx Tokens |
|---------|---------------|
| 1 line of code | 10-20 |
| 1 paragraph | 50-100 |
| 1 page | 300-500 |
| 1 file (avg) | 500-2000 |

## Monitoring
Track context usage in AGENT-MEMORY.md
