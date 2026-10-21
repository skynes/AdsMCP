import {
  listTelegramAiPosts,
  reclassifyTelegramAiPosts,
  type TelegramAiPostClassification,
} from "../telegram-ai-posts.js";

export function runTelegramAiPostList(args: {
  project_id?: string;
  classification?: TelegramAiPostClassification;
  min_score?: number;
  limit?: number;
}) {
  return {
    project_id: args.project_id || "neron",
    table: "telegram_ai_posts",
    posts: listTelegramAiPosts({
      projectId: args.project_id,
      classification: args.classification,
      minScore: args.min_score,
      limit: args.limit,
    }),
  };
}

export function runTelegramAiPostReclassify(args: { project_id?: string }) {
  return {
    ...reclassifyTelegramAiPosts(args.project_id || "neron"),
    table: "telegram_ai_posts",
    note: "Classification, Neron offer matches and public reply drafts were rebuilt locally; nothing was sent to Telegram.",
  };
}
