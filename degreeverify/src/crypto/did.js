import { base58 as base58btc } from "@scure/base";
import { ed25519 } from "@noble/curves/ed25519";

// Multicodec: ed25519-pub = 0xed 0x01
const MULTICODEC_ED25519 = new Uint8Array([0xed, 0x01]);
const MULTICODEC_LEN = MULTICODEC_ED25519.length;
const DID_PREFIX = "did:key:";
const MULTIBASE_BASE58BTC_PREFIX = "z";
// Ed25519 DIDs must start with this (0xed01 base58btc encodes to "6Mk...")
const EXPECTED_DID_PREFIX = "did:key:z6Mk";
const PUBLIC_KEY_LEN = 32;

/**
 * Encode a raw 32-byte Ed25519 public key as a multibase base58btc string
 * with the Ed25519 multicodec prefix. Result starts with "z6Mk".
 */
export function encodePublicKeyMultibase(publicKey) {
  if (!(publicKey instanceof Uint8Array) || publicKey.length !== PUBLIC_KEY_LEN) {
    throw new Error("Ed25519 public key must be 32 bytes");
  }
  const prefixed = new Uint8Array(MULTICODEC_LEN + PUBLIC_KEY_LEN);
  prefixed.set(MULTICODEC_ED25519, 0);
  prefixed.set(publicKey, MULTICODEC_LEN);
  return MULTIBASE_BASE58BTC_PREFIX + base58btc.encode(prefixed);
}

/**
 * Decode a multibase base58btc string back into a raw Ed25519 public key.
 * Throws on any malformed input.
 */
export function decodePublicKeyMultibase(multibase) {
  if (typeof multibase !== "string" || !multibase.startsWith("z")) {
    throw new Error("Invalid multibase (must start with 'z')");
  }
  const bytes = base58btc.decode(multibase.slice(1));
  if (bytes.length !== MULTICODEC_LEN + PUBLIC_KEY_LEN) {
    throw new Error("Decoded multibase has incorrect length");
  }
  if (bytes[0] !== MULTICODEC_ED25519[0] || bytes[1] !== MULTICODEC_ED25519[1]) {
    throw new Error("Unsupported multicodec (expected ed25519-pub 0xed01)");
  }
  return bytes.slice(MULTICODEC_LEN);
}

/**
 * Generate a did:key identifier from a raw Ed25519 public key.
 * Result always starts with "did:key:z6Mk".
 */
export function generateDID(publicKey) {
  return DID_PREFIX + encodePublicKeyMultibase(publicKey);
}

/**
 * Validate did:key format and decode the public key.
 * Returns { valid: boolean, reason?: string, publicKey?: Uint8Array }.
 */
export function validateDID(did) {
  if (typeof did !== "string" || !did.startsWith(DID_PREFIX)) {
    return { valid: false, reason: "Missing did:key: prefix" };
  }
  const multibase = did.slice(DID_PREFIX.length);
  if (!multibase.startsWith(MULTIBASE_BASE58BTC_PREFIX)) {
    return { valid: false, reason: "Missing multibase 'z' prefix" };
  }
  try {
    const publicKey = decodePublicKeyMultibase(multibase);
    return { valid: true, publicKey };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

/**
 * Resolve a did:key DID to its raw public key.
 * Throws on invalid DID.
 */
export function resolveDID(did) {
  const { valid, reason, publicKey } = validateDID(did);
  if (!valid) throw new Error(`Cannot resolve DID: ${reason}`);
  return { did, publicKey };
}

/**
 * Extract the raw public key from a did:key identifier.
 */
export function extractPublicKey(did) {
  return resolveDID(did).publicKey;
}

/**
 * Return the multibase portion of a DID (everything after "did:key:").
 * This is the verification method fragment ID.
 */
export function getVerificationMethodFragment(did) {
  const { valid, reason } = validateDID(did);
  if (!valid) throw new Error(`Invalid DID: ${reason}`);
  return did.slice(DID_PREFIX.length);
}

/**
 * Build a W3C DID Document for a did:key identifier.
 */
export function getDIDDocument(did) {
  const { valid, reason } = validateDID(did);
  if (!valid) throw new Error(`Cannot build DID Document: ${reason}`);

  const multibase = did.slice(DID_PREFIX.length);
  const vmId = `${did}#${multibase}`;

  return {
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: did,
    verificationMethod: [
      {
        id: vmId,
        type: "Ed25519VerificationKey2020",
        controller: did,
        publicKeyMultibase: multibase,
      },
    ],
    authentication: [vmId],
    assertionMethod: [vmId],
  };
}

/**
 * Given a proof's `verificationMethod`, return the DID that controls it.
 * Supports did:key (fragment after '#').
 */
export function getControllerFromVerificationMethod(verificationMethod) {
  if (typeof verificationMethod !== "string") return null;
  const hash = verificationMethod.indexOf("#");
  return hash === -1 ? verificationMethod : verificationMethod.slice(0, hash);
}

export const DID_METHOD_CONSTANTS = {
  EXPECTED_DID_PREFIX,
  PUBLIC_KEY_LEN,
};
