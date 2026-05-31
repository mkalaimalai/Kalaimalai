import { describe, it, expect } from "vitest";
import { MemberId, PersonId, WishId } from "@/shared/kernel";
import { Wish } from "./wish";

const make = (overrides: Partial<Parameters<typeof Wish.create>[0]> = {}) =>
  Wish.create({
    id: WishId("w1"),
    toPersonId: PersonId("p1"),
    fromMemberId: MemberId("mem1"),
    message: "Happy birthday!",
    createdAtMs: 3000,
    ...overrides,
  });

describe("Wish", () => {
  it("creates a valid wish", () => {
    const r = make();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.id).toBe("w1");
    expect(r.value.toPersonId).toBe("p1");
    expect(r.value.message).toBe("Happy birthday!");
    expect(r.value.occasion).toBeNull();
    expect(r.value.createdAtMs).toBe(3000);
  });

  it("keeps a trimmed occasion when present", () => {
    const r = make({ occasion: "  Birthday  " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.occasion).toBe("Birthday");
  });

  it("normalizes a blank occasion to null", () => {
    const r = make({ occasion: "   " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.occasion).toBeNull();
  });

  it("rejects an empty message", () => {
    const r = make({ message: "  " });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("WISH_MESSAGE_REQUIRED");
  });

  it("rejects an empty recipient", () => {
    const r = make({ toPersonId: PersonId("") });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("WISH_RECIPIENT_REQUIRED");
  });
});
