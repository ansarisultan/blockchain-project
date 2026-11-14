import { useEffect, useRef } from "react";
import {
  Building2,
  ClipboardCheck,
  Eraser,
  Sparkles,
  FileWarning,
  Loader2,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import FrostedPanel from "./FrostedPanel.jsx";
import StatusPill from "./StatusPill.jsx";
import VerificationCheckRow from "./ui/VerificationCheckRow.jsx";
import VerificationSummary from "./ui/VerificationSummary.jsx";
import FakeIssuer from "./FakeIssuer.jsx";
import {
  useAppState,
  useAppActions,
} from "../context/AppContext.jsx";
import { useAnimatedVerification } from "../hooks/useAnimatedVerification.js";
import { CHECK_NAMES } from "../credentials/credentialVerifier.js";
import { EmptyState } from "./ui/index.js";
import CopyButton from "./ui/CopyButton.jsx";

// Ordered list of the six checks — used while RUNNING, before real result exists
const CHECK_ORDER = [
  { id: "structure", name: CHECK_NAMES.STRUCTURE },
  { id: "issuerDid", name: CHECK_NAMES.ISSUER_DID },
  { id: "trustedIssuer", name: CHECK_NAMES.TRUSTED_ISSUER },
  { id: "signature", name: CHECK_NAMES.SIGNATURE },
  { id: "notExpired", name: CHECK_NAMES.NOT_EXPIRED },
  { id: "notRevoked", name: CHECK_NAMES.NOT_REVOKED },
];

export default function Verifier() {
  const state = useAppState();
  const actions = useAppActions();
  const verifier = state.verifier;

  // Drives the sequential 300ms/check animation, then commits the result.
  useAnimatedVerification(verifier.status);

  const textareaRef = useRef(null);
  const input = verifier.credentialInput;
  const hasInput = input.trim().length > 0;

  const isRunning = verifier.status === "RUNNING";
  const isDone =
    verifier.status === "VERIFIED" || verifier.status === "REJECTED";
  const activeIndex = verifier.activeCheckIndex;

  // Auto-focus the textarea when a credential arrives (nice for the demo)
  useEffect(() => {
    if (verifier.source === "wallet" || verifier.source === "fake") {
      // Defer to allow render
      const t = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [verifier.source, input.length]);

  const handleVerify = () => {
    if (!hasInput || isRunning) return;
    // Kick off the animation. The hook will dispatch RUN_VERIFICATION
    // after the six steps complete.
    actions.setActiveCheck(0);
  };

  const handleClear = () => {
    actions.clearVerification();
    actions.setVerifierInput("");
    textareaRef.current?.focus();
  };

  const handlePasteJson = async () => {
    // Optional convenience
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) actions.setVerifierInput(text);
    } catch {
      // Clipboard read may be blocked — silent
    }
  };

  // What to render in the check list
  const checklistRows = (() => {
    // After verification: render the real six checks
    if (isDone && verifier.results?.checks?.length) {
      return verifier.results.checks.map((c, i) => ({
        key: i,
        index: i + 1,
        check: c,
        active: false,
      }));
    }
    // During running: use CHECK_ORDER, mark activeIndex
    if (isRunning) {
      return CHECK_ORDER.map((c, i) => {
        const status =
          i < (activeIndex ?? 0)
            ? "SKIPPED" // provisional — will be replaced by real result
            : "PENDING";
        return {
          key: c.id,
          index: i + 1,
          check: {
            ...c,
            status,
            message:
              i === activeIndex
                ? "Running check…"
                : i < (activeIndex ?? 0)
                ? ""
                : "Awaiting verification",
          },
          active: i === activeIndex,
        };
      });
    }
    // Idle: pending six checks
    return CHECK_ORDER.map((c, i) => ({
      key: c.id,
      index: i + 1,
      check: { ...c, status: "PENDING", message: "Awaiting verification" },
      active: false,
    }));
  })();

  return (
    <div className="space-y-6">
      {/* ---------- HEADER ---------- */}
      <FrostedPanel size="lg" className="p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center h-12 w-12 rounded-2xl bg-brand-600 text-white shadow-frosted">
              <Building2 size={24} strokeWidth={2.2} />
            </div>
            <div>
              <p className="section-label">Verifier · Employer</p>
              <h2 className="text-xl font-bold text-ink-900">
                Independent Credential Verification
              </h2>
              <p className="text-[12px] text-ink-600 mt-0.5 max-w-xl">
                Paste or edit the credential JSON, then verify. Runs six checks
                locally — no contact with the issuer.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {verifier.source === "wallet" && (
              <StatusPill tone="pass">From student wallet</StatusPill>
            )}
            {verifier.source === "fake" && (
              <StatusPill tone="fail">From fake issuer</StatusPill>
            )}
            {verifier.source === "manual" && (
              <StatusPill tone="neutral">Pasted manually</StatusPill>
            )}
          </div>
        </div>
      </FrostedPanel>

      {/* ---------- MAIN GRID ---------- */}
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        {/* -------- INPUT COLUMN -------- */}
        <FrostedPanel className="p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <p className="section-label">Credential JSON</p>
              <h3 className="text-base font-bold text-ink-900">
                Paste or edit here
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {hasInput && <CopyButton value={input} label="Copy" />}
              <button
                className="btn-ghost !px-2 !py-1.5 text-[11px]"
                onClick={handlePasteJson}
                title="Paste from clipboard"
              >
                Paste
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => actions.setVerifierInput(e.target.value)}
            spellCheck={false}
            placeholder={`Paste a signed Verifiable Credential JSON here…\n\nTip: use "Share with Employer" from the Wallet tab.`}
            className="w-full flex-1 min-h-[380px] rounded-xl bg-white/85 ring-1 ring-slate-200 focus:ring-brand-500 focus:bg-white px-3 py-3 text-[12px] font-mono text-ink-900 outline-none transition-shadow resize-none"
            disabled={isRunning}
          />

          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[11px] text-ink-500 inline-flex items-center gap-1">
              <FileWarning size={12} />
              Editing the JSON invalidates the signature — try it.
            </p>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary !px-3 !py-2 text-[12px]"
                onClick={handleClear}
                disabled={!hasInput || isRunning}
              >
                <Eraser size={13} /> Clear
              </button>
              <button
                className="btn-primary !px-3 !py-2 text-[12px]"
                onClick={handleVerify}
                disabled={!hasInput || isRunning}
              >
                {isRunning ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Verifying…
                  </>
                ) : (
                  <>
                    <ClipboardCheck size={13} /> Verify Credential
                  </>
                )}
              </button>
            </div>
          </div>
        </FrostedPanel>

        {/* -------- CHECKLIST COLUMN -------- */}
        <FrostedPanel className="p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <p className="section-label">Verification Pipeline</p>
              <h3 className="text-base font-bold text-ink-900">
                Six Independent Checks
              </h3>
            </div>
            {isDone && verifier.results && (
              <StatusPill
                tone={verifier.status === "VERIFIED" ? "pass" : "fail"}
              >
                {verifier.status === "VERIFIED" ? (
                  <>
                    <CheckCircle2 size={11} className="-ml-0.5" /> Verified
                  </>
                ) : (
                  <>
                    <XCircle size={11} className="-ml-0.5" /> Rejected
                  </>
                )}
              </StatusPill>
            )}
          </div>

          {!hasInput && !isDone ? (
            <EmptyState
              icon={Sparkles}
              title="No credential loaded"
              description="Share a credential from the Wallet tab, or paste one into the JSON editor."
            />
          ) : (
            <>
              <div className="space-y-2">
                {checklistRows.map(({ key, index, check, active }) => (
                  <VerificationCheckRow
                    key={key}
                    index={index}
                    check={check}
                    active={active}
                  />
                ))}
              </div>

              <div className="mt-4">
                <VerificationSummary
                  result={verifier.results}
                  status={verifier.status}
                  parseError={verifier.parseError}
                />
              </div>
            </>
          )}
        </FrostedPanel>
      </div>

      {/* ---------- FRAUD SIMULATION ---------- */}
      <FakeIssuer />
    </div>
  );
}
