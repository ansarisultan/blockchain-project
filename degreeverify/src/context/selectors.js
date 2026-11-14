import { isCredentialRevoked } from "../blockchain/index.js";

/** Is the given credential revoked in the current ledger? */
export function isRevoked(state, credentialId) {
  return isCredentialRevoked(state.ledger, credentialId);
}

/** Find a credential in the student's wallet by id. */
export function findWalletCredential(state, credentialId) {
  return (
    state.student.credentials.find((c) => c.id === credentialId) ?? null
  );
}

/** Whether the university has everything it needs to issue. */
export function canIssue(state) {
  return Boolean(
    state.university.did &&
      state.university.keys &&
      state.university.registered &&
      state.student.did
  );
}

/** Whether the student wallet currently holds any credential. */
export function hasWalletCredentials(state) {
  return state.student.credentials.length > 0;
}

/** Count of live (non-revoked) credentials in the wallet. */
export function liveCredentialCount(state) {
  return state.student.credentials.filter(
    (c) => !isCredentialRevoked(state.ledger, c.id)
  ).length;
}
