export * from "./notifications.module";
export type {
  NotificationChannel,
  OutboundNotification,
  OutboundNotificationLogDTO,
  SendOutboundInput,
  SendOutboundResult,
  WhatsAppDeepLinkInput,
} from "./application";

import type { NotificationsModule } from "./notifications.module";

declare module "@/bootstrap/container" {
  interface AppContainer {
    notifications: NotificationsModule;
  }
}
