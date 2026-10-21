import { startClickruSettingsServer, stopClickruSettingsServer } from "../src/clickru-settings-server.js";

const port = Number(process.env.ADSMCP_DASHBOARD_PORT || 8790);
const result = await startClickruSettingsServer(port);
console.log(JSON.stringify(result));

const shutdown = async () => {
  await stopClickruSettingsServer();
  process.exit(0);
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
