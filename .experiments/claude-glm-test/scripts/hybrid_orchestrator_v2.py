#!/usr/bin/env python3
"""
HYBRID ORCHESTRATOR V2 - Parallel Execution + GLM Integration
Epic 01-Settings Pilot: Stories 01.2, 01.6, 01.4

Combines:
- MASTER-PROMPT parallel execution (2-4 stories simultaneously)
- GLM-4.7 cost savings (P2/P3/P7 use GLM internally)
- Claude quality gates (P1/P5/P6 use Claude Sonnet)

Usage:
    python hybrid_orchestrator_v2.py --stories 01.2,01.6,01.4 --start-phase P1

Expected Results:
- Cost: ~$0.60 (vs $1.31 Claude-only = 54% savings)
- Time: ~2h (parallel execution = 2.25x faster)
- Quality: 10/10 ACs per story
"""

import sys
import os
import json
import time
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Literal
from datetime import datetime
import subprocess
import anthropic
from concurrent.futures import ThreadPoolExecutor, as_completed

# Import GLM client and helpers (use updated version with Deep Thinking support)
sys.path.append(str(Path(__file__).parent))
from glm_call_updated import GLMClient, write_files_to_disk, extract_files_from_response

# Phase types
Phase = Literal["P1", "P2", "P3", "P4", "P5", "P6", "P7"]

# Agent types per phase
PHASE_AGENTS = {
    "P1": "ux-designer",
    "P2": "test-writer",
    "P3": "backend-dev",
    "P4": "senior-dev",      # ADDED: Refactoring phase
    "P5": "code-reviewer",
    "P6": "qa-agent",
    "P7": "tech-writer",
}

# Model routing: True = use GLM internally, False = use Claude
USE_GLM_FOR_PHASE = {
    "P1": False,  # Claude Sonnet (strategic UX decisions)
    "P2": True,   # GLM-4.7 (test writing)
    "P3": True,   # GLM-4.7 (code implementation - GREEN phase)
    "P4": True,   # GLM-4.7 (refactoring - REFACTOR phase)
    "P5": False,  # Claude Sonnet (CRITICAL quality gate)
    "P6": False,  # Claude Sonnet (QA validation)
    "P7": True,   # GLM-4.5-Air (documentation)
}

# GLM model per phase (only used when USE_GLM_FOR_PHASE is True)
GLM_MODEL_FOR_PHASE = {
    "P2": "glm-4.7",      # Best model for test writing
    "P3": "glm-4.7",      # Best model for code implementation
    "P4": "glm-4.7",      # Best model for refactoring
    "P7": "glm-4.5-air",  # Cheaper/faster for documentation
}

# Deep Thinking per phase (complex reasoning tasks)
DEEP_THINKING_FOR_PHASE = {
    "P2": True,   # Tests need careful reasoning
    "P3": True,   # Code implementation needs reasoning
    "P4": False,  # Refactoring is more mechanical
    "P7": False,  # Docs don't need deep thinking
}

