import canonicalize from "canonicalize";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { base58 as base58btc } from "@scure/base";
import { signBytes } from "./keyManager.js";
import { getVerificationMethodFragment } from "./did.js";
import { nowISO } from "../utils/dateUtils.js";

const VC_DOMAIN_TAG = "urn:degreeverify:vc-signature:v1:";

export function canonicalizeJSON(value) {
  const out = canonicalize(value);
  if (out === undefined) {
    throw new Error("Value could not be canonicalized (undefined or circular)");
  }
  return out;
}

export function utf8Bytes(str) {
  return new TextEncoder().encode(str);
}

export function sha256OfString(str) {
  return sha256(utf8Bytes(str));
}

export function sha256Hex(str) {
  return bytesToHex(sha256OfString(str));
}

export function prepareSigningPayload(credentialWithoutProof) {
  if (!credentialWithoutProof || typeof credentialWithoutProof !== "object") {
    throw new Error("Credential payload must be an object");
  }
  const canonical = canonicalizeJSON(credentialWithoutProof);
  const tagged = VC_DOMAIN_TAG + canonical;
  return sha256OfString(tagged);
}

export function signCredential(credentialWithoutProof, issuer) {
  if (!issuer || typeof issuer.did !== "string" || !issuer.privateKey) {
    throw new Error(
      "signCredential: issuer.did and issuer.privateKey are required"
    );
  }

  const payloadDigest = prepareSigningPayload(credentialWithoutProof);
  const signatureBytes = signBytes(issuer.privateKey, payloadDigest);

  if (signatureBytes.length !== 64) {
    throw new Error("Unexpected signature length from Ed25519");
  }

  const proofValue = "z" + base58btc.encode(signatureBytes);
  const fragment = getVerificationMethodFragment(issuer.did);

  return {
    type: "DataIntegrityProof",
    cryptosuite: "eddsa-jcs-2022",
    created: nowISO(),
    verificationMethod: `${issuer.did}#${fragment}`,
    proofPurpose: "assertionMethod",
    proofValue,
  };
}

export function attachProof(credentialWithoutProof, proof) {
  return { ...credentialWithoutProof, proof };
}

export function decodeProofValue(proofValue) {
  if (typeof proofValue !== "string" || !proofValue.startsWith("z")) {
    throw new Error("proofValue must be a multibase string starting with 'z'");
  }
  const bytes = base58btc.decode(proofValue.slice(1));
  if (bytes.length !== 64) {
    throw new Error("Decoded proofValue must be 64 bytes");
  }
  return bytes;
}
