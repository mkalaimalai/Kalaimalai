"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { useListAlbumsQuery } from "./api";
import { MemoryGrid } from "./MemoryGrid";
import { formatApproximateDate } from "./format";

/**
 * Album page: the album's heading plus its memories (scoped via MemoryGrid's
 * fixed `albumId`). Reads the album list to resolve the title/date for the id.
 */
export function AlbumView({ albumId }: { albumId: string }) {
  const { data: albums = [], isLoading } = useListAlbumsQuery();
  const album = albums.find((a) => a.id === albumId);

  return (
    <section aria-label="Album" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? "Loading…" : (album?.title ?? "Album not found")}
          </CardTitle>
        </CardHeader>
        {album?.date && (
          <CardContent className="text-muted-foreground">
            {formatApproximateDate(album.date)}
          </CardContent>
        )}
      </Card>

      {album && <MemoryGrid albumId={albumId} />}
    </section>
  );
}
