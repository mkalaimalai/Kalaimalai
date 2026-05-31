import { describe, it, expect } from "vitest";
import { MemberId, ReactionId } from "@/shared/kernel";
import { Reaction } from "./reaction";

const make = (overrides: Partial<Parameters<typeof Reaction.create>[0]> = {}) =>
  Reaction.create({
    id: ReactionId("r1"),
    targetType: "Memory",
    targetId: "m1",
    memberId: MemberId("mem1"),
    kind: "heart",
    createdAtMs: 1000,
    ...overrides,
  });

describe("Reaction", () => {
  it("creates a valid reaction", () => {
    const r = make();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.id).toBe("r1");
    expect(r.value.targetType).toBe("Memory");
    expect(r.value.targetId).toBe("m1");
    expect(r.value.kind).toBe("heart");
    expect(r.value.createdAtMs).toBe(1000);
    expect(r.value.target).toEqual({ targetType: "Memory", targetId: "m1" });
  });

  it("trims the kind", () => {
    const r = make({ kind: "  thumbsup  " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.kind).toBe("thumbsup");
  });

  it("rejects an empty kind", () => {
    const r = make({ kind: "   " });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("REACTION_KIND_REQUIRED");
  });

  it("rejects an empty target id", () => {
    const r = make({ targetId: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("REACTION_TARGET_REQUIRED");
  });

  it("supports a Person target", () => {
    const r = make({ targetType: "Person", targetId: "p1" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.target).toEqual({ targetType: "Person", targetId: "p1" });
  });
});
