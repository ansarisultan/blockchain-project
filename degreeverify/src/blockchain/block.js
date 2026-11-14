import { sha256Hex, canonicalizeJSON } from "../crypto/signing.js";
import { nowISO } from "../utils/dateUtils.js";

export const GENESIS_PREV_HASH = "0000000000000000";

export const BLOCK_TYPES = Object.freeze({
  GENESIS: "GENESIS",
  DID_ANCHOR: "DID_ANCHOR",
  REVOKE: "REVOKE",
});

/**
 * Compute the canonical SHA-256 hash of a block, excluding its `hash` field.
 *
 * Process (fixed by project spec):
 *   1. Copy the block without `hash`.
 *   2. RFC 8785 canonicalize.
 *   3. UTF-8 encode.
 *   4. SHA-256 → hex.
 */
export function calculateBlockHash(blockWithoutHash) {
  if (!blockWithoutHash || typeof blockWithoutHash !== "object") {
    throw new Error("calculateBlockHash: block must be an object");
  }
  const { hash: _ignored, ...rest } = blockWithoutHash;
  const canonical = canonicalizeJSON(rest);
  return sha256Hex(canonical);
}

/**
 * Build a new block object. Returns a frozen block with its `hash` populated.
 * Does NOT append to any chain — that is the ledger's responsibility.
 *
 * @param {object} args
 * @param {number} args.index       — 0-based position in the chain
 * @param {string} args.type        — BLOCK_TYPES value
 * @param {object} args.data        — payload for this event
 * @param {string} args.prevHash    — hash of previous block (GENESIS_PREV_HASH for index 0)
 * @returns {Readonly<object>}
 */
export function createBlock({ index, type, data, prevHash }) {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error("createBlock: index must be a non-negative integer");
  }
  if (!Object.values(BLOCK_TYPES).includes(type)) {
    throw new Error(`createBlock: unknown block type "${type}"`);
  }
  if (typeof prevHash !== "string" || prevHash.length === 0) {
    throw new Error("createBlock: prevHash must be a non-empty string");
  }
  if (data === undefined) {
    throw new Error("createBlock: data is required (use {} for empty payloads)");
  }

  const base = {
    index,
    timestamp: nowISO(),
    type,
    data,
    prevHash,
  };
  const hash = calculateBlockHash(base);

  return Object.freeze({ ...base, hash });
}

/** Convenience factory for the genesis block. */
export function createGenesisBlock() {
  return createBlock({
    index: 0,
    type: BLOCK_TYPES.GENESIS,
    data: { message: "DegreeVerify simulated ledger initialized" },
    prevHash: GENESIS_PREV_HASH,
  });
}
