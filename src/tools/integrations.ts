import { adapterPlan, listAdapterInfo, platformGuide } from "../integrations/registry.js";
import { modulePlan } from "../integrations/mcp-modules.js";
import { listIntegrations, registerIntegration } from "../store.js";
import type { IntegrationStatus } from "../types.js";

export function runIntegrationRegister(args: {
  id?: string;
  provider: string;
  name: string;
  status?: IntegrationStatus;
  secret_env?: string[];
  config?: Record<string, unknown>;
}) {
  return {
    registered: true,
    integration: registerIntegration({
      id: args.id,
      provider: args.provider,
      name: args.name,
      status: args.status,
      secretEnv: args.secret_env,
      config: args.config,
    }),
  };
}

export function runIntegrationList() {
  return { registered: listIntegrations(), adapters: listAdapterInfo(), modules: modulePlan() };
}

export function runIntegrationPlan(provider?: string) {
  return { adapters: adapterPlan(provider), modules: modulePlan() };
}

export function runPlatformGuide(args: { provider?: string; goal?: string }) {
  return platformGuide(args.provider, args.goal);
}
