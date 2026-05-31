"use client";

import * as React from "react";
import { Button, Field, Input } from "@/shared/ui";
import { useCommentOnMemoryMutation, useListCommentsQuery } from "./api";
import type { EngagementTarget } from "./ReactionsBar";

/**
 * Inline comments widget (TECHNICAL_DESIGN §10.5). Reusable on memories and
 * profiles via the `target` prop. Posting is supported for Memory targets
 * (CommentOnMemory); for other targets the list is read-only. Accessible:
 * labelled input, semantic list, ≥44px targets.
 */
export function CommentList({
  target,
  memberId,
}: {
  target: EngagementTarget;
  memberId?: string;
}) {
  const inputId = React.useId();
  const { data: comments = [] } = useListCommentsQuery({
    targetType: target.type,
    targetId: target.id,
  });
  const [commentOnMemory, { isLoading }] = useCommentOnMemoryMutation();
  const [text, setText] = React.useState("");

  const canComment = target.type === "Memory" && memberId !== undefined;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!canComment || memberId === undefined || trimmed.length === 0) return;
    const result = await commentOnMemory({
      memberId,
      memoryId: target.id,
      text: trimmed,
    });
    if ("data" in result) setText("");
  };

  return (
    <div className="flex flex-col gap-3">
      {comments.length > 0 ? (
        <ul aria-label="Comments" className="flex flex-col gap-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg bg-muted px-3 py-2 text-base">
              {c.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">No comments yet.</p>
      )}

      {canComment ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <Field label="Add a comment" htmlFor={inputId}>
            <Input
              id={inputId}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write something kind…"
            />
          </Field>
          <Button
            type="submit"
            disabled={isLoading || text.trim().length === 0}
            className="self-start"
          >
            Post comment
          </Button>
        </form>
      ) : null}
    </div>
  );
}
