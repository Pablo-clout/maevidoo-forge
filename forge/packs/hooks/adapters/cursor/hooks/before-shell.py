#!/usr/bin/env python3
"""Cursor beforeShellExecution → Forge safety deny catalogue.

Translates Cursor's payload for the neutral matcher `packs/safety/catalog/matcher.py`
(no duplicated patterns).
Cursor stdin: {"command": "..."}; stdout: {"permission": "allow"|"deny"|"ask", ...}.

Cannot tell (unreadable payload, no command, matcher missing) → "ask": the human decides.
Never a silent allow.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
# HERE = .../packs/hooks/adapters/cursor/hooks → parents[3] = packs/
MATCHER = HERE.parents[3] / "safety" / "catalog" / "matcher.py"

def load_matcher(path: Path):
    """The neutral matcher, loaded by file path (the folder is not a Python package)."""
    sys.dont_write_bytecode = True  # leave no __pycache__ in the project
    spec = importlib.util.spec_from_file_location("forge_safety_matcher", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def emit(permission: str, reason: str = "") -> None:
    payload: dict[str, str] = {"permission": permission}
    if reason:
        payload["user_message"] = reason
        payload["agent_message"] = reason
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()


def ask(why: str) -> int:
    emit("ask", f"Forge safety: {why} — cannot verify this command")
    return 0


def main() -> int:
    try:
        data = json.loads(sys.stdin.read())
    except json.JSONDecodeError:
        return ask("unreadable hook payload")
    if not isinstance(data, dict):
        return ask("unexpected hook payload")

    tool_input = data.get("tool_input")
    command = str(
        data.get("command")
        or (tool_input.get("command") if isinstance(tool_input, dict) else "")
        or ""
    )
    if not command.strip():
        return ask("no command found in the shell hook payload")

    try:
        decision, _rule, reason = load_matcher(MATCHER).check(command)
    except Exception as exc:  # pack safety missing or broken
        return ask(f"safety matcher unavailable ({type(exc).__name__}); install pack safety")

    if decision == "deny":
        emit("deny", reason)
        return 2
    emit("allow")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
