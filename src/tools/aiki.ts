import { aikiSetupGuide, aikiStatus } from "../aiki/client.js";

export function runAikiStatus() {
  return aikiStatus();
}

export function runAikiSetupGuide() {
  return aikiSetupGuide();
}
