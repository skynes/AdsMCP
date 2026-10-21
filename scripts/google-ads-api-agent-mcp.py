"""Expose the selected read-only surface of google-ads-api-agent over MCP.

The upstream repository is an agent/action package, not an MCP server.  This
thin adapter reuses its ToolExecutor and keeps the orchestration layer out of
AdsMCP.  Mutating actions are rejected unless explicitly enabled through
confirm=true.
"""

from __future__ import annotations

import json
import os
import sys
import types
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
AGENT_ROOT = Path(
    os.environ.get("ADS_GOOGLE_ADS_AGENT_ROOT", str(ROOT / "modules" / "google-ads-api-agent"))
).resolve()

if not AGENT_ROOT.is_dir():
    raise RuntimeError(f"Google Ads API Agent checkout not found: {AGENT_ROOT}")

# Import deploy.tool_executor without running deploy/__init__.py.  The latter
# imports the Anthropic orchestrator, which is not needed by this MCP adapter.
deploy_package = types.ModuleType("deploy")
deploy_package.__path__ = [str(AGENT_ROOT / "deploy")]
sys.modules.setdefault("deploy", deploy_package)
sys.path.insert(0, str(AGENT_ROOT))

from deploy.tool_executor import ToolExecutor  # noqa: E402
from deploy.tool_schemas import MAIN_AGENT_TOOLS, TOOL_TO_ACTION_FILE  # noqa: E402


READ_ONLY_ACTIONS: dict[str, set[str] | None] = {
    "label_manager": {"list_labels", "list_labeled_entities"},
    "conversion_tracking_manager": {"list_conversion_actions", "get_conversion_attribution"},
    "audience_manager": {"list_audiences", "get_audience_performance"},
    "asset_manager": {"list"},
    "budget_manager": {"list_budgets", "get_pacing"},
    "rsa_ad_manager": {"list"},
    "bid_keyword_manager": {"get_keyword_bids", "get_bid_modifiers"},
    "negative_keywords_manager": {"list_campaign_negatives", "list_shared_sets"},
    "campaign_adgroup_manager": {"list_campaigns", "find_campaign", "get_campaign", "list_ad_groups"},
    "account_access_checker": None,
    "experiments_manager": {"list_experiments", "get_experiment_results"},
    "check_user_access": None,
    "query_planner": None,
    "recommendations_manager": {"list", "get_impact"},
    "search_term_manager": None,
    "geo_location_manager": {
        "list_geo_performance",
        "list_targeted_locations",
        "list_excluded_locations",
        "search_geo_targets",
    },
    "device_performance_manager": {"list_device_performance", "get_recommendations"},
    "change_history_manager": None,
    "ad_schedule_manager": {"get_ad_schedule", "get_hourly_performance", "get_schedule_recommendations"},
    "bidding_strategy_manager": {"list_bidding_strategies"},
    "pmax_asset_group_manager": {"list_asset_groups", "get_asset_performance"},
}

TOOL_DESCRIPTIONS = {
    item["name"]: item.get("description", "")
    for item in MAIN_AGENT_TOOLS
    if item.get("name") in TOOL_TO_ACTION_FILE
}

NEVER_EXPOSED_TOOLS = {
    "package_installer",
    "cloudinary_creative_tools",
    "session_state_manager",
    "api_gateway",
}

EXECUTOR = ToolExecutor(repo_root=str(AGENT_ROOT))


def _is_read_only(tool_name: str, arguments: dict[str, Any]) -> bool:
    allowed_actions = READ_ONLY_ACTIONS.get(tool_name)
    if tool_name not in READ_ONLY_ACTIONS:
        return False
    if allowed_actions is None:
        return True
    action = arguments.get("action")
    return isinstance(action, str) and action in allowed_actions


def _safe_result(raw: str) -> dict[str, Any]:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {"result": raw}
    if isinstance(parsed, dict) and "traceback" in parsed:
        parsed.pop("traceback", None)
    return parsed if isinstance(parsed, dict) else {"result": parsed}


def google_ads_agent_catalog() -> dict[str, Any]:
    """List upstream action names and the local read/write policy."""

    return {
        "agent_root": str(AGENT_ROOT),
        "write_policy": "explicit confirm=true is required for every mutation",
        "tools": [
            {
                "name": name,
                "description": TOOL_DESCRIPTIONS.get(name, ""),
                "read_only_actions": (
                    sorted(READ_ONLY_ACTIONS[name])
                    if READ_ONLY_ACTIONS.get(name) is not None
                    else "all"
                ),
                "available": name not in NEVER_EXPOSED_TOOLS,
            }
            for name in TOOL_TO_ACTION_FILE
        ],
    }


