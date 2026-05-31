"use client";

import * as React from "react";
import { Button } from "@/shared/ui";
import { useListReactionsQuery, useReactToMemoryMutation } from "./api";
import type { TargetType } from "../domain/target";

export interface EngagementTarget {
  type: TargetType;
  id: string;
}

const REACTION_KINDS: ReadonlyArray<{ kind: string; label: string; glyph: string }> = [
  { kind: "heart", label: "Love", glyph: "♥" },
  { kind: "smile", label: "Smile", glyph: "☺" },
  { kind: "clap", label: "Celebrate", glyph: "👏" },
];

/**
 * Inline reactions widget (TECHNICAL_DESIGN §10.5). Reusable on memories and
 * profiles via the `target` prop. Posting is currently supported for Memory
 * targets (ReactToMemory); for other targets the counts are read-only.
 * Accessible: labelled buttons, live count region, ≥44px targets via Button.
 */
export function ReactionsBar({
  target,
  memberId,
}: {
  target: EngagementTarget;
  memberId?: string;
}) {
  const { data: reactions = [] } = useListReactionsQuery({
    targetType: target.type,
    targetId: target.id,
  });
  const [reactToMemory, { isLoading }] = useReactToMemoryMutation();

  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reactions) map.set(r.kind, (map.get(r.kind) ?? 0) + 1);
    return map;
  }, [reactions]);

  const canReact = target.type === "Memory" && memberId !== undefined;

  const onReact = (kind: string) => {
    if (!canReact || memberId === undefined) return;
    void reactToMemory({ memberId, memoryId: target.id, kind });
  };

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Reactions">
      {REACTION_KINDS.map(({ kind, label, glyph }) => {
        const count = counts.get(kind) ?? 0;
        return (
          <Button
            key={kind}
            variant="outline"
            size="md"
            disabled={!canReact || isLoading}
            aria-label={`${label}${count > 0 ? ` (${count})` : ""}`}
            onClick={() => onReact(kind)}
          >
            <span aria-hidden="true">{glyph}</span>
            <span aria-hidden="true">{count > 0 ? count : ""}</span>
          </Button>
        );
      })}
    </div>
  );
}
