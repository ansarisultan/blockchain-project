/** Return ISO 8601 string for now (UTC). */
export function nowISO() {
  return new Date().toISOString();
}

/** Return ISO 8601 string `years` years from now (UTC). */
export function yearsFromNowISO(years) {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString();
}

/**
 * Check if `now` is within [validFrom, validUntil].
 * Both bounds are inclusive. Missing bounds are treated as open.
 * Returns { ok: boolean, reason?: string }.
 */
export function isWithinValidity(validFrom, validUntil, now = new Date()) {
  if (validFrom) {
    const from = new Date(validFrom);
    if (Number.isNaN(from.getTime())) {
      return { ok: false, reason: "validFrom is not a valid date" };
    }
    if (now.getTime() < from.getTime()) {
      return { ok: false, reason: "Credential is not yet valid (validFrom in the future)" };
    }
  }
  if (validUntil) {
    const until = new Date(validUntil);
    if (Number.isNaN(until.getTime())) {
      return { ok: false, reason: "validUntil is not a valid date" };
    }
    if (now.getTime() > until.getTime()) {
      return { ok: false, reason: "Credential has expired (validUntil in the past)" };
    }
  }
  return { ok: true };
}

/** Human-friendly date for UI. */
export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
