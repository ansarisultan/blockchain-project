import { Check, Copy } from "lucide-react";
import { useClipboard } from "../../hooks/useClipboard.js";

export default function CopyButton({
  value,
  label = "Copy",
  className = "",
  size = 12,
}) {
  const { copy, copied } = useClipboard();
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-ink-500 hover:bg-white/70 hover:text-ink-800 transition-colors ${className}`}
      title={label}
    >
      {copied ? (
        <>
          <Check size={size} strokeWidth={2.6} className="text-emerald-600" />
          <span className="text-emerald-700">Copied</span>
        </>
      ) : (
        <>
          <Copy size={size} strokeWidth={2.4} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
