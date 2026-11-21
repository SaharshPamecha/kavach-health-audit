import { NextResponse } from "next/server";
import { sampleItems } from "@/lib/scan";
import { listIMatch } from "@/lib/nonpayables";
import type { Category, LineItem } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CATEGORIES: Category[] = [
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

const PROMPT = `You are reading a photograph of an Indian hospital bill.

Extract ONLY what is visibly printed. Do not invent a line, do not estimate a
price, and do not normalise a figure you cannot read — omit it instead.

Return a JSON array. Each element:
{
  "label": "short description as printed",
  "category": one of ["room","surgeon","ot","nursing","pharmacy","implant","consumable","diagnostic","misc"],
  "qty": number,
  "rate": number,
  "amount": number
}

Rules:
- amount is the line total in rupees, as printed.
- if quantity is not printed, use 1.
- if rate is not printed but amount and qty are, compute rate = amount / qty.
- strips commas and the rupee sign from numbers.
- category "implant" for lenses, stents, plates, screws, staplers, prosthesis.
- category "consumable" for gloves, syringes, IV sets, sutures, dressings.
- return [] if nothing is legible.

Return JSON only. No prose, no markdown fence.`;

type Raw = {
  label?: unknown;
  category?: unknown;
  qty?: unknown;
  rate?: unknown;
  amount?: unknown;
};

function normalise(raw: unknown): LineItem[] {
  if (!Array.isArray(raw)) return [];
  const out: LineItem[] = [];

  raw.slice(0, 40).forEach((r: Raw, i) => {
    const label = String(r?.label ?? "").trim();
    if (!label) return;

    const num = (v: unknown) => {
      const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };

    let qty = num(r.qty) || 1;
    if (qty <= 0 || qty > 999) qty = 1;
    let amount = num(r.amount);
    let rate = num(r.rate);
    if (!amount && rate) amount = rate * qty;
    if (amount && !rate) rate = amount / qty;
    if (!amount || amount <= 0) return;
    if (amount > 5000000) return;

    const cat = (CATEGORIES as string[]).includes(String(r.category))
      ? (r.category as Category)
      : guessCategory(label);

    out.push({
      id: `v${i + 1}`,
      label: label.slice(0, 90),
      category: cat,
      qty: Math.round(qty * 100) / 100,
      rate: Math.round(rate * 100) / 100,
      amount: Math.round(amount),
      listI: listIMatch(label) !== null,
      tpaAllowed: Math.round(amount),
      confidence: 0.9,
    });
  });

  return out;
}

const HINTS: [RegExp, Category][] = [
  [/room|bed|icu|ward|occupancy/i, "room"],
  [/surgeon|surge|surgeon'?s fee|consultant/i, "surgeon"],
  [/o\.?t\.?|theatre|operation/i, "ot"],
  [/nursing|nurse/i, "nursing"],
  [/pharmacy|medicine|drug|injection|tablet|iv fluid/i, "pharmacy"],
  [/lens|implant|stent|prosthe|plate|screw|stapler|iol/i, "implant"],
  [/glove|syringe|needle|consumable|suture|dressing|iv set/i, "consumable"],
  [/lab|test|scan|x-?ray|ultra|pathology|biometry|oct|cbc/i, "diagnostic"],
];

function guessCategory(label: string): Category {
  for (const [re, cat] of HINTS) if (re.test(label)) return cat;
  return "misc";
}

function parseJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) return null;
  const slice = cleaned.slice(start);
  try {
    return JSON.parse(slice);
  } catch {
    const end = slice.lastIndexOf("]");
    if (end > 0) {
      try {
        return JSON.parse(slice.slice(0, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function withGemini(key: string, dataUrl: string): Promise<LineItem[] | null> {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  const [, mime, b64] = m;
  const model = process.env.VISION_MODEL || "gemini-2.0-flash";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mime, data: b64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 4096 },
      }),
      cache: "no-store",
    },
  );

  if (!res.ok) return null;
  const json = await res.json();
  const text: string =
    json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ??
    "";
  if (!text) return null;
  const parsed = parseJson(text);
  return normalise(Array.isArray(parsed) ? parsed : (parsed as { items?: unknown })?.items);
}

async function withOpenAI(key: string, dataUrl: string): Promise<LineItem[] | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = await res.json();
  const text: string = json?.choices?.[0]?.message?.content ?? "";
  const parsed = parseJson(text);
  return normalise(Array.isArray(parsed) ? parsed : (parsed as { items?: unknown })?.items);
}

export async function POST(req: Request) {
  let image: string | null = null;
  try {
    const body = await req.json();
    image = typeof body?.image === "string" ? body.image : null;
  } catch {
    /* no body */
  }

  if (!image) {
    return NextResponse.json({
      items: sampleItems(),
      source: "sample",
      note: "No image supplied — sample line items.",
    });
  }

  const gemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openai = process.env.OPENAI_API_KEY;

  if (gemini) {
    try {
      const items = await withGemini(gemini, image);
      if (items?.length) return NextResponse.json({ items, source: "gemini" });
    } catch {
      /* fall through */
    }
  }

  if (openai) {
    try {
      const items = await withOpenAI(openai, image);
      if (items?.length) return NextResponse.json({ items, source: "openai" });
    } catch {
      /* fall through */
    }
  }

  return NextResponse.json({
    items: sampleItems(),
    source: "sample",
    note: gemini || openai
      ? "The model could not read this image. Sample line items loaded — edit any figure."
      : "No vision key configured. Sample line items loaded — edit any figure.",
  });
}
