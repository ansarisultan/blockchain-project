import { calculateBlockHash, GENESIS_PREV_HASH } from "./block.js";

/**
 * Verify the entire hash chain.
 *
 * For each block:
 *  - Recompute its hash from its content (excluding `hash`).
 *  - Compare with the stored hash.
 *  - Confirm `prevHash` equals the previous block's stored hash.
 *  - Confirm index === position in array.
 *  - Confirm block 0 has GENESIS_PREV_HASH and type GENESIS.
 *
 * Returns { valid, problems: string[], blockHashes: string[] }.
 */
export function verifyChainIntegrity(ledger) {
  const problems = [];
  const blocks = ledger?.blocks ?? [];

  if (blocks.length === 0) {
    return { valid: false, problems: ["Ledger is empty"], blockHashes: [] };
  }

  // Genesis sanity
  const genesis = blocks[0];
  if (genesis.index !== 0) {
    problems.push(`Genesis block has index ${genesis.index}, expected 0`);
  }
  if (genesis.type !== "GENESIS") {
    problems.push(`Genesis block has type "${genesis.type}", expected GENESIS`);
  }
  if (genesis.prevHash !== GENESIS_PREV_HASH) {
    problems.push(
      `Genesis prevHash is "${genesis.prevHash}", expected "${GENESIS_PREV_HASH}"`
    );
  }

  const recomputed = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const position = i;

    // 1. Recompute hash
    let expectedHash;
    try {
      expectedHash = calculateBlockHash(block);
    } catch (err) {
      problems.push(`Block ${position}: hash recalculation failed (${err.message})`);
      recomputed.push("(error)");
      continue;
    }
    recomputed.push(expectedHash);

    if (block.hash !== expectedHash) {
      problems.push(
        `Block ${position}: stored hash does not match recomputed hash`
      );
    }

    // 2. prevHash linkage (skip genesis, checked above)
    if (position > 0) {
      const prev = blocks[position - 1];
      if (block.prevHash !== prev.hash) {
        problems.push(
          `Block ${position}: prevHash does not match block ${position - 1}'s hash`
        );
      }
    }

    // 3. Index matches position
    if (block.index !== position) {
      problems.push(
        `Block ${position}: index field is ${block.index}, expected ${position}`
      );
    }
  }

  return {
    valid: problems.length === 0,
    problems,
    blockHashes: recomputed,
  };
}
