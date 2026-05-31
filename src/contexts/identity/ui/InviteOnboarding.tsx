"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
} from "@/shared/ui";
import { useRedeemInviteMutation } from "./api";

export interface InviteOnboardingProps {
  /** The invite token from the `/invite/[token]` route. */
  token: string;
}

/**
 * InviteOnboarding — the redeem-invite flow for `/invite/[token]`
 * (TECHNICAL_DESIGN §10.6). Collects a display name, redeems the invite, and
 * shows the pending state on success. Elder-first: labelled input, large target.
 */
export function InviteOnboarding({
  token,
}: InviteOnboardingProps): React.ReactElement {
  const [displayName, setDisplayName] = React.useState("");
  const [redeemInvite, { data: member, isLoading, error }] =
    useRedeemInviteMutation();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim() === "") return;
    void redeemInvite({ token, displayName: displayName.trim() });
  };

  if (member) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You&apos;re almost in</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Thanks, {member.displayName}. Your request is{" "}
            <strong>pending</strong> approval by a family Admin. You&apos;ll get
            access once it&apos;s approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join your family</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            label="Your name"
            htmlFor="invite-display-name"
            hint="This is how your family will see you."
          >
            <Input
              id="invite-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              required
            />
          </Field>
          {error ? (
            <p role="alert" className="text-base text-red-600">
              This invite can&apos;t be used. It may have expired or already been
              used.
            </p>
          ) : null}
          <Button
            type="submit"
            size="lg"
            disabled={isLoading || displayName.trim() === ""}
          >
            {isLoading ? "Joining…" : "Join the family"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
