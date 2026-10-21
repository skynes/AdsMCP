import { readFileSync, existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getClickruToken } from "../clickru-settings.js";
import { loadEnv } from "../env.js";
import { getMicrosoftAdsAccessToken } from "../microsoft-ads-settings.js";

type ModuleTransport = "stdio" | "streamable_http";

export interface AdsMcpModuleConfig {
  id: string;
  provider: string;
  label?: string;
  enabled?: boolean;
  transport: ModuleTransport;
  command?: string;
  args?: string[];
  cwd?: string;
  url?: string;
  token_env?: string;
  env?: Record<string, string>;
  inherit_env?: string[];
  allow_tools?: string[];
  capabilities?: string[];
  notes?: string;
  source_url?: string;
  source_ref?: string;
  decision_ref?: string;
  reviewed_at?: string;
}

interface ModuleFile {
  modules?: AdsMcpModuleConfig[];
}

export interface AdsMcpModuleSummary {
  id: string;
  provider: string;
  label: string;
  enabled: boolean;
  transport: ModuleTransport;
  configured: boolean;
  command?: string;
  args?: string[];
  url?: string;
  allowTools?: string[];
  capabilities: string[];
  notes?: string;
  sourceUrl?: string;
  sourceRef?: string;
  decisionRef?: string;
  reviewedAt?: string;
  error?: string;
}

export interface AdsMcpModuleTool {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
}

export interface AdsMcpModuleCallResult {
  module_id: string;
  provider: string;
  tool: string;
  is_error: boolean;
  content: Array<Record<string, unknown>>;
  structured_content?: unknown;
}

const ROOT = resolve(join(fileURLToPath(new URL(".", import.meta.url)), "../.."));

function configPath(): string {
  loadEnv();
  const raw = process.env.ADS_MCP_MODULES_FILE?.trim() || "modules/modules.json";
  return isAbsolute(raw) ? resolve(raw) : resolve(ROOT, raw);
}

function readModuleFile(): { path: string; modules: AdsMcpModuleConfig[]; error?: string } {
  const path = configPath();
  if (!existsSync(path)) return { path, modules: [] };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as ModuleFile | AdsMcpModuleConfig[];
    const modules = Array.isArray(parsed) ? parsed : parsed.modules;
    if (!Array.isArray(modules)) throw new Error("expected { modules: [...] }");
    return { path, modules };
  } catch (error) {
    return {
      path,
      modules: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function isNonEmpty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function sourceEnvValue(value: string): string {
  const match = value.match(/^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/);
  return match ? process.env[match[1]] || "" : value;
}

function sourceSecretValue(name: string): string {
  if (name === "ADS_CLICKRU_API_TOKEN") return getClickruToken() || "";
  return process.env[name] || "";
}

function resolveUrlTemplate(value: string): string {
  return value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, name: string) => {
    const resolved = sourceSecretValue(name);
    if (!resolved) throw new Error(`missing URL template environment value: ${name}`);
    return encodeURIComponent(resolved);
  });
}

function childEnv(module: AdsMcpModuleConfig): Record<string, string> | undefined {
  const keys = new Set(module.inherit_env || []);
  const env: Record<string, string> = {};
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  for (const [key, value] of Object.entries(module.env || {})) {
    const resolved = sourceEnvValue(value);
    if (resolved) env[key] = resolved;
  }
  return Object.keys(env).length ? env : undefined;
}

/** Relative module cwd is resolved against the project root, not process.cwd(). */
function moduleCwd(cwd: string | undefined): string | undefined {
  const value = cwd?.trim();
  if (!value) return undefined;
  return isAbsolute(value) ? resolve(value) : resolve(ROOT, value);
}

function summary(module: AdsMcpModuleConfig, error?: string): AdsMcpModuleSummary {
  const enabled = module.enabled !== false;
  const commandReady = module.transport === "stdio" && isNonEmpty(module.command);
  const urlReady = module.transport === "streamable_http" && isNonEmpty(module.url);
  return {
    id: module.id,
    provider: module.provider,
    label: module.label || module.id,
    enabled,
    transport: module.transport,
    configured: enabled && (commandReady || urlReady),
    command: module.command,
    args: module.args,
    url: module.url,
    allowTools: module.allow_tools,
    capabilities: module.capabilities || [],
    notes: module.notes,
    sourceUrl: module.source_url,
    sourceRef: module.source_ref,
    decisionRef: module.decision_ref,
    reviewedAt: module.reviewed_at,
    error,
  };
}

export function moduleConfigInfo(): { path: string; configured: boolean; error?: string } {
  const file = readModuleFile();
  return { path: file.path, configured: Boolean(file.modules.length), error: file.error };
}

