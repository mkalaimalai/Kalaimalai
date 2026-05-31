"use client";

import * as React from "react";
import { Button, cn } from "@/shared/ui";
import type { NotificationChannel } from "../application";

export interface WouldSendToastProps {
  channel: NotificationChannel;
  /** Display name or handle of the recipient, e.g. "Meena" or "+1 555…". */
  to: string;
  /** Optional occasion, e.g. "Birthday". */
  occasion?: string;
  /** Optional shareable deep-link (e.g. a wa.me link) to copy. */
  deepLink?: string;
  className?: string;
}

/**
 * WouldSendToast — tiny presentational surface for the outbound STUB
 * (TECHNICAL_DESIGN §10.7). Shows intent ("Would send a WhatsApp to …") and, when
 * present, a copyable deep-link for manual share (PRD F6.2). No real delivery.
 */
export function WouldSendToast({
  channel,
  to,
  occasion,
  deepLink,
  className,
}: WouldSendToastProps): React.JSX.Element {
  const [copied, setCopied] = React.useState(false);

  const copy = React.useCallback(async () => {
    if (!deepLink) return;
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [deepLink]);

  const channelLabel = channel === "WhatsApp" ? "WhatsApp message" : "email";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-lg border-2 border-border bg-background p-4 text-foreground",
        className,
      )}
    >
      <p className="text-base">
        Would send a {channelLabel} to <strong>{to}</strong>
        {occasion ? <> for their {occasion}</> : null}.
      </p>

      {deepLink ? (
        <div className="mt-3 flex flex-col gap-2">
          <label
            htmlFor="would-send-deep-link"
            className="text-sm text-muted-foreground"
          >
            Shareable link
          </label>
          <div className="flex items-center gap-2">
            <input
              id="would-send-deep-link"
              readOnly
              value={deepLink}
              className="min-h-target flex-1 rounded-lg border-2 border-border bg-muted px-3 text-base"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button variant="outline" onClick={copy} aria-label="Copy share link">
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
