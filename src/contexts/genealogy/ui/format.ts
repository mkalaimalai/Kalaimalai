import { ApproximateDate, type ApproximateDateJSON } from "@/shared/kernel";
import type { PersonDTO } from "../application/dtos";

/** Format an ApproximateDateJSON for display, or a fallback when null. */
export function formatApproxDate(
  date: ApproximateDateJSON | null,
  fallback = "—",
  locale = "en-US",
): string {
  if (!date) return fallback;
  return ApproximateDate.fromJSON(date).format(locale);
}

/** A compact "1950–2010" / "b. 1990" lifespan label for a person card. */
export function lifespan(person: PersonDTO, locale = "en-US"): string {
  const birth = person.birth ? formatApproxDate(person.birth, "", locale) : "";
  const passing = person.passing
    ? formatApproxDate(person.passing, "", locale)
    : "";
  if (birth && passing) return `${birth} – ${passing}`;
  if (passing) return `d. ${passing}`;
  if (birth) return `b. ${birth}`;
  return "";
}
