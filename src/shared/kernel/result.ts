/**
 * Result<T, E> — explicit success/failure without thrown control flow
 * (TECHNICAL_DESIGN §9.5). Use cases return this; RTK Query surfaces it.
 */

export interface DomainError {
  readonly code: string;
  readonly message: string;
}

export const DomainError = (code: string, message: string): DomainError => ({
  code,
  message,
});

export type Result<T, E = DomainError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const fail = (code: string, message: string): Result<never, DomainError> =>
  err(DomainError(code, message));

export function isOk<T, E>(
  r: Result<T, E>,
): r is { ok: true; value: T } {
  return r.ok;
}

export function isErr<T, E>(
  r: Result<T, E>,
): r is { ok: false; error: E } {
  return !r.ok;
}

/** Unwrap or throw — for tests and trusted call sites only. */
export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value;
  throw new Error(`unwrap on error Result: ${JSON.stringify(r.error)}`);
}

export function map<T, U, E>(
  r: Result<T, E>,
  f: (value: T) => U,
): Result<U, E> {
  return r.ok ? ok(f(r.value)) : r;
}
