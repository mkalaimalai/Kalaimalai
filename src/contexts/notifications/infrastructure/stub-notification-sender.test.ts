import { describe, expect, it } from "vitest";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { FixedClock } from "@/shared/ports";
import type { OutboundNotification } from "../application/types";
import { StubNotificationSender } from "./stub-notification-sender";

const notification = (
  over: Partial<OutboundNotification> = {},
): OutboundNotification => ({
  id: "ntf-1",
  channel: "WhatsApp",
  to: "+15551234567",
  body: "Happy birthday!",
  occasion: "Birthday",
  ...over,
});

describe("StubNotificationSender", () => {
  it("records intent and resolves ok with the clock's delivery time", async () => {
    const store = new InMemoryKeyValueStore();
    const sender = new StubNotificationSender(store, new FixedClock(99));

    const result = await sender.send(notification());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.deliveredAt).toBe(99);

    const log = await sender.listSent();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      id: "ntf-1",
      channel: "WhatsApp",
      to: "+15551234567",
      deliveredAt: 99,
    });
  });

  it("persists across instances via the shared store", async () => {
    const store = new InMemoryKeyValueStore();
    await new StubNotificationSender(store, new FixedClock(1)).send(
      notification({ id: "ntf-a" }),
    );

    const reopened = new StubNotificationSender(store, new FixedClock(2));
    const log = await reopened.listSent();
    expect(log.map((e) => e.id)).toEqual(["ntf-a"]);
  });

  it("returns the log most-recent-first", async () => {
    const store = new InMemoryKeyValueStore();
    const a = new StubNotificationSender(store, new FixedClock(10));
    await a.send(notification({ id: "old", body: "old" }));
    const b = new StubNotificationSender(store, new FixedClock(20));
    await b.send(notification({ id: "new", body: "new" }));

    const log = await b.listSent();
    expect(log.map((e) => e.id)).toEqual(["new", "old"]);
  });

  it("supports the Email channel and optional subject", async () => {
    const store = new InMemoryKeyValueStore();
    const sender = new StubNotificationSender(store, new FixedClock(5));
    await sender.send(
      notification({
        id: "mail-1",
        channel: "Email",
        to: "meena@example.com",
        subject: "Happy Birthday",
      }),
    );

    const log = await sender.listSent();
    expect(log[0]).toMatchObject({
      channel: "Email",
      to: "meena@example.com",
      subject: "Happy Birthday",
    });
  });
});
