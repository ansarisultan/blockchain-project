import { useMemo } from "react";
import {
  Wallet,
  KeyRound,
  Send,
  ShieldCheck,
  ShieldOff,
  UserRound,
} from "lucide-react";
import FrostedPanel from "./FrostedPanel.jsx";
import StatusPill from "./StatusPill.jsx";
import CredentialCard from "./ui/CredentialCard.jsx";
import DidBadge from "./ui/DidBadge.jsx";
import DIDDocument from "./ui/DIDDocument.jsx";
import EmptyState from "./ui/EmptyState.jsx";
import {
  useAppState,
  useAppActions,
} from "../context/AppContext.jsx";
import { isRevoked, liveCredentialCount } from "../context/selectors.js";

export default function Holder() {
  const state = useAppState();
  const actions = useAppActions();
  const student = state.student;

  const liveCount = useMemo(() => liveCredentialCount(state), [state]);
  const revokedCount = student.credentials.length - liveCount;

  return (
    <div className="space-y-6">
      {/* ---------- WALLET IDENTITY ---------- */}
      <FrostedPanel size="lg" className="p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center h-12 w-12 rounded-2xl bg-brand-600 text-white shadow-frosted">
              <Wallet size={24} strokeWidth={2.2} />
            </div>
            <div>
              <p className="section-label">Holder · Student Wallet</p>
              <h2 className="text-xl font-bold text-ink-900">
                {student.name || "Unnamed Student"}
              </h2>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                {student.did ? (
                  <StatusPill tone="pass">DID active</StatusPill>
                ) : (
                  <StatusPill tone="warn">No DID yet</StatusPill>
                )}
                <span className="text-[11px] text-ink-500">
                  {student.credentials.length} credential
                  {student.credentials.length === 1 ? "" : "s"} in wallet
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!student.did ? (
              <button className="btn-primary" onClick={actions.generateStudentDID}>
                <KeyRound size={14} /> Generate Student DID
              </button>
            ) : (
              <button
                className="btn-secondary"
                onClick={actions.generateStudentDID}
                title="Regenerate a new DID (clears wallet)"
              >
                <KeyRound size={14} /> Regenerate DID
              </button>
            )}
          </div>
        </div>

        {student.did ? (
          <div className="mt-5 grid lg:grid-cols-2 gap-3">
            <DidBadge did={student.did} label="Student DID" />
            <div className="rounded-xl bg-white/70 ring-1 ring-white/70 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.1em] text-ink-500 font-semibold">
                Private key (preview only)
              </p>
              <p className="text-[12px] font-mono text-ink-700 mt-0.5">
                ●●●●●●●● (stored in memory, never displayed)
              </p>
            </div>
            <div className="lg:col-span-2">
              <DIDDocument did={student.did} />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-ink-600">
            Generate your DID to receive credentials from the university. This
            DID is required before any credential can be issued to you.
          </p>
        )}
      </FrostedPanel>

      {/* ---------- SUMMARY STRIP ---------- */}
      {student.credentials.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          <MiniStat
            icon={ShieldCheck}
            label="Live credentials"
            value={liveCount}
            tone="pass"
          />
          <MiniStat
            icon={ShieldOff}
            label="Revoked"
            value={revokedCount}
            tone={revokedCount > 0 ? "warn" : "neutral"}
          />
          <MiniStat
            icon={Wallet}
            label="Total in wallet"
            value={student.credentials.length}
            tone="neutral"
          />
        </div>
      )}

      {/* ---------- CREDENTIALS ---------- */}
      <FrostedPanel className="p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="section-label">Wallet contents</p>
            <h3 className="text-base font-bold text-ink-900">
              Your Digital Degrees
            </h3>
          </div>
          <StatusPill tone="neutral">
            {student.credentials.length} item
            {student.credentials.length === 1 ? "" : "s"}
          </StatusPill>
        </div>

        {student.credentials.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Your wallet is empty"
            description="Once the university issues a degree credential to your DID, it will appear here."
          />
        ) : (
          <div className="space-y-4">
            {student.credentials.map((c) => (
              <CredentialCard
                key={c.id}
                credential={c}
                isRevoked={isRevoked(state, c.id)}
                actions={
                  <button
                    className="btn-secondary !px-3 !py-1.5 text-[12px]"
                    onClick={() => {
                      actions.shareCredential(c);
                      actions.setActiveTab("verifier");
                    }}
                  >
                    <Send size={13} /> Share with Employer
                  </button>
                }
              />
            ))}
          </div>
        )}
      </FrostedPanel>

      {!student.did && (
        <FrostedPanel className="p-5 flex items-start gap-3">
          <UserRound size={16} className="text-brand-600 mt-0.5" />
          <p className="text-[13px] text-ink-600">
            Tip: Generate your DID before the university issues a credential —
            issuance is bound to your DID at signing time.
          </p>
        </FrostedPanel>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tone = "neutral" }) {
  const toneClass =
    tone === "pass"
      ? "text-emerald-700 bg-emerald-50 ring-emerald-100"
      : tone === "warn"
      ? "text-amber-700 bg-amber-50 ring-amber-100"
      : "text-ink-700 bg-white/70 ring-white/70";
  return (
    <div className={`rounded-xl px-4 py-3 ring-1 flex items-center gap-3 ${toneClass}`}>
      <div className="grid place-items-center h-8 w-8 rounded-lg bg-white/80 ring-1 ring-white/80">
        <Icon size={16} strokeWidth={2.4} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.1em] font-semibold opacity-80">
          {label}
        </p>
        <p className="text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}
