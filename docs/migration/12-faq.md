## 12. FAQ

### General Questions

**Q1: Do I have to migrate my whole project at once?**

**A:** No. You can:
- Migrate incrementally (one component at a time)
- Start with just core files and add the rest later
- Use methodology pack for new work, keep old structure for legacy code
- Hybrid approach: New epics use organized structure, old docs stay as-is

**Q2: What if I don't use all the agents?**

**A:** That's fine! Use only what you need:
- Solo developer: Use 3-4 key agents (Orchestrator, Senior Dev, Code Reviewer)
- Small team: Add PM and QA agents
- Full team: Use all 13 agents

The pack is flexible - customize to your needs.

**Q3: Can I customize the documentation structure?**

**A:** Yes, the standard structure is a guideline, not a strict requirement:
- Keep the general structure (1-Baseline, 2-Management, etc.)
- Add custom folders as needed (e.g., 6-OPERATIONS)
- Rename to match your terminology (e.g., 1-REQUIREMENTS instead of 1-BASELINE)
- Document changes in your CLAUDE.md

**Q4: How do I handle existing Git history?**

**A:** Git history is preserved:
- Use `git mv` instead of `mv` to maintain file history
- Git tracks renames automatically (usually)
- Check history with `git log --follow filename`
- Large migrations: commit frequently to track changes

**Q5: What if my CLAUDE.md is still too long after trimming?**

**A:**
1. Move all details to referenced files
2. Use tables instead of prose
3. Remove unnecessary sections
4. Create a "project facts" file: @docs/project-facts.md
5. Keep ONLY: name, tech stack (one line), current state reference, key file references

Aim for 40-50 lines, leaving buffer for growth.

### Technical Questions

**Q6: Do I need to use all the state files?**

**A:** No, start minimal:
- **Essential:** AGENT-STATE.md, TASK-QUEUE.md
- **Recommended:** DECISION-LOG.md
- **Optional:** HANDOFFS.md, DEPENDENCIES.md, METRICS.md
- **Advanced:** AGENT-MEMORY.md (for complex projects)

Add more as needed.

**Q7: How do I migrate a wiki or Notion docs?**

**A:**
1. Export wiki to markdown
2. Map pages to standard structure:
   - Overview pages → 1-BASELINE/product/
   - Technical specs → 1-BASELINE/architecture/
   - How-to guides → 4-DEVELOPMENT/guides/
3. Convert internal links to @references
4. Import into docs/ folder
5. Create index in docs/00-START-HERE.md

**Q8: Can I use this with GitHub/GitLab wikis?**

**A:** Yes:
- **Option 1:** Migrate wiki content to docs/ folder (recommended)
- **Option 2:** Keep wiki, reference from CLAUDE.md:
  ```markdown
  ## External Documentation
  - Wiki: https://github.com/org/repo/wiki
  - (See @docs/ for organized structured docs)
  ```
- **Option 3:** Hybrid - key docs in organized structure, supplementary in wiki

**Q9: How do I handle generated documentation (JSDoc, Sphinx)?**

**A:**
- Keep generated docs in their usual location
- Reference from CLAUDE.md:
  ```markdown
  ## API Documentation
  - Reference: @docs/4-DEVELOPMENT/api/README.md
  - Auto-generated: ./build/docs/api/ (not in @references)
  ```
- Don't reference generated files directly (they change often)
- Create a stable reference file that links to generated docs

**Q10: What about binary files (images, PDFs)?**

**A:**
- Store in docs structure:
  ```
  docs/3-ARCHITECTURE/ux/wireframes/login-page.png
  docs/1-BASELINE/research/user-survey.pdf
  ```
- Reference from markdown:
  ```markdown
  ![Login wireframe](wireframes/login-page.png)
  See [user survey results](../research/user-survey.pdf)
  ```
- Claude can read images and PDFs when referenced

### Workflow Questions

**Q11: How do I coordinate migration with active development?**

**A:**
- **Option 1: Feature freeze** (recommended for small projects)
  - Freeze new features for 1-2 days
  - Complete migration
  - Resume development

- **Option 2: Parallel development** (for large teams)
  - Create migration branch
  - Continue development on main
  - Merge strategy:
    ```bash
    # Daily: merge main into migration branch
    git checkout migration/agent-pack
    git merge main
    # Resolve conflicts

    # When ready: merge migration into main
    git checkout main
    git merge migration/agent-pack
    ```

- **Option 3: Incremental** (least disruption)
  - Migrate docs only (1 hour)
  - Use agents for new work
  - Gradually improve structure over weeks

**Q12: How do I migrate in-progress work?**

**A:**
1. Document current work as Epic:
   ```bash
   cat > docs/2-MANAGEMENT/epics/current/epic-current-work.md << 'EOF'
   # Epic: [Current Feature Name]

   ## Status
   In Progress (started before migration)

   ## Current State
   - [x] Part A complete
   - [ ] Part B in progress
   - [ ] Part C planned

   ## Next Steps
   Continue with Part B...
   EOF
   ```

2. Update PROJECT-STATE.md with current status
3. Continue work using agents
4. Retroactively add stories if needed

**Q13: What if team has difficulty with the new structure?**

**A:**
- **Education:** Show benefits with examples
- **Gradual adoption:** Don't force all at once
- **Quick wins:** Demonstrate value with small tasks
- **Listen:** Gather feedback, adjust approach
- **Support:** Provide training and ongoing help
- **Flexibility:** Customize to team preferences

**Q14: How often should I update state files?**

