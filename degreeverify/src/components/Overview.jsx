import {
  ShieldCheck,
  Fingerprint,
  FileSignature,
  Lock,
  Eye,
  Blocks,
  ArrowRight,
  GraduationCap,
  Wallet,
  Building2,
} from "lucide-react";
import FrostedPanel from "./FrostedPanel.jsx";
import StatusPill from "./StatusPill.jsx";

const FEATURES = [
  {
    icon: Fingerprint,
    title: "Decentralized Identity",
    text: "did:key identifiers generated from Ed25519 keypairs — no central authority.",
  },
  {
    icon: FileSignature,
    title: "Verifiable Credentials",
    text: "W3C VC 2.0 shape with real Ed25519 signatures and JCS canonicalization.",
  },
  {
    icon: Eye,
    title: "Independent Verification",
    text: "Six independent checks — structure, DID, trust, signature, expiry, revocation.",
  },
  {
    icon: Blocks,
    title: "Simulated Ledger",
    text: "Hash-chained registry for issuer anchors and credential revocations.",
  },
];

const FLOW = [
  { icon: GraduationCap, label: "University", tone: "brand" },
  { icon: Wallet, label: "Student", tone: "violet" },
  { icon: Building2, label: "Employer", tone: "emerald" },
];

export default function Overview() {
  return (
    <div className="space-y-6">
      {/* HERO */}
      <FrostedPanel size="lg" className="overflow-hidden">
        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-8 p-8 lg:p-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <StatusPill tone="pass">Ed25519 · did:key</StatusPill>
              <StatusPill tone="warn">Simulated Ledger</StatusPill>
            </div>
            <h1 className="text-[34px] lg:text-[40px] leading-[1.1] font-bold tracking-tight text-ink-900 text-balance">
              Trust every credential.
              <br />
              <span className="text-brand-600">Verify independently.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-600">
              A decentralized digital degree verification platform. Universities
              issue cryptographically signed degrees. Students hold them in a
              wallet. Employers verify them without ever contacting the issuer.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {FLOW.map((f, i) => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-white/80 shadow-frosted">
                    <f.icon size={16} className="text-ink-700" strokeWidth={2.2} />
                    <span className="text-sm font-semibold text-ink-800">
                      {f.label}
                    </span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <ArrowRight size={16} className="text-ink-400" />
                  )}
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs text-ink-500">
              Four live demonstrations ready on the next tabs — happy path,
              tamper attack, fake issuer, and revocation.
            </p>
          </div>

          {/* Signature card preview */}
          <div className="relative">
            <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-brand-300/40 blur-3xl" />
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-emerald-300/40 blur-3xl" />
            <div className="relative frosted-panel p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid place-items-center h-9 w-9 rounded-lg bg-white ring-1 ring-slate-200/80 shadow-sm overflow-hidden p-1">
                    <img src="/logo.png" alt="University Logo" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
                      Degree Credential
                    </p>
                    <p className="text-sm font-semibold text-ink-900">
                      B.Tech · CSE
                    </p>
                  </div>
                </div>
                <StatusPill tone="pass">Signed</StatusPill>
              </div>

              <div className="mt-4 space-y-2.5">
                <PreviewRow label="Subject" value="Arjun Rao" mono={false} />
                <PreviewRow label="CGPA" value="8.2" mono={false} />
                <PreviewRow
                  label="Issuer DID"
                  value="did:key:z6Mk…Presidency"
                  mono
                />
                <PreviewRow
                  label="Proof"
                  value="eddsa-jcs-2022 · z5Kd…9Q"
                  mono
                />
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-700">
                <Lock size={12} />
                Signature verified with Ed25519
              </div>
            </div>
          </div>
        </div>
      </FrostedPanel>

      {/* FEATURES GRID */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {FEATURES.map((f) => (
          <FrostedPanel key={f.title} className="p-5">
            <div className="grid place-items-center h-9 w-9 rounded-lg bg-white/80 ring-1 ring-white/80 shadow-frosted text-brand-600">
              <f.icon size={18} strokeWidth={2.2} />
            </div>
            <h3 className="mt-3 text-[15px] font-semibold text-ink-900">
              {f.title}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
              {f.text}
            </p>
          </FrostedPanel>
        ))}
      </div>

      {/* HOW VERIFICATION WORKS */}
      <FrostedPanel className="p-6 lg:p-7">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="section-label">Six Independent Checks</p>
            <h3 className="text-lg font-bold text-ink-900">
              Every credential must pass all six to be verified
            </h3>
          </div>
          <StatusPill tone="neutral">Sequential</StatusPill>
        </div>
        <ol className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[
            "Credential structure valid",
            "Issuer DID resolved",
            "Issuer trusted on ledger",
            "Ed25519 signature valid",
            "Within validity window",
            "Not revoked by issuer",
          ].map((label, i) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-xl bg-white/70 px-3.5 py-3 ring-1 ring-white/80"
            >
              <span className="grid place-items-center h-6 w-6 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold ring-1 ring-brand-100">
                {i + 1}
              </span>
              <span className="text-[13px] font-medium text-ink-800">
                {label}
              </span>
            </li>
          ))}
        </ol>
      </FrostedPanel>
    </div>
  );
}

function PreviewRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
        {label}
      </span>
      <span
        className={`text-[13px] font-medium text-ink-900 truncate ${
          mono ? "font-mono text-[12px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
