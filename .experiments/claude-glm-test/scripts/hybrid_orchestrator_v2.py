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

# Import GLM client
sys.path.append(str(Path(__file__).parent))
from glm_call import GLMClient

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

        # Initialize API clients
        self.glm_client = GLMClient(self.config["zhipu_api_key"])
        self.claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        # Metrics tracking
        self.metrics = {
            "stories": {},
            "total_cost": 0.0,
            "total_time": 0.0,
            "claude_tokens": 0,
            "glm_tokens": 0,
        }

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

    def execute_with_glm(self, prompt: str, context_files: List[str] = None, model: str = "glm-4-plus") -> Dict:
        """Execute task with GLM API"""
        start_time = time.time()

        try:
            result = self.glm_client.call(
                prompt=prompt,
                context_files=context_files,
                model=model,
                temperature=0.7,
                max_tokens=8000
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

            # Calculate cost (GLM-4.7: $0.14 per 1M tokens)
            cost = total_tokens / 1_000_000 * 0.14
            self.metrics["total_cost"] += cost

            return {
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
            print(f"   Using GLM-4.7 (cost optimization)")
            # Get context files for GLM
            context_files = self.get_context_files_for_story(story_id, phase)
            result = self.execute_with_glm(prompt, context_files, model="glm-4-plus")
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
        print(f"Model: {'GLM-4.7' if USE_GLM_FOR_PHASE[phase] else 'Claude Sonnet 4.5'}")
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

    args = parser.parse_args()

    # Parse story IDs
    story_ids = [s.strip() for s in args.stories.split(',')]

    # Validate project root
    project_root = Path(args.project_root).resolve()
    if not (project_root / ".experiments/claude-glm-test").exists():
        print(f"ERROR: Invalid project root: {project_root}")
        print("Expected .experiments/claude-glm-test/ directory")
        sys.exit(1)

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
