import type { CapabilityMatrixScores, CapabilityTag, CapabilityTier } from "./capability-profile.js";

export type IntegrationAdapterMode = "api" | "mcp_module" | "browser_assisted" | "webhook";

export type AdapterWritePolicy = "guarded_api" | "manual_only" | "event_ingest";
export type AdapterImplementation = "local" | "module" | "local_or_module" | "plan";

export interface IntegrationAdapterInfo {
  provider: string;
  label: string;
  mode: IntegrationAdapterMode;
  intro: string;
  audiences: string[];
  bestFor: string[];
  setupLevel: "low" | "medium" | "high";
  capabilities: string[];
  secretEnv: string[];
  optionalEnv?: string[];
  moduleIds?: string[];
  implementation: AdapterImplementation;
  writePolicy: AdapterWritePolicy;
  notes: string;
}

export interface IntegrationAdapterPlan {
  provider: string;
  label: string;
  mode: IntegrationAdapterMode;
  intro: string;
  audiences: string[];
  bestFor: string[];
  setupLevel: "low" | "medium" | "high";
  configured: boolean;
  readReady: boolean;
  writeReady: boolean;
  requiredEnv: string[];
  missingEnv: string[];
  moduleIds?: string[];
  moduleConfigured?: boolean;
  implementation: AdapterImplementation;
  capabilities: string[];
  writePolicy: AdapterWritePolicy;
  capabilityTags: CapabilityTag[];
  capabilityTier: CapabilityTier;
  matrixCapabilityTags: CapabilityTag[];
  matrixCapabilityTier: CapabilityTier;
  matrixScores?: CapabilityMatrixScores;
  matrixNote?: string;
  notes: string;
  nextActions: string[];
}
