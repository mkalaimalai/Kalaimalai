"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import type { PersonProfileDTO } from "../application/dtos";
import { formatApproxDate, lifespan } from "./format";

export interface PersonProfileProps {
  profile: PersonProfileDTO;
  /** Render a related person as a link target — integrator supplies routing. */
  onSelectPerson?: (personId: string) => void;
}

/**
 * Presentational person profile (TECHNICAL_DESIGN §10.1): dates via
 * ApproximateDate formatting, a relationships list with plain-language labels,
 * and lifecycle/visibility status. Takes a DTO prop only — no data fetching.
 */
export function PersonProfile({
  profile,
  onSelectPerson,
}: PersonProfileProps): React.JSX.Element {
  const { person, relationships } = profile;
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{person.displayName}</CardTitle>
          {person.nickname ? (
            <p className="text-muted-foreground">Legal name: {person.legalName}</p>
          ) : null}
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <Detail term="Lineage" value={person.branch} />
            <Detail term="Gender" value={person.gender} />
            <Detail term="Born" value={formatApproxDate(person.birth)} />
            {person.isDeceased ? (
              <Detail term="Passed" value={formatApproxDate(person.passing)} />
            ) : (
              <Detail term="Status" value="Living" />
            )}
            {person.birthplace ? (
              <Detail term="Birthplace" value={person.birthplace} />
            ) : null}
            {person.currentLocation ? (
              <Detail term="Location" value={person.currentLocation} />
            ) : null}
            <Detail term="Visibility" value={person.visibility} />
          </dl>
          {person.bio ? <p className="mt-4">{person.bio}</p> : null}
          <p className="sr-only">{lifespan(person)}</p>
        </CardContent>
      </Card>

      <section aria-labelledby="relationships-heading">
        <h2 id="relationships-heading" className="mb-3 text-lg font-semibold">
          Relationships
        </h2>
        {relationships.length === 0 ? (
          <p className="text-muted-foreground">No relationships recorded yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {relationships.map((rel) => (
              <li key={rel.relationship.id}>
                <button
                  type="button"
                  onClick={() => onSelectPerson?.(rel.person.id)}
                  className="flex min-h-target w-full items-center justify-between rounded-lg border-2 border-border px-4 text-left hover:bg-muted"
                >
                  <span className="font-medium">{rel.person.displayName}</span>
                  <span className="text-muted-foreground">{rel.relation}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Detail({ term, value }: { term: string; value: string }): React.JSX.Element {
  return (
    <>
      <dt className="font-medium text-muted-foreground">{term}</dt>
      <dd>{value}</dd>
    </>
  );
}
