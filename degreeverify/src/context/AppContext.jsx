import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { appReducer } from "./appReducer.js";
import { createInitialState } from "./initialState.js";
import { ACTIONS } from "./actions.js";

const StateCtx = createContext(null);
const DispatchCtx = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(
    appReducer,
    undefined,
    createInitialState
  );

  // Auto-dismiss toasts after 3.5s
  useEffect(() => {
    if (!state.ui.toast) return;
    const id = setTimeout(() => dispatch({ type: ACTIONS.CLEAR_TOAST }), 3500);
    return () => clearTimeout(id);
  }, [state.ui.toast]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error("useAppState must be used inside AppProvider");
  return ctx;
}

export function useAppDispatch() {
  const ctx = useContext(DispatchCtx);
  if (!ctx) throw new Error("useAppDispatch must be used inside AppProvider");
  return ctx;
}

/**
 * Convenience hook returning bound action creators.
 * The identity of every creator is stable across renders.
 */
export function useAppActions() {
  const dispatch = useAppDispatch();
  return useMemo(
    () => ({
      generateUniversityDID: () =>
        dispatch({ type: ACTIONS.GENERATE_UNIVERSITY_DID }),
      registerUniversity: () =>
        dispatch({ type: ACTIONS.REGISTER_UNIVERSITY }),
      generateStudentDID: () =>
        dispatch({ type: ACTIONS.GENERATE_STUDENT_DID }),
      generateFakeUniversityDID: () =>
        dispatch({ type: ACTIONS.GENERATE_FAKE_UNIVERSITY_DID }),

      issueCredential: (subject) =>
        dispatch({ type: ACTIONS.ISSUE_CREDENTIAL, payload: { subject } }),
      generateFakeCredential: () =>
        dispatch({ type: ACTIONS.GENERATE_FAKE_CREDENTIAL }),
      revokeCredential: (credentialId) =>
        dispatch({
          type: ACTIONS.REVOKE_CREDENTIAL,
          payload: { credentialId },
        }),

      setVerifierInput: (text) =>
        dispatch({ type: ACTIONS.SET_VERIFIER_INPUT, payload: text }),
      shareCredential: (credential) =>
        dispatch({
          type: ACTIONS.SHARE_CREDENTIAL,
          payload: { credential, source: "wallet" },
        }),
      setVerifierSource: (credential, source) =>
        dispatch({
          type: ACTIONS.SET_VERIFIER_SOURCE,
          payload: { credential, source },
        }),
      runVerification: () => dispatch({ type: ACTIONS.RUN_VERIFICATION }),
      clearVerification: () => dispatch({ type: ACTIONS.CLEAR_VERIFICATION }),
      setActiveCheck: (index) =>
        dispatch({ type: ACTIONS.SET_ACTIVE_CHECK, payload: index }),

      setActiveTab: (tab) =>
        dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: tab }),
      showToast: (tone, message) =>
        dispatch({ type: ACTIONS.SHOW_TOAST, payload: { tone, message } }),
      clearToast: () => dispatch({ type: ACTIONS.CLEAR_TOAST }),

      resetDemo: () => dispatch({ type: ACTIONS.RESET_DEMO }),
    }),
    [dispatch]
  );
}
