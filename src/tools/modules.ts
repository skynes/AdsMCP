import {
  callModuleTool,
  listModuleTools,
  modulePlan,
} from "../integrations/mcp-modules.js";

export function runModulePlan() {
  return modulePlan();
}

export async function runModuleTools(moduleId: string) {
  return listModuleTools(moduleId);
}

export async function runModuleCall(args: {
  module_id: string;
  tool_name: string;
  arguments?: Record<string, unknown>;
  timeout_ms?: number;
}) {
  return callModuleTool({
    moduleId: args.module_id,
    toolName: args.tool_name,
    arguments: args.arguments,
    timeoutMs: args.timeout_ms,
  });
}
