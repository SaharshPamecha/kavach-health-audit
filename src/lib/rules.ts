import type { FlagKind } from "./types";

/**
 * Rule registry.
 *
 * Every flag raised by the engine must resolve to one of these. Nothing in
 * this product is allowed to assert a rule that isn't written down here with
 * a citation a billing officer can look up. That is the whole point: a flag
 * is only credible if it points at a clause.
 *
 * ── Sourcing note ─────────────────────────────────────────────────────
 * IRDAI's proportionate-deduction norms (circular 151/06/2020) were
 * superseded as a standalone instrument by the Master Circular of
 * 29.05.2024 (Annexure-6, entry 19). They remain the contractual standard
 * that policy wordings still reproduce, and the NCDRC's reasoning in
 * A.K. Kariappa stands independently of any circular. The engine therefore
 * rests on three separate legs — contract wording, the 2019 itemisation
 * lists (still operative), and consumer-forum precedent — so no single
 * repeal collapses the argument. Each citation states which leg it is on.
 */

export type RuleRef = {
  id: string;
  short: string;
  /** What the rule says, in one plain sentence. */
  gist: string;
  /** Full citation as it should appear in a dispute letter. */
  citation: string;
  source: "IRDAI" | "Policy" | "Arithmetic" | "Precedent";
  /** Which leg the argument stands on. */
  leg: "contract" | "regulation" | "precedent";
  url?: string;
};

