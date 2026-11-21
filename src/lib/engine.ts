import {
  PROPORTIONATE_CATEGORIES,
  type Audit,
  type AuditedLine,
  type Bucket,
  type DemoCase,
  type Flag,
  type FlagKind,
  type LineItem,
} from "./types";
import { FLAG_META, RULES } from "./rules";

export type EngineOptions = {
  roomCapPerDay: number;
  coPayPct: number;
  /** Does the policy carry a consumables / List-I cover add-on? */
  consumablesCover: boolean;
};

const round = (n: number) => Math.round(n);

/** Ratio of eligible room rent to actual room rent, capped at 1. */
export function proportionateRatio(actualRent: number, cap: number): number {
  if (actualRent <= 0) return 1;
  if (cap <= 0) return 0;
  return Math.min(1, cap / actualRent);
}

function isProportioned(item: LineItem): boolean {
  return PROPORTIONATE_CATEGORIES.includes(item.category);
}

/** Rule-correct amount the insurer should admit for a single line. */
function idealFor(item: LineItem, ratio: number, opt: EngineOptions): number {
  if (isProportioned(item)) return round(item.amount * ratio);
  // Fixed-cost lines: the ratio never touches them.
  if (item.listI && !opt.consumablesCover) return 0;
  return item.amount;
}

/**
 * The adjudication the TPA actually performed, replayed from the bill data.
 * For proportioned lines the cut is lawful by construction; for every other
 * line whatever the TPA withheld beyond the rules is the recoverable gap.
 */
function illegalFor(item: LineItem, ideal: number, opt: EngineOptions): number {
  if (isProportioned(item)) return 0; // their cut tracks the ratio
  if (item.listI && !opt.consumablesCover) return 0; // lawful non-payable
  return Math.max(0, ideal - item.tpaAllowed);
}

export function auditCase(c: DemoCase, opts: EngineOptions): Audit {
  const ratio = proportionateRatio(c.roomRentPerDay, opts.roomCapPerDay);
  const coPay = Math.max(0, Math.min(0.9, opts.coPayPct / 100));

  const lines: AuditedLine[] = c.items.map((item) => {
    const idealAllowed = idealFor(item, ratio, opts);
    const illegalCut = illegalFor(item, idealAllowed, opts);
    const legalCut = Math.max(0, item.amount - idealAllowed);
    const insurerPays = round(idealAllowed * (1 - coPay));
    return {
      item,
      idealAllowed,
      tpaAllowed: item.tpaAllowed,
      legalCut,
      illegalCut,
      proportioned: isProportioned(item),
      insurerPays,
      patientPays: item.amount - insurerPays,
    };
  });

  const billed = lines.reduce((s, l) => s + l.item.amount, 0);
  const admissible = lines.reduce((s, l) => s + l.idealAllowed, 0);
  const idealInsurer = round(admissible * (1 - coPay));
  const coPayAmount = admissible - idealInsurer;

  const illegalGross = lines.reduce((s, l) => s + l.illegalCut, 0);
  const tpaRecovery = round(illegalGross * (1 - coPay));

  // List-I items the hospital should never have billed. When a consumables
  // add-on is in force the insurer absorbs them, so the patient's claim
  // against the hospital falls away.
  const hospitalRecovery = opts.consumablesCover
    ? 0
    : lines
        .filter((l) => l.item.listI)
        .reduce((s, l) => s + l.item.amount, 0);

  const insurerActual = Math.max(0, idealInsurer - tpaRecovery);
  const patientPays = billed - idealInsurer;
  const recoverable = tpaRecovery + hospitalRecovery;
  const genuinelyYours = billed - insurerActual - tpaRecovery - hospitalRecovery;

  const buckets: Bucket[] = [
    {
      key: "insurer",
      label: "Insurer pays",
      value: insurerActual,
      color: "#0F5132",
    },
    {
      key: "tpa",
      label: "Unlawfully withheld",
      value: tpaRecovery,
      color: "#DC2626",
    },
    {
      key: "hospital",
      label: "Hospital over-billed",
      value: hospitalRecovery,
      color: "#B45309",
    },
    {
      key: "lawful",
      label: "Genuinely yours",
      value: genuinelyYours,
      color: "#B9B4A6",
    },
  ];

  return {
    lines,
    billed,
    admissible,
    coPayAmount,
    insurerPays: idealInsurer,
    patientPays,
    legalCut: billed - admissible,
    illegalTotal: illegalGross,
    hospitalOvercharge: hospitalRecovery,
    recoverable,
    ratio,
    flags: buildFlags(c, lines, opts),
    buckets,
    balanced: buckets.reduce((s, b) => s + b.value, 0) === billed,
  };
}

/**
 * Turn the arithmetic into the findings a patient can actually act on.
 * Flags are anchored to the policy terms in force at adjudication — they do
 * not move when you drag a "what-if" slider.
 */
