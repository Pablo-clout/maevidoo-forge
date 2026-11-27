#!/usr/bin/env python3
"""Forge safety PreToolUse hook (Claude Code Bash).

Translates Claude Code's tool-call JSON (stdin) for the neutral matcher
`catalog/matcher.py`, which reads `catalog/deny-patterns.yml`. Does not load policy
into the LLM — this process is the enforcement plane.

- deny  → deny JSON on stdout, exit 2 (belt and braces: some versions read the exit code).
- allow → exit 0, nothing on stdout.
- cannot tell (unreadable payload, a Bash call with no command, matcher missing) →
  "ask" JSON on stdout, exit 0: the human decides. Never a silent allow.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MATCHER = HERE.parents[2] / "catalog" / "matcher.py"
SHELL_TOOLS = ("Bash", "bash", "Shell", "shell")

def load_matcher(path: Path):
    """The neutral matcher, loaded by file path (the folder is not a Python package)."""
    sys.dont_write_bytecode = True  # leave no __pycache__ in the project
    spec = importlib.util.spec_from_file_location("forge_safety_matcher", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def emit(decision: str, reason: str) -> None:
    payload = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": decision,
            "permissionDecisionReason": reason,
        }
    }
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()


def ask(why: str) -> int:
    emit("ask", f"Forge safety: {why} — cannot verify this command")
    return 0


def main() -> int:
    raw = sys.stdin.read()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return ask("unreadable hook payload")
    if not isinstance(data, dict):
        return ask("unexpected hook payload")

    tool = str(data.get("tool_name") or data.get("toolName") or "")
    # Only screen shell tools; anything else is not ours to judge.
    if tool and tool not in SHELL_TOOLS:
        return 0
    inp = data.get("tool_input") or data.get("toolInput") or {}
    if isinstance(inp, str):
        try:
            inp = json.loads(inp)
        except json.JSONDecodeError:
            inp = {"command": inp}
    command = str((inp or {}).get("command") or "") if isinstance(inp, dict) else ""
    if not command.strip():
        return ask("no command found in the shell tool call")

    try:
        decision, rule, reason = load_matcher(MATCHER).check(command)
    except Exception as exc:  # matcher missing or broken: the guard must not switch itself off
        return ask(f"safety matcher unavailable ({type(exc).__name__})")

    if decision == "deny":
        emit("deny", reason)
        sys.stderr.write(reason + "\n")
        return 2
    if rule:
        sys.stderr.write(reason + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
