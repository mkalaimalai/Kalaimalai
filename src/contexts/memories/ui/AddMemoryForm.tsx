"use client";

import * as React from "react";
import { Button, Field, Input } from "@/shared/ui";
import type { ApproximateDateJSON } from "@/shared/kernel";
import type { AddMemoryInput } from "../application";
import { useAddMemoryMutation } from "./api";

function parseDate(value: string): ApproximateDateJSON | null {
  // Accepts "YYYY", "YYYY-MM", or "YYYY-MM-DD".
  const m = /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) : null;
  const day = m[3] ? Number(m[3]) : null;
  return { year, month, day };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * One-tap "add a memory" form. Caption, optional date/place, optional photo
 * (file → data URL via FileReader), and a tag/confirm chip UI for tagging people.
 * The chip list with confirm/remove is built so Phase-1 face recognition can
 * reuse it (TECHNICAL_DESIGN §10.2): suggestions become unconfirmed chips.
 */
export function AddMemoryForm({ onAdded }: { onAdded?: (id: string) => void }) {
  const [caption, setCaption] = React.useState("");
  const [dateText, setDateText] = React.useState("");
  const [place, setPlace] = React.useState("");
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [addMemory, { isLoading }] = useAddMemoryMutation();

  function addTag() {
    const value = tagInput.trim();
    if (value && !tags.includes(value)) setTags((t) => [...t, value]);
    setTagInput("");
  }

  function removeTag(value: string) {
    setTags((t) => t.filter((x) => x !== value));
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setDataUrl(null);
      return;
    }
    setDataUrl(await readFileAsDataUrl(file));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (caption.trim().length === 0) {
      setError("Please add a caption.");
      return;
    }
    const date = dateText ? parseDate(dateText) : null;
    if (dateText && !date) {
      setError("Date must look like 2019, 2019-11, or 2019-11-01.");
      return;
    }
    const input: AddMemoryInput = {
      caption: caption.trim(),
      media: dataUrl ?? "data:,",
      storeMedia: dataUrl !== null,
      date,
      place: place.trim() || null,
      taggedPeople: tags,
    };
    const result = await addMemory(input);
    if ("error" in result) {
      setError("Could not save this memory. Please try again.");
      return;
    }
    setCaption("");
    setDateText("");
    setPlace("");
    setTags([]);
    setDataUrl(null);
    onAdded?.(result.data.id);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Add a memory">
      <Field label="Caption" htmlFor="memory-caption">
        <Input
          id="memory-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          required
          placeholder="What's the story?"
        />
      </Field>

      <Field
        label="Date"
        htmlFor="memory-date"
        hint="Year, month, or full day — e.g. 2019, 2019-11, 2019-11-01"
      >
        <Input
          id="memory-date"
          value={dateText}
          onChange={(e) => setDateText(e.target.value)}
          placeholder="2019-11-01"
        />
      </Field>

      <Field label="Place" htmlFor="memory-place">
        <Input
          id="memory-place"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Chennai"
        />
      </Field>

      <Field label="Photo" htmlFor="memory-photo">
        <input
          id="memory-photo"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="min-h-target"
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="font-medium">Tagged people</legend>
        <div className="flex gap-2">
          <Input
            id="memory-tag"
            aria-label="Person id to tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Person id"
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 p-0">
            {tags.map((tag) => (
              <li key={tag}>
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-border px-3 py-1 text-sm">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="font-bold"
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isLoading}>
        {isLoading ? "Saving…" : "Add memory"}
      </Button>
    </form>
  );
}
