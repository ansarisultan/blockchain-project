# DegreeVerify

**Trust Every Credential. Verify Independently.**

A decentralized digital degree verification platform demonstrating Decentralized Identifiers (DIDs), W3C Verifiable Credentials, Ed25519 digital signatures, and a simulated hash-chained ledger — all running entirely in the browser, with no backend and no network dependency.

> **CA3 Project** — Foundations of Blockchain Technology

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Project Objectives](#2-project-objectives)
3. [Technology Stack](#3-technology-stack)
4. [Application Architecture](#4-application-architecture)
5. [DID Generation Workflow](#5-did-generation-workflow)
6. [DID Resolution](#6-did-resolution)
7. [Credential Issuance](#7-credential-issuance)
8. [Digital Signature Generation](#8-digital-signature-generation)
9. [Verification Process](#9-verification-process)
10. [Simulated Blockchain Ledger](#10-simulated-blockchain-ledger)
11. [Credential Revocation](#11-credential-revocation)
12. [Demonstration Scenarios](#12-demonstration-scenarios)
13. [REAL vs SIMULATED](#13-real-vs-simulated)
14. [Installation](#14-installation)
15. [Local Development](#15-local-development)
16. [Deployment](#16-deployment)
17. [Limitations](#17-limitations)
18. [Future Enhancements](#18-future-enhancements)

---

## 1. Problem Statement

Universities issue paper and PDF degrees that are trivially forged. Employers have no independent way to verify a candidate's degree without contacting the university directly — a slow, manual, and often impossible process. Centralized verification services exist, but they reintroduce a single point of failure and require the very trust they're supposed to establish.

**DegreeVerify** demonstrates that a digitally signed credential, issued directly by the university, can be independently verified by any employer — with no contact with the issuer, no central server, and no trusted third party.

---

## 2. Project Objectives

- Implement proper **`did:key`** identifiers from Ed25519 public keys
- Issue **W3C Verifiable Credentials 2.0**-shaped degrees with genuine **Ed25519** signatures
- Enable **independent verification** through six sequential checks
- Demonstrate that **cryptographic validity ≠ trust** via a working fake-issuer attack
- Demonstrate **tamper detection** via real signature verification (not simulated)
- Demonstrate **credential revocation** through a hash-chained simulated ledger
- Prove the entire pipeline is trustworthy end-to-end via an animated verification UI
- Run entirely offline after first load — no CDN, no backend, no external API

---

## 3. Technology Stack

| Layer | Choice |
|---|---|
| **Frontend** | React 18, Vite 5, JavaScript ES2020+ |
| **Styling** | Tailwind CSS 3, custom frosted-panel design system |
| **Icons** | Lucide React |
| **State** | React Context API + `useReducer` |
| **Cryptography** | `@noble/curves` (Ed25519), `@noble/hashes` (SHA-256, SHA-512), `@scure/base` (base58btc), `canonicalize` (RFC 8785 JCS) |
| **Randomness** | `crypto.getRandomValues` (never `Math.random()`) |
| **Font** | Inter (bundled locally via `@fontsource/inter`) |
| **Deployment** | Netlify / Vercel (static) |

**No runtime CDN imports. No external API calls. No backend. No database.**

---

## 4. Application Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      BROWSER (single-page)                 │
│                                                            │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │   ISSUER     │──▶│   HOLDER     │──▶│   VERIFIER   │    │
│  │  University  │   │   Student    │   │   Employer   │    │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘    │
│         │                  │                  │            │
│         │        ┌─────────┴─────────┐        │            │
│         └───────▶│  AppContext State  │◀──────┘            │
│                  │  (useReducer)      │                   │
│                  └─────────┬─────────┘                     │
│                            │                               │
│         ┌──────────────────┼──────────────────┐            │
│         ▼                  ▼                  ▼            │
│   ┌──────────┐      ┌──────────────┐   ┌──────────────┐    │
│   │  crypto/ │      │ credentials/ │   │ blockchain/  │    │
│   │ Ed25519  │      │ issue/verify │   │ hash-chained │    │
│   │ did:key  │      │ six checks   │   │ ledger       │    │
│   └──────────┘      └──────────────┘   └──────────────┘    │
└────────────────────────────────────────────────────────────┘
```

**Data flow**

1. `crypto/` — key generation, DID encoding/resolution, signing, verification
2. `blockchain/` — hash-chained ledger of DID anchors and revocations
3. `credentials/` — VC issuance (delegates to `crypto/`) and the six-check verifier (delegates to `crypto/` + `blockchain/`)
4. `context/` — single reducer holds all shared state (identities, wallet, ledger, verifier)
5. `components/` — role-based UI (Issuer, Holder, Verifier, Ledger), each reading from context

**Single source of truth:** the reducer. No module-level mutable state. `RESET_DEMO` clears everything atomically.

---

## 5. DID Generation Workflow

Every actor in the system (University, Student, Fake University) gets an independent Ed25519 keypair and a `did:key` identifier.

**Algorithm:**

1. Generate 32-byte seed via `crypto.getRandomValues` → Ed25519 private key (`@noble/curves`)
2. Derive 32-byte Ed25519 public key
3. Prefix the public key with the multicodec bytes `[0xed, 0x01]` (ed25519-pub)
4. Encode the 34-byte result using **base58btc** (`@scure/base`)
5. Prefix the base58 string with `z` (multibase base58btc)
6. Construct the DID: `did:key:z<encoded>`

Every Ed25519 `did:key` therefore starts with **`did:key:z6Mk`**. This is a *consequence* of the encoding math, not a hardcoded string.

**Implementation:** `src/crypto/keyManager.js`, `src/crypto/did.js`.

**Private keys are never displayed, never included in credentials, and never logged.** They live in the reducer state in memory only and are garbage-collected on reset.

---

## 6. DID Resolution

Resolution for `did:key` is self-contained — the public key is embedded in the DID itself.

1. Validate `did:key:` prefix
2. Strip the `z` multibase prefix
3. Base58btc-decode
4. Verify the multicodec prefix is `[0xed, 0x01]` (ed25519-pub)
5. Extract the 32-byte public key

If any step fails, resolution throws and verification fails cleanly.

The **DID Document** is constructed per the W3C DID Core shape:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:key:z6Mk…",
  "verificationMethod": [{
    "id": "did:key:z6Mk…#z6Mk…",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:key:z6Mk…",
    "publicKeyMultibase": "z6Mk…"
  }],
  "authentication": ["did:key:z6Mk…#z6Mk…"],
  "assertionMethod": ["did:key:z6Mk…#z6Mk…"]
}
```

Both Issuer and Holder tabs render the DID Document via an expandable viewer.

---

## 7. Credential Issuance

Credentials follow the **W3C Verifiable Credentials Data Model 2.0** shape:

```json
{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "id": "urn:uuid:<random-v4>",
  "type": ["VerifiableCredential", "UniversityDegreeCredential"],
  "issuer": { "id": "<university DID>", "name": "Presidency University" },
  "validFrom": "<ISO timestamp>",
  "validUntil": "<ISO timestamp, +5 years>",
  "credentialSubject": {
    "id": "<student DID>",
    "name": "Arjun Rao",
    "degree": "B.Tech",
    "branch": "CSE",
    "cgpa": "8.2",
    "graduationYear": "2028"
  },
  "proof": { … }
}
```

**Preconditions before issuance:**

- University must have generated a DID
- University must be **registered** on the simulated ledger
- Student must have generated a DID

The issuance form is gated accordingly — the Issue button is disabled until all three are true.

---

## 8. Digital Signature Generation

A simplified, clearly documented adaptation of the **eddsa-jcs-2022** Data Integrity cryptosuite. Not a claim of full W3C Data Integrity conformance — but the crypto is genuine.

**Signing pipeline:**

1. Build the unsigned credential (no `proof`)
2. `canonicalize` it with **RFC 8785 JCS** — deterministic key ordering, no whitespace
3. Prefix with a domain-separation tag `urn:degreeverify:vc-signature:v1:`
4. Compute **SHA-256** of the tagged canonical UTF-8 string
5. Sign the 32-byte digest with the issuer's Ed25519 private key (`@noble/curves`)
6. Base58btc-encode the 64-byte signature
7. Prefix with `z`, attach as `proof.proofValue`

**Proof object:**

```json
{
  "type": "DataIntegrityProof",
  "cryptosuite": "eddsa-jcs-2022",
  "created": "<ISO timestamp>",
  "verificationMethod": "<issuer DID>#<multibase-fragment>",
  "proofPurpose": "assertionMethod",
  "proofValue": "z<base58-signature>"
}
```

**Determinism:** `prepareSigningPayload()` is the **single source of truth** for both signing and verification. Any drift between the two would break the round-trip — this is why it lives in one place.

**Domain separation** ensures signed digests cannot be confused with any other use of the same key, even if the same JSON is signed elsewhere.

---

## 9. Verification Process

The employer runs **six independent checks in strict order**. Verification does not contact the university.

| # | Check | What it proves | Implementation |
|---|---|---|---|
| 1 | **Credential Structure** | Required fields exist, dates parse | `validateCredentialStructure` |
| 2 | **Issuer DID Resolution** | DID format valid, key extractable, `verificationMethod` belongs to issuer | `validateDID` + `resolveDID` |
| 3 | **Trusted Issuer** | DID is anchored on ledger with `role: TRUSTED_ISSUER` | `isTrustedIssuer` |
| 4 | **Signature** | Ed25519 signature matches canonical payload | `verifyCredentialSignature` |
| 5 | **Validity Window** | `now` is within `[validFrom, validUntil]` | `isWithinValidity` |
| 6 | **Revocation** | No `REVOKE` block exists for this credential | `isCredentialRevoked` |

**Stop-on-first-failure:** by default, subsequent checks are marked `SKIPPED`. This makes the demo more legible than five red rows.

**Animated reveal:** the UI advances through the six checks at 300 ms/check. The animation is purely presentational — the real result is computed once, atomically, when the animation completes. `VERIFIED` is only shown if all six actually pass.

**Any modification to any signed field invalidates check 4.** Reordering JSON keys (without changing values) still passes, because JCS canonicalization is order-independent.

---

## 10. Simulated Blockchain Ledger

An in-memory, hash-chained registry acting as the **Verifiable Data Registry**. **Not** a real blockchain — no consensus, no networking, no persistence across reloads.

**Block shape:**

```json
{
  "index": 0,
  "timestamp": "2025-…",
  "type": "GENESIS | DID_ANCHOR | REVOKE",
  "data": { … },
  "prevHash": "0000000000000000",
  "hash": "<SHA-256 hex of canonicalized block>"
}
```

**Event types:**

- **GENESIS** — created automatically on app init
- **DID_ANCHOR** — appended when a university registers as a trusted issuer
- **REVOKE** — appended when a credential is revoked

**Hash computation:** canonicalize the block *without* its `hash` field → UTF-8 encode → SHA-256 → hex. Deterministic and reproducible.

**Chain integrity** is verified on demand (Ledger tab button): every block's hash is recomputed and every `prevHash` is checked against the actual previous block's hash.

**Business rules enforced:**

- Only `role: TRUSTED_ISSUER` anchors are trusted
- Fake University is never anchored
- No duplicate anchors for the same DID
- Only the original issuer may revoke their credential
- No duplicate revocations
- Fake University cannot revoke real credentials

---

## 11. Credential Revocation

When the University revokes an issued credential:

1. The original signed VC is **left unchanged** in the wallet (revocation is a ledger event, not a credential edit)
2. A `REVOKE` block is appended with `{ credentialId, revokedBy }`
3. `revokedBy` is validated against `issuer.id` (belt-and-braces; the ledger also enforces it)
4. Duplicate revocations are rejected
5. The credential card visually updates with a "Revoked" chip
6. Any future verification fails at **check 6** with "Credential revoked by issuer"

This mirrors real-world VC revocation (e.g. StatusList2021 in production W3C) in a classroom-simple form.

---

## 12. Demonstration Scenarios

All four scenarios are reproducible via **Reset Demo** in the navbar.

### Scenario A — Happy path (VERIFIED)

1. **University tab:** Generate University DID → Register on Ledger
2. **Wallet tab:** Generate Student DID
3. **University tab:** Issue Credential (form pre-filled with default data)
4. **Wallet tab:** Share with Employer
5. **Employer tab:** Verify Credential

**Expected:** all six checks pass → **VERIFIED**

### Scenario B — Tamper attack (REJECTED at check 4)

1. Complete Scenario A up to "Share with Employer"
2. In the Employer textarea, change `"cgpa": "8.2"` to `"cgpa": "9.8"`
3. Click **Verify Credential**

**Expected:** Checks 1–3 pass. **Check 4 (Signature) fails** with "Signature invalid — credential has been tampered with". Final result: **REJECTED**.

This is genuine Ed25519 verification — no hardcoded failure.

### Scenario C — Fake University (REJECTED at check 3)

1. Complete Scenario A setup (university + student exist)
2. In the Employer tab, click **Generate Fake Credential** (Fraud Simulation card)
3. Click **Send to Verifier**
4. Click **Verify Credential**

**Expected:** Checks 1–2 pass (the DID is well-formed, the signature is genuinely valid). **Check 3 (Trusted Issuer) fails** with "Issuer not found on trusted registry". Final result: **REJECTED**.

**Teaching point:** A valid digital signature is necessary but not sufficient. Trust requires a registry the verifier independently consults.

### Scenario D — Revocation (REJECTED at check 6)

1. Complete Scenario A (issue + share)
2. **University tab:** Click **Revoke** on the issued credential
3. **Wallet tab:** Share with Employer again
4. **Employer tab:** Verify Credential

**Expected:** Checks 1–5 pass. **Check 6 (Revocation) fails** with "Credential revoked by issuer". Final result: **REJECTED**.

---

## 13. REAL vs SIMULATED

This distinction is critical to the project's credibility.

### REAL — genuine cryptography

- **Ed25519 key generation** — via `@noble/curves`, seeded by `crypto.getRandomValues`
- **`did:key` generation** — multicodec `[0xed, 0x01]` + base58btc + multibase `z`
- **DID resolution** — full encode/decode round-trip returns byte-identical public key
- **SHA-256 hashing** — via `@noble/hashes`
- **Ed25519 digital signatures** — real signing, real verification
- **Signature verification** — real Ed25519 verify; tampered credentials genuinely fail
- **JSON canonicalization** — RFC 8785 JCS via `canonicalize`; key order independence is a real cryptographic property
- **Hash-chained ledger calculations** — each block's hash is genuinely SHA-256 of its canonicalized content; every `prevHash` is genuinely checked

### SIMULATED — classroom-scope substitution

- **Blockchain network** — there is no network; the "ledger" is an in-memory JavaScript array
- **Distributed consensus** — none; the browser is the only node
- **On-chain persistence** — none; refreshing the page wipes the ledger
- **Decentralized registry infrastructure** — the DID registry is a local array, not a globally-accessible VDR
- **DID method resolution for non-`did:key` methods** — not implemented; only `did:key` is supported
- **W3C Data Integrity conformance** — simplified signing pipeline; not byte-compatible with the official `eddsa-jcs-2022` cryptosuite
- **Verifiable Presentations / holder proof** — not implemented (planned as an optional extension)

**The cryptography is real. The consensus is not.** This is the honest framing the project claims.

---

## 14. Installation

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone <your-repo-url>
cd degreeverify
npm install
```

All dependencies are bundled locally. No CDN, no network calls at runtime.

---

## 15. Local Development

```bash
npm run dev
```

Open http://localhost:5173.

**Production build:**

```bash
npm run build
npm run preview
```

`dist/` is a static bundle — deploy anywhere.

---

## 16. Deployment

### Netlify (recommended)

**Option 1 — Drag-and-drop:**

1. `npm run build`
2. Drag `dist/` onto https://app.netlify.com/drop

**Option 2 — Git-based:**

1. Push the repo to GitHub
2. Netlify → New site from Git → connect repo
3. Build command: `npm run build`
4. Publish directory: `dist`

### Vercel

**Option 1 — CLI:**

```bash
npm i -g vercel
vercel --prod
```

**Option 2 — Dashboard:**

1. Push the repo to GitHub
2. Vercel → Import Project → select repo
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`

**No environment variables. No backend configuration. No API keys.**

---

## 17. Limitations

- **In-memory ledger only** — refreshing wipes all anchors and revocations. Not persistent.
- **Single-browser** — issuer, holder, and verifier share one browser tab. Real deployments would separate these.
- **No DID registry persistence** — no way to look up a DID across sessions.
- **`did:key` only** — no `did:web`, `did:ethr`, etc.
- **No holder proof / Verifiable Presentations** — the student's DID is not cryptographically bound to the presentation (a stolen signed VC could be presented by anyone).
- **Simplified signature scheme** — domain-tagged JCS + SHA-256 + Ed25519. Genuine cryptography, but not fully W3C Data Integrity `eddsa-jcs-2022` conformant.
- **No status list optimization** — revocation is a linear ledger scan. Fine for demos, not for scale.
- **No key rotation** — regenerating a DID invalidates all prior anchors and issued credentials.
- **No accessibility audit beyond keyboard basics** — modal has focus management; broader a11y (screen reader, contrast ratios at all viewport sizes) not audited.

---

## 18. Future Enhancements

- **Persistent VDR** — back the ledger with a public, append-only store (IPFS, Ceramic, or a real public chain)
- **Verifiable Presentations** — holder proof so the presenter must control `credentialSubject.id`
- **StatusList2021** — compressed revocation lists
- **Cross-device DID exchange** — QR-code handoff of DIDs and VCs
- **`did:web` support** — universities resolve over HTTPS
- **Multi-issuer wallets** — a student holds credentials from multiple universities
- **Selective disclosure** — SD-JWT or BBS+ so the holder can reveal only what's needed (e.g. degree + year, not CGPA)
- **Issuer revocation of the DID itself** — a compromised university key invalidates everything it ever signed
- **Audit log export** — verifier saves a signed timestamp of each verification run

---

## License

MIT — educational demonstration project.

---

## Author

Built as a CA3 project for **Foundations of Blockchain Technology**.

> **Teaching point (repeat):** A valid digital signature does not establish trust. Trust requires an independent registry. DegreeVerify demonstrates both the power and the limits of cryptography in digital identity.
