import Overview from "./Overview.jsx";
import Issuer from "./Issuer.jsx";
import Holder from "./Holder.jsx";
import Verifier from "./Verifier.jsx";
import Ledger from "./Ledger.jsx";

export default function Dashboard({ activeTab }) {
  return (
    <div className="animate-[fadeIn_.25s_ease]">
      {activeTab === "overview" && <Overview />}
      {activeTab === "issuer" && <Issuer />}
      {activeTab === "holder" && <Holder />}
      {activeTab === "verifier" && <Verifier />}
      {activeTab === "ledger" && <Ledger />}
    </div>
  );
}
