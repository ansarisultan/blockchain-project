import { verifyBytes } from "./keyManager.js";
import {
  resolveDID,
  validateDID,
  getControllerFromVerificationMethod,
} from "./did.js";
import {
  prepareSigningPayload,
  decodeProofValue,
} from "./signing.js";

/**
 * Verify the Ed25519 signature on a signed credential.
 *
 * @param {object} signedCredential
 * @returns {{
 *   ok: boolean,
 *   reason?: string,
 *   issuerDid?: string,
 *   verificationMethod?: string,
 * }}
 */
export function verifyCredentialSignature(signedCredential) {
  // 1. Structural checks relevant to signature verification
  if (!signedCredential || typeof signedCredential !== "object") {
    return { ok: false, reason: "Credential is not an object" };
  }
  const proof = signedCredential.proof;
  if (!proof || typeof proof !== "object") {
    return { ok: false, reason: "Missing proof" };
  }
  if (typeof proof.verificationMethod !== "string") {
    return { ok: false, reason: "Missing verificationMethod in proof" };
  }
  if (typeof proof.proofValue !== "string") {
    return { ok: false, reason: "Missing proofValue in proof" };
  }

  // 2. Controller of the verification method MUST match issuer.id
  const issuerDid = signedCredential?.issuer?.id;
  if (typeof issuerDid !== "string") {
    return { ok: false, reason: "Missing issuer.id" };
  }
  const controller = getControllerFromVerificationMethod(proof.verificationMethod);
  if (controller !== issuerDid) {
    return {
      ok: false,
      reason: "verificationMethod does not belong to issuer DID",
    };
  }

  // 3. Resolve issuer DID
  const didVal = validateDID(issuerDid);
  if (!didVal.valid) {
    return { ok: false, reason: `Invalid issuer DID: ${didVal.reason}` };
  }
  let publicKey;
  try {
    ({ publicKey } = resolveDID(issuerDid));
  } catch (err) {
    return { ok: false, reason: `DID resolution failed: ${err.message}` };
  }

  // 4. Prepare payload — MUST strip proof before canonicalize/hash
  const { proof: _ignored, ...unsigned } = signedCredential;
  let payloadDigest;
  try {
    payloadDigest = prepareSigningPayload(unsigned);
  } catch (err) {
    return { ok: false, reason: `Payload preparation failed: ${err.message}` };
  }

  // 5. Decode signature
  let signatureBytes;
  try {
    signatureBytes = decodeProofValue(proof.proofValue);
  } catch (err) {
    return { ok: false, reason: `Invalid proofValue: ${err.message}` };
  }

  // 6. Verify with Ed25519
  const valid = verifyBytes(publicKey, payloadDigest, signatureBytes);
  if (!valid) {
    return {
      ok: false,
      reason: "Signature invalid — credential has been tampered with",
      issuerDid,
      verificationMethod: proof.verificationMethod,
    };
  }

  return {
    ok: true,
    issuerDid,
    verificationMethod: proof.verificationMethod,
  };
}
