import { AppProvider, useAppState, useAppActions } from "./context/AppContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { Toast } from "./components/ui/index.js";

export default function App() {
  return (
    <AppProvider>
      <AppShell />
      <Toast />
    </AppProvider>
  );
}

function AppShell() {
  const state = useAppState();
  const actions = useAppActions();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        activeTab={state.ui.activeTab}
        onTabChange={actions.setActiveTab}
      />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-6 lg:px-8 py-8">
        <Dashboard activeTab={state.ui.activeTab} />
      </main>
      <footer className="mx-auto w-full max-w-[1400px] px-6 lg:px-8 py-6">
        <div className="frosted-panel px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-500">
          <span>
            DegreeVerify · CA3 Demonstration · Foundations of Blockchain Technology
          </span>
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ed25519 · did:key · W3C VC
            </span>
            <span className="hidden sm:inline text-ink-300">|</span>
            <span className="hidden sm:inline">Simulated Ledger — Not a real blockchain</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
