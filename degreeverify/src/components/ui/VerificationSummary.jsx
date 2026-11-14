import { ShieldCheck, ShieldAlert, CircleSlash2 } from "lucide-react";

/**
 * @param {object} props
 * @param {object|null} props.result   — the result object from verifyCredential
 * @param {"IDLE"|"RUNNING"|"VERIFIED"|"REJECTED"} props.status
 * @param {string|null} props.parseError
 */
export default function VerificationSummary({ result, status, parseError }) {
  if (parseError) {
    return (
      <div className="rounded-2xl bg-red-50 ring-1 ring-red-200 px-5 py-4 flex items-start gap-3">
        <div className="grid place-items-center h-10 w-10 rounded-xl bg-white text-red-600 ring-1 ring-red-100 shrink-0">
          <CircleSlash2 size={20} strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-red-700">
            Rejected
          </p>
          <p className="text-[15px] font-semibold text-red-900 mt-0.5">
            Credential could not be parsed
          </p>
          <p className="text-[12px] text-red-700 mt-1 break-all">
            {parseError}
          </p>
        </div>
      </div>
    );
  }

  if (status !== "VERIFIED" && status !== "REJECTED") return null;
  if (!result) return null;

  const isVerified = status === "VERIFIED";
  const failedCheck = result.checks?.find((c) => c.status === "FAIL");

  const wrap = isVerified
    ? "bg-emerald-50 ring-emerald-200"
    : "bg-red-50 ring-red-200";
  const iconWrap = isVerified
    ? "bg-white text-emerald-600 ring-emerald-100"
    : "bg-white text-red-600 ring-red-100";
  const labelTone = isVerified ? "text-emerald-700" : "text-red-700";
  const headlineTone = isVerified ? "text-emerald-900" : "text-red-900";
  const detailTone = isVerified ? "text-emerald-700" : "text-red-700";
  const Icon = isVerified ? ShieldCheck : ShieldAlert;

  return (
    <div className={`rounded-2xl ring-1 px-5 py-4 flex items-start gap-3 ${wrap}`}>
      <div
        className={`grid place-items-center h-10 w-10 rounded-xl ring-1 shrink-0 ${iconWrap}`}
      >
        <Icon size={20} strokeWidth={2.4} />
      </div>
      <div className="min-w-0">
        <p
          className={`text-[11px] uppercase tracking-[0.1em] font-bold ${labelTone}`}
        >
          {isVerified ? "Verified" : "Rejected"}
        </p>
        <p className={`text-[15px] font-semibold mt-0.5 ${headlineTone}`}>
          {isVerified
            ? "All six checks passed"
            : failedCheck
            ? `Failed at check ${result.checks.indexOf(failedCheck) + 1} — ${failedCheck.name}`
            : "Verification failed"}
        </p>
        <p className={`text-[12px] mt-1 ${detailTone}`}>
          {isVerified
            ? "Signature valid · Issuer trusted · Not expired · Not revoked"
            : failedCheck?.message || "See the failed check above for details."}
        </p>
      </div>
    </div>
  );
}
