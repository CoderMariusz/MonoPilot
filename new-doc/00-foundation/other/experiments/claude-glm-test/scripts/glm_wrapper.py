#!/usr/bin/env python3
"""
GLM Wrapper for Claude Code Agents
Agents call this script to delegate work to GLM-4.7

Usage by agent:
    python glm_wrapper.py --task write-tests --story 01.2 --context story.md,wireframes.md
    python glm_wrapper.py --task implement --story 01.2 --context tests.ts
    python glm_wrapper.py --task document --story 01.2 --context code.tsx

Returns:
    JSON with generated content that agent writes to files
"""

import sys
import os
import json
import argparse
from pathlib import Path
from typing import List
from glm_call_updated import GLMClient

# MonoPilot Tech Stack - MUST include in all prompts
TECH_STACK_INFO = """
CRITICAL - Tech Stack (DO NOT USE OTHER FRAMEWORKS):
- Frontend: Next.js 16 (App Router), React 19, TypeScript 5.x
- Styling: TailwindCSS + ShadCN UI components
- Backend: Supabase (PostgreSQL + Auth + RLS)
- Validation: Zod schemas
- Testing: Vitest (unit), Playwright (e2e)
- Monorepo structure: apps/frontend/

DO NOT use Vue, Angular, or other frameworks. This is a React/Next.js project.
"""

