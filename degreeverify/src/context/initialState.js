import { createGenesisLedger } from "../blockchain/index.js";

/**
 * Fresh initial application state.
 * Called on first mount and on RESET_DEMO.
 */
export function createInitialState() {
  return {
    university: {
      did: null,
      keys: null,           // { privateKey: Uint8Array, publicKey: Uint8Array }
      registered: false,
      name: "Presidency University",
    },
    student: {
      did: null,
      keys: null,
      name: "",
      credentials: [],      // signed VCs held by the student
    },
    fakeUniversity: {
      did: null,
      keys: null,
      name: "Fake University",
      lastCredential: null, // most recent fake credential (for the attack demo)
    },
    ledger: createGenesisLedger(),   // { blocks: [...] }
    verifier: {
      credentialInput: "",           // raw JSON string in the textarea
      results: null,                 // last verification result object
      status: "IDLE",                // IDLE | RUNNING | VERIFIED | REJECTED
      activeCheckIndex: null,        // during animation, which check is running
      source: null,                  // "wallet" | "fake" | "manual" | null
      parseError: null,
    },
    ui: {
      activeTab: "overview",
      toast: null,                   // { tone, message } | null
    },
  };
}