function buildFlags(c: DemoCase, lines: AuditedLine[], opts: EngineOptions): Flag[] {
  const flags: Flag[] = [];

  for (const l of lines) {
    if (l.illegalCut <= 0) continue;
    const it = l.item;
    const kind: FlagKind =
      it.expectation ??
      (it.category === "implant" && l.tpaAllowed === 0
        ? "whole_implant"
        : l.tpaAllowed === 0
          ? "phantom_clause"
          : "illegal_proportionate");

    const meta = FLAG_META[kind];
    const rule =
      kind === "icu_exception"
        ? RULES["ICU-01"]
        : kind === "whole_implant"
          ? RULES["IMP-01"]
          : kind === "phantom_clause"
            ? RULES["CLM-01"]
            : RULES["PROP-02"];

    flags.push({
      id: `${c.id}-${it.id}`,
      kind,
      itemId: it.id,
      title:
        kind === "illegal_proportionate"
          ? `${meta.label} on ${it.label}`
          : kind === "icu_exception"
            ? `${meta.label} — ${it.label}`
            : kind === "phantom_clause"
              ? `${meta.label} — ${it.label}`
              : `${meta.label} — ${it.label}`,
      amount: l.illegalCut,
      ruleId: rule.id,
      citation: rule.citation,
      plain: plainFor(kind, it, l.illegalCut, c),
      ask: askFor(kind, it, l.illegalCut),
      against: "tpa",
    });
  }

  // ── Hospital-side findings ─────────────────────────────────────────
  const listI = lines.filter((l) => l.item.listI);
  if (listI.length) {
    const total = listI.reduce((s, l) => s + l.item.amount, 0);
    flags.push({
      id: `${c.id}-listI`,
      kind: "list_i_billed",
      title: `List-I non-payables charged to the patient`,
      amount: total,
      ruleId: RULES["NP-01"].id,
      citation: RULES["NP-01"].citation,
      plain: `${moneyList(listI.map((l) => l.item.label))} appear on IRDAI's List-I — items a hospital absorbs as its own cost of running the facility. They were billed to you instead, and the TPA then deducted them as non-payable, so you paid for them twice over: once in the bill, and once by having no reimbursement.`,
      ask: `"These items are IRDAI List-I non-payables under the 27 August 2019 circular. Please reverse ₹${total.toLocaleString("en-IN")} from the bill."`,
      against: "hospital",
    });
  }

  // Arithmetic mismatches — quantity × rate must equal amount.
  for (const l of lines) {
    const expected = Math.round(l.item.qty * l.item.rate);
    if (Math.abs(expected - l.item.amount) >= 1) {
      flags.push({
        id: `${c.id}-${l.item.id}-arith`,
        kind: "arithmetic",
        itemId: l.item.id,
        title: `Arithmetic mismatch — ${l.item.label}`,
        amount: Math.abs(l.item.amount - expected),
        ruleId: RULES["ARITH-01"].id,
        citation: RULES["ARITH-01"].citation,
        plain: `The line reads ${l.item.qty} × ₹${l.item.rate.toLocaleString("en-IN")}, which is ₹${expected.toLocaleString("en-IN")}, but the amount charged is ₹${l.item.amount.toLocaleString("en-IN")}.`,
        ask: `"This line does not multiply out. Please correct it to ₹${expected.toLocaleString("en-IN")}."`,
        against: "hospital",
      });
    }
  }

  // Highest-value findings first.
  return flags.sort((a, b) => b.amount - a.amount);
}

function moneyList(items: string[]): string {
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

function plainFor(kind: FlagKind, it: LineItem, amount: number, c: DemoCase): string {
  const r = Math.round((1 - proportionateRatio(c.roomRentPerDay, c.policy.roomCapPerDay)) * 1000) / 10;
  switch (kind) {
    case "illegal_proportionate":
      return `The TPA applied the ${r}% room-rent ratio to ${it.label}. But ${it.label.toLowerCase()} is priced per unit of product — the invoice is identical whether you are in a deluxe room or a general ward. The ratio is lawful on room, surgeon and OT charges, and nowhere else. On this line it removed ₹${amount.toLocaleString("en-IN")} that had no basis.`;
    case "icu_exception":
      return `Your schedule allows pressure-relief (air) mattress charges once an ICU stay crosses three days. You were in ICU for ${c.icuDays} days. The TPA allowed a single day and disallowed the rest as a "non-payable consumable" — contradicting the exception in the schedule it is administering.`;
    case "phantom_clause":
      return `The TPA disallowed ${it.label} in full, citing an exclusion. Your policy schedule carries no such exclusion. A deduction has to point at a clause that exists; this one does not.`;
    case "whole_implant":
      return `${it.label} was disallowed as a "consumable". It is prosthesis — it is implanted and stays in the body. Even where a policy excludes the premium element of an implant, it cannot disallow the implant itself.`;
    default:
      return `₹${amount.toLocaleString("en-IN")} was withheld from this line without a rule that supports it.`;
  }
}

function askFor(kind: FlagKind, it: LineItem, amount: number): string {
  const amt = `₹${amount.toLocaleString("en-IN")}`;
  switch (kind) {
    case "illegal_proportionate":
      return `"The proportionate deduction applies only to room, surgeon and OT charges. Please restore ${amt} on ${it.label} — it is a fixed-cost line."`;
    case "icu_exception":
      return `"Clause 4.2 allows air-bed charges beyond three days of ICU. Please restore ${amt}."`;
    case "phantom_clause":
      return `"Please show me the clause you are deducting under. If it is not in my policy, restore ${amt}."`;
    case "whole_implant":
      return `"An IOL is an implant, not a consumable. Please restore ${amt}, or show the exclusion in my schedule."`;
    default:
      return `"Please restore ${amt} on ${it.label}."`;
  }
}

/** Sum check used by tests and by the UI's footer. */
export function integrityCheck(a: Audit): string[] {
  const problems: string[] = [];
  const sum = a.buckets.reduce((s, b) => s + b.value, 0);
  if (sum !== a.billed) problems.push(`buckets ${sum} != billed ${a.billed}`);
  if (a.buckets.some((b) => b.value < 0)) problems.push("negative bucket");
  const lineSum = a.lines.reduce((s, l) => s + l.item.amount, 0);
  if (lineSum !== a.billed) problems.push(`lines ${lineSum} != billed ${a.billed}`);
  return problems;
}
