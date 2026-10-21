import { dataDir } from "../db.js";
import { storeStats } from "../store.js";
import { statSync } from "node:fs";
import { join } from "node:path";

export function runStoreStatus() {
  const dir = dataDir();
  let dbSizeBytes = 0;
  try {
    dbSizeBytes = statSync(join(dir, "ads.db")).size;
  } catch {
    // First run: the database is created lazily.
  }
  return {
    dataDir: dir,
    database: "ads.db",
    dbSizeMb: Number((dbSizeBytes / 1048576).toFixed(3)),
    rows: storeStats(),
    notes: [
      "SQLite uses WAL and a busy timeout for concurrent MCP sessions.",
      "Secrets belong in environment variables; SQLite stores only secret variable names.",
      "Automation is dry-run unless ads_automation_run receives execute=true.",
    ],
  };
}
