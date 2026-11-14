import { useMemo, useState } from "react";
import {
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  UserPlus,
  Send,
  Users,
} from "lucide-react";
import FrostedPanel from "./FrostedPanel.jsx";
import StatusPill from "./StatusPill.jsx";
import CredentialCard from "./ui/CredentialCard.jsx";
import DidBadge from "./ui/DidBadge.jsx";
import DIDDocument from "./ui/DIDDocument.jsx";
import EmptyState from "./ui/EmptyState.jsx";
import { Field, TextInput } from "./ui/Field.jsx";
import {
  useAppState,
  useAppActions,
} from "../context/AppContext.jsx";
import { canIssue, isRevoked } from "../context/selectors.js";

const DEFAULT_FORM = {
  name: "Arjun Rao",
  degree: "B.Tech",
  branch: "CSE",
  cgpa: "8.2",
  graduationYear: "2028",
};

export default function Issuer() {
  const state = useAppState();
  const actions = useAppActions();
  const [form, setForm] = useState(DEFAULT_FORM);

  const university = state.university;
  const studentReady = Boolean(state.student.did);
  const canIssueNow = canIssue(state);
  const issuedCredentials = useMemo(
    () =>
      state.student.credentials.filter(
        (c) => c.issuer?.id === university.did
      ),
    [state.student.credentials, university.did]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canIssueNow) return;
    actions.issueCredential(form);
    // Keep the form values — demoing several credentials is common
  };

  return (
    <div className="space-y-6">
      {/* ---------- IDENTITY CARD ---------- */}
      <FrostedPanel size="lg" className="p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center h-12 w-12 rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-frosted overflow-hidden p-1.5">
              <img src="/logo.png" alt="Presidency University Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="section-label">Issuer · Trusted University</p>
              <h2 className="text-xl font-bold text-ink-900">
                {university.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                {university.registered ? (
                  <StatusPill tone="pass">Registered on ledger</StatusPill>
                ) : university.did ? (
                  <StatusPill tone="warn">Not registered</StatusPill>
                ) : (
                  <StatusPill tone="neutral">No DID yet</StatusPill>
                )}
                <span className="text-[11px] text-ink-500">
                  Ed25519 · did:key
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!university.did ? (
              <button
                className="btn-primary"
                onClick={actions.generateUniversityDID}
              >
                <KeyRound size={14} /> Generate University DID
              </button>
            ) : (
              <button
                className="btn-secondary"
                onClick={actions.generateUniversityDID}
                title="Regenerate a new keypair + DID"
              >
                <KeyRound size={14} /> Regenerate DID
              </button>
            )}
            {university.did && !university.registered && (
              <button
                className="btn-primary"
                onClick={actions.registerUniversity}
              >
                <ShieldCheck size={14} /> Register on Ledger
              </button>
            )}
          </div>
        </div>

        {university.did && (
          <div className="mt-5 grid lg:grid-cols-2 gap-3">
            <DidBadge did={university.did} label="University DID" />
            <div className="rounded-xl bg-white/70 ring-1 ring-white/70 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.1em] text-ink-500 font-semibold">
                Private key (preview only)
              </p>
              <p className="text-[12px] font-mono text-ink-700 mt-0.5">
                ●●●●●●●● (stored in memory, never displayed)
              </p>
            </div>
            <div className="lg:col-span-2">
              <DIDDocument did={university.did} />
            </div>
          </div>
        )}

        {!university.did && (
          <p className="mt-4 text-[13px] text-ink-600">
            Generate a DID to enable registration and issuance. The DID is
            derived from a fresh Ed25519 keypair generated in your browser.
          </p>
        )}
      </FrostedPanel>

      {/* ---------- ISSUANCE ---------- */}
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        <FrostedPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="grid place-items-center h-8 w-8 rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <Send size={16} strokeWidth={2.4} />
            </div>
            <div>
              <p className="section-label">Issue</p>
              <h3 className="text-base font-bold text-ink-900">
                Issue Digital Degree
              </h3>
            </div>
          </div>

          {/* Gate message */}
          {!university.registered && university.did && (
            <GateMsg tone="warn" icon={ShieldAlert}>
              Register the university on the simulated ledger before issuing.
            </GateMsg>
          )}
          {!university.did && (
            <GateMsg tone="warn" icon={KeyRound}>
              Generate the university DID first.
            </GateMsg>
          )}
          {university.registered && !studentReady && (
            <GateMsg tone="warn" icon={UserPlus}>
              The student must generate a DID in the Wallet tab first.
            </GateMsg>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Student Name">
                <TextInput
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!canIssueNow}
                />
              </Field>
            </div>
            <Field label="Degree">
              <TextInput
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
                disabled={!canIssueNow}
              />
            </Field>
            <Field label="Branch">
              <TextInput
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                disabled={!canIssueNow}
              />
            </Field>
            <Field label="CGPA">
              <TextInput
                value={form.cgpa}
                onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
                disabled={!canIssueNow}
              />
            </Field>
            <Field label="Graduation Year">
              <TextInput
                value={form.graduationYear}
                onChange={(e) =>
                  setForm({ ...form, graduationYear: e.target.value })
                }
                disabled={!canIssueNow}
              />
            </Field>
            <div className="col-span-2 mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] text-ink-500">
                Default demo data — safe for the classroom.
              </p>
              <button
                type="submit"
                disabled={!canIssueNow}
                className="btn-primary"
              >
                <Send size={14} /> Issue Credential
              </button>
            </div>
          </form>
        </FrostedPanel>

        {/* ---------- ISSUED LIST ---------- */}
        <FrostedPanel className="p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Users size={16} strokeWidth={2.4} />
              </div>
              <div>
                <p className="section-label">Issued</p>
                <h3 className="text-base font-bold text-ink-900">
                  Credentials on Record
                </h3>
              </div>
            </div>
            <StatusPill tone="neutral">{issuedCredentials.length}</StatusPill>
          </div>

          {issuedCredentials.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No credentials issued yet"
              description="Fill the form on the left and click Issue Credential."
            />
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {issuedCredentials.map((c) => (
                <CredentialCard
                  key={c.id}
                  credential={c}
                  isRevoked={isRevoked(state, c.id)}
                  showRevoke
                  onRevoke={actions.revokeCredential}
                  showIssuerStatus={false}
                />
              ))}
            </div>
          )}
        </FrostedPanel>
      </div>
    </div>
  );
}

function GateMsg({ tone = "warn", icon: Icon, children }) {
  const toneClass =
    tone === "warn"
      ? "bg-amber-50 text-amber-800 ring-amber-100"
      : "bg-slate-50 text-ink-700 ring-slate-200";
  return (
    <div
      className={`mb-4 flex items-start gap-2 rounded-xl px-3 py-2 text-[12px] ring-1 ${toneClass}`}
    >
      <Icon size={14} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
