import {
  createBlock,
  createGenesisBlock,
  BLOCK_TYPES,
} from "./block.js";

/**
 * Create a fresh ledger state containing only the genesis block.
 * Returns { blocks: Block[] }.
 */
export function createGenesisLedger() {
  return { blocks: [createGenesisBlock()] };
}

/** Return the last block in the chain, or throw if empty. */
export function getLastBlock(ledger) {
  if (!ledger?.blocks?.length) throw new Error("Ledger is empty");
  return ledger.blocks[ledger.blocks.length - 1];
}

/**
 * Append a block of the given type + data to the ledger.
 * Returns a NEW ledger state (immutable update).
 *
 * Business rules here are structural only. Semantic rules (trust, ownership)
 * are enforced by registerIssuer / revokeCredential below.
 */
export function addBlock(ledger, type, data) {
  if (!ledger?.blocks?.length) {
    throw new Error("addBlock: ledger must contain a genesis block");
  }
  const last = getLastBlock(ledger);
  const next = createBlock({
    index: ledger.blocks.length,
    type,
    data,
    prevHash: last.hash,
  });
  return { blocks: [...ledger.blocks, next] };
}

// ---------------------------------------------------------------------------
// DID_ANCHOR — register a trusted issuer
// ---------------------------------------------------------------------------

/**
 * Register a trusted issuer by anchoring its DID.
 *
 * Rules:
 *  - `did` must be a non-empty string.
 *  - `name` must be a non-empty string.
 *  - role MUST be "TRUSTED_ISSUER".
 *  - The DID must not already be anchored (no duplicates).
 *
 * Returns { ledger, block }.
 */
export function registerIssuer(ledger, { did, name, role = "TRUSTED_ISSUER" }) {
  if (!did || typeof did !== "string") {
    throw new Error("registerIssuer: did is required");
  }
  if (!name || typeof name !== "string") {
    throw new Error("registerIssuer: name is required");
  }
  if (role !== "TRUSTED_ISSUER") {
    throw new Error("registerIssuer: only TRUSTED_ISSUER role is supported");
  }
  if (isTrustedIssuer(ledger, did)) {
    throw new Error("registerIssuer: DID already anchored");
  }

  const next = addBlock(ledger, BLOCK_TYPES.DID_ANCHOR, {
    did,
    name,
    role,
  });
  return { ledger: next, block: getLastBlock(next) };
}

/**
 * Check whether a DID is anchored as a trusted issuer.
 * Returns true iff a DID_ANCHOR block exists with role TRUSTED_ISSUER.
 */
export function isTrustedIssuer(ledger, did) {
  if (!ledger?.blocks?.length || !did) return false;
  return ledger.blocks.some(
    (b) =>
      b.type === BLOCK_TYPES.DID_ANCHOR &&
      b.data?.did === did &&
      b.data?.role === "TRUSTED_ISSUER"
  );
}

/**
 * Look up a trusted issuer's anchored record (for display: name, index, hash).
 * Returns null if not anchored.
 */
export function getTrustedIssuerRecord(ledger, did) {
  if (!ledger?.blocks?.length || !did) return null;
  const block = ledger.blocks.find(
    (b) =>
      b.type === BLOCK_TYPES.DID_ANCHOR &&
      b.data?.did === did &&
      b.data?.role === "TRUSTED_ISSUER"
  );
  if (!block) return null;
  return {
    did: block.data.did,
    name: block.data.name,
    role: block.data.role,
    anchoredAt: block.timestamp,
    blockIndex: block.index,
    blockHash: block.hash,
  };
}

// ---------------------------------------------------------------------------
// REVOKE — revoke a previously-issued credential
// ---------------------------------------------------------------------------

/**
 * Revoke a credential.
 *
 * Rules:
 *  - credentialId, revokedBy, and issuedBy are all required strings.
 *  - Only the original issuer may revoke: revokedBy === issuedBy.
 *  - No duplicate REVOKE blocks for the same credentialId.
 *  - The revoking DID must be a trusted issuer (belt-and-braces; the issuer
 *    would have had to be trusted to issue in the first place).
 *
 * Returns { ledger, block }.
 */
