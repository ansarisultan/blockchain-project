import { ACTIONS } from "./actions.js";
import { createInitialState } from "./initialState.js";
import { generateKeyPair, generateDID } from "../crypto/index.js";
import {
  registerIssuer,
  revokeCredential as ledgerRevoke,
} from "../blockchain/index.js";
import {
  issueCredential,
  verifyCredential,
} from "../credentials/index.js";

/**
 * @param {object} state
 * @param {{ type: string, payload?: any }} action
 * @returns {object} new state (never mutated)
 */
export function appReducer(state, action) {
  switch (action.type) {
    // ---------------------------------------------------------------------
    // IDENTITY
    // ---------------------------------------------------------------------
    case ACTIONS.GENERATE_UNIVERSITY_DID: {
      const keys = generateKeyPair();
      const did = generateDID(keys.publicKey);
      return {
        ...state,
        university: {
          ...state.university,
          did,
          keys,
          // A regenerated DID invalidates prior registration
          registered: false,
        },
      };
    }

    case ACTIONS.GENERATE_STUDENT_DID: {
      const keys = generateKeyPair();
      const did = generateDID(keys.publicKey);
      return {
        ...state,
        student: {
          ...state.student,
          did,
          keys,
          credentials: [],
        },
      };
    }

    case ACTIONS.GENERATE_FAKE_UNIVERSITY_DID: {
      const keys = generateKeyPair();
      const did = generateDID(keys.publicKey);
      return {
        ...state,
        fakeUniversity: {
          ...state.fakeUniversity,
          did,
          keys,
        },
      };
    }

    case ACTIONS.REGISTER_UNIVERSITY: {
      if (!state.university.did) return state;
      if (state.university.registered) return state;
      try {
        const { ledger } = registerIssuer(state.ledger, {
          did: state.university.did,
          name: state.university.name,
          role: "TRUSTED_ISSUER",
        });
        return {
          ...state,
          ledger,
          university: { ...state.university, registered: true },
        };
      } catch (err) {
        return {
          ...state,
          ui: { ...state.ui, toast: { tone: "error", message: err.message } },
        };
      }
    }

    // ---------------------------------------------------------------------
    // CREDENTIAL ISSUANCE
    // ---------------------------------------------------------------------
    case ACTIONS.ISSUE_CREDENTIAL: {
      const { subject } = action.payload || {};
      if (!state.university.did || !state.university.keys) return state;
      if (!state.university.registered) {
        return toastError(state, "Register the university before issuing credentials.");
      }
      if (!state.student.did || !state.student.keys) {
        return toastError(state, "The student must generate a DID first.");
      }
      try {
        const credential = issueCredential({
          issuer: {
            did: state.university.did,
            name: state.university.name,
            privateKey: state.university.keys.privateKey,
          },
          subject: {
            did: state.student.did,
            name: subject?.name ?? "",
            degree: subject?.degree ?? "",
            branch: subject?.branch ?? "",
            cgpa: subject?.cgpa ?? "",
            graduationYear: subject?.graduationYear ?? "",
          },
        });
        return {
          ...state,
          student: {
            ...state.student,
            name: subject?.name ?? state.student.name,
            credentials: [...state.student.credentials, credential],
          },
          ui: {
            ...state.ui,
            toast: { tone: "success", message: "Credential issued and added to the student's wallet." },
          },
        };
      } catch (err) {
        return toastError(state, `Issuance failed: ${err.message}`);
      }
    }

    case ACTIONS.GENERATE_FAKE_CREDENTIAL: {
      // Generates a fresh fake keypair + DID and a signed credential
      if (!state.student.did) {
        return toastError(state, "The student must generate a DID before a credential can be created.");
      }
      try {
        const keys = generateKeyPair();
        const did = generateDID(keys.publicKey);
        const credential = issueCredential({
          issuer: {
            did,
            name: state.fakeUniversity.name,
            privateKey: keys.privateKey,
          },
          subject: {
            did: state.student.did,
            name: state.student.name || "Arjun Rao",
            degree: "B.Tech",
            branch: "CSE",
            cgpa: "9.9",
            graduationYear: "2028",
          },
        });
        return {
          ...state,
          fakeUniversity: {
            ...state.fakeUniversity,
            did,
            keys,
            lastCredential: credential,
          },
        };
      } catch (err) {
        return toastError(state, `Fake credential generation failed: ${err.message}`);
      }
    }

    // ---------------------------------------------------------------------
    // REVOCATION
    // ---------------------------------------------------------------------
    case ACTIONS.REVOKE_CREDENTIAL: {
      const { credentialId } = action.payload || {};
      if (!credentialId) return state;
      if (!state.university.did) return state;
      try {
        const { ledger } = ledgerRevoke(state.ledger, {
          credentialId,
          revokedBy: state.university.did,
          issuedBy: state.university.did,
        });
        return {
          ...state,
          ledger,
          ui: {
            ...state.ui,
            toast: { tone: "warning", message: "Credential revoked. Future verifications will fail check 6." },
          },
        };
      } catch (err) {
        return toastError(state, `Revocation failed: ${err.message}`);
      }
    }

    // ---------------------------------------------------------------------
    // VERIFIER
    // ---------------------------------------------------------------------
    case ACTIONS.SET_VERIFIER_INPUT:
      return {
        ...state,
        verifier: {
          ...state.verifier,
          credentialInput: action.payload ?? "",
          // Editing the input invalidates any displayed result
          results: null,
          status: "IDLE",
          activeCheckIndex: null,
          parseError: null,
        },
      };

    case ACTIONS.SHARE_CREDENTIAL:
    case ACTIONS.SET_VERIFIER_SOURCE: {
      const { source, credential } = action.payload || {};
      if (!credential) return state;
      return {
        ...state,
        verifier: {
          ...state.verifier,
          credentialInput: JSON.stringify(credential, null, 2),
          source: source ?? state.verifier.source,
          results: null,
          status: "IDLE",
          activeCheckIndex: null,
          parseError: null,
        },
        ui: {
          ...state.ui,
          toast:
            action.type === ACTIONS.SHARE_CREDENTIAL
              ? { tone: "success", message: "Credential shared with the verifier." }
              : state.ui.toast,
        },
      };
    }

    case ACTIONS.RUN_VERIFICATION: {
      // Synchronous final result — the animated runner in the UI drives the
      // per-step reveal, then dispatches this action once animation completes.
      let parsed;
      try {
        parsed = JSON.parse(state.verifier.credentialInput);
      } catch (err) {
        return {
          ...state,
          verifier: {
            ...state.verifier,
            results: null,
            status: "REJECTED",
            parseError: `Invalid JSON: ${err.message}`,
            activeCheckIndex: null,
          },
        };
      }
      const result = verifyCredential(parsed, state.ledger);
      return {
        ...state,
        verifier: {
          ...state.verifier,
          results: result,
          status: result.overall,
          parseError: null,
          activeCheckIndex: null,
        },
      };
    }

    case ACTIONS.SET_ACTIVE_CHECK:
      return {
        ...state,
        verifier: {
          ...state.verifier,
          activeCheckIndex: action.payload ?? null,
          status: action.payload === null ? "IDLE" : "RUNNING",
        },
      };

    case ACTIONS.CLEAR_VERIFICATION:
      return {
        ...state,
        verifier: {
          ...state.verifier,
          results: null,
          status: "IDLE",
          activeCheckIndex: null,
          parseError: null,
        },
      };

    // ---------------------------------------------------------------------
    // UI
    // ---------------------------------------------------------------------
    case ACTIONS.SET_ACTIVE_TAB:
      return {
        ...state,
        ui: { ...state.ui, activeTab: action.payload },
      };

    case ACTIONS.SHOW_TOAST:
      return {
        ...state,
        ui: {
          ...state.ui,
          toast: action.payload,
        },
      };

    case ACTIONS.CLEAR_TOAST:
      return { ...state, ui: { ...state.ui, toast: null } };

    // ---------------------------------------------------------------------
    // GLOBAL RESET
    // ---------------------------------------------------------------------
    case ACTIONS.RESET_DEMO:
      return createInitialState();

    default:
      return state;
  }
}

function toastError(state, message) {
  return {
    ...state,
    ui: { ...state.ui, toast: { tone: "error", message } },
  };
}
