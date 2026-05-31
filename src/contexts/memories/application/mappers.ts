import type { MemoryView } from "@/shared/views";
import type { Album, FamilyEvent, Memory } from "../domain";
import type { AlbumDTO, EventDTO, MemoryDTO } from "./dtos";

/** Domain → DTO / view mappers. The only place live entities become plain data. */

export function toMemoryDTO(m: Memory): MemoryDTO {
  return {
    id: m.id,
    caption: m.caption,
    mediaRef: m.mediaRef,
    date: m.date ? m.date.toJSON() : null,
    place: m.place,
    taggedPeople: [...m.taggedPeople],
    albumId: m.albumId,
    eventId: m.eventId,
  };
}

export function toAlbumDTO(a: Album): AlbumDTO {
  return {
    id: a.id,
    title: a.title,
    date: a.date ? a.date.toJSON() : null,
  };
}

export function toEventDTO(e: FamilyEvent): EventDTO {
  return {
    id: e.id,
    title: e.title,
    date: e.date ? e.date.toJSON() : null,
    dateRange: e.dateRange
      ? {
          start: e.dateRange.start.toJSON(),
          end: e.dateRange.end.toJSON(),
        }
      : null,
  };
}

/** Cross-context read shape (AGENT_CONTRACTS §"Cross-context reads"). */
export function toMemoryView(m: Memory): MemoryView {
  return {
    id: m.id,
    caption: m.caption,
    date: m.date ? m.date.toJSON() : null,
    place: m.place,
    taggedPersonIds: [...m.taggedPeople],
    albumId: m.albumId,
    mediaRef: m.mediaRef,
  };
}
