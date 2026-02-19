#!/usr/bin/env python3
"""
ZhipuAI GLM API Wrapper - Updated Version
Supports GLM-4.7 and GLM-4.5-Air with Deep Thinking
"""
import requests
import sys
import os
import json
import argparse
from pathlib import Path
from typing import List, Optional


def write_files_to_disk(files: List[dict], base_dir: str) -> dict:
    """
    Write generated files directly to disk, bypassing Claude context.

    Args:
        files: List of {"path": "...", "content": "..."} dicts
        base_dir: Base directory for relative paths

    Returns:
        dict with written files count and any errors
    """
    written = []
    errors = []

    for file_info in files:
        try:
            file_path = file_info.get("path", "")
            content = file_info.get("content", "")

            if not file_path:
                errors.append({"error": "Missing path in file entry"})
                continue

            # Resolve full path
            full_path = Path(base_dir) / file_path

            # Create parent directories if needed
            full_path.parent.mkdir(parents=True, exist_ok=True)

            # Write file
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)

            written.append({
                "path": str(full_path),
                "size": len(content),
                "lines": content.count('\n') + 1
            })
            print(f"  [WROTE] {full_path} ({len(content)} bytes)", file=sys.stderr)

        except Exception as e:
            errors.append({
                "path": file_info.get("path", "unknown"),
                "error": str(e)
            })
            print(f"  [ERROR] {file_info.get('path', 'unknown')}: {e}", file=sys.stderr)

    return {
        "written": written,
        "errors": errors,
        "total_written": len(written),
        "total_errors": len(errors)
    }


def extract_files_from_response(response_text: str) -> List[dict]:
    """
    Extract files array from GLM response (JSON or markdown code blocks).

    Returns list of {"path": ..., "content": ...} dicts
    """
    if not response_text:
        return []

    try:
        # Try to find JSON in response
        json_text = response_text

        # Extract from markdown code blocks
        if "```json" in response_text:
            start = response_text.index("```json") + 7
            try:
                end = response_text.index("```", start)
                json_text = response_text[start:end].strip()
            except ValueError:
                json_text = response_text[start:].strip()
        elif "```" in response_text:
            start = response_text.index("```") + 3
            try:
                end = response_text.index("```", start)
                json_text = response_text[start:end].strip()
            except ValueError:
                json_text = response_text[start:].strip()
        else:
            # Try to find JSON object
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]

        parsed = json.loads(json_text)

        # Return files array if present
        if isinstance(parsed, dict) and "files" in parsed:
            return parsed["files"]
        elif isinstance(parsed, list):
            return parsed

    except (json.JSONDecodeError, ValueError):
        pass

    return []


class GLMClient:
    """Client for ZhipuAI GLM API"""

    # Base URLs for different providers
    BASE_URLS = {
        "bigmodel": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        "zai": "https://api.z.ai/api/paas/v4/chat/completions"  # Z.AI global endpoint
    }

    # Model to provider mapping
    MODEL_PROVIDERS = {
        "glm-4-plus": "bigmodel",
        "glm-4-long": "bigmodel",
        "glm-4-flash": "bigmodel",
        "glm-4-0520": "bigmodel",
        "glm-4-air": "bigmodel",
        "glm-4-airx": "bigmodel",
        "glm-4-flashx": "bigmodel",
        "glm-4.7": "zai",
        "glm-4.5-air": "zai"
    }

    def __init__(self, api_key: str, provider: Optional[str] = None):
        self.api_key = api_key
        self.provider = provider
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def get_base_url(self, model: str) -> str:
        """Get appropriate base URL for the model"""
        if self.provider:
            return self.BASE_URLS[self.provider]

        provider = self.MODEL_PROVIDERS.get(model, "bigmodel")
        return self.BASE_URLS[provider]

    def read_file(self, path: str) -> str:
        """Read file from disk"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            return f"[ERROR reading {path}: {str(e)}]"

    def build_context(self, context_files: List[str]) -> str:
        """Build context from list of files"""
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
        max_tokens: int = 4096,
        enable_thinking: bool = False
    ) -> dict:
        """
        Call GLM API with prompt and optional context

        Args:
            prompt: Main prompt/task
            context_files: List of context file paths
            model: GLM model (glm-4-plus, glm-4-long, glm-4-flash, glm-4.7, glm-4.5-air)
            temperature: Temperature (0-1)
            max_tokens: Maximum response length
            enable_thinking: Enable Deep Thinking mode (for glm-4.7 and glm-4.5-air)

        Returns:
            dict with 'response', 'reasoning', 'usage', 'model'
        """
        # Build full prompt with context
        if context_files:
            context = self.build_context(context_files)
            full_prompt = f"""{context}

