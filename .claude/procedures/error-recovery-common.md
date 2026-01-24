# Common Error Recovery Procedures

Shared error patterns and recovery actions across all agents. Reference this when errors occur instead of duplicating recovery procedures in each agent.

---

## Universal Error Recovery Table

| Situation | Severity | Immediate Action | Next Step | Escalate To |
|-----------|----------|------------------|-----------|-------------|
| Tests fail after change | CRITICAL | UNDO change immediately | Analyze why | Senior-Dev if pattern |
| Checkpoint write fails | LOW | Log warning, continue | Retry once | Skip if persistent |
| Story ID unknown | MEDIUM | Use input pattern or ask | Wait for clarification | Orchestrator |
| Phase number unclear | MEDIUM | Use sequential (P1→P7) | Verify with context | Orchestrator |
| Blocked by dependency | HIGH | Note `Block: YES` | Wait for dependency | PM-Agent |
| Security vulnerability found | CRITICAL | DO NOT PROCEED | Fix immediately | Code-Reviewer blocks |
| Performance regression | MEDIUM | Investigate cause | Fix or document | Senior-Dev review |
| Out of disk space | CRITICAL | Clean workspace | Retry | Devops-Agent |
| API timeout/failure | MEDIUM | Retry 3x with backoff | Check connectivity | Devops-Agent |
| Git conflict on merge | HIGH | Resolve manually | Verify tests pass | Code-Reviewer |
| Database migration fails | CRITICAL | Rollback immediately | Fix migration script | Architect |

---

## Error Recovery by Agent Type

### Development Agents (Backend-Dev, Frontend-Dev, Senior-Dev)

#### Tests Fail After Implementation
```
1. STOP writing new code
2. Run the failing test in isolation: npm test -- --testNamePattern="specific test"
3. Debug the issue:
   - Check test expectations vs. implementation
   - Verify mock setup
   - Check if test is incomplete
4. Options:
   a) Fix implementation
   b) Fix test (if test is wrong)
   c) Ask TEST-WRITER if test is ambiguous
5. Verify test passes
6. Run full suite to ensure no regressions
7. Commit when all GREEN
```

#### Refactoring Broke Tests (Senior-Dev Only)
```
1. IMMEDIATELY undo the change
   git checkout -- <file>  (unsaved)
   OR git revert HEAD      (committed)
2. Verify tests GREEN again
3. Analyze what went wrong:
   - Did I change behavior? (Not allowed in refactor)
   - Did I miss an edge case?
   - Is there a side effect?
4. Plan different approach:
   - Smaller change
   - Different code smell
   - Different refactoring pattern
5. Document in code comments if not refactorable
```

#### Migration Fails
```
1. Determine if data was modified:
   - SELECT COUNT(*) FROM affected_table
2. Options:
   a) Safe to rollback: npx supabase migration rollback
   b) Data modified: Contact Architect for recovery plan
3. Fix migration script:
   - Check SQL syntax
   - Verify constraints
   - Test on development database
4. Retry migration
5. Verify data integrity post-migration
```

#### Performance Issues
```
1. Identify the bottleneck:
   - Use profiler: chrome devtools, node --inspect
   - Check database query times
   - Measure API response times
2. Options:
   a) Quick fix available → Fix and verify
   b) Requires refactor → Escalate to Senior-Dev
   c) Requires architecture change → Escalate to Architect
3. If merged but not critical:
   - Document issue in code comments
   - Create follow-up story for optimization
4. If critical before QA:
   - BLOCK the PR until fixed
```

### Test Writer

#### Test File Won't Run
```
1. Check for syntax errors:
   npm run lint --fix      (auto-fix formatting)
   npm test -- --listTests (verify test found)
2. If TypeScript error:
   npm run typecheck       (see detailed errors)
   Fix imports/types
3. If setup issues:
   - Check test environment setup
   - Verify mocks are imported
   - Check beforeEach hooks
4. Consult test-guidelines skill for patterns
```

