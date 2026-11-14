import { verifyCredentialSignature } from "../crypto/verification.js";
import { validateDID, resolveDID } from "../crypto/did.js";
import { isWithinValidity } from "../utils/dateUtils.js";
import {
  isTrustedIssuer,
  isCredentialRevoked,
  getRevocationRecord,
  getTrustedIssuerRecord,
} from "../blockchain/ledger.js";
import { validateCredentialStructure } from "./credentialUtils.js";

export const CHECK_NAMES = Object.freeze({
  STRUCTURE: "Credential Structure",
  ISSUER_DID: "Issuer DID Resolution",
  TRUSTED_ISSUER: "Trusted Issuer",
  SIGNATURE: "Signature Verification",
  NOT_EXPIRED: "Validity Window",
  NOT_REVOKED: "Revocation Status",
});

export const CHECK_STATUS = Object.freeze({
  PASS: "PASS",
  FAIL: "FAIL",
  SKIPPED: "SKIPPED",
  PENDING: "PENDING",
});

/**
 * Run the full six-check verification pipeline.
 *
 * @param {object|null} credential  — parsed credential (or null/undefined)
 * @param {{ blocks: object[] }} ledger — current ledger state
 * @param {object} [options]
 * @param {boolean} [options.stopOnFailure=true] — if true, remaining checks marked SKIPPED
 * @returns {{
 *   overall: "VERIFIED" | "REJECTED",
 *   checks: Array<{ id, name, status, message }>,
 *   failedAt: string | null
 * }}
 */
