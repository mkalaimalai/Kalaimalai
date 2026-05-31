"use client";

import { ActivityFeed } from "@/contexts/engagement/ui/ActivityFeed";

export default function FeedPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-muted-foreground">
          The latest across your family — new photos, reactions, and wishes.
        </p>
      </div>
      <ActivityFeed limit={50} />
    </div>
  );
}
