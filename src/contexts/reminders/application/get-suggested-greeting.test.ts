import { describe, expect, it } from "vitest";
import { getSuggestedGreeting } from "./get-suggested-greeting";

describe("getSuggestedGreeting", () => {
  it("personalizes a birthday greeting with the name", () => {
    const r = getSuggestedGreeting({ occasionKind: "birthday", name: "Meena" });
    expect(r.occasionKind).toBe("birthday");
    expect(r.message).toContain("Meena");
    expect(r.message.toLowerCase()).toContain("happy birthday");
  });

  it("falls back to a generic birthday greeting without a name", () => {
    const r = getSuggestedGreeting({ occasionKind: "birthday" });
    expect(r.message.toLowerCase()).toContain("happy birthday");
    expect(r.message).not.toContain("undefined");
  });

  it("treats a blank name as no name", () => {
    const r = getSuggestedGreeting({ occasionKind: "birthday", name: "   " });
    expect(r.message).not.toContain("  ,");
  });

  it("produces an anniversary greeting", () => {
    const r = getSuggestedGreeting({ occasionKind: "anniversary", name: "Raj & Priya" });
    expect(r.message.toLowerCase()).toContain("anniversary");
    expect(r.message).toContain("Raj & Priya");
  });

  it("produces a festival greeting naming the festival", () => {
    const r = getSuggestedGreeting({ occasionKind: "festival", name: "Diwali" });
    expect(r.message).toContain("Diwali");
  });
});
