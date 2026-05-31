import { describe, expect, it } from "vitest";
import { FixedClock, SequentialIdGenerator } from "@/shared/ports";
import { type Result, ok } from "@/shared/kernel";
import type { NotificationSender } from "./ports";
import type {
  OutboundNotification,
  OutboundNotificationLogDTO,
} from "./types";
import { makeListSent, makeSendOutbound } from "./send-outbound";
import { buildWhatsAppDeepLink } from "./deep-link";

/** In-memory fake implementing the NotificationSender port for use-case tests. */
class FakeNotificationSender implements NotificationSender {
  readonly log: OutboundNotificationLogDTO[] = [];
  constructor(private readonly deliveredAt = 1_000) {}

  async send(
    n: OutboundNotification,
  ): Promise<Result<{ deliveredAt: number }>> {
    this.log.unshift({ ...n, deliveredAt: this.deliveredAt });
    return ok({ deliveredAt: this.deliveredAt });
  }

  async listSent(): Promise<OutboundNotificationLogDTO[]> {
    return [...this.log];
  }
}

const baseInput = {
  channel: "WhatsApp" as const,
  to: "+15551234567",
  body: "Happy birthday, Meena!",
  occasion: "Birthday",
};

describe("SendOutbound", () => {
  it("mints an id, stamps delivery time, and records intent via the sender", async () => {
    const sender = new FakeNotificationSender(42_000);
    const sendOutbound = makeSendOutbound({
      sender,
      ids: new SequentialIdGenerator("ntf"),
      clock: new FixedClock(42_000),
    });

    const result = await sendOutbound(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe("ntf-1");
    expect(result.value.deliveredAt).toBe(42_000);

    expect(sender.log).toHaveLength(1);
    expect(sender.log[0]).toMatchObject({
      id: "ntf-1",
      channel: "WhatsApp",
      to: "+15551234567",
      body: "Happy birthday, Meena!",
      occasion: "Birthday",
      deliveredAt: 42_000,
    });
  });

  it("rejects an empty recipient", async () => {
    const sender = new FakeNotificationSender();
    const sendOutbound = makeSendOutbound({
      sender,
      ids: new SequentialIdGenerator(),
      clock: new FixedClock(0),
    });

    const result = await sendOutbound({ ...baseInput, to: "   " });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOTIFICATION_NO_RECIPIENT");
    expect(sender.log).toHaveLength(0);
  });

  it("rejects an empty body", async () => {
    const sender = new FakeNotificationSender();
    const sendOutbound = makeSendOutbound({
      sender,
      ids: new SequentialIdGenerator(),
      clock: new FixedClock(0),
    });

    const result = await sendOutbound({ ...baseInput, body: "" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOTIFICATION_EMPTY_BODY");
    expect(sender.log).toHaveLength(0);
  });

  it("propagates a sender failure", async () => {
    const failing: NotificationSender = {
      async send() {
        return { ok: false, error: { code: "BOOM", message: "nope" } };
      },
      async listSent() {
        return [];
      },
    };
    const sendOutbound = makeSendOutbound({
      sender: failing,
      ids: new SequentialIdGenerator(),
      clock: new FixedClock(0),
    });

    const result = await sendOutbound(baseInput);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("BOOM");
  });
});

describe("ListSent", () => {
  it("returns the recorded log most-recent-first", async () => {
    const sender = new FakeNotificationSender(7);
    const sendOutbound = makeSendOutbound({
      sender,
      ids: new SequentialIdGenerator("ntf"),
      clock: new FixedClock(7),
    });
    const listSent = makeListSent({ sender });

    await sendOutbound({ ...baseInput, body: "first" });
    await sendOutbound({ ...baseInput, body: "second" });

    const log = await listSent();
    expect(log.map((e) => e.body)).toEqual(["second", "first"]);
    expect(log.map((e) => e.id)).toEqual(["ntf-2", "ntf-1"]);
  });
});

describe("buildWhatsAppDeepLink", () => {
  it("builds a text-only wa.me link with encoded text", () => {
    const link = buildWhatsAppDeepLink({ text: "Hi & welcome!" });
    expect(link).toBe("https://wa.me/?text=Hi%20%26%20welcome!");
  });

  it("targets a phone number, stripping non-digits", () => {
    const link = buildWhatsAppDeepLink({ text: "Hello", phone: "+1 (555) 123-4567" });
    expect(link).toBe("https://wa.me/15551234567?text=Hello");
  });
});
