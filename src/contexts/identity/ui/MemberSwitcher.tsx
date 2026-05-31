"use client";

import * as React from "react";
import { Field, Select } from "@/shared/ui";
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
    <Field label="Signed in as" htmlFor="member-switcher">
      <Select
        id="member-switcher"
        value={current?.id ?? ""}
        onChange={onChange}
        disabled={isLoading || members.length === 0}
      >
        <option value="" disabled>
          {members.length === 0 ? "No members yet" : "Choose a member…"}
        </option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName} ({m.role})
          </option>
        ))}
      </Select>
    </Field>
  );
}
