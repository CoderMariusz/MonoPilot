---
description: Quick code review using Haiku model (cost-effective)
---

[USE HAIKU MODEL FOR THIS TASK]

Perform a quick, focused code review:

1. Check git diff for recent changes
2. Review ONLY changed files
3. Look for:
   - TypeScript errors
   - Missing types
   - Code style issues
   - Obvious bugs
   - Security issues (SQL injection, XSS)

4. Output format:
   ```
   ✅ Looks good / ⚠️ Issues found

   [file_path:line] - [issue description]
   ```

Keep it concise. Focus on critical issues only.
