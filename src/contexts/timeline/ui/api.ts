import { api } from "@/store/api";
import { getContainer } from "@/bootstrap/container";
import { runValue } from "@/store/query-fn";
import type { TimelineDTO } from "../application/dtos";
import type {
  BuildTimelineInput,
  GetOnThisDayInput,
} from "../application/timeline.use-cases";

/**
 * RTK Query endpoints for Timeline (AGENT_CONTRACTS "RTK Query endpoints").
 * Injected into the shared `api`. `queryFn`s resolve the Timeline module from
 * the composition root and run its read use cases via `runValue`. Tagged
 * `Timeline` so producer mutations can invalidate it.
 */
export const timelineApi = api.injectEndpoints({
  endpoints: (build) => ({
    buildTimeline: build.query<TimelineDTO, BuildTimelineInput>({
      queryFn: (arg) => runValue(getContainer().timeline.buildTimeline(arg)),
      providesTags: ["Timeline"],
    }),
    getOnThisDay: build.query<TimelineDTO, GetOnThisDayInput>({
      queryFn: (arg) => runValue(getContainer().timeline.getOnThisDay(arg)),
      providesTags: ["Timeline"],
    }),
  }),
});

export const { useBuildTimelineQuery, useGetOnThisDayQuery } = timelineApi;