export function listConfiguredModules(): AdsMcpModuleSummary[] {
  const file = readModuleFile();
  if (file.error) return [];
  return file.modules.map((module) => summary(module));
}

function getModule(moduleId: string): { module?: AdsMcpModuleConfig; error?: string } {
  const file = readModuleFile();
  if (file.error) return { error: `module config: ${file.error}` };
  const module = file.modules.find((item) => item.id === moduleId.trim());
  if (!module) return { error: `module not configured: ${moduleId}` };
  if (module.enabled === false) return { error: `module disabled: ${moduleId}` };
  if (module.transport === "stdio" && !isNonEmpty(module.command)) {
    return { error: `module ${moduleId}: command is required for stdio` };
  }
  if (module.transport === "streamable_http" && !isNonEmpty(module.url)) {
    return { error: `module ${moduleId}: url is required for streamable_http` };
  }
  return { module };
}

async function withModuleClient<T>(
  module: AdsMcpModuleConfig,
  action: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({ name: "ads-mcp-module-bridge", version: "0.1.0" }, { capabilities: {} });
  let transport: StdioClientTransport | StreamableHTTPClientTransport;
  if (module.transport === "stdio") {
    transport = new StdioClientTransport({
      command: module.command!,
      args: module.args || [],
      cwd: moduleCwd(module.cwd),
      env: childEnv(module),
      stderr: "inherit",
    });
  } else {
    const headers: Record<string, string> = {};
    const token = module.token_env === "MICROSOFT_ADS_ACCESS_TOKEN"
      ? await getMicrosoftAdsAccessToken()
      : module.token_env
        ? process.env[module.token_env]?.trim()
        : undefined;
    if (token) headers.Authorization = `Bearer ${token}`;
    transport = new StreamableHTTPClientTransport(new URL(resolveUrlTemplate(module.url!)), {
      requestInit: Object.keys(headers).length ? { headers } : undefined,
    });
  }
  try {
    await client.connect(transport);
    return await action(client);
  } finally {
    await client.close().catch(() => undefined);
  }
}

function assertAllowedTool(module: AdsMcpModuleConfig, toolName: string, internal = false): void {
  if (toolName === "select_account" && !internal) {
    throw new Error("select_account is reserved for the dedicated provider account workflow");
  }
  if (
    module.provider === "yandex_direct" &&
    toolName === "direct_write" &&
    !internal
  ) {
    throw new Error("Yandex Direct writes must use ads_yandex_direct_write with confirm=true");
  }
  if (module.allow_tools?.length && !module.allow_tools.includes(toolName)) {
    throw new Error(`tool ${toolName} is not allowed by module ${module.id}`);
  }
}

export async function listModuleTools(moduleId: string): Promise<{
  module: AdsMcpModuleSummary;
  tools: AdsMcpModuleTool[];
}> {
  const found = getModule(moduleId);
  if (!found.module) throw new Error(found.error || "module unavailable");
  const tools = await withModuleClient(found.module, async (client) => {
    const result = await client.listTools();
    return result.tools.map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
    }));
  });
  return { module: summary(found.module), tools };
}

export async function callModuleTool(input: {
  moduleId: string;
  toolName: string;
  arguments?: Record<string, unknown>;
  timeoutMs?: number;
  internal?: boolean;
}): Promise<AdsMcpModuleCallResult> {
  const found = getModule(input.moduleId);
  if (!found.module) throw new Error(found.error || "module unavailable");
  assertAllowedTool(found.module, input.toolName, input.internal);
  return withModuleClient(found.module, async (client) => {
    const result = await client.callTool(
      { name: input.toolName, arguments: input.arguments || {} },
      undefined,
      { timeout: input.timeoutMs || 60_000 },
    );
    return {
      module_id: found.module!.id,
      provider: found.module!.provider,
      tool: input.toolName,
      is_error: Boolean(result.isError),
      content: result.content as Array<Record<string, unknown>>,
      structured_content: result.structuredContent,
    };
  });
}

export function modulePlan(): {
  configPath: string;
  configured: boolean;
  modules: AdsMcpModuleSummary[];
  nextActions: string[];
} {
  const info = moduleConfigInfo();
  const modules = listConfiguredModules();
  const nextActions: string[] = [];
  if (info.error) nextActions.push(`Fix ${info.path}: ${info.error}`);
  if (!info.configured) nextActions.push(`Create ${info.path} from modules/modules.example.json`);
  for (const item of modules) {
    if (!item.configured) nextActions.push(`Complete command/url for module ${item.id}`);
  }
  return { configPath: info.path, configured: info.configured, modules, nextActions };
}
