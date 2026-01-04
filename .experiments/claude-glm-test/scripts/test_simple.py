#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Najprostszy możliwy test GLM API"""
import sys
import os
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import requests
import json

API_KEY = "53f16a94eb6b4b50a4ca97142644259b.5etWYWJn5LDFD6BM"
URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

# Różne modele do przetestowania
MODELS = [
    "glm-4-flash",      # Najtańszy/najszybszy
    "glm-4-plus",       # Standard
    "glm-4.7",          # Twój config
    "glm-4-long",       # Długi kontekst
]

for model in MODELS:
    print(f"\nTestuje model: {model}")
    print("-" * 40)

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 10
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(URL, headers=headers, json=payload, timeout=30)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Model dziala!")
            print(f"Tokens: {data.get('usage', {}).get('total_tokens', '?')}")
            break  # Znalezlismy dzialajacy model
        else:
            try:
                error_data = response.json()
                print(f"[X] Error: {error_data}")
            except:
                print(f"[X] Error (raw): {response.text[:100]}")
    except Exception as e:
        print(f"[X] Exception: {str(e)}")

print("\n" + "=" * 40)
