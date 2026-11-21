# Kavach — Hospital Bill & Insurance Claim Copilot

**The bill is not the final word.**

Kavach is a mobile-first bill audit for the Indian discharge counter. You photograph the itemised hospital bill; Kavach reads every line, tests each rupee against IRDAI regulation and against your own policy schedule, and hands you a dispute letter that quotes the clause back — in English, Hindi or Kannada.

Built for **Fix My Itch Buildathon — Razorpay Rize × AILC**, Bengaluru, 21 Nov 2026.

> Addressing shortlist **#21 — "Why do hospitals hide procedure pricing from patients?"** (itch score 74.5, Healthtech) and **#10 — "Why don't people understand the insurance policies they buy?"** (itch score 82, FinTech).

---

## The problem, stated precisely

The itch isn't that bills are *high*. It's that nobody can tell **which rupees are lawful**. A family at the counter has twenty minutes and a piece of paper with forty line items. The TPA has already adjudicated. The deduction sheet says "non-payable" and everyone assumes it is.

Three things are true at once and only a rule engine can separate them:

1. Some deductions are **lawful** — you chose a deluxe room, your cap was ₹5,000, the ratio applies.
2. Some are **unlawful** — the same ratio applied to a pharmacy invoice, which has nothing to do with your room.
3. Some are **the hospital's conduct** — billing you for gloves and an "admission fee" that IRDAI's own circular says a facility absorbs.

A chatbot can produce a plausible paragraph about all three. It cannot produce the arithmetic. Kavach produces the arithmetic.

---

## What it does

| | |
|---|---|
| **Scan** | `<input type="file" accept="image/*" capture="environment">` → vision extraction of line items, with a deterministic fallback to editable sample lines when no key is configured. Never dead-ends. |
| **Audit** | A live rule engine: room-rent proportionate ratio, IRDAI List-I non-payables, consumables add-on, co-pay. Every clause moves the KPI cards and the doughnut in real time. |
| **Dispute** | A formal letter naming every rupee and every citation, in English / हिन्दी / ಕನ್ನಡ, with copy, WhatsApp share, read-aloud, and a print-to-PDF sheet. |
| **Desk mode** | A full-bleed screen you physically turn around and hold up at the billing counter. Three numbers, three rules, legible from a metre away. |
| **Dossier** | ₹49 "Certified TPA Dispute Dossier" through Razorpay test-mode checkout, with HMAC signature verification server-side. Falls back to a simulation when keys are absent. |

---

## The rule engine

This is the part that has to be right. `src/lib/engine.ts` is pure functions, no I/O, and every case reconciles to the rupee.

### 1. The proportionate ratio

```
ratio = min(1, allowedRoomRentPerDay / actualRoomRentPerDay)
```

Applied **only** to `room`, `surgeon`, `ot` — the categories whose price actually moves with room class. That list is `PROPORTIONATE_CATEGORIES` in `src/lib/types.ts`, not a hardcoded chain of ifs.

It is **never** applied to `pharmacy`, `implant`, `consumable`, `diagnostic`, `nursing`, `misc`. A powered stapler costs the hospital the same whether you slept in a deluxe room or a general ward; a strip of antibiotics does too. Any cut on those lines is raised as **Illegal proportionate cut**.

### 2. List-I non-payables

IRDAI's 2019 exclusion-standardisation circular puts admission/registration fees, gloves, syringes, needles, IV sets and similar in **List-I** — costs a facility absorbs as the cost of running itself. `src/lib/nonpayables.ts` is a deterministic keyword matcher (regex, not a model) so the same photograph always yields the same flags.

The **Consumables Cover Add-on** toggle simulates a policy that pays for them instead. Flip it and the hospital claim falls away and the insurer's share rises — live.

### 3. Reconciliation, not rounding

The four doughnut buckets are constructed so they sum to the bill in every slider configuration:

```
insurerActuallyPays + withheldUnlawfully + hospitalOverBilled + genuinelyYours === totalBilled
```

`audit.balanced` asserts it, and the Audit tab prints the equation. If it ever fails, the UI says so rather than showing a plausible-looking number.

### 4. What makes a flag credible

Every flag carries a `ruleId`, a full citation, a plain-English explanation, and **the sentence to say at the desk**. Nothing is raised without a rule in `src/lib/rules.ts`. The shortlist asks *"what makes a flag credible?"* — the answer is: it resolves to a numbered clause, and the arithmetic is shown.

