/**
 * Helpers for safely building PostgREST `.or(...)` filter strings.
 *
 * PostgREST treats commas and parentheses as syntax inside an `.or()`
 * expression, so an unsanitized user search like `Smith, John` blows
 * up the query parser. SQL LIKE also treats `%` and `_` as wildcards,
 * which we don't want users typing accidentally.
 *
 * Use `sanitizeSearchInput` on the raw query string before interpolating
 * into an `ilike` filter, and `buildIlikeOrFilter` for the common
 * "match across N columns" pattern.
 */

/**
 * Strip / escape characters that would break a PostgREST `.or()` filter
 * or LIKE pattern. Returns an empty string when the resulting query
 * has no meaningful content left.
 */
export function sanitizeSearchInput(raw: string): string {
  return (
    raw
      // PostgREST reserved chars inside .or() and filter values
      .replace(/[,()*:]/g, " ")
      // SQL LIKE wildcards — neutralize so users see literal matches
      .replace(/[%_\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Build a PostgREST `.or()` filter string that ilike-matches the
 * sanitized query against every column in `columns`. Returns `null`
 * when the sanitized query is empty so callers can skip applying
 * the filter altogether.
 */
export function buildIlikeOrFilter(
  raw: string,
  columns: string[],
): string | null {
  const q = sanitizeSearchInput(raw);
  if (!q) return null;
  return columns.map((c) => `${c}.ilike.%${q}%`).join(",");
}
