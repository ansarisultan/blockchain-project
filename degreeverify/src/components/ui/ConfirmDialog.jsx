import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") onConfirm?.();
    };
    window.addEventListener("keydown", onKey);
    // Focus the cancel-ish button for safety after paint
    const t = setTimeout(() => confirmRef.current?.focus(), 30);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  const confirmClass =
    tone === "danger" ? "btn-danger" : "btn-primary";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center px-4"
    >
      <div
        className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md frosted-panel-lg p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`grid place-items-center h-10 w-10 rounded-xl shrink-0 ${
                tone === "danger"
                  ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                  : "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
              }`}
            >
              <AlertTriangle size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink-900">{title}</h3>
              {description && (
                <p className="text-[13px] text-ink-600 mt-1">{description}</p>
              )}
            </div>
          </div>
          <button
            className="btn-ghost !p-1.5"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className={confirmClass}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
