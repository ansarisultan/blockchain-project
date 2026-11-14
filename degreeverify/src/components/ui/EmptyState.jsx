import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300/80 bg-white/40 px-4 py-8 text-center">
      <div className="mx-auto grid place-items-center h-10 w-10 rounded-xl bg-white/80 ring-1 ring-white/80 shadow-frosted text-ink-400">
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-800">{title}</p>
      {description && (
        <p className="mt-1 text-[12px] text-ink-500 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
