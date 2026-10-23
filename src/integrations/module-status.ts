import { loadEnv } from "../env.js";
import { listAdapterInfo } from "./registry.js";
import { listConfiguredModules, moduleConfigInfo, type AdsMcpModuleSummary } from "./mcp-modules.js";
import { moduleSecretsPath, moduleSecretStatuses, type ModuleSecretStatus } from "./module-secrets.js";

export interface ModuleCredentialStatus extends ModuleSecretStatus {
  required: boolean;
}

export interface ModuleDashboardStatus extends AdsMcpModuleSummary {
  configPath: string;
  commandLine?: string;
  sourceUrl?: string;
  requiredEnv: string[];
  optionalEnv: string[];
  credentials: ModuleCredentialStatus[];
  configuredRequired: number;
  requiredCount: number;
  runtimeStatus: "not_checked";
}

export interface ModuleDashboardPayload {
  configPath: string;
  secretsPath: string;
  configured: boolean;
  error?: string;
  modules: ModuleDashboardStatus[];
}

function moduleCommand(module: AdsMcpModuleSummary): string | undefined {
  if (module.transport === "streamable_http") return module.url;
  if (!module.command) return undefined;
  return [module.command, ...(module.args || [])].join(" ");
}

function credentialKeys(module: AdsMcpModuleSummary, adapter: ReturnType<typeof listAdapterInfo>[number] | undefined): {
  required: string[];
  optional: string[];
} {
  const manifestKeys = new Set<string>();
  for (const key of module.inheritEnv) manifestKeys.add(key);
  for (const key of module.envKeys) manifestKeys.add(key);
  if (module.tokenEnv) manifestKeys.add(module.tokenEnv);
  const required = new Set(adapter?.secretEnv || []);
  const optional = new Set(adapter?.optionalEnv || []);
  for (const key of manifestKeys) {
    if (!required.has(key) && !optional.has(key)) optional.add(key);
  }
  for (const key of required) optional.delete(key);
  return { required: [...required], optional: [...optional] };
}

export function moduleDashboardStatus(): ModuleDashboardPayload {
  loadEnv();
  const config = moduleConfigInfo();
  const modules = listConfiguredModules();
  const adapters = listAdapterInfo();
  return {
    configPath: config.path,
    secretsPath: moduleSecretsPath(),
    configured: config.configured,
    ...(config.error ? { error: config.error } : {}),
    modules: modules.map((module) => {
      const adapter = adapters.find((candidate) => candidate.moduleIds?.includes(module.id));
      const keys = credentialKeys(module, adapter);
      const statuses = moduleSecretStatuses(module.id, [...keys.required, ...keys.optional]);
      const credentials = statuses.statuses.map((status) => ({ ...status, required: keys.required.includes(status.key) }));
      return {
        ...module,
        configPath: config.path,
        ...(moduleCommand(module) ? { commandLine: moduleCommand(module) } : {}),
        requiredEnv: keys.required,
        optionalEnv: keys.optional,
        credentials,
        configuredRequired: credentials.filter((credential) => credential.required && credential.configured).length,
        requiredCount: keys.required.length,
        runtimeStatus: "not_checked" as const,
      };
    }),
  };
}

export function moduleDashboardCredentialKeys(moduleId: string): { required: string[]; optional: string[] } {
  const payload = moduleDashboardStatus();
  const module = payload.modules.find((candidate) => candidate.id === moduleId.trim());
  if (!module) throw new Error(`module not configured: ${moduleId}`);
  return { required: module.requiredEnv, optional: module.optionalEnv };
}
