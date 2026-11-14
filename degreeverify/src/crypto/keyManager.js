import { ed25519 } from "@noble/curves/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

// @noble/curves v1 requires sync sha512 for deterministic ops
ed25519.utils.sha512Sync = (...m) => sha512(ed25519.CURVE.hash(...m));

/**
 * Generate a fresh Ed25519 keypair.
 * Uses crypto.getRandomValues (via noble's randomPrivateKey) — never Math.random.
 *
 * @returns {{ privateKey: Uint8Array, publicKey: Uint8Array }}
 *   privateKey: 32 bytes (seed)
 *   publicKey:  32 bytes
 */
export function generateKeyPair() {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

/**
 * Derive the Ed25519 public key from a private key.
 * Useful for verifying the pair before use.
 */
export function derivePublicKey(privateKey) {
  assertBytes(privateKey, 32, "privateKey");
  return ed25519.getPublicKey(privateKey);
}

/**
 * Sign an arbitrary byte payload (already hashed by the caller).
 * Returns a 64-byte signature.
 */
export function signBytes(privateKey, messageBytes) {
  assertBytes(privateKey, 32, "privateKey");
  assertBytes(messageBytes, null, "messageBytes");
  return ed25519.sign(messageBytes, privateKey);
}

/**
 * Verify a signature over a byte payload.
 * Returns boolean — never throws on invalid input.
 */
export function verifyBytes(publicKey, messageBytes, signature) {
  try {
    assertBytes(publicKey, 32, "publicKey");
    assertBytes(signature, 64, "signature");
    assertBytes(messageBytes, null, "messageBytes");
    return ed25519.verify(signature, messageBytes, publicKey);
  } catch {
    return false;
  }
}

/**
 * Safe hex preview of a private key for debugging.
 * NEVER show the full key in the UI.
 */
export function privateKeyPreview(privateKey) {
  assertBytes(privateKey, 32, "privateKey");
  const hex = bytesToHex(privateKey);
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`;
}

export { bytesToHex, hexToBytes };

// ---- internal guards ----
function assertBytes(value, expectedLength, name) {
  if (!(value instanceof Uint8Array)) {
    throw new TypeError(`${name} must be a Uint8Array`);
  }
  if (expectedLength !== null && value.length !== expectedLength) {
    throw new RangeError(
      `${name} must be ${expectedLength} bytes (got ${value.length})`
    );
  }
}
