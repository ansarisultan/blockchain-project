/**
 * Check 1 of the verification pipeline — structure.
 *
 * Returns { ok: true } or { ok: false, reason: string }.
 * Pure — no side effects, no ledger lookups, no crypto.
 */
export function validateCredentialStructure(credential) {
  if (credential === null || typeof credential !== "object" || Array.isArray(credential)) {
    return { ok: false, reason: "Credential is not a JSON object" };
  }

  if (!Array.isArray(credential["@context"]) || credential["@context"].length === 0) {
    return { ok: false, reason: "Missing or empty @context array" };
  }

  if (!Array.isArray(credential.type) || credential.type.length === 0) {
    return { ok: false, reason: "Missing or empty type array" };
  }

  if (typeof credential.issuer !== "object" || credential.issuer === null) {
    return { ok: false, reason: "Missing issuer object" };
  }
  if (typeof credential.issuer.id !== "string" || !credential.issuer.id) {
    return { ok: false, reason: "Missing issuer.id" };
  }

  if (
    typeof credential.credentialSubject !== "object" ||
    credential.credentialSubject === null
  ) {
    return { ok: false, reason: "Missing credentialSubject object" };
  }
  if (
    typeof credential.credentialSubject.id !== "string" ||
    !credential.credentialSubject.id
  ) {
    return { ok: false, reason: "Missing credentialSubject.id" };
  }

  if (typeof credential.proof !== "object" || credential.proof === null) {
    return { ok: false, reason: "Missing proof object" };
  }
  if (typeof credential.proof.type !== "string") {
    return { ok: false, reason: "Missing proof.type" };
  }
  if (typeof credential.proof.proofValue !== "string") {
    return { ok: false, reason: "Missing proof.proofValue" };
  }
  if (typeof credential.proof.verificationMethod !== "string") {
    return { ok: false, reason: "Missing proof.verificationMethod" };
  }

  if (typeof credential.validFrom !== "string" || !credential.validFrom) {
    return { ok: false, reason: "Missing validFrom" };
  }
  if (typeof credential.validUntil !== "string" || !credential.validUntil) {
    return { ok: false, reason: "Missing validUntil" };
  }
  if (Number.isNaN(new Date(credential.validFrom).getTime())) {
    return { ok: false, reason: "validFrom is not a valid date" };
  }
  if (Number.isNaN(new Date(credential.validUntil).getTime())) {
    return { ok: false, reason: "validUntil is not a valid date" };
  }

  if (typeof credential.id !== "string" || !credential.id) {
    return { ok: false, reason: "Missing credential id" };
  }

  return { ok: true };
}

/**
 * Deep clone via structuredClone when available, JSON fallback otherwise.
 */
export function cloneCredential(credential) {
  if (typeof structuredClone === "function") {
    return structuredClone(credential);
  }
  return JSON.parse(JSON.stringify(credential));
}

/**
 * Extract a safe preview of a credential for UI display.
 */
export function getCredentialPreview(credential) {
  if (!credential) return null;
  return {
    id: credential.id,
    issuerName: credential.issuer?.name ?? "Unknown Issuer",
    issuerDid: credential.issuer?.id ?? "",
    subjectName: credential.credentialSubject?.name ?? "—",
    degree: credential.credentialSubject?.degree ?? "—",
    branch: credential.credentialSubject?.branch ?? "—",
    cgpa: credential.credentialSubject?.cgpa ?? "—",
    graduationYear: credential.credentialSubject?.graduationYear ?? "—",
    validFrom: credential.validFrom,
    validUntil: credential.validUntil,
    proofType: credential.proof?.type ?? "—",
    proofCryptosuite: credential.proof?.cryptosuite ?? "—",
  };
}
