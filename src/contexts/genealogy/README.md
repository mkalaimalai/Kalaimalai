# Genealogy context (Core — the family tree)

The heart of Family Fabric: people, typed relationships, dual maternal/paternal
lineage, and a custom interactive SVG family tree. Built as a self-contained
hexagon (`domain` → `application` → `infrastructure` / `ui`) per
`docs/TECHNICAL_DESIGN.md` §4.3, §6, §10.1 and `docs/tmp/AGENT_CONTRACTS.md`.

## Wiring (composition root)

```ts
import { createGenealogyModule } from "@/contexts/genealogy";

const genealogy = createGenealogyModule(deps); // deps: SharedDeps
setContainer({ ...container, genealogy });
```

`index.ts` augments `AppContainer` with `genealogy: GenealogyModule`, so simply
importing the barrel registers the context key — no central file is edited.

## Module public methods (`GenealogyModule`)

| Method | Signature | Notes |
|---|---|---|
| `addPerson` | `(AddPersonInput) => Promise<Result<PersonDTO>>` | Validates & persists. |
| `editPerson` | `(EditPersonInput) => Promise<Result<PersonDTO>>` | Partial update by id. |
| `proposeRelationshipChange` | `(ProposeRelationshipChangeInput) => Promise<Result<ChangeRequestDTO>>` | Structural edits are PROPOSALS (PRD F1.5). |
| `approveRelationshipChange` | `(ApproveRelationshipChangeInput) => Promise<Result<ChangeRequestDTO>>` | **Admin only** (`actorRole: "Admin"`); applies the edge/removal on approval. |
| `getTree` | `(branch?: Branch) => Promise<TreeDTO>` | Nodes + edges, optionally filtered by lineage. |
| `getPersonProfile` | `(personId: string) => Promise<PersonProfileDTO \| null>` | Person + relationships resolved to `{ relation, person }`. |
| `explainRelationship` | `(a: string, b: string) => Promise<string>` | "How am I related?" label (father, first cousin, …). |
| `listChangeRequests` | `() => Promise<ChangeRequestDTO[]>` | For an Admin review UI. |
| `importGedcom` | `(text: string) => Promise<Result<{ peopleAdded; relationshipsAdded }>>` | Parses INDI/FAM (name, sex, birth, parent/child). |
| `exportGedcom` | `() => Promise<string>` | Emits GEDCOM 5.5.1 text. |
| `listPeopleViews` | `() => Promise<PersonView[]>` | **Producer query** for downstream contexts. |
| `listRelationshipViews` | `() => Promise<RelationshipView[]>` | **Producer query** for downstream contexts. |

## Exported RTK Query hooks (`ui/api.ts`)

Queries: `useGetTreeQuery`, `useGetPersonProfileQuery`,
`useExplainRelationshipQuery`, `useListChangeRequestsQuery`.

Mutations: `useAddPersonMutation`, `useEditPersonMutation`,
`useProposeRelationshipChangeMutation`, `useApproveRelationshipChangeMutation`.

Importing `@/contexts/genealogy/ui` (or `ui/api`) injects the endpoints into the
shared `@/store/api`. Tags used: `Tree`, `Person`, `Relationship`,
`ChangeRequest`.

## UI components → routes

| Route | Component(s) | Usage |
|---|---|---|
| `/tree` | `TreeView` (+ `AddPersonForm`) | Mount a container that calls `useGetTreeQuery`, passes `tree` to `<TreeView onSelectPerson={(id) => router.push(\`/tree/${id}\`)} branch={...} />`. Add a branch-filter control bound to the `branch` prop. `AddPersonForm` (client) for adding people. |
| `/tree/[personId]` | `PersonProfile` | Container calls `useGetPersonProfileQuery(personId)`, passes the DTO to `<PersonProfile onSelectPerson={(id) => router.push(\`/tree/${id}\`)} />`. |

`TreeView` is a presentational, dependency-free SVG renderer (zoom controls,
pan via scroll, branch-coloured nodes using the `--maternal`/`--paternal`
tokens, keyboard-accessible `treeitem` nodes — Enter/Space opens a person). The
pure layout lives in `ui/tree/layout.ts` (own Vitest test).

## Notes for the integrator

- All components that use hooks are already marked `"use client"`.
- `TreeView`, `AddPersonForm`, and `PersonProfile` take DTO props / callbacks
  only; wrap them in thin route containers that supply data + routing.
- Use cases return `Result<T, DomainError>`; the `ui/api.ts` endpoints already
  translate these via `runResult` / `runValue`.
- Persistence namespaces: `ff:genealogy:people`,
  `ff:genealogy:relationships`, `ff:genealogy:change-requests`.
```
