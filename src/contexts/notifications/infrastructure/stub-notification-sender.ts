import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import type { Clock } from "@/shared/ports";
import { type Result, ok } from "@/shared/kernel";
import type { NotificationSender } from "../application/ports";
import type {
  OutboundNotification,
  OutboundNotificationLogDTO,
} from "../application/types";

const NAMESPACE = "ff:notifications:log";
const SCHEMA_VERSION = 1;

/** Stored shape == the log DTO (plain & serializable, keyed by `id`). */
type StoredLogEntry = OutboundNotificationLogDTO;

/**
 * StubNotificationSender (TECHNICAL_DESIGN §6.1, §10.7; PRD F6.1).
 *
 * Does NOT actually deliver. It records the notification to a `Collection`-backed
 * log (`ff:notifications:log`) and resolves ok with a delivery timestamp from the
 * Clock — enough for the UI to show a "would send to WhatsApp/email" toast.
 * No contact/group scraping of any kind (PRD F6.3 excluded).
 */
export class StubNotificationSender implements NotificationSender {
  private readonly log: Collection<StoredLogEntry>;

  constructor(
    store: KeyValueStore,
    private readonly clock: Clock,
  ) {
    this.log = new Collection<StoredLogEntry>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  async send(
    n: OutboundNotification,
  ): Promise<Result<{ deliveredAt: number }>> {
    const deliveredAt = this.clock.now();
    const entry: StoredLogEntry = { ...n, deliveredAt };
    this.log.upsert(entry);
    return ok({ deliveredAt });
  }

  async listSent(): Promise<OutboundNotificationLogDTO[]> {
    return this.log
      .all()
      .sort((a, b) => b.deliveredAt - a.deliveredAt)
      .map((e) => ({ ...e }));
  }
}
