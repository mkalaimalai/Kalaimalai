import { describe, it, expect } from "vitest";
import { ApproximateDate, AlbumId } from "@/shared/kernel";
import { Album } from "./album";

describe("Album", () => {
  it("creates a valid album", () => {
    const r = Album.create({
      id: AlbumId("a1"),
      title: "Diwali 2019",
      date: ApproximateDate.year(2019),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.title).toBe("Diwali 2019");
    expect(r.value.date?.year).toBe(2019);
  });

  it("rejects an empty title", () => {
    const r = Album.create({ id: AlbumId("a1"), title: "  " });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("ALBUM_TITLE_REQUIRED");
  });

  it("allows a dateless album", () => {
    const r = Album.create({ id: AlbumId("a1"), title: "Family" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.date).toBeNull();
  });
});
