import { uuidv4 } from "../utils/uuid.js";
import { nowISO, yearsFromNowISO } from "../utils/dateUtils.js";
import { signCredential, attachProof } from "../crypto/signing.js";

export const DEFAULT_VALIDITY_YEARS = 5;

/**
 * Build the *unsigned* credential object in W3C VC 2.0 shape.
 *
 * @param {object} args
 * @param {{ did: string, name: string }} args.issuer
 * @param {{ did: string, name: string, degree: string, branch: string, cgpa: string, graduationYear: string }} args.subject
 * @param {number} [args.validityYears]  — default 5 years from now
 * @returns {object} unsigned credential
 */
export function createCredential({ issuer, subject, validityYears = DEFAULT_VALIDITY_YEARS }) {
  if (!issuer?.did || !issuer?.name) {
    throw new Error("createCredential: issuer.did and issuer.name are required");
  }
  if (!subject?.did) {
    throw new Error("createCredential: subject.did is required (student must generate DID first)");
  }
  if (!subject?.name) {
    throw new Error("createCredential: subject.name is required");
  }

  return {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: `urn:uuid:${uuidv4()}`,
    type: ["VerifiableCredential", "UniversityDegreeCredential"],
    issuer: {
      id: issuer.did,
      name: issuer.name,
    },
    validFrom: nowISO(),
    validUntil: yearsFromNowISO(validityYears),
    credentialSubject: {
      id: subject.did,
      name: subject.name,
      degree: subject.degree ?? "",
      branch: subject.branch ?? "",
      cgpa: String(subject.cgpa ?? ""),
      graduationYear: String(subject.graduationYear ?? ""),
    },
  };
}

/**
 * Full issuance pipeline:
 *   1. Create unsigned VC
 *   2. Sign with issuer's Ed25519 private key (Stage 2 signing module)
 *   3. Attach proof → signed credential
 *
 * @returns {object} signed credential
 */
export function issueCredential({ issuer, subject, validityYears }) {
  if (!issuer?.privateKey) {
    throw new Error("issueCredential: issuer.privateKey is required to sign");
  }
  const unsigned = createCredential({ issuer, subject, validityYears });
  const proof = signCredential(unsigned, {
    did: issuer.did,
    privateKey: issuer.privateKey,
  });
  return attachProof(unsigned, proof);
}
