/**
 * Domain model for a hospital bill that is being audited.
 *
 * The shape deliberately mirrors how an Indian hospital bill is actually
 * laid out at the discharge counter: a header (patient / hospital /
 * admission window / sum insured) and an itemised ledger of charges.
 */

export type Category =
  | "room"
  | "surgeon"
  | "ot"
  | "nursing"
  | "pharmacy"
  | "implant"
  | "consumable"
  | "diagnostic"
  | "misc";

/**
 * Categories whose cost scales with the room category a patient occupies.
 * Only these may lawfully be reduced by the room-rent proportionate ratio.
 * Everything else is a fixed-cost line: its price does not change because
 * you were in a deluxe room instead of a twin-sharing one.
 */
export const PROPORTIONATE_CATEGORIES: Category[] = ["room", "surgeon", "ot"];

export const CATEGORY_LABEL: Record<Category, string> = {
  room: "Room rent",
  surgeon: "Surgeon",
  ot: "OT charges",
  nursing: "Nursing",
  pharmacy: "Pharmacy",
  implant: "Implant",
  consumable: "Consumable",
  diagnostic: "Diagnostics",
  misc: "Other",
};

export type LineItem = {
  id: string;
  category: Category;
  label: string;
  detail?: string;
  qty: number;
  rate: number;
  /** Amount actually printed on the bill for this line. */
  amount: number;
  /**
   * IRDAI 2019 Standardisation of Exclusions — Annexure List-I.
   * These are items a hospital may not bill separately to a patient.
   */
  listI?: boolean;
  /** What the TPA actually approved for this line. */
  tpaAllowed: number;
  /**
   * Ground-truth finding for a curated demo case. Scanned bills leave this
   * undefined and the engine classifies the shortfall heuristically.
   */
  expectation?: FlagKind;
  /** Optional provenance for scanned bills. */
  confidence?: number;
};

export type Policy = {
  insurer: string;
  tpa: string;
  productName: string;
  policyNo: string;
  claimNo: string;
  sumInsured: number;
  /** Room rent cap per day, in rupees. */
  roomCapPerDay: number;
  icuCapPerDay: number;
  coPayPct: number;
  /** Does the policy schedule carry an explicit premium-IOL / implant exclusion? */
  excludesPremiumImplant: boolean;
};

export type DemoCase = {
  id: string;
  slug: string;
  city: string;
  hospital: string;
  procedure: string;
  patientName: string;
  patientAge: number;
  admission: string;
  discharge: string;
  roomCategory: string;
  roomRentPerDay: number;
  icuDays: number;
  days: number;
  /** Which cap the room slider governs for this case. */
  capType: "room" | "icu" | "none";
  billedTotal: number;
  policy: Policy;
  items: LineItem[];
  /** The one-line story of what the TPA did wrong. */
  hook: string;
};

export type FlagKind =
  | "illegal_proportionate"
  | "phantom_clause"
  | "list_i_billed"
  | "icu_exception"
  | "whole_implant"
  | "arithmetic"
  | "duplicate";

export type Flag = {
  id: string;
  kind: FlagKind;
  itemId?: string;
  title: string;
  /** Rupees unlawfully withheld (TPA) or over-billed (hospital). */
  amount: number;
  /** Short rule handle, e.g. "PROP-02". */
  ruleId: string;
  /** Full official citation. */
  citation: string;
  /** Plain-English explanation for the patient. */
  plain: string;
  /** The exact sentence to say at the billing desk. */
  ask: string;
  against: "tpa" | "hospital";
};

export type AuditedLine = {
  item: LineItem;
  /** Rule-correct amount the insurer should admit. */
  idealAllowed: number;
  /** Amount the TPA actually admitted. */
  tpaAllowed: number;
  /** Lawful deduction from the bill. */
  legalCut: number;
  /** Unlawful deduction: what the TPA withheld beyond the rules. */
  illegalCut: number;
  /** Does the room-rent proportionate ratio touch this line? */
  proportioned: boolean;
  /** Insurer's share after co-pay. */
  insurerPays: number;
  patientPays: number;
};

export type Bucket = {
  key: "insurer" | "lawful" | "tpa" | "hospital";
  label: string;
  value: number;
  color: string;
};

export type Audit = {
  lines: AuditedLine[];
  billed: number;
  admissible: number;
  coPayAmount: number;
  insurerPays: number;
  patientPays: number;
  legalCut: number;
  illegalTotal: number;
  hospitalOvercharge: number;
  recoverable: number;
  ratio: number;
  flags: Flag[];
  buckets: Bucket[];
  /** Sum check: billed - (insurer + patient) should be zero. */
  balanced: boolean;
};
