"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  Field,
  Input,
  Select,
  cn,
} from "@/shared/ui";
import type { MemoryDTO } from "../application";
import { useListAlbumsQuery, useListMemoriesQuery } from "./api";
import { formatApproximateDate } from "./format";

/** Presentational card for a single memory. Accessible: caption is the alt text. */
export function MemoryCard({ memory }: { memory: MemoryDTO }) {
  const dateLabel = formatApproximateDate(memory.date);
  return (
    <Card className="overflow-hidden focus-within:ring-2 focus-within:ring-primary">
      <a
        href={`/memories/${memory.id}`}
        className="block focus:outline-none"
        aria-label={`Memory: ${memory.caption}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={memory.mediaRef}
          alt={memory.caption}
          className="h-48 w-full bg-muted object-cover"
        />
      </a>
      <CardContent className="space-y-1">
        <p className="font-medium">{memory.caption}</p>
        {(dateLabel || memory.place) && (
          <p className="text-sm text-muted-foreground">
            {[dateLabel, memory.place].filter(Boolean).join(" · ")}
          </p>
        )}
        {memory.taggedPeople.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {memory.taggedPeople.length} tagged
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export interface MemoryGridProps {
  /** Optional fixed album scope (used by the album page). */
  albumId?: string;
  className?: string;
}

/**
 * Responsive grid of memory cards with filters by person, year, and album.
 * Container component: reads via RTK Query hooks. Keyboard-navigable links and
 * labelled filter controls (N5).
 */
export function MemoryGrid({ albumId, className }: MemoryGridProps) {
  const [personId, setPersonId] = React.useState("");
  const [year, setYear] = React.useState("");
  const [album, setAlbum] = React.useState(albumId ?? "");

  const filter = {
    ...(personId ? { personId } : {}),
    ...(year ? { year: Number(year) } : {}),
    ...(album ? { albumId: album } : {}),
  };

  const { data: memories = [], isLoading } = useListMemoriesQuery(filter);
  const { data: albums = [] } = useListAlbumsQuery();

  return (
    <section className={cn("space-y-4", className)} aria-label="Memories">
      {albumId === undefined && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Person" htmlFor="filter-person">
            <Input
              id="filter-person"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              placeholder="Person id"
            />
          </Field>
          <Field label="Year" htmlFor="filter-year">
            <Input
              id="filter-year"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 2019"
            />
          </Field>
          <Field label="Album" htmlFor="filter-album">
            <Select
              id="filter-album"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
            >
              <option value="">All albums</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {isLoading ? (
        <p role="status">Loading memories…</p>
      ) : memories.length === 0 ? (
        <p role="status" className="text-muted-foreground">
          No memories yet.
        </p>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {memories.map((m) => (
            <li key={m.id}>
              <MemoryCard memory={m} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
