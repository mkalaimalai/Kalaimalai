export * from "./memories.module";
export type {
  MemoryDTO,
  AlbumDTO,
  EventDTO,
  DateRangeJSON,
  AddMemoryInput,
  EditMemoryInput,
  CreateAlbumInput,
  CreateEventInput,
  ListMemoriesFilter,
} from "./application";

import type { MemoriesModule } from "./memories.module";

declare module "@/bootstrap/container" {
  interface AppContainer {
    memories: MemoriesModule;
  }
}
