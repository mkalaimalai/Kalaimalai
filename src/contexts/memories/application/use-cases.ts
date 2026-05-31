import {
  AlbumId,
  ApproximateDate,
  type ApproximateDateJSON,
  EventId,
  MemoryId,
  PersonId,
  type Result,
  fail,
  ok,
} from "@/shared/kernel";
import type { Clock, IdGenerator } from "@/shared/ports";
import type { MemoryView } from "@/shared/views";
import { Album, FamilyEvent, Memory } from "../domain";
import type { AlbumDTO, EventDTO, MemoryDTO } from "./dtos";
import { toAlbumDTO, toEventDTO, toMemoryDTO, toMemoryView } from "./mappers";
import type {
  AlbumRepository,
  EventRepository,
  MediaStore,
  MemoryRepository,
} from "./ports";

/** Inputs are plain & serializable (mirror DTOs): dates as `ApproximateDateJSON`. */

export interface AddMemoryInput {
  caption: string;
  /** A media-store key OR a data URL/blob string to persist via the MediaStore. */
  media: string;
  /** When true, `media` is a data URL to store; otherwise it is an existing key. */
  storeMedia?: boolean;
  date?: ApproximateDateJSON | null;
  place?: string | null;
  taggedPeople?: string[];
  albumId?: string | null;
  eventId?: string | null;
}

export interface EditMemoryInput {
  id: string;
  caption?: string;
  date?: ApproximateDateJSON | null;
  place?: string | null;
}

export interface CreateAlbumInput {
  title: string;
  date?: ApproximateDateJSON | null;
}

export interface CreateEventInput {
  title: string;
  date?: ApproximateDateJSON | null;
  dateRange?: { start: ApproximateDateJSON; end: ApproximateDateJSON } | null;
}

export interface ListMemoriesFilter {
  personId?: string;
  albumId?: string;
  eventId?: string;
  year?: number;
}

export interface MemoriesDeps {
  memories: MemoryRepository;
  albums: AlbumRepository;
  events: EventRepository;
  media: MediaStore;
  ids: IdGenerator;
  clock: Clock;
}

const date = (json: ApproximateDateJSON | null | undefined): ApproximateDate | undefined =>
  json ? ApproximateDate.fromJSON(json) : undefined;

export interface MemoriesUseCases {
  addMemory(input: AddMemoryInput): Promise<Result<MemoryDTO>>;
  addMemories(inputs: AddMemoryInput[]): Promise<Result<MemoryDTO[]>>;
  editMemory(input: EditMemoryInput): Promise<Result<MemoryDTO>>;
  tagPersonInMemory(
    memoryId: string,
    personId: string,
  ): Promise<Result<MemoryDTO>>;
  untagPersonInMemory(
    memoryId: string,
    personId: string,
  ): Promise<Result<MemoryDTO>>;
  createAlbum(input: CreateAlbumInput): Promise<Result<AlbumDTO>>;
  createEvent(input: CreateEventInput): Promise<Result<EventDTO>>;
  linkMemoryToEvent(
    memoryId: string,
    eventId: string,
  ): Promise<Result<MemoryDTO>>;
  listMemoriesFor(filter?: ListMemoriesFilter): Promise<MemoryDTO[]>;
  getMemory(id: string): Promise<MemoryDTO | null>;
  listAlbums(): Promise<AlbumDTO[]>;
  listEvents(): Promise<EventDTO[]>;
  resolveMedia(key: string): Promise<string | null>;
  listMemoryViews(): Promise<MemoryView[]>;
}

