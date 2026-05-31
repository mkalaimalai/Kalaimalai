# Identity & Access (stub)

Members, invite-only onboarding, and roles (Admin / Member / ElderViewer) for
Family Fabric. Phase-0 stub: auth is simulated locally behind `AuthPort`
(pick-a-member / magic-link), so route guards and role checks are real code now
and swap to passwordless auth later by replacing one adapter.
See `TECHNICAL_DESIGN.md` §9.1 and §10.6.

## Module: `IdentityModule` (`createIdentityModule(deps: SharedDeps)`)

Resolve at runtime via `getContainer().identity`. All methods return
`Promise<Result<T>>` unless noted as a pure read.

| Method | Signature | Notes |
|---|---|---|
| `createInvite` | `({ invitedBy, role, ttlMs }) => Result<InviteDTO>` | Admin/inviter must exist. Token via `IdGenerator`, expiry via `Clock` (`now + ttlMs`). Fails on non-positive ttl or unknown inviter. |
| `redeemInvite` | `({ token, displayName }) => Result<MemberDTO>` | Creates a **Pending** member with the invite's role; marks the invite redeemed. Fails if token unknown / expired / already redeemed. |
| `approveMember` | `({ actorRole, memberId }) => Result<MemberDTO>` | **Admin-only.** Transitions Pending → Active. Fails `NOT_AUTHORIZED` for non-Admins. |
| `getCurrentMember` | `() => MemberDTO \| null` | Pure read. Resolves the signed-in member from `AuthPort`. |
| `listMembers` | `() => MemberDTO[]` | Pure read. |
| `signInAs` | `(memberId) => Result<MemberDTO>` | Stub auth: sets the current member. Fails for unknown member. |
| `ensureSeedAdmin` | `({ displayName, linkedPersonId? }) => Result<MemberDTO>` | **Idempotent composition-root bootstrap.** If an Active Admin exists, no-ops and returns it; otherwise creates an Active Admin directly via the domain factory, persists, and signs them in. The only seam that mints the FIRST member. Safe to call on every boot. |

### DTOs (plain, serializable)

- `MemberDTO`: `{ id, displayName, email: string|null, role, linkedPersonId: string|null, status }`
- `InviteDTO`: `{ id, token, invitedByMemberId, role, createdAtMs, expiresAtMs, redeemed }`
- `Role = 'Admin' | 'Member' | 'ElderViewer'`, `MemberStatus = 'Active' | 'Pending'`

## RTK Query hooks (`ui/api.ts`, tags: `Member`, `Invite`)

- `useGetCurrentMemberQuery()` → `MemberDTO | null`
- `useListMembersQuery()` → `MemberDTO[]`
- `useCreateInviteMutation()`
- `useRedeemInviteMutation()`
- `useApproveMemberMutation()`
- `useSignInAsMutation()`

## UI components & hooks

- **`<InviteOnboarding token={token} />`** — the `/invite/[token]` route component.
  Client component: collects a display name, calls `redeemInvite`, and shows the
  pending-approval state on success. Wire the App Router segment
  `app/(auth)/invite/[token]/page.tsx` to render this with the route's `token` param.
- **`<RoleGate allow={role | role[]} fallback={…}>children</RoleGate>`** — renders
  children only if the current member holds a permitted role (route-gated nav).
- **`useCurrentRole(): Role | null`** — the signed-in member's role.
- **`<MemberSwitcher />`** — a "signed in as" dropdown (stub auth) to switch the
  current member; useful for demoing Admin vs Member vs ElderViewer.

## Container augmentation

`index.ts` augments `AppContainer` with `identity: IdentityModule`. The integrator
calls `createIdentityModule(deps)` and includes it in `setContainer(...)`.

## Persistence

`LocalStorageMemberRepository` (`ff:identity:members`),
`LocalStorageInviteRepository` (`ff:identity:invites`), and `LocalAuthAdapter`
(`ff:identity:session`) over the shared `Collection` / `KeyValueStore`.

## Tests

`npx vitest run src/contexts/identity` — domain rules (role capabilities,
invite expiry/redeem, member approval), use cases against in-memory fakes
(incl. expiry, double-redeem, admin-gating), infrastructure round-trips, and UI
component behaviour.
