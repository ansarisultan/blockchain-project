import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import CopyButton from "./CopyButton.jsx";

export default function JsonViewer({
  value,
  title = "Raw JSON",
  defaultOpen = false,
  maxHeight = "max-h-72",
}) {
  const [open, setOpen] = useState(defaultOpen);
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);

  return (
    <div className="rounded-xl bg-white/60 ring-1 ring-white/70 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500 hover:text-ink-800"
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {title}
        </button>
        <CopyButton value={text} label="Copy JSON" />
      </div>
      {open && (
        <pre className={`mono-block text-[11px] ${maxHeight} mx-3 mb-3`}>{text}</pre>
      )}
    </div>
  );
}
