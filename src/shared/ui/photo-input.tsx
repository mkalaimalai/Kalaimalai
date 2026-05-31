"use client";

import * as React from "react";
import { cn } from "./cn";
import { resizeImageToDataUrl } from "./image-resize";

export interface PhotoInputProps {
  /** Current photo data URL, or null. */
  value: string | null;
  /** Called with a new data URL, or null when removed. */
  onChange: (dataUrl: string | null) => void;
  /** Initials shown when there is no photo. */
  fallback?: string;
  className?: string;
}

/**
 * Click-to-upload circular avatar. Resizes the chosen image to a 256px JPEG
 * data URL before handing it up — keeping localStorage small.
 */
export function PhotoInput({
  value,
  onChange,
  fallback = "?",
  className,
}: PhotoInputProps): React.JSX.Element {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError(null);
    try {
      onChange(await resizeImageToDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-muted"
        aria-label={value ? "Change photo" : "Add a photo"}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
            {fallback}
          </span>
        )}
      </button>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-semibold text-brand hover:underline"
        >
          {value ? "Change photo" : "Add a photo"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-left text-sm text-muted-foreground hover:underline"
          >
            Remove
          </button>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-maternal">
            {error}
          </p>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={pick}
        className="hidden"
      />
    </div>
  );
}
