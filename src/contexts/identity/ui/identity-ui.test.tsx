import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/store/api";
import {
  getContainer,
  resetContainer,
  setContainer,
  type SharedDeps,
} from "@/bootstrap/container";
import type { AppContainer } from "@/bootstrap/container";
import type { IdentityModule } from "../identity.module";
import {
  InMemoryKeyValueStore,
  type KeyValueStore,
} from "@/shared/infrastructure";
import { FixedClock, SequentialIdGenerator } from "@/shared/ports";
import { MemberId, unwrap } from "@/shared/kernel";
import { Member } from "../domain/member";
import { LocalStorageMemberRepository } from "../infrastructure/member-repository";
import { createIdentityModule } from "../identity.module";
import { InviteOnboarding } from "./InviteOnboarding";
import { MemberSwitcher } from "./MemberSwitcher";
import { RoleGate } from "./RoleGate";

/** Each test gets its own store so RTK Query caches never leak across tests. */
function makeStore() {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (gdm) => gdm().concat(api.middleware),
  });
}

/** Wire a fresh composition root; return the backing KeyValueStore for seeding. */
function wireContainer(): KeyValueStore {
  const store = new InMemoryKeyValueStore();
  const deps: SharedDeps = {
    store,
    clock: new FixedClock(10_000),
    ids: new SequentialIdGenerator("id"),
  };
  const identity: IdentityModule = createIdentityModule(deps);
  // The full app container is wired by the integrator; this test only needs the
  // identity slice, so we build a partial container for isolation.
  setContainer({ identity } as unknown as AppContainer);
  return store;
}

async function seedMember(
  store: KeyValueStore,
  props: { id: string; role: "Admin" | "Member" | "ElderViewer"; status: "Active" | "Pending"; name?: string },
): Promise<void> {
  const repo = new LocalStorageMemberRepository(store);
  await repo.save(
    unwrap(
      Member.create({
        id: MemberId(props.id),
        displayName: props.name ?? props.id,
        role: props.role,
        status: props.status,
      }),
    ),
  );
}

function renderWithStore(ui: React.ReactElement) {
  return render(<Provider store={makeStore()}>{ui}</Provider>);
}

describe("Identity UI", () => {
  let store: KeyValueStore;
  beforeEach(() => {
    store = wireContainer();
  });
  afterEach(() => {
    cleanup();
    resetContainer();
  });

  it("RoleGate shows children for an Admin and hides them otherwise", async () => {
    await seedMember(store, { id: "admin", role: "Admin", status: "Active" });
    await getContainerIdentity().signInAs("admin");

    renderWithStore(
      <RoleGate allow="Admin" fallback={<span>denied</span>}>
        <span>admin-only</span>
      </RoleGate>,
    );

    await waitFor(() =>
      expect(screen.getByText("admin-only")).toBeInTheDocument(),
    );
    expect(screen.queryByText("denied")).not.toBeInTheDocument();
  });

  it("RoleGate renders the fallback when the role is not permitted", async () => {
    await seedMember(store, { id: "member", role: "Member", status: "Active" });
    await getContainerIdentity().signInAs("member");

    renderWithStore(
      <RoleGate allow="Admin" fallback={<span>denied</span>}>
        <span>admin-only</span>
      </RoleGate>,
    );

    await waitFor(() => expect(screen.getByText("denied")).toBeInTheDocument());
    expect(screen.queryByText("admin-only")).not.toBeInTheDocument();
  });

  it("MemberSwitcher lists members and switches the current member", async () => {
    await seedMember(store, {
      id: "admin",
      role: "Admin",
      status: "Active",
      name: "Asha",
    });
    await seedMember(store, {
      id: "member",
      role: "Member",
      status: "Active",
      name: "Ravi",
    });

    renderWithStore(<MemberSwitcher />);

    const select = (await screen.findByLabelText(
      "Signed in as",
    )) as HTMLSelectElement;
    // options for both seeded members appear once the query resolves
    expect(await screen.findByText("Asha (Admin)")).toBeInTheDocument();
    expect(screen.getByText("Ravi (Member)")).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "member" } });

    await waitFor(() =>
      expect(getContainerIdentity().getCurrentMember()).resolves.toMatchObject({
        id: "member",
      }),
    );
  });

  it("InviteOnboarding redeems an invite and shows the pending state", async () => {
    // seed an admin, then create an invite through the public module
    await seedMember(store, { id: "admin", role: "Admin", status: "Active" });
    const invite = unwrap(
      await getContainerIdentity().createInvite({
        invitedBy: "admin",
        role: "Member",
        ttlMs: 60_000,
      }),
    );

    renderWithStore(<InviteOnboarding token={invite.token} />);

    const input = await screen.findByLabelText("Your name");
    fireEvent.change(input, { target: { value: "Meena" } });
    fireEvent.click(screen.getByRole("button", { name: /join the family/i }));

    await waitFor(() =>
      expect(screen.getByText(/pending/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Thanks, Meena/)).toBeInTheDocument();
  });

  it("InviteOnboarding shows an error for an invalid token", async () => {
    renderWithStore(<InviteOnboarding token="bogus" />);

    const input = await screen.findByLabelText("Your name");
    fireEvent.change(input, { target: { value: "Nobody" } });
    fireEvent.click(screen.getByRole("button", { name: /join the family/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument(),
    );
  });
});

/** Typed accessor for the identity module on the wired container. */
function getContainerIdentity() {
  return getContainer().identity;
}
