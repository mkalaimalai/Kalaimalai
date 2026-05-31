import { api } from "@/store/api";
import { getContainer } from "@/bootstrap/container";
import { runResult, runValue } from "@/store/query-fn";
import type {
  AddMemoryInput,
  AlbumDTO,
  CreateAlbumInput,
  ListMemoriesFilter,
  MemoryDTO,
} from "../application";

/**
 * RTK Query endpoints for the Memories context (driving adapter). Each `queryFn`
 * resolves the module from the composition root and invokes a use case.
 */
export const memoriesApi = api.injectEndpoints({
  endpoints: (build) => ({
    listMemories: build.query<MemoryDTO[], ListMemoriesFilter | void>({
      queryFn: (filter) =>
        runValue(getContainer().memories.listMemoriesFor(filter ?? undefined)),
      providesTags: ["Memory"],
    }),
    getMemory: build.query<MemoryDTO | null, string>({
      queryFn: (id) => runValue(getContainer().memories.getMemory(id)),
      providesTags: ["Memory"],
    }),
    listAlbums: build.query<AlbumDTO[], void>({
      queryFn: () => runValue(getContainer().memories.listAlbums()),
      providesTags: ["Album"],
    }),
    addMemory: build.mutation<MemoryDTO, AddMemoryInput>({
      queryFn: (input) => runResult(getContainer().memories.addMemory(input)),
      invalidatesTags: ["Memory", "Timeline", "Feed"],
    }),
    tagPersonInMemory: build.mutation<
      MemoryDTO,
      { memoryId: string; personId: string }
    >({
      queryFn: ({ memoryId, personId }) =>
        runResult(
          getContainer().memories.tagPersonInMemory(memoryId, personId),
        ),
      invalidatesTags: ["Memory"],
    }),
    createAlbum: build.mutation<AlbumDTO, CreateAlbumInput>({
      queryFn: (input) => runResult(getContainer().memories.createAlbum(input)),
      invalidatesTags: ["Album"],
    }),
  }),
});

export const {
  useListMemoriesQuery,
  useGetMemoryQuery,
  useListAlbumsQuery,
  useAddMemoryMutation,
  useTagPersonInMemoryMutation,
  useCreateAlbumMutation,
} = memoriesApi;
