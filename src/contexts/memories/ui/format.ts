import { ApproximateDate, type ApproximateDateJSON } from "@/shared/kernel";

/** Locale-aware label for an `ApproximateDateJSON`, or an empty string. */
export function formatApproximateDate(
  json: ApproximateDateJSON | null,
  locale = "en-US",
): string {
  if (!json) return "";
  return ApproximateDate.fromJSON(json).format(locale);
}
