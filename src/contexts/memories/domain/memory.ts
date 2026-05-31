import {
  type AlbumId,
  type ApproximateDate,
  type EventId,
  type MemoryId,
  type PersonId,
  type Result,
  fail,
  ok,
} from "@/shared/kernel";

/**
 * Memory aggregate root (TECHNICAL_DESIGN §4.3, §10.2). A single photo/memory:
 * caption/story, optional approximate date and place, the people tagged in it,
 * optional album/event grouping, and a reference to its media (a media-store key
 * or a data URL). Immutable: mutating operations return a new instance.
 */

export interface MemoryProps {
  readonly id: MemoryId;
  readonly caption: string;
  readonly mediaRef: string;
  readonly date?: ApproximateDate;
  readonly place?: string;
  readonly taggedPeople?: readonly PersonId[];
  readonly albumId?: AlbumId;
  readonly eventId?: EventId;
}

export interface MemoryEdit {
  readonly caption?: string;
  readonly date?: ApproximateDate;
  readonly place?: string;
}

function dedupe(ids: readonly PersonId[]): PersonId[] {
  return Array.from(new Set(ids));
}

/** Mutable patch used internally by `with`/`edit` (props are externally readonly). */
type MemoryPatch = {
  -readonly [K in keyof MemoryProps]?: MemoryProps[K];
};

export class Memory {
  private constructor(
    readonly id: MemoryId,
    readonly caption: string,
    readonly mediaRef: string,
    readonly date: ApproximateDate | null,
    readonly place: string | null,
    readonly taggedPeople: readonly PersonId[],
    readonly albumId: AlbumId | null,
    readonly eventId: EventId | null,
  ) {}

  static create(props: MemoryProps): Result<Memory> {
    const caption = props.caption.trim();
    if (caption.length === 0) {
      return fail("MEMORY_CAPTION_REQUIRED", "A memory needs a caption.");
    }
    if (props.mediaRef.trim().length === 0) {
      return fail("MEMORY_MEDIA_REQUIRED", "A memory needs a media reference.");
    }
    return ok(
      new Memory(
        props.id,
        caption,
        props.mediaRef,
        props.date ?? null,
        props.place?.trim() ? props.place.trim() : null,
        dedupe(props.taggedPeople ?? []),
        props.albumId ?? null,
        props.eventId ?? null,
      ),
    );
  }

  private with(patch: MemoryPatch): Memory {
    return new Memory(
      patch.id ?? this.id,
      patch.caption ?? this.caption,
      patch.mediaRef ?? this.mediaRef,
      patch.date !== undefined ? patch.date : this.date,
      patch.place !== undefined ? patch.place : this.place,
      patch.taggedPeople !== undefined
        ? dedupe(patch.taggedPeople)
        : this.taggedPeople,
      patch.albumId !== undefined ? patch.albumId : this.albumId,
      patch.eventId !== undefined ? patch.eventId : this.eventId,
    );
  }

  tagPerson(personId: PersonId): Memory {
    if (this.taggedPeople.includes(personId)) return this;
    return this.with({ taggedPeople: [...this.taggedPeople, personId] });
  }

  untagPerson(personId: PersonId): Memory {
    if (!this.taggedPeople.includes(personId)) return this;
    return this.with({
      taggedPeople: this.taggedPeople.filter((p) => p !== personId),
    });
  }

  linkToEvent(eventId: EventId): Memory {
    return this.with({ eventId });
  }

  linkToAlbum(albumId: AlbumId): Memory {
    return this.with({ albumId });
  }

  edit(changes: MemoryEdit): Result<Memory> {
    const next: MemoryPatch = {};
    if (changes.caption !== undefined) {
      const caption = changes.caption.trim();
      if (caption.length === 0) {
        return fail("MEMORY_CAPTION_REQUIRED", "A memory needs a caption.");
      }
      next.caption = caption;
    }
    if (changes.date !== undefined) next.date = changes.date;
    if (changes.place !== undefined && changes.place.trim().length > 0) {
      next.place = changes.place.trim();
    }
    return ok(this.with(next));
  }
}