export function createMemoriesUseCases(deps: MemoriesDeps): MemoriesUseCases {
  const { memories, albums, events, media, ids } = deps;

  async function resolveMediaRef(input: AddMemoryInput): Promise<string> {
    if (input.storeMedia) {
      const key = await media.put(input.media);
      return media.putThumbnail(key);
    }
    return input.media;
  }

  async function buildMemory(input: AddMemoryInput): Promise<Result<Memory>> {
    const mediaRef = await resolveMediaRef(input);
    return Memory.create({
      id: MemoryId(ids.next()),
      caption: input.caption,
      mediaRef,
      date: date(input.date),
      place: input.place ?? undefined,
      taggedPeople: (input.taggedPeople ?? []).map((p) => PersonId(p)),
      albumId: input.albumId ? AlbumId(input.albumId) : undefined,
      eventId: input.eventId ? EventId(input.eventId) : undefined,
    });
  }

  async function loadMemory(id: string): Promise<Result<Memory>> {
    const m = await memories.get(MemoryId(id));
    if (!m) return fail("MEMORY_NOT_FOUND", `No memory with id ${id}.`);
    return ok(m);
  }

  return {
    async addMemory(input) {
      const built = await buildMemory(input);
      if (!built.ok) return built;
      await memories.save(built.value);
      return ok(toMemoryDTO(built.value));
    },

    async addMemories(inputs) {
      const built: Memory[] = [];
      for (const input of inputs) {
        const r = await buildMemory(input);
        if (!r.ok) return r;
        built.push(r.value);
      }
      await memories.saveMany(built);
      return ok(built.map(toMemoryDTO));
    },

    async editMemory(input) {
      const loaded = await loadMemory(input.id);
      if (!loaded.ok) return loaded;
      const edited = loaded.value.edit({
        caption: input.caption,
        date: date(input.date),
        place: input.place ?? undefined,
      });
      if (!edited.ok) return edited;
      await memories.save(edited.value);
      return ok(toMemoryDTO(edited.value));
    },

    async tagPersonInMemory(memoryId, personId) {
      const loaded = await loadMemory(memoryId);
      if (!loaded.ok) return loaded;
      const tagged = loaded.value.tagPerson(PersonId(personId));
      await memories.save(tagged);
      return ok(toMemoryDTO(tagged));
    },

    async untagPersonInMemory(memoryId, personId) {
      const loaded = await loadMemory(memoryId);
      if (!loaded.ok) return loaded;
      const untagged = loaded.value.untagPerson(PersonId(personId));
      await memories.save(untagged);
      return ok(toMemoryDTO(untagged));
    },

    async createAlbum(input) {
      const album = Album.create({
        id: AlbumId(ids.next()),
        title: input.title,
        date: date(input.date),
      });
      if (!album.ok) return album;
      await albums.save(album.value);
      return ok(toAlbumDTO(album.value));
    },

    async createEvent(input) {
      const event = FamilyEvent.create({
        id: EventId(ids.next()),
        title: input.title,
        date: date(input.date),
        dateRange: input.dateRange
          ? {
              start: ApproximateDate.fromJSON(input.dateRange.start),
              end: ApproximateDate.fromJSON(input.dateRange.end),
            }
          : undefined,
      });
      if (!event.ok) return event;
      await events.save(event.value);
      return ok(toEventDTO(event.value));
    },

    async linkMemoryToEvent(memoryId, eventId) {
      const loaded = await loadMemory(memoryId);
      if (!loaded.ok) return loaded;
      const existing = await events.get(EventId(eventId));
      if (!existing) {
        return fail("EVENT_NOT_FOUND", `No event with id ${eventId}.`);
      }
      const linked = loaded.value.linkToEvent(EventId(eventId));
      await memories.save(linked);
      return ok(toMemoryDTO(linked));
    },

    async listMemoriesFor(filter) {
      const all = await memories.all();
      const filtered = all.filter((m) => {
        if (filter?.personId && !m.taggedPeople.includes(PersonId(filter.personId))) {
          return false;
        }
        if (filter?.albumId && m.albumId !== filter.albumId) return false;
        if (filter?.eventId && m.eventId !== filter.eventId) return false;
        if (filter?.year !== undefined && m.date?.year !== filter.year) {
          return false;
        }
        return true;
      });
      filtered.sort((a, b) => {
        const ak = a.date?.sortKey() ?? Number.POSITIVE_INFINITY;
        const bk = b.date?.sortKey() ?? Number.POSITIVE_INFINITY;
        return ak - bk;
      });
      return filtered.map(toMemoryDTO);
    },

    async getMemory(id) {
      const m = await memories.get(MemoryId(id));
      return m ? toMemoryDTO(m) : null;
    },

    async listAlbums() {
      const all = await albums.all();
      return all.map(toAlbumDTO);
    },

    async listEvents() {
      const all = await events.all();
      return all.map(toEventDTO);
    },

    async resolveMedia(key) {
      return media.get(key);
    },

    async listMemoryViews() {
      const all = await memories.all();
      return all.map(toMemoryView);
    },
  };
}
