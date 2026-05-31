import type { ApproximateDateJSON } from "@/shared/kernel";

/**
 * Plain, serializable DTOs. UI and the store never see live domain entities
 * (AGENT_CONTRACTS rule 6): dates are `ApproximateDateJSON`, ids are raw strings.
 */

export interface MemoryDTO {
  id: string;
  caption: string;
  mediaRef: string;
  date: ApproximateDateJSON | null;
  place: string | null;
  taggedPeople: string[];
  albumId: string | null;
  eventId: string | null;
}

export interface AlbumDTO {
  id: string;
  title: string;
  date: ApproximateDateJSON | null;
}

export interface DateRangeJSON {
  start: ApproximateDateJSON;
  end: ApproximateDateJSON;
}

export interface EventDTO {
  id: string;
  title: string;
  date: ApproximateDateJSON | null;
  dateRange: DateRangeJSON | null;
}
