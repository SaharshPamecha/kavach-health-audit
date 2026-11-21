import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Create a Razorpay order for the ₹49 Certified Dossier.
 *
 * Deliberately SDK-free: one Basic-auth POST to Razorpay's orders endpoint.
 * When the keys are absent the route reports `configured: false` so the
 * client can fall back to the simulation path instead of dead-ending.
 */
export async function POST(req: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ configured: false });
  }

  let body: { caseRef?: string; amount?: number } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }

  const amount = Math.min(Math.max(Number(body.amount) || 4900, 100), 100000);
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `kavach_${Date.now()}`,
        notes: {
          product: "Clause-linked TPA Dispute Dossier",
          case_ref: body.caseRef ?? "UNKNOWN",
        },
      }),
      cache: "no-store",
    });

    const order = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          configured: true,
          error:
            order?.error?.description ??
            "Razorpay rejected the order — check that the keys are test-mode keys.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      configured: true,
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch {
    return NextResponse.json(
      { configured: true, error: "Could not reach Razorpay." },
      { status: 502 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(
      process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
    ),
  });
}
