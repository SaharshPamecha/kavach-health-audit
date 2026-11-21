import type { Category, DemoCase, LineItem } from "./types";

const SAMPLE: Omit<LineItem, "id">[] = [
  {
    category: "room",
    label: "Room rent — private room",
    detail: "3 nights",
    qty: 3,
    rate: 7500,
    amount: 22500,
    tpaAllowed: 22500,
    confidence: 0.94,
  },
  {
    category: "surgeon",
    label: "Surgeon fee",
    qty: 1,
    rate: 48000,
    amount: 48000,
    tpaAllowed: 48000,
    confidence: 0.91,
  },
  {
    category: "ot",
    label: "Operation theatre charges",
    qty: 1,
    rate: 26000,
    amount: 26000,
    tpaAllowed: 26000,
    confidence: 0.9,
  },
  {
    category: "pharmacy",
    label: "Pharmacy & IV medicines",
    qty: 1,
    rate: 31200,
    amount: 31200,
    tpaAllowed: 31200,
    confidence: 0.86,
  },
  {
    category: "consumable",
    label: "Gloves, syringes, IV sets",
    qty: 1,
    rate: 7400,
    amount: 7400,
    tpaAllowed: 7400,
    listI: true,
    confidence: 0.83,
  },
  {
    category: "diagnostic",
    label: "CBC, LFT, ultrasound",
    qty: 1,
    rate: 11800,
    amount: 11800,
    tpaAllowed: 11800,
    confidence: 0.88,
  },
  {
    category: "nursing",
    label: "Nursing care",
    detail: "3 days",
    qty: 3,
    rate: 2200,
    amount: 6600,
    tpaAllowed: 6600,
    confidence: 0.9,
  },
  {
    category: "misc",
    label: "Admission & registration fees",
    qty: 1,
    rate: 1800,
    amount: 1800,
    tpaAllowed: 1800,
    listI: true,
    confidence: 0.79,
  },
];

export function sampleItems(): LineItem[] {
  return SAMPLE.map((s, i) => ({ ...s, id: `s${i + 1}` }));
}

/**
 * Wrap extracted line items into a case the rest of the app can audit.
 *
 * A photographed bill is a pre-claim document: there is no TPA adjudication
 * on file yet, so every line is marked as admitted in full. The engine then
 * surfaces hospital-side findings only (List-I, arithmetic) rather than
 * pretending to know what an insurer would have paid.
 */
export function caseFromScan(items: LineItem[], fileName?: string): DemoCase {
  const billedTotal = items.reduce((s, i) => s + i.amount, 0);
  const roomLine = items.find((i) => i.category === "room");
  const totalDays = roomLine?.qty ?? 0;

  const norm = items.map((i, idx) => ({
    ...i,
    id: i.id || `x${idx + 1}`,
    tpaAllowed: typeof i.tpaAllowed === "number" ? i.tpaAllowed : i.amount,
  }));

  return {
    id: "scan",
    slug: "scan",
    city: "Your bill",
    hospital: fileName ? cleanName(fileName) : "Photographed bill",
    procedure: `${norm.length} line items · pre-claim check`,
    patientName: "You",
    patientAge: 0,
    admission: "—",
    discharge: "—",
    roomCategory: roomLine?.label ?? "—",
    roomRentPerDay: roomLine?.rate ?? 0,
    icuDays: 0,
    days: totalDays,
    capType: roomLine ? "room" : "none",
    billedTotal,
    policy: {
      insurer: "Not on file",
      tpa: "Not on file",
      productName: "Pre-claim audit",
      policyNo: "—",
      claimNo: "DRAFT",
      sumInsured: 500000,
      roomCapPerDay: 5000,
      icuCapPerDay: 8000,
      coPayPct: 0,
      excludesPremiumImplant: false,
    },
    items: norm,
    hook: "Pre-claim check. No TPA adjudication is on file yet, so Kavach reports hospital-side findings and projects what a correct adjudication would look like.",
  };
}

function cleanName(fileName: string) {
  const base = fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
  return base.length > 2 ? base.slice(0, 48) : "Photographed bill";
}

export const CATEGORIES: Category[] = [
  "room",
  "surgeon",
  "ot",
  "nursing",
  "pharmacy",
  "implant",
  "consumable",
  "diagnostic",
  "misc",
];
