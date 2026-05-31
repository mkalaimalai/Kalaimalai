import type { DomainError, Result } from "@/shared/kernel/result";

/**
 * Adapters between application use cases and RTK Query's `queryFn` contract.
 * A `queryFn` must resolve to `{ data }` or `{ error }`. These helpers let an
 * endpoint stay a one-liner: `queryFn: () => runResult(container.x.doThing())`.
 */
export type QueryReturn<T> = { data: T } | { error: DomainError };

/** For use cases that return a `Result<T, DomainError>`. */
export async function runResult<T>(
  work: Promise<Result<T>> | Result<T>,
): Promise<QueryReturn<T>> {
  const r = await work;
  return r.ok ? { data: r.value } : { error: r.error };
}

/** For read/query use cases that resolve a plain value (never fail). */
export async function runValue<T>(
  work: Promise<T> | T,
): Promise<QueryReturn<T>> {
  try {
    return { data: await work };
  } catch (e) {
    return {
      error: {
        code: "UNEXPECTED",
        message: e instanceof Error ? e.message : String(e),
      },
    };
  }
}
