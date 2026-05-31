import { describe, it, expect } from "vitest";
import { CommentId, MemberId } from "@/shared/kernel";
import { Comment } from "./comment";

const make = (overrides: Partial<Parameters<typeof Comment.create>[0]> = {}) =>
  Comment.create({
    id: CommentId("c1"),
    targetType: "Memory",
    targetId: "m1",
    memberId: MemberId("mem1"),
    text: "Lovely!",
    createdAtMs: 2000,
    ...overrides,
  });

describe("Comment", () => {
  it("creates a valid comment", () => {
    const r = make();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.id).toBe("c1");
    expect(r.value.text).toBe("Lovely!");
    expect(r.value.createdAtMs).toBe(2000);
    expect(r.value.target).toEqual({ targetType: "Memory", targetId: "m1" });
  });

  it("trims the text", () => {
    const r = make({ text: "  hi  " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.text).toBe("hi");
  });

  it("rejects empty text", () => {
    const r = make({ text: "   " });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("COMMENT_TEXT_REQUIRED");
  });

  it("rejects an empty target id", () => {
    const r = make({ targetId: "  " });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("COMMENT_TARGET_REQUIRED");
  });
});
