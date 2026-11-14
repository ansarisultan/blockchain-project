import { useEffect, useRef } from "react";
import { useAppDispatch } from "../context/AppContext.jsx";
import { ACTIONS } from "../context/actions.js";

const STEP_MS = 300;

/**
 * Drives the sequential animation of the six checks.
 *
 * Behavior:
 *  - When `status` transitions to "RUNNING", it advances `activeCheckIndex`
 *    from 0 to 5 every STEP_MS ms.
 *  - After the last step, dispatches RUN_VERIFICATION (which computes the
 *    final synchronous result and sets status to VERIFIED / REJECTED).
 *
 * @param {"IDLE"|"RUNNING"|"VERIFIED"|"REJECTED"} status
 */
export function useAnimatedVerification(status) {
  const dispatch = useAppDispatch();
  const timersRef = useRef([]);

  useEffect(() => {
    if (status !== "RUNNING") {
      return;
    }

    // Reset any pending timers (safety).
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    for (let i = 0; i < 6; i++) {
      const id = setTimeout(() => {
        dispatch({ type: ACTIONS.SET_ACTIVE_CHECK, payload: i });
      }, i * STEP_MS);
      timersRef.current.push(id);
    }

    const finishId = setTimeout(() => {
      dispatch({ type: ACTIONS.RUN_VERIFICATION });
    }, 6 * STEP_MS);
    timersRef.current.push(finishId);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [status, dispatch]);
}

export const VERIFICATION_STEP_MS = STEP_MS;