export function verifyCredential(credential, ledger, { stopOnFailure = true } = {}) {
  const checks = [
    { id: "structure", name: CHECK_NAMES.STRUCTURE, status: CHECK_STATUS.PENDING, message: "" },
    { id: "issuerDid", name: CHECK_NAMES.ISSUER_DID, status: CHECK_STATUS.PENDING, message: "" },
    { id: "trustedIssuer", name: CHECK_NAMES.TRUSTED_ISSUER, status: CHECK_STATUS.PENDING, message: "" },
    { id: "signature", name: CHECK_NAMES.SIGNATURE, status: CHECK_STATUS.PENDING, message: "" },
    { id: "notExpired", name: CHECK_NAMES.NOT_EXPIRED, status: CHECK_STATUS.PENDING, message: "" },
    { id: "notRevoked", name: CHECK_NAMES.NOT_REVOKED, status: CHECK_STATUS.PENDING, message: "" },
  ];

  let failedAt = null;
  let skipped = false;

  const runCheck = (index, fn) => {
    if (skipped) {
      checks[index].status = CHECK_STATUS.SKIPPED;
      checks[index].message = "Skipped — previous check failed";
      return;
    }
    try {
      const result = fn();
      checks[index].status = result.ok ? CHECK_STATUS.PASS : CHECK_STATUS.FAIL;
      checks[index].message = result.message;
      if (!result.ok) {
        failedAt = checks[index].id;
        if (stopOnFailure) skipped = true;
      }
    } catch (err) {
      checks[index].status = CHECK_STATUS.FAIL;
      checks[index].message = `Unexpected error: ${err.message}`;
      failedAt = checks[index].id;
      if (stopOnFailure) skipped = true;
    }
  };

  // -------- CHECK 1: Structure --------
  runCheck(0, () => {
    const s = validateCredentialStructure(credential);
    return s.ok
      ? { ok: true, message: "Credential structure is valid" }
      : { ok: false, message: s.reason };
  });

  // -------- CHECK 2: Issuer DID resolves --------
  runCheck(1, () => {
    const issuerDid = credential?.issuer?.id;
    if (typeof issuerDid !== "string") {
      return { ok: false, message: "Issuer DID missing" };
    }
    const v = validateDID(issuerDid);
    if (!v.valid) {
      return { ok: false, message: `Invalid issuer DID: ${v.reason}` };
    }
    let resolved;
    try {
      resolved = resolveDID(issuerDid);
    } catch (err) {
      return { ok: false, message: `DID resolution failed: ${err.message}` };
    }
    if (!resolved.publicKey || resolved.publicKey.length !== 32) {
      return { ok: false, message: "Resolved public key has wrong length" };
    }
    // Ensure proof.verificationMethod belongs to issuer DID
    const vm = credential?.proof?.verificationMethod;
    if (typeof vm !== "string" || !vm.startsWith(issuerDid + "#")) {
      return {
        ok: false,
        message: "verificationMethod does not belong to issuer DID",
      };
    }
    return { ok: true, message: "Issuer DID resolved successfully" };
  });

  // -------- CHECK 3: Trusted issuer --------
  runCheck(2, () => {
    const issuerDid = credential?.issuer?.id;
    if (!ledger || !Array.isArray(ledger.blocks)) {
      return { ok: false, message: "Ledger unavailable" };
    }
    const trusted = isTrustedIssuer(ledger, issuerDid);
    if (!trusted) {
      return {
        ok: false,
        message: "Issuer not found on trusted registry",
      };
    }
    const record = getTrustedIssuerRecord(ledger, issuerDid);
    return {
      ok: true,
      message: `Issuer anchored on ledger as "${record?.name ?? "Trusted Issuer"}"`,
    };
  });

  // -------- CHECK 4: Signature --------
  runCheck(3, () => {
    if (!credential || typeof credential !== "object") {
      return { ok: false, message: "Credential unavailable" };
    }
    const result = verifyCredentialSignature(credential);
    return result.ok
      ? { ok: true, message: "Digital signature is valid" }
      : { ok: false, message: result.reason ?? "Signature verification failed" };
  });

  // -------- CHECK 5: Not expired --------
  runCheck(4, () => {
    const { validFrom, validUntil } = credential ?? {};
    const r = isWithinValidity(validFrom, validUntil);
    return r.ok
      ? { ok: true, message: "Credential is within its validity window" }
      : { ok: false, message: r.reason };
  });

  // -------- CHECK 6: Not revoked --------
  runCheck(5, () => {
    const credId = credential?.id;
    const issuerDid = credential?.issuer?.id;
    if (!credId) {
      return { ok: false, message: "Credential id missing" };
    }
    if (!ledger || !Array.isArray(ledger.blocks)) {
      return { ok: false, message: "Ledger unavailable" };
    }
    if (!isCredentialRevoked(ledger, credId)) {
      return { ok: true, message: "Credential has not been revoked" };
    }
    const record = getRevocationRecord(ledger, credId);
    if (record?.revokedBy !== issuerDid) {
      return {
        ok: false,
        message: "Revocation record does not match issuer",
      };
    }
    return {
      ok: false,
      message: "Credential revoked by issuer",
    };
  });

  const allPass = checks.every((c) => c.status === CHECK_STATUS.PASS);
  return {
    overall: allPass ? "VERIFIED" : "REJECTED",
    checks,
    failedAt,
  };
}

/**
 * Convenience: parse a raw JSON string and run verification.
 * Returns { parseError } if JSON is invalid.
 */
export function verifyCredentialFromJSON(jsonString, ledger, options) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return {
      overall: "REJECTED",
      parseError: err.message,
      checks: [
        {
          id: "structure",
          name: CHECK_NAMES.STRUCTURE,
          status: CHECK_STATUS.FAIL,
          message: `Invalid JSON: ${err.message}`,
        },
        ...[
          CHECK_NAMES.ISSUER_DID,
          CHECK_NAMES.TRUSTED_ISSUER,
          CHECK_NAMES.SIGNATURE,
          CHECK_NAMES.NOT_EXPIRED,
          CHECK_NAMES.NOT_REVOKED,
        ].map((name) => ({
          id: name.toLowerCase().replace(/\s+/g, "-"),
          name,
          status: CHECK_STATUS.SKIPPED,
          message: "Skipped — previous check failed",
        })),
      ],
      failedAt: "structure",
    };
  }
  return verifyCredential(parsed, ledger, options);
}
