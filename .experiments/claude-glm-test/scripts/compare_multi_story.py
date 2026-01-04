#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Multi-Story Results Comparator
Porównuje wyniki testów dla wielu stories (Scenario A vs B)
"""
import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Any

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')


class MultiStoryComparator:
    """Porównuje wyniki dla wielu stories"""

    def __init__(self, test_dir: Path):
        self.test_dir = test_dir

    def load_story_metrics(self, story_id: str, scenario: str) -> Dict[str, Any]:
        """Wczytaj metrics.json dla story + scenario"""
        metrics_path = self.test_dir / f"story_{story_id}" / scenario / "metrics.json"

        if not metrics_path.exists():
            return {
                "error": f"Metrics not found: {metrics_path}",
                "story_id": story_id,
                "scenario": scenario
            }

        with open(metrics_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            data['story_id'] = story_id
            data['scenario'] = scenario
            return data

    def compare_all(self, story_ids: List[str]) -> Dict[str, Any]:
        """Porównaj wszystkie stories"""
        results = {
            "stories": {},
            "totals": {
                "scenario_a": {"claude_tokens": 0, "glm_tokens": 0, "cost": 0, "iterations": 0},
                "scenario_b": {"claude_tokens": 0, "glm_tokens": 0, "cost": 0, "iterations": 0}
            }
        }

        for story_id in story_ids:
            # Load both scenarios
            scenario_a = self.load_story_metrics(story_id, "scenario_a")
            scenario_b = self.load_story_metrics(story_id, "scenario_b")

            results["stories"][story_id] = {
                "scenario_a": scenario_a,
                "scenario_b": scenario_b
            }

            # Aggregate totals
            if "error" not in scenario_a:
                results["totals"]["scenario_a"]["claude_tokens"] += scenario_a.get("claude_tokens", 0)
                results["totals"]["scenario_a"]["cost"] += scenario_a.get("cost_usd", 0)
                results["totals"]["scenario_a"]["iterations"] += scenario_a.get("iterations", 0)

            if "error" not in scenario_b:
                results["totals"]["scenario_b"]["claude_tokens"] += scenario_b.get("claude_tokens", 0)
                results["totals"]["scenario_b"]["glm_tokens"] += scenario_b.get("glm_tokens", 0)
                results["totals"]["scenario_b"]["cost"] += scenario_b.get("cost_usd", 0)
                results["totals"]["scenario_b"]["iterations"] += scenario_b.get("iterations", 0)

        # Calculate savings
        cost_a = results["totals"]["scenario_a"]["cost"]
        cost_b = results["totals"]["scenario_b"]["cost"]

        results["savings"] = {
            "cost_usd": cost_a - cost_b,
            "cost_pct": ((cost_a - cost_b) / cost_a * 100) if cost_a > 0 else 0,
            "claude_tokens": results["totals"]["scenario_a"]["claude_tokens"] - results["totals"]["scenario_b"]["claude_tokens"],
        }

        results["winner"] = "scenario_a" if cost_a < cost_b else "scenario_b"

        return results

    def print_report(self, results: Dict[str, Any], story_ids: List[str]):
        """Wydrukuj raport porównawczy"""
        print("=" * 80)
        print("  MULTI-STORY COMPARISON REPORT")
        print("=" * 80)
        print()

        # Per-story breakdown
        print("PER-STORY RESULTS:")
        print("-" * 80)

        for story_id in story_ids:
            story_data = results["stories"].get(story_id, {})
            a = story_data.get("scenario_a", {})
            b = story_data.get("scenario_b", {})

            print(f"\nStory {story_id}:")

            if "error" in a or "error" in b:
                print(f"  [!] Missing metrics - skipping")
                continue

            print(f"  Scenario A (Claude Only):")
            print(f"    Tokens:      {a.get('claude_tokens', 0):,}")
            print(f"    Cost:        ${a.get('cost_usd', 0):.3f}")
            print(f"    Iterations:  {a.get('iterations', 0)}")
            print(f"    Quality:     {a.get('quality_score', 'N/A')}")

            print(f"  Scenario B (Hybrid):")
            print(f"    Claude:      {b.get('claude_tokens', 0):,} tokens")
            print(f"    GLM:         {b.get('glm_tokens', 0):,} tokens")
            print(f"    Total:       {b.get('claude_tokens', 0) + b.get('glm_tokens', 0):,} tokens")
            print(f"    Cost:        ${b.get('cost_usd', 0):.3f}")
            print(f"    Iterations:  {b.get('iterations', 0)}")
            print(f"    Quality:     {b.get('quality_score', 'N/A')}")

            savings = a.get('cost_usd', 0) - b.get('cost_usd', 0)
            savings_pct = (savings / a.get('cost_usd', 1)) * 100
            print(f"  Savings:       ${savings:+.3f} ({savings_pct:+.1f}%)")

        # Totals
        print("\n" + "=" * 80)
        print("AGGREGATE RESULTS (All Stories):")
        print("=" * 80)

        totals_a = results["totals"]["scenario_a"]
        totals_b = results["totals"]["scenario_b"]

        print(f"\nScenario A (Claude Only):")
        print(f"  Total Tokens:    {totals_a['claude_tokens']:,}")
        print(f"  Total Cost:      ${totals_a['cost']:.3f}")
        print(f"  Avg Iterations:  {totals_a['iterations'] / len(story_ids):.1f}")

        print(f"\nScenario B (Claude + GLM Hybrid):")
        print(f"  Claude Tokens:   {totals_b['claude_tokens']:,}")
        print(f"  GLM Tokens:      {totals_b['glm_tokens']:,}")
        print(f"  Total Tokens:    {totals_b['claude_tokens'] + totals_b['glm_tokens']:,}")
        print(f"  Total Cost:      ${totals_b['cost']:.3f}")
        print(f"  Avg Iterations:  {totals_b['iterations'] / len(story_ids):.1f}")

        # Savings
        savings = results["savings"]
        print(f"\nSAVINGS (Scenario B vs A):")
        print(f"  Cost:            ${savings['cost_usd']:+.3f} ({savings['cost_pct']:+.1f}%)")
        print(f"  Claude Tokens:   {savings['claude_tokens']:+,}")

        # Winner
        winner_name = "Scenario A (Claude Only)" if results["winner"] == "scenario_a" else "Scenario B (Hybrid)"
        winner_emoji = "[A]" if results["winner"] == "scenario_a" else "[B]"
        print(f"\n{winner_emoji} WINNER: {winner_name}")
        print("=" * 80)


def main():
    test_dir = Path(__file__).parent.parent

    # Story IDs to compare
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--stories", nargs="+", default=["03.07", "02.06"])
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    story_ids = args.stories

    # Compare
    comparator = MultiStoryComparator(test_dir)
    results = comparator.compare_all(story_ids)

    # Output
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        comparator.print_report(results, story_ids)

    # Exit code
    if results["winner"] == "scenario_b":
        sys.exit(0)  # Hybrid won
    else:
        sys.exit(1)  # Claude Only won


if __name__ == "__main__":
    main()
