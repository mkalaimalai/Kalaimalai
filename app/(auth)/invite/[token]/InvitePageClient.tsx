"use client";

import { useParams } from "next/navigation";
import { InviteOnboarding } from "@/contexts/identity/ui/InviteOnboarding";

export function InvitePageClient() {
  const params = useParams<{ token: string }>();
  return (
    <div className="mx-auto max-w-md">
      <InviteOnboarding token={params.token} />
    </div>
  );
}