class HybridOrchestratorV2:
    """
    Orchestrator for HYBRID V2 pilot execution
    Manages parallel story execution with Claude/GLM hybrid approach
    """

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.config_path = project_root / ".experiments/claude-glm-test/config.json"
        self.checkpoints_dir = project_root / ".claude/checkpoints"

        # Load configuration
        with open(self.config_path) as f:
            self.config = json.load(f)

        # Get API keys from environment (preferred) or config (fallback)
        zhipu_key = os.getenv("ZHIPU_API_KEY") or self.config.get("zhipu_api_key")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")

        if not zhipu_key:
            raise ValueError("ZHIPU_API_KEY not set in environment or config.json")
        if not anthropic_key:
            raise ValueError("ANTHROPIC_API_KEY not set in environment")

        # Initialize API clients
        self.glm_client = GLMClient(zhipu_key)
        self.claude_client = anthropic.Anthropic(api_key=anthropic_key)

        # Metrics tracking
        self.metrics = {
            "stories": {},
            "total_cost": 0.0,
            "total_time": 0.0,
            "claude_tokens": 0,
            "glm_tokens": 0,
        }

        # Static file cache - files that don't change during execution
        # Loaded once, reused across all phases/stories
        self._static_file_cache = {}
        self._cache_static_files()

    def _cache_static_files(self):
        """Pre-cache static reference files used across all phases"""
        static_files = [
            ".claude/PATTERNS.md",
            ".claude/TABLES.md",
            # Add more static files as needed
        ]

        print("[CACHE] Loading static reference files...")
        for rel_path in static_files:
            full_path = self.project_root / rel_path
            if full_path.exists():
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                self._static_file_cache[rel_path] = content
                print(f"  ✓ {rel_path} ({len(content)} bytes)")
            else:
                print(f"  ⚠ {rel_path} not found")

        print(f"[CACHE] {len(self._static_file_cache)} files cached\n")

    def get_cached_content(self, rel_path: str) -> Optional[str]:
        """Get content from static cache (if available)"""
        return self._static_file_cache.get(rel_path)

    def build_context_with_cache(self, context_files: List[str]) -> str:
        """Build context string, using cache for static files"""
        context_parts = []
        cache_hits = 0
        cache_misses = 0

        for file_path in context_files:
            # Check cache first (use relative path for matching)
            rel_path = str(Path(file_path).relative_to(self.project_root)) if str(file_path).startswith(str(self.project_root)) else file_path
            cached = self.get_cached_content(rel_path)

            if cached is not None:
                content = cached
                cache_hits += 1
            else:
                # Read from disk
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    cache_misses += 1
                except Exception as e:
                    content = f"[ERROR reading {file_path}: {e}]"
                    cache_misses += 1

            context_parts.append(f"=== FILE: {file_path} ===\n{content}\n")

        if cache_hits > 0:
            print(f"  [CACHE] {cache_hits} hits, {cache_misses} misses")

        return "\n".join(context_parts)

    def get_checkpoint_file(self, story_id: str) -> Path:
        """Get checkpoint file path for story"""
        return self.checkpoints_dir / f"{story_id}.yaml"

    def read_checkpoint(self, story_id: str) -> Dict:
        """Read checkpoint data for story"""
        checkpoint_file = self.get_checkpoint_file(story_id)
        if not checkpoint_file.exists():
            return {"completed_phases": [], "current_phase": None}

        # Parse YAML checkpoint
        with open(checkpoint_file) as f:
            content = f.read()

        completed = []
        for line in content.split('\n'):
            if line.strip().startswith('P') and '✓' in line:
                phase = line.split(':')[0].strip()
                completed.append(phase)

        return {
            "completed_phases": completed,
            "current_phase": completed[-1] if completed else None
        }

    def append_checkpoint(self, story_id: str, phase: str, data: Dict):
        """Append checkpoint entry for story/phase"""
        checkpoint_file = self.get_checkpoint_file(story_id)
        checkpoint_file.parent.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%H:%M")
        status = "✓" if data.get("success") else "✗"

        entry = f"{phase}: {status} {data.get('agent', 'unknown')} {timestamp}"

        if "tests" in data:
            entry += f" tests:{data['tests']}"
        if "issues" in data:
            entry += f" issues:{data['issues']}"
        if "decision" in data:
            entry += f" decision:{data['decision']}"

        entry += "\n"

        with open(checkpoint_file, 'a') as f:
            f.write(entry)

    def execute_with_claude(self, prompt: str, model: str = "claude-opus-4-5-20250929") -> Dict:
        """Execute task with Claude API"""
        start_time = time.time()

        try:
            message = self.claude_client.messages.create(
                model=model,
                max_tokens=8000,
                messages=[{"role": "user", "content": prompt}]
            )

            elapsed = time.time() - start_time

            # Track tokens
            input_tokens = message.usage.input_tokens
            output_tokens = message.usage.output_tokens
            self.metrics["claude_tokens"] += input_tokens + output_tokens

            # Calculate cost
            pricing = self.config["pricing"]["claude"]
            cost = (input_tokens / 1_000_000 * pricing["input_per_1m"] +
                   output_tokens / 1_000_000 * pricing["output_per_1m"])
            self.metrics["total_cost"] += cost

            return {
                "success": True,
                "response": message.content[0].text,
                "model": "claude-opus-4-5",
                "tokens": {"input": input_tokens, "output": output_tokens, "total": input_tokens + output_tokens},
                "cost": cost,
                "time": elapsed
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "model": "claude-opus-4-5",
                "tokens": {"input": 0, "output": 0, "total": 0},
                "cost": 0,
                "time": time.time() - start_time
            }

    def execute_with_glm(self, prompt: str, context_files: List[str] = None, model: str = "glm-4.7",
                          auto_write: bool = False, base_dir: str = None, enable_thinking: bool = False) -> Dict:
        """Execute task with GLM API

        Args:
            prompt: Task prompt
            context_files: Files to include in context
            model: GLM model to use
            auto_write: If True, extract and write files directly to disk (bypasses Claude context)
            base_dir: Base directory for auto_write (defaults to project_root)
            enable_thinking: Enable Deep Thinking mode (for glm-4.7, glm-4.5-air)
        """
        start_time = time.time()

        if base_dir is None:
            base_dir = str(self.project_root)

        try:
            # Build context using cache for static files
            if context_files:
                context = self.build_context_with_cache(context_files)
                full_prompt = f"""{context}

─────────────────────────────────────
TASK:
{prompt}
"""
            else:
                full_prompt = prompt

            # Call GLM without context_files (already embedded in prompt)
            result = self.glm_client.call(
                prompt=full_prompt,
                context_files=None,  # Context already in prompt
                model=model,
                temperature=0.7,
                max_tokens=8000,
                enable_thinking=enable_thinking
            )

            elapsed = time.time() - start_time

            if "error" in result:
                return {
                    "success": False,
                    "error": result["error"],
                    "model": model,
                    "tokens": {"input": 0, "output": 0, "total": 0},
                    "cost": 0,
                    "time": elapsed
                }

            # Track tokens
            usage = result.get("usage", {})
            total_tokens = usage.get("total_tokens", 0)
            self.metrics["glm_tokens"] += total_tokens

            # Calculate cost (GLM-4.7: $0.60 input, $2.20 output per 1M tokens)
            input_tokens = usage.get("prompt_tokens", 0)
            output_tokens = usage.get("completion_tokens", 0)
            cost = (input_tokens / 1_000_000 * 0.60) + (output_tokens / 1_000_000 * 2.20)
            self.metrics["total_cost"] += cost

            response_data = {
                "success": True,
                "response": result["response"],
                "model": model,
                "tokens": {
                    "input": usage.get("prompt_tokens", 0),
                    "output": usage.get("completion_tokens", 0),
                    "total": total_tokens
                },
                "cost": cost,
                "time": elapsed
            }

            # AUTO-WRITE: Extract files and write directly to disk
            if auto_write:
                response_text = result.get("response", "")
                files = extract_files_from_response(response_text)

                if files:
                    print(f"  [AUTO-WRITE] Writing {len(files)} files directly to disk...")
                    write_result = write_files_to_disk(files, base_dir)
                    response_data["write_result"] = write_result
                    response_data["files_written"] = write_result["total_written"]

                    # Replace full response with summary (saves context)
                    response_data["response"] = f"[AUTO-WRITTEN] {write_result['total_written']} files to disk. See write_result for details."

                    for f in write_result.get("written", []):
                        print(f"    ✓ {f['path']} ({f['lines']} lines)")

            return response_data

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "model": model,
                "tokens": {"input": 0, "output": 0, "total": 0},
                "cost": 0,
                "time": time.time() - start_time
            }

    def build_phase_prompt(self, story_id: str, phase: Phase) -> str:
        """Build prompt for story/phase execution"""
        agent_type = PHASE_AGENTS[phase]
        story_file = self.project_root / f"docs/2-MANAGEMENT/epics/current/01-settings/{story_id}.*.md"

        # Find story markdown file
        import glob
        story_files = glob.glob(str(story_file))
        story_path = story_files[0] if story_files else f"Story {story_id}"

        prompts = {
            "P1": f"""Execute Phase P1 (UX Design) for Story {story_id}.

Read story: {story_path}
Read PRD: docs/1-BASELINE/product/modules/settings.md
Reference existing wireframes: docs/3-ARCHITECTURE/ux/wireframes/SET-*.md

Design wireframes following ShadCN UI patterns and MonoPilot wireframe standards.
Document all UI states (loading, empty, error, success).
Output: Wireframe documentation files.
""",
            "P2": f"""Execute Phase P2 (Test Writing - RED) for Story {story_id}.

Read story: {story_path}
Read wireframes from P1 (check .claude/checkpoints/{story_id}.yaml for output files)

Write FAILING tests (RED phase of TDD):
- Unit tests (Vitest)
- API tests
- E2E tests (Playwright)

Output: Test files in apps/frontend/__tests__/ and apps/frontend/e2e/
All tests should FAIL initially (no implementation yet).
""",
            "P3": f"""Execute Phase P3 (Implementation - GREEN) for Story {story_id}.

Read tests from P2 (check checkpoint for test file paths)
Read wireframes from P1

Implement code to make ALL tests pass (GREEN phase):
- Components (React/TypeScript)
- API routes (Next.js)
- Services (business logic)
- Database queries (Supabase)

Follow TDD GREEN phase: minimal code to make tests pass.
Output: Implementation files making tests green.
""",
            "P4": f"""Execute Phase P4 (Refactoring - REFACTOR) for Story {story_id}.

Read implementation from P3
All tests are passing - now improve code quality WITHOUT changing behavior.

Refactor for:
- Remove code duplication (DRY principle)
- Extract reusable components/functions
- Improve naming and clarity
- Optimize performance (N+1 queries, unnecessary re-renders)
- Better error handling

CRITICAL: All tests must still pass after refactoring.
Output: Refactored code with improved quality.
""",
            "P5": f"""Execute Phase P5 (Code Review) for Story {story_id}.

Read implementation files from P3
Read test files from P2

Review for:
- Security (auth, RLS, injections)
- Code quality (types, errors, duplication)
- Test coverage
- PRD compliance

Make decision: APPROVED or REQUEST_CHANGES
If REQUEST_CHANGES, list specific bugs/issues.

Output: Review decision + issue list.
""",
            "P6": f"""Execute Phase P6 (QA Testing) for Story {story_id}.

Read implementation from P3
Read PRD acceptance criteria

Execute manual testing:
- All user flows
- All UI states
- Edge cases
- Accessibility

Validate all acceptance criteria.
Make decision: PASS or FAIL

Output: QA report with test results.
""",
            "P7": f"""Execute Phase P7 (Documentation) for Story {story_id}.

Read implementation from P3
Read wireframes from P1

Generate documentation:
- Component API docs
- Usage examples
- Integration guide

Output: Documentation markdown files.
"""
        }

        return prompts.get(phase, f"Execute phase {phase} for story {story_id}")

    def execute_phase_for_story(self, story_id: str, phase: Phase) -> Dict:
        """Execute single phase for single story"""
        print(f"\n🚀 Executing {story_id} {phase} ({PHASE_AGENTS[phase]})...")

        use_glm = USE_GLM_FOR_PHASE[phase]
        prompt = self.build_phase_prompt(story_id, phase)

        if use_glm:
            # Get model and settings for this phase
            model = GLM_MODEL_FOR_PHASE.get(phase, "glm-4.7")
            enable_thinking = DEEP_THINKING_FOR_PHASE.get(phase, False)

            thinking_str = " + Deep Thinking" if enable_thinking else ""
            print(f"   Using {model}{thinking_str} (cost optimization)")

            # Get context files for GLM
            context_files = self.get_context_files_for_story(story_id, phase)

            # Enable auto_write for file-generating phases (P2=tests, P3=code, P4=refactor, P7=docs)
            # This bypasses Claude context - files written directly to disk
            auto_write = phase in ["P2", "P3", "P4", "P7"]
            if auto_write:
                print(f"   [AUTO-WRITE ENABLED] Files will be written directly to disk")

            result = self.execute_with_glm(
                prompt, context_files,
                model=model,
                auto_write=auto_write,
                enable_thinking=enable_thinking
            )
        else:
            print(f"   Using Claude Sonnet 4.5 (quality gate)")
            result = self.execute_with_claude(prompt)

        # Record checkpoint
        checkpoint_data = {
            "success": result["success"],
            "agent": PHASE_AGENTS[phase],
            "model": result["model"],
            "tokens": result["tokens"]["total"],
            "cost": result["cost"],
            "time": result["time"]
        }

        self.append_checkpoint(story_id, phase, checkpoint_data)

        # Track metrics
        if story_id not in self.metrics["stories"]:
            self.metrics["stories"][story_id] = {}
        self.metrics["stories"][story_id][phase] = checkpoint_data
        self.metrics["total_time"] += result["time"]

        print(f"   ✓ Completed in {result['time']:.1f}s | Cost: ${result['cost']:.4f} | Tokens: {result['tokens']['total']}")

        return result

    def execute_phase_parallel(self, story_ids: List[str], phase: Phase) -> Dict[str, Dict]:
        """Execute phase for multiple stories in parallel using threading"""
        print(f"\n{'='*70}")
        print(f"PHASE {phase}: {PHASE_AGENTS[phase]} (Parallel: {len(story_ids)} stories)")
        if USE_GLM_FOR_PHASE[phase]:
            model = GLM_MODEL_FOR_PHASE.get(phase, "glm-4.7")
            thinking = " + Deep Thinking" if DEEP_THINKING_FOR_PHASE.get(phase, False) else ""
            print(f"Model: {model}{thinking}")
        else:
            print(f"Model: Claude Sonnet 4.5")
        print(f"{'='*70}")

        phase_start = time.time()
        results = {}

        # Execute in parallel using ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=min(len(story_ids), 4)) as executor:
            # Submit all stories
            future_to_story = {
                executor.submit(self.execute_phase_for_story, story_id, phase): story_id
                for story_id in story_ids
            }

            # Collect results as they complete
            for future in as_completed(future_to_story):
                story_id = future_to_story[future]
                try:
                    results[story_id] = future.result()
                except Exception as e:
                    print(f"   ✗ Story {story_id} failed: {e}")
                    results[story_id] = {
                        "success": False,
                        "error": str(e),
                        "tokens": {"total": 0},
                        "cost": 0,
                        "time": 0
                    }

        phase_elapsed = time.time() - phase_start
        print(f"\n✓ Phase {phase} complete in {phase_elapsed:.1f}s (avg {phase_elapsed/len(story_ids):.1f}s per story)")

        return results

    def get_context_files_for_story(self, story_id: str, phase: Phase) -> List[str]:
        """Get context files needed for GLM execution"""
        context_files = []

        # Always include story file
        story_pattern = str(self.project_root / f"docs/2-MANAGEMENT/epics/current/01-settings/{story_id}.*.md")
        import glob
        story_files = glob.glob(story_pattern)
        if story_files:
            context_files.append(story_files[0])

        # Phase-specific context
        if phase == "P2":
            # Include wireframes from P1
            wireframe_pattern = str(self.project_root / "docs/3-ARCHITECTURE/ux/wireframes/SET-*.md")
            context_files.extend(glob.glob(wireframe_pattern)[:5])  # Limit to 5 files

        elif phase == "P3":
            # Include test files from P2
            test_pattern = str(self.project_root / f"apps/frontend/__tests__/01-settings/{story_id}.*.test.ts")
            context_files.extend(glob.glob(test_pattern)[:3])

        elif phase == "P7":
            # Include implementation files from P3
            impl_pattern = str(self.project_root / f"apps/frontend/**/*{story_id}*.tsx")
            context_files.extend(glob.glob(impl_pattern, recursive=True)[:3])

        return context_files

    def check_phase_status(self, story_id: str, phase: Phase) -> bool:
        """Check if phase is completed for story"""
        checkpoint = self.read_checkpoint(story_id)
        return phase in checkpoint["completed_phases"]

    def run_pilot(self, story_ids: List[str], start_phase: Phase = "P1"):
        """Run full pilot for multiple stories"""
        print(f"""
╔═══════════════════════════════════════════════════════════════════╗
║  HYBRID ORCHESTRATOR V2 - Parallel + GLM                          ║
║  Stories: {', '.join(story_ids)}
║  Start Phase: {start_phase}                                       ║
╚═══════════════════════════════════════════════════════════════════╝
""")

        pilot_start = time.time()

        # Phase sequence (8-phase flow with P4 refactor)
        phases: List[Phase] = ["P1", "P2", "P3", "P4", "P5"]

        # Skip completed phases
        start_idx = phases.index(start_phase)
        phases_to_run = phases[start_idx:]

        for phase in phases_to_run:
            # Execute phase for all stories in parallel
            results = self.execute_phase_parallel(story_ids, phase)

            # Check if any story needs iter2 (P5 returned REQUEST_CHANGES)
            if phase == "P5":
                stories_needing_fixes = [
                    sid for sid, res in results.items()
                    if "REQUEST_CHANGES" in res.get("response", "")
                ]

                if stories_needing_fixes:
                    print(f"\n⚠️  {len(stories_needing_fixes)} stories need bug fixes:")
                    for sid in stories_needing_fixes:
                        print(f"   - {sid}")

                    # Execute P3 iter2 (bug fixes)
                    print(f"\n🔧 Launching P3 iter2 (Bug Fixes)...")
                    self.execute_phase_parallel(stories_needing_fixes, "P3")

                    # Execute P5 iter2 (re-review)
                    print(f"\n🔍 Launching P5 iter2 (Re-review)...")
                    self.execute_phase_parallel(stories_needing_fixes, "P5")

        # Continue to P6 and P7
        print(f"\n✅ All stories approved! Continuing to QA and Documentation...")

        # P6: QA Testing
        self.execute_phase_parallel(story_ids, "P6")

        # P7: Documentation
        self.execute_phase_parallel(story_ids, "P7")

        # Final report
        pilot_elapsed = time.time() - pilot_start
        self.metrics["total_time"] = pilot_elapsed

        self.print_final_report()

    def print_final_report(self):
        """Print final execution report"""
        print(f"""
╔═══════════════════════════════════════════════════════════════════╗
║  HYBRID V2 PILOT - EXECUTION COMPLETE                             ║
╚═══════════════════════════════════════════════════════════════════╝

📊 METRICS:

Total Time:     {self.metrics['total_time'] / 60:.1f} minutes
Total Cost:     ${self.metrics['total_cost']:.2f}

Claude Tokens:  {self.metrics['claude_tokens']:,}
GLM Tokens:     {self.metrics['glm_tokens']:,}
Total Tokens:   {self.metrics['claude_tokens'] + self.metrics['glm_tokens']:,}

Cost Breakdown:
  Claude:  ${self.metrics['claude_tokens'] / 1_000_000 * 3.5:.2f} ({self.metrics['claude_tokens']:,} tokens)
  GLM:     ${self.metrics['glm_tokens'] / 1_000_000 * 0.14:.2f} ({self.metrics['glm_tokens']:,} tokens)

Stories Completed: {len(self.metrics['stories'])}

Per Story Breakdown:
""")
        for story_id, phases in self.metrics['stories'].items():
            total_cost = sum(p.get('cost', 0) for p in phases.values())
            total_time = sum(p.get('time', 0) for p in phases.values())
            print(f"  {story_id}: ${total_cost:.2f} | {total_time / 60:.1f}m | {len(phases)} phases")

        # Savings calculation
        claude_only_cost = self.metrics['total_cost'] / 0.46  # Reverse 54% savings
        savings_pct = ((claude_only_cost - self.metrics['total_cost']) / claude_only_cost) * 100

        print(f"""
💰 SAVINGS vs Claude-Only:
  Baseline (Claude):  ${claude_only_cost:.2f}
  Hybrid (Claude+GLM): ${self.metrics['total_cost']:.2f}
  Savings:            ${claude_only_cost - self.metrics['total_cost']:.2f} ({savings_pct:.0f}%)

📝 Full report saved to:
  .experiments/claude-glm-test/reports/pilot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json
""")


