import { useMemo, useState } from "react";
import {
  Blocks,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Link2,
  Database,
  Hash,
  Clock,
} from "lucide-react";
import FrostedPanel from "./FrostedPanel.jsx";
import StatusPill from "./StatusPill.jsx";
import CopyButton from "./ui/CopyButton.jsx";
import JsonViewer from "./ui/JsonViewer.jsx";
import EmptyState from "./ui/EmptyState.jsx";
import { useAppState } from "../context/AppContext.jsx";
import {
  verifyChainIntegrity,
  listTrustedIssuers,
  listRevocations,
  getBlockCount,
} from "../blockchain/index.js";
import { formatDate } from "../utils/dateUtils.js";

const TYPE_STYLE = {
  GENESIS: {
    wrap: "bg-ink-900 text-white ring-ink-900",
    label: "Genesis",
  },
  DID_ANCHOR: {
    wrap: "bg-brand-50 text-brand-800 ring-brand-100",
    label: "DID Anchor",
  },
  REVOKE: {
    wrap: "bg-amber-50 text-amber-800 ring-amber-100",
    label: "Revoke",
  },
};

export default function Ledger() {
  const state = useAppState();
  const ledger = state.ledger;

  const blocks = ledger.blocks;
  const blockCount = getBlockCount(ledger);
  const trusted = useMemo(() => listTrustedIssuers(ledger), [ledger]);
  const revocations = useMemo(() => listRevocations(ledger), [ledger]);

  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const runIntegrityCheck = () => {
    setChecking(true);
    setCheckResult(null);
    // Brief delay so the spinner is perceivable — the actual check is instant
    setTimeout(() => {
      setCheckResult(verifyChainIntegrity(ledger));
      setChecking(false);
    }, 260);
  };

  return (
    <div className="space-y-6">
      {/* ---------- HEADER ---------- */}
      <FrostedPanel size="lg" className="p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center h-12 w-12 rounded-2xl bg-brand-600 text-white shadow-frosted">
              <Blocks size={24} strokeWidth={2.2} />
            </div>
            <div>
              <p className="section-label">Verifiable Data Registry</p>
              <h2 className="text-xl font-bold text-ink-900">
                Simulated Ledger
              </h2>
              <p className="text-[12px] text-ink-600 mt-0.5 max-w-xl">
                In-memory hash-chained registry for issuer anchors and credential
                revocations. Not a real blockchain.
              </p>
            </div>
          </div>
          <StatusPill tone="warn">Simulated — not a real chain</StatusPill>
        </div>

        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <StatTile icon={Database} label="Blocks" value={blockCount} />
          <StatTile icon={ShieldCheck} label="Trusted issuers" value={trusted.length} />
          <StatTile icon={ShieldAlert} label="Revocations" value={revocations.length} tone="warn" />
        </div>
      </FrostedPanel>

      {/* ---------- INTEGRITY CHECKER ---------- */}
      <FrostedPanel className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="section-label">Chain integrity</p>
            <h3 className="text-base font-bold text-ink-900">
              Recompute every hash and prevHash link
            </h3>
            <p className="text-[12px] text-ink-500 mt-1 max-w-md">
              Each block's hash is recomputed from its canonicalized content.
              Every link must match the previous block's hash.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={runIntegrityCheck}
            disabled={checking}
          >
            {checking ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Verifying…
              </>
            ) : (
              <>
                <Link2 size={14} /> Verify Chain Integrity
              </>
            )}
          </button>
        </div>

        {checkResult && (
          <div
            className={`mt-4 rounded-xl ring-1 px-4 py-3 flex items-start gap-3 ${
              checkResult.valid
                ? "bg-emerald-50 ring-emerald-200 text-emerald-900"
                : "bg-red-50 ring-red-200 text-red-900"
            }`}
          >
            <div
              className={`grid place-items-center h-8 w-8 rounded-lg shrink-0 ${
                checkResult.valid
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {checkResult.valid ? (
                <CheckCircle2 size={18} strokeWidth={2.4} />
              ) : (
                <XCircle size={18} strokeWidth={2.4} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.1em] font-bold">
                {checkResult.valid ? "Chain valid" : "Chain invalid"}
              </p>
              <p className="text-[12px] mt-0.5">
                {checkResult.valid
                  ? `${blockCount} blocks · every hash and prevHash link verified.`
                  : checkResult.problems.join(" · ")}
              </p>
            </div>
          </div>
        )}
      </FrostedPanel>

      {/* ---------- BLOCK LIST ---------- */}
      <FrostedPanel className="p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <p className="section-label">Block explorer</p>
            <h3 className="text-base font-bold text-ink-900">
              All blocks, newest last
            </h3>
          </div>
          <StatusPill tone="neutral">{blockCount}</StatusPill>
        </div>

        {blocks.length === 0 ? (
          <EmptyState
            icon={Blocks}
            title="No blocks yet"
            description="A fresh genesis block will appear here on first render."
          />
        ) : (
          <div className="space-y-2">
            {blocks.map((b) => (
              <BlockRow key={b.hash} block={b} />
            ))}
          </div>
        )}
      </FrostedPanel>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone = "neutral" }) {
  const toneClass =
    tone === "warn"
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

function BlockRow({ block }) {
  const [open, setOpen] = useState(false);
  const typeStyle = TYPE_STYLE[block.type] || TYPE_STYLE.GENESIS;

  const summary = (() => {
    if (block.type === "GENESIS") return "Simulated ledger initialized";
    if (block.type === "DID_ANCHOR") return block.data?.name || block.data?.did || "DID anchored";
    if (block.type === "REVOKE") return block.data?.credentialId || "Credential revoked";
    return "";
  })();

  return (
    <div className="rounded-xl ring-1 ring-slate-200/80 bg-white/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-3 py-2.5 flex items-start gap-3"
      >
        <div className="grid place-items-center h-8 w-8 rounded-lg bg-white/80 ring-1 ring-white/80 shrink-0 text-ink-500">
          <span className="text-[11px] font-bold">#{block.index}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${typeStyle.wrap}`}
            >
              {typeStyle.label}
            </span>
            <span className="text-[11px] text-ink-500 inline-flex items-center gap-1">
              <Clock size={10} />
              {formatDate(block.timestamp)}
            </span>
          </div>
          <p className="text-[12px] text-ink-800 mt-1 truncate">{summary}</p>

          <div className="mt-1.5 flex items-center gap-3 text-[10px] font-mono text-ink-500">
            <span className="inline-flex items-center gap-1 min-w-0">
              <Hash size={9} />
              <span className="truncate" title={block.hash}>
                {block.hash.slice(0, 16)}…
              </span>
            </span>
            <span className="inline-flex items-center gap-1 min-w-0">
              <Link2 size={9} />
              <span className="truncate" title={block.prevHash}>
                {block.prevHash.slice(0, 16)}…
              </span>
            </span>
          </div>
        </div>

        <span className="text-ink-400 shrink-0 mt-1">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-slate-200/60 pt-3">
          <div className="grid sm:grid-cols-2 gap-2 mb-2">
            <HashLine label="Block hash" value={block.hash} />
            <HashLine label="Previous hash" value={block.prevHash} />
          </div>
          <JsonViewer value={block} title="Full block JSON" defaultOpen maxHeight="max-h-64" />
        </div>
      )}
    </div>
  );
}

function HashLine({ label, value }) {
  return (
    <div className="rounded-lg bg-white/70 ring-1 ring-white/80 px-2.5 py-1.5">
      <p className="text-[9px] uppercase tracking-[0.1em] font-semibold text-ink-500">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <p
          className="text-[10px] font-mono text-ink-800 truncate"
          title={value}
        >
          {value}
        </p>
        <CopyButton value={value} label="" />
      </div>
    </div>
  );
}