export const RULES: Record<string, RuleRef> = {
  "PROP-01": {
    id: "PROP-01",
    short: "Room-rent proportionate deduction",
    gist: "Where you occupy a room priced above your eligible category, the claim may be reduced — but only across a closed list of charges that actually scale with the room.",
    citation:
      "IRDAI circular IRDAI/HLT/REG/CIR/151/06/2020 dated 11.06.2020, 'Norms on Proportionate Deductions', paras 3–5 — the standard reproduced in policy wordings. Superseded as a standalone circular by the Master Circular of 29.05.2024 (Annexure-6, entry 19), so it binds here through the contract rather than the regulator.",
    source: "IRDAI",
    leg: "contract",
    url: "https://irdai.gov.in/document-detail?documentId=394680",
  },
  "PROP-02": {
    id: "PROP-02",
    short: "Fixed-cost lines are outside the ratio",
    gist: "Pharmacy, consumables, implants and diagnostics are expressly barred from the proportionate-deduction base. They must be paid in full.",
    citation:
      "IRDAI/HLT/REG/CIR/151/06/2020 dated 11.06.2020, para 4: \"The following expenses are not allowed to be part of the definition of 'associate medical expenses' — (a) Cost of pharmacy and consumables; (b) Cost of implants and medical devices; (c) Cost of diagnostics.\" Para 5: insurers \"shall not recover any expenses towards proportionate deductions other than the defined 'associate medical expenses'\".",
    source: "IRDAI",
    leg: "contract",
    url: "https://irdai.gov.in/document-detail?documentId=394680",
  },
  "PROP-03": {
    id: "PROP-03",
    short: "A flat ratio is the wrong method",
    gist: "The National Commission has held that applying the room-rent ratio across a bill is a faulty method. The insurer must establish what the same services would have cost in the entitled room category.",
    citation:
      "New India Assurance Co. Ltd. v. A.K. Kariappa, National Consumer Disputes Redressal Commission, Revision Petition No. 766/2011, para 8: the insurer, \"instead of finding out from the hospital as what would have been the charges ... made a proportionate deduction ... on an assumption that the charges would be proportionate to the room rent. The procedure adopted by the insurance company was faulty.\"",
    source: "Precedent",
    leg: "precedent",
    url: "https://indiankanoon.org/doc/135438575/",
  },
  "NP-01": {
    id: "NP-01",
    short: "Itemisation lists — what may not be billed separately",
    gist: "IRDAI's four itemisation lists classify hospital charges: List-I items are optional and payable only through an optional cover; Lists II, III and IV are already inside room, procedure and treatment charges and may not be billed on top.",
    citation:
      "IRDAI/HLT/REG/CIR/176/09/2019 dated 27.09.2019, 'Modification Guidelines on Standardization in Health Insurance', Annexure-I Lists I–IV. Clause 2 requires insurers to ensure such items \"shall not be billed to the policyholders by the hospitals\", and to make this part of network-hospital service level agreements.",
    source: "IRDAI",
    leg: "regulation",
    url: "https://irdai.gov.in/document-detail?documentId=392476",
  },
  "IMP-01": {
    id: "IMP-01",
    short: "An implant is prosthesis, not a consumable",
    gist: "A lens, stapler, stent or orthopaedic implant is a device implanted in the body. Implants sit outside the proportionate base and in none of the lists subsumed into room or procedure charges — so a disallowance has to point at a sub-limit in your policy schedule.",
    citation:
      "IRDAI/HLT/REG/CIR/151/06/2020, para 4(b) — \"Cost of implants and medical devices\" is excluded from 'associate medical expenses'; and implants appear in none of Lists II–IV of IRDAI/HLT/REG/CIR/176/09/2019. Any implant sub-limit or co-pay must be traced to the policy wording itself.",
    source: "IRDAI",
    leg: "contract",
    url: "https://irdai.gov.in/document-detail?documentId=394680",
  },
  "CLM-01": {
    id: "CLM-01",
    short: "A deduction must cite a clause that exists",
    gist: "A TPA may only disallow against a clause actually printed in your policy schedule or wording. A deduction that cites nothing — or cites a clause you do not have — is not an adjudication, it is a refusal.",
    citation:
      "IRDAI (Protection of Policyholders' Interests) Regulations, 2017, Reg. 9 — claim settlement requires reasons in writing for any rejection or deduction; read with the policy's own 'Exclusions' schedule.",
    source: "IRDAI",
    leg: "regulation",
    url: "https://irdai.gov.in/",
  },
  "ICU-01": {
    id: "ICU-01",
    short: "ICU-stay exception for pressure-relief beds",
    gist: "An alternating-pressure mattress is an optional item under List-I. Where the policy schedule grants it — here, once an ICU stay crosses three days — allowing only the final day contradicts the schedule.",
    citation:
      "Policy Schedule, Clause 4.2 (ICU nursing aids), read with IRDAI/HLT/REG/CIR/176/09/2019 Annexure-I List-I, which classifies \"Nimbus bed or water or air bed charges\" as an optional item, admissible where the schedule grants it.",
    source: "Policy",
    leg: "contract",
  },
  "GRV-01": {
    id: "GRV-01",
    short: "Grievance must be closed in 14 days",
    gist: "Once you write to the insurer's Grievance Redressal Officer, they must resolve it within 14 days. Silence is itself a regulatory breach.",
    citation:
      "IRDAI (Protection of Policyholders' Interests) Regulations, 2017, Reg. 17 — Grievance Redressal; turnaround time of 14 days.",
    source: "IRDAI",
    leg: "regulation",
    url: "https://irdai.gov.in/",
  },
  "OMB-01": {
    id: "OMB-01",
    short: "Free escalation to the Insurance Ombudsman",
    gist: "If the insurer does not resolve it, you can go to the Insurance Ombudsman at no cost — no lawyer, no court fee.",
    citation:
      "IRDAI (Insurance Ombudsman) Rules, 2017; complaints may also be filed on the IRDAI Bima Bharosa portal.",
    source: "IRDAI",
    leg: "regulation",
    url: "https://bimabharosa.irdai.gov.in/",
  },
  "ARITH-01": {
    id: "ARITH-01",
    short: "Quantity × rate must equal the amount charged",
    gist: "If the printed amount does not equal quantity multiplied by rate, the bill is internally inconsistent and the difference is refundable.",
    citation: "Arithmetic on the face of the bill.",
    source: "Arithmetic",
    leg: "contract",
  },
};

/** Human label + tone for each flag kind. */
export const FLAG_META: Record<
  FlagKind,
  { label: string; tone: "illegal" | "hospital" | "policy" }
> = {
  illegal_proportionate: { label: "Deduction outside the rules", tone: "illegal" },
  phantom_clause: { label: "Phantom clause", tone: "illegal" },
  icu_exception: { label: "Exception ignored", tone: "illegal" },
  whole_implant: { label: "Whole implant disallowed", tone: "illegal" },
  list_i_billed: { label: "Non-payable item billed", tone: "hospital" },
  arithmetic: { label: "Arithmetic mismatch", tone: "hospital" },
  duplicate: { label: "Duplicate charge", tone: "hospital" },
};