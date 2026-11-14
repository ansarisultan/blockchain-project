import {
  GraduationCap,
  ShieldCheck,
  ShieldOff,
  User,
  Calendar,
  Hash,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { formatDate } from "../../utils/dateUtils.js";
import { getCredentialPreview } from "../../credentials/credentialUtils.js";
import StatusPill from "../StatusPill.jsx";
import JsonViewer from "./JsonViewer.jsx";
import CopyButton from "./CopyButton.jsx";

export default function CredentialCard({
  credential,
  isRevoked = false,
  showRevoke = false,
  onRevoke,
  showIssuerStatus = true,
  actions = null,
}) {
  if (!credential) return null;
  const preview = getCredentialPreview(credential);

  return (
    <div
      className={`frosted-panel overflow-hidden ${
        isRevoked ? "ring-1 ring-amber-200" : ""
      }`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-white ring-1 ring-slate-200/80 shadow-sm shrink-0 overflow-hidden p-1">
              <img src="/logo.png" alt="University Logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.1em] text-ink-500 font-semibold">
                University Degree
              </p>
              <p className="text-[15px] font-bold text-ink-900 truncate">
                {preview.degree}
                {preview.branch ? ` · ${preview.branch}` : ""}
              </p>
              <p className="text-[12px] text-ink-600 inline-flex items-center gap-1 mt-0.5">
                <Building2 size={12} /> {preview.issuerName}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {isRevoked ? (
              <StatusPill tone="warn">Revoked</StatusPill>
            ) : (
              showIssuerStatus && <StatusPill tone="pass">Signed</StatusPill>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 grid sm:grid-cols-2 gap-x-6 gap-y-3">
        <InfoRow icon={User} label="Student" value={preview.subjectName} />
        <InfoRow icon={Hash} label="CGPA" value={preview.cgpa} />
        <InfoRow
          icon={BadgeCheck}
          label="Graduation"
          value={preview.graduationYear}
        />
        <InfoRow
          icon={Calendar}
          label="Issued"
          value={formatDate(preview.validFrom)}
        />
        <InfoRow
          icon={Calendar}
          label="Expires"
          value={formatDate(preview.validUntil)}
        />
        <InfoRow
          icon={ShieldCheck}
          label="Proof"
          value={preview.proofCryptosuite || "—"}
          mono
        />
      </div>

      {/* Credential ID strip */}
      <div className="px-5 pb-3">
        <div className="rounded-lg bg-slate-900/95 px-3 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-semibold">
              Credential ID
            </p>
            <p className="text-[11px] font-mono text-slate-100 truncate">
              {preview.id}
            </p>
          </div>
          <CopyButton value={preview.id} label="" className="!text-slate-300 hover:!bg-white/10 hover:!text-white" />
        </div>
      </div>

      {/* Raw JSON */}
      <div className="px-5 pb-3">
        <JsonViewer value={credential} title="Signed Credential JSON" maxHeight="max-h-56" />
      </div>

      {/* Actions */}
      {(showRevoke || actions) && (
        <div className="px-5 py-3 border-t border-slate-200/60 flex items-center justify-between gap-2 bg-white/30">
          <div className="text-[11px] text-ink-500 inline-flex items-center gap-1.5">
            {isRevoked ? (
              <>
                <ShieldOff size={12} className="text-amber-600" />
                <span className="text-amber-700 font-medium">
                  Revoked on ledger — future verification will fail
                </span>
              </>
            ) : (
              <>
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>Signature verifiable — status live on ledger</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {showRevoke && !isRevoked && (
              <button
                className="btn-danger !px-3 !py-1.5 text-[12px]"
                onClick={() => onRevoke?.(credential.id)}
              >
                Revoke
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="grid place-items-center h-6 w-6 rounded-md bg-white/80 ring-1 ring-white/80 text-ink-500 shrink-0 mt-0.5">
        <Icon size={12} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.1em] text-ink-500 font-semibold">
          {label}
        </p>
        <p
          className={`text-[13px] font-medium text-ink-900 truncate ${
            mono ? "font-mono text-[12px]" : ""
          }`}
          title={value}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