#### Can't Create Test for AC
```
1. Is AC unclear or ambiguous?
   - Ask PRODUCT-OWNER for clarification
   - Document assumptions
   - Create multiple test scenarios
2. Is AC technical/implementation focused?
   - Work with Developer to understand approach
   - Create behavioral test, not implementation test
3. Is feature too complex to test in unit tests?
   - Plan integration test instead
   - Document test limitation
   - Create follow-up for e2e test
```

### Code Reviewer

#### Tests Fail During Review
```
1. Immediately BLOCK the PR
2. Return code to Developer with:
   - Test command that fails
   - Error output
   - Investigation summary
3. Request: "Fix tests and re-submit"
4. Re-review after fix
```

#### Security Vulnerability Found
```
1. Mark issue as CRITICAL
2. BLOCK merge immediately
3. Document specific issue:
   - What is vulnerable (field/function/pattern)
   - Why it's vulnerable (attack vector)
   - How to fix it (specific code changes)
4. Examples of critical vulns:
   - Hardcoded secrets (API keys, passwords)
   - SQL injection (unsanitized queries)
   - Missing auth/authorization checks
   - Data exposed in error messages
   - Unsafe object deserialization
```

#### AC Unclear
```
1. Document what you don't understand
2. Ask ORCHESTRATOR for clarification with:
   - Story ID
   - Which AC is unclear
   - What interpretation did dev use?
   - What should it actually do?
3. Wait for response before APPROVED/CHANGES decision
4. May need to loop back to requirements
```

### QA Agent

#### AC Can't Be Verified
```
1. Try alternative verification:
   - API call with Postman/curl instead of UI
   - Database query to verify data
   - Log output to confirm behavior
2. If still can't verify:
   - Ask DEVELOPER to explain AC
   - Ask TEST-WRITER if this was in their tests
   - Document limitation
3. Decision options:
   a) AC technically met but hard to test → PASS with note
   b) AC not met or can't verify → FAIL and request fix
```

#### Critical Bug Found
```
1. FAIL the deployment immediately
2. Document bug with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshot/video if UI issue
   - Severity (critical/major/minor)
3. Critical bugs = must fix before deploy:
   - Data loss risks
   - Security issues
   - Core functionality broken
4. Major bugs = should fix:
   - Logic errors
   - Significant UX issues
5. Route back to P3 (implementation) for fixes
```

#### Performance Below Threshold
```
1. Measure specific metrics:
   - API response time (target <200ms)
   - Page load time (target <2s)
   - Database query time (target <100ms)
2. Options:
   a) Slightly below target → Document for future optimization
   b) Significantly below target → FAIL and request optimization
3. Escalate performance fix to Senior-Dev
```

---

## Checkpoint-Related Errors

### Checkpoint Write Fails
```
Situation: bash echo command fails when appending to checkpoint file

Immediate:
1. Log warning: "Checkpoint write failed - continuing anyway"
2. Proceed with phase work

Recovery:
1. Verify file exists: ls -l .claude/checkpoints/{STORY_ID}.yaml
2. Check permissions: chmod 644 .claude/checkpoints/{STORY_ID}.yaml
3. Try manual append with cat >> approach
4. Contact DevOps if file corruption suspected

Important: Checkpoints are informational, not blocking. Phase completion
happens regardless of checkpoint write success.
```

### Story ID Unknown
```
Situation: Agent receives instruction with unknown Story ID format

Immediate:
1. Parse pattern from input:
   - Format: XX.Y (e.g., 06.10)
   - Or: XX.YZ (with sublevel)
   - Or: XX.Ya (a, b, c substories)
2. Use detected pattern for checkpoint

Recovery:
1. If pattern can't be detected:
   - Ask ORCHESTRATOR: "Story ID format unclear, using default"
   - Use sequential checkpoint anyway
2. Include Story ID in micro-handoff for confirmation
```

