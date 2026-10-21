import { syncTelegramPublicReplies } from "../dist/telegram-public-replies.js";
import { closeGramjs } from "../dist/telegram/gramjs.js";

const args = process.argv.slice(2);
const chatRefs = args.filter((arg) => !arg.startsWith("--"));
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limitPerChat = limitArg ? Number(limitArg.slice("--limit=".length)) : undefined;
const contextArg = args.find((arg) => arg.startsWith("--context-after="));
const contextMessagesAfter = contextArg ? Number(contextArg.slice("--context-after=".length)) : undefined;

try {
  const result = await syncTelegramPublicReplies({
    projectId: "neron",
    chatRefs: chatRefs.length ? chatRefs : undefined,
    limitPerChat,
    contextMessagesAfter,
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await closeGramjs().catch(() => null);
}
