export default function TabButton({ id, label, icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`tab-pill whitespace-nowrap ${active ? "tab-pill-active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {Icon ? <Icon size={15} strokeWidth={2.2} /> : null}
      <span>{label}</span>
    </button>
  );
}
