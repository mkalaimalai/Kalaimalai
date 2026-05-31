"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { useGetPersonProfileQuery } from "@/contexts/genealogy/ui/api";
import { PersonProfile } from "@/contexts/genealogy/ui/PersonProfile";
import { ReactionsBar, CommentList } from "@/contexts/engagement";

export default function PersonProfilePage() {
  const router = useRouter();
  const params = useParams<{ personId: string }>();
  const personId = params.personId;
  const { data: profile, isLoading } = useGetPersonProfileQuery(personId);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/tree" className="font-medium text-brand">
        ← Back to the tree
      </Link>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !profile ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground">That person was not found.</p>
          <Button onClick={() => router.push("/tree")}>Back to the tree</Button>
        </div>
      ) : (
        <>
          <PersonProfile
            profile={profile}
            onSelectPerson={(id) => router.push(`/tree/${id}`)}
          />
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Reactions & notes</h2>
            <ReactionsBar target={{ type: "Person", id: personId }} />
            <CommentList target={{ type: "Person", id: personId }} />
          </section>
        </>
      )}
    </div>
  );
}
