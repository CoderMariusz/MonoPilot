#!/usr/bin/env python3
"""
Before/After Comparison for Hybrid AI Deployment

Compares quality metrics before hybrid deployment (Claude-only baseline)
vs after hybrid deployment (Claude+GLM) to validate no quality loss.

Usage:
    python compare_before_after.py --before story_03.2/scenario_a --after story_03.2/scenario_b
    python compare_before_after.py --batch stories_03.2,03.4,03.5
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List
import statistics

class BeforeAfterComparison:
    """Compare quality metrics before and after hybrid deployment"""

    def __init__(self, base_path: str = ".experiments/claude-glm-test"):
        self.base_path = Path(base_path)

    def load_metrics(self, story_path: str) -> Dict:
        """Load metrics from story/scenario path"""

        metrics_file = self.base_path / story_path / "metrics.json"

        if not metrics_file.exists():
            raise FileNotFoundError(f"Metrics not found: {metrics_file}")

        with open(metrics_file) as f:
            return json.load(f)

    def compare_stories(
        self,
        before_path: str,
        after_path: str
    ) -> Dict:
        """Compare metrics between two stories/scenarios"""

        before = self.load_metrics(before_path)
        after = self.load_metrics(after_path)

        comparison = {
            "before": {
                "story": before.get("story_id"),
                "scenario": before.get("scenario_name"),
                "cost": before.get("cost_usd", {}).get("total", 0)
            },
            "after": {
                "story": after.get("story_id"),
                "scenario": after.get("scenario_name"),
                "cost": after.get("cost_usd", {}).get("total", 0)
            },
            "quality_changes": {},
            "cost_changes": {},
            "verdict": {}
        }

        # Extract quality metrics
        before_quality = {
            "ac_pass_rate": self._extract_ac_pass_rate(before),
            "test_pass_rate": self._extract_test_pass_rate(before),
            "code_quality_score": self._extract_quality_score(before),
            "bugs": before.get("bugs", {}).get("total_bugs_lifecycle", 0),
            "iterations": before.get("iterations", 0),
            "production_ready": before.get("quality_metrics", {}).get("production_ready", False)
        }

        after_quality = {
            "ac_pass_rate": self._extract_ac_pass_rate(after),
            "test_pass_rate": self._extract_test_pass_rate(after),
            "code_quality_score": self._extract_quality_score(after),
            "bugs": after.get("bugs", {}).get("total_bugs_lifecycle", 0),
            "iterations": after.get("iterations", 0),
            "production_ready": after.get("quality_metrics", {}).get("production_ready", False)
        }

        # Calculate changes
        for metric in before_quality:
            before_val = before_quality[metric]
            after_val = after_quality[metric]

            if isinstance(before_val, (int, float)) and isinstance(after_val, (int, float)):
                delta = after_val - before_val
                # Prevent division by zero
                delta_percent = (delta / before_val * 100) if before_val != 0 else 0

                comparison["quality_changes"][metric] = {
                    "before": before_val,
                    "after": after_val,
                    "delta": delta,
                    "delta_percent": delta_percent,
                    "degradation": delta < 0 if metric != "bugs" else delta > 0  # More bugs = degradation
                }

        # Cost changes
        before_cost = comparison["before"]["cost"]
        after_cost = comparison["after"]["cost"]
        cost_delta = after_cost - before_cost
        cost_savings_percent = (cost_delta / before_cost * 100) if before_cost != 0 else 0

        comparison["cost_changes"] = {
            "before": before_cost,
            "after": after_cost,
            "savings": -cost_delta,
            "savings_percent": -cost_savings_percent
        }

        # Verdict
        degradations = sum(
            1 for change in comparison["quality_changes"].values()
            if change.get("degradation", False)
        )

        comparison["verdict"] = {
            "quality_degradations": degradations,
            "cost_savings": -cost_delta > 0,
            "overall": "acceptable" if degradations == 0 and cost_savings_percent < 0 else "needs_review"
        }

        return comparison

    def _extract_ac_pass_rate(self, metrics: Dict) -> float:
        """Extract AC pass rate from metrics"""
        test_results = metrics.get("test_results", {})
        ac_results = test_results.get("acceptance_criteria", {})
        pass_rate = ac_results.get("pass_rate", "0%").rstrip("%")
        return float(pass_rate)

    def _extract_test_pass_rate(self, metrics: Dict) -> float:
        """Extract test pass rate"""
        test_results = metrics.get("test_results", {})
        auto_results = test_results.get("automated_tests", {})
        pass_rate = auto_results.get("pass_rate", "0%").rstrip("%")
        return float(pass_rate)

    def _extract_quality_score(self, metrics: Dict) -> float:
        """Extract code quality score"""
        quality = metrics.get("quality_metrics", {})
        score = quality.get("code_quality_score", "0/10")
        return float(score.split("/")[0])

    def generate_comparison_report(self, comparison: Dict) -> str:
        """Generate formatted comparison report"""

        lines = [
            "# Before/After Quality Comparison",
            "",
            f"**Before**: {comparison['before']['story']} - {comparison['before']['scenario']}",
            f"**After**: {comparison['after']['story']} - {comparison['after']['scenario']}",
            "",
            "---",
            "",
            "## Quality Metrics Comparison",
            "",
            "| Metric | Before | After | Delta | Change % | Status |",
            "|--------|--------|-------|-------|----------|--------|"
        ]

        for metric, change in comparison["quality_changes"].items():
            before = change["before"]
            after = change["after"]
            delta = change["delta"]
            delta_pct = change["delta_percent"]
            degraded = change.get("degradation", False)

            # Format values
            if isinstance(before, bool):
                before_str = "Yes" if before else "No"
                after_str = "Yes" if after else "No"
                delta_str = "—"
                delta_pct_str = "—"
            else:
                before_str = f"{before:.1f}"
                after_str = f"{after:.1f}"
                delta_str = f"{delta:+.1f}"
                delta_pct_str = f"{delta_pct:+.1f}%"

            # Status
            if degraded:
                status = "❌ Degraded"
            elif abs(delta_pct) < 1:
                status = "✅ Stable"
            else:
                status = "✅ Improved"

            lines.append(f"| {metric} | {before_str} | {after_str} | {delta_str} | {delta_pct_str} | {status} |")

        lines.extend(["", "---", ""])

        # Cost comparison
        lines.extend([
            "## Cost Comparison",
            "",
            "| Aspect | Before | After | Savings |",
            "|--------|--------|-------|---------|",
            f"| **Total Cost** | ${comparison['cost_changes']['before']:.3f} | ${comparison['cost_changes']['after']:.3f} | ${comparison['cost_changes']['savings']:.3f} ({comparison['cost_changes']['savings_percent']:.0f}%) |",
            "",
            "---",
            ""
        ])

        # Verdict
        degradations = comparison["verdict"]["quality_degradations"]
        cost_savings = comparison["verdict"]["cost_savings"]

        lines.append("## Verdict")
        lines.append("")

        if degradations == 0 and cost_savings:
            lines.extend([
                "✅ **APPROVED FOR PRODUCTION**",
                "",
                "- ✅ Zero quality degradations",
                f"- ✅ Cost savings: {comparison['cost_changes']['savings_percent']:.0f}%",
                "- ✅ All metrics stable or improved",
                "",
                "**Recommendation**: Deploy hybrid approach to production."
            ])
        elif degradations == 0 and not cost_savings:
            lines.extend([
                "⚠️ **APPROVED WITH CAUTION**",
                "",
                "- ✅ Zero quality degradations",
                "- ⚠️ No cost savings (investigate why)",
                "",
                "**Recommendation**: Review cost structure, ensure GLM is being used."
            ])
        elif degradations <= 2 and cost_savings:
            lines.extend([
                "⚠️ **CONDITIONAL APPROVAL**",
                "",
                f"- ⚠️ {degradations} quality metric(s) degraded (acceptable)",
                f"- ✅ Cost savings: {comparison['cost_changes']['savings_percent']:.0f}%",
                "",
                "**Recommendation**: Monitor closely, investigate degraded metrics."
            ])
        else:
            lines.extend([
                "❌ **REJECTED - Quality Degradation**",
                "",
                f"- ❌ {degradations} quality metrics degraded",
                f"- {'✅' if cost_savings else '❌'} Cost savings: {comparison['cost_changes']['savings_percent']:.0f}%",
                "",
                "**Recommendation**: Do NOT deploy. Investigate root cause and fix before proceeding."
            ])

        return "\n".join(lines)

    def batch_comparison(self, story_pairs: List[str]) -> str:
        """Compare multiple before/after pairs"""

        lines = [
            "# Batch Quality Comparison",
            "",
            f"**Stories Analyzed**: {len(story_pairs)}",
            "",
            "| Story | Quality Degradations | Cost Savings | Verdict |",
            "|-------|----------------------|--------------|---------|"
        ]

        total_degradations = 0
        total_savings = 0.0

        for pair in story_pairs:
            before, after = pair.split(",")

            try:
                comparison = self.compare_stories(before.strip(), after.strip())

                story = comparison["after"]["story"]
                degradations = comparison["verdict"]["quality_degradations"]
                savings = comparison["cost_changes"]["savings_percent"]

                verdict = "✅" if degradations == 0 else "⚠️" if degradations <= 2 else "❌"

                lines.append(f"| {story} | {degradations} | {savings:.0f}% | {verdict} |")

                total_degradations += degradations
                total_savings += comparison["cost_changes"]["savings"]

            except Exception as e:
                lines.append(f"| {pair} | ERROR | — | ❌ {str(e)[:30]} |")

        lines.extend([
            "",
            "---",
            "",
            "## Overall Summary",
            "",
            f"- **Total Quality Degradations**: {total_degradations}",
            f"- **Total Cost Savings**: ${total_savings:.2f}",
            f"- **Average Savings %**: {(total_savings / len(story_pairs)) / 0.612 * 100:.0f}%",  # 0.612 = avg story cost
            ""
        ])

        if total_degradations == 0:
            lines.append("✅ **BATCH APPROVED** - Zero quality degradations across all stories")
        elif total_degradations <= len(story_pairs) * 0.2:  # <20% stories have issues
            lines.append("⚠️ **BATCH CONDITIONALLY APPROVED** - Minor quality issues, monitor closely")
        else:
            lines.append("❌ **BATCH REJECTED** - Significant quality degradation detected")

        return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="Compare quality before/after hybrid deployment")

    parser.add_argument("--before", help="Before path (e.g., story_03.2/scenario_a)")
    parser.add_argument("--after", help="After path (e.g., story_03.2/scenario_b)")

    parser.add_argument("--batch", help="Batch comparison (comma-separated pairs)")

    parser.add_argument("--output", "-o", help="Output file for report")

    args = parser.parse_args()

    comparator = BeforeAfterComparison()

    # Batch mode
    if args.batch:
        pairs = args.batch.split()
        report = comparator.batch_comparison(pairs)
        print(report)

        if args.output:
            with open(args.output, "w") as f:
                f.write(report)
            print(f"\n✓ Report saved to {args.output}")

        return

    # Single comparison
    if args.before and args.after:
        comparison = comparator.compare_stories(args.before, args.after)
        report = comparator.generate_comparison_report(comparison)

        print(report)

        if args.output:
            with open(args.output, "w") as f:
                f.write(report)
            print(f"\n✓ Report saved to {args.output}")

        # Exit code based on verdict
        if comparison["verdict"]["overall"] == "acceptable":
            sys.exit(0)
        else:
            sys.exit(1)

    print("Error: Specify --before/--after or --batch")
    sys.exit(1)

if __name__ == "__main__":
    main()
