"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@/shared/ui";
import type { TreeDTO } from "@/contexts/genealogy";
import { useGetTreeQuery } from "@/contexts/genealogy/ui/api";
import { FamilyChartTree } from "@/contexts/genealogy/ui/tree/FamilyChartTree";
import { AddPersonForm } from "@/contexts/genealogy/ui/AddPersonForm";

/** Pick the most "central" person to root the fan on: ideally someone with
 * ancestors AND a spouse AND children (the richest, most image-like view), then
 * progressively weaker fallbacks. */
function pickDefaultFocal(tree: TreeDTO): string | undefined {
  const childCount = new Map<string, number>();
  const hasParents = new Set<string>();
  const spouses = new Set<string>();
  for (const e of tree.edges) {
    if (e.type === "ParentOf") {
      childCount.set(e.fromPersonId, (childCount.get(e.fromPersonId) ?? 0) + 1);
      hasParents.add(e.toPersonId);
    } else if (e.type === "SpouseOf") {
      spouses.add(e.fromPersonId);
      spouses.add(e.toPersonId);
    }
  }
  const kids = (id: string) => (childCount.get(id) ?? 0) > 0;
  return (
    tree.nodes.find(
      (n) => hasParents.has(n.id) && spouses.has(n.id) && kids(n.id),
    )?.id ??
    tree.nodes.find((n) => spouses.has(n.id) && kids(n.id))?.id ??
    tree.nodes.find((n) => kids(n.id))?.id ??
    tree.nodes[0]?.id
  );
}

export default function TreePage() {
  const router = useRouter();
  const { data: tree, isLoading } = useGetTreeQuery();
  const [focalId, setFocalId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  const defaultFocal = React.useMemo(
    () => (tree ? pickDefaultFocal(tree) : undefined),
    [tree],
  );
  const focal = focalId ?? defaultFocal ?? null;

  const focalPerson = tree?.nodes.find((n) => n.id === focal) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Family Tree</h1>
          <p className="text-muted-foreground">
            {focalPerson
              ? `Centered on ${focalPerson.displayName}. Ancestors fan upward; children grow below.`
              : "Your family, woven together."}
          </p>
        </div>
        <div className="flex items-end gap-3">
          {focal && defaultFocal && focal !== defaultFocal ? (
            <Button variant="outline" onClick={() => setFocalId(null)}>
              Recenter
            </Button>
          ) : null}
          {focalPerson ? (
            <Button
              variant="outline"
              onClick={() => router.push(`/tree/${focalPerson.id}`)}
            >
              View profile
            </Button>
          ) : null}
          <Button onClick={() => setAdding((v) => !v)}>
            {adding ? "Close" : "Add a person"}
          </Button>
        </div>
      </div>

      {adding ? (
        <Card>
          <CardContent>
            <AddPersonForm
              onCreated={(person) => {
                setAdding(false);
                router.push(`/tree/${person.id}`);
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {isLoading || !tree ? (
        <Card>
          <CardContent>
            <p className="p-6 text-muted-foreground">Loading the tree…</p>
          </CardContent>
        </Card>
      ) : tree.nodes.length === 0 || !focal ? (
        <Card>
          <CardContent>
            <p className="p-6 text-muted-foreground">
              No one here yet. Use “Add a person” to begin your tree.
            </p>
          </CardContent>
        </Card>
      ) : (
        <FamilyChartTree
          tree={tree}
          focalId={focal}
          onReroot={(id) => setFocalId(id)}
          onOpenProfile={(id) => router.push(`/tree/${id}`)}
        />
      )}
    </div>
  );
}
