#!/usr/bin/env python3
"""
ZhipuAI GLM API Wrapper
Wywołuje GLM-4 z kontekstem z plików
"""
import requests
import sys
import os
import json
import argparse
from pathlib import Path
from typing import List, Optional

class GLMClient:
    """Klient do komunikacji z ZhipuAI API"""

    BASE_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def read_file(self, path: str) -> str:
        """Wczytaj plik z dysku"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            return f"[ERROR reading {path}: {str(e)}]"

    def build_context(self, context_files: List[str]) -> str:
        """Zbuduj kontekst z listy plików"""
        context_parts = []
        for file_path in context_files:
            content = self.read_file(file_path)
            context_parts.append(f"=== FILE: {file_path} ===\n{content}\n")
        return "\n".join(context_parts)

    def call(
        self,
        prompt: str,
        context_files: Optional[List[str]] = None,
        model: str = "glm-4-plus",
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> dict:
        """
        Wywołaj GLM API z promptem i opcjonalnym kontekstem

        Args:
            prompt: Główny prompt/zadanie
            context_files: Lista ścieżek do plików kontekstowych
            model: Model GLM (glm-4-plus, glm-4-long, glm-4-flash)
            temperature: Temperatura (0-1)
            max_tokens: Maksymalna długość odpowiedzi

        Returns:
            dict z 'response', 'usage', 'model'
        """
        # Zbuduj pełny prompt z kontekstem
        if context_files:
            context = self.build_context(context_files)
            full_prompt = f"""{context}

─────────────────────────────────────
TASK:
{prompt}
"""
        else:
            full_prompt = prompt

        # Payload dla API
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": full_prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        # Wywołaj API
        try:
            print(f"[DEBUG] Calling {model} with {len(full_prompt)} chars prompt", file=sys.stderr)
            response = requests.post(
                self.BASE_URL,
                headers=self.headers,
                json=payload,
                timeout=180  # Zwiększono z 60 do 180 sekund
            )
            print(f"[DEBUG] Response status: {response.status_code}", file=sys.stderr)
            response.raise_for_status()
            data = response.json()

            return {
                "response": data["choices"][0]["message"]["content"],
                "usage": data.get("usage", {}),
                "model": data.get("model", model),
                "finish_reason": data["choices"][0].get("finish_reason", "unknown")
            }
        except requests.exceptions.RequestException as e:
            return {
                "error": str(e),
                "response": None,
                "usage": {}
            }


def main():
    parser = argparse.ArgumentParser(description="Wywołaj ZhipuAI GLM API")
    parser.add_argument("--prompt", "-p", help="Prompt (lub stdin)", default=None)
    parser.add_argument("--context", "-c", nargs="+", help="Pliki kontekstowe", default=[])
    parser.add_argument("--model", "-m", default="glm-4-plus",
                       choices=["glm-4-plus", "glm-4-long", "glm-4-flash"])
    parser.add_argument("--temperature", "-t", type=float, default=0.7)
    parser.add_argument("--max-tokens", type=int, default=4096)
    parser.add_argument("--output", "-o", help="Zapisz wynik do pliku")
    parser.add_argument("--json", action="store_true", help="Zwróć pełny JSON z metadanymi")

    args = parser.parse_args()

    # Pobierz API key z configu lub zmiennej środowiskowej
    config_path = Path(__file__).parent.parent / "config.json"
    api_key = None

    if config_path.exists():
        with open(config_path) as f:
            config = json.load(f)
            api_key = config.get("zhipu_api_key")

    if not api_key:
        api_key = os.getenv("ZHIPU_API_KEY")

    if not api_key:
        print("ERROR: Brak klucza API! Ustaw ZHIPU_API_KEY lub dodaj do config.json", file=sys.stderr)
        sys.exit(1)

    # Pobierz prompt
    if args.prompt:
        prompt = args.prompt
    else:
        prompt = sys.stdin.read()

    # Wywołaj GLM
    client = GLMClient(api_key)
    result = client.call(
        prompt=prompt,
        context_files=args.context,
        model=args.model,
        temperature=args.temperature,
        max_tokens=args.max_tokens
    )

    # Obsługa błędów
    if "error" in result and result["error"]:
        print(f"ERROR: {result['error']}", file=sys.stderr)
        sys.exit(1)

    # Output
    if args.json:
        output = json.dumps(result, indent=2, ensure_ascii=False)
    else:
        output = result["response"]

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"✓ Zapisano do {args.output}", file=sys.stderr)
        if args.json:
            print(f"✓ Tokens: {result['usage'].get('total_tokens', '?')}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
