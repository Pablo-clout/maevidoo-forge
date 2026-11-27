#!/usr/bin/env python3
"""Forge safety matcher — the one place that reads the deny catalogue.

Host-neutral. Every host hook (Claude Code, Cursor, Antigravity) translates its own
payload into a command string, calls `check(command)` and translates the answer back.
No host format is known here.

    check(command) -> (decision, rule_id, reason)
      decision: "allow" | "deny"
      rule_id:  the deny rule that matched (or the allow rule that overrode it), else None

A deny match may be overridden by an `allow_if_matches` entry (read-only statement shapes).

CLI (for a host with no Python hook of its own): the command on stdin, one JSON line on
stdout: {"decision": ..., "rule": ..., "reason": ...}. Exit 0 = allow, 2 = deny.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

CATALOG = Path(__file__).resolve().parent / "deny-patterns.yml"

# Fallback if YAML cannot be parsed (keep in sync with deny-patterns.yml)
FALLBACK_PATTERNS = [
    ("db-drop", r"\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|COLLECTION|USER|VIEW|SEQUENCE)\b"),
    ("db-truncate", r"\bTRUNCATE\s+(TABLE\s+)?\w"),
    ("db-delete-nowhere", r"\bDELETE\s+FROM\s+\w+\s*(;|\"|')?\s*$"),
    (
        "db-migrate-reset",
        r"migrate\s+reset|prisma\s+migrate\s+reset|flyway\s+clean|rails\s+db:(drop|reset)|artisan\s+migrate:fresh",
    ),
    (
        "db-nosql-wipe",
        r"dropDatabase\s*\(|db\.\w+\.drop\s*\(|redis-cli\s+[^\n]*\bFLUSH(ALL|DB)\b",
    ),
    ("exfil-pipe-shell", r"curl\s+[^\n|]*\|\s*(ba|z)?sh|wget\s+[^\n|]*\|\s*(ba|z)?sh"),
    (
        "exfil-paste-hosts",
        r"(curl|wget)\s+[^\n]*(pastebin\.|gist\.github|hastebin|transfer\.sh|webhook\.site|requestbin|ngrok\.io)",
    ),
    (
        "secrets-env-print",
        r"\b(cat|head|tail|less|more|bat|strings)\s+[^\n]*\.env(\.\w+)?\b|printenv\s+|env\s*\|\s*grep",
    ),
    (
        "secrets-publish",
        r"\bnpm\s+publish\b|\bpypi\b.*upload|\btwine\s+upload\b|\bdocker\s+push\b|\bcargo\s+publish\b",
    ),
    (
        "fs-rm-rootish",
        r"\brm\s+(-[a-zA-Z]*f[a-zA-Z]*|--force).*(\s/|\s~(/|\s|$)|/\*|~\*)",
    ),
    ("vcs-force-push", r"git\s+push\s+[^\n]*(--force\b|--force-with-lease\b|\s-f\b)"),
]

FALLBACK_ALLOWS = [
    ("readonly-psql", r"^[^;|&]*\bpsql\b[^;|&]*(-c|--command)[ =][\"']?\s*SELECT\b[^;]*$"),
]


def _rows(data: dict, key: str) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    for row in data.get(key) or []:
        rid = str(row.get("id") or "rule")
        rx = str(row.get("regex") or "")
        if rx:
            out.append((rid, rx))
    return out


def _minimal_parse(text: str) -> tuple[list[tuple[str, str]], list[tuple[str, str]]]:
    """Line-based parse for hosts without PyYAML: honors the two list sections."""
    denies: list[tuple[str, str]] = []
    allows: list[tuple[str, str]] = []
    section = "patterns"
    current_id = "rule"
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("allow_if_matches:"):
            section = "allow"
            continue
        if s.startswith("patterns:"):
            section = "patterns"
            continue
        if s.startswith("- id:"):
            current_id = s.split(":", 1)[1].strip()
        if s.startswith("regex:"):
            raw = s.split(":", 1)[1].strip()
            if (raw.startswith("'") and raw.endswith("'")) or (
                raw.startswith('"') and raw.endswith('"')
            ):
                quote = raw[0]
                raw = raw[1:-1]
                if quote == "'":
                    raw = raw.replace("''", "'")
            if raw:
                (allows if section == "allow" else denies).append((current_id, raw))
    return denies, allows


def load_rules() -> tuple[list[tuple[str, str]], list[tuple[str, str]]]:
    if not CATALOG.is_file():
        return FALLBACK_PATTERNS, FALLBACK_ALLOWS
    text = CATALOG.read_text(encoding="utf-8")
    try:
        import yaml  # type: ignore

        data = yaml.safe_load(text) or {}
        denies = _rows(data, "patterns")
        allows = _rows(data, "allow_if_matches")
    except Exception:
        denies, allows = _minimal_parse(text)
    if not denies:
        return FALLBACK_PATTERNS, FALLBACK_ALLOWS
    return denies, allows


def check(command: str) -> tuple[str, str | None, str]:
    denies, allows = load_rules()
    for pid, rx in denies:
        try:
            if not re.search(rx, command, flags=re.IGNORECASE | re.DOTALL):
                continue
        except re.error:
            continue
        # Deny matched — check allow overrides (read-only shapes)
        for aid, arx in allows:
            try:
                if re.search(arx, command, flags=re.IGNORECASE):
                    return "allow", aid, f"Forge safety: {pid} overridden by {aid}"
            except re.error:
                continue
        return (
            "deny",
            pid,
            f"Forge safety: blocked ({pid}). See packs/safety/rules/denied-actions.md",
        )
    return "allow", None, ""


def main() -> int:
    decision, rule, reason = check(sys.stdin.read())
    sys.stdout.write(json.dumps({"decision": decision, "rule": rule, "reason": reason}))
    return 2 if decision == "deny" else 0


if __name__ == "__main__":
    raise SystemExit(main())
