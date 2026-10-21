import {
  cancelTelegramActionQueue,
  enqueueTelegramActions,
  getLastSentTelegramAction,
  getNextTelegramAction,
  listTelegramActions,
  markTelegramActionFailed,
  markTelegramActionRunning,
  markTelegramActionSent,
  type TelegramQueueActionInput,
  type TelegramQueueActionStatus,
} from "../telegram-action-queue.js";
import {
  runTelegramAccountSend,
  runTelegramChatReply,
  runTelegramMessageReact,
  runTelegramPublicPostReply,
} from "./telegram-account.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function runTelegramActionQueueCreate(args: {
  project_id?: string;
  min_delay_seconds?: number;
  max_delay_seconds?: number;
  actions: Array<{
    type: TelegramQueueActionInput["type"];
    target: string;
    message_id?: number;
    text?: string;
    reaction?: string;
    expected_text?: string;
  }>;
  confirm?: boolean;
}) {
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Creating an outbound Telegram action queue requires explicit confirm=true",
      safety: "No Telegram message or reaction was sent; the queue was not created.",
    };
  }
  const actions: TelegramQueueActionInput[] = args.actions.map((action) => ({
    type: action.type,
    target: action.target,
    messageId: action.message_id,
    text: action.text,
    reaction: action.reaction,
    expectedText: action.expected_text,
  }));
  return { ok: true, ...enqueueTelegramActions({ projectId: args.project_id, minDelaySeconds: args.min_delay_seconds, maxDelaySeconds: args.max_delay_seconds, actions }) };
}

export function runTelegramActionQueueList(args: { queue_id: string; status?: TelegramQueueActionStatus }) {
  return { queue_id: args.queue_id, actions: listTelegramActions(args.queue_id, args.status) };
}

export function runTelegramActionQueueCancel(args: { queue_id: string; confirm?: boolean }) {
  if (args.confirm !== true) {
    return { ok: false, error: "Cancelling a Telegram action queue requires explicit confirm=true" };
  }
  return { ok: true, ...cancelTelegramActionQueue(args.queue_id) };
}

export async function runTelegramActionQueueProcess(args: {
  queue_id: string;
  max_actions?: number;
  wait_for_interval?: boolean;
  confirm?: boolean;
}): Promise<unknown> {
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Processing a Telegram action queue requires explicit confirm=true",
      safety: "No queued action was executed.",
    };
  }
  const maxActions = Math.min(Math.max(Math.floor(args.max_actions ?? 1), 1), 50);
  const waitForInterval = args.wait_for_interval !== false;
  const processed: unknown[] = [];
  for (let index = 0; index < maxActions; index += 1) {
    const item = getNextTelegramAction(args.queue_id);
    if (!item) break;
    const previous = getLastSentTelegramAction(args.queue_id);
    const elapsed = previous?.completedAt ? Date.now() - Date.parse(previous.completedAt) : Infinity;
    const waitMs = previous ? Math.max(0, item.minDelaySeconds * 1000 - elapsed) : 0;
    if (waitMs > 0) {
      if (!waitForInterval) {
        return {
          ok: false,
          queue_id: args.queue_id,
          processed,
          next_action_id: item.id,
          wait_required_seconds: Math.ceil(waitMs / 1000),
          safety: "The next action was not executed because the queue interval has not elapsed.",
        };
      }
      await sleep(waitMs);
    }

    if (!markTelegramActionRunning(item.id)) {
      return { ok: false, queue_id: args.queue_id, processed, error: "Could not claim the next queued Telegram action" };
    }
    try {
      let result: unknown;
      if (item.type === "send_message") {
        result = await runTelegramAccountSend({ to: item.target, text: item.text!, confirm: true });
      } else if (item.type === "chat_reply") {
        result = await runTelegramChatReply({ chat: item.target, message_id: item.messageId!, text: item.text!, confirm: true });
      } else if (item.type === "public_post_reply") {
        result = await runTelegramPublicPostReply({ channel: item.target, message_id: item.messageId!, text: item.text!, confirm: true });
      } else {
        result = await runTelegramMessageReact({ chat: item.target, message_id: item.messageId!, reaction: item.reaction!, expected_text: item.expectedText, confirm: true });
      }
      if (result && typeof result === "object" && "ok" in result && (result as { ok?: unknown }).ok === false) {
        const error = String((result as { error?: unknown }).error || "Telegram action returned ok=false");
        const failed = markTelegramActionFailed(item.id, error);
        processed.push(failed || { ...item, status: "failed", error });
        return { ok: false, queue_id: args.queue_id, processed, stopped_on_error: true, error };
      }
      const sent = markTelegramActionSent(item.id, result);
      processed.push(sent || { ...item, status: "sent", result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failed = markTelegramActionFailed(item.id, message);
      processed.push(failed || { ...item, status: "failed", error: message });
      return { ok: false, queue_id: args.queue_id, processed, stopped_on_error: true, error: message };
    }
  }
  const remaining = listTelegramActions(args.queue_id, "queued").length;
  return {
    ok: true,
    queue_id: args.queue_id,
    processed,
    remaining,
    safety: "Only explicitly queued actions were executed in order; no new recipients were selected and the queue stops on the first error.",
  };
}
