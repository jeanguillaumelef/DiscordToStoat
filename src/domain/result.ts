/** Outcome of an operation that can fail in an expected way. */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