# Task templates for different agent types
TASK_TEMPLATES = {
    "write-tests": """You are a test-writer agent for Story {story_id}.

{tech_stack}

Context files provided:
{context_summary}

Task: Write comprehensive FAILING tests (TDD RED phase) for this story.

Requirements:
- Unit tests using Vitest (NOT Jest)
- React Testing Library for components
- API tests for Next.js route handlers
- E2E tests using Playwright
- All tests should initially FAIL (no implementation exists)
- Follow MonoPilot test patterns
- Use TypeScript with strict types
- Import from '@testing-library/react', 'vitest'

Output as JSON:
{{
  "files": [
    {{
      "path": "apps/frontend/__tests__/01-settings/{story_id}.test.ts",
      "content": "... test code ..."
    }},
    ...
  ],
  "summary": "Created X test files with Y test cases"
}}
""",

    "implement": """You are a backend-dev agent for Story {story_id}.

{tech_stack}

Context files provided:
{context_summary}

Task: Implement code to make ALL FAILING tests pass (TDD GREEN phase).

Requirements:
- Read test files to understand requirements
- Implement minimal code to pass tests
- Use Next.js 16 App Router (app/ directory, NOT pages/)
- React 19 with TypeScript strict mode
- ShadCN UI components (from @/components/ui/*)
- Supabase client from @/lib/supabase
- Follow RLS patterns (org_id filtering)
- API routes in app/api/[module]/route.ts format

File structure:
- Components: apps/frontend/components/[module]/
- API routes: apps/frontend/app/api/[module]/route.ts
- Services: apps/frontend/lib/services/[module]-service.ts
- Types: apps/frontend/lib/types/[module].ts

Output as JSON:
{{
  "files": [
    {{
      "path": "apps/frontend/components/...",
      "content": "... implementation code ..."
    }},
    ...
  ],
  "summary": "Implemented X files, Y tests now passing"
}}
""",

    # P3a: Services (backend-dev)
    "implement-services": """You are a backend-dev agent for Story {story_id}.
FOCUS: Services, Types, and Validation schemas ONLY.

{tech_stack}

Context files provided:
{context_summary}

Task: Implement SERVICES layer (P3a - parallel GREEN phase).

You are responsible for:
1. Service classes in lib/services/
2. TypeScript types in lib/types/
3. Zod validation schemas in lib/validation/

Requirements:
- Service methods: list, getById, create, update, delete
- All methods filter by org_id (multi-tenant)
- Use Supabase client from @/lib/supabase
- Proper TypeScript types (no 'any')
- Zod schemas for input validation

DO NOT implement: API routes, components, pages, hooks.

Output as JSON:
{{
  "files": [
    {{"path": "apps/frontend/lib/services/{story_id}-service.ts", "content": "..."}},
    {{"path": "apps/frontend/lib/types/{story_id}.ts", "content": "..."}},
    {{"path": "apps/frontend/lib/validation/{story_id}-schema.ts", "content": "..."}}
  ],
  "summary": "P3a: Implemented X service files"
}}
""",

    # P3b: Routes (backend-dev)
    "implement-routes": """You are a backend-dev agent for Story {story_id}.
FOCUS: API Routes ONLY.

{tech_stack}

Context files provided:
{context_summary}

Task: Implement API ROUTES layer (P3b - parallel GREEN phase).

You are responsible for:
1. Route handlers in app/api/[module]/route.ts
2. Dynamic routes in app/api/[module]/[id]/route.ts

Requirements:
- Next.js 16 App Router route handlers
- Use services from lib/services/ (import them)
- Proper error handling with NextResponse
- Auth check via getServerSession
- org_id from session for multi-tenant filtering

DO NOT implement: Services (use existing), components, pages.

Output as JSON:
{{
  "files": [
    {{"path": "apps/frontend/app/api/settings/.../route.ts", "content": "..."}},
    {{"path": "apps/frontend/app/api/settings/.../[id]/route.ts", "content": "..."}}
  ],
  "summary": "P3b: Implemented X API route files"
}}
""",

    # P3c: Components (frontend-dev)
    "implement-components": """You are a frontend-dev agent for Story {story_id}.
FOCUS: React Components ONLY.

{tech_stack}

Context files provided:
{context_summary}

Task: Implement COMPONENTS layer (P3c - parallel GREEN phase).

You are responsible for:
1. Data display components (tables, lists, cards)
2. Form components (create, edit forms)
3. Modal/Dialog wrappers
4. Confirmation dialogs

Requirements:
- React 19 functional components
- ShadCN UI components (@/components/ui/*)
- TypeScript with proper props types
- Accessible (aria labels, keyboard nav)
- Tailwind CSS for styling

DO NOT implement: Services, API routes, pages, hooks.

Output as JSON:
{{
  "files": [
    {{"path": "apps/frontend/components/settings/...Table.tsx", "content": "..."}},
    {{"path": "apps/frontend/components/settings/...Form.tsx", "content": "..."}},
    {{"path": "apps/frontend/components/settings/...Modal.tsx", "content": "..."}}
  ],
  "summary": "P3c: Implemented X component files"
}}
""",

    # P3d: Pages/Hooks (frontend-dev)
    "implement-pages": """You are a frontend-dev agent for Story {story_id}.
FOCUS: Pages and Hooks ONLY.

{tech_stack}

Context files provided:
{context_summary}

Task: Implement PAGES and HOOKS layer (P3d - parallel GREEN phase).

You are responsible for:
1. Page components in app/(authenticated)/[module]/
2. Custom hooks in lib/hooks/
3. State management for the feature

Requirements:
- Next.js 16 App Router pages (server components where possible)
- Custom hooks for data fetching (use API routes)
- Form state hooks with validation
- Loading, error, empty states
- Use components from components/settings/

DO NOT implement: Services, API routes, component internals.

Output as JSON:
{{
  "files": [
    {{"path": "apps/frontend/app/(authenticated)/settings/.../page.tsx", "content": "..."}},
    {{"path": "apps/frontend/lib/hooks/use-....ts", "content": "..."}}
  ],
  "summary": "P3d: Implemented X page/hook files"
}}
""",

    "review": """You are a code-reviewer agent for Story {story_id}.

{tech_stack}

Context files provided:
{context_summary}

Task: Review AND refactor implementation for quality and security.

PART 1 - REVIEW:
Check for:
- Security vulnerabilities (auth, RLS, SQL injections, XSS)
- TypeScript strict mode compliance (no any, proper types)
- Error handling (try/catch, error boundaries)
- Test coverage adequacy
- PRD compliance

PART 2 - REFACTOR (if approved):
If code passes review, also suggest refactoring:
- Remove code duplication (DRY)
- Extract reusable components/hooks
- Improve naming clarity
- Performance optimizations (memo, useMemo, useCallback where needed)
- Better error messages

Output as JSON:
{{
  "decision": "APPROVED" or "REQUEST_CHANGES",
  "issues": [
    {{"severity": "CRITICAL|HIGH|MEDIUM|LOW", "file": "path", "line": N, "description": "..."}},
    ...
  ],
  "refactoring": [
    {{"file": "path", "suggestion": "..."}},
    ...
  ],
  "test_results": {{"passing": X, "failing": Y}},
  "summary": "Review complete. X issues, Y refactoring suggestions."
}}
""",

    "document": """You are a tech-writer agent for Story {story_id}.

{tech_stack}

Context files provided:
{context_summary}

Task: Write technical documentation for the implemented feature.

Requirements:
- Component API documentation (props, events, slots)
- Usage examples with React/Next.js code
- Integration guide with Supabase
- All code examples must use TypeScript
- Follow MonoPilot docs structure

Output as JSON:
{{
  "files": [
    {{
      "path": "docs/components/{story_id}-component.md",
      "content": "... documentation ..."
    }},
    ...
  ],
  "summary": "Created documentation for X components"
}}
""",

    "refactor": """You are a senior-dev agent for Story {story_id}.

{tech_stack}

Context files provided:
{context_summary}

Task: Refactor the implementation (TDD REFACTOR phase).

All tests are passing. Improve code quality WITHOUT changing behavior.

Refactor for:
- Remove code duplication (DRY principle)
- Extract reusable components/hooks
- Improve naming and clarity
- Optimize performance (memo, useMemo, useCallback, avoid N+1 queries)
- Better error handling
- TypeScript strict mode compliance

CRITICAL: All tests must still pass after refactoring.

Output as JSON:
{{
  "files": [
    {{
      "path": "path/to/refactored/file.ts",
      "content": "... refactored code ..."
    }},
    ...
  ],
  "summary": "Refactored X files. Improvements: Y"
}}
"""
}

