import crypto from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Verify a Razorpay checkout signature: HMAC-SHA256 of
 * `${order_id}|${payment_id}` keyed with the account secret.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json(
      { verified: false, error: "RAZORPAY_KEY_SECRET not set" },
      { status: 400 },
    );
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ verified: false, error: "bad body" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { verified: false, error: "missing fields" },
      { status: 400 },
    );
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(razorpay_signature);
  const verified = a.length === b.length && crypto.timingSafeEqual(a, b);

  return NextResponse.json({ verified, paymentId: razorpay_payment_id });
}
