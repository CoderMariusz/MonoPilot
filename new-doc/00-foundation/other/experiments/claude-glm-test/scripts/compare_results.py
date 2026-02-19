#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Results Comparator
Porównuje wyniki testów Scenario A (Claude only) vs Scenario B (Claude + GLM)
"""
import json
import sys
import os
from pathlib import Path
from typing import Dict, Any

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')


class ScenarioComparator:
    """Porównuje dwa scenariusze testowe"""

    def __init__(self, test_dir: Path):
        self.test_dir = test_dir
        self.scenario_a = test_dir / "test_scenarios" / "scenario_a_claude_only"
        self.scenario_b = test_dir / "test_scenarios" / "scenario_b_claude_glm"

    def load_metrics(self, scenario_path: Path) -> Dict[str, Any]:
        """Wczytaj metrics.json ze scenariusza"""
        metrics_file = scenario_path / "metrics.json"
        if not metrics_file.exists():
            return {}

        with open(metrics_file, 'r') as f:
            return json.load(f)

    def compare(self) -> Dict[str, Any]:
        """Porównaj oba scenariusze"""
        metrics_a = self.load_metrics(self.scenario_a)
        metrics_b = self.load_metrics(self.scenario_b)

        if not metrics_a or not metrics_b:
            return {
                "error": "Brak plików metrics.json w jednym lub obu scenariuszach",
                "scenario_a_exists": bool(metrics_a),
                "scenario_b_exists": bool(metrics_b)
            }

        # Oblicz różnice
        comparison = {
            "scenario_a": {
                "name": "Claude Only",
                "total_tokens": metrics_a.get("total_tokens", 0),
                "claude_tokens": metrics_a.get("total_tokens", 0),
                "glm_tokens": 0,
                "cost_usd": metrics_a.get("cost_usd", 0),
                "iterations": metrics_a.get("iterations", 1)
            },
            "scenario_b": {
                "name": "Claude + GLM",
                "total_tokens": metrics_b.get("total_tokens", 0),
                "claude_tokens": metrics_b.get("claude_tokens", 0),
                "glm_tokens": metrics_b.get("glm_tokens", 0),
                "cost_usd": metrics_b.get("cost_usd", 0),
                "iterations": metrics_b.get("iterations", 1)
            }
        }

        # Savings
        claude_token_savings = (
            comparison["scenario_a"]["claude_tokens"] -
            comparison["scenario_b"]["claude_tokens"]
        )
        claude_savings_pct = (
            (claude_token_savings / comparison["scenario_a"]["claude_tokens"] * 100)
            if comparison["scenario_a"]["claude_tokens"] > 0 else 0
        )

        cost_savings = (
            comparison["scenario_a"]["cost_usd"] -
            comparison["scenario_b"]["cost_usd"]
        )
        cost_savings_pct = (
            (cost_savings / comparison["scenario_a"]["cost_usd"] * 100)
            if comparison["scenario_a"]["cost_usd"] > 0 else 0
        )

        comparison["savings"] = {
            "claude_tokens": claude_token_savings,
            "claude_tokens_pct": round(claude_savings_pct, 1),
            "cost_usd": round(cost_savings, 4),
            "cost_pct": round(cost_savings_pct, 1)
        }

        # Winner
        comparison["winner"] = (
            "scenario_b" if cost_savings > 0
            else "scenario_a" if cost_savings < 0
            else "tie"
        )

        return comparison

    def print_report(self, comparison: Dict[str, Any]):
        """Wydrukuj raport porównawczy"""
        if "error" in comparison:
            print(f"❌ ERROR: {comparison['error']}")
            return

        print("=" * 70)
        print("  SCENARIO COMPARISON: Claude Only vs Claude + GLM")
        print("=" * 70)
        print()

        # Scenario A
        a = comparison["scenario_a"]
        print(f"📊 SCENARIO A: {a['name']}")
        print(f"   Total Tokens:    {a['total_tokens']:,}")
        print(f"   Claude Tokens:   {a['claude_tokens']:,}")
        print(f"   Cost (USD):      ${a['cost_usd']:.4f}")
        print(f"   Iterations:      {a['iterations']}")
        print()

        # Scenario B
        b = comparison["scenario_b"]
        print(f"📊 SCENARIO B: {b['name']}")
        print(f"   Total Tokens:    {b['total_tokens']:,}")
        print(f"   Claude Tokens:   {b['claude_tokens']:,}")
        print(f"   GLM Tokens:      {b['glm_tokens']:,}")
        print(f"   Cost (USD):      ${b['cost_usd']:.4f}")
        print(f"   Iterations:      {b['iterations']}")
        print()

        # Savings
        s = comparison["savings"]
        print("💰 SAVINGS (Scenario B vs A)")
        print(f"   Claude Tokens:   {s['claude_tokens']:+,} ({s['claude_tokens_pct']:+.1f}%)")
        print(f"   Cost:            ${s['cost_usd']:+.4f} ({s['cost_pct']:+.1f}%)")
        print()

        # Winner
        winner_emoji = "🏆" if comparison["winner"] == "scenario_b" else "⚖️"
        winner_name = comparison[comparison["winner"]]["name"] if comparison["winner"] != "tie" else "Tie"
        print(f"{winner_emoji} WINNER: {winner_name}")
        print("=" * 70)


def main():
    # Znajdź katalog testowy
    script_dir = Path(__file__).parent
    test_dir = script_dir.parent

    # Porównaj scenariusze
    comparator = ScenarioComparator(test_dir)
    comparison = comparator.compare()

    # Output
    if "--json" in sys.argv:
        print(json.dumps(comparison, indent=2))
    else:
        comparator.print_report(comparison)

    # Exit code
    if "error" in comparison:
        sys.exit(1)
    elif comparison["winner"] == "scenario_b":
        sys.exit(0)  # Success - Scenario B lepszy
    else:
        sys.exit(2)  # Scenario A lepszy lub tie


if __name__ == "__main__":
    main()
