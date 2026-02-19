#!/usr/bin/env python3
"""
Regression Detection for Hybrid AI Code Quality

Compares current story quality against baseline to detect any quality degradation.
Alerts if GLM-generated code shows patterns of lower quality than Claude baseline.

Usage:
    python detect_regressions.py --story 03.4 --scenario b
    python detect_regressions.py --continuous --threshold 3  # Exit if 3+ regressions
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Tuple
from datetime import datetime
import statistics

class RegressionDetector:
    """Detect quality regressions in hybrid AI code generation"""

    def __init__(self, base_path: str = ".experiments/claude-glm-test"):
        self.base_path = Path(base_path)
        self.metrics_file = self.base_path / "quality_metrics.jsonl"
        self.baseline_file = self.base_path / "quality_baseline.json"
        self.regression_log = self.base_path / "regressions.jsonl"

    def load_baseline(self) -> Dict:
        """Load baseline quality targets"""
        if not self.baseline_file.exists():
            raise FileNotFoundError("Baseline not found. Run monitor_quality.py first.")

        with open(self.baseline_file) as f:
            return json.load(f)

    def load_recent_metrics(self, count: int = 10) -> List[Dict]:
        """Load last N story metrics"""
        if not self.metrics_file.exists():
            return []

        metrics = []
        with open(self.metrics_file) as f:
            for line in f:
                metrics.append(json.loads(line))

        return metrics[-count:] if count else metrics

    def detect_regressions(
        self,
        story_metrics: Dict,
        baseline: Dict
    ) -> Tuple[List[Dict], int]:
        """
        Detect regressions by comparing story metrics to baseline

        Returns: (regressions_list, regression_count)
        """

        targets = baseline["targets"]
        regressions = []

        # Define regression rules
        rules = [
            {
                "metric": "ac_pass_rate",
                "check": lambda v, t: v < t - 5.0,  # >5% drop
                "severity": "critical",
                "message": "AC pass rate dropped significantly"
            },
            {
                "metric": "test_pass_rate",
                "check": lambda v, t: v < t - 10.0,  # >10% drop
                "severity": "critical",
                "message": "Test pass rate degraded"
            },
            {
                "metric": "code_quality_score",
                "check": lambda v, t: v < t - 1.0,  # >1 point drop
                "severity": "high",
                "message": "Code quality score declined"
            },
            {
                "metric": "bugs_per_story",
                "check": lambda v, t: v > t + 3,  # >3 more bugs
                "severity": "high",
                "message": "Bug count increased significantly"
            },
            {
                "metric": "review_iterations",
                "check": lambda v, t: v > t + 2,  # >2 more iterations
                "severity": "medium",
                "message": "Review cycles increased (code quality may be lower)"
            },
            {
                "metric": "security_vulnerabilities",
                "check": lambda v, t: v > 0,  # Any vulnerability
                "severity": "critical",
                "message": "Security vulnerabilities detected"
            }
        ]

        for rule in rules:
            metric_name = rule["metric"]
            value = story_metrics.get(metric_name)
            target = targets.get(metric_name)

            if value is None or target is None:
                continue

            # Check regression
            if rule["check"](value, target):
                regression = {
                    "metric": metric_name,
                    "severity": rule["severity"],
                    "message": rule["message"],
                    "value": value,
                    "target": target,
                    "delta": value - target
                }
                regressions.append(regression)

        return regressions, len(regressions)

    def detect_trend_regression(
        self,
        metric_name: str,
        window: int = 5
    ) -> Dict:
        """
        Detect downward trend in metrics over last N stories

        Uses linear regression to detect if metric is declining
        """

        recent = self.load_recent_metrics(count=window)

        if len(recent) < 3:
            return {"trend": "insufficient_data", "regression": False}

        values = [
            r["metrics"].get(metric_name)
            for r in recent
            if metric_name in r.get("metrics", {})
        ]

        if len(values) < 3:
            return {"trend": "insufficient_data", "regression": False}

        # Simple trend detection (compare first half to second half)
        mid = len(values) // 2
        first_half_avg = statistics.mean(values[:mid])
        second_half_avg = statistics.mean(values[mid:])

        # Prevent division by zero
        if first_half_avg == 0:
            return {"trend": "insufficient_data", "regression": False}

        drop_percent = ((second_half_avg - first_half_avg) / first_half_avg) * 100

        if drop_percent < -10:  # >10% drop
            return {
                "trend": "declining",
                "regression": True,
                "drop_percent": drop_percent,
                "first_avg": first_half_avg,
                "second_avg": second_half_avg,
                "message": f"{metric_name} declining by {abs(drop_percent):.1f}%"
            }
        elif drop_percent > 10:  # >10% improvement
            return {
                "trend": "improving",
                "regression": False,
                "improvement_percent": drop_percent
            }
        else:
            return {
                "trend": "stable",
                "regression": False
            }

    def log_regression(self, story_id: str, scenario: str, regressions: List[Dict]):
        """Log detected regressions for tracking"""

        record = {
            "timestamp": datetime.now().isoformat(),
            "story_id": story_id,
            "scenario": scenario,
            "regression_count": len(regressions),
            "regressions": regressions
        }

        with open(self.regression_log, "a") as f:
            f.write(json.dumps(record) + "\n")

    def continuous_monitoring(self, threshold: int = 3) -> bool:
        """
        Continuous monitoring mode - check if we should halt deployment

        Returns: True if quality acceptable, False if should halt
        """

        recent = self.load_recent_metrics(count=5)

        if not recent:
            print("ℹ️ No metrics available yet for continuous monitoring")
            return True

        baseline = self.load_baseline()
        total_regressions = 0

        for record in recent:
            regressions, count = self.detect_regressions(
                record["metrics"],
                baseline
            )
            total_regressions += count

        # Check trend regressions
        trend_metrics = ["ac_pass_rate", "test_pass_rate", "code_quality_score"]
        trend_regressions = 0

        for metric in trend_metrics:
            trend = self.detect_trend_regression(metric)
            if trend.get("regression"):
                trend_regressions += 1
                print(f"⚠️ Trend regression detected: {trend['message']}")

        total_issues = total_regressions + trend_regressions

        # Decision
        if total_issues >= threshold:
            print(f"\n❌ QUALITY GATE FAILED")
            print(f"Total regressions: {total_issues} (threshold: {threshold})")
            print(f"Recommendation: HALT hybrid deployment, investigate issues")
            return False
        elif total_issues > 0:
            print(f"\n⚠️ WARNING - {total_issues} regressions detected")
            print(f"Recommendation: Monitor closely, investigate if worsens")
            return True
        else:
            print(f"\n✅ QUALITY GATE PASSED")
            print(f"No regressions detected. Safe to continue.")
            return True

def main():
    parser = argparse.ArgumentParser(description="Detect quality regressions")

    parser.add_argument("--story", help="Story ID to check")
    parser.add_argument("--scenario", choices=["a", "b"], help="Scenario")

    parser.add_argument("--continuous", action="store_true", help="Continuous monitoring mode")
    parser.add_argument("--threshold", type=int, default=3, help="Regression threshold for halt")

    parser.add_argument("--trend", help="Check trend for specific metric")
    parser.add_argument("--window", type=int, default=5, help="Window size for trend analysis")

    args = parser.parse_args()

    detector = RegressionDetector()

    # Continuous monitoring
    if args.continuous:
        passed = detector.continuous_monitoring(threshold=args.threshold)
        sys.exit(0 if passed else 1)

    # Trend analysis
    if args.trend:
        trend = detector.detect_trend_regression(args.trend, window=args.window)
        print(json.dumps(trend, indent=2))
        return

    # Story-level regression check
    if args.story and args.scenario:
        metrics_path = detector.base_path / f"story_{args.story}" / f"scenario_{args.scenario}" / "metrics.json"

        if not metrics_path.exists():
            print(f"Error: Metrics not found: {metrics_path}")
            sys.exit(1)

        with open(metrics_path) as f:
            story_metrics = json.load(f)

        baseline = detector.load_baseline()
        regressions, count = detector.detect_regressions(
            story_metrics["quality_metrics"],
            baseline
        )

        if count == 0:
            print(f"✅ No regressions detected for story {args.story} (scenario {args.scenario})")
        else:
            print(f"❌ {count} regressions detected for story {args.story}")
            for reg in regressions:
                severity_icon = {"critical": "🔴", "high": "🟡", "medium": "🟢"}[reg["severity"]]
                print(f"  {severity_icon} {reg['message']}: {reg['value']} (target: {reg['target']})")

            detector.log_regression(args.story, args.scenario, regressions)

        sys.exit(0 if count == 0 else 1)

    print("Error: Specify --story/--scenario, --continuous, or --trend")
    sys.exit(1)

if __name__ == "__main__":
    main()