**A:**
- **AGENT-STATE.md:** When agent starts/completes task (multiple times per day)
- **TASK-QUEUE.md:** Daily (morning standup, end of day)
- **PROJECT-STATE.md:** When sprint status changes (every few days)
- **DECISION-LOG.md:** When architectural decision made (as needed)
- **METRICS.md:** End of sprint

Automate updates where possible.

**Q15: Can I automate any of this?**

**A:** Yes, several opportunities:
- **Validation:** Run `validate-docs.sh` in pre-commit hook
- **State updates:** Script to update TASK-QUEUE from GitHub issues
- **Metrics:** Auto-calculate from git commits
- **Token counting:** Pre-commit hook to warn if CLAUDE.md >70 lines
- **Documentation generation:** Script to generate MODULE-INDEX from codebase

See scripts/README.md for automation examples.

### Troubleshooting Questions

**Q16: Migration took longer than estimated. Why?**

**Common causes:**
- Underestimated documentation size (run audit first!)
- Many large files requiring sharding (>500 lines each)
- Team coordination overhead (more people = more time)
- Unfamiliar with documentation structure (learning curve)
- Discovered missing/outdated docs during organization

**Prevention:**
- Thorough audit before starting
- Add 50% buffer to estimates
- Account for team coordination time
- Practice with small folder first

**Q17: Agents can't find my files even though paths look correct.**

**Troubleshooting:**
```bash
# 1. Verify file exists
ls -la PROJECT-STATE.md

# 2. Check working directory
pwd  # Should be project root

# 3. Test reference explicitly
echo "Test: @PROJECT-STATE.md" | claude --project .

# 4. Check for hidden characters
cat -A CLAUDE.md | grep "@PROJECT-STATE"

# 5. Try absolute path temporarily
# In CLAUDE.md: @/full/path/to/PROJECT-STATE.md

# 6. Verify Claude CLI project path
claude config  # Check project path setting
```

**Q18: I broke something during organization. How do I rollback?**

**A:**
```bash
# Option 1: Git reset to pre-organization tag
git tag  # Find your pre-organization tag
git reset --hard pre-organization-20251205

# Option 2: Restore from backup
rm -rf project/
tar -xzf project-backup-20251205.tar.gz

# Option 3: Revert specific commit
git log --oneline  # Find bad commit
git revert abc1234

# Option 4: Cherry-pick good commits to new branch
git checkout -b recovery main
git cherry-pick <good-commit-1> <good-commit-2>
```

**Prevention:** Commit frequently, tag milestones, keep backups.

**Q19: Team says they can't find anything. What do I do?**

**A:**
1. **Create finding guide** (see Example 1 above)
2. **Pair with team members** - show them in person
3. **Update onboarding** - add to team wiki
4. **Search tools:**
   ```bash
   # Add to .bashrc or .zshrc
   alias docfind='grep -r "$1" docs/'
   alias docmap='cat docs/WHERE-IS-EVERYTHING.md'
   ```
5. **Slack bot** (advanced): Bot responds with file locations

**Q20: Migration complete but validation still fails. Why?**

**Common issues:**
- **Broken @references:** File moved but reference not updated
  - Fix: Search CLAUDE.md for all @, verify each exists

- **CLAUDE.md >70 lines:** Still too much inline content
  - Fix: More aggressive sharding, move everything to referenced files

- **Missing directories:** Documentation structure incomplete
  - Fix: `mkdir -p docs/{1-BASELINE,2-MANAGEMENT,3-ARCHITECTURE,4-DEVELOPMENT,5-ARCHIVE}`

- **Wrong file permissions:** Scripts not executable
  - Fix: `chmod +x scripts/*.sh`

- **State files empty:** Templates not filled in
  - Fix: Populate AGENT-STATE.md, TASK-QUEUE.md with actual data

Run validation with verbose mode:
```bash
bash scripts/validate-docs.sh --verbose
```

---

## Summary

Migration to Agent Methodology Pack transforms your project structure for AI-powered development. Whether you choose quick migration (15 minutes) or full migration (1-3 days), the result is:

- ✅ Organized documentation structure
- ✅ Clear agent workflows
- ✅ Persistent state management
- ✅ Token-optimized context files
- ✅ Team collaboration framework

**Key Takeaways:**

1. **Start small:** Use quick migration for <50 files, full migration for larger projects
2. **Plan first:** Audit project, create file mapping, set priorities
3. **Shard large files:** Keep docs <300 lines, CLAUDE.md <70 lines
4. **Use structure wisely:** Map existing structure to Baseline/Management/Architecture/Development
5. **Setup workspaces:** Initialize state files for agent coordination
6. **Validate frequently:** Run validation script after each phase
7. **Train your team:** Provide onboarding and finding guides
8. **Iterate:** Improve structure as you use it

**Next Steps:**

1. Review this guide
2. Choose migration approach (quick vs full)
3. Create backup and migration branch
4. Follow appropriate workflow
5. Validate and test
6. Start using agents!

**Need Help?**

- Reread relevant sections
- Check examples for your stack
- Ask in project discussions
- Review FAQ

Good luck with your migration! 🚀

---

**Migration Guide Version:** 1.0.0
**Last Updated:** 2025-12-05
**Maintained by:** Agent Methodology Pack Team

**Feedback:** Help us improve this guide by reporting issues or suggesting improvements.

---

**Word Count:** ~12,500 words | **Line Count:** ~1,850 lines
**Estimated Reading Time:** 45-60 minutes
**Estimated Migration Time:** 15 minutes to 2 weeks (varies by project size)
