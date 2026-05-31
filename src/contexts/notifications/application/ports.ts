import type { Result } from "@/shared/kernel";
import type {
  OutboundNotification,
  OutboundNotificationLogDTO,
} from "./types";

/**
 * NotificationSender — the outbound output port (TECHNICAL_DESIGN §6.1, §10.7).
 *
 * Phase-0 adapter is `StubNotificationSender`: it records intent and resolves
 * ok with a delivery timestamp; it does NOT actually deliver anything.
 */
export interface NotificationSender {
  /** Record/deliver the notification; resolves with the delivery instant (epoch ms). */
  send(n: OutboundNotification): Promise<Result<{ deliveredAt: number }>>;
  /** Read back the recorded "would send" log (most-recent-first). */
  listSent(): Promise<OutboundNotificationLogDTO[]>;
}
