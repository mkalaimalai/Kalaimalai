import type { SharedDeps } from "@/bootstrap/container";
import type { MemoryView } from "@/shared/views";
import {
  createMemoriesUseCases,
  type AddMemoryInput,
  type AlbumDTO,
  type CreateAlbumInput,
  type CreateEventInput,
  type EditMemoryInput,
  type EventDTO,
  type ListMemoriesFilter,
  type MemoryDTO,
} from "./application";
import {
  KeyValueMediaStore,
  LocalStorageAlbumRepository,
  LocalStorageEventRepository,
  LocalStorageMemoryRepository,
} from "./infrastructure";
import type { Result } from "@/shared/kernel";

/**
 * Public surface of the Memories context: bound use cases plus the cross-context
 * producer query `listMemoryViews` (AGENT_CONTRACTS §"Cross-context reads").
 */
export interface MemoriesModule {
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
  /** Cross-context read shape for downstream contexts (Timeline, Engagement). */
  listMemoryViews(): Promise<MemoryView[]>;
}

export function createMemoriesModule(deps: SharedDeps): MemoriesModule {
  const memories = new LocalStorageMemoryRepository(deps.store);
  const albums = new LocalStorageAlbumRepository(deps.store);
  const events = new LocalStorageEventRepository(deps.store);
  const media = new KeyValueMediaStore(deps.store, deps.ids);

  return createMemoriesUseCases({
    memories,
    albums,
    events,
    media,
    ids: deps.ids,
    clock: deps.clock,
  });
}
