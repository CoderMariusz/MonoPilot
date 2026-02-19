#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test GLM API Connection
Prosty test sprawdzający czy API działa i klucz jest prawidłowy
"""
import sys
import os
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    os.system('chcp 65001 > nul 2>&1')
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Import GLMClient z glm_call.py
sys.path.insert(0, str(Path(__file__).parent))
from glm_call import GLMClient
import json

def load_api_key():
    """Wczytaj API key z config.json"""
    config_path = Path(__file__).parent.parent / "config.json"

    if not config_path.exists():
        print("[X] config.json nie istnieje!")
        print(f"   Utworz plik: {config_path}")
        print('   Z zawartoscia: {"zhipu_api_key": "twoj_klucz"}')
        return None

    with open(config_path, encoding='utf-8') as f:
        config = json.load(f)
        api_key = config.get("zhipu_api_key")

        if not api_key or api_key == "YOUR_API_KEY_HERE":
            print("[X] Brak API key w config.json!")
            print("   Edytuj config.json i wklej swoj klucz ZhipuAI")
            return None

        return api_key

def test_simple_call(client):
    """Test 1: Prosty prompt bez kontekstu"""
    print("\n[TEST 1] Simple prompt")
    print("-" * 60)

    result = client.call(
        prompt="Write a Python function that adds two numbers. Just code, no explanation.",
        model="glm-4.7",  # Model z config
        max_tokens=500
    )

    if "error" in result:
        print(f"[X] ERROR: {result['error']}")
        return False

    print("[OK] Success!")
    print(f"   Model: {result['model']}")
    print(f"   Tokens: {result['usage'].get('total_tokens', '?')}")
    print(f"\n   Response:\n{result['response'][:200]}...")
    return True

def test_with_context(client):
    """Test 2: Prompt z kontekstem z pliku"""
    print("\n[TEST 2] Prompt with context file")
    print("-" * 60)

    # Utwórz tymczasowy plik kontekstowy
    temp_context = Path(__file__).parent / "temp_context.txt"
    temp_context.write_text("""
Project: MonoPilot MES
Tech Stack: Next.js 16, TypeScript, Supabase
Pattern: Service layer with Zod validation
""")

    result = client.call(
        prompt="Generate a TypeScript service class skeleton following project patterns",
        context_files=[str(temp_context)],
        model="glm-4.7",
        max_tokens=500
    )

    # Cleanup
    temp_context.unlink()

    if "error" in result:
        print(f"[X] ERROR: {result['error']}")
        return False

    print("[OK] Success!")
    print(f"   Context included: YES")
    print(f"   Tokens: {result['usage'].get('total_tokens', '?')}")
    print(f"\n   Response:\n{result['response'][:200]}...")
    return True

def test_models_comparison():
    """Test 3: Porównanie modeli GLM"""
    print("\n[TEST 3] Model comparison")
    print("-" * 60)

    api_key = load_api_key()
    if not api_key:
        return False

    models = ["glm-4-flash", "glm-4.7"]
    prompt = "Write hello world in Python"

    for model in models:
        client = GLMClient(api_key)
        result = client.call(prompt=prompt, model=model, max_tokens=100)

        if "error" in result:
            print(f"   {model:15} [X] {result['error'][:50]}")
        else:
            tokens = result['usage'].get('total_tokens', '?')
            print(f"   {model:15} [OK] {tokens} tokens")

    return True

def main():
    print("=" * 60)
    print("  GLM API Connection Test")
    print("=" * 60)

    # Wczytaj API key
    api_key = load_api_key()
    if not api_key:
        sys.exit(1)

    print(f"\n[OK] API Key loaded: {api_key[:10]}...{api_key[-4:]}")

    # Testy
    client = GLMClient(api_key)

    test1_ok = test_simple_call(client)
    if not test1_ok:
        print("\n[X] Test 1 failed - sprawdz API key i polaczenie")
        sys.exit(1)

    test2_ok = test_with_context(client)
    if not test2_ok:
        print("\n[!] Test 2 failed - ale API dziala")

    test3_ok = test_models_comparison()

    # Summary
    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    print(f"  Test 1 (Simple):        {'[OK] PASS' if test1_ok else '[X] FAIL'}")
    print(f"  Test 2 (Context):       {'[OK] PASS' if test2_ok else '[X] FAIL'}")
    print(f"  Test 3 (Models):        {'[OK] PASS' if test3_ok else '[X] FAIL'}")
    print()

    if test1_ok:
        print("[SUCCESS] GLM API dziala! Mozesz rozpoczac testy porownawcze.")
        print("   Nastepny krok: QUICKSTART.md")
    else:
        print("[FAIL] GLM API nie dziala. Sprawdz:")
        print("   1. Czy klucz API jest prawidlowy")
        print("   2. Czy masz tokeny na koncie: https://open.bigmodel.cn/usercenter/apikeys")
        print("   3. Czy masz polaczenie z internetem")

if __name__ == "__main__":
    main()
