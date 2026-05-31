import type { Clock, IdGenerator } from "@/shared/ports";
import { type Result, fail } from "@/shared/kernel";
import type { NotificationSender } from "./ports";
import type {
  OutboundNotification,
  OutboundNotificationLogDTO,
  SendOutboundInput,
} from "./types";

export interface SendOutboundDeps {
  sender: NotificationSender;
  ids: IdGenerator;
  clock: Clock;
}

/** Result of a successful send: the minted id + the delivery instant. */
export interface SendOutboundResult {
  readonly id: string;
  readonly deliveredAt: number;
}

/**
 * SendOutbound — mints an id, stamps time, calls the sender, records intent
 * (TECHNICAL_DESIGN §10.7). Invoked by Reminders/Engagement via the container.
 *
 * Validation is minimal but real: an empty recipient or empty body is rejected
 * as a DomainError rather than silently "sent".
 */
export function makeSendOutbound(deps: SendOutboundDeps) {
  return async function sendOutbound(
    input: SendOutboundInput,
  ): Promise<Result<SendOutboundResult>> {
    if (input.to.trim().length === 0) {
      return fail("NOTIFICATION_NO_RECIPIENT", "A recipient (`to`) is required.");
    }
    if (input.body.trim().length === 0) {
      return fail("NOTIFICATION_EMPTY_BODY", "A non-empty `body` is required.");
    }

    const notification: OutboundNotification = {
      ...input,
      id: deps.ids.next(),
    };

    const sent = await deps.sender.send(notification);
    if (!sent.ok) return sent;

    return {
      ok: true,
      value: { id: notification.id, deliveredAt: sent.value.deliveredAt },
    };
  };
}

/**
 * ListSent — reads the recorded "would send" log (most-recent-first), as plain
 * DTOs for the UI/store.
 */
export function makeListSent(deps: { sender: NotificationSender }) {
  return function listSent(): Promise<OutboundNotificationLogDTO[]> {
    return deps.sender.listSent();
  };
}
