import { useState } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  GraduationCap,
  Wallet,
  Building2,
  Blocks,
  RotateCcw,
} from "lucide-react";
import TabButton from "./TabButton.jsx";
import { ConfirmDialog } from "./ui/index.js";
import { useAppActions } from "../context/AppContext.jsx";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "issuer", label: "University", icon: GraduationCap },
  { id: "holder", label: "Wallet", icon: Wallet },
  { id: "verifier", label: "Employer", icon: Building2 },
  { id: "ledger", label: "Ledger", icon: Blocks },
];

export default function Navbar({ activeTab, onTabChange }) {
  const actions = useAppActions();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleReset = () => {
    setConfirmOpen(false);
    actions.resetDemo();
    onTabChange("overview");
    actions.showToast("info", "Demo reset — all state restored to genesis.");
  };

  return (
    <>
      <header className="sticky top-0 z-40 frosted-navbar">
        <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-white ring-1 ring-slate-200/80 shadow-frosted overflow-hidden p-1">
                <img src="/logo.png" alt="DegreeVerify Logo" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[17px] font-bold tracking-tight text-ink-900">
                    DegreeVerify
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    LIVE DEMO
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] text-ink-500 -mt-0.5">
                  Trust Every Credential. Verify Independently.
                </p>
              </div>
            </div>

            {/* Tabs */}
            <nav className="hidden lg:flex items-center gap-1 rounded-full bg-white/50 p-1 ring-1 ring-white/70">
              {TABS.map((t) => (
                <TabButton
                  key={t.id}
                  id={t.id}
                  label={t.label}
                  icon={t.icon}
                  active={activeTab === t.id}
                  onClick={onTabChange}
                />
              ))}
            </nav>

            {/* Reset */}
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="btn-secondary !px-3 !py-2 text-xs"
              title="Reset Demo"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Mobile tabs */}
          <div className="lg:hidden pb-3 -mt-1">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-full bg-white/50 p-1 ring-1 ring-white/70">
              {TABS.map((t) => (
                <TabButton
                  key={t.id}
                  id={t.id}
                  label={t.label}
                  icon={t.icon}
                  active={activeTab === t.id}
                  onClick={onTabChange}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        title="Reset the demo?"
        description="This clears all identities, keys, wallet credentials, verifier state, and ledger history, then reinitializes the simulated ledger with a fresh genesis block."
        confirmLabel="Reset Demo"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReset}
      />
    </>
  );
}
