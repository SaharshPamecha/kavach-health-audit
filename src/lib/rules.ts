import type { FlagKind } from "./types";

/**
 * Rule registry.
 *
 * Every flag raised by the engine must resolve to one of these. Nothing in
 * this product is allowed to assert a rule that isn't written down here with
 * a citation a billing officer can look up. That is the whole point: a flag
 * is only credible if it points at a clause.
 */

export type RuleRef = {
  id: string;
  short: string;
  /** What the rule says, in one plain sentence. */
  gist: string;
  /** Full citation as it should appear in a dispute letter. */
  citation: string;
  source: "IRDAI" | "Policy" | "Arithmetic";
  url?: string;
};

export const RULES: Record<string, RuleRef> = {
  "PROP-01": {
    id: "PROP-01",
    short: "Room-rent proportionate deduction",
    gist: "When you occupy a room priced above your eligible category, the insurer may reduce the claim by the ratio of eligible rent to actual rent — but only on charges that scale with the room.",
    citation:
      "IRDAI Master Circular on Health Insurance Products, Ref. IRDAI/HLT/CIR/MISC/64/05/2024 dated 29 May 2024, para on proportionate deductions; read with IRDAI (Health Insurance) Regulations, 2016, Reg. 2(1)(r).",
    source: "IRDAI",
    url: "https://irdai.gov.in/",
  },
  "PROP-02": {
    id: "PROP-02",
    short: "Fixed-cost lines are outside the ratio",
    gist: "Pharmacy, implants, prosthesis and consumables are priced per unit of product, not by the class of room. The ratio cannot lawfully be applied to them.",
    citation:
      "Proportionate deduction is confined to 'associated medical expenses' that vary with room category. Fixed-cost items — drugs, implants, prosthesis, consumables — carry identical invoice prices across room classes, so no ratio applies. See IRDAI/HLT/CIR/MISC/64/05/2024 (29 May 2024) and the exclusion-standardisation circular IRDAI/HLT/REG/CIR/198/08/2019 (27 Aug 2019).",
    source: "IRDAI",
    url: "https://irdai.gov.in/",
  },
  "NP-01": {
    id: "NP-01",
    short: "List-I non-payables cannot be billed to the patient",
    gist: "Items such as admission/registration fees, gloves, syringes, needles and IV sets are administrative or consumable costs of running a hospital. They may not be charged separately to the insured.",
    citation:
      "IRDAI Circular IRDAI/HLT/REG/CIR/198/08/2019 dated 27 August 2019 — Standardisation of Exclusions in Health Insurance Contracts, Annexure List-I (items not to be charged to the insured).",
    source: "IRDAI",
    url: "https://irdai.gov.in/",
  },
  "IMP-01": {
    id: "IMP-01",
    short: "An implant is prosthesis, not a consumable",
    gist: "A lens, stapler, stent or orthopaedic implant is implanted in the body and remains there. It is prosthesis. Disallowing it as a 'consumable' is a category error unless the policy expressly excludes it.",
    citation:
      "IRDAI/HLT/REG/CIR/198/08/2019 (27 Aug 2019), Annexure List-II distinguishes prosthesis from disposable consumables. Where a policy excludes only the differential cost of a premium implant, the base implant remains payable.",
    source: "IRDAI",
    url: "https://irdai.gov.in/",
  },
  "CLM-01": {
    id: "CLM-01",
    short: "A deduction must cite a clause that exists",
    gist: "A TPA may only disallow against a clause actually printed in your policy schedule or wording. A deduction that cites nothing — or cites a clause you do not have — is not an adjudication, it is a refusal.",
    citation:
      "IRDAI (Protection of Policyholders' Interests) Regulations, 2017 — Reg. 9 (claim settlement) requires reasons in writing for any rejection or deduction; read with the policy's own 'Exclusions' schedule.",
    source: "IRDAI",
    url: "https://irdai.gov.in/",
  },
  "ICU-01": {
    id: "ICU-01",
    short: "ICU-stay exception for pressure-relief beds",
    gist: "An alternating-pressure (air) mattress is a nursing aid, admissible once an ICU stay crosses three days — the schedule's own exception. Allowing only the fourth day contradicts the schedule.",
    citation:
      "Policy Schedule, Clause 4.2 (ICU nursing aids) read with the TPA's own non-payables schedule; see also IRDAI/HLT/REG/CIR/198/08/2019 Annexure.",
    source: "Policy",
  },
  "GRV-01": {
    id: "GRV-01",
    short: "Grievance must be closed in 14 days",
    gist: "Once you write to the insurer's Grievance Redressal Officer, they must resolve it within 14 days. Silence is itself a regulatory breach.",
    citation:
      "IRDAI (Protection of Policyholders' Interests) Regulations, 2017, Reg. 17 — Grievance Redressal; turnaround time of 14 days.",
    source: "IRDAI",
    url: "https://irdai.gov.in/",
  },
  "OMB-01": {
    id: "OMB-01",
    short: "Free escalation to the Insurance Ombudsman",
    gist: "If the insurer does not resolve it, you can go to the Insurance Ombudsman at no cost — no lawyer, no court fee.",
    citation:
      "IRDAI (Insurance Ombudsman) Rules, 2017; complaints may also be filed on the IRDAI Bima Bharosa portal.",
    source: "IRDAI",
    url: "https://bimabharosa.irdai.gov.in/",
  },
  "ARITH-01": {
    id: "ARITH-01",
    short: "Quantity × rate must equal the amount charged",
    gist: "If the printed amount does not equal quantity multiplied by rate, the bill is internally inconsistent and the difference is refundable.",
    citation: "Arithmetic on the face of the bill.",
    source: "Arithmetic",
  },
};

/** Human label + tone for each flag kind. */
export const FLAG_META: Record<
  FlagKind,
  { label: string; tone: "illegal" | "hospital" | "policy" }
> = {
  illegal_proportionate: { label: "Illegal proportionate cut", tone: "illegal" },
  phantom_clause: { label: "Phantom clause", tone: "illegal" },
  icu_exception: { label: "Exception ignored", tone: "illegal" },
  whole_implant: { label: "Whole implant disallowed", tone: "illegal" },
  list_i_billed: { label: "List-I charged to patient", tone: "hospital" },
  arithmetic: { label: "Arithmetic mismatch", tone: "hospital" },
  duplicate: { label: "Duplicate charge", tone: "hospital" },
};
