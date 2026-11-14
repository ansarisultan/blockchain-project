import { CheckCircle2, AlertCircle, XCircle, Info, X } from "lucide-react";
import { useAppState, useAppActions } from "../../context/AppContext.jsx";

const TONES = {
  success: {
    Icon: CheckCircle2,
    wrap: "bg-emerald-50/90 ring-emerald-200 text-emerald-900",
    iconWrap: "bg-emerald-100 text-emerald-700",
  },
  warning: {
    Icon: AlertCircle,
    wrap: "bg-amber-50/90 ring-amber-200 text-amber-900",
    iconWrap: "bg-amber-100 text-amber-700",
  },
  error: {
    Icon: XCircle,
    wrap: "bg-red-50/90 ring-red-200 text-red-900",
    iconWrap: "bg-red-100 text-red-700",
  },
  info: {
    Icon: Info,
    wrap: "bg-brand-50/90 ring-brand-200 text-brand-900",
    iconWrap: "bg-brand-100 text-brand-700",
  },
};

export default function Toast() {
  const state = useAppState();
  const actions = useAppActions();
  const toast = state.ui.toast;
  if (!toast) return null;

  const tone = TONES[toast.tone] || TONES.info;
  const { Icon } = tone;

  return (
    <div className="fixed top-4 right-4 z-[60] max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-[toastIn_.22s_ease]">
      <div
        className={`rounded-xl backdrop-blur-xl shadow-frosted-lg ring-1 px-4 py-3 flex items-start gap-3 ${tone.wrap}`}
      >
        <div
          className={`grid place-items-center h-7 w-7 rounded-lg shrink-0 ${tone.iconWrap}`}
        >
          <Icon size={16} strokeWidth={2.4} />
        </div>
        <p className="text-[13px] leading-snug flex-1 pt-1">{toast.message}</p>
        <button
          className="btn-ghost !p-1"
          onClick={actions.clearToast}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
