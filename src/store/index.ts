import { configureStore, type Reducer } from "@reduxjs/toolkit";
import { api } from "./api";

/**
 * Root store. The shared RTK Query `api` is always present; bounded contexts may
 * contribute local UI-state slices, which the composition root passes in via
 * `extraReducers` at integration (keeps this file free of context imports).
 */
export function makeStore(
  extraReducers: Record<string, Reducer> = {},
): ReturnType<typeof configureStore> {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      ...extraReducers,
    },
    middleware: (getDefault) =>
      getDefault({
        // Domain DTOs handed to the store are plain & serializable by design
        // (TECHNICAL_DESIGN §7), so the default serializable check stays on.
      }).concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
