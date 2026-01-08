#!/usr/bin/env python3
"""
Hybrid Proxy: Routes Opus to Claude, Sonnet/Haiku to GLM
Run this locally, point Claude Code to localhost

Usage:
1. Start proxy: python hybrid_proxy.py
2. Configure ~/.claude/settings.json:
   {
     "env": {
       "ANTHROPIC_BASE_URL": "http://localhost:8080"
     }
   }
3. Run claude - Opus goes to Claude, Sonnet/Haiku to GLM
"""

import http.server
import http.client
import ssl
import json
import os
from urllib.parse import urlparse

# Configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "")  # Or read from config.json

# Model routing
MODEL_ROUTING = {
    # Opus variants → Claude
    "claude-opus-4-5-20251101": "anthropic",
    "claude-3-opus": "anthropic",
    "opus": "anthropic",

    # Sonnet variants → GLM
    "claude-sonnet-4-20250514": "glm",
    "claude-3-5-sonnet": "glm",
    "claude-3-sonnet": "glm",
    "sonnet": "glm",

    # Haiku variants → GLM
    "claude-3-5-haiku": "glm",
    "claude-3-haiku": "glm",
    "haiku": "glm",
}

# GLM model mapping
GLM_MODEL_MAP = {
    "claude-sonnet-4-20250514": "glm-4.7",
    "claude-3-5-sonnet": "glm-4.7",
    "claude-3-sonnet": "glm-4.7",
    "sonnet": "glm-4.7",
    "claude-3-5-haiku": "glm-4.5-air",
    "claude-3-haiku": "glm-4.5-air",
    "haiku": "glm-4.5-air",
}

# API endpoints
ANTHROPIC_HOST = "api.anthropic.com"
ZHIPU_HOST = "open.bigmodel.cn"
ZHIPU_PATH = "/api/paas/v4/chat/completions"


class HybridProxyHandler(http.server.BaseHTTPRequestHandler):

    def do_POST(self):
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        model = data.get("model", "")

        # Determine routing
        route = "anthropic"  # Default
        for model_pattern, target in MODEL_ROUTING.items():
            if model_pattern in model.lower():
                route = target
                break

        print(f"[PROXY] Model: {model} → {route.upper()}")

        if route == "glm":
            self.proxy_to_glm(data, model)
        else:
            self.proxy_to_anthropic(body)

    def proxy_to_anthropic(self, body):
        """Forward request to Anthropic API"""
        try:
            ctx = ssl.create_default_context()
            conn = http.client.HTTPSConnection(ANTHROPIC_HOST, timeout=300, context=ctx)

            headers = {
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }

            conn.request("POST", "/v1/messages", body=body, headers=headers)
            response = conn.getresponse()

            response_body = response.read()

            self.send_response(response.status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(response_body)

            conn.close()
            print(f"[PROXY] Anthropic response: {response.status}")

        except Exception as e:
            print(f"[PROXY] Anthropic error: {e}")
            self.send_error(500, str(e))

    def proxy_to_glm(self, data, original_model):
        """Forward request to GLM API (Z.AI)"""
        try:
            # Map model
            glm_model = GLM_MODEL_MAP.get(original_model, "glm-4.7")
            for pattern, mapped in GLM_MODEL_MAP.items():
                if pattern in original_model.lower():
                    glm_model = mapped
                    break

            # Convert Anthropic format to OpenAI/GLM format
            messages = data.get("messages", [])
            glm_messages = []

            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")

                # Handle content blocks
                if isinstance(content, list):
                    text_parts = []
                    for block in content:
                        if isinstance(block, dict) and block.get("type") == "text":
                            text_parts.append(block.get("text", ""))
                        elif isinstance(block, str):
                            text_parts.append(block)
                    content = "\n".join(text_parts)

                glm_messages.append({"role": role, "content": content})

            glm_payload = {
                "model": glm_model,
                "messages": glm_messages,
                "max_tokens": data.get("max_tokens", 4096),
                "temperature": data.get("temperature", 0.7),
            }

            ctx = ssl.create_default_context()
            conn = http.client.HTTPSConnection(ZHIPU_HOST, timeout=300, context=ctx)

            body = json.dumps(glm_payload, ensure_ascii=False).encode('utf-8')
            headers = {
                "Authorization": f"Bearer {ZHIPU_API_KEY}",
                "Content-Type": "application/json; charset=utf-8",
            }

            conn.request("POST", ZHIPU_PATH, body=body, headers=headers)
            response = conn.getresponse()

            glm_response = json.loads(response.read().decode('utf-8'))

            # Convert GLM response to Anthropic format
            if response.status == 200:
                anthropic_response = {
                    "id": glm_response.get("id", "msg_glm"),
                    "type": "message",
                    "role": "assistant",
                    "content": [{
                        "type": "text",
                        "text": glm_response["choices"][0]["message"]["content"]
                    }],
                    "model": f"glm-proxy-{glm_model}",
                    "stop_reason": glm_response["choices"][0].get("finish_reason", "end_turn"),
                    "usage": {
                        "input_tokens": glm_response.get("usage", {}).get("prompt_tokens", 0),
                        "output_tokens": glm_response.get("usage", {}).get("completion_tokens", 0),
                    }
                }

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(anthropic_response).encode('utf-8'))
            else:
                self.send_response(response.status)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(glm_response).encode('utf-8'))

            conn.close()
            print(f"[PROXY] GLM ({glm_model}) response: {response.status}")

        except Exception as e:
            print(f"[PROXY] GLM error: {e}")
            self.send_error(500, str(e))

    def log_message(self, format, *args):
        # Suppress default logging
        pass


def main():
    # Load API keys
    global ANTHROPIC_API_KEY, ZHIPU_API_KEY

    if not ANTHROPIC_API_KEY:
        ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

    if not ZHIPU_API_KEY:
        # Try to load from config
        try:
            config_path = os.path.join(os.path.dirname(__file__), "..", "config.json")
            with open(config_path) as f:
                config = json.load(f)
                ZHIPU_API_KEY = config.get("zhipu_api_key", "")
        except:
            pass

    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set!")
        print("Set it: export ANTHROPIC_API_KEY=your_key")
        return

    if not ZHIPU_API_KEY:
        print("ERROR: ZHIPU_API_KEY not set!")
        print("Set it: export ZHIPU_API_KEY=your_key or add to config.json")
        return

    port = 8080
    server = http.server.HTTPServer(("localhost", port), HybridProxyHandler)

    print("=" * 60)
    print("HYBRID PROXY - Claude Opus + GLM Sonnet/Haiku")
    print("=" * 60)
    print(f"Listening on: http://localhost:{port}")
    print()
    print("Routing:")
    print("  Opus    → Anthropic (Claude)")
    print("  Sonnet  → Z.AI (GLM-4.7)")
    print("  Haiku   → Z.AI (GLM-4.5-Air)")
    print()
    print("Configure Claude Code:")
    print('  ~/.claude/settings.json:')
    print('  {')
    print('    "env": {')
    print(f'      "ANTHROPIC_BASE_URL": "http://localhost:{port}"')
    print('    }')
    print('  }')
    print()
    print("Press Ctrl+C to stop")
    print("=" * 60)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nProxy stopped.")


if __name__ == "__main__":
    main()