# Agent type → task mapping
AGENT_TO_TASK = {
    "test-writer": "write-tests",   # P2 RED
    "backend-dev": "implement",     # P3 GREEN
    "frontend-dev": "implement",    # P3 GREEN (alternative)
    "senior-dev": "refactor",       # P4 REFACTOR
    "code-reviewer": "review",      # P5 Code Review
    "tech-writer": "document",      # P7 Docs
}

# Model selection per agent
# Available: glm-4.7 (latest/best), glm-4-plus, glm-4-long (128K context), glm-4-flash (fast/cheap)
AGENT_TO_MODEL = {
    "test-writer": "glm-4.7",       # Latest model for tests
    "backend-dev": "glm-4.7",       # Latest model for code
    "frontend-dev": "glm-4.7",      # Latest model for code
    "senior-dev": "glm-4.7",        # Latest model for refactoring
    "code-reviewer": "glm-4.7",     # Latest model for review
    "tech-writer": "glm-4-flash",   # Faster/cheaper for docs
}

def write_files_to_disk(files: List[dict], base_dir: str) -> dict:
    """
    Write generated files directly to disk, bypassing Claude context.

    Args:
        files: List of {"path": "...", "content": "..."} dicts
        base_dir: Base directory for relative paths

    Returns:
        dict with written files count and any errors
    """
    written = []
    errors = []

    for file_info in files:
        try:
            file_path = file_info.get("path", "")
            content = file_info.get("content", "")

            if not file_path:
                errors.append({"error": "Missing path in file entry"})
                continue

            # Resolve full path
            full_path = Path(base_dir) / file_path

            # Create parent directories if needed
            full_path.parent.mkdir(parents=True, exist_ok=True)

            # Write file
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)

            written.append({
                "path": str(full_path),
                "size": len(content),
                "lines": content.count('\n') + 1
            })
            print(f"  [WROTE] {full_path} ({len(content)} bytes)", file=sys.stderr)

        except Exception as e:
            errors.append({
                "path": file_info.get("path", "unknown"),
                "error": str(e)
            })
            print(f"  [ERROR] {file_info.get('path', 'unknown')}: {e}", file=sys.stderr)

    return {
        "written": written,
        "errors": errors,
        "total_written": len(written),
        "total_errors": len(errors)
    }


def load_context_files(file_paths: List[str]) -> str:
    """Load and summarize context files"""
    summaries = []
    for path in file_paths:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Truncate large files
                preview = content[:500] + "..." if len(content) > 500 else content
                summaries.append(f"FILE: {path}\n{preview}\n")
        except Exception as e:
            summaries.append(f"FILE: {path}\nERROR: {e}\n")

    return "\n".join(summaries)