─────────────────────────────────────
TASK:
{prompt}
"""
        else:
            full_prompt = prompt

        # Payload for API
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": full_prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        # Add Deep Thinking parameter if enabled (Z.AI API format)
        if enable_thinking:
            payload["thinking"] = {"type": "enabled"}
            print(f"[DEBUG] Deep Thinking enabled for {model}", file=sys.stderr)

        # Get appropriate base URL for the model
        base_url = self.get_base_url(model)

        # Call API
        try:
            print(f"[DEBUG] Calling {model} with {len(full_prompt)} chars prompt", file=sys.stderr)
            print(f"[DEBUG] Using endpoint: {base_url}", file=sys.stderr)

            response = requests.post(
                base_url,
                headers=self.headers,
                json=payload,
                timeout=1200  # 20 min timeout for long code generation
            )
            print(f"[DEBUG] Response status: {response.status_code}", file=sys.stderr)

            # Debug: print raw response for error cases
            if response.status_code != 200:
                print(f"[DEBUG] Response body: {response.text}", file=sys.stderr)

            response.raise_for_status()
            data = response.json()

            # Extract response and reasoning content
            message = data["choices"][0]["message"]
            response_content = message.get("content", "")
            reasoning_content = message.get("reasoning_content", None)

            result = {
                "response": response_content,
                "usage": data.get("usage", {}),
                "model": data.get("model", model),
                "finish_reason": data["choices"][0].get("finish_reason", "unknown")
            }

            # Add reasoning if present
            if reasoning_content:
                result["reasoning"] = reasoning_content
                print(f"[DEBUG] Reasoning content present ({len(reasoning_content)} chars)", file=sys.stderr)

            # Print usage stats
            usage = result.get("usage", {})
            if usage:
                print(f"[DEBUG] Usage - Prompt: {usage.get('prompt_tokens', '?')}, "
                      f"Completion: {usage.get('completion_tokens', '?')}, "
                      f"Total: {usage.get('total_tokens', '?')}", file=sys.stderr)

            return result

        except requests.exceptions.HTTPError as e:
            error_msg = str(e)
            try:
                error_data = e.response.json()
                error_msg = f"{error_msg}\nAPI Error: {json.dumps(error_data, indent=2)}"
            except:
                error_msg = f"{error_msg}\nResponse: {e.response.text}"

            return {
                "error": error_msg,
                "response": None,
                "usage": {}
            }
        except requests.exceptions.RequestException as e:
            return {
                "error": str(e),
                "response": None,
                "usage": {}
            }


def main():
    parser = argparse.ArgumentParser(
        description="Call ZhipuAI GLM API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Standard call with GLM-4-Plus
  python glm_call_updated.py -p "Explain quantum computing"

  # GLM-4.7 with Deep Thinking
  python glm_call_updated.py -m glm-4.7 --thinking -p "Solve complex problem"

  # With context files
  python glm_call_updated.py -c file1.txt file2.txt -p "Analyze these"

  # GLM-4.5-Air (fast, cheap)
  python glm_call_updated.py -m glm-4.5-air -p "Quick task"
        """
    )

    parser.add_argument("--prompt", "-p", help="Prompt (or stdin)", default=None)
    parser.add_argument("--context", "-c", nargs="+", help="Context files", default=[])
    parser.add_argument("--model", "-m", default="glm-4-plus",
                       choices=["glm-4-plus", "glm-4-long", "glm-4-flash",
                               "glm-4-0520", "glm-4-air", "glm-4-airx", "glm-4-flashx",
                               "glm-4.7", "glm-4.5-air"],
                       help="GLM model (default: glm-4-plus)")
    parser.add_argument("--thinking", dest="thinking", action="store_true",
                       help="Enable Deep Thinking mode (for glm-4.7, glm-4.5-air)")
    parser.add_argument("--no-thinking", dest="thinking", action="store_false",
                       help="Disable Deep Thinking mode")
    parser.set_defaults(thinking=False)
    parser.add_argument("--temperature", "-t", type=float, default=0.7,
                       help="Temperature (0-1, default: 0.7)")
    parser.add_argument("--max-tokens", type=int, default=4096,
                       help="Max tokens (default: 4096)")
    parser.add_argument("--output", "-o", help="Save result to file")
    parser.add_argument("--json", action="store_true",
                       help="Return full JSON with metadata (including reasoning)")
    parser.add_argument("--provider", choices=["bigmodel", "zai"],
                       help="Force specific provider (auto-detected by default)")
    parser.add_argument("--auto-write", action="store_true",
                       help="Auto-write generated files to disk (bypasses Claude context)")
    parser.add_argument("--base-dir", default=".",
                       help="Base directory for --auto-write (default: current dir)")

    args = parser.parse_args()

    # Get API key from environment (preferred) or config (fallback)
    api_key = os.getenv("ZHIPU_API_KEY")

    if not api_key:
        # Fallback to config.json (deprecated - use env var instead)
        config_path = Path(__file__).parent.parent / "config.json"
        if config_path.exists():
            with open(config_path) as f:
                config = json.load(f)
                api_key = config.get("zhipu_api_key")

    if not api_key:
        print("ERROR: No API key! Set ZHIPU_API_KEY environment variable", file=sys.stderr)
        sys.exit(1)

    # Get prompt
    if args.prompt:
        prompt = args.prompt
    else:
        prompt = sys.stdin.read()

    # Call GLM
    client = GLMClient(api_key, provider=args.provider)
    result = client.call(
        prompt=prompt,
        context_files=args.context,
        model=args.model,
        temperature=args.temperature,
        max_tokens=args.max_tokens,
        enable_thinking=args.thinking
    )

    # Handle errors
    if "error" in result and result["error"]:
        print(f"ERROR: {result['error']}", file=sys.stderr)
        # Don't exit with 1 - return error in output instead
        print(json.dumps({"success": False, "error": result["error"]}))
        return

    # AUTO-WRITE MODE: Extract files from response and write directly to disk
    if args.auto_write:
        response_text = result.get("response", "")
        files = extract_files_from_response(response_text)

        if files:
            print(f"[AUTO-WRITE] Extracting {len(files)} files from response...", file=sys.stderr)
            write_result = write_files_to_disk(files, args.base_dir)

            # Print summary only (no file contents in output)
            usage = result.get('usage', {})
            print(f"\n[GLM] AUTO-WRITE COMPLETE")
            print(f"  Model: {result.get('model', args.model)}")
            print(f"  Tokens: {usage.get('total_tokens', '?')} (prompt: {usage.get('prompt_tokens', '?')}, completion: {usage.get('completion_tokens', '?')})")
            print(f"  Files written: {write_result['total_written']}")
            print(f"  Errors: {write_result['total_errors']}")
            for f in write_result.get("written", []):
                print(f"    - {f['path']} ({f['lines']} lines, {f['size']} bytes)")
            for e in write_result.get("errors", []):
                print(f"    [ERR] {e.get('path')}: {e.get('error')}")

            # Optionally save full JSON for debugging
            if args.output:
                debug_output = {
                    "success": True,
                    "model": result.get("model"),
                    "usage": usage,
                    "write_result": write_result,
                    "files_written": [f["path"] for f in write_result.get("written", [])]
                }
                with open(args.output, 'w', encoding='utf-8') as f:
                    f.write(json.dumps(debug_output, indent=2, ensure_ascii=False))
                print(f"  Debug JSON: {args.output}")
        else:
            print(f"[AUTO-WRITE] No files found in response. Raw response saved.", file=sys.stderr)
            if args.output:
                with open(args.output, 'w', encoding='utf-8') as f:
                    f.write(result.get("response", ""))
            else:
                print(result.get("response", ""))
        return

    # Standard output mode
    if args.json:
        output = json.dumps(result, indent=2, ensure_ascii=False)
    else:
        # If reasoning is present, show it separately
        if "reasoning" in result and result["reasoning"]:
            output = f"=== REASONING ===\n{result['reasoning']}\n\n=== RESPONSE ===\n{result['response']}"
        else:
            output = result["response"]

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"Saved to {args.output}", file=sys.stderr)
        usage = result.get('usage', {})
        if usage:
            print(f"Tokens: {usage.get('total_tokens', '?')} "
                  f"(prompt: {usage.get('prompt_tokens', '?')}, "
                  f"completion: {usage.get('completion_tokens', '?')})", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
