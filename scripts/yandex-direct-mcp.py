#!/usr/bin/env python3
"""Run the ZAI.ONE Yandex MCP (modules/yandex-direct) for AdsMCP over stdio.

AdsMCP's module bridge starts this script as a stdio MCP server. The launcher:

* uses the isolated dependency tree modules/yandex-direct-deps (FastMCP 3.4.4,
  pinned like the upstream uv.lock) instead of the global Python packages;
* reads ADS_YANDEX_* settings from the ignored AdsMCP .env and maps them to the
  YANDEX_* names the module expects (credentials stay in private token files);
* maps the AdsMCP write switch to the provider's ``YANDEX_DIRECT_WRITE_ENABLED``
  flag; the AdsMCP tool layer still requires an explicit ``confirm=true``;
  Metrika, Webmaster and paid Wordstat writes remain disabled;
* stores the module's SQLite journal in ADS_MCP_DATA/yandex-direct/.

Nothing is printed to stdout except the MCP protocol; diagnostics go to stderr
and never include credential values.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
DEFAULT_MODULE_DIR = ROOT / "modules" / "yandex-direct"
DEPS_DIR = ROOT / "modules" / "yandex-direct-deps"

# AdsMCP .env name -> name expected by zai_yandex.config.ServiceConfig.from_env()
ENV_MAP = {
    "ADS_YANDEX_DIRECT_TOKEN_FILE": "YANDEX_DIRECT_TOKEN_FILE",
    "ADS_YANDEX_DIRECT_CLIENT_LOGIN": "YANDEX_DIRECT_CLIENT_LOGIN",
    "ADS_YANDEX_METRIKA_TOKEN_FILE": "YANDEX_METRIKA_TOKEN_FILE",
    "ADS_YANDEX_WEBMASTER_TOKEN_FILE": "YANDEX_WEBMASTER_TOKEN_FILE",
    "ADS_YANDEX_ACCOUNT_ID": "YANDEX_ACCOUNT_ID",
}
FIXED_READ_ONLY_FLAGS = {
    "YANDEX_METRIKA_WRITE_ENABLED": "false",
    "YANDEX_WEBMASTER_WRITE_ENABLED": "false",
    "YANDEX_WORDSTAT_LIVE_ENABLED": "false",
}
TRUE_VALUES = {"1", "true", "yes", "on"}


def fail(message: str) -> None:
    print(f"yandex-direct-mcp: {message}", file=sys.stderr)
    sys.exit(2)


def read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key] = value
    return values


def resolve_data_root(source: dict[str, str]) -> Path:
    configured = source.get("ADS_MCP_DATA", "").strip()
    if not configured:
        return ROOT / "data"
    path = Path(configured)
    return path.resolve() if path.is_absolute() else (ROOT / path).resolve()


def resolve_local_file(value: str, data_root: Path) -> str:
    path = Path(value)
    if path.is_absolute():
        return str(path)
    normalized = value.replace("\\", "/").removeprefix("./")
    if normalized == "data" or normalized.startswith("data/"):
        suffix = normalized[5:] if normalized.startswith("data/") else ""
        return str((data_root / suffix).resolve())
    return str((ROOT / path).resolve())


def main() -> None:
    extra = sys.argv[1:]
    if any(arg != "--check-config" for arg in extra):
        fail("only --check-config is supported; transport and settings are fixed by AdsMCP")

    source = {**read_env_file(ENV_FILE), **os.environ}
    data_root = resolve_data_root(source)
    state_path = data_root / "yandex-direct" / "yandex.sqlite"
    module_dir = Path(source.get("ADS_YANDEX_MCP_DIR", "").strip() or DEFAULT_MODULE_DIR)
    if not module_dir.is_absolute():
        module_dir = ROOT / module_dir
    if not (module_dir / "src" / "zai_yandex").is_dir():
        fail(f"Yandex MCP checkout not found: {module_dir}")
    if not DEPS_DIR.is_dir():
        fail(
            f"dependency tree not found: {DEPS_DIR}. Install it with: python -m pip install "
            '--target modules\\yandex-direct-deps "fastmcp==3.4.4" "httpx==0.28.1"'
        )

    # Only the mapped values reach the module: inherited YANDEX_* variables
    # (including a stray *_WRITE_ENABLED=true) are dropped. The one supported
    # write switch is deliberately namespaced under ADS_* in the AdsMCP .env.
    for key in [name for name in os.environ if name.startswith("YANDEX_")]:
        del os.environ[key]
    for ads_name, module_name in ENV_MAP.items():
        value = source.get(ads_name, "").strip()
        if not value:
            continue
        if module_name.endswith("_FILE") and not os.path.isabs(value):
            value = resolve_local_file(value, data_root)
        os.environ[module_name] = value

    state_path.parent.mkdir(parents=True, exist_ok=True)
    os.environ["YANDEX_STATE_PATH"] = str(state_path)
    os.environ["YANDEX_LOCAL_PRINCIPAL"] = "adsmcp"
    direct_write_enabled = source.get("ADS_YANDEX_DIRECT_WRITE_ENABLED", "").strip().lower() in TRUE_VALUES
    os.environ["YANDEX_DIRECT_WRITE_ENABLED"] = "true" if direct_write_enabled else "false"
    os.environ.update(FIXED_READ_ONLY_FLAGS)

    sys.path[:0] = [str(DEPS_DIR), str(module_dir / "src")]
    sys.argv = ["yandex-mcp", "--transport", "stdio", *extra]

    from zai_yandex.server import main as server_main

    server_main()


if __name__ == "__main__":
    main()
