#!/usr/bin/env python3
"""
Quality Dashboard Generator for Hybrid AI Approach

Generates visual dashboard showing:
- Story-by-story quality comparison
- Trend analysis over time
- Cost vs Quality trade-offs
- Alert summary

Usage:
    python quality_dashboard.py --output dashboard.md
    python quality_dashboard.py --html --output dashboard.html
    python quality_dashboard.py --live  # Auto-refresh every 5 min
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List
from datetime import datetime
import statistics

class QualityDashboard:
    """Generate quality monitoring dashboard"""

    def __init__(self, base_path: str = ".experiments/claude-glm-test"):
        self.base_path = Path(base_path)
        self.metrics_file = self.base_path / "quality_metrics.jsonl"
        self.baseline_file = self.base_path / "quality_baseline.json"
        self.alerts_file = self.base_path / "quality_alerts.json"

    def load_all_metrics(self) -> List[Dict]:
        """Load all story metrics"""
        if not self.metrics_file.exists():
            return []

        metrics = []
        with open(self.metrics_file) as f:
            for line in f:
                metrics.append(json.loads(line))

        return metrics

    def load_baseline(self) -> Dict:
        """Load baseline quality targets"""
        if not self.baseline_file.exists():
            return {}

        with open(self.baseline_file) as f:
            return json.load(f)

    def load_alerts(self) -> List[Dict]:
        """Load quality alerts"""
        if not self.alerts_file.exists():
            return []

        with open(self.alerts_file) as f:
            return json.load(f)

    def generate_markdown_dashboard(self) -> str:
        """Generate markdown dashboard"""

        all_metrics = self.load_all_metrics()
        baseline = self.load_baseline()
        alerts = self.load_alerts()

        # Header
        lines = [
            "# 📊 MonoPilot Quality Dashboard - Hybrid AI Approach",
            "",
            f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Stories Analyzed**: {len(all_metrics)}",
            f"**Active Alerts**: {len([a for a in alerts if any(alert['severity'] == 'critical' for alert in a.get('alerts', []))])}",
            "",
            "---",
            ""
        ]

        # Quick Stats
        if all_metrics:
            scenario_b_metrics = [m for m in all_metrics if m.get("scenario") == "b"]

            if scenario_b_metrics:
                lines.extend(self._generate_quick_stats(scenario_b_metrics, baseline))

        # Story-by-Story Table
        lines.extend(self._generate_story_table(all_metrics, baseline))

        # Trend Charts (ASCII art)
        lines.extend(self._generate_trend_charts(all_metrics))

        # Cost vs Quality Analysis
        lines.extend(self._generate_cost_quality_analysis(all_metrics))

        # Alerts Summary
        lines.extend(self._generate_alerts_summary(alerts))

        # Recommendations
        lines.extend(self._generate_recommendations(all_metrics, alerts))

        return "\n".join(lines)

    def _generate_quick_stats(self, metrics: List[Dict], baseline: Dict) -> List[str]:
        """Generate quick stats summary"""

        # Extract values
        ac_rates = [m["metrics"]["ac_pass_rate"] for m in metrics if "ac_pass_rate" in m.get("metrics", {})]
        test_rates = [m["metrics"]["test_pass_rate"] for m in metrics if "test_pass_rate" in m.get("metrics", {})]
        quality_scores = [m["metrics"]["code_quality_score"] for m in metrics if "code_quality_score" in m.get("metrics", {})]

        lines = [
            "## ⚡ Quick Stats (Scenario B - Hybrid)",
            "",
            "| Metric | Current Avg | Baseline | Status |",
            "|--------|-------------|----------|--------|"
        ]

        if ac_rates:
            avg = statistics.mean(ac_rates)
            target = baseline["targets"]["ac_pass_rate"]
            status = "✅ Pass" if avg >= target - 5 else "⚠️ Warning"
            lines.append(f"| **AC Pass Rate** | {avg:.1f}% | {target:.1f}% | {status} |")

        if test_rates:
            avg = statistics.mean(test_rates)
            target = baseline["targets"]["test_pass_rate"]
            status = "✅ Pass" if avg >= target - 10 else "⚠️ Warning"
            lines.append(f"| **Test Pass Rate** | {avg:.1f}% | {target:.1f}% | {status} |")

        if quality_scores:
            avg = statistics.mean(quality_scores)
            target = baseline["targets"]["code_quality_score"]
            status = "✅ Pass" if avg >= target - 1 else "⚠️ Warning"
            lines.append(f"| **Code Quality** | {avg:.1f}/10 | {target:.1f}/10 | {status} |")

        lines.extend(["", "---", ""])
        return lines

    def _generate_story_table(self, metrics: List[Dict], baseline: Dict) -> List[str]:
        """Generate story-by-story comparison table"""

        lines = [
            "## 📋 Story-by-Story Quality",
            "",
            "| Story | Scenario | AC Pass | Test Pass | Quality Score | Bugs | Iterations | Status |",
            "|-------|----------|---------|-----------|---------------|------|------------|--------|"
        ]

        for record in metrics:
            story = record.get("story_id", "?")
            scenario = record.get("scenario", "?").upper()
            m = record.get("metrics", {})

            ac_pass = f"{m.get('ac_pass_rate', 0):.0f}%"
            test_pass = f"{m.get('test_pass_rate', 0):.0f}%"
            quality = f"{m.get('code_quality_score', 0):.1f}/10"
            bugs = m.get('bugs_per_story', '?')
            iters = m.get('review_iterations', '?')

            # Status
            status = "✅ Pass"
            if m.get('ac_pass_rate', 100) < 95:
                status = "⚠️ Warning"
            if m.get('security_vulnerabilities', 0) > 0:
                status = "❌ Fail"

            lines.append(f"| {story} | {scenario} | {ac_pass} | {test_pass} | {quality} | {bugs} | {iters} | {status} |")

        lines.extend(["", "---", ""])
        return lines

    def _generate_trend_charts(self, metrics: List[Dict]) -> List[str]:
        """Generate ASCII trend charts"""

        lines = [
            "## 📈 Quality Trends (Last 10 Stories)",
            ""
        ]

        # Filter Scenario B only
        scenario_b = [m for m in metrics if m.get("scenario") == "b"][-10:]

        if len(scenario_b) < 2:
            lines.append("_Insufficient data for trend analysis_")
            lines.extend(["", "---", ""])
            return lines

        # AC Pass Rate trend
        ac_rates = [m["metrics"].get("ac_pass_rate", 0) for m in scenario_b]
        lines.extend(self._ascii_chart("AC Pass Rate (%)", ac_rates, target=100))

        # Code Quality Score trend
        quality_scores = [m["metrics"].get("code_quality_score", 0) for m in scenario_b]
        lines.extend(self._ascii_chart("Code Quality Score", quality_scores, target=9.5, scale=10))

        lines.extend(["", "---", ""])
        return lines

    def _ascii_chart(self, title: str, values: List[float], target: float, scale: float = 100) -> List[str]:
        """Generate simple ASCII bar chart"""

        lines = [f"### {title}", "```"]

        for i, val in enumerate(values):
            story_num = i + 1
            bar_length = int((val / scale) * 40)  # 40 chars max
            bar = "█" * bar_length

            target_pos = int((target / scale) * 40)
            indicator = "│" if bar_length >= target_pos else " " * (target_pos - bar_length) + "│"

            lines.append(f"Story {story_num:2d} {bar}{indicator} {val:.1f}")

        lines.extend(["```", f"Target: {target}", ""])
        return lines

    def _generate_cost_quality_analysis(self, metrics: List[Dict]) -> List[str]:
        """Generate cost vs quality trade-off analysis"""

        lines = [
            "## 💰 Cost vs Quality Trade-off",
            ""
        ]

        # Compare scenarios
        scenario_a = [m for m in metrics if m.get("scenario") == "a"]
        scenario_b = [m for m in metrics if m.get("scenario") == "b"]

        if not scenario_a or not scenario_b:
            lines.append("_Waiting for data from both scenarios_")
            lines.extend(["", "---", ""])
            return lines

        # Average quality scores
        a_quality = statistics.mean([m["metrics"]["code_quality_score"] for m in scenario_a])
        b_quality = statistics.mean([m["metrics"]["code_quality_score"] for m in scenario_b])

        # Cost data (would come from metrics files)
        a_cost = sum([self._estimate_cost(m, "a") for m in scenario_a])
        b_cost = sum([self._estimate_cost(m, "b") for m in scenario_b])

        savings_percent = ((a_cost - b_cost) / a_cost) * 100 if a_cost > 0 else 0

        lines.extend([
            "| Metric | Scenario A (Claude) | Scenario B (Hybrid) | Difference |",
            "|--------|---------------------|---------------------|------------|",
            f"| **Avg Quality** | {a_quality:.1f}/10 | {b_quality:.1f}/10 | {b_quality - a_quality:+.1f} |",
            f"| **Total Cost** | ${a_cost:.2f} | ${b_cost:.2f} | ${b_cost - a_cost:+.2f} ({savings_percent:+.0f}%) |",
            f"| **Cost per Quality Point** | ${a_cost/a_quality:.3f} | ${b_cost/b_quality:.3f} | — |",
            "",
            f"**Verdict**: Scenario B is **{abs(savings_percent):.0f}% cheaper** with **{b_quality - a_quality:+.1f} point** quality difference.",
            "",
            "---",
            ""
        ])

        return lines

    def _estimate_cost(self, record: Dict, scenario: str) -> float:
        """Estimate cost from metrics (placeholder)"""
        # Would read from story metrics.json cost_usd field
        return 0.5 if scenario == "a" else 0.25  # Placeholder

    def _generate_alerts_summary(self, alerts: List[Dict]) -> List[str]:
        """Generate alerts summary"""

        lines = [
            "## 🚨 Recent Alerts (Last 5)",
            ""
        ]

        if not alerts:
            lines.append("✅ **No quality alerts** - All metrics within acceptable range")
            lines.extend(["", "---", ""])
            return lines

        # Show last 5 alerts
        recent_alerts = alerts[-5:]

        lines.append("| Story | Timestamp | Severity | Issue |")
        lines.append("|-------|-----------|----------|-------|")

        for alert_record in recent_alerts:
            story = alert_record.get("story_id", "?")
            timestamp = alert_record.get("timestamp", "")[:16]  # YYYY-MM-DD HH:MM

            for alert in alert_record.get("alerts", []):
                severity = alert["severity"]
                icon = "🔴" if severity == "critical" else "⚠️"
                message = alert["message"][:50]  # Truncate

                lines.append(f"| {story} | {timestamp} | {icon} {severity} | {message} |")

        lines.extend(["", "---", ""])
        return lines

    def _generate_recommendations(self, metrics: List[Dict], alerts: List[Dict]) -> List[str]:
        """Generate actionable recommendations"""

        lines = [
            "## 💡 Recommendations",
            ""
        ]

        critical_alerts = [
            a for a in alerts
            if any(alert["severity"] == "critical" for alert in a.get("alerts", []))
        ]

        if len(critical_alerts) == 0:
            lines.extend([
                "✅ **Continue with hybrid approach**",
                "",
                "Quality metrics are stable and meet all thresholds.",
                "No action required.",
                ""
            ])
        elif len(critical_alerts) <= 2:
            lines.extend([
                "⚠️ **Monitor closely, investigate alerts**",
                "",
                "Some quality issues detected. Recommended actions:",
                "1. Review failing stories for common patterns",
                "2. Enhance GLM prompts with additional context",
                "3. Increase Claude review thoroughness",
                "4. Re-run affected stories if critical",
                ""
            ])
        else:
            lines.extend([
                "❌ **Consider rollback to Claude-only**",
                "",
                "Multiple quality issues suggest systematic problem.",
                "Recommended actions:",
                "1. Pause hybrid deployment for new stories",
                "2. Root cause analysis on failed stories",
                "3. Re-evaluate GLM model selection (try GLM-4.7 vs GLM-4.5)",
                "4. Enhance quality gates (stricter review criteria)",
                "5. Consider Claude-only for critical modules",
                ""
            ])

        lines.extend(["---", ""])
        return lines

    def generate_html_dashboard(self) -> str:
        """Generate HTML dashboard with charts"""

        # For now, return markdown with note
        md = self.generate_markdown_dashboard()

        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>MonoPilot Quality Dashboard</title>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .alert-critical {{ color: red; font-weight: bold; }}
        .alert-warning {{ color: orange; }}
        .status-pass {{ color: green; }}
        .status-fail {{ color: red; }}
        h1 {{ color: #333; }}
        pre {{ background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }}
    </style>
</head>
<body>
    <div id="content">
        <!-- Markdown content converted to HTML -->
        {self._md_to_html(md)}
    </div>
    <script>
        // Auto-refresh every 5 minutes
        setTimeout(() => location.reload(), 300000);
    </script>
</body>
</html>
"""
        return html

    def _md_to_html(self, markdown: str) -> str:
        """Simple markdown to HTML converter (for tables mainly)

        NOTE: This is a simplified converter for basic tables and headings.
        For production use, consider using a proper markdown library like 'markdown' or 'mistune'.
        """
        # Simplified - in production use a proper markdown library
        lines = markdown.split('\n')
        html_lines = []

        for line in lines:
            if line.startswith('# '):
                html_lines.append(f"<h1>{line[2:]}</h1>")
            elif line.startswith('## '):
                html_lines.append(f"<h2>{line[3:]}</h2>")
            elif line.startswith('| '):
                # Table row - keep as is, wrap in <pre> for now
                if not html_lines or not html_lines[-1].startswith('<pre>'):
                    html_lines.append('<pre>')
                html_lines.append(line)
            elif line.strip() == '---':
                if html_lines and html_lines[-1] == '<pre>':
                    html_lines.append('</pre>')
                html_lines.append('<hr>')
            else:
                if html_lines and html_lines[-1].startswith('<pre>') and not line.startswith('|'):
                    html_lines.append('</pre>')
                html_lines.append(f"<p>{line}</p>")

        return '\n'.join(html_lines)

    def _generate_story_table(self, metrics: List[Dict], baseline: Dict) -> List[str]:
        """Generate story-by-story table"""

        lines = [
            "## 📊 Story Quality Metrics",
            "",
            "| Story | Scenario | ACs | Tests | Quality | Bugs | Iters | Cost | Status |",
            "|-------|----------|-----|-------|---------|------|-------|------|--------|"
        ]

        for record in metrics:
            story = record.get("story_id", "?")
            scenario = "Claude" if record.get("scenario") == "a" else "Hybrid"
            m = record.get("metrics", {})

            ac = f"{m.get('ac_pass_rate', 0):.0f}%"
            test = f"{m.get('test_pass_rate', 0):.0f}%"
            quality = f"{m.get('code_quality_score', 0):.1f}"
            bugs = m.get('bugs_per_story', '?')
            iters = m.get('review_iterations', '?')
            cost = f"${self._estimate_cost(record, record.get('scenario', 'a')):.2f}"

            # Status icon
            status = "✅"
            if m.get('security_vulnerabilities', 0) > 0:
                status = "❌"
            elif m.get('ac_pass_rate', 100) < 95:
                status = "⚠️"

            lines.append(f"| {story} | {scenario} | {ac} | {test} | {quality} | {bugs} | {iters} | {cost} | {status} |")

        lines.extend(["", "---", ""])
        return lines

    def _generate_trend_charts(self, metrics: List[Dict]) -> List[str]:
        """Generate trend visualization"""

        scenario_b = [m for m in metrics if m.get("scenario") == "b"]

        if len(scenario_b) < 2:
            return ["## 📈 Trends", "", "_Not enough data for trends_", "", "---", ""]

        lines = [
            "## 📈 Quality Trends (Scenario B)",
            "",
            "### Code Quality Score Over Time",
            "```"
        ]

        quality_scores = [m["metrics"].get("code_quality_score", 0) for m in scenario_b]

        for i, score in enumerate(quality_scores):
            bar = "█" * int(score)
            lines.append(f"Story {i+1:2d} │{bar} {score:.1f}/10")

        lines.extend([
            "```",
            "",
            "### Test Pass Rate Over Time",
            "```"
        ])

        test_rates = [m["metrics"].get("test_pass_rate", 0) for m in scenario_b]

        for i, rate in enumerate(test_rates):
            bar_len = int(rate / 100 * 40)
            bar = "█" * bar_len
            lines.append(f"Story {i+1:2d} │{bar} {rate:.0f}%")

        lines.extend(["```", "", "---", ""])
        return lines

    def _generate_cost_quality_analysis(self, metrics: List[Dict]) -> List[str]:
        """Cost vs quality analysis"""

        scenario_a = [m for m in metrics if m.get("scenario") == "a"]
        scenario_b = [m for m in metrics if m.get("scenario") == "b"]

        if not scenario_a or not scenario_b:
            return []

        lines = [
            "## 💵 Cost Efficiency Analysis",
            "",
            "| Approach | Stories | Avg Quality | Total Cost | Cost/Quality Point |",
            "|----------|---------|-------------|------------|--------------------|"
        ]

        for scenario_name, scenario_data in [("Claude Only", scenario_a), ("Claude+GLM", scenario_b)]:
            count = len(scenario_data)
            avg_quality = statistics.mean([m["metrics"]["code_quality_score"] for m in scenario_data])
            total_cost = sum([self._estimate_cost(m, m.get("scenario")) for m in scenario_data])
            cost_per_point = total_cost / avg_quality if avg_quality > 0 else 0

            lines.append(f"| {scenario_name} | {count} | {avg_quality:.1f}/10 | ${total_cost:.2f} | ${cost_per_point:.3f} |")

        lines.extend(["", "---", ""])
        return lines

    def _generate_alerts_summary(self, alerts: List[Dict]) -> List[str]:
        """Alert summary section"""

        lines = [
            "## 🚨 Quality Alerts",
            ""
        ]

        if not alerts:
            lines.append("✅ **No alerts** - All quality checks passing")
            lines.extend(["", "---", ""])
            return lines

        critical = sum(1 for a in alerts if any(
            alert["severity"] == "critical" for alert in a.get("alerts", [])
        ))

        lines.append(f"**Critical Alerts**: {critical}")
        lines.append(f"**Total Alert Records**: {len(alerts)}")
        lines.append("")

        if critical > 0:
            lines.append("### ❌ Critical Issues (Action Required)")
            for alert_record in alerts:
                for alert in alert_record.get("alerts", []):
                    if alert["severity"] == "critical":
                        story = alert_record.get("story_id", "?")
                        lines.append(f"- **Story {story}**: {alert['message']}")

        lines.extend(["", "---", ""])
        return lines

def main():
    parser = argparse.ArgumentParser(description="Generate quality dashboard")

    parser.add_argument("--output", "-o", default="QUALITY_DASHBOARD.md", help="Output file")
    parser.add_argument("--html", action="store_true", help="Generate HTML dashboard")
    parser.add_argument("--live", action="store_true", help="Live dashboard (auto-refresh)")

    args = parser.parse_args()

    dashboard = QualityDashboard()

    if args.html:
        content = dashboard.generate_html_dashboard()
        output_file = args.output.replace(".md", ".html")
    else:
        content = dashboard.generate_markdown_dashboard()
        output_file = args.output

    # Write to file
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✓ Dashboard generated: {output_file}")

    # Live mode
    if args.live:
        print(f"🔄 Live mode: Dashboard will auto-refresh every 5 minutes")
        print(f"Open: file://{Path(output_file).absolute()}")

if __name__ == "__main__":
    main()
