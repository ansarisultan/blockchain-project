import { CheckCircle2, XCircle, AlertCircle, Circle } from "lucide-react";

const STYLES = {
  pass: {
    wrap: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Icon: CheckCircle2,
  },
  fail: {
    wrap: "bg-red-50 text-red-700 ring-red-100",
    Icon: XCircle,
  },
  warn: {
    wrap: "bg-amber-50 text-amber-700 ring-amber-100",
    Icon: AlertCircle,
  },
  neutral: {
    wrap: "bg-slate-100 text-slate-600 ring-slate-200",
    Icon: Circle,
  },
};

export default function StatusPill({ tone = "neutral", children }) {
  const { wrap, Icon } = STYLES[tone] || STYLES.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${wrap}`}
    >
      <Icon size={12} strokeWidth={2.6} />
      {children}
    </span>
  );
}