def google_ads_agent_call(
    tool_name: str,
    arguments: dict[str, Any] | None = None,
    confirm: bool = False,
) -> dict[str, Any]:
    """Run one upstream Google Ads action through the guarded ToolExecutor."""

    call_arguments = arguments or {}
    if tool_name not in TOOL_TO_ACTION_FILE:
        return {"error": f"Unknown Google Ads Agent tool: {tool_name}"}
    if tool_name in NEVER_EXPOSED_TOOLS:
        return {"error": f"Tool is disabled by AdsMCP policy: {tool_name}"}
    if not _is_read_only(tool_name, call_arguments) and confirm is not True:
        return {
            "error": "Explicit user confirmation is required for this write action",
            "tool": tool_name,
            "action": call_arguments.get("action"),
            "hint": "Repeat the call with confirm=true after the user explicitly approves the mutation",
        }
    return _safe_result(EXECUTOR.execute(tool_name, call_arguments))


TOOLS = [
    {
        "name": "google_ads_agent_catalog",
        "description": "List upstream Google Ads Agent actions and the local read/write policy.",
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
    },
    {
        "name": "google_ads_agent_call",
        "description": "Run one upstream Google Ads action through the guarded ToolExecutor.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "tool_name": {"type": "string", "enum": sorted(TOOL_TO_ACTION_FILE)},
                "arguments": {"type": "object", "additionalProperties": True},
                "confirm": {
                    "type": "boolean",
                    "default": False,
                    "description": "Must be true only after explicit user approval of a provider mutation.",
                },
            },
            "required": ["tool_name"],
            "additionalProperties": False,
        },
    },
]


def _read_message() -> dict[str, Any] | None:
    line = sys.stdin.buffer.readline()
    if not line:
        return None
    parsed = json.loads(line.decode("utf-8"))
    if not isinstance(parsed, dict):
        raise ValueError("MCP message must be a JSON object")
    return parsed


def _write_message(payload: dict[str, Any]) -> None:
    encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    sys.stdout.buffer.write(encoded + b"\n")
    sys.stdout.buffer.flush()


def _tool_result(value: dict[str, Any], is_error: bool = False) -> dict[str, Any]:
    return {
        "content": [{"type": "text", "text": json.dumps(value, ensure_ascii=False)}],
        "isError": is_error,
        "structuredContent": value,
    }


def _handle(request: dict[str, Any]) -> dict[str, Any] | None:
    method = request.get("method")
    request_id = request.get("id")
    if request_id is None:
        return None
    if method == "initialize":
        params = request.get("params") or {}
        requested = params.get("protocolVersion", "2024-11-05")
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "protocolVersion": requested,
                "capabilities": {"tools": {"listChanged": False}},
                "serverInfo": {"name": "Google Ads API Agent", "version": "0.1.0"},
                "instructions": (
                    "Use google_ads_agent_catalog before google_ads_agent_call. "
                    "Read-only actions are enabled by default; writes require an explicit local opt-in."
                ),
            },
        }
    if method == "ping":
        return {"jsonrpc": "2.0", "id": request_id, "result": {}}
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": request_id, "result": {"tools": TOOLS}}
    if method == "tools/call":
        params = request.get("params") or {}
        name = params.get("name")
        arguments = params.get("arguments") or {}
        try:
            if name == "google_ads_agent_catalog":
                value = google_ads_agent_catalog()
            elif name == "google_ads_agent_call":
                value = google_ads_agent_call(
                    arguments.get("tool_name", ""),
                    arguments.get("arguments"),
                    confirm=arguments.get("confirm") is True,
                )
            else:
                value = {"error": f"Unknown MCP tool: {name}"}
                return {"jsonrpc": "2.0", "id": request_id, "result": _tool_result(value, True)}
            is_error = "error" in value
            return {"jsonrpc": "2.0", "id": request_id, "result": _tool_result(value, is_error)}
        except Exception as error:
            value = {"error": str(error)}
            return {"jsonrpc": "2.0", "id": request_id, "result": _tool_result(value, True)}
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }


def serve_stdio() -> None:
    while True:
        request = _read_message()
        if request is None:
            return
        response = _handle(request)
        if response is not None:
            _write_message(response)


if __name__ == "__main__":
    serve_stdio()
