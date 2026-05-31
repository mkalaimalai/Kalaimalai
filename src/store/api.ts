import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * The single shared RTK Query API. RTK Query is treated as a DRIVING adapter
 * (TECHNICAL_DESIGN §7): endpoints use `fakeBaseQuery` and a custom `queryFn`
 * that resolves a use case from the composition root (`getContainer()`), instead
 * of hitting HTTP. Each bounded context injects its endpoints with
 * `api.injectEndpoints(...)` from its `ui/` layer, so this file stays stable.
 *
 * When a backend lands, endpoints either keep `queryFn` (now backed by HTTP
 * repositories) or move to `fetchBaseQuery` — components do not change.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    "Person",
    "Relationship",
    "Tree",
    "ChangeRequest",
    "Memory",
    "Album",
    "Event",
    "Timeline",
    "Reminder",
    "Reaction",
    "Comment",
    "Wish",
    "Feed",
    "Member",
    "Invite",
    "Notification",
  ],
  endpoints: () => ({}),
});