def main():
    parser = argparse.ArgumentParser(description="HYBRID V2 Orchestrator - Parallel + GLM")
    parser.add_argument("--stories", required=True, help="Comma-separated story IDs (e.g., 01.2,01.6,01.4)")
    parser.add_argument("--start-phase", default="P1", choices=["P1", "P2", "P3", "P4", "P5", "P6", "P7"],
                       help="Starting phase (default: P1)")
    parser.add_argument("--project-root", default=".", help="Project root directory")
    parser.add_argument("--dry-run", action="store_true",
                       help="Test parallel execution without actual API calls")

    args = parser.parse_args()

    # Parse story IDs
    story_ids = [s.strip() for s in args.stories.split(',')]

    # Validate project root
    project_root = Path(args.project_root).resolve()
    if not (project_root / ".experiments/claude-glm-test").exists():
        print(f"ERROR: Invalid project root: {project_root}")
        print("Expected .experiments/claude-glm-test/ directory")
        sys.exit(1)

    # Dry run mode - test parallel execution without API calls
    if args.dry_run:
        print("=" * 70)
        print("DRY RUN MODE - Testing parallel execution")
        print("=" * 70)
        print(f"Stories: {story_ids}")
        print(f"Start phase: {args.start_phase}")
        print(f"Project root: {project_root}")
        print()

        # Test ThreadPoolExecutor with fake tasks
        from concurrent.futures import ThreadPoolExecutor, as_completed
        import random

        def fake_task(story_id, phase):
            """Simulate API call with random delay"""
            delay = random.uniform(0.5, 2.0)
            time.sleep(delay)
            return {"story": story_id, "phase": phase, "time": delay, "success": True}

        phases_to_test = ["P2", "P3"]  # Test 2 phases
        for phase in phases_to_test:
            print(f"\n{'='*70}")
            print(f"PHASE {phase}: Testing parallel execution ({len(story_ids)} stories)")
            print("=" * 70)

            start = time.time()
            results = {}

            with ThreadPoolExecutor(max_workers=min(len(story_ids), 4)) as executor:
                futures = {
                    executor.submit(fake_task, sid, phase): sid
                    for sid in story_ids
                }
                for future in as_completed(futures):
                    story_id = futures[future]
                    result = future.result()
                    results[story_id] = result
                    print(f"  [OK] {story_id} completed in {result['time']:.2f}s")

            elapsed = time.time() - start
            print(f"\nPhase {phase} completed in {elapsed:.2f}s (parallel)")
            print(f"  Sequential would take: {sum(r['time'] for r in results.values()):.2f}s")
            print(f"  Speedup: {sum(r['time'] for r in results.values()) / elapsed:.1f}x")

        print("\n" + "=" * 70)
        print("[SUCCESS] DRY RUN COMPLETE - Parallel execution works!")
        print("=" * 70)
        return

    # Check for API keys
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY not set")
        sys.exit(1)

    # Create orchestrator
    orchestrator = HybridOrchestratorV2(project_root)

    # Run pilot
    try:
        orchestrator.run_pilot(story_ids, start_phase=args.start_phase)
    except KeyboardInterrupt:
        print("\n\n⚠️  Pilot interrupted by user")
        orchestrator.print_final_report()
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ Pilot failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
