"use client";

import * as React from "react";
import { TimelineView } from "@/contexts/timeline/ui/TimelineView";
import { useGetTreeQuery } from "@/contexts/genealogy/ui/api";

export default function TimelinePage() {
  // Supply the person picker options from the genealogy read view.
  const { data: tree } = useGetTreeQuery();
  const people = (tree?.nodes ?? []).map((n) => ({
    id: n.id,
    displayName: n.displayName,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Timeline</h1>
        <p className="text-muted-foreground">
          Births, milestones, and memories in chronological order.
        </p>
      </div>
      <TimelineView people={people} />
    </div>
  );
}
