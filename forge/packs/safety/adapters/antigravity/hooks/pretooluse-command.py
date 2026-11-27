#!/usr/bin/env python3
"""Antigravity PreToolUse (run_command) → Forge safety deny catalogue.

Translates Antigravity's payload for the neutral matcher catalog/matcher.py
(no duplicated patterns — single SSOT catalog/deny-patterns.yml, incl. allow_if_matches).

Antigravity stdin:  {"toolCall": {"name": "run_command", "args": {"CommandLine": "..."}}}
Antigravity stdout: {"decision": "allow"|"deny"|"force_ask", "reason"?: "..."}

Fail-safe posture: this hook is matched on `run_command`. If the payload cannot
be parsed, the command key is missing (e.g. host schema change), or the matcher
is unavailable, return `force_ask` instead of `allow` so the guard never
disables itself silently. Only explicitly non-`run_command` tools return `allow`.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
# HERE = .../packs/safety/adapters/antigravity/hooks → parents[2] = packs/safety/
MATCHER = HERE.parents[2] / "catalog" / "matcher.py"

def load_matcher(path: Path):
    """The neutral matcher, loaded by file path (the folder is not a Python package)."""
    sys.dont_write_bytecode = True  # leave no __pycache__ in the project
    spec = importlib.util.spec_from_file_location("forge_safety_matcher", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def emit(decision: str, reason: str | None = None) -> int:
    payload: dict[str, str] = {"decision": decision}
    if reason:
        payload["reason"] = reason
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()
    return 0


def main() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        return emit("force_ask", "Forge safety: empty PreToolUse payload — cannot verify command")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return emit("force_ask", "Forge safety: invalid JSON in PreToolUse payload — cannot verify command")

    if not isinstance(data, dict):
        return emit("force_ask", "Forge safety: unexpected PreToolUse payload shape — cannot verify command")

    tool_call = data.get("toolCall")
    if not isinstance(tool_call, dict):
        return emit("force_ask", "Forge safety: missing toolCall in PreToolUse payload — cannot verify command")

    tool_name = str(tool_call.get("name") or "")
    if tool_name and tool_name != "run_command":
        return emit("allow")

    args = tool_call.get("args")
    if isinstance(args, str):
        try:
            args = json.loads(args)
        except json.JSONDecodeError:
            return emit("force_ask", "Forge safety: unreadable toolCall.args — cannot verify command")

    if not isinstance(args, dict):
        return emit("force_ask", "Forge safety: missing toolCall.args — cannot verify command")

    command = str(args.get("CommandLine") or "")
    if not command.strip():
        return emit("force_ask", "Forge safety: could not read CommandLine from run_command payload")

    try:
        decision, _rule, reason = load_matcher(MATCHER).check(command)
    except Exception as exc:  # matcher missing or broken: the guard must not switch itself off
        return emit(
            "force_ask",
            f"Forge safety: safety matcher unavailable ({type(exc).__name__}) — cannot verify command",
        )

    if decision == "deny":
        return emit("deny", reason)
    return emit("allow")


if __name__ == "__main__":
    raise SystemExit(main())
