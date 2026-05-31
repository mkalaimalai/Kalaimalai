/**
 * Notifications — application types (TECHNICAL_DESIGN §10.7, PRD F6.1/F6.2).
 *
 * Outbound-only STUB. These shapes are plain and serializable so the store and
 * UI never see live entities. No contact/group scraping (PRD F6.3 excluded).
 */

export type NotificationChannel = "WhatsApp" | "Email";

/**
 * An outbound notification the app *would* send. `id` is minted by the use case
 * via the shared `IdGenerator`; callers (Reminders/Engagement) supply the rest.
 */
export interface OutboundNotification {
  readonly id: string;
  readonly channel: NotificationChannel;
  /** Recipient handle — a phone number (WhatsApp) or email address (Email). */
  readonly to: string;
  readonly subject?: string;
  readonly body: string;
  /** Optional occasion tag, e.g. "Birthday", "Diwali" (free-form). */
  readonly occasion?: string;
  /** Optional deep-link to share (e.g. a wa.me link) — see buildWhatsAppDeepLink. */
  readonly deepLink?: string;
}

/** Input to SendOutbound — everything but the minted `id`. */
export type SendOutboundInput = Omit<OutboundNotification, "id">;

/**
 * A recorded "would send" log entry — plain DTO for the UI/store (ListSent).
 * `deliveredAt` is epoch milliseconds stamped by the Clock at send time.
 */
export interface OutboundNotificationLogDTO {
  readonly id: string;
  readonly channel: NotificationChannel;
  readonly to: string;
  readonly subject?: string;
  readonly body: string;
  readonly occasion?: string;
  readonly deepLink?: string;
  readonly deliveredAt: number;
}
