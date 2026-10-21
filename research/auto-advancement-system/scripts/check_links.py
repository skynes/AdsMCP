#!/usr/bin/env python3
"""Extract and HTTP-check links in markdown docs. MCP 401 = OK (auth required)."""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = ("example.ru", "yourcompany", "YOUR_API")
URL_RE = re.compile(r"https?://[^\s\)\]`>\"',|\]]+")

AUTH_OK_PREFIXES = (
    "https://mcp.",
    "https://api.catchr.io/mcp",
    "https://advertising-ai.amazon.com/mcp",
    "https://suggestions.dadata.ru/",
    "https://data.trueclicks.com/mcp",
    "https://connector.get-ryze.ai/mcp",
    "https://backend.hyperfx.ai/mcp",
    "https://mcp.paidsync.ai/",
    "https://mcp.askads.ru/",
    "https://lidfly.ru/mcp/",
)


def check(url: str) -> tuple[str, str]:
    try:
        r = subprocess.run(
            [
                "curl", "-sL", "-o", "/dev/null", "-w", "%{http_code}|%{url_effective}",
                "--max-time", "15", "-A", "Mozilla/5.0 (LinkChecker/1.0)",
                url,
            ],
            capture_output=True,
            text=True,
            timeout=20,
        )
        parts = r.stdout.strip().split("|", 1)
        code = parts[0] if parts else "000"
        final = parts[1] if len(parts) > 1 else url
        return code, final
    except Exception:
        return "ERR", url


def main() -> int:
    dirs = [ROOT, ROOT.parent / "adsMCP"]
    urls: set[str] = set()
    for d in dirs:
        if not d.exists():
            continue
        for f in d.rglob("*.md"):
            for m in URL_RE.finditer(f.read_text(errors="ignore")):
                u = m.group(0).rstrip(".,;:")
                if not any(s in u for s in SKIP):
                    urls.add(u)

    broken = []
    auth_ok = []
    ok = []

    for url in sorted(urls):
        code, final = check(url)
        if code in ("200", "201", "204"):
            ok.append((url, code))
        elif code in ("401", "403", "405", "406", "429") or any(
            url.startswith(p) for p in AUTH_OK_PREFIXES
        ):
            if code in ("401", "403", "405", "406"):
                auth_ok.append((url, code))
            else:
                ok.append((url, code))
        elif code in ("301", "302", "307", "308"):
            ok.append((url, f"{code}->{final}"))
        else:
            broken.append((url, code, final))

    print(f"Checked {len(urls)} unique URLs")
    print(f"  OK: {len(ok)}")
    print(f"  Auth/block (expected): {len(auth_ok)}")
    print(f"  Broken: {len(broken)}")

    if broken:
        print("\nBROKEN:")
        for url, code, final in broken:
            print(f"  [{code}] {url}")
            if final != url:
                print(f"         -> {final}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
