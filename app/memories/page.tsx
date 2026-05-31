"use client";

import * as React from "react";
import { Button, Card, CardContent } from "@/shared/ui";
import { MemoryGrid } from "@/contexts/memories/ui/MemoryGrid";
import { AddMemoryForm } from "@/contexts/memories/ui/AddMemoryForm";

export default function MemoriesPage() {
  const [adding, setAdding] = React.useState(false);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Memories</h1>
          <p className="text-muted-foreground">
            Photos and stories, tagged to the people in them.
          </p>
        </div>
        <Button onClick={() => setAdding((v) => !v)}>
          {adding ? "Close" : "Add a memory"}
        </Button>
      </div>

      {adding ? (
        <Card>
          <CardContent>
            <AddMemoryForm onAdded={() => setAdding(false)} />
          </CardContent>
        </Card>
      ) : null}

      <MemoryGrid />
    </div>
  );
}
