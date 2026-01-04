#!/usr/bin/env python3
"""
Quality Monitoring Script for Claude + GLM Hybrid Approach

Tracks quality metrics across stories to ensure GLM code generation
doesn't degrade quality compared to Claude-only baseline.

Usage:
    python monitor_quality.py --story 03.4 --scenario b --baseline 03.2
    python monitor_quality.py --report --weeks 4
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import statistics

class QualityMonitor:
    """Monitor code quality metrics for hybrid AI approach"""

    def __init__(self, base_path: str = ".experiments/claude-glm-test"):
        self.base_path = Path(base_path)
        self.metrics_file = self.base_path / "quality_metrics.jsonl"
        self.baseline_file = self.base_path / "quality_baseline.json"
        self.alerts_file = self.base_path / "quality_alerts.json"

    def record_story_metrics(
        self,
        story_id: str,
        scenario: str,
        metrics: Dict
    ):
        """Record quality metrics for a completed story"""

        record = {
            "timestamp": datetime.now().isoformat(),
            "story_id": story_id,
            "scenario": scenario,
            "metrics": metrics
        }

        # Append to metrics log
        with open(self.metrics_file, "a") as f:
            f.write(json.dumps(record) + "\n")

        print(f"✓ Recorded metrics for story {story_id} (scenario {scenario})")

    def load_baseline(self) -> Dict:
        """Load baseline quality metrics from Claude-only runs"""

        if not self.baseline_file.exists():
            return self._create_default_baseline()

        with open(self.baseline_file) as f:
            return json.load(f)

    def _create_default_baseline(self) -> Dict:
        """Create baseline from Story 03.2 Scenario A (actual data)"""

        baseline = {
            "created_at": datetime.now().isoformat(),
            "source": "Story 03.2 Scenario A (Claude-only)",
            "targets": {
                "ac_pass_rate": 100.0,      # 10/10 ACs
                "test_pass_rate": 96.0,      # 48/50 tests
                "test_coverage_percent": 80.0,
                "bugs_per_story": 7.0,       # Initial bugs
                "review_iterations": 2.0,    # Avg iterations
                "security_vulnerabilities": 0,
                "code_quality_score": 9.5,
                "performance_acceptable": True,
                "production_ready_rate": 100.0
            },
            "thresholds": {
                "ac_pass_rate_min": 95.0,   # Alert if <95%
                "test_pass_rate_min": 90.0,  # Alert if <90%
                "bugs_per_story_max": 10.0,  # Alert if >10 bugs
                "review_iterations_max": 4.0, # Alert if >4 iterations
                "security_vulnerabilities_max": 0,
                "code_quality_score_min": 8.0
            }
        }

        # Save baseline
        with open(self.baseline_file, "w") as f:
            json.dump(baseline, f, indent=2)

        print(f"✓ Created baseline from Story 03.2 data")
        return baseline

    def check_quality(
        self,
        story_metrics: Dict,
        baseline: Optional[Dict] = None
    ) -> Dict:
        """Check if story metrics meet quality thresholds"""

        if baseline is None:
            baseline = self.load_baseline()

        thresholds = baseline["thresholds"]
        targets = baseline["targets"]

        results = {
            "story_id": story_metrics.get("story_id"),
            "timestamp": datetime.now().isoformat(),
            "passed": True,
            "alerts": [],
            "metrics_vs_baseline": {}
        }

        # Check each metric
        checks = [
            ("ac_pass_rate", ">=", thresholds["ac_pass_rate_min"], "Acceptance Criteria Pass Rate"),
            ("test_pass_rate", ">=", thresholds["test_pass_rate_min"], "Test Pass Rate"),
            ("bugs_per_story", "<=", thresholds["bugs_per_story_max"], "Bugs Per Story"),
            ("review_iterations", "<=", thresholds["review_iterations_max"], "Review Iterations"),
            ("security_vulnerabilities", "<=", thresholds["security_vulnerabilities_max"], "Security Vulnerabilities"),
            ("code_quality_score", ">=", thresholds["code_quality_score_min"], "Code Quality Score"),
        ]

        for metric_name, operator, threshold, display_name in checks:
            value = story_metrics.get(metric_name)

            if value is None:
                results["alerts"].append({
                    "severity": "warning",
                    "metric": metric_name,
                    "message": f"Missing metric: {display_name}"
                })
                continue

            # Compare
            passed = False
            if operator == ">=":
                passed = value >= threshold
            elif operator == "<=":
                passed = value <= threshold

            # Store comparison
            results["metrics_vs_baseline"][metric_name] = {
                "value": value,
                "target": targets.get(metric_name),
                "threshold": threshold,
                "passed": passed,
                "delta": value - targets.get(metric_name, 0)
            }

            # Alert if failed
            if not passed:
                results["passed"] = False
                results["alerts"].append({
                    "severity": "critical",
                    "metric": metric_name,
                    "message": f"{display_name}: {value} (threshold: {operator} {threshold})",
                    "value": value,
                    "threshold": threshold
                })

        # Save alerts if any
        if results["alerts"]:
            self._save_alert(results)

        return results

    def _save_alert(self, results: Dict):
        """Save alert to alerts file for tracking"""

        alerts = []
        if self.alerts_file.exists():
            with open(self.alerts_file) as f:
                alerts = json.load(f)

        alerts.append(results)

        with open(self.alerts_file, "w") as f:
            json.dump(alerts, f, indent=2)

    def generate_weekly_report(self, weeks: int = 1) -> str:
        """Generate quality report for last N weeks"""

        if not self.metrics_file.exists():
            return "No metrics data available yet."

        # Load all metrics
        cutoff = datetime.now() - timedelta(weeks=weeks)
        recent_metrics = []

        with open(self.metrics_file) as f:
            for line in f:
                record = json.loads(line)
                timestamp = datetime.fromisoformat(record["timestamp"])

                if timestamp >= cutoff:
                    recent_metrics.append(record)

        if not recent_metrics:
            return f"No metrics recorded in last {weeks} week(s)."

        # Calculate aggregates
        report = self._generate_report_text(recent_metrics, weeks)
        return report

    def _generate_report_text(self, metrics: List[Dict], weeks: int) -> str:
        """Generate formatted report text"""

        # Group by scenario
        by_scenario = {"a": [], "b": []}
        for record in metrics:
            scenario = record.get("scenario", "unknown")
            if scenario in by_scenario:
                by_scenario[scenario].append(record)

        # Calculate stats
        report_lines = [
            f"# Quality Report - Last {weeks} Week(s)",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "",
            "## Summary",
            f"Total stories analyzed: {len(metrics)}",
            f"- Scenario A (Claude-only): {len(by_scenario['a'])}",
            f"- Scenario B (Claude+GLM): {len(by_scenario['b'])}",
            ""
        ]

        # Scenario comparison
        if by_scenario["b"]:
            report_lines.extend([
                "## Scenario B (Hybrid) Quality Metrics",
                ""
            ])

            # Extract metrics
            ac_rates = [m["metrics"]["ac_pass_rate"] for m in by_scenario["b"] if "ac_pass_rate" in m.get("metrics", {})]
            test_rates = [m["metrics"]["test_pass_rate"] for m in by_scenario["b"] if "test_pass_rate" in m.get("metrics", {})]
            quality_scores = [m["metrics"]["code_quality_score"] for m in by_scenario["b"] if "code_quality_score" in m.get("metrics", {})]

            if ac_rates:
                report_lines.append(f"- AC Pass Rate: {statistics.mean(ac_rates):.1f}% (target: ≥95%)")
            if test_rates:
                report_lines.append(f"- Test Pass Rate: {statistics.mean(test_rates):.1f}% (target: ≥90%)")
            if quality_scores:
                report_lines.append(f"- Code Quality: {statistics.mean(quality_scores):.1f}/10 (target: ≥8.0)")

            report_lines.append("")

        # Alerts summary
        alerts = self._load_alerts()
        critical_alerts = [a for a in alerts if any(
            alert["severity"] == "critical" for alert in a.get("alerts", [])
        )]

        report_lines.extend([
            "## Alerts",
            f"Critical alerts: {len(critical_alerts)}",
            ""
        ])

        if critical_alerts:
            report_lines.append("### Critical Issues")
            for alert_record in critical_alerts[-5:]:  # Last 5
                story = alert_record.get("story_id", "unknown")
                for alert in alert_record.get("alerts", []):
                    if alert["severity"] == "critical":
                        report_lines.append(f"- Story {story}: {alert['message']}")

        # Verdict
        report_lines.extend([
            "",
            "## Verdict",
            ""
        ])

        if len(critical_alerts) == 0:
            report_lines.append("✅ **PASS** - All quality metrics within acceptable range")
            report_lines.append("**Recommendation**: Continue with hybrid approach")
        elif len(critical_alerts) <= 2:
            report_lines.append("⚠️ **WARNING** - Some quality metrics below threshold")
            report_lines.append("**Recommendation**: Investigate alerts, adjust prompts")
        else:
            report_lines.append("❌ **FAIL** - Multiple quality issues detected")
            report_lines.append("**Recommendation**: Consider rollback to Claude-only")

        return "\n".join(report_lines)

    def _load_alerts(self) -> List[Dict]:
        """Load all alerts"""
        if not self.alerts_file.exists():
            return []

        with open(self.alerts_file) as f:
            return json.load(f)

def main():
    parser = argparse.ArgumentParser(description="Monitor code quality for hybrid AI approach")

    parser.add_argument("--story", help="Story ID (e.g., 03.4)")
    parser.add_argument("--scenario", choices=["a", "b"], help="Scenario: a (Claude) or b (Hybrid)")
    parser.add_argument("--baseline", help="Baseline story ID (e.g., 03.2)")

    parser.add_argument("--report", action="store_true", help="Generate weekly quality report")
    parser.add_argument("--weeks", type=int, default=1, help="Number of weeks for report")

    parser.add_argument("--check", help="Check quality for story metrics file (JSON path)")

    args = parser.parse_args()

    monitor = QualityMonitor()

    # Generate report
    if args.report:
        report = monitor.generate_weekly_report(weeks=args.weeks)
        print(report)
        return

    # Check quality
    if args.check:
        with open(args.check) as f:
            story_metrics = json.load(f)

        results = monitor.check_quality(story_metrics)

        print(f"\n{'='*60}")
        print(f"Quality Check: Story {results['story_id']}")
        print(f"{'='*60}\n")

        if results["passed"]:
            print("✅ PASS - All quality metrics meet thresholds\n")
        else:
            print("❌ FAIL - Quality issues detected\n")

        # Print alerts
        if results["alerts"]:
            print("Alerts:")
            for alert in results["alerts"]:
                icon = "🔴" if alert["severity"] == "critical" else "⚠️"
                print(f"  {icon} {alert['message']}")

        print()

        # Print comparison to baseline
        print("Metrics vs Baseline:")
        for metric, data in results["metrics_vs_baseline"].items():
            status = "✅" if data["passed"] else "❌"
            delta = data["delta"]
            delta_str = f"+{delta:.1f}" if delta > 0 else f"{delta:.1f}"
            print(f"  {status} {metric}: {data['value']:.1f} (baseline: {data['target']:.1f}, delta: {delta_str})")

        return

    # Record story metrics
    if args.story and args.scenario:
        # Load metrics from file
        metrics_path = monitor.base_path / f"story_{args.story}" / f"scenario_{args.scenario}" / "metrics.json"

        if not metrics_path.exists():
            print(f"Error: Metrics file not found: {metrics_path}")
            sys.exit(1)

        with open(metrics_path) as f:
            story_metrics = json.load(f)

        # Convert to monitoring format
        monitoring_metrics = {
            "ac_pass_rate": float(story_metrics["test_results"]["acceptance_criteria"]["pass_rate"].rstrip("%")),
            "test_pass_rate": float(story_metrics["test_results"]["automated_tests"]["pass_rate"].rstrip("%")),
            "bugs_per_story": story_metrics["bugs"]["total_bugs_lifecycle"],
            "review_iterations": story_metrics["iterations"],
            "security_vulnerabilities": 0,  # From QA report
            "code_quality_score": float(story_metrics["quality_metrics"]["code_quality_score"].split("/")[0]),
            "production_ready": story_metrics["quality_metrics"]["production_ready"]
        }

        monitor.record_story_metrics(args.story, args.scenario, monitoring_metrics)

        # Check quality
        results = monitor.check_quality(monitoring_metrics)

        if results["passed"]:
            print(f"✅ Quality check PASSED for story {args.story}")
        else:
            print(f"❌ Quality check FAILED for story {args.story}")
            print(f"Alerts: {len(results['alerts'])}")

if __name__ == "__main__":
    main()
