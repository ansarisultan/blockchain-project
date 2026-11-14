export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500 mb-1.5">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-ink-400 mt-1">{hint}</span>}
    </label>
  );
}

export function TextInput({ className = "", ...rest }) {
  return (
    <input
      {...rest}
      className={`w-full rounded-xl bg-white/80 ring-1 ring-slate-200 focus:ring-brand-500 focus:bg-white px-3 py-2 text-sm text-ink-900 outline-none transition-shadow ${className}`}
    />
  );
}
