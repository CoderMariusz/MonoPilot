#!/usr/bin/env python3
"""
Token Counter
Liczy tokeny dla Claude i GLM używając tiktoken jako aproksymacji
"""
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, List

try:
    import tiktoken
except ImportError:
    print("WARNING: tiktoken nie zainstalowany, używam prostego licznika słów * 1.3", file=sys.stderr)
    tiktoken = None


class TokenCounter:
    """Licznik tokenów dla różnych modeli"""

    def __init__(self):
        if tiktoken:
            # Claude używa podobnego tokenizera co GPT
            self.encoder = tiktoken.get_encoding("cl100k_base")
        else:
            self.encoder = None

    def count(self, text: str) -> int:
        """Policz tokeny w tekście"""
        if self.encoder:
            return len(self.encoder.encode(text))
        else:
            # Prosta aproksymacja: słowa * 1.3
            words = len(text.split())
            return int(words * 1.3)

    def count_file(self, file_path: str) -> int:
        """Policz tokeny w pliku"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return self.count(content)
        except Exception as e:
            print(f"ERROR reading {file_path}: {e}", file=sys.stderr)
            return 0

    def count_files(self, file_paths: List[str]) -> Dict[str, int]:
        """Policz tokeny w wielu plikach"""
        return {path: self.count_file(path) for path in file_paths}


def calculate_scenario_cost(
    input_tokens: int,
    output_tokens: int,
    model: str = "claude"
) -> float:
    """
    Oblicz koszt w USD dla scenariusza

    Ceny (za 1M tokenów):
    - Claude Sonnet: $3 input / $15 output
    - GLM-4-Plus: $0.70 input / $0.70 output
    - GLM-4-Long: $0.14 input / $0.14 output
    - GLM-4-Flash: $0.10 input / $0.10 output
    """
    prices = {
        "claude": {"input": 3.0, "output": 15.0},
        "glm-4-plus": {"input": 0.70, "output": 0.70},
        "glm-4-long": {"input": 0.14, "output": 0.14},
        "glm-4-flash": {"input": 0.10, "output": 0.10},
    }

    model_prices = prices.get(model.lower(), prices["claude"])
    input_cost = (input_tokens / 1_000_000) * model_prices["input"]
    output_cost = (output_tokens / 1_000_000) * model_prices["output"]

    return input_cost + output_cost


def main():
    parser = argparse.ArgumentParser(description="Policz tokeny w plikach")
    parser.add_argument("files", nargs="*", help="Pliki do policzenia")
    parser.add_argument("--stdin", action="store_true", help="Czytaj z stdin")
    parser.add_argument("--json", action="store_true", help="Output jako JSON")
    parser.add_argument("--scenario", help="Oblicz koszt scenariusza (JSON file)")

    args = parser.parse_args()
    counter = TokenCounter()

    # Tryb: liczenie tokenów w plikach/stdin
    if args.files or args.stdin:
        if args.stdin:
            text = sys.stdin.read()
            token_count = counter.count(text)
            if args.json:
                print(json.dumps({"stdin": token_count}, indent=2))
            else:
                print(f"Tokens: {token_count:,}")
        else:
            counts = counter.count_files(args.files)
            total = sum(counts.values())

            if args.json:
                counts["_total"] = total
                print(json.dumps(counts, indent=2))
            else:
                for file_path, count in counts.items():
                    print(f"{file_path}: {count:,} tokens")
                print(f"\nTotal: {total:,} tokens")

    # Tryb: analiza scenariusza
    elif args.scenario:
        with open(args.scenario, 'r') as f:
            scenario = json.load(f)

        # Policz tokeny dla plików w scenariuszu
        if "input_files" in scenario:
            input_counts = counter.count_files(scenario["input_files"])
            scenario["input_tokens"] = sum(input_counts.values())

        if "output_file" in scenario:
            scenario["output_tokens"] = counter.count_file(scenario["output_file"])

        # Oblicz koszt
        if "input_tokens" in scenario and "output_tokens" in scenario:
            model = scenario.get("model", "claude")
            scenario["cost_usd"] = calculate_scenario_cost(
                scenario["input_tokens"],
                scenario["output_tokens"],
                model
            )

        print(json.dumps(scenario, indent=2))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
