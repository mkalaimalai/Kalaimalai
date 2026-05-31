"use client";

import * as React from "react";
import type { Branch } from "@/shared/kernel";
import { Button, Field, Input, Select, PhotoInput } from "@/shared/ui";
import type { Gender, Visibility } from "../domain/person";
import type { PersonDTO } from "../application/dtos";
import type { AddPersonInput } from "../application/inputs";
import { useAddPersonMutation } from "./api";

export interface AddPersonFormProps {
  /** Called with the created person on success (integrator may navigate). */
  onCreated?: (person: PersonDTO) => void;
}

const GENDERS: Gender[] = ["Female", "Male", "Other", "Unknown"];
const VISIBILITIES: Visibility[] = ["Public", "Restricted", "Unlisted"];
const BRANCHES: Branch[] = ["Maternal", "Paternal"];

/**
 * Add-a-person form (TECHNICAL_DESIGN §10.1). Uses shared accessible primitives
 * and the addPerson mutation. Every input is labelled via `Field` (N5).
 */
export function AddPersonForm({
  onCreated,
}: AddPersonFormProps): React.JSX.Element {
  const [addPerson, { isLoading }] = useAddPersonMutation();
  const [error, setError] = React.useState<string | null>(null);

  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [legalName, setLegalName] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [gender, setGender] = React.useState<Gender>("Unknown");
  const [birthYear, setBirthYear] = React.useState("");
  const [birthplace, setBirthplace] = React.useState("");
  const [visibility, setVisibility] = React.useState<Visibility>("Public");
  const [branch, setBranch] = React.useState<Branch>("Maternal");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const year = birthYear.trim() === "" ? null : Number(birthYear);
    if (year !== null && (!Number.isInteger(year) || year < 0)) {
      setError("Birth year must be a whole number.");
      return;
    }
    const input: AddPersonInput = {
      legalName,
      nickname: nickname.trim() || undefined,
      gender,
      birth: year !== null ? { year, month: null, day: null } : null,
      birthplace: birthplace.trim() || undefined,
      visibility,
      branch,
      photoUrl: photoUrl ?? undefined,
    };
    const result = await addPerson(input);
    if ("error" in result) {
      const err = result.error as { message?: string } | undefined;
      setError(err?.message ?? "Could not add this person.");
      return;
    }
    setPhotoUrl(null);
    setLegalName("");
    setNickname("");
    setBirthYear("");
    setBirthplace("");
    onCreated?.(result.data);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Add a person">
      <Field label="Photo" htmlFor="photo" hint="Optional — shown on the tree.">
        <PhotoInput
          value={photoUrl}
          onChange={setPhotoUrl}
          fallback={(legalName.trim()[0] ?? "?").toUpperCase()}
        />
      </Field>

      <Field label="Legal name" htmlFor="legalName">
        <Input
          id="legalName"
          required
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
        />
      </Field>

      <Field label="Nickname" htmlFor="nickname" hint="Optional — shown on the tree if set.">
        <Input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </Field>

      <Field label="Gender" htmlFor="gender">
        <Select
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
        >
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Birth year" htmlFor="birthYear" hint="Approximate is fine.">
        <Input
          id="birthYear"
          inputMode="numeric"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
        />
      </Field>

      <Field label="Birthplace" htmlFor="birthplace">
        <Input
          id="birthplace"
          value={birthplace}
          onChange={(e) => setBirthplace(e.target.value)}
        />
      </Field>

      <Field label="Lineage" htmlFor="branch">
        <Select
          id="branch"
          value={branch}
          onChange={(e) => setBranch(e.target.value as Branch)}
        >
          {BRANCHES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Visibility" htmlFor="visibility">
        <Select
          id="visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
        >
          {VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>
      </Field>

      {error ? (
        <p role="alert" className="text-sm text-maternal">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Adding…" : "Add person"}
      </Button>
    </form>
  );
}
