import type { SharedDeps } from "@/bootstrap/container";
import type { Result } from "@/shared/kernel";
import {
  buildWhatsAppDeepLink,
  makeListSent,
  makeSendOutbound,
  type OutboundNotificationLogDTO,
  type SendOutboundInput,
  type SendOutboundResult,
  type WhatsAppDeepLinkInput,
} from "./application";
import { StubNotificationSender } from "./infrastructure";

/**
 * Public surface of the Notifications context (TECHNICAL_DESIGN §10.7).
 * Reminders/Engagement call `sendOutbound` via the container.
 */
export interface NotificationsModule {
  sendOutbound(
    input: SendOutboundInput,
  ): Promise<Result<SendOutboundResult>>;
  listSent(): Promise<OutboundNotificationLogDTO[]>;
  buildWhatsAppDeepLink(input: WhatsAppDeepLinkInput): string;
}

export function createNotificationsModule(
  deps: SharedDeps,
): NotificationsModule {
  const sender = new StubNotificationSender(deps.store, deps.clock);

  return {
    sendOutbound: makeSendOutbound({ sender, ids: deps.ids, clock: deps.clock }),
    listSent: makeListSent({ sender }),
    buildWhatsAppDeepLink,
  };
}
