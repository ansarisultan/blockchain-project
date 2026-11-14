import { useState } from "react";
import { ChevronDown, ChevronRight, FileJson } from "lucide-react";
import { getDIDDocument } from "../../crypto/index.js";
import JsonViewer from "./JsonViewer.jsx";

export default function DIDDocument({ did }) {
  const [open, setOpen] = useState(false);

  if (!did) return null;

  let doc = null;
  let error = null;
  try {
    doc = getDIDDocument(did);
  } catch (err) {
    error = err.message;
  }

  return (
    <div className="rounded-xl bg-white/60 ring-1 ring-white/70">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="inline-flex items-center gap-2">
          <FileJson size={14} className="text-ink-500" />
          <span className="text-[12px] font-semibold text-ink-800">
            DID Document
          </span>
          <span className="text-[11px] text-ink-500">
            {doc?.verificationMethod?.length ?? 0} verification method
          </span>
        </span>
        <span className="text-ink-400">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3">
          {error ? (
            <p className="text-[12px] text-red-600">Unable to build DID Document: {error}</p>
          ) : (
            <JsonViewer value={doc} title="did:key document" defaultOpen maxHeight="max-h-64" />
          )}
        </div>
      )}
    </div>
  );
}
