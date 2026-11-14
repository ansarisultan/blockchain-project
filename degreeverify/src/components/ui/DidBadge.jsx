import { Fingerprint } from "lucide-react";
import CopyButton from "./CopyButton.jsx";

export default function DidBadge({ did, label = "DID", short = true }) {
  if (!did) return null;
  const display = short
    ? `${did.slice(0, 20)}…${did.slice(-6)}`
    : did;
  return (
    <div className="rounded-xl bg-white/70 ring-1 ring-white/70 px-3 py-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Fingerprint size={14} className="text-brand-600 shrink-0" strokeWidth={2.4} />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.1em] text-ink-500 font-semibold">
            {label}
          </p>
          <p
            className="text-[12px] font-mono text-ink-900 truncate"
            title={did}
          >
            {display}
          </p>
        </div>
      </div>
      <CopyButton value={did} label="" />
    </div>
  );
}
