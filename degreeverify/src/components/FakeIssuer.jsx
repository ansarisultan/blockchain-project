import { AlertTriangle, Zap, ShieldAlert, Wand2 } from "lucide-react";
import { useAppState, useAppActions } from "../context/AppContext.jsx";
import StatusPill from "./StatusPill.jsx";

export default function FakeIssuer() {
  const state = useAppState();
  const actions = useAppActions();
  const fake = state.fakeUniversity;

  const studentReady = Boolean(state.student.did);
  const hasFake = Boolean(fake.lastCredential);
  const disabled = !studentReady;

  const handleGenerate = () => {
    actions.generateFakeCredential();
  };

  const handleShare = () => {
    if (!fake.lastCredential) return;
    actions.setVerifierSource(fake.lastCredential, "fake");
  };

  return (
    <div className="rounded-2xl ring-1 ring-red-200 bg-gradient-to-br from-red-50/90 to-rose-50/60 backdrop-blur-xl px-5 py-5 shadow-frosted relative overflow-hidden">
      {/* Subtle danger accent */}
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-red-300/30 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-red-600 text-white shadow-frosted shrink-0">
              <ShieldAlert size={20} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-red-700">
                Fraud Simulation
              </p>
              <h3 className="text-base font-bold text-red-900 mt-0.5">
                Fake University Attack
              </h3>
              <p className="text-[12px] text-red-800/80 mt-1 max-w-md">
                Signs a real degree credential with a real Ed25519 key — but is
                never anchored on the ledger. Tests that trust ≠ cryptography.
              </p>
            </div>
          </div>
          <StatusPill tone="fail">
            <AlertTriangle size={11} className="-ml-0.5" />
            Untrusted
          </StatusPill>
        </div>

        {/* Steps */}
        <div className="mt-4 grid sm:grid-cols-3 gap-2 text-[11px]">
          <Step n={1} label="Generate fake keypair + DID" done={Boolean(fake.did)} />
          <Step n={2} label="Sign degree credential" done={hasFake} />
          <Step n={3} label="Share with employer" done={state.verifier.source === "fake"} />
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            className="btn-danger !px-3 !py-2 text-[12px] disabled:opacity-60"
            onClick={handleGenerate}
            disabled={disabled}
          >
            <Wand2 size={13} />
            {hasFake ? "Regenerate Fake Credential" : "Generate Fake Credential"}
          </button>
          <button
            className="btn-secondary !px-3 !py-2 text-[12px] disabled:opacity-60"
            onClick={handleShare}
            disabled={!hasFake}
          >
            <Zap size={13} /> Send to Verifier
          </button>
          {disabled && (
            <span className="text-[11px] text-red-700/80 ml-1">
              Generate the student DID in the Wallet tab first.
            </span>
          )}
        </div>

        {hasFake && (
          <div className="mt-3 rounded-xl bg-white/60 ring-1 ring-red-100 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.1em] font-semibold text-red-700">
              Fake Issuer DID
            </p>
            <p
              className="text-[11px] font-mono text-red-900 truncate mt-0.5"
              title={fake.did}
            >
              {fake.did}
            </p>
            <p className="text-[10px] text-red-700/80 mt-1">
              This DID was never registered on the simulated ledger.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ n, label, done }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`grid place-items-center h-5 w-5 rounded-full text-[10px] font-bold ring-1 shrink-0 ${
          done
            ? "bg-emerald-500 text-white ring-emerald-600"
            : "bg-white/70 text-red-700 ring-red-200"
        }`}
      >
        {done ? "✓" : n}
      </div>
      <span
        className={`${done ? "text-emerald-800 font-medium" : "text-red-800/80"}`}
      >
        {label}
      </span>
    </div>
  );
}
