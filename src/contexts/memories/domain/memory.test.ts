import { describe, it, expect } from "vitest";
import { ApproximateDate, MemoryId, PersonId, AlbumId, EventId } from "@/shared/kernel";
import { Memory } from "./memory";

const newMemory = () =>
  Memory.create({
    id: MemoryId("m1"),
    caption: "Beach day",
    mediaRef: "media-key-1",
  });

describe("Memory", () => {
  it("creates a valid memory", () => {
    const r = newMemory();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.id).toBe("m1");
    expect(r.value.caption).toBe("Beach day");
    expect(r.value.mediaRef).toBe("media-key-1");
    expect(r.value.taggedPeople).toEqual([]);
  });

  it("rejects an empty caption", () => {
    const r = Memory.create({
      id: MemoryId("m1"),
      caption: "   ",
      mediaRef: "media-key-1",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("MEMORY_CAPTION_REQUIRED");
  });

  it("rejects an empty mediaRef", () => {
    const r = Memory.create({
      id: MemoryId("m1"),
      caption: "Beach day",
      mediaRef: "",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("MEMORY_MEDIA_REQUIRED");
  });

  it("carries optional date, place, album, event", () => {
    const r = Memory.create({
      id: MemoryId("m1"),
      caption: "Diwali",
      mediaRef: "k",
      date: ApproximateDate.year(2019),
      place: "Chennai",
      albumId: AlbumId("a1"),
      eventId: EventId("e1"),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.date?.year).toBe(2019);
    expect(r.value.place).toBe("Chennai");
    expect(r.value.albumId).toBe("a1");
    expect(r.value.eventId).toBe("e1");
  });

  it("tags a person and keeps the set unique", () => {
    const r = newMemory();
    if (!r.ok) return;
    const m = r.value.tagPerson(PersonId("p1")).tagPerson(PersonId("p1"));
    expect(m.taggedPeople).toEqual([PersonId("p1")]);
  });

  it("untags a person", () => {
    const r = newMemory();
    if (!r.ok) return;
    const m = r.value
      .tagPerson(PersonId("p1"))
      .tagPerson(PersonId("p2"))
      .untagPerson(PersonId("p1"));
    expect(m.taggedPeople).toEqual([PersonId("p2")]);
  });

  it("is immutable on tag operations (returns a new instance)", () => {
    const r = newMemory();
    if (!r.ok) return;
    const original = r.value;
    const tagged = original.tagPerson(PersonId("p1"));
    expect(original.taggedPeople).toEqual([]);
    expect(tagged).not.toBe(original);
  });

  it("edits caption, date, place via edit()", () => {
    const r = newMemory();
    if (!r.ok) return;
    const edited = r.value.edit({
      caption: "Updated",
      date: ApproximateDate.day(2020, 1, 2),
      place: "Goa",
    });
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.value.caption).toBe("Updated");
    expect(edited.value.date?.precision).toBe("day");
    expect(edited.value.place).toBe("Goa");
  });

  it("rejects editing to an empty caption", () => {
    const r = newMemory();
    if (!r.ok) return;
    const edited = r.value.edit({ caption: "" });
    expect(edited.ok).toBe(false);
  });

  it("links to an event", () => {
    const r = newMemory();
    if (!r.ok) return;
    const linked = r.value.linkToEvent(EventId("e9"));
    expect(linked.eventId).toBe("e9");
  });
});
