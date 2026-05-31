"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Branch } from "@/shared/kernel";
import { Button, Card, CardContent, Field, Select } from "@/shared/ui";
import { useGetTreeQuery } from "@/contexts/genealogy/ui/api";
import { TreeView } from "@/contexts/genealogy/ui/tree/TreeView";
import { AddPersonForm } from "@/contexts/genealogy/ui/AddPersonForm";

type BranchFilter = "All" | Branch;

export default function TreePage() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<BranchFilter>("All");
  const [adding, setAdding] = React.useState(false);
  const branch = filter === "All" ? undefined : filter;
  const { data: tree, isLoading } = useGetTreeQuery(
    branch ? { branch } : undefined,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Family Tree</h1>
          <p className="text-muted-foreground">
            Click a person to view their profile. Filter by lineage to focus a
            branch.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="w-44">
            <Field label="Lineage" htmlFor="branch-filter">
              <Select
                id="branch-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as BranchFilter)}
              >
                <option value="All">Whole family</option>
                <option value="Maternal">Maternal</option>
                <option value="Paternal">Paternal</option>
              </Select>
            </Field>
          </div>
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

      <Card>
        <CardContent className="overflow-auto p-2">
          {isLoading || !tree ? (
            <p className="p-6 text-muted-foreground">Loading the tree…</p>
          ) : tree.nodes.length === 0 ? (
            <p className="p-6 text-muted-foreground">
              No one here yet. Use “Add a person” to begin your tree.
            </p>
          ) : (
            <TreeView
              tree={tree}
              branch={branch}
              onSelectPerson={(id) => router.push(`/tree/${id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
