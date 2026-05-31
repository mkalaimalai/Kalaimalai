"use client";

import * as React from "react";
import { Card, CardContent } from "@/shared/ui";
import { useGetActivityFeedQuery } from "./api";
import type { FeedItemDTO } from "../application/dtos";

const KIND_LABEL: Record<FeedItemDTO["kind"], string> = {
  "new-memory": "New memory",
  reaction: "Reaction",
  comment: "Comment",
  wish: "Wish",
};

function formatWhen(createdAtMs: number): string {
  if (!Number.isFinite(createdAtMs) || createdAtMs <= 0) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(createdAtMs));
}

/**
 * The `/feed` light activity feed (TECHNICAL_DESIGN §10.5). Renders a
 * chronological list of recent activity ("New photo…", reactions, comments,
 * wishes). Accessible: a labelled list with semantic items.
 */
export function ActivityFeed({ limit }: { limit?: number }) {
  const { data, isLoading, isError } = useGetActivityFeedQuery(
    limit !== undefined ? { limit } : undefined,
  );

  if (isLoading) {
    return (
      <p role="status" className="text-muted-foreground">
        Loading the family feed…
      </p>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-muted-foreground">
        Could not load the activity feed.
      </p>
    );
  }

  const items = data ?? [];

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        Nothing here yet. New photos, reactions, comments and wishes will show up
        here.
      </p>
    );
  }

  return (
    <ul aria-label="Family activity feed" className="flex flex-col gap-3">
      {items.map((item) => {
        const when = formatWhen(item.createdAtMs);
        return (
          <li key={item.id}>
            <Card>
              <CardContent className="flex items-start gap-3 py-4">
                <span
                  className="rounded-md bg-muted px-2 py-1 text-sm font-medium text-muted-foreground"
                  aria-hidden="true"
                >
                  {KIND_LABEL[item.kind]}
                </span>
                <div className="flex flex-col">
                  <span className="text-base">
                    <span className="sr-only">{KIND_LABEL[item.kind]}: </span>
                    {item.summary}
                  </span>
                  {when ? (
                    <span className="text-sm text-muted-foreground">{when}</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
