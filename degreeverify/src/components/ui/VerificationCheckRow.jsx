import {
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
  Loader2,
} from "lucide-react";

const STATE = {
  pending: {
    Icon: Clock,
    wrap: "bg-white/50 text-ink-400 ring-white/70",
    text: "text-ink-500",
    detail: "text-ink-400",
  },
  active: {
    Icon: Loader2,
    wrap: "bg-brand-50 text-brand-700 ring-brand-100",
    text: "text-brand-800 font-semibold",
    detail: "text-brand-600",
    spinning: true,
  },
  pass: {
    Icon: CheckCircle2,
    wrap: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    text: "text-emerald-800 font-semibold",
    detail: "text-emerald-700",
  },
  fail: {
    Icon: XCircle,
    wrap: "bg-red-50 text-red-700 ring-red-200",
    text: "text-red-800 font-bold",
    detail: "text-red-700",
    emphasise: true,
  },
  skipped: {
    Icon: MinusCircle,
    wrap: "bg-slate-50 text-ink-400 ring-slate-200",
    text: "text-ink-400 font-medium",
    detail: "text-ink-400 italic",
  },
};

/**
 * @param {object} props
 * @param {number} props.index   — 1-based check number
 * @param {object} props.check   — { id, name, status, message }
 * @param {boolean} props.active — if true, render as "running now"
 */
export default function VerificationCheckRow({ index, check, active }) {
  const status = (() => {
    if (active) return "active";
    switch (check.status) {
      case "PASS": return "pass";
      case "FAIL": return "fail";
      case "SKIPPED": return "skipped";
      default: return "pending";
    }
  })();

  const s = STATE[status];
  const { Icon } = s;

  return (
    <div
      className={[
        "rounded-xl ring-1 px-3 py-2.5 flex items-start gap-3 transition-all duration-300",
        s.wrap,
        s.emphasise ? "shadow-[0_4px_20px_rgba(220,38,38,0.12)]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="grid place-items-center h-6 w-6 rounded-full bg-white/80 ring-1 ring-white/70 shrink-0 mt-0.5">
        <Icon
          size={13}
          strokeWidth={2.6}
          className={s.spinning ? "animate-spin" : ""}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] ${s.text}`}>
          <span className="text-[11px] opacity-70 mr-1">{index}.</span>
          {check.name}
        </p>
        <p className={`text-[11px] mt-0.5 ${s.detail}`}>
          {active ? "Running check…" : check.message || "Awaiting verification"}
        </p>
      </div>
    </div>
  );
}
