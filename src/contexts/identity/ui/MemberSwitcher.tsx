"use client";

import * as React from "react";
import {
  useGetCurrentMemberQuery,
  useListMembersQuery,
  useSignInAsMutation,
} from "./api";

/**
 * MemberSwitcher — a "signed in as" dropdown for the Phase-0 stub auth
 * (TECHNICAL_DESIGN §9.1). Lets a demo switch the current member to show
 * Admin vs Member vs ElderViewer behaviour. Not shipped with real auth.
 */
export function MemberSwitcher(): React.ReactElement {
  const { data: members = [] } = useListMembersQuery();
  const { data: current } = useGetCurrentMemberQuery();
  const [signInAs, { isLoading }] = useSignInAsMutation();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id !== "") void signInAs(id);
  };

  return (
    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-primary-foreground"
        aria-hidden
      >
        {(current?.displayName ?? "?").charAt(0).toUpperCase()}
      </span>
      <label htmlFor="member-switcher" className="sr-only">
        Signed in as
      </label>
      <select
        id="member-switcher"
        value={current?.id ?? ""}
        onChange={onChange}
        disabled={isLoading || members.length === 0}
        className="min-h-target bg-transparent text-sm font-semibold text-foreground focus-visible:outline-none"
      >
        <option value="" disabled>
          {members.length === 0 ? "No members yet" : "Choose a member…"}
        </option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName} ({m.role})
          </option>
        ))}
      </select>
    </div>
  );
}
