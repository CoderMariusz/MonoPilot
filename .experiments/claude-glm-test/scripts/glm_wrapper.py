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
from glm_call import GLMClient

# Task templates for different agent types
TASK_TEMPLATES = {
    "write-tests": """You are a test-writer agent for Story {story_id}.

Context files provided:
{context_summary}

Task: Write comprehensive FAILING tests (TDD RED phase) for this story.

Requirements:
- Unit tests using Vitest
- API tests for endpoints
- E2E tests using Playwright
- All tests should initially FAIL (no implementation exists)
- Follow MonoPilot test patterns
- Use TypeScript

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

Context files provided:
{context_summary}

Task: Implement code to make ALL FAILING tests pass (TDD GREEN phase).

Requirements:
- Read test files to understand requirements
- Implement minimal code to pass tests
- Use Next.js 15.5, React 19, TypeScript
- Follow Supabase patterns (RLS, org_id filtering)
- Implement API routes, services, components

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

    "review": """You are a code-reviewer agent for Story {story_id}.

Context files provided:
{context_summary}

Task: Review implementation for quality and security.

Check for:
- Security vulnerabilities (auth, RLS, injections)
- Code quality (TypeScript types, error handling)
- Test coverage
- PRD compliance

Output as JSON:
{{
  "decision": "APPROVED" or "REQUEST_CHANGES",
  "issues": [
    {{"severity": "CRITICAL", "description": "..."}},
    ...
  ],
  "test_results": {{"passing": X, "failing": Y}},
  "summary": "Review complete. X issues found."
}}
""",

    "document": """You are a tech-writer agent for Story {story_id}.

Context files provided:
{context_summary}

Task: Write technical documentation for the implemented feature.

Requirements:
- Component API documentation
- Usage examples with code
- Integration guide
- All code examples must be tested

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

Context files provided:
{context_summary}

Task: Refactor the implementation (TDD REFACTOR phase).

All tests are passing. Improve code quality WITHOUT changing behavior.

Refactor for:
- Remove code duplication (DRY principle)
- Extract reusable components/functions
- Improve naming and clarity
- Optimize performance (N+1 queries, unnecessary re-renders)
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
  "summary": "Refactored X files. Code quality improvements: Y"
}}
"""
}

# Agent type → task mapping
AGENT_TO_TASK = {
    "test-writer": "write-tests",
    "backend-dev": "implement",
    "frontend-dev": "implement",
    "senior-dev": "refactor",  # P4 Refactor
    "code-reviewer": "review",
    "tech-writer": "document",
}

# Model selection per agent
AGENT_TO_MODEL = {
    "test-writer": "glm-4-plus",    # GLM-4.7 equivalent
    "backend-dev": "glm-4-plus",
    "frontend-dev": "glm-4-plus",
    "senior-dev": "glm-4-plus",
    "tech-writer": "glm-4-air",     # Lighter model for docs
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
                       choices=["test-writer", "backend-dev", "frontend-dev", "senior-dev", "tech-writer"],
                       help="Agent type (auto-selects task and model)")

    # Option 2: Use --task directly
    parser.add_argument("--task",
                       choices=["write-tests", "implement", "refactor", "review", "document"],
                       help="Task type (if not using --agent)")

    parser.add_argument("--story", required=True, help="Story ID (e.g., 01.2)")
    parser.add_argument("--context", required=True,
                       help="Comma-separated context file paths")
    parser.add_argument("--model", help="GLM model to use (auto-selected if using --agent)")
    parser.add_argument("--output-json", action="store_true",
                       help="Output raw JSON (for agent parsing)")

    args = parser.parse_args()

    # Resolve task and model from agent if provided
    if args.agent:
        args.task = AGENT_TO_TASK.get(args.agent, "implement")
        if not args.model:
            args.model = AGENT_TO_MODEL.get(args.agent, "glm-4-plus")
    elif not args.task:
        parser.error("Either --agent or --task is required")

    if not args.model:
        args.model = "glm-4-plus"

    # Load GLM API key
    config_path = Path(__file__).parent.parent / "config.json"
    with open(config_path) as f:
        config = json.load(f)

    api_key = config.get("zhipu_api_key")
    if not api_key:
        print(json.dumps({"error": "GLM API key not found"}))
        sys.exit(1)

    # Parse context files
    context_files = [f.strip() for f in args.context.split(',') if f.strip()]

    # Build prompt
    template = TASK_TEMPLATES[args.task]
    context_summary = load_context_files(context_files)

    prompt = template.format(
        story_id=args.story,
        context_summary=context_summary
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
        max_tokens=8000
    )

    if "error" in result:
        output = {"error": result["error"], "success": False}
    else:
        # Parse JSON response from GLM
        try:
            # GLM should return JSON, but might wrap it in markdown
            response_text = result["response"]

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
                "tokens": result["usage"].get("total_tokens", 0),
                "model": result["model"]
            }
        except json.JSONDecodeError as e:
            # GLM didn't return valid JSON - return raw text
            output = {
                "success": True,
                "data": {"raw_response": result["response"]},
                "tokens": result["usage"].get("total_tokens", 0),
                "model": result["model"],
                "warning": f"GLM response wasn't valid JSON: {e}"
            }

    # Output
    if args.output_json:
        print(json.dumps(output, indent=2, ensure_ascii=False))
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

    return 0 if output.get("success") else 1


if __name__ == "__main__":
    sys.exit(main())
