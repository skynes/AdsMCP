import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { join } from "node:path";

const dataDir = join(process.cwd(), "data", "weekly-contribution-smoke");
rmSync(dataDir, { recursive: true, force: true });
process.env.ADS_MCP_DATA = dataDir;
process.env.ADSMCP_WEEKLY_PR_ENABLED = "true";
delete process.env.ADSMCP_UPDATE_REPOSITORY;
delete process.env.ADSMCP_UPSTREAM_REPOSITORY;
delete process.env.ADSMCP_FORK_REPOSITORY;
delete process.env.ADSMCP_GITHUB_TOKEN;

try {
  const {
    checkWeeklyRecommendationsPr,
    createGithubContributionPr,
    getGithubContributionStatus,
  } = await import("../dist/weekly-contribution.js");
  const result = await checkWeeklyRecommendationsPr();
  assert.equal(result?.status, "skipped");
  assert.match(result?.reason ?? "", /GitHub origin remote|ADSMCP_UPDATE_REPOSITORY/);

  process.env.ADSMCP_UPSTREAM_REPOSITORY = "example/AdsMCP";
  process.env.ADSMCP_FORK_REPOSITORY = "example-user/AdsMCP";
  process.env.ADSMCP_GITHUB_TOKEN = "test-token";
  const status = await getGithubContributionStatus();
  assert.equal(status.setupRequired, false);
  assert.ok(Array.isArray(status.changedFiles));
  const preview = await createGithubContributionPr({ confirm: false });
  assert.equal(preview.status, "pending_confirmation");
  assert.match(preview.reason ?? "", /review changedFiles/i);
  console.log("AdsMCP weekly contribution safety smoke test passed");
} finally {
  rmSync(dataDir, { recursive: true, force: true });
}