def main():
    parser = argparse.ArgumentParser(description="GLM Wrapper for Claude Code Agents")

    # Option 1: Use --agent (auto-selects task and model)
    parser.add_argument("--agent",
                       choices=["test-writer", "backend-dev", "frontend-dev", "senior-dev", "code-reviewer", "tech-writer"],
                       help="Agent type (auto-selects task and model)")

    # Option 2: Use --task directly (includes P3 parallel sub-tasks)
    parser.add_argument("--task",
                       choices=[
                           "write-tests",           # P2 RED
                           "implement",             # P3 GREEN (all-in-one)
                           "implement-services",    # P3a: Services/Types/Validation
                           "implement-routes",      # P3b: API Routes
                           "implement-components",  # P3c: React Components
                           "implement-pages",       # P3d: Pages/Hooks
                           "refactor",              # P4 REFACTOR
                           "review",                # P5 Code Review
                           "document"               # P7 Docs
                       ],
                       help="Task type (if not using --agent). P3 can be split: implement-services, implement-routes, implement-components, implement-pages")

    parser.add_argument("--story", required=True, help="Story ID (e.g., 01.2)")
    parser.add_argument("--context", required=True,
                       help="Comma-separated context file paths")
    parser.add_argument("--model", help="GLM model to use (auto-selected if using --agent)")
    parser.add_argument("--output-json", action="store_true",
                       help="Output raw JSON (for agent parsing)")
    parser.add_argument("--output-file", "-o",
                       help="Save full output to file (reduces Claude context usage)")
    parser.add_argument("--auto-write", action="store_true",
                       help="Automatically write generated files to disk (bypasses Claude context)")
    parser.add_argument("--base-dir",
                       help="Base directory for --auto-write (default: current dir)",
                       default=".")

    args = parser.parse_args()

    # Resolve task and model from agent if provided
    if args.agent:
        args.task = AGENT_TO_TASK.get(args.agent, "implement")
        if not args.model:
            args.model = AGENT_TO_MODEL.get(args.agent, "glm-4.7")
    elif not args.task:
        parser.error("Either --agent or --task is required")

    if not args.model:
        args.model = "glm-4.7"

    # Load GLM API key from environment (preferred) or config (fallback)
    api_key = os.getenv("ZHIPU_API_KEY")

    if not api_key:
        # Fallback to config.json (deprecated)
        config_path = Path(__file__).parent.parent / "config.json"
        if config_path.exists():
            with open(config_path) as f:
                config = json.load(f)
                api_key = config.get("zhipu_api_key")

    if not api_key:
        print(json.dumps({"error": "GLM API key not found. Set ZHIPU_API_KEY env var"}))
        return 0  # Don't crash, return error in JSON

    # Parse context files
    context_files = [f.strip() for f in args.context.split(',') if f.strip()]

    # Build prompt
    template = TASK_TEMPLATES[args.task]
    context_summary = load_context_files(context_files)

    prompt = template.format(
        story_id=args.story,
        context_summary=context_summary,
        tech_stack=TECH_STACK_INFO
    )

    # Call GLM
    print(f"[GLM WRAPPER] Task: {args.task} | Story: {args.story} | Model: {args.model}",
          file=sys.stderr)
    print(f"[GLM WRAPPER] Context files: {len(context_files)}", file=sys.stderr)

    client = GLMClient(api_key)
    result = client.call(
        prompt=prompt,
        context_files=context_files,
        model=args.model,
        temperature=0.7,
        max_tokens=16000  # Increased for large code responses
    )

    # Wrap all processing in try/except to prevent crashes
    try:
        if "error" in result and result.get("error"):
            # FALLBACK: If GLM fails, try Claude Haiku (NOT Opus - too expensive for docs!)
            print(f"[GLM WRAPPER] GLM error: {result['error']}", file=sys.stderr)
            print(f"[GLM WRAPPER] FALLBACK: Trying Claude Haiku...", file=sys.stderr)

            try:
                import subprocess
                # Call claude with haiku model
                haiku_result = subprocess.run(
                    ["claude", "--model", "haiku", "--print", prompt[:4000]],  # Truncate for CLI
                    capture_output=True,
                    text=True,
                    timeout=120,
                    cwd=str(Path(__file__).parent.parent.parent.parent)
                )
                if haiku_result.returncode == 0:
                    output = {
                        "success": True,
                        "data": {"raw_response": haiku_result.stdout},
                        "tokens": 0,  # Unknown for CLI
                        "model": "claude-haiku-fallback",
                        "fallback": True
                    }
                    print(f"[GLM WRAPPER] Haiku fallback SUCCESS", file=sys.stderr)
                else:
                    output = {"error": result["error"], "success": False, "fallback_failed": True}
            except Exception as fallback_error:
                print(f"[GLM WRAPPER] Haiku fallback also failed: {fallback_error}", file=sys.stderr)
                output = {"error": result["error"], "success": False, "fallback_error": str(fallback_error)}
        else:
            # Parse JSON response from GLM
            response_text = result.get("response", "")

            # Handle None response
            if response_text is None:
                output = {
                    "success": False,
                    "error": "GLM returned empty response",
                    "data": {}
                }
            else:
                try:
                    # GLM should return JSON, but might wrap it in markdown
                    # Extract JSON from markdown code blocks if present
                    if "```json" in response_text:
                        start = response_text.index("```json") + 7
                        try:
                            end = response_text.index("```", start)
                            json_text = response_text[start:end].strip()
                        except ValueError:
                            # No closing ``` - take rest of text
                            json_text = response_text[start:].strip()
                    elif "```" in response_text:
                        start = response_text.index("```") + 3
                        try:
                            end = response_text.index("```", start)
                            json_text = response_text[start:end].strip()
                        except ValueError:
                            json_text = response_text[start:].strip()
                    else:
                        # Try to find JSON object in text
                        json_start = response_text.find('{')
                        json_end = response_text.rfind('}') + 1
                        if json_start >= 0 and json_end > json_start:
                            json_text = response_text[json_start:json_end]
                        else:
                            json_text = response_text.strip()

                    parsed = json.loads(json_text)
                    output = {
                        "success": True,
                        "data": parsed,
                        "tokens": result.get("usage", {}).get("total_tokens", 0),
                        "model": result.get("model", "unknown")
                    }
                except json.JSONDecodeError as e:
                    # GLM didn't return valid JSON - return raw text
                    output = {
                        "success": True,
                        "data": {"raw_response": response_text},
                        "tokens": result.get("usage", {}).get("total_tokens", 0),
                        "model": result.get("model", "unknown"),
                        "warning": f"GLM response wasn't valid JSON: {e}"
                    }
    except Exception as e:
        # Catch-all for any unexpected errors
        print(f"[GLM WRAPPER] Unexpected error: {e}", file=sys.stderr)
        output = {
            "success": False,
            "error": f"Wrapper processing error: {str(e)}",
            "data": {}
        }

    # AUTO-WRITE: Write files directly to disk, bypassing Claude context
    write_result = None
    if args.auto_write and output.get("success"):
        files = output.get("data", {}).get("files", [])
        if files:
            print(f"[GLM WRAPPER] Auto-writing {len(files)} files to {args.base_dir}...", file=sys.stderr)
            write_result = write_files_to_disk(files, args.base_dir)

            # Remove file contents from output (no longer needed - already on disk)
            # Keep only paths for reference
            output["data"]["files"] = [
                {"path": f.get("path"), "written": True}
                for f in files
            ]
            output["write_result"] = write_result

    # Output - wrap in try/except to never crash
    try:
        # If --auto-write was used, print only summary (files already on disk)
        if args.auto_write:
            summary = output.get("data", {}).get("summary", "No summary")
            print(f"\n[GLM] AUTO-WRITE COMPLETE")
            print(f"  Success: {output.get('success')}")
            print(f"  Model: {output.get('model', 'unknown')}")
            print(f"  Tokens: {output.get('tokens', 0)}")
            if write_result:
                print(f"  Files written: {write_result['total_written']}")
                print(f"  Errors: {write_result['total_errors']}")
                for f in write_result.get("written", []):
                    print(f"    - {f['path']} ({f['lines']} lines)")
                for e in write_result.get("errors", []):
                    print(f"    [ERR] {e.get('path')}: {e.get('error')}")
            print(f"  Summary: {summary[:300]}")

            # Optionally save full JSON to file for debugging
            if args.output_file:
                json_output = json.dumps(output, indent=2, ensure_ascii=False)
                with open(args.output_file, 'w', encoding='utf-8') as f:
                    f.write(json_output)
                print(f"  Debug JSON: {args.output_file}")

        elif args.output_file:
            json_output = json.dumps(output, indent=2, ensure_ascii=False)
            with open(args.output_file, 'w', encoding='utf-8') as f:
                f.write(json_output)

            # Print SHORT summary to stdout (saves Claude context)
            files_count = len(output.get("data", {}).get("files", []))
            summary = output.get("data", {}).get("summary", "No summary")
            print(f"[GLM] OK - saved to {args.output_file}")
            print(f"  Success: {output.get('success')}")
            print(f"  Files: {files_count}")
            print(f"  Tokens: {output.get('tokens', 0)}")
            print(f"  Summary: {summary[:200]}")

        elif args.output_json:
            json_output = json.dumps(output, indent=2, ensure_ascii=False)
            print(json_output)

        else:
            # Human-readable output for debugging
            if output.get("success"):
                print(f"\n[OK] GLM-{args.model} completed successfully")
                print(f"  Tokens: {output.get('tokens', 0)}")
                if "files" in output.get("data", {}):
                    print(f"  Files generated: {len(output['data']['files'])}")
                print(f"\n{json.dumps(output['data'], indent=2, ensure_ascii=False)}")
            else:
                print(f"\n[ERROR] GLM call failed: {output.get('error')}")
    except Exception as e:
        print(f"[GLM WRAPPER] Output error: {e}", file=sys.stderr)
        print(json.dumps({"success": False, "error": str(e)}))

    # ALWAYS return 0 - success/failure is in JSON output
    # This prevents Claude from seeing exit code 1 as script failure
    return 0


if __name__ == "__main__":
    main()  # Don't use sys.exit() - just run main()