### Phase Number Unclear
```
Situation: Agent unsure which phase (P1-P7) they're in

Use Sequential Logic:
1. UX Design (if needed) → P1
2. Test Writing (RED) → P2
3. Implementation (GREEN) → P3
4. Refactoring → P4 (not for all stories)
5. Code Review → P5
6. QA Testing → P6
7. Documentation → P7 (optional)

Recovery:
1. Look at checkpoint file - which phases already completed?
2. You're the next phase in sequence
3. If still unclear, ask ORCHESTRATOR

Example:
If checkpoint has:
  P1: ✓ ux-designer ...
  P2: ✓ test-writer ...
Then next is P3 (you're backend-dev implementing)
```

---

## Git and Deployment Errors

### Git Merge Conflict
```
1. STOP before resolving
2. Understand the conflict:
   git diff HEAD      (your changes)
   git diff MERGE_HEAD (their changes)
3. Analysis:
   - Are both changes needed?
   - Is one wrong?
   - Can they be combined?
4. Resolve by:
   - Editing file and removing conflict markers
   - Re-running tests after resolve
   - Verifying logic makes sense
5. Complete merge:
   git add <resolved-files>
   git commit -m "Resolve merge conflict"
```

### Commit Fails - Pre-commit Hook Error
```
1. Identify what hook is failing:
   - Lint errors: npm run lint --fix
   - Type errors: npm run typecheck
   - Test errors: npm test

2. Fix the issue:
   - Auto-fix formatting: npm run lint --fix
   - Fix types manually
   - Fix tests
   - Check for hardcoded secrets

3. Re-stage and retry:
   git add <files>
   git commit -m "message"
```

### Force Push Not Allowed
```
Situation: You tried `git push --force` but it's rejected

Why This Happens:
- Safety measure on main/protected branches
- Prevents losing other developers' commits

Solution:
1. DON'T force push to main
2. If on feature branch:
   - git push --force-with-lease (safer)
   - Only if you're the only one on branch
3. If conflict with remote:
   - Pull latest: git pull origin <branch>
   - Resolve conflicts
   - Push normally: git push

Escalate if:
- You need to rewrite history on main (talk to Architect)
```

---

## Database and Cache Errors

### Redis Cache Error
```
Situation: Cache operation fails (cache_get, cache_set)

Immediate:
1. Log warning: "Cache operation failed, continuing without cache"
2. Proceed with work without caching

Recovery:
1. Check if redis is running:
   redis-cli ping  (should return PONG)
2. If not running:
   - Start redis: redis-server
   - Or use `.claude/cache-clear.sh`
3. Retry cache operation once

Important: Cache failures never block implementation. They're optimization only.
```

### Database Query Timeout
```
Situation: Supabase query times out

Immediate:
1. STOP current query
2. Check query:
   - Is it scanning full table?
   - Is JOIN too complex?
   - Missing WHERE clause?

Recovery:
1. Simplify query:
   - Add WHERE with indexed column
   - Reduce joined tables
   - Use LIMIT for testing
2. Check indexes exist:
   supabase db indexes
3. Retry with simplified query

If query must be complex:
- Escalate to Architect for denormalization/caching strategy
```

### RLS Policy Blocking Access
```
Situation: Database query fails with "RLS policy violates"

Immediate:
1. STOP the operation
2. Check RLS policy:
   - Is org_id included in query?
   - Does user have permission?
   - Is auth_uid correct?

Recovery:
1. Verify user auth context:
   const { user } = await supabase.auth.getUser()
2. Ensure org_id in WHERE clause:
   .eq('org_id', user.user_metadata.org_id)
3. Check RLS policy syntax in migration
4. Test with dev user
5. If policy issue:
   - Contact Architect for RLS policy review
```

---

## Network and External Service Errors