export function revokeCredential(
  ledger,
  { credentialId, revokedBy, issuedBy }
) {
  if (!credentialId || typeof credentialId !== "string") {
    throw new Error("revokeCredential: credentialId is required");
  }
  if (!revokedBy || typeof revokedBy !== "string") {
    throw new Error("revokeCredential: revokedBy is required");
  }
  if (!issuedBy || typeof issuedBy !== "string") {
    throw new Error("revokeCredential: issuedBy is required");
  }
  if (revokedBy !== issuedBy) {
    throw new Error("revokeCredential: only the original issuer may revoke");
  }
  if (isCredentialRevoked(ledger, credentialId)) {
    throw new Error("revokeCredential: credential already revoked");
  }
  if (!isTrustedIssuer(ledger, revokedBy)) {
    throw new Error("revokeCredential: revoking DID is not a trusted issuer");
  }

  const next = addBlock(ledger, BLOCK_TYPES.REVOKE, {
    credentialId,
    revokedBy,
  });
  return { ledger: next, block: getLastBlock(next) };
}

/**
 * Check whether a credential has been revoked.
 * Returns true iff a REVOKE block exists for this credentialId.
 */
export function isCredentialRevoked(ledger, credentialId) {
  if (!ledger?.blocks?.length || !credentialId) return false;
  return ledger.blocks.some(
    (b) => b.type === BLOCK_TYPES.REVOKE && b.data?.credentialId === credentialId
  );
}

/**
 * Fetch the revocation record for a credential (for UI display).
 * Returns null if not revoked.
 */
export function getRevocationRecord(ledger, credentialId) {
  if (!ledger?.blocks?.length || !credentialId) return null;
  const block = ledger.blocks.find(
    (b) => b.type === BLOCK_TYPES.REVOKE && b.data?.credentialId === credentialId
  );
  if (!block) return null;
  return {
    credentialId: block.data.credentialId,
    revokedBy: block.data.revokedBy,
    revokedAt: block.timestamp,
    blockIndex: block.index,
    blockHash: block.hash,
  };
}

// ---------------------------------------------------------------------------
// Introspection helpers
// ---------------------------------------------------------------------------

/** Total block count. */
export function getBlockCount(ledger) {
  return ledger?.blocks?.length ?? 0;
}

/** All blocks matching a type. */
export function getBlocksByType(ledger, type) {
  if (!ledger?.blocks?.length) return [];
  return ledger.blocks.filter((b) => b.type === type);
}

/** All trusted issuers currently anchored (deduped by DID). */
export function listTrustedIssuers(ledger) {
  if (!ledger?.blocks?.length) return [];
  const seen = new Set();
  const out = [];
  for (const b of ledger.blocks) {
    if (
      b.type === BLOCK_TYPES.DID_ANCHOR &&
      b.data?.role === "TRUSTED_ISSUER" &&
      !seen.has(b.data.did)
    ) {
      seen.add(b.data.did);
      out.push({
        did: b.data.did,
        name: b.data.name,
        anchoredAt: b.timestamp,
        blockIndex: b.index,
        blockHash: b.hash,
      });
    }
  }
  return out;
}

/** All revocations currently recorded (deduped by credentialId). */
export function listRevocations(ledger) {
  if (!ledger?.blocks?.length) return [];
  const seen = new Set();
  const out = [];
  for (const b of ledger.blocks) {
    if (b.type === BLOCK_TYPES.REVOKE && !seen.has(b.data.credentialId)) {
      seen.add(b.data.credentialId);
      out.push({
        credentialId: b.data.credentialId,
        revokedBy: b.data.revokedBy,
        revokedAt: b.timestamp,
        blockIndex: b.index,
        blockHash: b.hash,
      });
    }
  }
  return out;
}
