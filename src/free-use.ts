import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveDataDir } from "./env.js";

export const FREE_USE_RULES_VERSION = "1.0";
const RULES_FILE = new URL("../docs/FREE-USE-RULES.md", import.meta.url);
const FALLBACK_RULES = `# AdsMCP Free Use Rules\n\nVersion: ${FREE_USE_RULES_VERSION}\n\nAdsMCP's local core is provided free of charge under the MIT license. Third-party advertising platforms, hosting, API usage and account costs remain the user's responsibility. Use the software lawfully, protect credentials and review every external action before confirming it.`;
const PUBLIC_TOOLS = new Set(["ads_free_use_rules", "ads_free_use_accept"]);

type AcceptanceRecord = {
  accepted: true;
  rulesVersion: string;
  rulesSha256: string;
  acceptedAt: string;
};

export type FreeUseStatus = {
  accepted: boolean;
  rulesVersion: string;
  rulesSha256: string;
  acceptedAt?: string;
  acceptancePath: string;
};

function acceptancePath(): string {
  return join(resolveDataDir(), "consents", "free-use.json");
}

export function readFreeUseRules(): string {
  try {
    return readFileSync(RULES_FILE, "utf8");
  } catch {
    return FALLBACK_RULES;
  }
}

function rulesSha256(): string {
  return createHash("sha256").update(readFreeUseRules()).digest("hex");
}

function readAcceptance(path: string): AcceptanceRecord | undefined {
  try {
    if (!existsSync(path)) return undefined;
    const value = JSON.parse(readFileSync(path, "utf8")) as Partial<AcceptanceRecord>;
    if (
      value.accepted !== true ||
      typeof value.rulesVersion !== "string" ||
      typeof value.rulesSha256 !== "string" ||
      typeof value.acceptedAt !== "string"
    ) return undefined;
    return value as AcceptanceRecord;
  } catch {
    return undefined;
  }
}

export function getFreeUseStatus(): FreeUseStatus {
  const path = acceptancePath();
  const currentHash = rulesSha256();
  const record = readAcceptance(path);
  const accepted = Boolean(
    record?.accepted &&
      record.rulesVersion === FREE_USE_RULES_VERSION &&
      record.rulesSha256 === currentHash,
  );
  return {
    accepted,
    rulesVersion: FREE_USE_RULES_VERSION,
    rulesSha256: currentHash,
    acceptedAt: accepted ? record?.acceptedAt : undefined,
    acceptancePath: path,
  };
}

export function acceptFreeUseRules(): FreeUseStatus {
  const path = acceptancePath();
  const record: AcceptanceRecord = {
    accepted: true,
    rulesVersion: FREE_USE_RULES_VERSION,
    rulesSha256: rulesSha256(),
    acceptedAt: new Date().toISOString(),
  };
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, path);
  return getFreeUseStatus();
}

export function freeUseRulesResult(): { content: [{ type: "text"; text: string }] } {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        rules_version: FREE_USE_RULES_VERSION,
        accepted: getFreeUseStatus().accepted,
        document: readFreeUseRules(),
        acceptance_tool: "ads_free_use_accept",
        acceptance_argument: { confirm: true, rules_version: FREE_USE_RULES_VERSION },
      }, null, 2),
    }],
  };
}

export function freeUseRequiredResult(toolName: string): { content: [{ type: "text"; text: string }] } {
  const status = getFreeUseStatus();
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        error: "FREE_USE_ACCEPTANCE_REQUIRED",
        message: "Review the AdsMCP Free Use Rules and call ads_free_use_accept with confirm=true before using operational tools.",
        blocked_tool: toolName,
        rules_version: status.rulesVersion,
        rules_tool: "ads_free_use_rules",
        acceptance_tool: "ads_free_use_accept",
      }, null, 2),
    }],
  };
}

/** Gate every registered MCP tool while leaving the rules and acceptance tools available. */
export function installFreeUseGate(server: McpServer): void {
  const originalTool = server.tool.bind(server) as (...args: any[]) => unknown;
  server.tool = ((name: string, ...args: any[]) => {
    const callbackIndex = args.length - 1;
    const callback = args[callbackIndex];
    if (typeof callback !== "function" || PUBLIC_TOOLS.has(name)) {
      return originalTool(name, ...args);
    }
    args[callbackIndex] = async (...callbackArgs: any[]) => {
      if (!getFreeUseStatus().accepted) return freeUseRequiredResult(name);
      return callback(...callbackArgs);
    };
    return originalTool(name, ...args);
  }) as typeof server.tool;
}
