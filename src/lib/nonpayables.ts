/**
 * Deterministic matcher for IRDAI List-I non-payables.
 *
 * This is a keyword layer, not a model: a line either matches a known
 * List-I head or it does not. That keeps a scanned bill's findings
 * reproducible — the same photograph always produces the same flags.
 */

export type ListIEntry = {
  match: RegExp;
  head: string;
};

export const LIST_I: ListIEntry[] = [
  { match: /\b(glove|gloves)\b/i, head: "Gloves" },
  { match: /\b(syringe|syringes)\b/i, head: "Syringes" },
  { match: /\b(needle|needles|canula|cannula|cannulae)\b/i, head: "Needles & cannulae" },
  { match: /\b(iv|i\.v\.)\s*(set|sets|tubing|line)\b/i, head: "IV sets & tubing" },
  { match: /\b(admission|registration|regd\.?)\s*(fee|fees|charge|charges)?\b/i, head: "Admission & registration fees" },
  { match: /\b(medical records?|case sheet|discharge summary)\s*(fee|fees|charge|charges)\b/i, head: "Medical records fee" },
  { match: /\b(admin|administrative|documentation|paper)\s*(fee|fees|charge|charges)\b/i, head: "Administrative charges" },
  { match: /\b(cot|bed)\s*(sheet|linen|cover)s?\b/i, head: "Linen" },
  { match: /\b(urine|uro)\s*bag\b/i, head: "Urine bag" },
  { match: /\b(cotton|gauze|bandage|crepe)\b/i, head: "Dressings" },
  { match: /\b(spirit|betadine|povidone|antiseptic)\b/i, head: "Antiseptics" },
  { match: /\b(oxygen)\s*(mask|tubing)?\b/i, head: "Oxygen masks & tubing" },
  { match: /\b(thermometer|bp\s*apparatus|stethoscope)\b/i, head: "Reusable instruments" },
];

export function listIMatch(label: string): string | null {
  for (const e of LIST_I) {
    if (e.match.test(label)) return e.head;
  }
  return null;
}

export function isListI(label: string): boolean {
  return listIMatch(label) !== null;
}
