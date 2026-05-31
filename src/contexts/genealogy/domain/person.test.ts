import { describe, expect, it } from "vitest";
import { ApproximateDate, PersonId } from "@/shared/kernel";
import { Person } from "./person";

const base = {
  id: PersonId("p1"),
  legalName: "Asha Kumar",
  gender: "Female" as const,
  visibility: "Public" as const,
  branch: "Maternal" as const,
};

describe("Person.create", () => {
  it("creates a valid person", () => {
    const r = Person.create(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.legalName).toBe("Asha Kumar");
    expect(r.value.displayName).toBe("Asha Kumar");
    expect(r.value.isDeceased).toBe(false);
    expect(r.value.isUnlisted).toBe(false);
  });

  it("prefers nickname as display name", () => {
    const r = Person.create({ ...base, nickname: "Ashu" });
    expect(r.ok && r.value.displayName).toBe("Ashu");
  });

  it("rejects an empty legal name", () => {
    const r = Person.create({ ...base, legalName: "   " });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("PERSON_NAME_REQUIRED");
  });

  it("marks deceased when passing is present", () => {
    const r = Person.create({ ...base, passing: ApproximateDate.year(2020) });
    expect(r.ok && r.value.isDeceased).toBe(true);
  });

  it("marks unlisted when visibility is Unlisted", () => {
    const r = Person.create({ ...base, visibility: "Unlisted" });
    expect(r.ok && r.value.isUnlisted).toBe(true);
  });

  it("rejects passing before birth", () => {
    const r = Person.create({
      ...base,
      birth: ApproximateDate.year(2000),
      passing: ApproximateDate.year(1990),
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("PERSON_PASSING_BEFORE_BIRTH");
  });
});

describe("Person.canAddEvent", () => {
  it("rejects a future-dated event for a deceased person", () => {
    const p = Person.create({ ...base, passing: ApproximateDate.year(2010) });
    if (!p.ok) throw new Error("setup");
    const r = p.value.canAddEvent(ApproximateDate.year(2015));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("DECEASED_FUTURE_EVENT");
  });

  it("allows an event before passing", () => {
    const p = Person.create({ ...base, passing: ApproximateDate.year(2010) });
    if (!p.ok) throw new Error("setup");
    expect(p.value.canAddEvent(ApproximateDate.year(2005)).ok).toBe(true);
  });

  it("allows any event for a living person", () => {
    const p = Person.create(base);
    if (!p.ok) throw new Error("setup");
    expect(p.value.canAddEvent(ApproximateDate.year(2099)).ok).toBe(true);
  });
});

describe("Person.withChanges", () => {
  it("returns a re-validated copy", () => {
    const p = Person.create(base);
    if (!p.ok) throw new Error("setup");
    const r = p.value.withChanges({ currentLocation: "Chennai" });
    expect(r.ok && r.value.currentLocation).toBe("Chennai");
    expect(r.ok && r.value.id).toBe(PersonId("p1"));
  });

  it("rejects an invalid change", () => {
    const p = Person.create(base);
    if (!p.ok) throw new Error("setup");
    expect(p.value.withChanges({ legalName: "" }).ok).toBe(false);
  });
});

describe("Person photoUrl", () => {
  it("stores a trimmed photoUrl and exposes it via the getter", () => {
    const r = Person.create({
      id: PersonId("p-photo"),
      legalName: "Asha",
      gender: "Female",
      visibility: "Public",
      branch: "Maternal",
      photoUrl: "  data:image/jpeg;base64,abc  ",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.photoUrl).toBe("data:image/jpeg;base64,abc");
  });

  it("treats blank photoUrl as undefined", () => {
    const r = Person.create({
      id: PersonId("p-photo2"),
      legalName: "Asha",
      gender: "Female",
      visibility: "Public",
      branch: "Maternal",
      photoUrl: "   ",
    });
    expect(r.ok && r.value.photoUrl).toBeUndefined();
  });
});