---

## The three demo cases

Curated composites. Hospital, TPA and insurer names are **fictional**; the arithmetic and the violations are exact.

### A · Nandi Ridge Multispeciality, Bengaluru — laparoscopic appendectomy

| | |
|---|---|
| Billed | ₹2,48,500 |
| Room | ₹9,000/day against a ₹5,000 cap → ratio **55.6%** |
| TPA admitted | ₹1,44,444 |
| **Withheld without a clause** | **₹31,111** |

The TPA applied 55.6% to the ₹42,000 pharmacy line and the ₹28,000 surgical stapler. Both are fixed-cost. It also billed ₹8,500 of List-I to the patient.

### B · Vasai Creek Critical Care, Mumbai — dengue ICU, 4 days

| | |
|---|---|
| Billed | ₹1,64,200 |
| ICU | ₹11,000/day, inside the ₹12,000 cap — no ratio at all |
| TPA admitted | ₹1,37,700 |
| **Withheld without a clause** | **₹13,500** |

The Nimbus air bed runs four days. The schedule allows it once an ICU stay crosses three days. The TPA allowed day four and disallowed days one to three as a "non-payable consumable" — contradicting the exception in the schedule it administers.

### C · Lutyens Eye Institute, New Delhi — bilateral cataract with toric IOL

| | |
|---|---|
| Billed | ₹1,12,000 |
| TPA admitted | ₹56,500 |
| **Withheld without a clause** | **₹44,000** |

Both toric lenses were disallowed as a "consumable not covered". The policy carries no such exclusion. This is the **phantom clause** pattern — a deduction citing a clause that does not exist in the contract.

---

## Stack

- **Next.js 14** (App Router) · TypeScript strict
- **Tailwind CSS** with a hand-built token set — no component library
- **Recharts** for the doughnut, everything else hand-rolled SVG/CSS
- **lucide-react** icons
- **Razorpay** Orders API via `fetch` (no SDK) + HMAC-SHA256 signature verification
- **Gemini 2.0 Flash** or **GPT-4o-mini** for vision, both optional

No database. No auth. No tracking. A bill audit should not require an account.

---

## Run it

```bash
npm install
cp .env.example .env.local   # optional — every feature degrades gracefully
npm run dev
```

Open http://localhost:3000 on a phone, or use device emulation at 390×844.

### Environment

| Variable | Needed for | Without it |
|---|---|---|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Test-mode ₹49 checkout | Demo simulation button appears instead |
| `GEMINI_API_KEY` or `OPENAI_API_KEY` | Reading a photographed bill | Editable sample line items load |
| `NEXT_PUBLIC_SITE_URL` | Share links | Falls back to the current origin |

---

## Design

Warm ivory `#FAF9F6`, deep forest emerald `#0F5132`, vermilion `#DC2626` reserved *exclusively* for money taken without a clause, slate `#0F172A` text. Figures are JetBrains Mono and tabular so columns line up like a ledger. Headlines are Newsreader, because a bill is a document and this should read like one.

The whole thing is one 560px column with hairline rules and square corners — no shadow, no gradient, no glassmorphism. Every tap target is ≥44px. Zero horizontal overflow at 320px. `prefers-reduced-motion` kills all animation.

The visual argument is **the fixed-cost shield**: three bars shrink under the ratio, seven sit behind a lock. It explains the entire legal theory in about two seconds, which is what a demo needs.

---

## Limitations, stated plainly

- **Illustrative cases.** The three records are composites written to be arithmetically exact, not real patient data.
- **Citations are encoded, not fetched.** `src/lib/rules.ts` holds the rule text. A production build would re-validate against the IRDAI master circular on a schedule.
- **Not legal or medical advice.** Kavach produces a factual claim objection for you to send in your own name.
- **Translations.** Hindi and Kannada letters are drafted in-house and should be reviewed by a native speaker before being relied on for a real filing. Statutory citations deliberately stay in English.
- **Vision extraction is best-effort.** Every extracted figure is editable, and the arithmetic mismatch detector exists precisely because OCR will sometimes be wrong.

---

## The pitch, in one line

> Every other tool tells you your bill is expensive. Kavach tells you which rupees are illegal — and hands you the letter.

---

MIT licensed.