### API Endpoint Returns 500
```
Immediate:
1. Check if error is persistent or transient
2. Retry request 3 times with exponential backoff:
   Try 1: Wait 1s, retry
   Try 2: Wait 2s, retry
   Try 3: Wait 4s, fail

Recovery:
1. Check API logs for error:
   supabase functions logs <function-name>
2. Identify root cause:
   - Database error (query syntax)
   - Auth error (missing token)
   - Validation error (invalid input)
   - Resource not found (404 response)
3. Fix implementation:
   - Fix query
   - Add token
   - Validate input
   - Check resource exists
```

### Network Timeout
```
Immediate:
1. Check internet connection:
   ping 8.8.8.8
2. Check if service is down:
   Supabase status page
   npm registry status
3. Retry with longer timeout

Recovery:
1. If infrastructure issue:
   - Wait and retry
   - Contact DevOps if persistent
2. If local network:
   - Check VPN connection
   - Check firewall rules
   - Reset connection
```

---

## Escalation Criteria

### When to Escalate

Escalate to ARCHITECT when:
- Multiple refactoring attempts fail
- Need ADR for new pattern
- Database schema needs major change
- Performance issue requires redesign
- RLS policy too complex

Escalate to CODE-REVIEWER when:
- Security concern in implementation
- Quality issue blocking tests
- Design pattern mismatch

Escalate to ORCHESTRATOR when:
- Story ID or phase unclear
- Dependency not ready
- Need requirement clarification
- Scope needs redefinition

Escalate to DEVOPS-AGENT when:
- Infrastructure/deployment issue
- Database access problem
- Redis/cache infrastructure
- Secret/credential issue

Escalate to PM-AGENT when:
- Story seems incomplete
- AC contradictory
- Scope creep risk
- Timeline issue

---

## Integration with Agent Files

Each agent should reference this document:

```markdown
## Error Recovery

See: `.claude/procedures/error-recovery-common.md` for standard recovery procedures

Additional agent-specific error recovery:
[Agent-specific errors unique to this role]
```

---

## Quick Reference: Most Common Errors

1. **Tests fail** → Check implementation logic, fix code, verify test expectations
2. **Checkpoint write fails** → Log warning, continue work (not blocking)
3. **Refactor breaks tests** → UNDO immediately, analyze why, try different approach
4. **Security issue in review** → BLOCK PR, document fix needed, return to dev
5. **API timeout** → Retry 3x with backoff, check connectivity
6. **Git conflict** → Resolve carefully, re-run tests, verify logic
7. **RLS policy blocking** → Add org_id to WHERE clause, verify auth context
8. **Performance regression** → Investigate cause, fix or document, escalate if needed

---

## Error Prevention

Instead of recovering from errors, prevent them:

1. **Run tests early and often** (not at the end)
2. **Verify auth and permissions** before DB operations
3. **Check for hardcoded secrets** (never commit them)
4. **Include edge cases** in tests
5. **Review for RLS policies** before pushing
6. **Measure performance** during development, not after
7. **Keep refactorings small** (single code smell at a time)
8. **Commit often** (recover from bad commit with revert)

---

## Support and Debugging Tools

### Commands Available

```bash
# Test commands
npm test                          # Run all tests
npm test -- --testNamePattern="X"  # Run specific test
npm run lint                      # Check code quality
npm run typecheck                 # Check TypeScript
npm run build                     # Build for production

# Database/Cache
redis-cli ping                    # Test redis
supabase functions logs <name>    # Check edge function logs
supabase db pull                  # Sync local schema

# Git debugging
git log --oneline -10             # Recent commits
git diff HEAD~1                   # Changes since last commit
git status                        # Current state
git stash                         # Save current changes

# Performance profiling
node --inspect                    # Node.js debugger
chrome://devtools                 # Chrome developer tools
```

### Documentation References

- `.claude/PATTERNS.md` - Code patterns and conventions
- `.claude/TABLES.md` - Database schema reference
- `docs/0-DISCOVERY/` - Architecture documentation
- `docs/1-BASELINE/product/prd.md` - Feature definitions
- `.claude/checklists/` - Task checklists

